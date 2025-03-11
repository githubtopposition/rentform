import { db } from "./firebase-config.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { initAutocompleteFor } from "./maps-config.js";

// ------------------ DOM ELEMENTS ------------------
const multiStepContainer = document.getElementById("multiStepContainer");
const backBtn = document.getElementById("backBtn");
const nextBtn = document.getElementById("nextBtn");
const previewBtn = document.getElementById("previewBtn");
const submitBtn = document.getElementById("submitBtn");
const progressBarEl = document.querySelector("#progressBar .progress");

// ------------------ STATE ------------------
let questionsData = null;        // из questions.json (для inbound/outbound step1, existing, etc.)
let servicesIndex = null;        // из data/services-index.json (для New Project сервисов)
let step = 1;                    // step=1..4
let answers = {};
const totalSteps = 5;            // 1..4 + (step2.5)...

// Вспомогательный массив: какие сервисы выбрал оператор (LiveBand, StageRental..)
let chosenServices = [];

// ------------------ LOAD questions.json ------------------
fetch("./questions.json")
  .then(r => r.json())
  .then(data => {
    questionsData = data;
    console.log("Loaded questions.json");
    // по умолчанию inbound
    answers.flow_type = "Inbound";
    // Параллельно подгрузим services-index.json
    return fetch("./data/services-index.json");
  })
  .then(r => r.json())
  .then(indexData => {
    servicesIndex = indexData;
    console.log("Loaded servicesIndex:", servicesIndex);
    renderStep(step);
  })
  .catch(err=>{
    console.error("Failed to load some JSON:", err);
    multiStepContainer.innerHTML = "<p class='alert'>Failed to load required JSON files.</p>";
  });

