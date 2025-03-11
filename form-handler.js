import { db } from "./firebase-config.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { initAutocompleteFor } from "./maps-config.js";

const multiStepContainer = document.getElementById("multiStepContainer");
const backBtn = document.getElementById("backBtn");
const nextBtn = document.getElementById("nextBtn");
const previewBtn = document.getElementById("previewBtn");
const submitBtn = document.getElementById("submitBtn");
const progressBarEl = document.querySelector("#progressBar .progress");

// Data from old questions.json (inbound/outbound, existing, etc.)
let questionsData = null;
// Map of service -> JSON path
let servicesIndex = null;

let step = 1;   // 1..4
let answers = {};
const totalSteps = 5; // step=1..4 + optional step2.5

// Which services user selected for New Project
let chosenServices = [];

// 1) Load old questions + services index
fetch("./questions.json")
  .then(r=>r.json())
  .then(data => {
    questionsData = data;
    // default inbound
    answers.flow_type = "Inbound";
    // next load services-index
    return fetch("./data/services-index.json");
  })
  .then(r => r.json())
  .then(indexData => {
    servicesIndex = indexData;
    console.log("Loaded servicesIndex:", servicesIndex);
    renderStep(step);
  })
  .catch(err=>{
    console.error("Failed to load JSONs:", err);
    multiStepContainer.innerHTML = "<p class='alert'>Failed to load required JSON files</p>";
  });

function renderStep(stepIndex) {
  multiStepContainer.innerHTML = "";

  backBtn.style.display    = (stepIndex>1) ? "inline-block":"none";
  nextBtn.style.display    = (stepIndex<3) ? "inline-block":"none"; 
  previewBtn.style.display = (stepIndex===3) ? "inline-block":"none"; 
  submitBtn.style.display  = (stepIndex===4) ? "inline-block":"none";

  updateProgress(stepIndex);

  let toRender = [];

  if (stepIndex===1) {
    // inbound/outbound logic
    if (answers.flow_type==="Inbound") {
      toRender = questionsData.step1_inbound;
    } else {
      toRender = questionsData.step1_outbound;
    }
    renderQuestionArray(toRender, multiStepContainer);

    // add Switch to Outbound if inbound
    if (answers.flow_type==="Inbound") {
      const switchBtn = document.createElement("button");
      switchBtn.textContent = "Switch to Outbound?";
      switchBtn.style.marginTop="20px";
      switchBtn.onclick = () => {
        answers.flow_type="Outbound";
        renderStep(1);
      };
      multiStepContainer.appendChild(switchBtn);
    }

  } else if (stepIndex===2) {
    // if inbound => check call_type
    if (answers.flow_type==="Inbound") {
      const ctype = answers.call_type_ctm || "";
      switch(ctype) {
        case "New Project":
          // Instead of old step2_newProject, we do dynamic services
          renderNewProjectServiceChoice();
          return;
        case "Existing Project":
          toRender = questionsData.step2_existing;
          break;
        case "Vendor":
          toRender = questionsData.step2_vendor;
          break;
        case "Technician":
          toRender = questionsData.step2_technician;
          break;
        case "Complaint":
          toRender = questionsData.step2_complaint;
          break;
        case "Promotion/Spam":
          multiStepContainer.innerHTML = `<div class="alert">Marked as Spam. No more details needed.</div>`;
          return;
        case "HR Inquiry":
          toRender = questionsData.step2_hr;
          break;
        case "Unknown":
          toRender = questionsData.step2_unknown;
          break;
        default:
          multiStepContainer.innerHTML = "<p>Please select call type (in Step1).</p>";
          return;
      }
      renderQuestionArray(toRender, multiStepContainer);

    } else {
      // Outbound => step3_outbound
      toRender = questionsData.step3_outbound;
      renderQuestionArray(toRender, multiStepContainer);
    }

  } else if (stepIndex===25) {
    // advanced sales
    toRender = questionsData.step2p5_salesAdvanced || [];
    renderQuestionArray(toRender, multiStepContainer);

  } else if (stepIndex===3) {
    // preview
    toRender = questionsData.stepPreview;
    renderQuestionArray(toRender, multiStepContainer);

  } else if (stepIndex===4) {
    // final
    toRender = questionsData.stepFinal;
    renderQuestionArray(toRender, multiStepContainer);
  }

  // google maps for event_street_ctm?
  const streetInput = multiStepContainer.querySelector("[name='event_street_ctm']");
  if (streetInput) {
    initAutocompleteFor(streetInput);
  }
}

