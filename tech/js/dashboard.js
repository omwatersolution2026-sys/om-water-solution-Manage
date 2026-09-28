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

    // --- Render Tasks (Live Search & Service Update Queue) ---
    const renderTasks = () => {
        let tasksHTML = '';
        let today = new Date().toISOString().split('T')[0];

        // Agar user search karega toh matching records aayenge, warna due ya saare active customers dikhenge
        let filteredTasks = allTasks.filter(data => {
            if(searchQuery) {
                const nameMatch = data.name && data.name.toLowerCase().includes(searchQuery);
                const phoneMatch = data.phone && data.phone.includes(searchQuery);
                const billMatch = data.billNo && data.billNo.toLowerCase().includes(searchQuery);
                return nameMatch || phoneMatch || billMatch;
            }
            // Default view: Due today or past due, plus active customers
            return true; 
        });

        if(filteredTasks.length === 0) {
            taskListEl.innerHTML = `<div class="text-center text-gray-400 py-10 text-sm">No customer records found matching your search.</div>`;
            return;
        }

        filteredTasks.forEach((data) => {
            const isDue = data.nextServiceDate && data.nextServiceDate <= today;
            tasksHTML += `
                <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <h4 class="font-bold text-gray-900 text-base">${data.name}</h4>
                            <span class="text-xs text-blue-600 font-bold">Bill ID: #${data.billNo || 'N/A'}</span>
                        </div>
                        <span class="${isDue ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'} text-[10px] font-bold px-2 py-1 rounded">
                            ${isDue ? 'Service Due' : 'Scheduled'}
                        </span>
                    </div>
                    <p class="text-xs text-gray-600 mb-1">📞 ${data.phone} | 📍 ${data.address || 'Location not added'}</p>
                    <p class="text-xs text-gray-500 mb-3">📅 Next Service Date: <strong>${data.nextServiceDate || 'N/A'}</strong></p>
                    
                    <!-- MAIN SERVICE UPDATE BUTTON -->
                    <button onclick="window.openServiceModal('${data.id}', '${data.name}', '${data.phone}')" class="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg text-sm shadow hover:bg-blue-700 transition flex items-center justify-center gap-2">
                        <span>Attend & Update Service</span>
                    </button>
                </div>
            `;
        });

        taskListEl.innerHTML = tasksHTML;
    };

    // --- Add Customer Modal Logic (Tech Side) ---
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

    // --- Service Complete & PDF Logic ---
    window.openServiceModal = (id, name, phone) => {
        document.getElementById('cust-id').value = id;
        document.getElementById('cust-name').value = name;
        document.getElementById('cust-phone').value = phone;
        
        document.getElementById('whatsapp-container').classList.add('hidden');
        document.getElementById('generate-btn').classList.remove('hidden');
        
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
        const btn = document.getElementById('generate-btn');
        btn.textContent = "Generating PDF..."; btn.disabled = true;

        try {
            const customerId = document.getElementById('cust-id').value;
            const customerName = document.getElementById('cust-name').value;
            const customerPhone = document.getElementById('cust-phone').value;
            const amount = document.getElementById('service-amount').value;
            const notes = document.getElementById('service-notes').value;
            
            let parts = [];
            document.querySelectorAll('.part-check:checked').forEach(cb => parts.push(cb.value));
            
            let finalDescription = parts.length > 0 ? parts.join(', ') : 'General Service';
            if(notes) finalDescription += ` (${notes})`;

            const billNo = `OWS-SRV-${Math.floor(1000 + Math.random() * 9000)}`;
            document.getElementById('inv-date').textContent = new Date().toLocaleDateString('en-IN');
            document.getElementById('inv-no').textContent = billNo;
            document.getElementById('inv-cust-name').textContent = customerName;
            document.getElementById('inv-cust-phone').textContent = "+91 " + customerPhone;
            document.getElementById('inv-parts').textContent = finalDescription;
            document.getElementById('inv-amount').textContent = `₹ ${amount}`;

            const element = document.getElementById('invoice-template');
            const opt = {
                margin: 0,
                filename: `OWS_Bill_${customerName.replace(/\s+/g, '_')}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
            };

            await html2pdf().set(opt).from(element).save();

            // Save log to sub-collection
            await addDoc(collection(db, "customers", customerId, "service_logs"), {
                date: new Date().toISOString().split('T')[0],
                status: "Service Completed",
                partReplaced: finalDescription,
                amount: amount,
                engineer: "Amey (Tech)",
                remark: "Service completed & PDF generated",
                createdAt: serverTimestamp()
            });

            const nextDate = new Date();
            nextDate.setMonth(nextDate.getMonth() + 3);
            const nextServiceDateStr = nextDate.toISOString().split('T')[0];

            await updateDoc(doc(db, "customers", customerId), {
                nextServiceDate: nextServiceDateStr,
                lastServiceAmount: amount,
                lastServiceDetails: finalDescription
            });

            const waMsg = encodeURIComponent(`Hello ${customerName},\nYour RO water service is completed.\n*Bill ID:* ${billNo}\n*Amount Paid:* ₹${amount}\n\nPlease find your service invoice attached in this chat.\n\n*Om Water Solution*`);
            document.getElementById('whatsapp-btn').href = `https://wa.me/91${customerPhone}?text=${waMsg}`;
            
            btn.classList.add('hidden');
            document.getElementById('whatsapp-container').classList.remove('hidden');

        } catch (error) {
            console.error(error);
            alert("Error generating bill!");
            btn.textContent = "Complete & Generate Bill PDF"; btn.disabled = false;
        }
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        sessionStorage.clear();
        window.location.replace('index.html');
    });

    // Initialize Real-time listener
    initRealtimeTasks();
});
