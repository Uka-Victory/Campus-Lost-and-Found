import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAF3S38kmOCmrjRpptnSF5fwphl--4rAJE",
  authDomain: "campus-lost-and-found-po-358c2.firebaseapp.com",
  projectId: "campus-lost-and-found-po-358c2",
  storageBucket: "campus-lost-and-found-po-358c2.firebasestorage.app",
  messagingSenderId: "753591221921",
  appId: "1:753591221921:web:fe193a2f33ce31a11abae0"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);