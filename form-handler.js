import { db } from "./firebase-config.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { initAutocompleteFor } from "./maps-config.js";

const multiStepContainer = document.getElementById("multiStepContainer");
const backBtn = document.getElementById("backBtn");
const nextBtn = document.getElementById("nextBtn");
const previewBtn = document.getElementById("previewBtn");
const submitBtn = document.getElementById("submitBtn");
const progressBarEl = document.querySelector("#progressBar .progress");

let questionsData = null;   // from questions.json
let servicesIndex = null;   // from data/services-index.json
let step = 1; 
let answers = {};
const totalSteps = 5;

let chosenServices = [];

// 1) Load questions + services index
fetch("./questions.json")
  .then(r=>r.json())
  .then(data => {
    questionsData = data;
    answers.flow_type = "Inbound"; 
    return fetch("./data/services-index.json");
  })
  .then(r => r.json())
  .then(idx => {
    servicesIndex = idx;
    console.log("Loaded servicesIndex:", servicesIndex);
    renderStep(step);
  })
  .catch(err => {
    console.error("Error loading JSON:", err);
    multiStepContainer.innerHTML = "<p class='alert'>Failed to load JSON</p>";
  });

function renderStep(stepIndex) {
  multiStepContainer.innerHTML = "";
  backBtn.style.display    = (stepIndex>1) ? "inline-block":"none";
  nextBtn.style.display    = (stepIndex<3) ? "inline-block":"none";
  previewBtn.style.display = (stepIndex===3) ? "inline-block":"none";
  submitBtn.style.display  = (stepIndex===4) ? "inline-block":"none";

  updateProgress(stepIndex);

  if (stepIndex===1) {
    // Step1 inbound/outbound
    if (answers.flow_type==="Inbound") {
      renderQuestionArray(questionsData.step1_inbound, multiStepContainer);
      // Switch button
      const switchBtn = document.createElement("button");
      switchBtn.textContent = "Switch to Outbound?";
      switchBtn.style.marginTop="20px";
      switchBtn.onclick = () => {
        answers.flow_type = "Outbound";
        renderStep(1);
      };
      multiStepContainer.appendChild(switchBtn);
    } else {
      // Outbound
      renderQuestionArray(questionsData.step1_outbound, multiStepContainer);
    }

  } else if (stepIndex===2) {
    // Step2 inbound => depends on call_type
    if (answers.flow_type==="Inbound") {
      const ctype = answers.call_type_ctm || "";
      if (!ctype) {
        multiStepContainer.innerHTML = "<div class='alert'>Please select call type (New Project, etc.) in step1</div>";
        return;
      }
      switch(ctype) {
        case "New Project":
          // Show old step2_newProject (date, address, etc.), THEN a button => renderNewProjectServiceChoice
          renderNewProjectBase();
          return;  // done
        case "Existing Project":
          renderQuestionArray(questionsData.step2_existing, multiStepContainer);
          break;
        case "Vendor":
          renderQuestionArray(questionsData.step2_vendor, multiStepContainer);
          break;
        case "Technician":
          renderQuestionArray(questionsData.step2_technician, multiStepContainer);
          break;
        case "Complaint":
          renderQuestionArray(questionsData.step2_complaint, multiStepContainer);
          break;
        case "Promotion/Spam":
          multiStepContainer.innerHTML = "<div class='alert'>Marked as spam. No more details needed.</div>";
          return;
        case "HR Inquiry":
          renderQuestionArray(questionsData.step2_hr, multiStepContainer);
          break;
        case "Unknown":
          renderQuestionArray(questionsData.step2_unknown, multiStepContainer);
          break;
        default:
          multiStepContainer.innerHTML = "<p>No such call type. Please pick in Step1.</p>";
          return;
      }

    } else {
      // outbound => step3_outbound
      renderQuestionArray(questionsData.step3_outbound, multiStepContainer);
    }

    // Example: "Qualify Now" button
    const qBtn = document.createElement("button");
    qBtn.textContent = "Qualify Now";
    qBtn.style.marginTop = "20px";
    qBtn.onclick = () => {
      answers["qualification_ctm"] = "Qualified";
      alert("Marked as Qualified!");
    };
    multiStepContainer.appendChild(qBtn);

  } else if (stepIndex===25) {
    // advanced sales
    renderQuestionArray(questionsData.step2p5_salesAdvanced||[], multiStepContainer);

  } else if (stepIndex===3) {
    // preview
    renderQuestionArray(questionsData.stepPreview, multiStepContainer);

  } else if (stepIndex===4) {
    // final
    renderQuestionArray(questionsData.stepFinal, multiStepContainer);
  }

  const streetInput = multiStepContainer.querySelector("[name='event_street_ctm']");
  if (streetInput) initAutocompleteFor(streetInput);
}

// ---------- NEW PROJECT BASE (Event Date, Address, etc.) -----------
function renderNewProjectBase() {
  // Render old "step2_newProject" from questionsData
  renderQuestionArray(questionsData.step2_newProject, multiStepContainer);

  // Then add a button "Proceed to Select Services"
  const btn = document.createElement("button");
  btn.textContent = "Next step → Select Services";
  btn.style.marginTop = "20px";
  btn.onclick = () => {
    collectAnswers();
    // now show services
    renderNewProjectServiceChoice();
  };
  multiStepContainer.appendChild(btn);
}

