import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// firebase-config.js - Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBaGi8plb8PBaCyKHdmEDye5WamGrlLgg8",
  authDomain: "rent-form.firebaseapp.com",
  projectId: "rent-form",
  storageBucket: "rent-form.appspot.com",
  messagingSenderId: "136805752728",
  appId: "1:136805752728:web:0d9a1bdb1b65fda0aafded",
  measurementId: "G-QKHCPHR9ZC"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
