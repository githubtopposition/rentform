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
