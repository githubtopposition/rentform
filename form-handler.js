import { db } from "./firebase-config.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { initAutocompleteFor } from "./maps-config.js";

const multiStepContainer = document.getElementById("multiStepContainer");
const backBtn = document.getElementById("backBtn");
const nextBtn = document.getElementById("nextBtn");
const previewBtn = document.getElementById("previewBtn");
const submitBtn = document.getElementById("submitBtn");
const progressBarEl = document.querySelector("#progressBar .progress");

// We'll create a floating qualification block:
let qualificationDiv = null; // later

let questionsData = null;
let servicesIndex = null;
let step = 1;
let answers = {};
const totalSteps = 5;

document.addEventListener("DOMContentLoaded", function(){
  // create floating block
  qualificationDiv = document.createElement("div");
  qualificationDiv.id = "qualificationBlock";
  qualificationDiv.innerHTML = `
    <h4>Qualify This Lead</h4>
    <select name="qualification_ctm">
      <option value="">-- select --</option>
      <option value="Qualified">Qualified</option>
      <option value="Not Qualified">Not Qualified</option>
    </select>
    <button id="qualifyNowBtn">Set Now</button>
  `;
  qualificationDiv.style.display = "none"; // hidden by default
  document.body.appendChild(qualificationDiv);

  const qualifyNowBtn = document.getElementById("qualifyNowBtn");
  qualifyNowBtn.addEventListener("click", function(){
    const sel = qualificationDiv.querySelector("select[name='qualification_ctm']");
    const val = sel.value;
    if(!val){
      alert("Please choose Qualified or Not Qualified");
      return;
    }
    answers["qualification_ctm"] = val;
    alert("Lead is now: " + val);
  });
});

// load JSON
fetch("./questions.json")
  .then(r=>r.json())
  .then(data => {
    questionsData = data;
    answers.flow_type = "Inbound"; // default
    return fetch("./data/services-index.json");
  })
  .then(r=>r.json())
  .then(idx => {
    servicesIndex = idx;
    console.log("Loaded servicesIndex:", servicesIndex);
    renderStep(step);
  })
  .catch(err => {
    console.error("Error:", err);
    multiStepContainer.innerHTML="<p class='alert'>Failed to load JSON</p>";
  });

function renderStep(stepIndex){
  multiStepContainer.innerHTML="";
  backBtn.style.display=(stepIndex>1)?"inline-block":"none";
  nextBtn.style.display=(stepIndex<3)?"inline-block":"none";
  previewBtn.style.display=(stepIndex===3)?"inline-block":"none";
  submitBtn.style.display=(stepIndex===4)?"inline-block":"none";

  updateProgress(stepIndex);

  // decide if we show the floating qualification block
  // let's say we show it on steps >=2 if call_type=New Project
  let showQual = false;
  if(stepIndex>=2 && answers.call_type_ctm==="New Project"){
    showQual=true;
  }
  qualificationDiv.style.display = showQual ? "block" : "none";

  if(stepIndex===1){
    if(answers.flow_type==="Inbound"){
      renderQuestionArray(questionsData.step1_inbound, multiStepContainer);
      let switchBtn = document.createElement("button");
      switchBtn.textContent="Switch to Outbound?";
      switchBtn.style.marginTop="20px";
      switchBtn.onclick=()=>{ answers.flow_type="Outbound"; renderStep(1); };
      multiStepContainer.appendChild(switchBtn);
    } else {
      renderQuestionArray(questionsData.step1_outbound, multiStepContainer);
    }
  }
  else if(stepIndex===2){
    if(answers.flow_type==="Inbound"){
      let ctype=answers.call_type_ctm||"";
      if(!ctype){
        multiStepContainer.innerHTML="<div class='alert'>Select call_type in step1</div>";
        return;
      }
      if(ctype==="New Project"){
        renderNewProjectAll();
        return;
      }
      else if(ctype==="Existing Project"){
        renderQuestionArray(questionsData.step2_existing, multiStepContainer);
      }
      else if(ctype==="Vendor"){
        renderQuestionArray(questionsData.step2_vendor, multiStepContainer);
      }
      else if(ctype==="Technician"){
        renderQuestionArray(questionsData.step2_technician, multiStepContainer);
      }
      else if(ctype==="Complaint"){
        renderQuestionArray(questionsData.step2_complaint, multiStepContainer);
      }
      else if(ctype==="Promotion/Sales/Spam Calls"){
        multiStepContainer.innerHTML="<div class='alert'>Marked as spam/promo. No further questions.</div>";
        return;
      }
      else if(ctype==="HR Inquiry"){
        renderQuestionArray(questionsData.step2_hr, multiStepContainer);
      }
      else if(ctype==="Unknown"){
        renderQuestionArray(questionsData.step2_unknown, multiStepContainer);
      }
      else {
        multiStepContainer.innerHTML="<p>No match for call type</p>";
        return;
      }
    } else {
      // outbound => step3
      renderQuestionArray(questionsData.step3_outbound, multiStepContainer);
    }

  }
  else if(stepIndex===25){
    // advanced
    renderQuestionArray(questionsData.step2p5_salesAdvanced || [], multiStepContainer);
  }
  else if(stepIndex===3){
    renderQuestionArray(questionsData.stepPreview, multiStepContainer);
  }
  else if(stepIndex===4){
    renderQuestionArray(questionsData.stepFinal, multiStepContainer);
  }

  // Google Autocomplete
  let streetInput=multiStepContainer.querySelector("[name='event_street_ctm']");
  if(streetInput){
    initAutocompleteFor(streetInput);
  }
}

