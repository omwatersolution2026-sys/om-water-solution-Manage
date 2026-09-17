import { getDocs, doc, updateDoc, query, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { db, customersCol } from "./firebase-config.js"; // Ensure tech folder has its own firebase-config.js

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
                // If service is due today or past due
                if(data.nextServiceDate && data.nextServiceDate <= today) {
                    tasksHTML += `
                        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <div class="flex justify-between items-start mb-2">
                                <h4 class="font-bold text-gray-900">${data.name}</h4>
                                <span class="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-1 rounded">Due</span>
                            </div>
                            <p class="text-xs text-gray-600 mb-3">📞 ${data.phone}</p>
                            <button onclick="window.openServiceModal('${docSnap.id}', '${data.name}', '${data.phone}')" class="w-full bg-blue-50 text-blue-600 font-semibold py-2 rounded-lg text-sm hover:bg-blue-100">Attend Service</button>
                        </div>
                    `;
                }
            });

            taskListEl.innerHTML = tasksHTML || `<div class="text-center text-gray-400 py-10 text-sm">No tasks assigned for today.</div>`;
        } catch (error) {
            console.error("Error fetching tasks:", error);
            taskListEl.innerHTML = `<div class="text-center text-red-500 py-10 text-sm">Failed to load tasks.</div>`;
        }
    };

    // Open Modal logic
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

    // Form Submit & PDF Generation
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('generate-btn');
        btn.textContent = "Generating PDF..."; btn.disabled = true;

        try {
            const customerId = document.getElementById('cust-id').value;
            const customerName = document.getElementById('cust-name').value;
            const customerPhone = document.getElementById('cust-phone').value;
            const amount = document.getElementById('service-amount').value;
            
            // Collect checked parts
            let parts = [];
            document.querySelectorAll('.part-check:checked').forEach(cb => parts.push(cb.value));
            const partsString = parts.length > 0 ? parts.join(', ') : 'General Checkup';

            // 1. Populate Hidden PDF Template
            const billNo = Math.floor(10000 + Math.random() * 90000);
            document.getElementById('inv-date').textContent = new Date().toLocaleDateString('en-IN');
            document.getElementById('inv-no').textContent = billNo;
            document.getElementById('inv-cust-name').textContent = customerName;
            document.getElementById('inv-cust-phone').textContent = "+91 " + customerPhone;
            document.getElementById('inv-parts').textContent = partsString;
            document.getElementById('inv-amount').textContent = `₹ ${amount}`;

            // 2. Generate PDF using html2pdf
            const element = document.getElementById('invoice-template');
            const opt = {
                margin:       0,
                filename:     `OWS_Bill_${customerName.replace(/\s+/g, '_')}.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2 },
                jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
            };

            // This will auto-download the PDF to Technician's phone
            await html2pdf().set(opt).from(element).save();

            // 3. Update Database (Shift next service date by 3 months)
            const nextDate = new Date();
            nextDate.setMonth(nextDate.getMonth() + 3);
            const formattedNextDate = nextDate.toISOString().split('T')[0];

            await updateDoc(doc(db, "customers", customerId), {
                nextServiceDate: formattedNextDate,
                lastServiceAmount: amount,
                lastServiceParts: partsString
            });

            // 4. Setup WhatsApp Share Button
            const waMsg = encodeURIComponent(`Hello ${customerName},\nYour RO service is complete.\n*Bill No:* OWS-${billNo}\n*Amount:* ₹${amount}\n\nPlease find the PDF bill attached in this chat.\n\nRegards,\n*Om Water Solution*`);
            const waLink = `https://wa.me/91${customerPhone}?text=${waMsg}`;
            
            document.getElementById('whatsapp-btn').href = waLink;
            btn.classList.add('hidden');
            document.getElementById('whatsapp-container').classList.remove('hidden');

        } catch (error) {
            console.error(error);
            alert("Error generating bill!");
            btn.textContent = "Complete & Generate Bill"; btn.disabled = false;
        }
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        window.location.replace('index.html'); // Assuming tech login page
    });

    // Boot up
    fetchTasks();
});
