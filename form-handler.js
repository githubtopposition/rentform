import { db } from "./firebase-config.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const multiStepContainer = document.getElementById("multiStepContainer");
const backBtn = document.getElementById("backBtn");
const nextBtn = document.getElementById("nextBtn");
const previewBtn = document.getElementById("previewBtn");
const submitBtn = document.getElementById("submitBtn");

const progressDiv = document.createElement("div");
progressDiv.className = "progress"; // if needed

const progressBarEl = document.querySelector("#progressBar .progress");

let questionsData = null;
let step = 0; // we have steps from 0..4 => total 5
let answers = {};

const totalSteps = 5; // 0,1,2,3,4

fetch("./questions.json")
  .then(r => r.json())
  .then(data => {
    questionsData = data;
    step = 0;
    renderStep(step);
  })
  .catch(err => {
    console.error("Error loading JSON", err);
    multiStepContainer.innerHTML = "<p style='color:red;'>Failed to load questions.json</p>";
  });

function renderStep(stepIndex) {
  multiStepContainer.innerHTML = "";

  // Buttons
  backBtn.style.display    = (stepIndex>0)       ? "inline-block" : "none";
  nextBtn.style.display    = (stepIndex<3)       ? "inline-block" : "none";
  previewBtn.style.display = (stepIndex===2)     ? "inline-block" : "none";
  submitBtn.style.display  = (stepIndex===4)     ? "inline-block" : "none";

  updateProgress(stepIndex);

  let toRender = [];

  switch(stepIndex) {
    case 0: // step0 => inbound/outbound
      toRender = questionsData.step0;
      break;
    case 1:
      if (answers.flow_type === "Inbound") {
        toRender = questionsData.step1_inbound;
      } else {
        toRender = questionsData.step1_outbound;
      }
      break;
    case 2:
      if (answers.flow_type==="Inbound") {
        const ctype = answers.call_type_ctm || "";
        switch(ctype) {
          case "New Project":      toRender = questionsData.step2_newProject;   break;
          case "Existing Project": toRender = questionsData.step2_existing;     break;
          case "Vendor":           toRender = questionsData.step2_vendor;       break;
          case "Technician":       toRender = questionsData.step2_technician;   break;
          case "Complaint":        toRender = questionsData.step2_complaint;    break;
          case "Promotion/Spam":
            multiStepContainer.innerHTML = `<div class="alert">Marked as Spam. No more details needed.</div>`;
            return;
          case "HR Inquiry":       toRender = questionsData.step2_hr;           break;
          case "Unknown":          toRender = questionsData.step2_unknown;      break;
          default:
            multiStepContainer.innerHTML = `<p>Please go back and select call type.</p>`;
            return;
        }
      } else {
        // Outbound => some extra step?
        toRender = questionsData.step3_outbound;
      }
      break;
    case 3:
      // preview
      toRender = questionsData.stepPreview;
      break;
    case 4:
      // final step => qualification + submit
      toRender = questionsData.stepFinal;
      break;
    default:
      toRender = [];
  }

  toRender.forEach(q => {
    const block = document.createElement("div");
    block.className = "question-block";

    if (q.label) {
      const lab = document.createElement("label");
      lab.textContent = q.label;
      block.appendChild(lab);
    }

    if (q.name==="_summary_") {
      // show preview
      const summaryDiv = document.createElement("div");
      summaryDiv.id = "previewBlock";
      summaryDiv.innerHTML = generatePreviewHtml();
      block.appendChild(summaryDiv);
      multiStepContainer.appendChild(block);
      return;
    }

    let el = null;
    switch(q.type) {
      case "text":
      case "date":
      case "email":
        el = document.createElement("input");
        el.type = q.type;
        el.name = q.name;
        el.value = answers[q.name] || "";
        break;
      case "textarea":
        el = document.createElement("textarea");
        el.name = q.name;
        el.rows = 3;
        el.value = answers[q.name] || "";
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
        q.options.forEach(opt => {
          const optEl = document.createElement("option");
          optEl.value=opt;
          optEl.textContent=opt;
          if (q.multi && Array.isArray(answers[q.name]) && answers[q.name].includes(opt)) {
            optEl.selected = true;
          } else if (!q.multi && answers[q.name]===opt) {
            optEl.selected = true;
          }
          el.appendChild(optEl);
        });
        if (q.multi) el.multiple=true;
        break;
      default:
        block.innerHTML += `<p style='color:red;'>Unsupported field type: ${q.type}</p>`;
    }
    if (el) block.appendChild(el);

    multiStepContainer.appendChild(block);
  });
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

function updateProgress(stepIndex) {
  const pct = Math.round((stepIndex/(totalSteps-1))*100);
  if (progressBarEl) {
    progressBarEl.style.width = pct + "%";
  }
}

/* Nav logic */
backBtn.addEventListener("click", () => {
  collectAnswers();
  step--;
  if (step<0) step=0;
  renderStep(step);
});
nextBtn.addEventListener("click", () => {
  if (!validateStep(step)) return;
  collectAnswers();
  step++;
  if (step>=totalSteps) step=totalSteps-1;
  renderStep(step);
});
previewBtn.addEventListener("click", () => {
  // from step2 => step3
  collectAnswers();
  step=3;
  renderStep(step);
});
submitBtn.addEventListener("click", onSubmit);

function collectAnswers() {
  const inputs = multiStepContainer.querySelectorAll("input, select, textarea");
  inputs.forEach(el => {
    if (!el.name) return;
    if (el.multiple) {
      const arr = Array.from(el.selectedOptions).map(o=>o.value);
      answers[el.name] = arr;
    } else {
      answers[el.name] = el.value;
    }
  });
}

function validateStep(stepIndex) {
  // minimal checks
  if (stepIndex===0) {
    const ft = getValue("flow_type");
    if (!ft) {
      alert("Please select Inbound or Outbound");
      return false;
    }
  } else if (stepIndex===1 && answers.flow_type==="Inbound") {
    const nm = getValue("contact_name");
    if (!nm) {
      alert("Client Name is required for inbound calls.");
      return false;
    }
  }
  return true;
}

function getValue(name) {
  const el = multiStepContainer.querySelector(`[name='${name}']`);
  if (!el) return "";
  if (el.multiple) {
    return Array.from(el.selectedOptions).map(o=>o.value);
  }
  return el.value;
}

async function onSubmit() {
  if (!validateStep(step)) return;
  collectAnswers();

  // final check: qualification_ctm
  const q = answers["qualification_ctm"];
  if (!q || q==="") {
    alert("Please select final qualification!");
    return;
  }

  console.log("Final answers =>", answers);
  try {
    await addDoc(collection(db, "responses"), answers);
    alert("Submitted successfully!");
    // location.reload();
  } catch (err) {
    console.error("Error saving to Firestore", err);
    alert("Error saving: " + err);
  }
}
