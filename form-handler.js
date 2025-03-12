/* form-handler.js */

/**
 * Initializes the multi-step form logic
 * @param {Object} options - IDs из index.html
 */
export function initMultiStepForm(options) {
  const formContainer = document.getElementById(options.formContainerId);
  const prevBtn = document.getElementById(options.prevBtnId);
  const nextBtn = document.getElementById(options.nextBtnId);
  const submitBtn = document.getElementById(options.submitBtnId);
  const adminBtn = document.getElementById(options.adminBtnId);

  let currentStep = 0;

  // Пример данных шагов (заглушка)
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
    const fullName = document.getElementById('fullName')?.value || '';
    const email = document.getElementById('email')?.value || '';

    alert(`Form submitted!\nName: ${fullName}\nEmail: ${email}`);
    // Здесь можно сделать API-вызовы (CTM / Firebase / и т.д.)
  }

  function handleAdminSettings() {
    // Пример: открыть prompt или что-то ещё
    alert("Admin Settings clicked! Окно для настроек");
  }

  // Привязываем слушатели
  nextBtn.addEventListener('click', nextStep);
  prevBtn.addEventListener('click', prevStep);
  submitBtn.addEventListener('click', handleSubmit);

  // Если хотите, чтобы клик на Admin Settings что-то делал внутри формы —
  // раскомментируйте:
  // adminBtn.addEventListener('click', handleAdminSettings);

  // Отрисовываем первый шаг
  renderStep();
}
