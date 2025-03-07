import { db } from "./firebase-config.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const multiStepContainer = document.getElementById("multiStepContainer");
const backBtn = document.getElementById("backBtn");
const nextBtn = document.getElementById("nextBtn");
const previewBtn = document.getElementById("previewBtn");
const submitBtn = document.getElementById("submitBtn");
const progressBarEl = document.querySelector("#progressBar .progress");

let questionsData = null;
let step = 0; // 0..4
let answers = {};

// Общая структура
// 0: inbound/outbound
// 1: step1_inbound или step1_outbound
// 2: step2 (newProject, existing, vendor, etc.) / or outbound follow up
// 3: preview
// 4: final -> qualification -> submit

const totalSteps = 5; // 0..4 inclusive

fetch("./questions.json")
  .then(r => r.json())
  .then(data => {
    questionsData = data;
    step = 0;
    renderStep(0);
  })
  .catch(err => {
    console.error("Error loading JSON", err);
    multiStepContainer.innerHTML = "<p style='color:red;'>Failed to load questions.json</p>";
  });

function renderStep(stepIndex) {
  multiStepContainer.innerHTML = "";

  // Управляем кнопками
  backBtn.style.display = (stepIndex>0) ? "inline-block" : "none";
  nextBtn.style.display = (stepIndex<3) ? "inline-block" : "none";
  previewBtn.style.display = (stepIndex===2) ? "inline-block" : "none";
  submitBtn.style.display = (stepIndex===4) ? "inline-block" : "none";

  updateProgress(stepIndex);

  let toRender = [];

  switch(stepIndex) {
    case 0:
      // step0 => inbound/outbound
      toRender = questionsData.step0;
      break;
    case 1:
      // если flow_type = inbound => step1_inbound
      // если outbound => step1_outbound
      if (answers.flow_type === "Inbound") {
        toRender = questionsData.step1_inbound;
      } else {
        toRender = questionsData.step1_outbound;
      }
      break;
    case 2:
      // если inbound => разветвление call_type (new / existing / vendor..)
      // если outbound => возможно step3_outbound
      if (answers.flow_type==="Inbound") {
        const ctype = answers.call_type_ctm || "";
        switch(ctype) {
          case "New Project":      toRender = questionsData.step2_newProject; break;
          case "Existing Project": toRender = questionsData.step2_existing;   break;
          case "Vendor":           toRender = questionsData.step2_vendor;     break;
          case "Technician":       toRender = questionsData.step2_technician; break;
          case "Complaint":        toRender = questionsData.step2_complaint;  break;
          case "Promotion/Spam":
            multiStepContainer.innerHTML = `<div class="alert">Marked as Spam. No more details needed.</div>`;
            return;
          case "HR Inquiry":       toRender = questionsData.step2_hr;         break;
          case "Unknown":          toRender = questionsData.step2_unknown;    break;
          default:
            multiStepContainer.innerHTML = `<p>Please go back and select call type.</p>`;
            return;
        }
      } else {
        // outbound
        toRender = questionsData.step3_outbound; // небольшие доп. вопросы
      }
      break;
    case 3:
      // Preview
      toRender = questionsData.stepPreview;
      break;
    case 4:
      // Final
      toRender = questionsData.stepFinal;
      break;
    default:
      toRender = [];
  }

  // Рендерим поля
  toRender.forEach(q => {
    const block = document.createElement("div");
    block.className = "question-block";
    if (q.label) {
      const lab = document.createElement("label");
      lab.textContent = q.label;
      block.appendChild(lab);
    }

    if (q.name==="_summary_") {
      // особый случай: preview
      const summaryEl = document.createElement("div");
      summaryEl.id="previewBlock";
      summaryEl.innerHTML = generatePreviewHtml();
      block.appendChild(summaryEl);
      multiStepContainer.appendChild(block);
      return;
    }

    let inputEl;
    switch(q.type) {
      case "text":
      case "email":
      case "date":
        inputEl = document.createElement("input");
        inputEl.type = q.type;
        inputEl.name = q.name;
        inputEl.value = answers[q.name] || "";
        block.appendChild(inputEl);
        break;
      case "textarea":
        inputEl = document.createElement("textarea");
        inputEl.name = q.name;
        inputEl.rows = 3;
        inputEl.value = answers[q.name] || "";
        block.appendChild(inputEl);
        break;
      case "select":
        inputEl = document.createElement("select");
        inputEl.name = q.name;
        if (!q.multi) {
          // добавим пустую опцию
          const optEmpty = document.createElement("option");
          optEmpty.value="";
          optEmpty.textContent="-- select --";
          inputEl.appendChild(optEmpty);
        }
        if (q.options) {
          q.options.forEach(opt => {
            const opEl = document.createElement("option");
            opEl.value = opt;
            opEl.textContent = opt;
            if (q.multi && Array.isArray(answers[q.name]) && answers[q.name].includes(opt)) {
              opEl.selected = true;
            } else if (!q.multi && answers[q.name]===opt) {
              opEl.selected = true;
            }
            inputEl.appendChild(opEl);
          });
        }
        if (q.multi) {
          inputEl.multiple = true;
        }
        block.appendChild(inputEl);
        break;
      default:
        block.innerHTML += `<p style='color:red;'>Unsupported field type: ${q.type}</p>`;
    }

    multiStepContainer.appendChild(block);
  });
}

