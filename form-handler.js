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

function renderStep(stepIndex){
  multiStepContainer.innerHTML = "";
  backBtn.style.display    = (stepIndex>1) ? "inline-block":"none";
  nextBtn.style.display    = (stepIndex<3) ? "inline-block":"none";
  previewBtn.style.display = (stepIndex===3) ? "inline-block":"none";
  submitBtn.style.display  = (stepIndex===4) ? "inline-block":"none";

  updateProgress(stepIndex);

  if(stepIndex===1){
    // Step1 inbound
    if(answers.flow_type==="Inbound"){
      renderQuestionArray(questionsData.step1_inbound, multiStepContainer);
      var switchBtn = document.createElement("button");
      switchBtn.textContent = "Switch to Outbound?";
      switchBtn.style.marginTop="20px";
      switchBtn.onclick = function(){
        answers.flow_type="Outbound";
        renderStep(1);
      };
      multiStepContainer.appendChild(switchBtn);
    } else {
      // Outbound
      renderQuestionArray(questionsData.step1_outbound, multiStepContainer);
    }

  } else if(stepIndex===2){
    // read call_type
    if(answers.flow_type==="Inbound"){
      var ctype = answers.call_type_ctm || "";
      if(!ctype){
        multiStepContainer.innerHTML = "<div class='alert'>Please select call type on Step1.</div>";
        return;
      }
      if(ctype==="New Project"){
        // Step2 for new project => unify event info + service details
        renderNewProjectAll();
        return;
      } else if(ctype==="Existing Project"){
        renderQuestionArray(questionsData.step2_existing, multiStepContainer);
      } else if(ctype==="Vendor"){
        renderQuestionArray(questionsData.step2_vendor, multiStepContainer);
      } else if(ctype==="Technician"){
        renderQuestionArray(questionsData.step2_technician, multiStepContainer);
      } else if(ctype==="Complaint"){
        renderQuestionArray(questionsData.step2_complaint, multiStepContainer);
      } else if(ctype==="Promotion/Spam"){
        multiStepContainer.innerHTML = "<div class='alert'>Marked as spam. No more details needed.</div>";
        return;
      } else if(ctype==="HR Inquiry"){
        renderQuestionArray(questionsData.step2_hr, multiStepContainer);
      } else if(ctype==="Unknown"){
        renderQuestionArray(questionsData.step2_unknown, multiStepContainer);
      } else {
        multiStepContainer.innerHTML = "<p>No match for call type.</p>";
        return;
      }
    } else {
      // Outbound => step3
      renderQuestionArray(questionsData.step3_outbound, multiStepContainer);
    }

    // optional "Qualify Now"
    var qBtn = document.createElement("button");
    qBtn.textContent = "Qualify Now";
    qBtn.style.marginTop="20px";
    qBtn.onclick = function(){
      answers["qualification_ctm"]="Qualified";
      alert("Marked as Qualified!");
    };
    multiStepContainer.appendChild(qBtn);

  } else if(stepIndex===25){
    // advanced
    renderQuestionArray(questionsData.step2p5_salesAdvanced||[], multiStepContainer);

  } else if(stepIndex===3){
    // preview
    renderQuestionArray(questionsData.stepPreview, multiStepContainer);

  } else if(stepIndex===4){
    // final
    renderQuestionArray(questionsData.stepFinal, multiStepContainer);
  }

  var streetInput = multiStepContainer.querySelector("[name='event_street_ctm']");
  if(streetInput){
    initAutocompleteFor(streetInput);
  }
}

