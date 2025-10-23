// This is a placeholder for your Firebase configuration.
// Go to your Firebase project console, navigate to Project Settings,
// and under the "General" tab, find your web app's config object.
// Copy and paste those values here.

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// NOTE: For this simulated environment, we won't initialize Firebase,
// but in a real project, you would uncomment the following lines:
/*
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { db, storage, auth };
*/

// For simulation purposes, we export a mock object.
export const db = {};
export const storage = {};
export const auth = {};