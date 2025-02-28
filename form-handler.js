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
    showStep(currentStep + 1);
};

window.prevStep = function() {
    showStep(currentStep - 1);
};

window.submitForm = async function () {
    const formData = {
        event_purpose: document.getElementById('event_purpose').value,
        attendees: document.getElementById('attendees').value,
        microphones: Array.from(document.querySelectorAll('input[name="microphones"]:checked')).map(e => e.value),
        rehearsal: document.querySelector('input[name="rehearsal"]:checked')?.value || "No",
        sound_system: document.getElementById('sound_system').value,
        venue_power: document.getElementById('venue_power').value,
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
