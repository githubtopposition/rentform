// firebase-config.js
// Подключаем Firebase (v9) как модули (из CDN) и инициализируем

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Ваши реальные параметры проекта
const firebaseConfig = {
  apiKey: "AIzaSyAt5ep...",
  authDomain: "rent-form.firebaseapp.com",
  projectId: "rent-form",
  storageBucket: "rent-form.appspot.com",
  messagingSenderId: "136805752728",
  appId: "1:136805752728:web:0d9a1bdb1b65fda0aafded",
  measurementId: "G-QKHCPHR9ZC"
};

// Инициализируем
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
