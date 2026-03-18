import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCPE0BNUWOGdQw4OmqLC6efBmOmBNbY8xY",
  authDomain: "themerchantsshadow.firebaseapp.com",
  // Ganti URL di bawah jika berbeda dengan yang ada di tab Realtime Database milikmu
  databaseURL: "https://themerchantsshadow-default-rtdb.firebaseio.com", 
  projectId: "themerchantsshadow",
  storageBucket: "themerchantsshadow.firebasestorage.app",
  messagingSenderId: "286065812994",
  appId: "1:286065812994:web:47773c6e460ab140e1e91b",
  measurementId: "G-BZ53QQGTT7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const db = getDatabase(app);
export const analytics = getAnalytics(app);