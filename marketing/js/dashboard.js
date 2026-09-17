import { addDoc, getDocs, doc, updateDoc, query, orderBy, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { db, leadsCol, customersCol } from "./firebase-config.js";

document.addEventListener('DOMContentLoaded', () => {

    // --- Tab Switching Logic ---
    const tabSales = document.getElementById('tab-sales');
    const tabService = document.getElementById('tab-service');
    const viewSales = document.getElementById('view-sales');
    const viewService = document.getElementById('view-service');

    tabSales.addEventListener('click', () => {
        viewSales.classList.remove('hidden'); viewService.classList.add('hidden');
        tabSales.classList.add('bg-brand', 'text-white', 'shadow'); tabSales.classList.remove('text-gray-500', 'bg-transparent');
        tabService.classList.remove('bg-brand', 'text-white', 'shadow'); tabService.classList.add('text-gray-500', 'bg-transparent');
    });

    tabService.addEventListener('click', () => {
        viewService.classList.remove('hidden'); viewSales.classList.add('hidden');
        tabService.classList.add('bg-brand', 'text-white', 'shadow'); tabService.classList.remove('text-gray-500', 'bg-transparent');
        tabSales.classList.remove('bg-brand', 'text-white', 'shadow'); tabSales.classList.add('text-gray-500', 'bg-transparent');
        fetchDueServices(); // Load services when tab is clicked
    });

    // --- Modal Logic ---
    const toggleModal = (modal, content, show) => {
        if(show) {
            modal.classList.remove('hidden'); modal.classList.add('flex');
            setTimeout(() => { modal.classList.remove('opacity-0'); content.classList.remove('translate-y-full'); }, 10);
        } else {
            modal.classList.add('opacity-0'); content.classList.add('translate-y-full');
            setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('flex'); }, 300);
        }
    };

    // Sales Lead Modal Setup (Simplified for brevity)
    document.getElementById('open-add-lead-btn').addEventListener('click', () => toggleModal(document.getElementById('add-lead-modal'), document.getElementById('add-modal-content'), true));
    document.querySelector('.close-add-btn').addEventListener('click', () => toggleModal(document.getElementById('add-lead-modal'), document.getElementById('add-modal-content'), false));

    // --- Fetch Due Services ---
    const fetchDueServices = async () => {
        const servicesListEl = document.getElementById('services-list');
        try {
            // Hum sirf unhe uthayenge jinka AMC chal raha hai.
            const q = query(customersCol, where("status", "==", "Active"));
            const querySnapshot = await getDocs(q);
            
            let servicesHTML = '';
            let today = new Date().toISOString().split('T')[0];

            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                // Check if nextServiceDate is today or passed
                if(data.nextServiceDate && data.nextServiceDate <= today) {
                    servicesHTML += `
                        <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                            <div class="flex justify-between items-start mb-3">
                                <div>
                                    <h4 class="font-bold text-gray-900">${data.name}</h4>
                                    <p class="text-xs text-red-500 font-bold mt-1">Due Date: ${data.nextServiceDate}</p>
                                </div>
                                <span class="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-1 rounded">AMC: ${data.unitType}</span>
                            </div>
                            <div class="text-sm text-gray-600 mb-4 flex items-center gap-2">📞 ${data.phone}</div>
                            <div class="mt-auto flex gap-2">
                                <a href="tel:${data.phone}" class="flex-1 bg-gray-50 border border-gray-200 text-gray-700 text-center py-2 rounded-lg text-sm font-semibold hover:bg-gray-100">Call Now</a>
                                <button onclick="window.openReschedule('${docSnap.id}', '${data.name}')" class="flex-1 bg-orange-50 text-orange-600 text-center py-2 rounded-lg text-sm font-semibold hover:bg-orange-100">Reschedule</button>
                            </div>
                        </div>
                    `;
                }
            });

            servicesListEl.innerHTML = servicesHTML || `<div class="text-center text-gray-400 py-10 text-sm col-span-full">No pending services right now!</div>`;
        } catch (error) {
            console.error("Error fetching services: ", error);
        }
    };

    // --- Reschedule Service Logic ---
    window.openReschedule = (customerId, customerName) => {
        document.getElementById('reschedule-customer-id').value = customerId;
        document.getElementById('reschedule-customer-name').textContent = "Customer: " + customerName;
        toggleModal(document.getElementById('reschedule-modal'), document.getElementById('reschedule-content'), true);
    };

    document.querySelector('.close-reschedule-btn').addEventListener('click', () => toggleModal(document.getElementById('reschedule-modal'), document.getElementById('reschedule-content'), false));

    document.getElementById('reschedule-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('confirm-reschedule-btn');
        btn.textContent = "Updating..."; btn.disabled = true;

        try {
            const customerId = document.getElementById('reschedule-customer-id').value;
            const newDate = document.getElementById('new-service-date').value;
            
            // Update customer record with new service date
            await updateDoc(doc(db, "customers", customerId), {
                nextServiceDate: newDate
            });

            toggleModal(document.getElementById('reschedule-modal'), document.getElementById('reschedule-content'), false);
            fetchDueServices(); // Refresh list
        } catch (error) {
            alert("Error updating date!");
        } finally {
            btn.textContent = "Reschedule"; btn.disabled = false;
        }
    });

    // Basic logout
    document.getElementById('logout-btn').addEventListener('click', () => {
        window.location.replace('index.html');
    });
});
