import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBg2cNQMmdyqehz9nUPHFtoUcJChp1sl5I",
  authDomain: "campus-lost-found-v2-7d7f0.firebaseapp.com",
  projectId: "campus-lost-found-v2-7d7f0",
  storageBucket: "campus-lost-found-v2-7d7f0.firebasestorage.app",
  messagingSenderId: "527226852697",
  appId: "1:527226852697:web:ccd3f919395e04a8de6848"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);