/**
 * ==========================================
 * OM WATER SOLUTION - FIREBASE CORE BACKEND
 * ==========================================
 * This file initializes the Firebase Backend for the Admin Portal.
 * It uses the Firebase v10 Modular SDK to ensure the app loads lightning fast.
 */

// 1. Import core Firebase functions from the official Google CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";

// 2. Import Firestore Database functions
import { getFirestore, collection } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

// 3. Your Secure Firebase Configuration (Om Water Manage)
const firebaseConfig = {
    apiKey: "AIzaSyCc_ftesUfhkxlHU21OADveOLnipwD0ab8",
    authDomain: "om-water-manage.firebaseapp.com",
    projectId: "om-water-manage",
    storageBucket: "om-water-manage.firebasestorage.app",
    messagingSenderId: "281852918717",
    appId: "1:281852918717:web:cfde2b892dabebcc17f0d4"
};

// 4. Initialize Firebase Application
const app = initializeApp(firebaseConfig);

// 5. Initialize Cloud Firestore (Database)
const db = getFirestore(app);

/**
 * ------------------------------------------
 * DATABASE COLLECTION REFERENCES
 * ------------------------------------------
 * Defining collections centrally keeps the dashboard.js file clean, 
 * scalable, and prevents typo-related bugs during database queries.
 */

// Collection 1: Stores all AMC and Customer details
const customersCol = collection(db, "customers"); 

// Collection 2: Stores all installation, repair, and quarterly service logs (For Tech Portal)
const servicesCol = collection(db, "services");   

// Collection 3: Stores all telecalling and marketing leads (For Marketing Portal)
const leadsCol = collection(db, "leads");         


// 6. Export everything so other files can use them securely
export { db, customersCol, servicesCol, leadsCol };
