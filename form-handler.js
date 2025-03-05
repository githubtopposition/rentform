// form-handler.js - Dynamic Form with JSON Questions & Firebase

import { db } from "./firebase-config.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

async function loadQuestions() {
    try {
        let response = await fetch("questions.json");
        let questionsData = await response.json();
        generateForm(questionsData);
    } catch (error) {
        console.error("Error loading questions.json", error);
    }
}

document.addEventListener("DOMContentLoaded", loadQuestions);

function generateForm(questionsData) {
    let formContainer = document.getElementById("dynamic-form");
    formContainer.innerHTML = "";

    Object.keys(questionsData).forEach(step => {
        let stepData = questionsData[step];
        let stepDiv = document.createElement("div");
        stepDiv.classList.add("step", "hidden");
        stepDiv.id = step;
        
        let title = document.createElement("h2");
        title.textContent = stepData.title;
        stepDiv.appendChild(title);
        
        stepData.questions.forEach(question => {
            let label = document.createElement("label");
            label.setAttribute("for", question.id);
            label.textContent = question.label;
            stepDiv.appendChild(label);
            
            let input;
            if (question.type === "text") {
                input = document.createElement("input");
                input.type = "text";
            } else if (question.type === "select") {
                input = document.createElement("select");
                question.options.forEach(option => {
                    let opt = document.createElement("option");
                    opt.value = option;
                    opt.textContent = option;
                    input.appendChild(opt);
                });
            } else if (question.type === "checkbox") {
                input = document.createElement("div");
                question.options.forEach(option => {
                    let checkbox = document.createElement("input");
                    checkbox.type = "checkbox";
                    checkbox.name = question.id;
                    checkbox.value = option;
                    let checkboxLabel = document.createElement("label");
                    checkboxLabel.textContent = option;
                    checkboxLabel.appendChild(checkbox);
                    input.appendChild(checkboxLabel);
                });
            }
            input.id = question.id;
            if (question.required) input.required = true;
            stepDiv.appendChild(input);
        });
        
        formContainer.appendChild(stepDiv);
    });
}

window.submitForm = async function () {
    const formData = {};
    document.querySelectorAll(".step input, .step select").forEach(input => {
        if (input.type === "checkbox") {
            if (!formData[input.name]) formData[input.name] = [];
            if (input.checked) formData[input.name].push(input.value);
        } else {
            formData[input.id] = input.value || "";
        }
    });
    
    try {
        await addDoc(collection(db, "event_inquiries"), formData);
        alert("Form submitted successfully!");
        location.reload();
    } catch (error) {
        console.error("Error writing document: ", error);
        alert("Error submitting form.");
    }
};
