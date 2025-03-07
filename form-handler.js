import { db } from "./firebase-config.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { initAutocompleteFor } from "./maps-config.js";

const multiStepContainer = document.getElementById("multiStepContainer");
const backBtn = document.getElementById("backBtn");
const nextBtn = document.getElementById("nextBtn");
const previewBtn = document.getElementById("previewBtn");
const submitBtn = document.getElementById("submitBtn");
const progressBarEl = document.querySelector("#progressBar .progress");

let questionsData = null;
let step = 1; // 1..4
let answers = {};
const totalSteps = 5; // step1, step2, step2.5(=2.5?), step3, step4? (или можно иначе)

// 1) Load questions
fetch("./questions.json")
  .then(r=>r.json())
  .then(data => {
    questionsData = data;
    // По умолчанию inbound
    answers.flow_type = "Inbound";
    renderStep(step);
  })
  .catch(err=>{
    console.error("Failed to load questions.json:", err);
    multiStepContainer.innerHTML = "<p class='alert'>Failed to load questions.json</p>";
  });

function renderStep(stepIndex) {
  multiStepContainer.innerHTML = "";

  // Manage buttons
  backBtn.style.display    = (stepIndex>1) ? "inline-block":"none";
  nextBtn.style.display    = (stepIndex<3) ? "inline-block":"none"; // 1..2
  previewBtn.style.display = (stepIndex===3) ? "inline-block":"none"; // step=3
  submitBtn.style.display  = (stepIndex===4) ? "inline-block":"none";

  updateProgress(stepIndex);

  let toRender = [];
  if (!questionsData) return;

  switch(stepIndex) {
    case 1:
      // Step1 inbound or outbound
      if (answers.flow_type==="Inbound") {
        toRender = questionsData.step1_inbound;
      } else {
        toRender = questionsData.step1_outbound;
      }
      break;
    case 2:
      // Step2
      if (answers.flow_type==="Inbound") {
        const ctype = answers.call_type_ctm || "";
        switch(ctype) {
          case "New Project":
            toRender = questionsData.step2_newProject;
            break;
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
            multiStepContainer.innerHTML = "<p>Please select call type.</p>";
            return;
        }
      } else {
        // Outbound => step3_outbound
        toRender = questionsData.step3_outbound;
      }
      break;
    case 25:
      // "Step2.5" for advanced sales after newProject
      toRender = questionsData.step2p5_salesAdvanced || [];
      break;
    case 3:
      // Preview
      toRender = questionsData.stepPreview;
      break;
    case 4:
      toRender = questionsData.stepFinal;
      break;
    default:
      // no
  }

  toRender.forEach(q => {
    const block = document.createElement("div");
    block.className="question-block";

    if (q.label) {
      const lab = document.createElement("label");
      lab.textContent = q.label;
      block.appendChild(lab);
    }

    if (q.name==="_summary_") {
      // preview
      block.innerHTML += generatePreviewHtml();
      multiStepContainer.appendChild(block);
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
          // add empty
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
    multiStepContainer.appendChild(block);
  });

  // Если step1 inbound, добавляем кнопку Switch to Outbound
  if (stepIndex===1 && answers.flow_type==="Inbound") {
    const switchBtn = document.createElement("button");
    switchBtn.textContent = "Switch to Outbound?";
    switchBtn.style.marginTop="20px";
    switchBtn.onclick = () => {
      answers.flow_type="Outbound";
      renderStep(1);
    };
    multiStepContainer.appendChild(switchBtn);
  }

  // Подключим Google Maps к "event_street_ctm"
  const streetInput = multiStepContainer.querySelector("[name='event_street_ctm']");
  if (streetInput) {
    initAutocompleteFor(streetInput);
  }
}

function generatePreviewHtml() {
  let html="<ul>";
  for (let [k,v] of Object.entries(answers)) {
    if (Array.isArray(v)) {
      html += `<li><strong>${k}</strong>: ${v.join(", ")}</li>`;
    } else {
      html += `<li><strong>${k}</strong>: ${v}</li>`;
    }
  }
  html+="</ul>";
  return html;
}

backBtn.addEventListener("click", () => {
  collectAnswers();
  // если step2.5 => return to step2
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
  // если step2 + call_type=New Project => go step2.5
  if (step===2 && answers.flow_type==="Inbound" && answers.call_type_ctm==="New Project") {
    // after we fill newProject => advanced sales
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
    alert("Please select final qualification!");
    return;
  }
  // Save to Firestore
  console.log("FINAL =>",answers);
  addDoc(collection(db,"responses"), answers)
    .then(docRef=>{
      alert("Saved with ID:"+docRef.id);
      // reset?
      // location.reload();
    })
    .catch(err=>{
      alert("Error saving: "+ err);
    });
}

function collectAnswers() {
  const els = multiStepContainer.querySelectorAll("input, select, textarea");
  els.forEach(el=>{
    if (!el.name) return;
    if (el.multiple) {
      const arr = Array.from(el.selectedOptions).map(o=>o.value);
      answers[el.name]=arr;
    } else {
      answers[el.name]=el.value;
    }
  });
}

function validateStep(stepIndex) {
  // minimal checks
  if (stepIndex===1 && answers.flow_type==="Inbound") {
    const nm= getValue("contact_name");
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

function updateProgress(st) {
  // st from 1..4, totalSteps=5 => progress = (st-1)/(4)*100
  const pct = Math.round(((st-1)/(4-1))*100);
  if (progressBarEl) {
    progressBarEl.style.width = pct+"%";
  }
}
