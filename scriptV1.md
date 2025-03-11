Ниже представлена **финальная текстовая версия** скрипта, которая объединяет:

1. **Outbound Callback Script** (по вашему тексту про 3 звонка + SMS, “Hi [Client’s Name], this is [Your Name]…”),  
2. **Inbound Qualifying/Service Flow** (шаги 1 → 2 → 3),  
3. **Все дополнительные сервисные вопросы** (Live Band, Stage Rental, Karaoke и т. д.),  
4. **Шаги по логистике/загрузке** (Step 3: Loading path, venue details…),  
5. **Кнопку квалификации** (Qualified / Not Qualified).  

**Важно**: Это именно **текстовый** сценарий, описывающий логику. На его основе web‑разработчики смогут создать «3-страничный» динамический опросник, который при нажатии **Next**/**Back**/**Submit** будет показывать/прятать нужные блоки вопросов, собирать ответы и в конце генерировать PDF (или сохранять в CRM).

---

# 1. **Outbound Callback Script** (для исходящих звонков)

Когда Sales совершает **исходящие** (callback) попытки после заявок, используем такую последовательность:

1. **Когда делаем 3 звонка + SMS**:  
   - “Call 3 times in a row; если не взяли трубку, потом отправить SMS:  
     > *Hi [Client’s Name], this is [Your Name] from Rent For Event. I saw that you inquired about AV event rental services. Just wanted to check if you’re still looking or if you’ve already found what you need? No pressure—just here to help if you need anything! Let me know.*”

2. **Если клиент перезвонил** или ответил на SMS, используем **Outbound Conversation**:  
   ```
   "Hi [Client Name], this is [Your Name] from Rent For Event. 
   I noticed you had filled out a form on our website about your event, and I just wanted to quickly check in 
   to see if you’re still looking for AV event rental services or if you've already found what you need?"
   ```
   - Если **нашли другого вендора**:
     ```
     "Sorry to hear that! Would it be possible to follow up with you before your next event? 
      We’d love the opportunity to participate in bidding for it."
     ```
     - Если согласен → “How many events do you typically organize per year? And when is your next event scheduled?” (записываем в CRM).  
     - Назначаем follow-up через месяц (CRM).  
   - Если **всё ещё ищут** (или не уверены):
     ```
     "Great! I won’t take too much of your time. Just a couple of questions to connect you with the right manager. Would that be okay?"
     ```
3. **Outbound Basic Qualifiers**:  
   - Q: “May I confirm your name?”  
   - Q: “Which city/state is your event?”  
   - Q: “What do you need to rent? (Stage? Audio? LED? etc.)”  
   - Q: “Any idea about date & number of attendees?”  
4. **If** это большой проект → переходим на **Advanced questions** (Live Band? Stage? Karaoke?).  
5. **Summarize**:  
   ```
   "So, your event is on [DATE], with about [X] guests, at [LOCATION]. 
    You’re looking for [SERVICES]. Let me transfer/connect you with our Sales Manager for final details."
   ```
6. **Qualification**:  
   - If клиент подходит → “Qualified.”  
   - Если явно нет → “Not Qualified.” (причина).  
7. **Сохранить** всё в CRM.  

Это **Outbound** версия, берущая за основу ваш текст: “Call 3 times, send SMS, check if they’re still looking or found a vendor, gather minimal info, set follow-up.”

---

# 2. **Inbound Flow** (3-шаговая логика)

При **входящем** звонке:

### **Step 1. Qualifying Questions** (New Separate)

1. **Greeting**  
   ```
   "Good morning/afternoon, thank you for calling Rent For Event. 
    My name is [Your Name]. May I ask for your name, please?"
   ```
2. **City/State**  
   ```
   "May I ask in which city and state your event will take place?"
   ```
   - Dropdown menu (Los Angeles, SF, Miami, Orlando, etc.). Автоматически можно определить ближайший офис.  
3. **Confirm** plan:  
   ```
   “Here’s what I’ll do: I’ll ask you a few more questions about the event, 
    and then I’ll connect you with our Sales Manager, who will go over the details and pricing. 
    How does that sound?”
   ```
4. **Event Description**  
   - "Can you tell me a little bit more about your event and how we can help you today?"  
   - "Is there anything else you need besides this?"  
   - "What type of event is this?" (Wedding, Corporate, etc.)  
5. **Guest Count**  
   - “How many guests are you expecting?” (<50, 50-100, …, 5000+).  
6. **Indoor/Outdoor/Both**  
7. **Venue** (Hotel, Convention Center, Private Residence, etc.)  
8. **Event Logistics** (Dates, Times)  
   - Setup Date, Earliest Setup Time, Event Start/End, Strike Date & time.  
   - Service Type (Full Service, No Operation, Pickup, etc.).  
9. **Final Details before Transfer**  
   - "Do you have a name for your event?"  
   - "Best email to send a quote?"  
   - "How many events do you organize per year on average?"  