// Step2 newProject => event info + services
function renderNewProjectAll(){
  // Event info
  renderQuestionArray(questionsData.step2_newProject, multiStepContainer);

  // Then load each chosen service
  let chosen = answers.requested_services_ctm || [];
  if(!Array.isArray(chosen)) chosen=[];

  let svcWrap = document.createElement("div");
  svcWrap.innerHTML="<h3>Chosen Services</h3>";
  multiStepContainer.appendChild(svcWrap);

  chosen.forEach(opt=>{
    let key=mapServiceKey(opt);
    if(!key){
      let p=document.createElement("p");
      p.style.color="red";
      p.textContent="No serviceIndex for: "+opt;
      svcWrap.appendChild(p);
      return;
    }
    loadServiceJson(key, svcWrap);
  });

  let nextBtn2=document.createElement("button");
  nextBtn2.textContent="Done with Step2 => go Next";
  nextBtn2.style.marginTop="20px";
  nextBtn2.onclick=function(){
    collectAnswers();
    step=25; // or 3
    renderStep(step);
  };
  multiStepContainer.appendChild(nextBtn2);
}

function mapServiceKey(opt){
  // Just rename them to match your servicesIndex keys
  let dict={
    "Stage":"stageRental",
    "Audio":"audio",
    "TVs":"tvRental",
    "Projections & Screens":"???",
    "LED Wall":"ledScreen",
    "Live Stream":"???",
    "Step & Repeat":"stepRepeat",
    "Lighting":"???",
    "Pipe & Drape":"pipeDrape",
    "Karaoke":"karaoke",
    "Outdoor Movie":"???",
    "Full Event Production":"???",
    "Other":"???"
  };
  return dict[opt]||null;
}

async function loadServiceJson(key, parentEl){
  let url=servicesIndex[key];
  if(!url){
    let p1=document.createElement("p");
    p1.style.color="red";
    p1.textContent="No JSON for key: "+key;
    parentEl.appendChild(p1);
    return;
  }
  try{
    let resp=await fetch(url);
    let arr=await resp.json();
    let h4=document.createElement("h4");
    h4.textContent="=== "+key+" ===";
    parentEl.appendChild(h4);

    arr.forEach(q=>{
      renderServiceQ(q,parentEl);
    });
  } catch(e){
    let p2=document.createElement("p");
    p2.style.color="red";
    p2.textContent="Error loading service "+key+" => "+e;
    parentEl.appendChild(p2);
  }
}

