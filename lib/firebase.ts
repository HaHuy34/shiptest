import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDm2-t6JEzYGQvR8xOdEcB_Z9pBc5aT9wE",
  authDomain: "api-my-bf5a6.firebaseapp.com",
  databaseURL: "https://api-my-bf5a6-default-rtdb.firebaseio.com",
  projectId: "api-my-bf5a6",
  storageBucket: "api-my-bf5a6.firebasestorage.app",
  messagingSenderId: "205412398158",
  appId: "1:205412398158:web:ffcdb98ea1f50e4c6e7f1f",
  measurementId: "G-VLGPT7J33Y",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
