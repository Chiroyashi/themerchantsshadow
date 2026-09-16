import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCPE0BNUWOGdQw4OmqLC6efBmOmBNbY8xY",
  authDomain: "themerchantsshadow.firebaseapp.com",
  databaseURL: "https://themerchantsshadow-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "themerchantsshadow",
  storageBucket: "themerchantsshadow.firebasestorage.app",
  messagingSenderId: "286065812994",
  appId: "1:286065812994:web:47773c6e460ab140e1e91b",
  measurementId: "G-BZ53QQGTT7"
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
export const auth = getAuth(app);

// Auto-sign-in anonymous, resolve when ready
export const authReady = new Promise((resolve) => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      unsubscribe();
      resolve(user);
    }
  });
  signInAnonymously(auth).catch((err) => {
    console.error("Anonymous auth failed:", err);
  });
});