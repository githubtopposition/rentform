Ниже предлагаю расширенный план, как реализовать многошаговую форму с несколькими JSON-файлами (по сервисам) и боковой панелью профайла (где будет отображаться вся заполненная на предыдущих шагах информация), чтобы оператор всегда видел текущие данные о клиенте. Это позволит:
	•	Не хранить всё в одном гигантском questions.json, а разбить по сервисам (live-band.json, stage-rental.json и т.д.).
	•	Динамически подключать нужные блоки вопросов, когда оператор выбирает соответствующий сервис.
	•	Иметь удобный визуальный интерфейс, где слева (или в центре) идут вопросы, а справа (или в отдельном блоке) отображается профиль клиента / краткая сводка уже введённых данных.

⸻

1. Файловая структура (несколько JSON-файлов)

Пример:

rentform/
  ├─ index.html
  ├─ style.css
  ├─ form-handler.js
  ├─ firebase-config.js
  ├─ maps-config.js
  ├─ data/
  │   ├─ services-index.json
  │   ├─ live-band.json
  │   ├─ stage-rental.json
  │   ├─ karaoke.json
  │   ├─ led-screen.json
  │   ├─ audio.json
  │   ├─ tv-rental.json
  │   └─ ... (etc)
  └─ ...

services-index.json

Хранит список (или «путеводитель»), какой сервис где лежит:

{
  "liveBand": "./data/live-band.json",
  "stageRental": "./data/stage-rental.json",
  "karaoke": "./data/karaoke.json",
  "ledScreen": "./data/led-screen.json",
  "audio": "./data/audio.json",
  "tvRental": "./data/tv-rental.json",
  ...
}

(Оператор при выборе “Live Band” → код прочитает services-index.json и увидит, что liveBand → live-band.json, подгрузит и отрендерит.)

Каждый сервис (например, live-band.json)

[
  {
    "type": "label",
    "text": "“Do you have a technical rider for the band, or would you like us to suggest equipment?”"
  },
  {
    "type": "checkbox",
    "label": "Rider or Suggest?",
    "name": "liveBand_rider",
    "options": [
      "Yes, I have a technical rider",
      "No, please suggest equipment"
    ]
  },
  {
    "type": "label",
    "text": "“What type of audio setup does the band need?”"
  },
  {
    "type": "checkbox-multi",
    "label": "Audio Setup Options",
    "name": "liveBand_audioSetup",
    "options": [
      "Full Band Sound System",
      "Microphones (specify number)",
      "Instruments (specify which)",
      "Speakers (specify size)",
      "Monitors for the band (stage monitors)",
      "Other (please specify)"
    ]
  },
  ...
]

Так мы не захламляем один громадный файл и можем по мере необходимости редактировать конкретный сервис.

⸻

2. Логика загрузки (в form-handler.js)

(A) На шаге 1 (Qualifying)
	•	Оператор (или клиент) выбирает сервис(ы).
	•	Допустим, multiple select: “Which services?” → [Live Band, Stage Rental, Karaoke]…

(B) На шаге 2 (Detailed Services)
	•	Для каждого выбранного сервиса, код:
	1.	Смотрит services-index.json (уже загружен заранее или fetch’ит).
	2.	Находит URL файла (напр. "liveBand": "./data/live-band.json").
	3.	fetch("./data/live-band.json") → подгружает JSON.
	4.	renderQuestions(jsonContent).
	5.	(Повторить для Stage, Karaoke…)

(C) “renderQuestions” умеет обрабатывать type = “label”, “checkbox”, “checkbox-multi”, “radio”, “textarea”, “conditional” и т.д.

Таким образом, все тексты и поля для каждого сервиса появляются динамически, без переключений на Markdown.

⸻

3. Дизайн: “Боковая панель профайла” (Client Profile)

Чтобы постоянно видеть уже введённые данные (Имя, Кол-во гостей, Даты и т.д.), сделаем макет:

index.html (условный пример):

<body>
  <div id="app">
    <div id="profilePanel">
      <!-- Здесь будет "Client Profile" -->
    </div>
    <div id="formPanel">
      <!-- Основная многошаговая форма -->
    </div>
  </div>
