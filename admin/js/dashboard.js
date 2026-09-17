/**
 * ==========================================
 * ADMIN DASHBOARD CONTROLLER (PREMIUM)
 * ==========================================
 * Handle logic for Data Fetching, Modal Animations, and Form Submissions.
 */

import { addDoc, getDocs, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { customersCol } from "./firebase-config.js";

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. DOM Elements ---
    const logoutBtn = document.getElementById('logout-btn');
    const currentDateEl = document.getElementById('current-date');
    
    // Stats Elements
    const totalRevenueEl = document.getElementById('total-revenue');
    const totalAmcsEl = document.getElementById('total-amcs');
    const dueServicesCountEl = document.getElementById('due-services-count');
    const customersListEl = document.getElementById('customers-list');
    
    // Modal Elements
    const addCxModal = document.getElementById('add-cx-modal');
    const modalContent = document.getElementById('modal-content');
    const openAddCxBtn = document.getElementById('open-add-cx-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    
    // Form Elements
    const addCxForm = document.getElementById('add-cx-form');
    const saveCxBtn = document.getElementById('save-cx-btn');

    // --- 2. Initialize Dashboard ---
    const initDashboard = () => {
        // Set Today's Date with elegant formatting
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateEl.textContent = new Date().toLocaleDateString('en-IN', options);

        // Fetch Data from Firebase
        fetchDashboardData();
    };

    // --- 3. iOS Style Modal Animations ---
    const openModal = () => {
        addCxModal.classList.remove('hidden');
        addCxModal.classList.add('flex');
        
        // Micro-delay ensures the display:flex applies before animation triggers
        setTimeout(() => {
            addCxModal.classList.remove('opacity-0');
            modalContent.classList.remove('translate-y-full');
        }, 10);
    };

    const closeModal = () => {
        addCxModal.classList.add('opacity-0');
        modalContent.classList.add('translate-y-full');
        
        // Wait for animation to finish before hiding completely
        setTimeout(() => {
            addCxModal.classList.add('hidden');
            addCxModal.classList.remove('flex');
            addCxForm.reset(); // Clear form on close
        }, 300);
    };

    openAddCxBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    
    // Close modal if user clicks on the dark overlay (outside the white box)
    addCxModal.addEventListener('click', (e) => {
        if (e.target === addCxModal) closeModal();
    });

    // --- 4. Fetch & Calculate Data from Firebase ---
    const fetchDashboardData = async () => {
        try {
            // Fetch customers ordered by creation date (newest first)
            const q = query(customersCol, orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            
            let totalRevenue = 0;
            let totalAmcs = 0;
            let dueServices = 0;
            let customersHTML = '';

            const today = new Date();

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                totalAmcs++;
                totalRevenue += Number(data.amount || 0);

                // --- Quarterly Service Logic (Premium Feature) ---
                // Check if 3 months have passed since start date for service alert
                if (data.startDate) {
                    const startDt = new Date(data.startDate);
                    const diffTime = Math.abs(today - startDt);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    // If around 90 days (1 quarter) or 180 days (half year) have passed
                    if (diffDays > 0 && (diffDays % 90 === 0 || diffDays % 90 <= 5)) {
                        dueServices++;
                    }
                }

                // Build HTML for Recent Customers List (Only showing top 5 for clean UI)
                if (totalAmcs <= 5) {
                    customersHTML += `
                        <div class="p-5 flex justify-between items-center hover:bg-gray-50 transition-colors">
                            <div>
                                <h4 class="font-semibold text-sm text-gray-900">${data.name}</h4>
                                <p class="text-[11px] text-gray-500 mt-0.5">${data.unitType} • Bill: ${data.billNo}</p>
                            </div>
                            <div class="text-right">
                                <span class="text-sm font-bold text-gray-900">₹${Number(data.amount).toLocaleString('en-IN')}</span>
                                <p class="text-[10px] text-green-600 font-medium mt-0.5">Active</p>
                            </div>
                        </div>
                    `;
                }
            });

            // Update UI with calculated data
            totalRevenueEl.textContent = totalRevenue.toLocaleString('en-IN');
            totalAmcsEl.textContent = totalAmcs;
            dueServicesCountEl.textContent = dueServices;

            // Update List UI
            if (totalAmcs === 0) {
                customersListEl.innerHTML = `
                    <div class="p-6 text-center text-gray-400">
                        <p class="text-sm">No customers found. Add your first AMC!</p>
                    </div>`;
            } else {
                customersListEl.innerHTML = customersHTML;
            }

        } catch (error) {
            console.error("Error fetching data: ", error);
            customersListEl.innerHTML = `<div class="p-5 text-center text-red-500 text-sm">Error loading data. Check internet connection.</div>`;
        }
    };

    // --- 5. Add New Customer (Form Submission) ---
    addCxForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Original Button UI state
        const originalBtnHTML = saveCxBtn.innerHTML;
        saveCxBtn.innerHTML = `<div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>Saving...</span>`;
        saveCxBtn.disabled = true;

        try {
            // Gather Form Data
            const newCustomerData = {
                name: document.getElementById('cx-name').value,
                address: document.getElementById('cx-address').value,
                phone: document.getElementById('cx-phone').value,
                unitType: document.getElementById('cx-unit').value,
                startDate: document.getElementById('cx-start-date').value,
                endDate: document.getElementById('cx-end-date').value,
                amount: Number(document.getElementById('cx-amount').value),
                billNo: document.getElementById('cx-bill').value,
                createdAt: serverTimestamp(),
                status: "Active"
            };

            // Save to Firebase Firestore
            await addDoc(customersCol, newCustomerData);

            // Reset UI & Update Dashboard
            closeModal();
            fetchDashboardData(); // Refresh the list instantly

            // Haptic Feedback for success (Mobile)
            if (navigator.vibrate) navigator.vibrate([100]);

        } catch (error) {
            console.error("Error adding document: ", error);
            alert("Failed to save data. Please try again.");
        } finally {
            // Restore Button UI
            saveCxBtn.innerHTML = originalBtnHTML;
            saveCxBtn.disabled = false;
        }
    });

    // --- 6. Logout Logic ---
    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('isAdminLoggedIn');
        window.location.replace('index.html'); // Redirect to login
    });

    // Boot up the dashboard
    initDashboard();
});
