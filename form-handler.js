import { db } from "./firebase-config.js";
import {
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

let step = 1;       // текущий шаг (1..3)
let totalSteps = 3; // всего шагов
let questionsData = null; // из questions.json
let answers = {};   // здесь храним все ответы

const formEl = document.getElementById("multistep-form");

function renderStep(n) {
  formEl.innerHTML = ""; // очистка

  if (!questionsData) {
    formEl.innerHTML = "<p>Loading questions...</p>";
    return;
  }

  // Управляем кнопками
  let navHtml = `
    <div class="nav-buttons">
      ${n > 1 ? `<button id="prevBtn">&lt; Back</button>` : ""}
      ${n < totalSteps ? `<button id="nextBtn">Next &gt;</button>` : ""}
      ${n === totalSteps ? `<button id="submitBtn">Submit</button>` : ""}
    </div>
  `;

  // Рендерим поля (Step1 / Step2 / Step3)
  let questionsArr = [];
  if (n === 1) {
    questionsArr = questionsData.step1;
  } else if (n === 2) {
    // смотрим, какой call_type_ctm выбрал юзер
    const callType = answers["call_type_ctm"] || "";
    switch(callType) {
      case "New Project":
        questionsArr = questionsData.step2_newProject;
        break;
      case "Existing Project":
        questionsArr = questionsData.step2_existing;
        break;
      case "Vendor":
        questionsArr = questionsData.step2_vendor;
        break;
      case "Technician":
        questionsArr = questionsData.step2_technician;
        break;
      case "Complaint":
        questionsArr = questionsData.step2_complaint;
        break;
      case "Promotion/Spam":
        // можно выдать короткое сообщение
        formEl.innerHTML = `<p>Marked as Promotion/Spam. No more data needed.</p>` + navHtml;
        attachNavHandlers();
        return;
      case "HR Inquiry":
        questionsArr = questionsData.step2_hr;
        break;
      case "Unknown":
        questionsArr = questionsData.step2_unknown;
        break;
      default:
        // пусто
        formEl.innerHTML = `<p>Please go back and select call type.</p>` + navHtml;
        attachNavHandlers();
        return;
    }
  } else if (n === 3) {
    questionsArr = questionsData.step3;
  }

  // Собираем HTML для каждого вопроса
  let html = ``;
  questionsArr.forEach(q => {
    html += renderQuestionHtml(q);
  });

  formEl.innerHTML = html + navHtml;
  attachNavHandlers();
}

// Генерим html для одного вопроса
function renderQuestionHtml(q) {
  let out = `<div class="question-block">`;
  if (q.label) {
    out += `<label for="${q.name}">${q.label}</label>`;
  }
  switch(q.type) {
    case "text":
    case "email":
    case "date":
      out += `<input type="${q.type}" id="${q.name}" name="${q.name}" value="${answers[q.name]||""}" />`;
      break;
    case "number":
      out += `<input type="number" id="${q.name}" name="${q.name}" value="${answers[q.name]||""}" />`;
      break;
    case "textarea":
      out += `<textarea id="${q.name}" name="${q.name}" rows="3">${answers[q.name]||""}</textarea>`;
      break;
    case "select":
      out += `<select id="${q.name}" name="${q.name}" ${q.multi ? "multiple" : ""}>`;
      if (!q.multi) {
        out += `<option value="">-- select --</option>`;
      }
      if (q.options) {
        q.options.forEach(opt => {
          let sel = "";
          // если multi
          if (q.multi && Array.isArray(answers[q.name]) && answers[q.name].includes(opt)) {
            sel = "selected";
          } else if (!q.multi && answers[q.name] === opt) {
            sel = "selected";
          }
          out += `<option value="${opt}" ${sel}>${opt}</option>`;
        });
      }
      out += `</select>`;
      break;
    default:
      out += `<p>Unsupported field type: ${q.type}</p>`;
  }

  out += `</div>`;
  return out;
}

// Сохраняем ответы текущего шага
function collectAnswers() {
  const inputs = formEl.querySelectorAll("input, select, textarea");
  inputs.forEach(el => {
    let val = "";
    if (el.type === "select-multiple" || el.hasAttribute("multiple")) {
      // множественный выбор
      val = Array.from(el.selectedOptions).map(o=>o.value);
    } else {
      val = el.value;
    }
    answers[el.name] = val;
  });
}

// Навесить события на кнопки
function attachNavHandlers() {
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const submitBtn = document.getElementById("submitBtn");

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      collectAnswers();
      step--;
      if (step < 1) step=1;
      renderStep(step);
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      collectAnswers();
      step++;
      if (step > totalSteps) step=totalSteps;
      renderStep(step);
    });
  }
  if (submitBtn) {
    submitBtn.addEventListener("click", onSubmitHandler);
  }
}

async function onSubmitHandler() {
  collectAnswers();
  // проверяем qualification
  if (!answers["qualification_ctm"] || answers["qualification_ctm"] === "") {
    alert("Please select the qualification status!");
    return;
  }
  console.log("Final answers =>", answers);

  // Сохраняем в Firestore
  try {
    const docRef = await addDoc(collection(db, "responses"), answers);
    console.log("Saved to Firestore with ID:", docRef.id);
    alert("Submitted successfully! ID: " + docRef.id);
    // reset?
    // location.reload();
  } catch(e) {
    console.error("Error saving:", e);
    alert("Error saving to Firestore: "+ e);
  }
}

// 1) Грузим questions.json
fetch("./questions.json")
  .then(res=>res.json())
  .then(data => {
    questionsData = data;
    // Рендерим Step1
    renderStep(step);
  })
  .catch(err=>{
    console.error("Error loading questions.json:", err);
    formEl.innerHTML = "<p style='color:red;'>Failed to load questions.</p>";
  });