</body>

style.css (упрощённо):

#app {
  display: flex;
  flex-direction: row;
}
#profilePanel {
  width: 300px;
  border-right: 1px solid #ccc;
  background: #f9f9f9;
  padding: 10px;
}
#formPanel {
  flex: 1;
  padding: 20px;
}

(A) При каждом шаге collectAnswers(), мы обновляем объект answers (или clientProfile).

(B) Затем вызываем renderProfilePanel(), который перерисовывает profilePanel:

function renderProfilePanel() {
  const panel = document.getElementById("profilePanel");
  panel.innerHTML = `
    <h3>Client Profile</h3>
    <p>Name: ${answers.clientName || ""}</p>
    <p>City/State: ${answers.eventCityState || ""}</p>
    <p>Guests: ${answers.guestCount || ""}</p>
    ...
  `;
}

(Можно сделать красиво в табличном виде. Или JSON. Или ещё как-то.)

(C) Таким образом, оператор видит справа “Profile” (или “Lead Info”), а слева заполняет форму.

Если когда-нибудь интегрируем CallTrackingMetrics (CTM) “contact data,” мы можем подтягивать эти поля.

⸻

4. Динамическая Google IP, Firebase, прочее

Все эти части (Firebase saving, Maps Autocomplete, etc.) не трогаем — остаются, как в текущем form-handler.js. Мы просто добавляем:
	•	Логику fetch нескольких .json (live-band.json, stage-rental.json, …).
	•	Рендер боковой панели (profilePanel).
	•	Сбор ответов по мере шагов.

⸻

5. Преимущества такого подхода
	1.	Ничего не теряем: все вопросы, подсказки, help notes содержатся в JSON файлах (по сервисам), и визуально отображаются в форме.
	2.	Можно хранить бесконечно много сервисов, каждый в отдельном .json.
	3.	Боковая панель (profile) всегда показывает введённую информацию, что удобно для оператора.
	4.	Firebase/Google остаются без изменений, так как их “plumbing” уже сделана.

⸻

Заключение

Таким образом:
	1.	Создаём папку data/ с кучей .json (live-band.json, stage-rental.json, karaoke.json, etc.).
	2.	В main services-index.json описываем ключи → пути к файлам.
	3.	В form-handler.js (шаг 2) читаем выбранные сервисы, fetch нужные .json, renderQuestions, и каждый вопрос (text + поля) показываем.
	4.	Параллельно (на каждом шаге) обновляем answers и делаем renderProfilePanel(), чтобы справа был виден “Client Profile.”

