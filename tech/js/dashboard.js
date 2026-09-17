/**
 * ==========================================
 * TECH DASHBOARD CONTROLLER
 * ==========================================
 * Handles Task Fetching, WhatsApp Integration, and PDF Generation.
 */

import { addDoc, getDocs, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { customersCol } from "./firebase-config.js";

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. DOM Elements ---
    const logoutBtn = document.getElementById('logout-btn');
    const currentDateEl = document.getElementById('current-date');
    const tasksListEl = document.getElementById('tasks-list');
    const pendingTasksEl = document.getElementById('pending-tasks');
    
    // Modal Elements
    const addCxModal = document.getElementById('add-cx-modal');
    const modalContent = document.getElementById('modal-content');
    const openAddCxBtn = document.getElementById('open-add-cx-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const addCxForm = document.getElementById('add-cx-form');
    const saveCxBtn = document.getElementById('save-cx-btn');

    // --- 2. Initialize Dashboard ---
    const initDashboard = () => {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateEl.textContent = new Date().toLocaleDateString('en-IN', options);
        fetchTasksData();
    };

    // --- 3. Modal Animations (iOS Style) ---
    const openModal = () => {
        addCxModal.classList.remove('hidden');
        addCxModal.classList.add('flex');
        setTimeout(() => {
            addCxModal.classList.remove('opacity-0');
            modalContent.classList.remove('translate-y-full');
        }, 10);
    };

    const closeModal = () => {
        addCxModal.classList.add('opacity-0');
        modalContent.classList.add('translate-y-full');
        setTimeout(() => {
            addCxModal.classList.add('hidden');
            addCxModal.classList.remove('flex');
            addCxForm.reset();
        }, 300);
    };

    openAddCxBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    addCxModal.addEventListener('click', (e) => {
        if (e.target === addCxModal) closeModal();
    });

    // --- 4. Fetch Tasks from Firebase ---
    const fetchTasksData = async () => {
        try {
            // Fetching all recent customers as tasks for the tech
            const q = query(customersCol, orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            
            let tasksHTML = '';
            let count = 0;

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                count++;
                
                // Store data in a stringified JSON for easy access in buttons
                const stringifiedData = encodeURIComponent(JSON.stringify(data));

                tasksHTML += `
                    <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <h4 class="font-bold text-gray-900">${data.name}</h4>
                                <p class="text-xs text-gray-500 mt-1 flex items-start gap-1">
                                    <svg class="w-3.5 h-3.5 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                    ${data.address}
                                </p>
                            </div>
                            <span class="bg-blue-50 text-blue-600 text-[10px] font-bold px-2.5 py-1 rounded-md">AMC</span>
                        </div>
                        
                        <div class="flex items-center gap-4 text-sm text-gray-600 mb-4">
                            <p><strong>Phone:</strong> ${data.phone}</p>
                            <p><strong>Bill:</strong> ₹${data.amount}</p>
                        </div>

                        <div class="grid grid-cols-2 gap-3 pt-4 border-t border-gray-50">
                            <button onclick="window.sendWhatsApp('${stringifiedData}')" class="flex items-center justify-center gap-2 bg-[#25D366]/10 text-[#25D366] font-semibold py-2.5 rounded-xl transition-colors hover:bg-[#25D366]/20">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.418-.099.824z"/></svg>
                                Send Bill
                            </button>
                            <button onclick="window.generatePDF('${stringifiedData}')" class="flex items-center justify-center gap-2 bg-blue-50 text-blue-600 font-semibold py-2.5 rounded-xl transition-colors hover:bg-blue-100">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                Download
                            </button>
                        </div>
                    </div>
                `;
            });

            pendingTasksEl.textContent = count;
            tasksListEl.innerHTML = count === 0 ? `<div class="text-center text-gray-400 py-10">No pending tasks today.</div>` : tasksHTML;

        } catch (error) {
            console.error("Error fetching tasks: ", error);
            tasksListEl.innerHTML = `<div class="text-center text-red-500 py-10">Error loading data.</div>`;
        }
    };

    // --- 5. Add New Customer (On-Site Entry) ---
    addCxForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const originalBtnHTML = saveCxBtn.innerHTML;
        saveCxBtn.innerHTML = `Saving...`;
        saveCxBtn.disabled = true;

        try {
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

            await addDoc(customersCol, newCustomerData);
            closeModal();
            fetchTasksData(); // Refresh UI
            if (navigator.vibrate) navigator.vibrate([100]);
        } catch (error) {
            alert("Failed to save data.");
        } finally {
            saveCxBtn.innerHTML = originalBtnHTML;
            saveCxBtn.disabled = false;
        }
    });

    // --- 6. WhatsApp Integration Logic ---
    window.sendWhatsApp = (encodedData) => {
        const data = JSON.parse(decodeURIComponent(encodedData));
        
        // Custom message format
        const message = `Hello ${data.name},\n\nYour Om Water Solution service has been updated.\n\n*Details:*\nUnit: ${data.unitType}\nContract: ${data.startDate} to ${data.endDate}\nAmount: Rs. ${data.amount}/-\nBill No: ${data.billNo}\n\nThank you for choosing Om Water Solution!\nContact: 9920716891`;
        
        // Open WhatsApp URL (works on mobile app and web)
        const whatsappUrl = `https://wa.me/91${data.phone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    // --- 7. PDF Generation Logic ---
    window.generatePDF = (encodedData) => {
        const data = JSON.parse(decodeURIComponent(encodedData));
        
        // Map data to the hidden HTML template
        document.getElementById('inv-name').textContent = data.name;
        document.getElementById('inv-address').textContent = data.address;
        document.getElementById('inv-phone').textContent = data.phone;
        document.getElementById('inv-start').textContent = data.startDate;
        document.getElementById('inv-end').textContent = data.endDate;
        document.getElementById('inv-unit').textContent = data.unitType;
        document.getElementById('inv-amount').textContent = data.amount;
        document.getElementById('inv-bill').textContent = data.billNo;

        const element = document.getElementById('invoice-template');
        element.classList.remove('hidden'); // Temporarily show to generate

        // PDF Configuration
        const opt = {
            margin:       0.5,
            filename:     `Invoice_${data.name.replace(/\s+/g, '_')}_${data.billNo}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        // Generate and save PDF
        html2pdf().set(opt).from(element).save().then(() => {
            element.classList.add('hidden'); // Hide again after generation
        });
    };

    // --- 8. Logout ---
    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('isTechLoggedIn');
        window.location.replace('index.html');
    });

    // Boot up
    initDashboard();
});