// ---------- AFTER THAT, show multi-check services -----------
function renderNewProjectServiceChoice() {
  multiStepContainer.innerHTML = `
    <h3>New Project - Services</h3>
    <p>Select which services the client wants. Then click "Load Service Questions".</p>
    <div class="question-block">
      <label><input type="checkbox" name="svc" value="liveBand"> Live Band</label><br/>
      <label><input type="checkbox" name="svc" value="stageRental"> Stage Rental</label><br/>
      <label><input type="checkbox" name="svc" value="karaoke"> Karaoke</label><br/>
      <label><input type="checkbox" name="svc" value="ledScreen"> LED Screen</label><br/>
      <label><input type="checkbox" name="svc" value="audio"> Audio</label><br/>
      <label><input type="checkbox" name="svc" value="tvRental"> TV Rental</label><br/>
      <label><input type="checkbox" name="svc" value="stepRepeat"> Step & Repeat / Red Carpet</label><br/>
      <label><input type="checkbox" name="svc" value="trussRental"> Truss Rental</label><br/>
      <label><input type="checkbox" name="svc" value="pipeDrape"> Pipe & Drape</label><br/>
    </div>
    <button id="svcNextBtn">Load Service Questions</button>
  `;
  const b = document.getElementById("svcNextBtn");
  b.addEventListener("click", () => {
    const checks = multiStepContainer.querySelectorAll("input[name='svc']:checked");
    chosenServices = Array.from(checks).map(c=>c.value);
    renderServicesQuestions();
  });
}

// ---------- RENDER the chosen service JSONs -----------
async function renderServicesQuestions() {
  multiStepContainer.innerHTML = `
    <h3>Service Details</h3>
    <div id="servicesContainer"></div>
    <button id="goToStep3Btn">Next (Logistics / Step3)</button>
  `;
  const svcParent = document.getElementById("servicesContainer");

  for (let svc of chosenServices) {
    const url = servicesIndex[svc];
    if (!url) {
      const p = document.createElement("p");
      p.style.color = "red";
      p.textContent = `No JSON for service: ${svc}`;
      svcParent.appendChild(p);
      continue;
    }
    try {
      const resp = await fetch(url);
      const arr = await resp.json();
      const h4 = document.createElement("h4");
      h4.textContent = `=== ${svc} ===`;
      svcParent.appendChild(h4);

      arr.forEach(q => {
        renderServiceQ(q, svcParent);
      });
    } catch(e) {
      console.error("Error loading", url, e);
      const p = document.createElement("p");
      p.style.color="red";
      p.textContent = `Error loading ${svc}`;
      svcParent.appendChild(p);
    }
  }

  document.getElementById("goToStep3Btn").addEventListener("click", () => {
    collectAnswers();
    step=3; // go to preview or logistics
    renderStep(step);
  });
}

// ---------- RENDER a single question from service JSON -----------
function renderServiceQ(q, parentEl) {
  const block = document.createElement("div");
  block.className = "question-block";

  if (q.type==="label") {
    const p = document.createElement("p");
    p.innerHTML = `<strong>${q.id||""}:</strong> ${q.text}`;
    block.appendChild(p);
  }
  else if (["text","date","email","number"].includes(q.type)) {
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
    block.appendChild(sel);
  }
  else if (q.type==="conditional") {
    // if there's sub-blocks
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

// ---------- COLLECT / VALIDATE ----------
function collectAnswers() {
  const els = multiStepContainer.querySelectorAll("input, select, textarea");
  els.forEach(el => {
    if (!el.name) return;
    if (el.name.endsWith("[]")) {
      const base = el.name.slice(0, -2);
      answers[base] = answers[base]||[];
      if (el.checked) answers[base].push(el.value);
    }
    else if (el.type==="checkbox") {
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

function validateStep(st) {
  if (st===1 && answers.flow_type==="Inbound") {
    const nm = getValue("contact_name");
    if (!nm) {
      alert("Client Name is required for inbound calls!");
      return false;
    }
  }
  return true;
}

function getValue(n) {
  const el = multiStepContainer.querySelector(`[name='${n}']`);
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
      html += `<li><strong>${k}:</strong> ${v.join(", ")}</li>`;
    } else {
      html += `<li><strong>${k}:</strong> ${v}</li>`;
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

// nav
backBtn.addEventListener("click", () => {
  collectAnswers();
  if (step===25) {
    step=2;
  } else {
    step--;
    if (step<1) step=1;
  }
  renderStep(step);
});
nextBtn.addEventListener("click", () => {
  if (!validateStep(step)) return;
  collectAnswers();
  if (step===2 && answers.flow_type==="Inbound" && answers.call_type_ctm==="New Project") {
    // after finishing base Q => advanced
    step=25;
    renderStep(step);
    return;
  }
  step++;
  if (step>4) step=4;
  renderStep(step);
});
previewBtn.addEventListener("click", () => {
  collectAnswers();
  step=3;
  renderStep(step);
});
submitBtn.addEventListener("click", onSubmit);

function onSubmit() {
  if (!validateStep(step)) return;
  collectAnswers();
  const q = answers["qualification_ctm"];
  if (!q || q==="") {
    alert("Please select final qualification (or use 'Qualify Now').");
    return;
  }
  console.log("FINAL =>", answers);
  addDoc(collection(db, "responses"), answers)
    .then(docRef => {
      alert("Saved with ID: "+docRef.id);
      // location.reload();
    })
    .catch(err => {
      alert("Error saving: "+ err);
    });
}
