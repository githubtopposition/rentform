// form-handler.js - Form Logic & Firebase Submission

import { db } from "./firebase-config.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

let currentStep = 1;

function showStep(step) {
    let stepElement = document.getElementById(`step-${step}`);
    if (!stepElement) {
        console.error(`Step ${step} not found in DOM.`);
        return;
    }
    
    document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
    stepElement.classList.add('active');
    currentStep = step;
}

window.nextStep = function() {
    if (currentStep === 1 && !validateStep1()) return;
    showStep(currentStep + 1);
};

window.prevStep = function() {
    showStep(currentStep - 1);
};

window.validateStep1 = function() {
    let isValid = true;
    let requiredFields = ["client_name", "event_type"];
    
    requiredFields.forEach(id => {
        let field = document.getElementById(id);
        if (!field || !field.value.trim()) {
            if (field) field.style.border = "2px solid red";
            isValid = false;
        } else {
            field.style.border = "1px solid #ccc";
        }
    });
    
    let servicesChecked = document.querySelectorAll('input[name="services"]:checked').length > 0;
    if (!servicesChecked) {
        alert("Please select at least one Requested Service.");
        return false;
    }
    
    if (!isValid) {
        alert("Please fill in all required fields before proceeding.");
    }
    return isValid;
};

window.validateAndNextStep = function() {
    if (validateStep1()) {
        nextStep();
    }
};

window.toggleServiceQuestions = function() {
    let stageSection = document.getElementById("step-2-stage");
    let audioSection = document.getElementById("step-2-audio");
    let stageCheckbox = document.getElementById("service_stage");
    let audioCheckbox = document.getElementById("service_audio");
    
    if (stageSection) {
        stageSection.classList.toggle("hidden", !stageCheckbox.checked);
    }
    if (audioSection) {
        audioSection.classList.toggle("hidden", !audioCheckbox.checked);
    }
};

document.addEventListener("DOMContentLoaded", () => {
    toggleServiceQuestions();
    document.getElementById("service_stage").addEventListener("change", toggleServiceQuestions);
    document.getElementById("service_audio").addEventListener("change", toggleServiceQuestions);
});

window.submitForm = async function () {
    const formData = {
        client_name: document.getElementById('client_name')?.value.trim() || "",
        event_type: document.getElementById('event_type')?.value || "",
        requested_services: Array.from(document.querySelectorAll('input[name="services"]:checked')).map(e => e.value),
        special_requests: document.getElementById('special_requests')?.value.trim() || ""
    };

    if (document.getElementById("service_stage")?.checked) {
        formData.stage_purpose = document.getElementById('stage_purpose')?.value || "";
        formData.stage_type = document.getElementById('stage_type')?.value || "";
    }

    if (document.getElementById("service_audio")?.checked) {
        formData.audio_purpose = document.getElementById('audio_purpose')?.value || "";
        formData.audio_attendees = document.getElementById('audio_attendees')?.value || "";
    }

    try {
        await addDoc(collection(db, "event_inquiries"), formData);
        alert("Form submitted successfully!");
        location.reload();
    } catch (error) {
        console.error("Error writing document: ", error);
        alert("Error submitting form.");
    }
};