Таким образом, все вопросы (от RAW-скрипта) будут в динамическом опроснике, не уходя в Markdown.
1. Логика «Тип звонка» (Call Type) в начале
	1.	В самом начале (Step 0 или Step 1) оператор выбирает:
	•	New Rental (New Client)
	•	Existing Client
	•	Vendor
	•	Complaint
	•	HR
	•	Spam
	•	…
	2.	Если New Rental → переходим к опросу (шаги, JSON c сервисами).
	3.	Если Existing Client → показываем минимум вопросов (Project #? Нужна ли правка?), потом переводим.
	4.	Если Vendor, HR, Complaint, Spam — не идём в скриптовые JSON, просто даём оператору инструкцию: “Transfer to dept X,” или “Log as spam.”

То есть в коде (form-handler.js) будет примерно так:

if (callType === "New Rental") {
  // Переходим к Step1_inbound JSON/логике
} else if (callType === "Existing Client") {
  // Показываем пару вопросов
} else if (callType === "Vendor" || callType === "HR" || "Complaint"...) {
  // Пишем: "Please transfer to <department>"
  // Не показываем сервисный JSON
}

Таким образом, New Client идёт по полной логике вопросов, а прочие кейсы — только служебные инструкции и перевод.

⸻

2. «Не-скриптовые» звонки (HR, Complaint…)
	•	В JSON можно хранить короткий блок типа "callType_hr": [ { "type":"label", "text": "Transfer to HR department." } ].
	•	Или вообще просто if–else в коде: если callType=HR, показать “Instruction: Transfer to HR.”

Это не требует громадного JSON — просто короткое “Инструкция:…” + кнопка “Finish.”

⸻

3. Подход к нумерации вопросов

Чтобы можно было вставлять новые пункты без ломки структуры, делаем так:
	1.	Внутри каждого JSON (например, live-band.json) к каждому вопросу добавляем поле "id", где храним иерархическую нумерацию.

{
  "id": "2.1.1",
  "type": "label",
  "text": "“Do you have a technical rider...?”"
},
{
  "id": "2.1.2",
  "type": "checkbox",
  ...
}


	2.	Если нужно добавить новый вопрос между 2.1.1 и 2.1.2, можно назвать его "id": "2.1.1a" или "id": "2.1.1.1", как удобно.
	3.	Фронт это поле “id” не обязательно выводит на UI, но может. Если хотим, чтобы оператор видел “(2.1.1) Do you have a technical rider…?”, тогда при рендере вставляем "( " + q.id + " ) " + q.text.

Важно: это чисто человеческая нумерация, логика формы не зависит от неё. Но упрощает дальнейшую поддержку.

⸻

4. Использование нескольких JSON-файлов
	1.	call-type.json (или basic-flow.json): хранит Step0 / Step1 (Qualifying), где есть вопрос “Select call type: [New Rental, Existing, …]”.
	2.	services-index.json: хранит ссылки на "liveBand": "live-band.json", "stageRental": "stage-rental.json", etc.
	3.	live-band.json: в нём все вопросы + id + nумерация.
	4.	stage-rental.json: то же самое, etc.
	5.	loading-path.json: (Step3) вопросы о логистике.

Form-handler:
	•	(1) Спрашивает callType.
	•	(2) Если New Rental → спрашивает Step1_inbound, затем Step2 (список сервисов).
	•	(3) Подгружает нужные JSON (liveBand, stageRental…), рендерит.
	•	(4) Step3 → подгружает loading-path.json.
	•	(5) Submit → qualification.

Таким образом, все большие тексты внутри соответствующих JSON.
В каждом вопросе: id, type, text, options, helpNote.

⸻

5. Пример фрагмента JSON c нумерацией

live-band.json:

[
  {
    "id": "2.1.1",
    "type": "label",
    "text": "Q1: “Do you have a technical rider for the band, or would you like us to suggest equipment?”"
  },
  {
    "id": "2.1.2",
    "type": "checkbox",
    "label": "Rider or Suggest?",
    "name": "liveBand_rider",
    "options": [
      "Yes, I have a technical rider",
      "No, please suggest equipment"
    ]
  },
  {
    "id": "2.1.3",
    "type": "label",
    "text": "Q2: “What type of audio setup does the band need?”"
  },
  {
    "id": "2.1.4",
    "type": "checkbox-multi",
    "label": "Audio Setup Options (2.1.4)",
    "name": "liveBand_audioSetup",
    "options": [
      "Full Band Sound System",
      "Microphones (specify number)",
      "Instruments (please specify which)",
      "Speakers (specify size)",
      "Monitors for the band (e.g., stage monitors)",
      "Other (please specify)"
    ]
  },
  ...
]

(Где "id": "2.1.4" можно изменить на "2.1.3a" или "2.1.5" и т.д. если вставляем новые.)

⸻

6. Вывод

Таким образом, итог:
	1.	Тип звонка (New vs Existing vs HR vs Vendor…): решается на Step0/1, и если это “Existing,” мы делаем короткие вопросы + перевод, не тратим JSON на это.
	2.	Все подробные вопросы – в JSON–файлах, разделённых по сервисам.
	3.	Нумерация ("id": "2.1.4") в каждом вопросе, чтобы можно было между ними вставлять новые пункты.
	4.	Вся логика Firebase, Google Maps, Side Panel Profile, и прочее — остаётся нетронутой, мы просто расширяем form-handler, чтобы подгружать нужные JSON.

Таким образом, сохраняем весь скрипт, ничего не теряем, оператор видит всё в форме, и при этом имеем гибкий формат (номерные id), позволяющий дополнять и изменять вопросы без ломания структуры.