// -------------- RENDER QUESTIONS (old approach) --------------
function renderQuestionArray(arr, parent) {
  arr.forEach(q => {
    const block = document.createElement("div");
    block.className="question-block";

    if (q.label) {
      const lab = document.createElement("label");
      lab.textContent = q.label;
      block.appendChild(lab);
    }
    if (q.name==="_summary_") {
      block.innerHTML += generatePreviewHtml();
      parent.appendChild(block);
      return;
    }

    let el=null;
    switch(q.type){
      case "text":
      case "date":
      case "email":
        el = document.createElement("input");
        el.type = q.type;
        el.name = q.name;
        el.value = answers[q.name]||"";
        break;
      case "textarea":
        el = document.createElement("textarea");
        el.name = q.name;
        el.rows=3;
        el.value = answers[q.name]||"";
        break;
      case "select":
        el = document.createElement("select");
        el.name = q.name;
        if (!q.multi) {
          const optEmpty = document.createElement("option");
          optEmpty.value="";
          optEmpty.textContent="-- select --";
          el.appendChild(optEmpty);
        }
        q.options.forEach(opt=>{
          const opEl = document.createElement("option");
          opEl.value=opt;
          opEl.textContent=opt;
          if (q.multi && Array.isArray(answers[q.name]) && answers[q.name].includes(opt)) {
            opEl.selected=true;
          } else if(!q.multi && answers[q.name]===opt){
            opEl.selected=true;
          }
          el.appendChild(opEl);
        });
        if (q.multi) el.multiple=true;
        break;
      default:
        block.innerHTML += `<p style='color:red;'>Unsupported type: ${q.type}</p>`;
    }

    if (el) block.appendChild(el);
    parent.appendChild(block);
  });
}

// -------------- NEW PROJECT => CHOOSE SERVICES --------------
function renderNewProjectServiceChoice() {
  multiStepContainer.innerHTML = `
    <h3>New Project - Services</h3>
    <p>Please select which services the client wants:</p>
    <div id="serviceChoices">
      <label><input type="checkbox" name="svc" value="liveBand"> Live Band</label><br>
      <label><input type="checkbox" name="svc" value="stageRental"> Stage Rental</label><br>
      <label><input type="checkbox" name="svc" value="karaoke"> Karaoke</label><br>
      <label><input type="checkbox" name="svc" value="ledScreen"> LED Screen</label><br>
      <label><input type="checkbox" name="svc" value="audio"> Audio</label><br>
      <label><input type="checkbox" name="svc" value="tvRental"> TV Rental</label><br>
      <label><input type="checkbox" name="svc" value="stepRepeat"> Step & Repeat / Red Carpet</label><br>
      <label><input type="checkbox" name="svc" value="trussRental"> Truss Rental</label><br>
      <label><input type="checkbox" name="svc" value="pipeDrape"> Pipe & Drape</label><br>
    </div>
    <button id="svcNextBtn">Load Service Questions</button>
  `;
  const btn = document.getElementById("svcNextBtn");
  btn.addEventListener("click", () => {
    // gather checked
    const checks = multiStepContainer.querySelectorAll("input[name='svc']:checked");
    chosenServices = Array.from(checks).map(c=>c.value);
    renderServicesQuestions();
  });
}

// -------------- RENDER SELECTED SERVICES QUESTIONS --------------
async function renderServicesQuestions() {
  multiStepContainer.innerHTML = `
    <h3>Service Details</h3>
    <div id="servicesContainer"></div>
    <button id="goToStep3Btn">Next (Logistics)</button>
  `;
  const svcParent = document.getElementById("servicesContainer");

  for (let svc of chosenServices) {
    const url = servicesIndex[svc];
    if (!url) {
      const p = document.createElement("p");
      p.textContent = `No JSON for service: ${svc}`;
      svcParent.appendChild(p);
      continue;
    }
    try {
      const resp = await fetch(url);
      const serviceQuestions = await resp.json();
      const h4 = document.createElement("h4");
      h4.textContent = `=== ${svc} ===`;
      svcParent.appendChild(h4);

      serviceQuestions.forEach(q => {
        renderServiceQ(q, svcParent);
      });
    } catch(e) {
      console.error("Error loading", url, e);
      const ep = document.createElement("p");
      ep.textContent = `Error loading service file for ${svc}`;
      svcParent.appendChild(ep);
    }
  }

  document.getElementById("goToStep3Btn").addEventListener("click", () => {
    collectAnswers();
    // Now go step3
    step=3;
    renderStep(step);
  });
}

