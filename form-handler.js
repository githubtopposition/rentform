// form-handler.js
// Логика: грузим questions.json, рендерим Part1 → Next → Part2 → Submit в Firestore → Показываем PDF

// Импортируем db и методы Firestore, чтобы записать в коллекцию
import { db } from "./firebase-config.js";
import {
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Находим элементы из index.html
const formContainer = document.getElementById("formContainer");
const nextBtn = document.getElementById("nextBtn");
const submitBtn = document.getElementById("submitBtn");
const downloadPdfBtn = document.getElementById("downloadPdfBtn");
const formTitleEl = document.getElementById("formTitle");

// Переменные
let questionsData = null; // сюда загрузим questions.json
let currentPart = 1;      // какой шаг показываем
let answers = {};         // объект с ответами

// 1) Грузим questions.json
fetch("./questions.json")
  .then((res) => res.json())
  .then((data) => {
    questionsData = data;
    renderPart(currentPart);
  })
  .catch((err) => {
    console.error("Error loading questions.json:", err);
  });

// 2) Функция рендера нужной части (part1, part2, ...)
function renderPart(partNumber) {
  formContainer.innerHTML = ""; // очищаем

  const partKey = `part${partNumber}`;
  const questions = questionsData[partKey];
  if (!questions) {
    console.warn("No questions found for", partKey);
    return;
  }

  // Обновляем заголовок, если надо
  if (formTitleEl) {
    formTitleEl.textContent = `Step ${partNumber} of 2`;
  }

  // Рендерим каждый вопрос
  questions.forEach((q) => {
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
        q.options.forEach((opt) => {
          const optEl = document.createElement("option");
          optEl.value = opt;
          optEl.textContent = opt;
          fieldEl.appendChild(optEl);
        });
        break;

      case "radio":
        const radioContainer = document.createElement("div");
        q.options.forEach((optVal) => {
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

  // Меняем вид кнопок
  if (partNumber === 1) {
    nextBtn.style.display = "inline-block";
    submitBtn.style.display = "none";
    downloadPdfBtn.style.display = "none";
  } else {
    nextBtn.style.display = "none";
    submitBtn.style.display = "inline-block";
  }
}

// 3) Сбор ответов для текущего part
function collectAnswers(partNumber) {
  const partKey = `part${partNumber}`;
  const questions = questionsData[partKey];
  if (!questions) return;

  questions.forEach((q) => {
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
  collectAnswers(currentPart); // собираем ответы с part1
  currentPart = 2;
  renderPart(currentPart);
});

// 5) Кнопка "Submit" → собираем ответы, пишем в Firestore, выводим результат
submitBtn.addEventListener("click", async () => {
  collectAnswers(currentPart); // собираем ответы с part2
  console.log("Final answers:", answers);

  // Отправка в Firestore
  try {
    const docRef = await addDoc(collection(db, "responses"), answers);
    console.log("Data saved to Firestore with ID:", docRef.id);
  } catch (err) {
    console.error("Error saving to Firestore:", err);
  }

  // Заменяем форму итоговой сводкой (чтобы PDF был текстовым)
  formContainer.innerHTML = `
    <h3>Submitted Data:</h3>
    <pre style="background:#f0f0f0; padding:10px;">${JSON.stringify(answers, null, 2)}</pre>
  `;

  // Прячем кнопки Next/Submit, показываем PDF
  nextBtn.style.display = "none";
  submitBtn.style.display = "none";
  downloadPdfBtn.style.display = "inline-block";
});

// 6) Кнопка "Download PDF" → простая печать
downloadPdfBtn.addEventListener("click", () => {
  window.print();
});
