# rentform
📌 Сравнение структуры нового опросника с CallTrackingMetrics (CTM)

Мы объединяем новую логику вопросника с уже существующими полями в CallTrackingMetrics (CTM).
Теперь каждый вопрос будет привязан к соответствующему полю в системе, а также разбит на два этапа:

1️⃣ Qualifier Section (Квалификация, первичный сбор данных)
2️⃣ Sales Section (Продажа, уточнение деталей и закрытие сделки)


Этот тестовый скрипт можно использовать для создания формы в будущем коде.
Он включает разделение на этапы, условные переходы и учет всех вопросов.

📌 Тестовый скрипт вопросов

SECTION 1: QUALIFIER - PURPOSE & SCOPE IDENTIFICATION

📌 (Определяем цель аренды, классифицируем по размеру и создаем основу заказа.)

✅ Q1. What is the purpose of audio at your event? (Dropdown, обязательный выбор)
	•	Corporate Presentation / Panel Discussion
	•	DJ Performance / Wedding / Private Party
	•	Live Band Performance / Concert
	•	Experiential Marketing / Large Public Event
	•	Other (ввести вручную)

✅ Q2. How many attendees are expected? (Dropdown, классификация заказа)
	•	0-100 (Small – Standard PA Package)
	•	100-500 (Medium – Customizable PA & Wireless Mics)
	•	500-3000 (Large – L-Acoustics Line Array Recommended)
	•	3000+ (Major Event – Full-Scale Production Planning)

👉 Если 0-100 или 100-500 → перейти к SECTION 2 (Small Event Setup).
👉 Если 500+ → перейти к SECTION 3 (Medium/Large Event Requirements).

SECTION 2: SMALL EVENT PACKAGE SELECTION

📌 (Если маленькое мероприятие, предлагаем стандартные пакеты или кастомизацию.)

✅ Q3. Do you want a pre-set sound package or a custom setup?
	•	Pre-Set Package (Автоматический подбор оборудования)
	•	Custom Setup (Ручной подбор оборудования)

✅ Q4. Do you need microphones? (Если да, указать количество и тип)
	•	Handheld Wireless → [Input Number]
	•	Lavalier → [Input Number]
	•	Headset → [Input Number]
	•	Wired Handheld → [Input Number]

✅ Q5. Do you need an AV technician on-site? (Если да, указать время работы)
	•	No, we will operate the system ourselves
	•	Yes, we need a technician
	•	What time should they be ready? [Input Time]
	•	What time will they finish? [Input Time]

✅ Q6. Additional needs? (Checkbox, множественный выбор)
	•	Audio Recording
	•	Additional Speakers for Better Coverage
	•	Subwoofers for Music / DJ

👉 Если выбраны дополнительные услуги → записать в CTM и подтвердить заказ.

SECTION 3: MEDIUM/LARGE EVENT REQUIREMENTS

📌 (Если мероприятие крупное, уточняем сложные технические детали.)

✅ Q7. What type of sound system do you need? (Dropdown, обязательный выбор)
	•	Standard PA System
	•	L-Acoustics Line Array
	•	Custom Sound Design

✅ Q8. Will there be a DJ or live band? (Dropdown, если есть перформанс, запрашиваем райдер)
	•	DJ Performance
	•	Live Band
	•	No Performers

✅ Q9. Do you have a DJ/band technical rider? (Если есть, загрузка или ввод контакта)
	•	Yes → Upload Field
	•	No, but I can connect you with the DJ/Band team

✅ Q10. Where will the FOH (Front-of-House) setup be? (Dropdown, влияет на звукорежиссуру)
	•	Near the stage
	•	In the middle of the audience
	•	Not sure

✅ Q11. What type of power is available at the venue? (Dropdown, влияет на подключение оборудования)
	•	Standard 110V outlets
	•	220V outlets
	•	Generator power needed
	•	Not sure

✅ Q12. Have you visited the venue or can you connect us with the venue contact? (Dropdown, уточняет данные локации)
	•	Yes, I have measurements and venue details
	•	No, but I can provide the venue contact
	•	No, I need help coordinating with the venue

✅ Q13. How much time can we have for setup? (Dropdown, важно для логистики)
	•	Less than 1 hour
	•	1-2 hours
	•	3+ hours
	•	Not sure

✅ Q14. Additional needs for the event? (Checkbox, дополнительные услуги)
	•	Audio Recording
	•	Extra Subwoofers for Deep Bass
	•	Wireless In-Ear Monitors (for performers)
	•	Custom Sound Design

✅ Q15. Any additional requests or details? (Free text field)

📌 Следующие шаги

✅ Ты подтверждаешь, что структура правильная?
✅ Я подготовлю UI-макет формы с разделением на Qualifier / Sales.
✅ После этого свяжем это с CallTrackingMetrics через Webhook.

📌 Дай знать, если что-то упущено или нужно дополнить! 🚀
