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
let servicesIndex = null;   
let step = 1;
let answers = {};
const totalSteps = 5;

let chosenServices = [];

// 1) Load questions + services index
fetch("./questions.json")
  .then(function(r){ return r.json(); })
  .then(function(data){
    questionsData = data;
    answers.flow_type = "Inbound";
    return fetch("./data/services-index.json");
  })
  .then(function(r){ return r.json(); })
  .then(function(idx){
    servicesIndex = idx;
    console.log("Loaded servicesIndex:", servicesIndex);
    renderStep(step);
  })
  .catch(function(err){
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

      // Switch to Outbound
      var switchBtn = document.createElement("button");
      switchBtn.textContent = "Switch to Outbound?";
      switchBtn.style.marginTop = "20px";
      switchBtn.onclick = function(){
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
      var ctype = answers.call_type_ctm || "";
      if (!ctype) {
        multiStepContainer.innerHTML = "<div class='alert'>Please select call type (New Project, etc.) in step1</div>";
        return;
      }
      switch(ctype) {
        case "New Project":
          // step2_newProject => event date, address, times
          renderNewProjectBase();
          return;
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
    var qBtn = document.createElement("button");
    qBtn.textContent = "Qualify Now";
    qBtn.style.marginTop = "20px";
    qBtn.onclick = function(){
      answers["qualification_ctm"] = "Qualified";
      alert("Marked as Qualified!");
    };
    multiStepContainer.appendChild(qBtn);

  } else if (stepIndex===25) {
    // advanced sales
    renderQuestionArray(questionsData.step2p5_salesAdvanced || [], multiStepContainer);

  } else if (stepIndex===3) {
    // preview
    renderQuestionArray(questionsData.stepPreview, multiStepContainer);

  } else if (stepIndex===4) {
    // final
    renderQuestionArray(questionsData.stepFinal, multiStepContainer);
  }

  // init Google Maps for "event_street_ctm" if present
  var streetInput = multiStepContainer.querySelector("[name='event_street_ctm']");
  if (streetInput) {
    initAutocompleteFor(streetInput);
  }
}

// RENDER step2_newProject
function renderNewProjectBase(){
  // event date, address, times, delivery setup
  renderQuestionArray(questionsData.step2_newProject, multiStepContainer);

  var btn = document.createElement("button");
  btn.textContent = "Next step → Select Services";
  btn.style.marginTop = "20px";
  btn.onclick = function(){
    collectAnswers();
    renderNewProjectServiceChoice();
  };
  multiStepContainer.appendChild(btn);
}

// Step2 -> choose services
function renderNewProjectServiceChoice(){
  multiStepContainer.innerHTML = 
    "<h3>New Project - Services</h3>" +
    "<p>Select which services the client wants. Then click 'Load Service Questions'.</p>" +
    "<div class='question-block'>" +
      "<label><input type='checkbox' name='svc' value='liveBand'> Live Band</label><br/>" +
      "<label><input type='checkbox' name='svc' value='stageRental'> Stage Rental</label><br/>" +
      "<label><input type='checkbox' name='svc' value='karaoke'> Karaoke</label><br/>" +
      "<label><input type='checkbox' name='svc' value='ledScreen'> LED Screen</label><br/>" +
      "<label><input type='checkbox' name='svc' value='audio'> Audio</label><br/>" +
      "<label><input type='checkbox' name='svc' value='tvRental'> TV Rental</label><br/>" +
      "<label><input type='checkbox' name='svc' value='stepRepeat'> Step & Repeat / Red Carpet</label><br/>" +
      "<label><input type='checkbox' name='svc' value='trussRental'> Truss Rental</label><br/>" +
      "<label><input type='checkbox' name='svc' value='pipeDrape'> Pipe & Drape</label><br/>" +
    "</div>" +
    "<button id='svcNextBtn'>Load Service Questions</button>";

  var b = document.getElementById("svcNextBtn");
  b.addEventListener("click", function(){
    var checks = multiStepContainer.querySelectorAll("input[name='svc']:checked");
    chosenServices = Array.from(checks).map(function(c){ return c.value; });
    renderServicesQuestions();
  });
}

// Render multiple chosen services
async function renderServicesQuestions(){
  multiStepContainer.innerHTML = 
    "<h3>Service Details</h3>" +
    "<div id='servicesContainer'></div>" +
    "<button id='goToStep3Btn'>Next (Logistics / Step3)</button>";
  var svcParent = document.getElementById("servicesContainer");

  for (var i=0; i<chosenServices.length; i++){
    var svc = chosenServices[i];
    var url = servicesIndex[svc];
    if (!url){
      var p = document.createElement("p");
      p.style.color = "red";
      p.textContent = "No JSON for service: " + svc;
      svcParent.appendChild(p);
      continue;
    }
    try {
      var resp = await fetch(url);
      var arr = await resp.json();
      var h4 = document.createElement("h4");
      h4.textContent = "=== " + svc + " ===";
      svcParent.appendChild(h4);

      arr.forEach(function(q){
        renderServiceQ(q, svcParent);
      });
    } catch(e) {
      console.error("Error loading", url, e);
      var p2 = document.createElement("p");
      p2.style.color="red";
      p2.textContent = "Error loading " + svc;
      svcParent.appendChild(p2);
    }
  }

  var goBtn = document.getElementById("goToStep3Btn");
  goBtn.addEventListener("click", function(){
    collectAnswers();
    step=3; // go preview or advanced, your choice
    renderStep(step);
  });
}

// Render single question from service JSON (liveBand.json etc.)
function renderServiceQ(q, parentEl){
  var block = document.createElement("div");
  block.className = "question-block";

  if (q.type==="label"){
    var p = document.createElement("p");
    p.textContent = (q.id||"") + ": " + q.text;
    block.appendChild(p);
  }
  else if (["text","date","email","number"].indexOf(q.type)>=0){
    var lbl = document.createElement("label");
    lbl.textContent = (q.id||"") + " " + (q.label||"");
    block.appendChild(lbl);
    var inp = document.createElement("input");
    inp.type = q.type;
    inp.name = q.name;
    block.appendChild(inp);
  }
  else if (q.type==="checkbox"){
    var p2 = document.createElement("p");
    p2.textContent = (q.id||"") + ": " + (q.label||"");
    block.appendChild(p2);

    q.options.forEach(function(opt){
      var l = document.createElement("label");
      var c = document.createElement("input");
      c.type="checkbox";
      c.name=q.name;
      c.value=opt;
      l.appendChild(c);
      l.appendChild(document.createTextNode(opt));
      block.appendChild(l);
      block.appendChild(document.createElement("br"));
    });
  }
  else if (q.type==="checkbox-multi"){
    var p3 = document.createElement("p");
    p3.textContent = (q.id||"") + ": " + (q.label||"");
    block.appendChild(p3);

    q.options.forEach(function(opt){
      var l2 = document.createElement("label");
      var c2 = document.createElement("input");
      c2.type="checkbox";
      c2.name = q.name + "[]";
      c2.value=opt;
      l2.appendChild(c2);
      l2.appendChild(document.createTextNode(opt));
      block.appendChild(l2);
      block.appendChild(document.createElement("br"));
    });
  }
  else if (q.type==="select"){
    var p4 = document.createElement("p");
    p4.textContent = (q.id||"") + ": " + (q.label||"");
    block.appendChild(p4);

    var sel = document.createElement("select");
    sel.name = q.name;
    if (!q.multi){
      var emptyOp = document.createElement("option");
      emptyOp.value="";
      emptyOp.textContent="-- select --";
      sel.appendChild(emptyOp);
    }
    q.options.forEach(function(opt){
      var oEl = document.createElement("option");
      oEl.value = opt;
      oEl.textContent = opt;
      sel.appendChild(oEl);
    });
    block.appendChild(sel);
  }
  else if (q.type==="conditional"){
    if (q.blocks){
      q.blocks.forEach(function(subQ){
        renderServiceQ(subQ, block);
      });
    }
  }
  else {
    var warn = document.createElement("p");
    warn.style.color="red";
    warn.textContent = "Unsupported type: " + q.type;
    block.appendChild(warn);
  }

  parentEl.appendChild(block);
}

// ----- RENDER standard inbound/outbound questions from questions.json -----
function renderQuestionArray(arr, parentEl){
  arr.forEach(function(q){
    var block = document.createElement("div");
    block.className = "question-block";

    if (q.label){
      var lab = document.createElement("label");
      lab.textContent = q.label;
      block.appendChild(lab);
    }

    // If preview
    if (q.name==="_summary_"){
      block.innerHTML += generatePreviewHtml();
      parentEl.appendChild(block);
      return;
    }

    var el = null;
    switch(q.type){
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
        if (!q.multi){
          var optEmpty = document.createElement("option");
          optEmpty.value="";
          optEmpty.textContent="-- select --";
          el.appendChild(optEmpty);
        }
        q.options.forEach(function(opt){
          var opEl = document.createElement("option");
          opEl.value=opt;
          opEl.textContent=opt;
          if(q.multi && Array.isArray(answers[q.name]) && answers[q.name].indexOf(opt)>=0){
            opEl.selected = true;
          }
          else if(!q.multi && answers[q.name]===opt){
            opEl.selected = true;
          }
          el.appendChild(opEl);
        });
        if(q.multi) el.multiple = true;
        break;
      default:
        block.innerHTML += "<p style='color:red;'>Unsupported type: " + q.type + "</p>";
    }

    if (el) block.appendChild(el);
    parentEl.appendChild(block);
  });
}

// ---------- COLLECT / VALIDATE ----------
function collectAnswers(){
  var els = multiStepContainer.querySelectorAll("input, select, textarea");
  els.forEach(function(el){
    if(!el.name) return;
    if(el.name.endsWith("[]")){
      var base = el.name.slice(0, -2);
      if(!answers[base]) answers[base] = [];
      if(el.checked) answers[base].push(el.value);
    }
    else if(el.type==="checkbox"){
      if(el.checked){
        if(!answers[el.name]) answers[el.name] = [];
        answers[el.name].push(el.value);
      }
    }
    else {
      answers[el.name] = el.value;
    }
  });
}

function validateStep(st){
  if(st===1 && answers.flow_type==="Inbound"){
    var nm = getValue("contact_name");
    if(!nm){
      alert("Client Name is required for inbound calls!");
      return false;
    }
  }
  return true;
}

function getValue(n){
  var el = multiStepContainer.querySelector("[name='" + n + "']");
  if(!el) return "";
  if(el.multiple){
    return Array.from(el.selectedOptions).map(function(o){ return o.value; });
  }
  return el.value;
}

function generatePreviewHtml(){
  var html = "<ul>";
  Object.entries(answers).forEach(function(entry){
    var k = entry[0];
    var v = entry[1];
    if(Array.isArray(v)){
      html += "<li><strong>" + k + ":</strong> " + v.join(", ") + "</li>";
    } else {
      html += "<li><strong>" + k + ":</strong> " + v + "</li>";
    }
  });
  html += "</ul>";
  return html;
}

function updateProgress(st){
  var pct = Math.round(((st-1)/(4-1))*100);
  if(progressBarEl){
    progressBarEl.style.width = pct + "%";
  }
}

// nav
backBtn.addEventListener("click", function(){
  collectAnswers();
  if(step===25){
    step=2;
  } else {
    step--;
    if(step<1) step=1;
  }
  renderStep(step);
});
nextBtn.addEventListener("click", function(){
  if(!validateStep(step)) return;
  collectAnswers();
  if(step===2 && answers.flow_type==="Inbound" && answers.call_type_ctm==="New Project"){
    // after finishing base Q => advanced
    step=25;
    renderStep(step);
    return;
  }
  step++;
  if(step>4) step=4;
  renderStep(step);
});
previewBtn.addEventListener("click", function(){
  collectAnswers();
  step=3;
  renderStep(step);
});
submitBtn.addEventListener("click", onSubmit);

function onSubmit(){
  if(!validateStep(step)) return;
  collectAnswers();
  var q = answers["qualification_ctm"];
  if(!q || q===""){
    alert("Please select final qualification (or use 'Qualify Now').");
    return;
  }
  console.log("FINAL =>", answers);
  addDoc(collection(db, "responses"), answers)
    .then(function(docRef){
      alert("Saved with ID: " + docRef.id);
      // location.reload();
    })
    .catch(function(err){
      alert("Error saving: " + err);
    });
}
