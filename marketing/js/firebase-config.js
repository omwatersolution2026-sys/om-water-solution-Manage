/**
 * ==============================================
 * OM WATER SOLUTION - MARKETING FIREBASE BACKEND
 * ==============================================
 * Connects the Marketing Portal to the main Database.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getFirestore, collection } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCc_ftesUfhkxlHU21OADveOLnipwD0ab8",
    authDomain: "om-water-manage.firebaseapp.com",
    projectId: "om-water-manage",
    storageBucket: "om-water-manage.firebasestorage.app",
    messagingSenderId: "281852918717",
    appId: "1:281852918717:web:cfde2b892dabebcc17f0d4"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore Database
const db = getFirestore(app);

// Collection References
// We need 'leadsCol' for cold calls and 'customersCol' to push converted leads to Admin/Tech
const customersCol = collection(db, "customers"); 
const leadsCol = collection(db, "leads");         

export { db, customersCol, leadsCol };