function renderServiceQ(q,parentEl){
  let block=document.createElement("div");
  block.className="question-block";

  // if scriptText / hint
  if(q.scriptText){
    let hint=document.createElement("div");
    hint.className="script-hint";
    hint.textContent=q.scriptText;
    block.appendChild(hint);
  }

  if(q.type==="label"){
    let p=document.createElement("p");
    p.textContent=(q.id||"")+": "+q.text;
    block.appendChild(p);
  }
  else if(["text","date","email","number"].indexOf(q.type)>=0){
    let lbl=document.createElement("label");
    lbl.textContent=(q.id||"")+" "+(q.label||"");
    block.appendChild(lbl);
    let inp=document.createElement("input");
    inp.type=q.type;
    inp.name=q.name;
    block.appendChild(inp);
  }
  else if(q.type==="checkbox"){
    let p2=document.createElement("p");
    p2.textContent=(q.id||"")+": "+(q.label||"");
    block.appendChild(p2);
    let cList=document.createElement("div");
    cList.className="checkbox-list";
    block.appendChild(cList);

    q.options.forEach(opt=>{
      let l=document.createElement("label");
      let c=document.createElement("input");
      c.type="checkbox";
      c.name=q.name;
      c.value=opt;
      l.appendChild(c);
      l.appendChild(document.createTextNode(opt));
      cList.appendChild(l);
    });
  }
  else if(q.type==="checkbox-multi"){
    let p3=document.createElement("p");
    p3.textContent=(q.id||"")+": "+(q.label||"");
    block.appendChild(p3);
    let cList=document.createElement("div");
    cList.className="checkbox-list";
    block.appendChild(cList);

    q.options.forEach(opt=>{
      let l2=document.createElement("label");
      let c2=document.createElement("input");
      c2.type="checkbox";
      c2.name=q.name+"[]";
      c2.value=opt;
      l2.appendChild(c2);
      l2.appendChild(document.createTextNode(opt));
      cList.appendChild(l2);
    });
  }
  else if(q.type==="select"){
    let p4=document.createElement("p");
    p4.textContent=(q.id||"")+": "+(q.label||"");
    block.appendChild(p4);

    let sel=document.createElement("select");
    sel.name=q.name;
    let emptyOp=document.createElement("option");
    emptyOp.value="";
    emptyOp.textContent="-- select --";
    sel.appendChild(emptyOp);

    q.options.forEach(opt=>{
      let oEl=document.createElement("option");
      oEl.value=opt;
      oEl.textContent=opt;
      sel.appendChild(oEl);
    });
    block.appendChild(sel);
  }
  else {
    let warn=document.createElement("p");
    warn.style.color="red";
    warn.textContent="Unsupported type: "+q.type;
    block.appendChild(warn);
  }

  parentEl.appendChild(block);
}