10. **Confirm Lead & Transfer**  
   - Button “Sales Qualified” → “Thank you! I will put you on brief hold and connect you with our Sales Manager.”

*(Это Step 1, но фактически уже собираем кучу инфы. Вы можете разбить на 2 экрана в HTML, но концептуально это “Qualifying questions.”)*

---

### **Step 2. Specific Service** (Live Band, Stage, Karaoke, LED, etc.)

В зависимости от того, **что** выбрал клиент (можно Multi-select “Which services are you interested in?”):

- **Live Band**: задаём вопросы (тех. райдер, микрофоны, спецэффекты…).  
- **Stage Rental**: Q1–Q19 (цель сцены, тип, размеры, Outdoor considerations…).  
- **Karaoke**: Q1–Q13 (Wi-Fi, TV connection, etc.).  
- **LED Screen**: Q1–Q16 (indoor/outdoor, content source, etc.).  
- **Live Streaming**: Q1–Q34 (platform, cameras, recording…).  
- **Pipe & Drape**: Q1–Q15 (purpose, color, walls count…).  
- **Audio**: Q1–Q16 (small/medium/large event, DJ or band?).  
- **TV Rental**: Q1–Q21 (event type, quantity, content source...).  
- **Step & Repeat / Red Carpet**: Q1–Q6 (purpose, size, colors…).

*(HTML-форма может показывать эти блоки «Step 2: Services» динамически — если выбрали “Stage + Karaoke + LED,” то показываем 3 набора вопросов подряд.)*

---

### **Step 3. Loading Path, Power, Timing**

1. **Generic Questions**:  
   - “Loading path? Any obstacles (stairs, elevator)?”  
   - “Where do we unload, and where can we park?”  
   - “Distance from unloading to setup?”  
2. **Venue-Specific** (Hotel, Private Residence, etc.):  
   - If Private Residence → gate code? By which entrance?  
   - If Convention Center → booth #, marshaling yard?  
   - If Outdoor → generator needed?  
3. **Power Questions**:  
   - “Does location have enough power? If not sure, connect us with event manager.”  
4. **Timelines**:  
   - “By what time do we need to finish setup? What time does show start? When do we strike?”  
   - “Any rehearsal times?”  

*(В конце Step 3, мы можем нажать “Next” → Preview → Submit.*)

---

### **Final Submit**:  
- “Qualified / Not Qualified.”  
- Если Not Qualified → причина.  
- Генерируем PDF (только с ответами на заданные вопросы).  

---

# 3. Как всё объединить

- **Outbound** – отдельный мини-поток (Step1: “Hi, calling about your inquiry,” gather minimal details → Step2: advanced → Summarize).  
- **Inbound** – Step1 (Qualify questions), Step2 (Detailed service block), Step3 (Logistics/venue), Submit.  

Все **доп. сервисные скрипты** (Live Band, Karaoke, Stage, LED…) загружаются во **втором шаге** (или втором экране) в зависимости от выбранного “service type.”  
**Загрузочно-логистический** набор вопросов – **третий шаг**.  
**PDF** создаётся из всех ответов.

Таким образом, **ничего** не теряется:  
- Ваши тексты о “3 calls + SMS” → Outbound.  
- “Good morning, … Step1–2–3–Final” → Inbound.  
- “Live band questions,” “Stage Rental Questionnaire,” etc. → всё в Step2 (services).  
- Loading Path & Venue → Step3.  
- Квалификация → конечная кнопка “Qualified / Not Qualified.”

---

# 4. Итог: “Final Version to Pass to Dev Team”

1. **Step 0**: Выбор “Inbound / Outbound.” (Если нужно.)  
2. **Inbound** Flow: 
   - **Step1**: Greet, Basic Qualifiers, Event details.  
   - **Step2**: Specific Service Q (Live Band, Stage, Karaoke, LED, etc.). MultiSelect → показываем несколько блоков.  
   - **Step3**: Loading/Power/Timing.  
   - **Step4**: Preview & “Qualification.”  
   - Submit → PDF.  

2. **Outbound** Flow:  
   - **Step1**: “Hi, calling about your inquiry… Are you still looking?”  
   - If yes, gather basic details (City, Date, Services).  
   - Possibly advanced questions.  
   - Summarize, “Qualified?” → Submit.  

3. **All Service Scripts** (Live Band, Stage, Karaoke, LED, etc.) – вы **прикладываете** в Step2, чтобы dev‑команда сделала *conditional blocks*.

4. **Logistics** (Step3) – “Loading path, venue specifics,” etc.  

5. **At the end** → “Qualified / Not Qualified,” “Why?” → generatate PDF or store to CRM.

Вот **текст** (из вашего документа) структурирован под **3 шага** inbound, плюс **отдельный** outbound callback сценарий, чтобы **ни один** вопрос не потерять.
