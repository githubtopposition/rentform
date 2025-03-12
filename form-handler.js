// form-handler.js

/**
 * Initializes the multi-step form logic
 * @param {Object} options - various IDs from index.html
 */
function initMultiStepForm(options) {
  // Grabbing DOM references
  const formContainer = document.getElementById(options.formContainerId);
  const prevBtn = document.getElementById(options.prevBtnId);
  const nextBtn = document.getElementById(options.nextBtnId);
  const submitBtn = document.getElementById(options.submitBtnId);
  const adminBtn = document.getElementById(options.adminBtnId);

  let currentStep = 0;

  // Example steps data
  const stepsData = [
    {
      html: `
        <p>Шаг 1: Основная информация</p>
        <label>Имя: <input type="text" id="fullName" /></label>
      `
    },
    {
      html: `
        <p>Шаг 2: Дополнительно</p>
        <label>Email: <input type="email" id="email" /></label>
      `
    },
    {
      html: `
        <p>Проверьте данные перед отправкой.</p>
        <p>(Здесь обычно показывается всё, что ввёл пользователь.)</p>
      `
    }
  ];

  // Renders current step
  function renderStep() {
    formContainer.innerHTML = stepsData[currentStep].html;
    prevBtn.style.display = (currentStep === 0) ? 'none' : 'inline-block';
    nextBtn.style.display = (currentStep < stepsData.length - 1) ? 'inline-block' : 'none';
    submitBtn.style.display = (currentStep === stepsData.length - 1) ? 'inline-block' : 'none';
  }

  function nextStep() {
    if (currentStep < stepsData.length - 1) {
      currentStep++;
      renderStep();
    }
  }

  function prevStep() {
    if (currentStep > 0) {
      currentStep--;
      renderStep();
    }
  }

  function handleSubmit() {
    // Collect data
    const fullName = document.getElementById('fullName') ? document.getElementById('fullName').value : '';
    const email = document.getElementById('email') ? document.getElementById('email').value : '';

    // Example - just alert or you can do an API call
    alert(`Form submitted!\nName: ${fullName}\nEmail: ${email}`);

    // Here you could do something with CTM API using ctmApiConfig:
    // e.g. call an endpoint or store custom_fields, etc.
    // (Pseudo-code):
    // fetch(`https://api.calltrackingmetrics.com/api/v1/accounts/ACCOUNT_ID/calls.json`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': 'Basic ' + btoa(ctmApiConfig.accessKey + ':' + ctmApiConfig.secretKey),
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({ ... })
    // });
  }

  function handleAdminSettings() {
    // Basic example: open a prompt or show a hidden div, etc.
    alert("Admin Settings clicked! Здесь откроется окно для настроек");
  }

  // Attach event listeners
  nextBtn.addEventListener('click', nextStep);
  prevBtn.addEventListener('click', prevStep);
  submitBtn.addEventListener('click', handleSubmit);
  adminBtn.addEventListener('click', handleAdminSettings);

  // Initialize first step
  renderStep();
}

/** Export to global scope (if needed) */
if (typeof window !== 'undefined') {
  window.initMultiStepForm = initMultiStepForm;
}
