import { db } from "./firebase-config.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Модули для CTM
import { CTM_ACCOUNT_ID, CTM_BASIC_AUTH } from "./ctm-api-config.js";
import { fetchCTMCustomFields } from "./ctm-fields-sync.js";

// DOM-элементы формы
const multiStepContainer = document.getElementById("multiStepContainer");
const backBtn = document.getElementById("backBtn");
const nextBtn = document.getElementById("nextBtn");
const submitBtn = document.getElementById("submitBtn");
const settingsBtn = document.getElementById("settingsBtn"); // Кнопка "Настройки"
const settingsPanel = document.getElementById("adminSettingsPanel"); // div для настроек (скрыт по умолчанию)

// Прочие поля
let step = 1;
let questionsData = null;
let answers = {};
let isAdmin = false; // Флаг администратора

// =========================== 1) Функция авторизации (Admin) ===========================
async function adminLoginCTM(username, password) {
  // Допустим, проверяем через CTM /authentication
  // Или хотим просто GET /accounts => смотрим user_role=admin
  // Пример базовой авторизации (упрощённо). 
  // На практике можно делать POST /authentication.

  const url = `https://api.calltrackingmetrics.com/api/v1/accounts?per_page=1`;

  // Простейший пример: шлём запрос, проверяем user_role = admin в ответе
  try {
    const resp = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": "Basic " + btoa(`${username}:${password}`),
        "Content-Type": "application/json"
      }
    });
    if (!resp.ok) {
      throw new Error("CTM admin login error: " + resp.status);
    }
    const data = await resp.json();
    // Проверяем первый account — user_role
    if (data.accounts && data.accounts.length > 0) {
      const role = data.accounts[0].user_role; // "admin" ?
      if (role === "admin") {
        return true;
      }
    }
    return false;
  } catch(e) {
    console.error("adminLoginCTM error:", e);
    return false;
  }
}

// =========================== 2) Клик "Открыть настройки" ===========================
settingsBtn.addEventListener("click", async () => {
  if (!isAdmin) {
    const user = prompt("Введите ваш CTM AccessKey (или user)?", "");
    const pass = prompt("Введите ваш CTM SecretKey (или password)?", "");
    if (!user || !pass) {
      alert("Отмена или неверные данные");
      return;
    }
    const success = await adminLoginCTM(user, pass);
    if (!success) {
      alert("Вы не админ или ошибка авторизации");
      return;
    }
    // Если success = true => ставим флаг
    isAdmin = true;
  }

  // Показываем блок настроек
  settingsPanel.style.display = "block";

  // Например, подгружаем список Custom Fields
  try {
    const fields = await fetchCTMCustomFields(); 
    renderCustomFields(fields);
  } catch(e) {
    console.error("Ошибка загрузки Custom Fields:", e);
  }
});

function renderCustomFields(fields){
  // Допустим, элемент <div id="adminCustomFieldsList"></div>
  const listEl = document.getElementById("adminCustomFieldsList");
  listEl.innerHTML = "";
  fields.forEach(f=>{
    const li = document.createElement("div");
    li.textContent = `Field: ${f.name} (api_name=${f.api_name}) ID=${f.id}`;
    listEl.appendChild(li);
  });
}

// =========================== 3) Обработка многошаговой формы =========================
backBtn.addEventListener("click", () => {
  step--;
  renderStep(step);
});
nextBtn.addEventListener("click", () => {
  step++;
  renderStep(step);
});
submitBtn.addEventListener("click", onSubmit);

function renderStep(n) {
  // Загружает вопросы, показывает нужный блок и т.д.
  // Демонстрационно
  console.log("render step", n);
  if (n < 1) n = 1;

  // TODO: переключать видимость шагов...
}

// Пример сбора ответов
function collectAnswers() {
  // В реальном коде подставляйте нужные поля
  answers["someKey"] = document.getElementById("someInput").value;
  // ...
}

// =========================== 4) CTM Update ===========================
async function updateCTMCall(callId, updates) {
  const url = `https://api.calltrackingmetrics.com/api/v1/accounts/${CTM_ACCOUNT_ID}/calls/${callId}`;
  try {
    const resp = await fetch(url, {
      method: "PUT",
      headers: {
        "Authorization": "Basic " + CTM_BASIC_AUTH,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(updates)
    });
    if(!resp.ok){
      const txt = await resp.text();
      throw new Error(`CTM update error: ${resp.status} => ${txt}`);
    }
    const data = await resp.json();
    console.log("CTM call updated:", data);
    return data;
  } catch(e){
    console.error("Failed to update CTM call:", e);
    throw e;
  }
}

// =========================== 5) onSubmit ===========================
async function onSubmit() {
  collectAnswers();
  
  // Допустим, call_id мы передали через URL, сохраняем в answers
  const callId = answers["call_id"];
  if (callId) {
    const updates = {
      custom_fields: {
        "qualification_ctm": answers["qualification_ctm"] || "",
        "event_name_ctm": answers["event_name_ctm"] || ""
      }
    };
    try {
      await updateCTMCall(callId, updates);
      console.log("Updated CTM custom fields");
    } catch(e){
      alert("Ошибка при обновлении CTM: " + e);
    }
  }

  // Сохраняем ответы в Firebase
  try {
    const docRef = await addDoc(collection(db,"responses"), answers);
    alert("Форма сохранена. ID: " + docRef.id);
  } catch(e) {
    alert("Ошибка при сохранении в Firebase => " + e);
  }
}

// =========================== 6) Инициализация ===========================
function init() {
  // Загрузить questions.json, рендер первого шага и т.д.
  fetch("./questions.json")
    .then(r=>r.json())
    .then(data => {
      questionsData = data;
      renderStep(1);
    })
    .catch(err=>{
      console.error("Ошибка загрузки questions.json:", err);
    });

  // Скрываем панель настроек
  settingsPanel.style.display = "none";
}

// Запускаемся
init();