// render step2 for new project => event info + service detail
function renderNewProjectAll(){
  // 1) Render step2_newProject
  renderQuestionArray(questionsData.step2_newProject, multiStepContainer);

  // 2) Then load chosen services (from step1 requested_services_ctm)
  var chosen = answers.requested_services_ctm || []; 
  // note: if user didn't pick anything, chosen might be []

  var svcWrap = document.createElement("div");
  svcWrap.innerHTML = "<h3>Chosen Services</h3>";
  multiStepContainer.appendChild(svcWrap);

  // load each service from servicesIndex
  chosen.forEach(function(opt){
    // '1:Stage' or '2:Audio' - we want the key 'stageRental'? You might do a small map
    // But let's assume we do a switch or a dictionary
    var key = mapServiceKey(opt);
    if(!key){
      var pNo = document.createElement("p");
      pNo.style.color="red";
      pNo.textContent = "No JSON for service: " + opt;
      svcWrap.appendChild(pNo);
      return;
    }
    loadServiceJson(key, svcWrap);
  });

  // add a "done" or "go next"
  var nextBtn2 = document.createElement("button");
  nextBtn2.textContent = "Done with Step2 => go Next";
  nextBtn2.style.marginTop="20px";
  nextBtn2.onclick = function(){
    collectAnswers();
    // go step3 or step2.5 as you want
    step=25; // or step=3
    renderStep(step);
  };
  multiStepContainer.appendChild(nextBtn2);
}

// small function to map "1:Stage" -> 'stageRental'
function mapServiceKey(opt){
  // you can build a dictionary
  var dict = {
    "1:Stage":"stageRental",
    "2:Audio":"audio",
    "3:TVs":"tvRental",
    "4:Projections & Screens":"???",
    "5:LED Wall":"ledScreen",
    "6:Live Stream":"???",
    "7:Step & Repeat":"stepRepeat",
    "8:Lighting":"???",
    "9:Pipe&drape":"pipeDrape",
    "10:Karaoke":"karaoke",
    "11:Outdoor movie":"???",
    "12:Full event production":"???",
    "13:Other":"???"
  };
  return dict[opt] || null;
}

async function loadServiceJson(key, parentEl){
  var url = servicesIndex[key];
  if(!url){
    var p1 = document.createElement("p");
    p1.style.color="red";
    p1.textContent = "No serviceIndex URL for key: " + key;
    parentEl.appendChild(p1);
    return;
  }
  try{
    var resp = await fetch(url);
    var arr = await resp.json();
    var h4 = document.createElement("h4");
    h4.textContent = "=== " + key + " ===";
    parentEl.appendChild(h4);

    arr.forEach(function(q){
      renderServiceQ(q, parentEl);
    });
  } catch(e){
    var p2 = document.createElement("p");
    p2.style.color="red";
    p2.textContent = "Error loading service " + key + " => " + e;
    parentEl.appendChild(p2);
  }
}

