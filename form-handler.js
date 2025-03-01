// form-handler.js - Form Logic & Firebase Submission

import { db } from "./firebase-config.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

let currentStep = 1;

function showStep(step) {
    document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
    document.getElementById(`step-${step}`).classList.add('active');
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
    let requiredFields = ["client_name", "client_status", "event_type", "number_of_attendees"];
    requiredFields.forEach(id => {
        let field = document.getElementById(id);
        if (!field || !field.value) {
            field.style.border = "2px solid red";
            isValid = false;
        } else {
            field.style.border = "1px solid #ccc";
        }
    });
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

window.toggleStageDetails = function() {
    let stageCheckbox = document.getElementById("service_stage");
    let stageDetails = document.getElementById("stage-details");
    
    if (stageCheckbox && stageDetails) { 
        stageDetails.style.display = stageCheckbox.checked ? "block" : "none";
    }
};

document.addEventListener("DOMContentLoaded", () => {
    toggleStageDetails();  // Скрыть поле при загрузке страницы
    let stageCheckbox = document.getElementById("service_stage");
    if (stageCheckbox) {
        stageCheckbox.addEventListener("change", toggleStageDetails);
    }
});

window.submitForm = async function () {
    const formData = {
        client_name: document.getElementById('client_name')?.value || "",
        company_name: document.getElementById('company_name')?.value || "",
        client_phone: document.getElementById('client_phone')?.value || "",
        client_status: document.getElementById('client_status')?.value || "",
        event_type: document.getElementById('event_type')?.value || "",
        number_of_attendees: document.getElementById('number_of_attendees')?.value || "",
        requested_services: Array.from(document.querySelectorAll('input[name="services"]:checked')).map(e => e.value),
        venue_type: document.getElementById('venue_type')?.value || "",
        client_budget: document.getElementById('client_budget')?.value || "",
        loading_path: document.getElementById('loading_path')?.value || "",
        power: document.getElementById('power')?.value || "",
        contract_terms: document.getElementById('contract_terms')?.checked || false,
        special_requests: document.getElementById('special_requests')?.value || ""
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
