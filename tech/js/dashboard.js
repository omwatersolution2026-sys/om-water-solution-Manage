import { getDocs, addDoc, doc, updateDoc, query, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { db, customersCol } from "./firebase-config.js";

document.addEventListener('DOMContentLoaded', () => {

    const taskListEl = document.getElementById('task-list');
    const modal = document.getElementById('service-modal');
    const form = document.getElementById('service-form');
    
    // Fetch today's services
    const fetchTasks = async () => {
        try {
            const q = query(customersCol, where("status", "==", "Active"));
            const querySnapshot = await getDocs(q);
            
            let tasksHTML = '';
            let today = new Date().toISOString().split('T')[0];

            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                if(data.nextServiceDate && data.nextServiceDate <= today) {
                    tasksHTML += `
                        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <div class="flex justify-between items-start mb-2">
                                <h4 class="font-bold text-gray-900">${data.name}</h4>
                                <span class="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-1 rounded">Due Today</span>
                            </div>
                            <p class="text-xs text-gray-600 mb-3">📞 ${data.phone} | 📍 ${data.address || 'Location not added'}</p>
                            <button onclick="window.openServiceModal('${docSnap.id}', '${data.name}', '${data.phone}')" class="w-full bg-blue-50 text-blue-600 font-semibold py-2 rounded-lg text-sm hover:bg-blue-100">Attend & Update Service</button>
                        </div>
                    `;
                }
            });

            taskListEl.innerHTML = tasksHTML || `<div class="text-center text-gray-400 py-10 text-sm">No pending services for today. Great job!</div>`;
        } catch (error) {
            console.error("Error fetching tasks:", error);
            taskListEl.innerHTML = `<div class="text-center text-red-500 py-10 text-sm">Failed to load tasks.</div>`;
        }
    };

    // --- Add Customer Modal Logic (Tech Side) ---
    const addCxModal = document.getElementById('add-cx-modal');
    document.getElementById('open-add-cx-btn').addEventListener('click', () => addCxModal.classList.remove('hidden') || addCxModal.classList.add('flex'));
    document.getElementById('close-add-cx-modal').addEventListener('click', () => addCxModal.classList.add('hidden') || addCxModal.classList.remove('flex'));

    document.getElementById('add-cx-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('save-cx-btn');
        btn.textContent = "Saving..."; btn.disabled = true;

        try {
            const name = document.getElementById('new-name').value;
            const phone = document.getElementById('new-phone').value;
            const address = document.getElementById('new-address').value;
            const unitType = document.getElementById('new-unit').value;

            const nextDate = new Date();
            nextDate.setMonth(nextDate.getMonth() + 3);

            await addDoc(customersCol, {
                name, phone, address, unitType,
                status: "Active",
                nextServiceDate: nextDate.toISOString().split('T')[0],
                createdAt: serverTimestamp()
            });

            addCxModal.classList.add('hidden');
            addCxModal.classList.remove('flex');
            document.getElementById('add-cx-form').reset();
            fetchTasks();
            alert("Customer added successfully!");
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

            const billNo = Math.floor(10000 + Math.random() * 90000);
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

            const nextDate = new Date();
            nextDate.setMonth(nextDate.getMonth() + 3);

            await updateDoc(doc(db, "customers", customerId), {
                nextServiceDate: nextDate.toISOString().split('T')[0],
                lastServiceAmount: amount,
                lastServiceDetails: finalDescription
            });

            const waMsg = encodeURIComponent(`Hello ${customerName},\nYour RO water service is completed.\n*Bill No:* OWS-${billNo}\n*Amount Paid:* ₹${amount}\n\nPlease find your service invoice attached in this chat.\n\n*Om Water Solution*`);
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
        window.location.replace('index.html');
    });

    fetchTasks();
});
