/**
 * ==========================================
 * MARKETING DASHBOARD CONTROLLER
 * ==========================================
 * Handles Leads, Follow-ups, and Conversion to Master Customer DB.
 */

import { addDoc, getDocs, doc, updateDoc, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { db, leadsCol, customersCol } from "./firebase-config.js";

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. DOM Elements ---
    const logoutBtn = document.getElementById('logout-btn');
    const leadsListEl = document.getElementById('leads-list');
    
    // Stats
    const statTotal = document.getElementById('stat-total');
    const statFollowup = document.getElementById('stat-followup');
    const statConverted = document.getElementById('stat-converted');

    // Add Lead Modal Elements
    const addLeadModal = document.getElementById('add-lead-modal');
    const addModalContent = document.getElementById('add-modal-content');
    const openAddLeadBtn = document.getElementById('open-add-lead-btn');
    const closeAddModalBtn = document.querySelector('.close-modal-btn');
    const addLeadForm = document.getElementById('add-lead-form');
    const saveLeadBtn = document.getElementById('save-lead-btn');

    // Convert Lead Modal Elements
    const convertModal = document.getElementById('convert-modal');
    const convertModalContent = document.getElementById('convert-modal-content');
    const closeConvertBtn = document.querySelector('.close-convert-btn');
    const convertForm = document.getElementById('convert-form');
    const confirmConvertBtn = document.getElementById('confirm-convert-btn');

    // --- 2. Modal Handlers (Slide Up/Down Animations) ---
    const openModal = (modal, content) => {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            content.classList.remove('translate-y-full');
        }, 10);
    };

    const closeModal = (modal, content, form) => {
        modal.classList.add('opacity-0');
        content.classList.add('translate-y-full');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            if(form) form.reset();
        }, 300);
    };

    // Add Lead Modal Triggers
    openAddLeadBtn.addEventListener('click', () => openModal(addLeadModal, addModalContent));
    closeAddModalBtn.addEventListener('click', () => closeModal(addLeadModal, addModalContent, addLeadForm));
    addLeadModal.addEventListener('click', (e) => { if (e.target === addLeadModal) closeModal(addLeadModal, addModalContent, addLeadForm); });

    // Convert Modal Triggers
    closeConvertBtn.addEventListener('click', () => closeModal(convertModal, convertModalContent, convertForm));
    convertModal.addEventListener('click', (e) => { if (e.target === convertModal) closeModal(convertModal, convertModalContent, convertForm); });


    // --- 3. Fetch Leads & Update Pipeline ---
    const fetchLeads = async () => {
        try {
            const q = query(leadsCol, orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            
            let total = 0, followup = 0, converted = 0;
            let leadsHTML = '';

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const leadId = doc.id;
                total++;
                
                if(data.status === 'Follow-up') followup++;
                if(data.status === 'Converted') converted++;

                // Status Badge styling logic
                let badgeClass = "bg-blue-50 text-blue-600"; // Default New
                if(data.status === 'Follow-up') badgeClass = "bg-orange-50 text-orange-600";
                if(data.status === 'Not Interested') badgeClass = "bg-red-50 text-red-600";
                if(data.status === 'Converted') badgeClass = "bg-green-50 text-green-600";

                // We only show Convert button if it's NOT already converted
                const actionBtn = data.status !== 'Converted' ? 
                    `<button onclick="window.triggerConvert('${leadId}', '${data.name}', '${data.phone}')" class="mt-4 w-full bg-accent/10 text-accent font-semibold py-2.5 rounded-xl text-sm hover:bg-accent/20 transition-colors">Convert to Customer</button>` 
                    : `<div class="mt-4 w-full bg-gray-50 text-gray-400 font-semibold py-2.5 rounded-xl text-sm text-center border border-gray-100">Closed (Converted)</div>`;

                leadsHTML += `
                    <div class="bg-white p-5 rounded-2xl border border-borderGrey shadow-sm">
                        <div class="flex justify-between items-start mb-2">
                            <h4 class="font-bold text-gray-900">${data.name}</h4>
                            <span class="text-[10px] font-bold px-2 py-1 rounded-md ${badgeClass}">${data.status}</span>
                        </div>
                        <div class="flex items-center gap-2 text-sm text-gray-600 mb-3">
                            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                            ${data.phone}
                        </div>
                        ${data.notes ? `<p class="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg italic">"${data.notes}"</p>` : ''}
                        ${actionBtn}
                    </div>
                `;
            });

            // Update DOM Stats
            statTotal.textContent = total;
            statFollowup.textContent = followup;
            statConverted.textContent = converted;

            // Update DOM List
            leadsListEl.innerHTML = total === 0 ? `<div class="text-center text-gray-400 py-10 text-sm">Pipeline is empty. Add a lead!</div>` : leadsHTML;

        } catch (error) {
            console.error("Error fetching leads: ", error);
            leadsListEl.innerHTML = `<div class="text-center text-red-500 py-10 text-sm">Error loading pipeline.</div>`;
        }
    };

    // --- 4. Add New Lead ---
    addLeadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        saveLeadBtn.innerHTML = `Saving...`;
        saveLeadBtn.disabled = true;

        try {
            await addDoc(leadsCol, {
                name: document.getElementById('lead-name').value,
                phone: document.getElementById('lead-phone').value,
                status: document.getElementById('lead-status').value,
                notes: document.getElementById('lead-notes').value,
                createdAt: serverTimestamp()
            });

            closeModal(addLeadModal, addModalContent, addLeadForm);
            fetchLeads(); // Refresh Pipeline
            if (navigator.vibrate) navigator.vibrate([100]);
        } catch (error) {
            alert("Failed to save lead.");
        } finally {
            saveLeadBtn.innerHTML = `Save Lead`;
            saveLeadBtn.disabled = false;
        }
    });

    // --- 5. Trigger Convert Process (Pre-fill Data) ---
    window.triggerConvert = (id, name, phone) => {
        // Pre-fill modal with known lead data
        document.getElementById('convert-lead-id').value = id;
        document.getElementById('conv-name').value = name;
        document.getElementById('conv-phone').value = phone;
        
        // Auto-set start date to today
        document.getElementById('conv-start').valueAsDate = new Date();
        
        // Open the Convert Modal
        openModal(convertModal, convertModalContent);
    };

    // --- 6. Finalize Conversion to Master DB ---
    convertForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        confirmConvertBtn.innerHTML = `Syncing to Admin...`;
        confirmConvertBtn.disabled = true;

        try {
            const leadId = document.getElementById('convert-lead-id').value;

            // Step A: Push new Customer to Master DB (Admin/Tech side)
            await addDoc(customersCol, {
                name: document.getElementById('conv-name').value,
                phone: document.getElementById('conv-phone').value,
                address: document.getElementById('conv-address').value,
                unitType: document.getElementById('conv-unit').value,
                amount: Number(document.getElementById('conv-amount').value),
                startDate: document.getElementById('conv-start').value,
                endDate: document.getElementById('conv-end').value,
                billNo: `CNV${Math.floor(1000 + Math.random() * 9000)}`, // Auto generate bill number for converted leads
                status: "Active",
                createdAt: serverTimestamp()
            });

            // Step B: Update Lead status to 'Converted' in Marketing DB
            const leadRef = doc(db, "leads", leadId);
            await updateDoc(leadRef, { status: "Converted" });

            closeModal(convertModal, convertModalContent, convertForm);
            fetchLeads(); // Refresh Pipeline
            if (navigator.vibrate) navigator.vibrate([50, 50, 100]); // Success pattern

        } catch (error) {
            console.error(error);
            alert("Failed to convert lead.");
        } finally {
            confirmConvertBtn.innerHTML = `Finalize Customer`;
            confirmConvertBtn.disabled = false;
        }
    });

    // --- 7. Logout Logic ---
    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('isMarketingLoggedIn');
        window.location.replace('index.html');
    });

    // Boot up
    fetchLeads();
});