// same code for renderServiceQ, renderQuestionArray, collectAnswers, etc. 
function renderServiceQ(q, parentEl){
  // same logic as before
  var block = document.createElement("div");
  block.className = "question-block";

  if(q.type==="label"){
    var p = document.createElement("p");
    p.textContent = (q.id||"") + ": " + q.text;
    block.appendChild(p);
  }
  else if(["text","date","email","number"].indexOf(q.type)>=0){
    var lbl = document.createElement("label");
    lbl.textContent = (q.id||"") + " " + (q.label||"");
    block.appendChild(lbl);
    var inp = document.createElement("input");
    inp.type = q.type;
    inp.name = q.name;
    block.appendChild(inp);
  }
  else if(q.type==="checkbox"){
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
  else if(q.type==="checkbox-multi"){
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
  else if(q.type==="select"){
    var p4 = document.createElement("p");
    p4.textContent = (q.id||"") + ": " + (q.label||"");
    block.appendChild(p4);

    var sel = document.createElement("select");
    sel.name = q.name;
    var emptyOp = document.createElement("option");
    emptyOp.value="";
    emptyOp.textContent="-- select --";
    sel.appendChild(emptyOp);

    q.options.forEach(function(opt){
      var oEl = document.createElement("option");
      oEl.value=opt;
      oEl.textContent=opt;
      sel.appendChild(oEl);
    });
    block.appendChild(sel);
  }
  else if(q.type==="conditional"){
    if(q.blocks){
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

function renderQuestionArray(arr, parentEl){
  arr.forEach(function(q){
    var block = document.createElement("div");
    block.className = "question-block";

    if(q.label){
      var lab = document.createElement("label");
      lab.textContent = q.label;
      block.appendChild(lab);
    }
    if(q.name==="_summary_"){
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
        el.value = answers[q.name]||"";
        break;
      case "textarea":
        el = document.createElement("textarea");
        el.name = q.name;
        el.value = answers[q.name]||"";
        el.rows=3;
        break;
      case "select":
        el = document.createElement("select");
        el.name = q.name;
        if(!q.multi){
          var optEmpty = document.createElement("option");
          optEmpty.value="";
          optEmpty.textContent="-- select --";
          el.appendChild(optEmpty);
        }
        q.options.forEach(function(opt){
          var opEl = document.createElement("option");
          opEl.value=opt;
          opEl.textContent=opt;
          el.appendChild(opEl);
        });
        if(q.multi) el.multiple=true;
        break;
      default:
        block.innerHTML += "<p style='color:red;'>Unsupported type: " + q.type + "</p>";
    }

    if(el) block.appendChild(el);
    parentEl.appendChild(block);
  });
}
function collectAnswers(){
  var els = multiStepContainer.querySelectorAll("input, select, textarea");
  els.forEach(function(el){
    if(!el.name) return;
    if(el.name.endsWith("[]")){
      var base = el.name.slice(0,-2);
      if(!answers[base]) answers[base]=[];
      if(el.checked) answers[base].push(el.value);
    }
    else if(el.type==="checkbox"){
      if(el.checked){
        if(!answers[el.name]) answers[el.name]=[];
        answers[el.name].push(el.value);
      }
    } else {
      answers[el.name] = el.value;
    }
  });
}
function validateStep(st){
  if(st===1 && answers.flow_type==="Inbound"){
    var nm = getValue("contact_name");
    if(!nm){
      alert("Client Name required for inbound!");
      return false;
    }
  }
  return true;
}
function getValue(n){
  var el = multiStepContainer.querySelector("[name='"+n+"']");
  if(!el) return "";
  if(el.multiple){
    return Array.from(el.selectedOptions).map(function(o){ return o.value; });
  }
  return el.value;
}
function generatePreviewHtml(){
  var html="<ul>";
  Object.entries(answers).forEach(function(entry){
    var k=entry[0];
    var v=entry[1];
    if(Array.isArray(v)){
      html += "<li><strong>"+k+":</strong> "+v.join(", ")+"</li>";
    } else {
      html += "<li><strong>"+k+":</strong> "+v+"</li>";
    }
  });
  html+="</ul>";
  return html;
}
function updateProgress(st){
  var pct = Math.round(((st-1)/(4-1))*100);
  if(progressBarEl){
    progressBarEl.style.width = pct+"%";
  }
}
// nav
backBtn.addEventListener("click",function(){
  collectAnswers();
  if(step===25){
    step=2;
  } else {
    step--;
    if(step<1) step=1;
  }
  renderStep(step);
});
nextBtn.addEventListener("click",function(){
  if(!validateStep(step)) return;
  collectAnswers();
  if(step===2 && answers.flow_type==="Inbound" && answers.call_type_ctm==="New Project"){
    // done step2 => advanced or step3
    step=25; // or step=3
    renderStep(step);
    return;
  }
  step++;
  if(step>4) step=4;
  renderStep(step);
});
previewBtn.addEventListener("click",function(){
  collectAnswers();
  step=3;
  renderStep(step);
});
submitBtn.addEventListener("click",onSubmit);
function onSubmit(){
  if(!validateStep(step)) return;
  collectAnswers();
  var q = answers["qualification_ctm"];
  if(!q){
    alert("Select final qualification, or 'Qualify Now'.");
    return;
  }
  addDoc(collection(db,"responses"),answers)
    .then(function(docRef){
      alert("Saved with ID: "+docRef.id);
    })
    .catch(function(err){
      alert("Error saving: "+err);
    });
}
