// form-handler.js

// Импортируем db и методы Firestore
import { db } from "./firebase-config.js";
import {
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const formContainer = document.getElementById("formContainer");
const formTitleEl = document.getElementById("formTitle");
const nextBtn = document.getElementById("nextBtn");
const submitBtn = document.getElementById("submitBtn");
const downloadPdfBtn = document.getElementById("downloadPdfBtn");

let questionsData = null;
let currentPart = 1;
let totalParts = 4; // у нас 4 части
let answers = {};

// 1) Загружаем questions.json
fetch("./questions.json")
  .then(res => res.json())
  .then(data => {
    questionsData = data;
    renderPart(currentPart);
  })
  .catch(err => {
    console.error("Error loading questions.json:", err);
  });

// 2) Функция рендера
function renderPart(partNumber) {
  formContainer.innerHTML = "";

  const partKey = `part${partNumber}`;
  const questions = questionsData[partKey];
  if (!questions) {
    console.warn("No questions found for", partKey);
    return;
  }

  // Заголовок: "Step X of 4"
  if (formTitleEl) {
    formTitleEl.textContent = `Step ${partNumber} of ${totalParts}`;
  }

  // Рендерим каждый вопрос
  questions.forEach(q => {
    const wrapper = document.createElement("div");
    wrapper.className = "question-item";

    const labelEl = document.createElement("label");
    labelEl.textContent = q.label;
    labelEl.htmlFor = q.name;
    wrapper.appendChild(labelEl);

    let fieldEl = null;

    switch (q.type) {
      case "text":
        fieldEl = document.createElement("input");
        fieldEl.type = "text";
        fieldEl.id = q.name;
        fieldEl.name = q.name;
        fieldEl.placeholder = q.placeholder || "";
        break;
      case "textarea":
        fieldEl = document.createElement("textarea");
        fieldEl.id = q.name;
        fieldEl.name = q.name;
        fieldEl.placeholder = q.placeholder || "";
        break;
      case "select":
        fieldEl = document.createElement("select");
        fieldEl.id = q.name;
        fieldEl.name = q.name;
        q.options.forEach(opt => {
          const optEl = document.createElement("option");
          optEl.value = opt;
          optEl.textContent = opt;
          fieldEl.appendChild(optEl);
        });
        break;
      case "radio":
        const radioContainer = document.createElement("div");
        q.options.forEach(optVal => {
          const radioLabel = document.createElement("label");
          radioLabel.textContent = optVal;

          const radioInput = document.createElement("input");
          radioInput.type = "radio";
          radioInput.name = q.name;
          radioInput.value = optVal;

          radioLabel.prepend(radioInput);
          radioContainer.appendChild(radioLabel);
        });
        wrapper.appendChild(radioContainer);
        break;
      case "checkbox":
        fieldEl = document.createElement("input");
        fieldEl.type = "checkbox";
        fieldEl.id = q.name;
        fieldEl.name = q.name;
        break;
      default:
        console.warn("Unknown question type:", q.type);
    }

    if (fieldEl) {
      wrapper.appendChild(fieldEl);
    }

    formContainer.appendChild(wrapper);
  });

  // Управляем кнопками
  if (partNumber < totalParts) {
    // Если не последний шаг, показываем Next, прячем Submit
    nextBtn.style.display = "inline-block";
    submitBtn.style.display = "none";
    downloadPdfBtn.style.display = "none";
  } else {
    // Если последний шаг (part4)
    nextBtn.style.display = "none";
    submitBtn.style.display = "inline-block";
  }
}

// 3) Собираем ответы для текущей части
function collectAnswers(partNumber) {
  const partKey = `part${partNumber}`;
  const questions = questionsData[partKey];
  if (!questions) return;

  questions.forEach(q => {
    if (q.type === "radio") {
      const selected = document.querySelector(
        `input[type="radio"][name="${q.name}"]:checked`
      );
      answers[q.name] = selected ? selected.value : null;
    } else if (q.type === "checkbox") {
      const cbEl = document.getElementById(q.name);
      answers[q.name] = cbEl ? cbEl.checked : false;
    } else if (q.type === "select") {
      const selEl = document.getElementById(q.name);
      answers[q.name] = selEl ? selEl.value : "";
    } else if (q.type === "text" || q.type === "textarea") {
      const inEl = document.getElementById(q.name);
      answers[q.name] = inEl ? inEl.value : "";
    }
  });
}

// 4) Кнопка "Next"
nextBtn.addEventListener("click", () => {
  collectAnswers(currentPart);
  currentPart++;
  renderPart(currentPart);
});

// 5) Кнопка "Submit" → собрать ответы, отправить в Firestore, отобразить результат
submitBtn.addEventListener("click", async () => {
  collectAnswers(currentPart);
  console.log("Final answers:", answers);

  // Сохраняем в Firestore
  try {
    const docRef = await addDoc(collection(db, "responses"), answers);
    console.log("Saved to Firestore, ID:", docRef.id);
  } catch (err) {
    console.error("Error saving to Firestore:", err);
  }

  // Выводим сводку вместо формы
  formContainer.innerHTML = `
    <h3>Submitted Data:</h3>
    <pre style="background:#f0f0f0; padding:10px;">${JSON.stringify(answers, null, 2)}</pre>
  `;

  nextBtn.style.display = "none";
  submitBtn.style.display = "none";
  downloadPdfBtn.style.display = "inline-block";
});

// 6) Кнопка "Download PDF" → печать страницы
downloadPdfBtn.addEventListener("click", () => {
  window.print();
});
