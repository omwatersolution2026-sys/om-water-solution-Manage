/**
 * ==========================================
 * OM WATER SOLUTION - MARKETING BACKEND
 * ==========================================
 * Connects the Marketing Portal to the central master database.
 */

// 1. Import core Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getFirestore, collection } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

// 2. Central Firebase Configuration (Om Water Manage)
const firebaseConfig = {
    apiKey: "AIzaSyCc_ftesUfhkxlHU21OADveOLnipwD0ab8",
    authDomain: "om-water-manage.firebaseapp.com",
    projectId: "om-water-manage",
    storageBucket: "om-water-manage.firebasestorage.app",
    messagingSenderId: "281852918717",
    appId: "1:281852918717:web:cfde2b892dabebcc17f0d4"
};

// 3. Initialize Firebase Application
const app = initializeApp(firebaseConfig);

// 4. Initialize Cloud Firestore (Database)
const db = getFirestore(app);

// 5. Database Collection References for Marketing
const leadsCol = collection(db, "leads");         // For tracking calling data
const customersCol = collection(db, "customers"); // To add a converted lead as a new customer

// 6. Export for use in dashboard.js
export { db, leadsCol, customersCol };
