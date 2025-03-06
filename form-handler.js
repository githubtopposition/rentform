// form-handler.js

// Находим элементы в DOM
const formContainer = document.getElementById("formContainer");
const nextBtn = document.getElementById("nextBtn");
const submitBtn = document.getElementById("submitBtn");
const downloadPdfBtn = document.getElementById("downloadPdfBtn");

// Переменные для хранения данных
let questionsData = null; // В questionsData загрузим JSON (part1, part2 и т.д.)
let currentPart = 1;      // Текущий "шаг" опроса
let answers = {};         // Объект для хранения ответов пользователя

// 1) Загружаем файл questions.json
fetch("./questions.json")
  .then((res) => res.json())
  .then((data) => {
    questionsData = data;
    // Сразу рендерим part1 (первую часть вопросов)
    renderPart(currentPart);
  })
  .catch((err) => {
    console.error("Error loading questions.json:", err);
  });

// 2) Функция для рендера (отрисовки) вопросов нужной части
function renderPart(partNumber) {
  // Очищаем контейнер
  formContainer.innerHTML = "";

  // Берём массив вопросов для текущего part
  const partKey = `part${partNumber}`; // "part1", "part2", ...
  const questions = questionsData[partKey];
  if (!questions) {
    console.warn("No questions found for", partKey);
    return;
  }

  // Для каждого вопроса создаём соответствующий элемент
  questions.forEach((q) => {
    // Обёртка для одного вопроса
    const wrapper = document.createElement("div");
    wrapper.className = "question-item";

    // Создаём label
    const labelEl = document.createElement("label");
    labelEl.textContent = q.label;
    labelEl.htmlFor = q.name; // Связка для доступности
    wrapper.appendChild(labelEl);

    // В зависимости от типа вопроса создаём нужный input / textarea / select
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
        // Заполняем варианты <option>
        q.options.forEach((optionValue) => {
          const optEl = document.createElement("option");
          optEl.value = optionValue;
          optEl.textContent = optionValue;
          fieldEl.appendChild(optEl);
        });
        break;

      case "radio":
        // Для radio делаем набор кнопок
        const radioContainer = document.createElement("div");
        q.options.forEach((optVal) => {
          const radioLabel = document.createElement("label");
          radioLabel.textContent = optVal;

          const radioInput = document.createElement("input");
          radioInput.type = "radio";
          radioInput.name = q.name; // одна группа
          radioInput.value = optVal;

          // Вставляем input перед текстом
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

    // Если fieldEl есть (т.е. не radio-кейс), добавим в обёртку
    if (fieldEl) {
      wrapper.appendChild(fieldEl);
    }

    // Помещаем всё в контейнер формы
    formContainer.appendChild(wrapper);
  });

  // В зависимости от шага меняем видимость кнопок
  if (partNumber === 1) {
    nextBtn.style.display = "inline-block";   // показываем "Next"
    submitBtn.style.display = "none";         // скрываем "Submit"
    downloadPdfBtn.style.display = "none";    // скрываем "Download PDF"
  } else {
    nextBtn.style.display = "none";           // скрываем "Next"
    submitBtn.style.display = "inline-block"; // показываем "Submit"
    // "Download PDF" покажем уже после сабмита
  }
}

// 3) Кнопка "Next": cобираем ответы из part1, переходим на part2
nextBtn.addEventListener("click", () => {
  collectAnswers(currentPart);
  currentPart = 2;
  renderPart(currentPart);
});

// 4) Кнопка "Submit": cобираем ответы из part2, выводим результат и показываем кнопку PDF
submitBtn.addEventListener("click", () => {
  collectAnswers(currentPart);
  console.log("Final answers:", answers);

  // Здесь можешь отправлять answers в Firebase, Odoo, и т.д.
  // Например:
  // sendToFirebase(answers);

  // Показываем кнопку "Download PDF" после полной отправки
  downloadPdfBtn.style.display = "inline-block";
});

// 5) Сбор значений полей для текущей части
function collectAnswers(partNumber) {
  const partKey = `part${partNumber}`;
  const questions = questionsData[partKey];
  if (!questions) return;

  questions.forEach((q) => {
    if (q.type === "radio") {
      // Ищем выбранную радиокнопку
      const selectedRadio = document.querySelector(
        `input[type="radio"][name="${q.name}"]:checked`
      );
      answers[q.name] = selectedRadio ? selectedRadio.value : null;
    } else if (q.type === "checkbox") {
      const checkboxEl = document.getElementById(q.name);
      answers[q.name] = checkboxEl ? checkboxEl.checked : false;
    } else if (q.type === "select") {
      const selectEl = document.getElementById(q.name);
      answers[q.name] = selectEl ? selectEl.value : "";
    } else if (q.type === "text" || q.type === "textarea") {
      const inputEl = document.getElementById(q.name);
      answers[q.name] = inputEl ? inputEl.value : "";
    }
  });
}

// 6) Кнопка "Download PDF" → упрощённый способ (печать страницы)
downloadPdfBtn.addEventListener("click", () => {
  window.print();
});
