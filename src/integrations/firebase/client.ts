import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA69-dJWF0x9o7agtfcnwA4Ec3ujK0WtRo",
  authDomain: "portifolio-d0c18.firebaseapp.com",
  projectId: "portifolio-d0c18",
  storageBucket: "portifolio-d0c18.firebasestorage.app",
  messagingSenderId: "883735217799",
  appId: "1:883735217799:web:bce79a9653b7509333da22",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app);