function renderQuestionArray(arr, parentEl){
  arr.forEach(q=>{
    let block=document.createElement("div");
    block.className="question-block";

    // Show script hint if present
    if(q.scriptText){
      let hint=document.createElement("div");
      hint.className="script-hint";
      hint.textContent=q.scriptText;
      block.appendChild(hint);
    }

    // label
    if(q.label && q.type!=="label"){
      let lab=document.createElement("label");
      lab.textContent=q.label;
      block.appendChild(lab);
    }

    // special case: _summary_
    if(q.name==="_summary_"){
      block.innerHTML += generatePreviewHtml();
      parentEl.appendChild(block);
      return;
    }

    let el=null;
    switch(q.type){
      case "text":
      case "date":
      case "email":
        el=document.createElement("input");
        el.type=q.type;
        el.name=q.name;
        el.value=answers[q.name]||"";
        break;
      case "textarea":
        el=document.createElement("textarea");
        el.name=q.name;
        el.value=answers[q.name]||"";
        el.rows=3;
        break;
      case "select":
        el=document.createElement("select");
        el.name=q.name;
        {
          let emptyOp=document.createElement("option");
          emptyOp.value="";
          emptyOp.textContent="-- select --";
          el.appendChild(emptyOp);
        }
        q.options.forEach(opt=>{
          let oEl=document.createElement("option");
          oEl.value=opt;
          oEl.textContent=opt;
          el.appendChild(oEl);
        });
        break;
      case "checkbox-multi":
        // We'll do a similar approach
        let p=document.createElement("p");
        p.textContent="(multiple checkboxes)";
        block.appendChild(p);

        let cList=document.createElement("div");
        cList.className="checkbox-list";
        block.appendChild(cList);

        q.options.forEach(opt=>{
          let lb=document.createElement("label");
          let cc=document.createElement("input");
          cc.type="checkbox";
          cc.name=q.name+"[]";
          cc.value=opt;
          lb.appendChild(cc);
          lb.appendChild(document.createTextNode(opt));
          cList.appendChild(lb);
        });
        parentEl.appendChild(block);
        return; // done
      case "label":
        // if we want just a text label
        let pLab=document.createElement("p");
        pLab.textContent=q.label;
        block.appendChild(pLab);
        parentEl.appendChild(block);
        return;
      default:
        block.innerHTML+="<p style='color:red;'>Unsupported type: "+q.type+"</p>";
    }
    if(el) block.appendChild(el);

    parentEl.appendChild(block);
  });
}

function collectAnswers(){
  let els=multiStepContainer.querySelectorAll("input,select,textarea");
  els.forEach(el=>{
    if(!el.name) return;
    if(el.name.endsWith("[]")){
      let base=el.name.slice(0,-2);
      if(!answers[base]) answers[base]=[];
      if(el.checked) answers[base].push(el.value);
    }
    else if(el.type==="checkbox"){
      if(el.checked){
        if(!answers[el.name]) answers[el.name]=[];
        answers[el.name].push(el.value);
      }
    }
    else {
      answers[el.name]=el.value;
    }
  });
}

function validateStep(st){
  if(st===1 && answers.flow_type==="Inbound"){
    let nm=getValue("contact_name");
    if(!nm){
      alert("Client Name required!");
      return false;
    }
  }
  return true;
}
function getValue(n){
  let el=multiStepContainer.querySelector("[name='"+n+"']");
  if(!el) return "";
  if(el.multiple){
    return Array.from(el.selectedOptions).map(o=>o.value);
  }
  return el.value;
}
function generatePreviewHtml(){
  let html="<ul>";
  Object.entries(answers).forEach(([k,v])=>{
    if(Array.isArray(v)){
      html+="<li><strong>"+k+":</strong> "+v.join(", ")+"</li>";
    } else {
      html+="<li><strong>"+k+":</strong> "+v+"</li>";
    }
  });
  html+="</ul>";
  return html;
}
function updateProgress(st){
  let pct=Math.round(((st-1)/(4-1))*100);
  if(progressBarEl){
    progressBarEl.style.width=pct+"%";
  }
}

backBtn.addEventListener("click",()=>{
  collectAnswers();
  if(step===25) step=2;
  else step--;
  if(step<1) step=1;
  renderStep(step);
});
nextBtn.addEventListener("click",()=>{
  if(!validateStep(step))return;
  collectAnswers();
  if(step===2 && answers.flow_type==="Inbound" && answers.call_type_ctm==="New Project"){
    step=25; 
    renderStep(step);
    return;
  }
  step++;
  if(step>4) step=4;
  renderStep(step);
});
previewBtn.addEventListener("click",()=>{
  collectAnswers();
  step=3;
  renderStep(step);
});
submitBtn.addEventListener("click",onSubmit);

function onSubmit(){
  if(!validateStep(step))return;
  collectAnswers();
  let q=answers["qualification_ctm"]||"";
  if(!q){
    alert("Please finalize qualification or use the floating block!");
    return;
  }
  console.log("FINAL =>",answers);
  addDoc(collection(db,"responses"), answers)
    .then(docRef=>{
      alert("Saved with ID: "+docRef.id);
    })
    .catch(err=>{
      alert("Error saving => "+err);
    });
}
