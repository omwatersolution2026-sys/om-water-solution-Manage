// tech/js/dashboard.js

import { onSnapshot, collection, addDoc, updateDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

document.addEventListener('DOMContentLoaded', () => {

    const taskListEl = document.getElementById('task-list');
    const modal = document.getElementById('service-modal');
    const form = document.getElementById('service-form');
    const searchInput = document.getElementById('tech-search-input');
    const clearSearchBtn = document.getElementById('tech-clear-search');

    let allTasks = [];
    let searchQuery = '';

    // --- Real-time Sync with onSnapshot ---
    const initRealtimeTasks = () => {
        onSnapshot(collection(db, "customers"), (snapshot) => {
            allTasks = [];
            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                if(data.status !== "Deleted") {
                    allTasks.push({ id: docSnap.id, ...data });
                }
            });
            renderTasks();
        }, (error) => {
            console.error("Error syncing tasks in real-time:", error);
            taskListEl.innerHTML = `<div class="text-center text-red-500 py-10 text-sm">Failed to sync live tasks.</div>`;
        });
    };

    // --- Search Bar Event Listeners ---
    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            if(searchQuery.length > 0) {
                clearSearchBtn.classList.remove('hidden');
            } else {
                clearSearchBtn.classList.add('hidden');
            }
            renderTasks();
        });
    }

    if(clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchQuery = '';
            clearSearchBtn.classList.add('hidden');
            renderTasks();
        });
    }

    // --- Render Tasks (Live Search & Marketing Status View) ---
    const renderTasks = () => {
        let tasksHTML = '';
        let today = new Date().toISOString().split('T')[0];

        let filteredTasks = allTasks.filter(data => {
            if(searchQuery) {
                const nameMatch = data.name && data.name.toLowerCase().includes(searchQuery);
                const phoneMatch = data.phone && data.phone.includes(searchQuery);
                const billMatch = data.billNo && data.billNo.toLowerCase().includes(searchQuery);
                return nameMatch || phoneMatch || billMatch;
            }
            // Agar search nahi kar rahe toh default view (Sabhi active dikhao)
            return true; 
        });

        if(filteredTasks.length === 0) {
            taskListEl.innerHTML = `<div class="text-center text-gray-400 py-10 text-sm">No customer records found matching your search.</div>`;
            return;
        }

        // Sort: Due dates pehle dikhe
        filteredTasks.sort((a, b) => new Date(a.nextServiceDate || '2099-01-01') - new Date(b.nextServiceDate || '2099-01-01'));

        filteredTasks.forEach((data) => {
            const isDue = data.nextServiceDate && data.nextServiceDate <= today;
            
            // Fetch Marketing Status
            const callStatus = data.callStatus || 'Pending Call';
            const callRemarks = data.callRemarks || 'No remarks from marketing yet';

            // Status Badge Colors
            let statusBadgeColor = 'bg-yellow-50 text-yellow-700 border-yellow-200';
            if(callStatus === 'Confirmed / Scheduled') statusBadgeColor = 'bg-green-50 text-green-700 border-green-200';
            if(callStatus === 'Not Interested') statusBadgeColor = 'bg-red-50 text-red-700 border-red-200';

            tasksHTML += `
                <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between space-y-3">
                    <div class="flex justify-between items-start">
                        <div>
                            <h4 class="font-bold text-gray-900 text-base">${data.name}</h4>
                            <span class="text-xs text-blue-600 font-bold">Bill ID: #${data.billNo || 'N/A'}</span>
                        </div>
                        <span class="${isDue ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'} text-[10px] font-bold px-2 py-1 rounded">
                            ${isDue ? 'Service Due' : 'Scheduled'}
                        </span>
                    </div>

                    <div class="text-xs text-gray-600 space-y-1">
                        <p>📞 Phone: <a href="tel:${data.phone}" class="text-blue-600 font-semibold">${data.phone}</a></p>
                        <p>📍 Address: ${data.address || 'Location not added'}</p>
                        <p>📅 Next Service: <strong>${data.nextServiceDate || 'N/A'}</strong></p>
                    </div>

                    <!-- CALLING & MARKETING UPDATE BOX (VISIBLE TO TECH) -->
                    <div class="p-3 rounded-lg border text-xs ${statusBadgeColor} space-y-1">
                        <div class="flex justify-between font-bold">
                            <span>Caller Status: ${callStatus}</span>
                        </div>
                        <p class="text-gray-700 italic">Remark: "${callRemarks}"</p>
                    </div>
                    
                    <!-- SERVICE UPDATE BUTTON -->
                    <button onclick="window.openServiceModal('${data.id}', '${data.name}', '${data.phone}')" class="w-full bg-blue-600 text-white font-bold py-3 rounded-xl text-sm shadow-md hover:bg-blue-700 transition flex items-center justify-center gap-2 mt-2">
                        <span>Attend & Update Service</span>
                    </button>
                </div>
            `;
        });

        taskListEl.innerHTML = tasksHTML;
    };

    // --- Add Customer Modal Logic ---
    const addCxModal = document.getElementById('add-cx-modal');
    document.getElementById('open-add-cx-btn').addEventListener('click', () => {
        addCxModal.classList.remove('hidden');
        addCxModal.classList.add('flex');
    });
    document.getElementById('close-add-cx-modal').addEventListener('click', () => {
        addCxModal.classList.add('hidden');
        addCxModal.classList.remove('flex');
    });

    document.getElementById('add-cx-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('save-cx-btn');
        btn.textContent = "Saving..."; btn.disabled = true;

        try {
            const name = document.getElementById('new-name').value;
            const phone = document.getElementById('new-phone').value;
            const address = document.getElementById('new-address').value;
            const unitType = document.getElementById('new-unit').value;
            let billNo = document.getElementById('new-bill').value;

            if(!billNo) {
                const randomNum = Math.floor(1000 + Math.random() * 9000);
                billNo = `OWS-2026-${randomNum}`;
            }

            const nextDate = new Date();
            nextDate.setMonth(nextDate.getMonth() + 3);

            await addDoc(collection(db, "customers"), {
                name, phone, address, unitType, billNo,
                status: "Active",
                callStatus: "Pending",
                callRemarks: "Added from Tech portal",
                nextServiceDate: nextDate.toISOString().split('T')[0],
                createdAt: serverTimestamp()
            });

            addCxModal.classList.add('hidden');
            addCxModal.classList.remove('flex');
            document.getElementById('add-cx-form').reset();
            alert("Customer added successfully with Bill ID: " + billNo);
        } catch (err) {
            console.error(err);
            alert("Error adding customer");
        } finally {
            btn.textContent = "Save & Set Initial Service"; btn.disabled = false;
        }
    });

    // --- Service Complete Logic (NO PDF - Direct DB Update) ---
    window.openServiceModal = (id, name, phone) => {
        document.getElementById('cust-id').value = id;
        document.getElementById('cust-name').value = name;
        document.getElementById('cust-phone').value = phone;
        
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    };

    document.getElementById('close-modal').addEventListener('click', () => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        form.reset();
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('save-service-btn');
        btn.textContent = "Saving Service Record..."; btn.disabled = true;

        try {
            const customerId = document.getElementById('cust-id').value;
            const amount = document.getElementById('service-amount').value;
            const notes = document.getElementById('service-notes').value;
            
            let parts = [];
            document.querySelectorAll('.part-check:checked').forEach(cb => parts.push(cb.value));
            
            let finalDescription = parts.length > 0 ? parts.join(', ') : 'General Service';
            if(notes) finalDescription += ` (${notes})`;

            // 1. Save log to sub-collection
            await addDoc(collection(db, "customers", customerId, "service_logs"), {
                date: new Date().toISOString().split('T')[0],
                status: "Service Completed",
                partReplaced: finalDescription,
                amount: amount,
                engineer: "Amey (Tech)",
                remark: "Service completed by technician",
                createdAt: serverTimestamp()
            });

            // 2. Next Service Date 3 months forward
            const nextDate = new Date();
            nextDate.setMonth(nextDate.getMonth() + 3);
            const nextServiceDateStr = nextDate.toISOString().split('T')[0];

            // 3. Update main record & Reset Calling Status for Admin/Marketing
            await updateDoc(doc(db, "customers", customerId), {
                nextServiceDate: nextServiceDateStr,
                lastServiceAmount: amount,
                lastServiceDetails: finalDescription,
                callStatus: "Pending", 
                callRemarks: "Service completed. Reset for next cycle."
            });

            modal.classList.add('hidden');
            modal.classList.remove('flex');
            form.reset();
            alert("Service saved successfully! Next due date updated to: " + nextServiceDateStr);

        } catch (error) {
            console.error(error);
            alert("Error saving service record.");
        } finally {
            btn.textContent = "Save Service Record & Update Due Date"; btn.disabled = false;
        }
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        sessionStorage.clear();
        window.location.replace('index.html');
    });

    // Initialize Real-time listener
    initRealtimeTasks();
});
