import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Замените на ваши реальные ключи
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "rent-form.firebaseapp.com",
  projectId: "rent-form",
  storageBucket: "rent-form.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abc123"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