function generatePreviewHtml() {
  // показать все answers
  let html = `<ul>`;
  for (let [k,v] of Object.entries(answers)) {
    html += `<li><strong>${k}</strong>: ${ (Array.isArray(v))? v.join(",") : v }</li>`;
  }
  html += `</ul>`;
  return html;
}

function collectAnswers() {
  const inputs = multiStepContainer.querySelectorAll("input, select, textarea");
  inputs.forEach(el => {
    if (!el.name) return;
    if (el.type==="select-multiple" || el.multiple) {
      const vals = Array.from(el.selectedOptions).map(o=>o.value);
      answers[el.name] = vals;
    } else {
      answers[el.name] = el.value;
    }
  });
}

function updateProgress(stepIndex) {
  const percentage = Math.round(((stepIndex)/(totalSteps-1)) * 100);
  progressBarEl.style.width = percentage + "%";
}

/* Navigation buttons */
backBtn.addEventListener("click", () => {
  collectAnswers();
  step--;
  if (step<0) step=0;
  renderStep(step);
});

nextBtn.addEventListener("click", () => {
  // валидация
  if (!validateStep(step)) return;
  collectAnswers();
  step++;
  if (step>=totalSteps) step = totalSteps-1;
  renderStep(step);
});

previewBtn.addEventListener("click", () => {
  collectAnswers();
  // Логика: после step2 → step3 (preview)
  step=3;
  renderStep(step);
});

submitBtn.addEventListener("click", async () => {
  // финальная валидация
  if (!validateStep(step)) return;
  collectAnswers();
  console.log("Submitting answers: ", answers);

  // qualification_ctm обязателен
  if (!answers["qualification_ctm"] || answers["qualification_ctm"]==="") {
    alert("Please select final Qualification status!");
    return;
  }

  // push to Firestore
  try {
    await addDoc(collection(db,"responses"), answers);
    alert("Submitted successfully!");
    // reset?
    // location.reload();
  } catch(e) {
    console.error("Error saving to Firestore", e);
    alert("Error saving: "+ e);
  }
});

function validateStep(stepIndex) {
  // Пример: если step=0, поле flow_type обязательно
  if (stepIndex===0) {
    const ftype = getValue("flow_type");
    if (!ftype) {
      alert("Please select inbound/outbound!");
      return false;
    }
  } else if (stepIndex===1) {
    if (answers.flow_type==="Inbound") {
      // пусть client_name нужен
      const nm = getValue("contact_name");
      if (!nm) {
        alert("Client Name is required!");
        return false;
      }
      // можно проверять call_type_ctm ...
    } else {
      // outbound
      const nm = getValue("outbound_client_name");
      if (!nm) {
        alert("Outbound client name is required!");
        return false;
      }
    }
  }
  return true;
}

function getValue(fieldName) {
  const el = multiStepContainer.querySelector(`[name='${fieldName}']`);
  if (!el) return "";
  if (el.type==="select-multiple" || el.multiple) {
    return Array.from(el.selectedOptions).map(o=>o.value);
  } else {
    return el.value;
  }
}
