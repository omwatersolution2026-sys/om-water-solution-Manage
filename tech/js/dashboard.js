/**
 * ==========================================
 * ENGINEER DASHBOARD CONTROLLER (TECH)
 * ==========================================
 * Manages due tasks, service completion, PDF invoice generation,
 * WhatsApp intimation, and rescheduling.
 */

import { getDocs, addDoc, updateDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { db, customersCol, servicesCol } from "./firebase-config.js";

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Security & Setup ---
    if(sessionStorage.getItem('techAuth') !== 'true') {
        window.location.replace('index.html');
        return;
    }

    const tasksListEl = document.getElementById('tasks-list');
    const taskCountBadge = document.getElementById('task-count-badge');
    
    // --- 2. Helper: Date Formatter ---
    const getTodayStr = () => new Date().toISOString().split('T')[0];
    const formatDateToIND = (dateStr) => {
        if(!dateStr) return 'N/A';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    // --- 3. Fetch Due Tasks (Core Logic) ---
    const fetchDueTasks = async () => {
        try {
            const querySnapshot = await getDocs(customersCol);
            let tasksHTML = '';
            let count = 0;
            const today = getTodayStr();

            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                
                // Show only Active customers whose service is due today or overdue
                if (data.status === "Active" && data.nextServiceDate && data.nextServiceDate <= today) {
                    count++;
                    const cxId = docSnap.id;
                    const encodedData = encodeURIComponent(JSON.stringify({...data, id: cxId}));
                    
                    const isOverdue = data.nextServiceDate < today;
                    const badgeClass = isOverdue ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600';
                    const badgeText = isOverdue ? 'Overdue' : 'Due Today';

                    tasksHTML += `
                        <div class="bg-white p-5 rounded-2xl border ${isOverdue ? 'border-red-100' : 'border-gray-100'} shadow-sm transition-all hover:shadow-md">
                            <div class="flex justify-between items-start mb-3">
                                <div>
                                    <h4 class="font-bold text-dark text-lg">${data.name}</h4>
                                    <p class="text-xs text-gray-500 mt-1 flex items-start gap-1">
                                        📍 ${data.address}
                                    </p>
                                </div>
                                <span class="${badgeClass} text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">${badgeText}</span>
                            </div>
                            
                            <div class="flex items-center gap-4 text-sm text-gray-600 mb-4 bg-gray-50 p-2 rounded-lg">
                                <p><strong>📞</strong> ${data.phone}</p>
                                <p><strong>⚙️</strong> ${data.unitType || 'AMC'}</p>
                            </div>

                            <div class="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                                <button onclick="window.openRescheduleModal('${cxId}', '${data.name.replace(/'/g, "\\'")}')" class="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl transition-colors hover:bg-gray-50">
                                    Reschedule
                                </button>
                                <button onclick="window.openServiceModal('${encodedData}')" class="flex items-center justify-center gap-2 bg-brandBlue text-white font-semibold py-2.5 rounded-xl shadow-sm transition-colors hover:bg-blue-700 active:scale-95">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    Complete
                                </button>
                            </div>
                        </div>
                    `;
                }
            });

            taskCountBadge.textContent = `${count} Tasks`;
            if (count === 0) {
                tasksListEl.innerHTML = `
                    <div class="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                        <div class="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                        <h3 class="text-gray-900 font-bold">All caught up!</h3>
                        <p class="text-gray-500 text-sm mt-1">No pending services for today.</p>
                    </div>`;
            } else {
                tasksListEl.innerHTML = tasksHTML;
            }

        } catch (error) {
            console.error("Error fetching tasks: ", error);
            tasksListEl.innerHTML = `<div class="text-center text-red-500 py-10">Error loading data. Check internet connection.</div>`;
        }
    };

    // --- 4. Service Action Modal (Complete & Bill) ---
    const serviceActionModal = document.getElementById('service-action-modal');
    const serviceActionForm = document.getElementById('service-action-form');
    const generateBillBtn = document.getElementById('generate-bill-btn');
    
    window.openServiceModal = (encodedData) => {
        const data = JSON.parse(decodeURIComponent(encodedData));
        document.getElementById('action-cx-id').value = data.id;
        document.getElementById('action-cx-fulldata').value = encodedData;
        document.getElementById('action-cx-name').textContent = data.name;
        
        serviceActionModal.classList.remove('hidden');
        serviceActionModal.classList.add('flex');
    };

    document.querySelectorAll('.close-action-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            serviceActionModal.classList.add('hidden');
            serviceActionModal.classList.remove('flex');
            serviceActionForm.reset();
        });
    });

    // Handle Service Completion Submission
    serviceActionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const originalBtnText = generateBillBtn.innerHTML;
        generateBillBtn.innerHTML = `Processing...`;
        generateBillBtn.disabled = true;

        try {
            const cxId = document.getElementById('action-cx-id').value;
            const fullData = JSON.parse(decodeURIComponent(document.getElementById('action-cx-fulldata').value));
            
            const serviceStatus = document.getElementById('action-status').value;
            const partsReplaced = document.getElementById('action-parts').value || '-';
            const remarks = document.getElementById('action-remarks').value || '-';
            const amountCollected = document.getElementById('action-amount').value;
            const today = getTodayStr();

            // A. Save to Services History (servicesCol)
            await addDoc(servicesCol, {
                customerId: cxId,
                customerName: fullData.name,
                serviceDate: today,
                status: serviceStatus,
                partsReplaced: partsReplaced,
                remarks: remarks,
                amount: amountCollected,
                engineer: 'Tech App', 
                timestamp: serverTimestamp()
            });

            // B. Update Customer's Next Service Date (Next Quarter)
            const nextDate = new Date();
            nextDate.setMonth(nextDate.getMonth() + 3); // 3 months for quarterly
            
            await updateDoc(doc(db, "customers", cxId), {
                nextServiceDate: nextDate.toISOString().split('T')[0],
                lastServiceDate: today
            });

            // C. Generate PDF Invoice
            // Map data to the hidden PDF template
            document.getElementById('pdf-cx-name').textContent = fullData.name;
            document.getElementById('pdf-cx-address').textContent = fullData.address;
            document.getElementById('pdf-cx-phone').textContent = fullData.phone;
            document.getElementById('pdf-cx-start').textContent = formatDateToIND(fullData.createdAt?.toDate ? fullData.createdAt.toDate() : new Date()); // Approximate start
            
            // Calculate Contract End (assuming 1 year from start if not set)
            let endD = fullData.createdAt?.toDate ? fullData.createdAt.toDate() : new Date();
            endD.setFullYear(endD.getFullYear() + (parseInt(fullData.duration) || 1));
            document.getElementById('pdf-cx-end').textContent = formatDateToIND(endD);

            document.getElementById('pdf-cx-unit').textContent = fullData.unitType || 'General';
            document.getElementById('pdf-cx-amount').textContent = `Rs. ${fullData.amount || 0}/-`;

            // Fill Table row
            document.getElementById('pdf-s-date').textContent = formatDateToIND(today);
            document.getElementById('pdf-s-status').textContent = serviceStatus;
            document.getElementById('pdf-s-parts').textContent = partsReplaced;
            document.getElementById('pdf-s-remark').textContent = remarks;

            const element = document.getElementById('invoice-content');
            const pdfContainer = document.getElementById('invoice-template-container');
            pdfContainer.classList.remove('hidden'); // Show off-screen to render

            const opt = {
                margin:       0.2,
                filename:     `OWS_Service_Card_${fullData.name.replace(/\s+/g, '_')}.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true },
                jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
            };

            await html2pdf().set(opt).from(element).save();
            pdfContainer.classList.add('hidden'); // Hide again

            // D. Send WhatsApp Intimation
            const waMessage = `*Om Water Solution*\n\nHello ${fullData.name},\nYour RO service is complete.\n\n*Date:* ${formatDateToIND(today)}\n*Status:* ${serviceStatus}\n*Remarks:* ${remarks}\n*Amount Collected:* Rs. ${amountCollected}/-\n\nThank you for choosing us!\nSupport: 9920716891`;
            const waUrl = `https://wa.me/91${fullData.phone}?text=${encodeURIComponent(waMessage)}`;
            window.open(waUrl, '_blank');

            // Cleanup & Refresh
            serviceActionModal.classList.add('hidden');
            serviceActionModal.classList.remove('flex');
            serviceActionForm.reset();
            fetchDueTasks();

            if (navigator.vibrate) navigator.vibrate([100, 50, 100]); // Success pattern

        } catch (error) {
            console.error(error);
            alert("Error processing service. Please check connection.");
        } finally {
            generateBillBtn.innerHTML = originalBtnText;
            generateBillBtn.disabled = false;
        }
    });

    // --- 5. Reschedule Modal Logic ---
    const rescheduleModal = document.getElementById('reschedule-modal');
    const rescheduleForm = document.getElementById('reschedule-form');
    
    window.openRescheduleModal = (id, name) => {
        document.getElementById('reschedule-cx-id').value = id;
        document.getElementById('reschedule-cx-name').textContent = `For: ${name}`;
        rescheduleModal.classList.remove('hidden');
        rescheduleModal.classList.add('flex');
    };

    document.querySelectorAll('.close-reschedule-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            rescheduleModal.classList.add('hidden');
            rescheduleModal.classList.remove('flex');
        });
    });

    rescheduleForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('confirm-reschedule-btn');
        btn.textContent = "Updating...";
        btn.disabled = true;

        try {
            const cxId = document.getElementById('reschedule-cx-id').value;
            const newDate = document.getElementById('new-visit-date').value;
            
            await updateDoc(doc(db, "customers", cxId), {
                nextServiceDate: newDate
            });

            rescheduleModal.classList.add('hidden');
            rescheduleModal.classList.remove('flex');
            fetchDueTasks(); // Remove from today's list automatically!
            
        } catch (error) {
            alert("Failed to reschedule.");
        } finally {
            btn.textContent = "Update";
            btn.disabled = false;
        }
    });

    // --- 6. Add Walk-In Customer (Tech Portal) ---
    // (We reuse the exact same logic from Admin so Techs can add customers on the field)
    const addCxModal = document.getElementById('add-cx-modal');
    const openAddCxBtn = document.getElementById('open-add-cx-btn');
    const closeAddCxModalBtn = document.getElementById('close-add-cx-modal');
    const addCxForm = document.getElementById('add-cx-form');

    openAddCxBtn.addEventListener('click', () => { addCxModal.classList.remove('hidden'); addCxModal.classList.add('flex'); });
    closeAddCxModalBtn.addEventListener('click', () => { addCxModal.classList.add('hidden'); addCxModal.classList.remove('flex'); });

    addCxForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('save-cx-btn');
        submitBtn.textContent = "Saving Data...";
        submitBtn.disabled = true;

        try {
            const nextDate = new Date();
            nextDate.setMonth(nextDate.getMonth() + 3);

            await addDoc(customersCol, {
                name: document.getElementById('cx-name').value,
                phone: document.getElementById('cx-phone').value,
                address: document.getElementById('cx-address').value,
                unitType: document.getElementById('cx-unit').value,
                planType: document.getElementById('cx-plan').value,
                duration: document.getElementById('cx-duration').value,
                amount: document.getElementById('cx-amount').value,
                status: "Active",
                nextServiceDate: nextDate.toISOString().split('T')[0],
                createdAt: serverTimestamp()
            });

            addCxModal.classList.add('hidden');
            addCxModal.classList.remove('flex');
            addCxForm.reset();
            alert("Customer added to master database!");
        } catch (err) {
            alert("Error saving customer.");
        } finally {
            submitBtn.textContent = "Save to Master DB";
            submitBtn.disabled = false;
        }
    });

    // --- 7. Logout ---
    document.getElementById('logout-btn').addEventListener('click', () => {
        sessionStorage.removeItem('techAuth');
        window.location.replace('index.html');
    });

    // Boot up
    fetchDueTasks();
});
