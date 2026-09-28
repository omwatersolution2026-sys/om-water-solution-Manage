// tech/js/dashboard.js

import { getDocs, collection, addDoc, updateDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

document.addEventListener('DOMContentLoaded', async () => {

    // --- 1. SECURE SESSION CHECK ---
    const authStatus = sessionStorage.getItem('techAuth');
    if (authStatus !== 'true') {
        window.location.replace('index.html');
        return;
    }

    const tasksListEl = document.getElementById('tech-tasks-list');
    const logoutBtn = document.getElementById('logout-btn');

    // Modal elements
    const serviceModal = document.getElementById('service-modal');
    const closeServiceModalBtn = document.getElementById('close-service-modal');
    const serviceForm = document.getElementById('service-update-form');
    
    let activeCustomer = null;

    if(closeServiceModalBtn) {
        closeServiceModalBtn.addEventListener('click', () => {
            serviceModal.classList.add('hidden');
            serviceModal.classList.remove('flex');
        });
    }

    // Fetch Customers / Tasks
    const fetchTechTasks = async () => {
        try {
            const snapshot = await getDocs(collection(db, "customers"));
            let tasksHtml = '';
            let count = 0;

            const todayStr = new Date().toISOString().split('T')[0];

            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                if(data.status !== "Deleted") {
                    count++;
                    const cx = { id: docSnap.id, ...data };
                    
                    tasksHtml += `
                        <div class="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50 transition">
                            <div>
                                <h4 class="font-bold text-slate-800 text-base">${cx.name}</h4>
                                <p class="text-xs text-slate-500">📍 ${cx.address || 'No Address'}</p>
                                <p class="text-xs font-semibold text-blue-600 mt-1">📞 Phone: ${cx.phone} | Unit: ${cx.unitType || 'Compact'}</p>
                            </div>
                            <div class="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                                <div class="text-right">
                                    <span class="text-xs font-bold block text-slate-400 uppercase">Due Date</span>
                                    <span class="text-xs font-bold text-slate-700">${cx.nextServiceDate || 'N/A'}</span>
                                </div>
                                <button onclick='window.openServiceModal(${JSON.stringify(cx)})' class="bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow hover:bg-orange-700 transition">
                                    Complete Service
                                </button>
                            </div>
                        </div>
                    `;
                }
            });

            if(count === 0) {
                tasksListEl.innerHTML = `<div class="p-8 text-center text-slate-400">No pending tasks found.</div>`;
            } else {
                tasksListEl.innerHTML = tasksHtml;
            }

        } catch (error) {
            console.error(error);
            tasksListEl.innerHTML = `<div class="p-8 text-center text-red-500">Failed to load tasks.</div>`;
        }
    };

    // Open Service Modal
    window.openServiceModal = (cx) => {
        activeCustomer = cx;
        document.getElementById('modal-cx-id').value = cx.id;
        document.getElementById('modal-cx-name').value = cx.name + ' (' + cx.phone + ')';
        document.getElementById('service-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('service-amount').value = cx.amount || 1800;
        document.getElementById('service-part').value = '';
        document.getElementById('service-remark').value = '';
        
        serviceModal.classList.remove('hidden');
        serviceModal.classList.add('flex');
    };

    // Handle Form Submit & PDF Generation
    serviceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if(!activeCustomer) return;

        const btn = document.getElementById('complete-service-btn');
        btn.textContent = "Processing & Generating PDF...";
        btn.disabled = true;

        try {
            const serviceDate = document.getElementById('service-date').value;
            const status = document.getElementById('service-status').value;
            const partReplaced = document.getElementById('service-part').value || 'None';
            const amount = document.getElementById('service-amount').value;
            const engineer = document.getElementById('service-engineer').value;
            const remark = document.getElementById('service-remark').value;

            // 1. Save log in customer's sub-collection (History Grid Data)
            await addDoc(collection(db, "customers", activeCustomer.id, "service_logs"), {
                date: serviceDate,
                status: status,
                partReplaced: partReplaced,
                remark: remark,
                amount: amount,
                engineer: engineer,
                createdAt: serverTimestamp()
            });

            // 2. Calculate next service date (3 months forward)
            const nextDt = new Date(serviceDate);
            nextDt.setMonth(nextDt.getMonth() + 3);
            const nextServiceDateStr = nextDt.toISOString().split('T')[0];

            // 3. Update customer's next service date in main collection
            await updateDoc(doc(db, "customers", activeCustomer.id), {
                nextServiceDate: nextServiceDateStr
            });

            // 4. Generate Official PDF Bill using jsPDF
            const { jsPDF } = window.jspdf;
            const docPdf = new jsPDF();

            // PDF Styling
            docPdf.setFont("helvetica", "bold");
            docPdf.setFontSize(18);
            docPdf.setTextColor(37, 99, 235); // Blue
            docPdf.text("OM WATER SOLUTION", 105, 20, { align: "center" });

            docPdf.setFontSize(10);
            docPdf.setTextColor(100, 100, 100);
            docPdf.text("Off. Add.: H. No. 1432/01, Nocil Colony, Talavali Gaon, Navi Mumbai - 400701", 105, 26, { align: "center" });
            docPdf.text("Mob.: 9920716891 / 9004909145", 105, 32, { align: "center" });

            docPdf.setLineWidth(0.5);
            docPdf.line(20, 38, 190, 38);

            docPdf.setFontSize(12);
            docPdf.setTextColor(0, 0, 0);
            docPdf.text("SERVICE & AMC BILL / CARD", 105, 46, { align: "center" });

            docPdf.setFontSize(11);
            docPdf.text(`Customer Name: ${activeCustomer.name}`, 20, 60);
            docPdf.text(`Address: ${activeCustomer.address || 'N/A'}`, 20, 68);
            docPdf.text(`Contact No: ${activeCustomer.phone}`, 20, 76);
            
            docPdf.text(`Service Date: ${serviceDate}`, 130, 60);
            docPdf.text(`Engineer: ${engineer}`, 130, 68);
            docPdf.text(`Unit: ${activeCustomer.unitType || 'Compact'}`, 130, 76);

            // Table Header Box
            docPdf.setFillColor(240, 240, 240);
            docPdf.rect(20, 90, 170, 10, "F");
            docPdf.setFont("helvetica", "bold");
            docPdf.text("Description / Status", 25, 97);
            docPdf.text("Part Replaced", 90, 97);
            docPdf.text("Amount", 160, 97);

            docPdf.setFont("helvetica", "normal");
            docPdf.text(`${status}`, 25, 110);
            docPdf.text(`${partReplaced}`, 90, 110);
            docPdf.text(`Rs. ${amount}/-`, 160, 110);

            docPdf.line(20, 120, 190, 120);
            docPdf.text(`Remark: ${remark || 'None'}`, 20, 132);
            docPdf.text(`Next Service Due: ${nextServiceDateStr}`, 20, 142);

            docPdf.text("Customer Signature", 140, 175);
            docPdf.text("For Om Water Solution", 25, 175);

            // Output PDF as Data URL & Trigger Download
            const pdfBlobUrl = docPdf.output('bloburl');
            window.open(pdfBlobUrl, '_blank');

            // WhatsApp Share Prompt
            const whatsappMsg = encodeURIComponent(`Hello ${activeCustomer.name}, thank you for choosing Om Water Solution. Your service is completed successfully. Next service due on ${nextServiceDateStr}. Amount paid: Rs. ${amount}/-`);
            window.open(`https://wa.me/91${activeCustomer.phone}?text=${whatsappMsg}`, '_blank');

            serviceModal.classList.add('hidden');
            serviceModal.classList.remove('flex');
            fetchTechTasks();

        } catch (err) {
            console.error(err);
            alert("Error updating service record.");
        } finally {
            btn.textContent = "Save Record & Download PDF Bill";
            btn.disabled = false;
        }
    });

    if(logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionStorage.clear();
            window.location.replace('index.html');
        });
    }

    fetchTechTasks();
});