// RENDER single question from a service JSON
function renderServiceQ(q, parentEl) {
  const block = document.createElement("div");
  block.className="question-block";
  if (q.type==="label") {
    const p = document.createElement("p");
    p.innerHTML = `<strong>${q.id||""}:</strong> ${q.text}`;
    block.appendChild(p);
  }
  else if (q.type==="text" || q.type==="date" || q.type==="email" || q.type==="number") {
    const lbl = document.createElement("label");
    lbl.innerHTML = `<strong>${q.id||""}</strong> ${q.label||""}`;
    block.appendChild(lbl);
    const inp = document.createElement("input");
    inp.type = q.type;
    inp.name = q.name;
    block.appendChild(inp);
  }
  else if (q.type==="checkbox") {
    const p = document.createElement("p");
    p.innerHTML = `<strong>${q.id||""}:</strong> ${q.label||""}`;
    block.appendChild(p);
    q.options.forEach(opt => {
      const l = document.createElement("label");
      const c = document.createElement("input");
      c.type="checkbox";
      c.name=q.name; 
      c.value=opt;
      l.appendChild(c);
      l.appendChild(document.createTextNode(opt));
      block.appendChild(l);
      block.appendChild(document.createElement("br"));
    });
  }
  else if (q.type==="checkbox-multi") {
    const p = document.createElement("p");
    p.innerHTML = `<strong>${q.id||""}:</strong> ${q.label||""}`;
    block.appendChild(p);
    q.options.forEach(opt => {
      const l = document.createElement("label");
      const c = document.createElement("input");
      c.type="checkbox";
      c.name = q.name+"[]";
      c.value=opt;
      l.appendChild(c);
      l.appendChild(document.createTextNode(opt));
      block.appendChild(l);
      block.appendChild(document.createElement("br"));
    });
  }
  else if (q.type==="select") {
    const p = document.createElement("p");
    p.innerHTML = `<strong>${q.id||""}:</strong> ${q.label||""}`;
    block.appendChild(p);
    const sel = document.createElement("select");
    sel.name = q.name;
    if (!q.multi) {
      const emptyOp = document.createElement("option");
      emptyOp.value="";
      emptyOp.textContent="-- select --";
      sel.appendChild(emptyOp);
    }
    q.options.forEach(opt => {
      const oEl = document.createElement("option");
      oEl.value=opt;
      oEl.textContent=opt;
      sel.appendChild(oEl);
    });
    if (q.multi) sel.multiple=true;
    block.appendChild(sel);
  }
  else if (q.type==="conditional") {
    // we just render sub-blocks
    if (q.blocks) {
      q.blocks.forEach(subQ => {
        renderServiceQ(subQ, block);
      });
    }
  }
  else {
    const warn = document.createElement("p");
    warn.style.color="red";
    warn.textContent = `Unsupported type: ${q.type}`;
    block.appendChild(warn);
  }
  parentEl.appendChild(block);
}

// -------------- Utility --------------
function collectAnswers() {
  const els = multiStepContainer.querySelectorAll("input, select, textarea");
  els.forEach(el => {
    if (!el.name) return;
    if (el.name.endsWith("[]")) {
      // multi
      const baseName = el.name.slice(0, -2);
      answers[baseName] = answers[baseName] || [];
      if (el.checked) {
        answers[baseName].push(el.value);
      }
    }
    else if (el.type==="checkbox") {
      // single group approach
      if (el.checked) {
        if (!answers[el.name]) answers[el.name]=[];
        answers[el.name].push(el.value);
      }
    }
    else {
      answers[el.name] = el.value;
    }
  });
}

function validateStep(stepIndex) {
  // minimal checks
  if (stepIndex===1 && answers.flow_type==="Inbound") {
    const nm = getValue("contact_name");
    if (!nm) {
      alert("Client Name is required for inbound calls!");
      return false;
    }
  }
  return true;
}

function getValue(nm) {
  const el = multiStepContainer.querySelector(`[name='${nm}']`);
  if (!el) return "";
  if (el.multiple) {
    return Array.from(el.selectedOptions).map(o=>o.value);
  }
  return el.value;
}

function generatePreviewHtml() {
  let html = "<ul>";
  for (let [k,v] of Object.entries(answers)) {
    if (Array.isArray(v)) {
      html += `<li><strong>${k}</strong>: ${v.join(", ")}</li>`;
    } else {
      html += `<li><strong>${k}</strong>: ${v}</li>`;
    }
  }
  html += "</ul>";
  return html;
}

function updateProgress(st) {
  const pct = Math.round(((st-1)/(4-1))*100);
  if (progressBarEl) {
    progressBarEl.style.width = pct + "%";
  }
}
