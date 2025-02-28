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
    if (validateStep1()) {
        showStep(currentStep + 1);
    }
};

window.prevStep = function() {
    showStep(currentStep - 1);
};

window.validateStep1 = function() {
    let isValid = true;
    let requiredFields = ["client_name", "client_status", "event_type", "number_of_attendees"];

    requiredFields.forEach(id => {
        let field = document.getElementById(id);
        if (!field.value) {
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

window.toggleStageDetails = function() {
    let stageCheckbox = document.querySelector('input[name="services"][value="Stage"]');
    let stageDetails = document.getElementById("stage-details");
    stageDetails.style.display = stageCheckbox.checked ? "block" : "none";
};

document.addEventListener("DOMContentLoaded", () => {
    toggleStageDetails(); // Скрыть поле при загрузке страницы
    document.querySelector('input[name="services"][value="Stage"]').addEventListener("change", toggleStageDetails);
});

window.submitForm = async function () {
    const formData = {
        client_name: document.getElementById('client_name').value,
        company_name: document.getElementById('company_name').value,
        client_phone: document.getElementById('client_phone').value,
        client_status: document.getElementById('client_status').value,
        event_type: document.getElementById('event_type').value,
        number_of_attendees: document.getElementById('number_of_attendees').value,
        requested_services: Array.from(document.querySelectorAll('input[name="services"]:checked')).map(e => e.value),
        stage_size: document.getElementById('stage_size')?.value || "",
        rehearsal: document.querySelector('input[name="rehearsal"]:checked')?.value || "No",
        venue_type: document.getElementById('venue_type').value,
        client_budget: document.getElementById('client_budget').value,
        loading_path: document.getElementById('loading_path').value,
        power: document.getElementById('power').value,
        contract_terms: document.getElementById('contract_terms').checked,
        special_requests: document.getElementById('special_requests').value
    };

    try {
        await addDoc(collection(db, "event_inquiries"), formData);
        alert("Form submitted successfully!");
        location.reload();
    } catch (error) {
        console.error("Error writing document: ", error);
        alert("Error submitting form.");
    }
};