// ------------------ RENDER STEPS ------------------
function renderStep(stepIndex) {
  // очищаем контейнер
  multiStepContainer.innerHTML = "";

  // Показывать / скрывать кнопки
  backBtn.style.display    = (stepIndex>1) ? "inline-block":"none";
  nextBtn.style.display    = (stepIndex<3) ? "inline-block":"none";  // step1..2
  previewBtn.style.display = (stepIndex===3) ? "inline-block":"none"; 
  submitBtn.style.display  = (stepIndex===4) ? "inline-block":"none";

  updateProgress(stepIndex);

  // Массив вопросов для рендера
  let toRender = [];

  if (stepIndex===1) {
    // Step1 inbound/outbound
    if (answers.flow_type==="Inbound") {
      toRender = questionsData.step1_inbound;
    } else {
      toRender = questionsData.step1_outbound;
    }
  }
  else if (stepIndex===2) {
    // Step2 inbound: завиcит от call_type_ctm
    if (answers.flow_type==="Inbound") {
      const ctype = answers.call_type_ctm || "";
      switch(ctype) {
        case "New Project":
          // Здесь вместо старого step2_newProject — рендерим небольшой "choose services" 
          // и/или partial Q, потом dynamic load
          renderNewProjectServiceChoice();
          return; // Выходим, т.к. renderNewProjectServiceChoice сам всё вывел
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
  }
  else if (stepIndex===25) {
    // Step2.5 advanced
    toRender = questionsData.step2p5_salesAdvanced || [];
  }
  else if (stepIndex===3) {
    // Preview
    toRender = questionsData.stepPreview;
  }
  else if (stepIndex===4) {
    toRender = questionsData.stepFinal;
  }

  // Рендер массива вопросов
  toRender.forEach(q => {
    renderQuestionBlock(q, multiStepContainer);
  });

  // Специальная кнопка "Switch to Outbound?" (если step1 inbound)
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

  // Подключим Google Maps (например, event_street_ctm)
  const streetInput = multiStepContainer.querySelector("[name='event_street_ctm']");
  if (streetInput) {
    initAutocompleteFor(streetInput);
  }
}

// ------------------ HELPER: renderNewProjectServiceChoice ------------------
function renderNewProjectServiceChoice() {
  // Вместо старого step2_newProject (questionsData), 
  // мы сделаем multi-select сервисов + кнопку "Load Service Questions"
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

  document.getElementById("svcNextBtn").addEventListener("click", () => {
    // Собираем выбранные сервисы
    const checks = multiStepContainer.querySelectorAll("input[name='svc']:checked");
    chosenServices = Array.from(checks).map(c=> c.value);
    // Теперь выводим вопросы
    renderServicesQuestions();
  });
}

// ------------------ HELPER: renderServicesQuestions ------------------
async function renderServicesQuestions() {
  multiStepContainer.innerHTML = `<h3>Service Details</h3>
    <div id="servicesContainer"></div>
    <button id="goToStep3Btn">Next (Logistics)</button>`;

  const parent = document.getElementById("servicesContainer");

  // Загружаем JSON для каждого выбранного сервиса
  for (let svc of chosenServices) {
    const url = servicesIndex[svc]; 
    if (!url) {
      const warn = document.createElement("p");
      warn.textContent = `No JSON found for service: ${svc}`;
      parent.appendChild(warn);
      continue;
    }
    try {
      const resp = await fetch(url);
      const serviceQuestions = await resp.json();
      const heading = document.createElement("h4");
      heading.textContent = `=== ${svc} ===`;
      parent.appendChild(heading);

      serviceQuestions.forEach(q => {
        renderQuestionBlock(q, parent);
      });
    } catch(e) {
      console.error("Error loading", url, e);
      const errP = document.createElement("p");
      errP.textContent = `Error loading service file: ${svc}`;
      parent.appendChild(errP);
    }
  }

  // кнопка -> go step3
  document.getElementById("goToStep3Btn").addEventListener("click", () => {
    // collect answers from these service questions
    collectAnswers();
    // Переходим на Step 3 (в вашей логике)
    step=3;  // or step=2.5 if you want advanced sales? 
    renderStep(step);
  });
}

// ------------------ RENDER A SINGLE QUESTION BLOCK ------------------
function renderQuestionBlock(q, parentEl) {
  const block = document.createElement("div");
  block.className = "question-block";

  if (q.type==="label") {
    const p = document.createElement("p");
    p.innerHTML = `<strong>${q.id||""}</strong> ${q.text}`;
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
    const lbl = document.createElement("p");
    lbl.innerHTML = `<strong>${q.id||""}</strong> ${q.label||""}`;
    block.appendChild(lbl);

    q.options.forEach(opt => {
      const l = document.createElement("label");
      const c = document.createElement("input");
      c.type = "checkbox";
      c.name = q.name; // single group
      c.value = opt;
      l.appendChild(c);
      l.appendChild(document.createTextNode(opt));
      block.appendChild(l);
      block.appendChild(document.createElement("br"));
    });
  }
  else if (q.type==="checkbox-multi") {
    // multiple check
    const lbl = document.createElement("p");
    lbl.innerHTML = `<strong>${q.id||""}</strong> ${q.label||""}`;
    block.appendChild(lbl);

    q.options.forEach(opt => {
      const l = document.createElement("label");
      const c = document.createElement("input");
      c.type = "checkbox";
      c.name = q.name+"[]";  // array
      c.value = opt;
      l.appendChild(c);
      l.appendChild(document.createTextNode(opt));
      block.appendChild(l);
      block.appendChild(document.createElement("br"));
    });
  }
  else if (q.type==="select") {
    const lbl = document.createElement("p");
    lbl.innerHTML = `<strong>${q.id||""}</strong> ${q.label||""}`;
    block.appendChild(lbl);

    const sel = document.createElement("select");
    sel.name = q.name;
    if (!q.multi) {
      // add empty
      const emptyOpt = document.createElement("option");
      emptyOpt.value="";
      emptyOpt.textContent="-- select --";
      sel.appendChild(emptyOpt);
    }
    q.options.forEach(opt => {
      const op = document.createElement("option");
      op.value = opt;
      op.textContent = opt;
      sel.appendChild(op);
    });
    if (q.multi) sel.multiple=true;
    block.appendChild(sel);
  }
  else if (q.type==="conditional") {
    // We'll just render sub-blocks always 
    // (Real-time show/hide can be more advanced)
    if (q.blocks) {
      q.blocks.forEach(subQ => {
        renderQuestionBlock(subQ, block);
      });
    }
  }
  else {
    const p = document.createElement("p");
    p.style.color="red";
    p.textContent = `Unsupported type: ${q.type}`;
    block.appendChild(p);
  }

  parentEl.appendChild(block);
}

// ------------------ EVENT: BACK / NEXT / PREVIEW / SUBMIT ------------------
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
  // Special case: If step2 + call_type=New Project => step2.5 advanced
  if (step===2 && answers.flow_type==="Inbound" && answers.call_type_ctm==="New Project") {
    // go advanced?
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
  console.log("FINAL =>", answers);
  addDoc(collection(db,"responses"), answers)
    .then(docRef=>{
      alert("Saved with ID:"+docRef.id);
      // location.reload();
    })
    .catch(err=>{
      alert("Error saving: "+ err);
    });
}

// ------------------ HELPER: collectAnswers ------------------
function collectAnswers() {
  const els = multiStepContainer.querySelectorAll("input, select, textarea");
  els.forEach(el => {
    if (!el.name) return;
    // if name ends with []
    if (el.name.endsWith("[]")) {
      const baseName = el.name.slice(0, -2);
      answers[baseName] = answers[baseName] || [];
      if (el.type==="checkbox" && el.checked) {
        answers[baseName].push(el.value);
      }
    }
    else if (el.type==="checkbox") {
      // single group
      if (el.checked) {
        if (!answers[el.name]) answers[el.name] = [];
        answers[el.name].push(el.value);
      }
    }
    else {
      answers[el.name] = el.value;
    }
  });
}

// ------------------ HELPER: validateStep ------------------
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
  // st from 1..4 => progress
  const pct = Math.round(((st-1)/(4-1))*100);
  if (progressBarEl) {
    progressBarEl.style.width = pct+"%";
  }
}
