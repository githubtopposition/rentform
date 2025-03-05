function addQuestionToForm(question, container) {
    if (!question.id || !question.type || !question.label) {
        console.warn(`Skipping question - Missing fields in`, question);
        return;
    }
    
    let label = document.createElement("label");
    label.setAttribute("for", question.id); // Устанавливаем связь между label и input
    label.textContent = question.label;
    container.appendChild(label);
    
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
            checkbox.id = `${question.id}_${option.replace(/\s+/g, "_")}`;
            checkbox.name = question.id;
            checkbox.value = option;

            let checkboxLabel = document.createElement("label");
            checkboxLabel.textContent = option;
            checkboxLabel.setAttribute("for", checkbox.id);
            checkboxLabel.appendChild(checkbox);
            
            input.appendChild(checkboxLabel);
        });
    }
    
    input.id = question.id;
    if (question.required) input.required = true;
    container.appendChild(input);
}
