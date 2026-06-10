
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCGUollPBdzMcO9C6RCRapVgSk0XKZi7W4",
  authDomain: "globe-trek-22297.firebaseapp.com",
  databaseURL: "https://globe-trek-22297-default-rtdb.firebaseio.com",
  projectId: "globe-trek-22297",
  storageBucket: "globe-trek-22297.firebasestorage.app",
  messagingSenderId: "1071677396250",
  appId: "1:1071677396250:web:a24c340a20f7568da948a3",
  measurementId: "G-JTLL2XS9QN"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);