// admin/js/dashboard.js

import { getDocs, collection, addDoc, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

document.addEventListener('DOMContentLoaded', async () => {

    // --- 1. SECURE SESSION CHECK ---
    const authStatus = sessionStorage.getItem('isAdminLoggedIn') || sessionStorage.getItem('adminAuth');
    if (authStatus !== 'true') {
        window.location.replace('index.html');
        return;
    }

    const tableBody = document.getElementById('master-table-body');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    const statTotal = document.getElementById('stat-total');
    const statToday = document.getElementById('stat-today');
    const statMissed = document.getElementById('stat-missed');
    const statUpcoming = document.getElementById('stat-upcoming');

    // Modals & Forms
    const addCxModal = document.getElementById('add-cx-modal');
    const openAddCxBtn = document.getElementById('open-add-cx-btn');
    const closeAddCxBtn = document.getElementById('close-add-cx-modal');
    const addCxForm = document.getElementById('add-cx-form');

    const historyModal = document.getElementById('history-modal');
    const closeHistoryModalBtn = document.getElementById('close-history-modal');
    const historyContent = document.getElementById('history-content');
    const historyModalTitle = document.getElementById('history-modal-title');

    let masterData = [];

    // Modal Toggles
    if(openAddCxBtn) openAddCxBtn.addEventListener('click', () => { addCxModal.classList.remove('hidden'); addCxModal.classList.add('flex'); });
    if(closeAddCxBtn) closeAddCxBtn.addEventListener('click', () => { addCxModal.classList.add('hidden'); addCxModal.classList.remove('flex'); });
    if(closeHistoryModalBtn) closeHistoryModalBtn.addEventListener('click', () => { historyModal.classList.add('hidden'); historyModal.classList.remove('flex'); });

    const getTodayStr = () => new Date().toISOString().split('T')[0];
    
    const getStatusInfo = (serviceDate) => {
        if (!serviceDate) return { text: 'No Data', class: 'bg-gray-100 text-gray-600', category: 'unknown' };
        const today = getTodayStr();
        if (serviceDate < today) return { text: 'Missed', class: 'bg-red-50 text-red-600 border border-red-200', category: 'missed' };
        if (serviceDate === today) return { text: 'Today', class: 'bg-orange-50 text-orange-600 border border-orange-200', category: 'today' };
        return { text: 'Upcoming', class: 'bg-green-50 text-green-600 border border-green-200', category: 'upcoming' };
    };

    // Fetch Master Data from Firebase
    const fetchMasterData = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "customers"));
            masterData = [];
            let counts = { total: 0, today: 0, missed: 0, upcoming: 0 };

            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                if(data.status !== "Deleted") { 
                    counts.total++;
                    const statusObj = getStatusInfo(data.nextServiceDate);
                    if(statusObj.category === 'missed') counts.missed++;
                    if(statusObj.category === 'today') counts.today++;
                    if(statusObj.category === 'upcoming') counts.upcoming++;

                    masterData.push({ id: docSnap.id, ...data, statusObj });
                }
            });

            statTotal.textContent = counts.total;
            statToday.textContent = counts.today;
            statMissed.textContent = counts.missed;
            statUpcoming.textContent = counts.upcoming;

            renderTable('all');
        } catch (error) {
            console.error("Error fetching data:", error);
            tableBody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-red-500">Failed to load data from server.</td></tr>`;
        }
    };

    // Render Master Table
    const renderTable = (filterCat) => {
        let html = '';
        const filteredData = filterCat === 'all' 
            ? masterData 
            : masterData.filter(item => item.statusObj.category === filterCat);

        if(filteredData.length === 0) {
            html = `<tr><td colspan="5" class="p-8 text-center text-slate-400">No records found.</td></tr>`;
        } else {
            filteredData.sort((a, b) => new Date(a.nextServiceDate || '2099-01-01') - new Date(b.nextServiceDate || '2099-01-01'));
            filteredData.forEach(item => {
                const nextDateFormatted = item.nextServiceDate ? new Date(item.nextServiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
                const contractFrom = item.startDate ? new Date(item.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '';
                const contractTo = item.endDate ? new Date(item.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '';

                html += `
                    <tr class="hover:bg-slate-50 transition-colors">
                        <td class="p-4">
                            <p class="font-bold text-slate-800">${item.name}</p>
                            <p class="text-xs text-slate-500">📞 ${item.phone} | ${item.address || ''}</p>
                        </td>
                        <td class="p-4 text-xs font-semibold text-slate-600">
                            ${contractFrom && contractTo ? `${contractFrom} to${contractTo}` : 'N/A'}
                            <p class="text-[10px] text-slate-400 font-normal">Bill: ${item.billNo || '-'} | ₹${item.amount || '0'}</p>
                        </td>
                        <td class="p-4 font-semibold text-slate-700">${nextDateFormatted}</td>
                        <td class="p-4"><span class="px-3 py-1 rounded-full text-xs font-bold ${item.statusObj.class}">${item.statusObj.text}</span></td>
                        <td class="p-4 text-right">
                            <button onclick="window.viewHistory('${item.id}', '${item.name}')" class="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-100 transition">History</button>
                        </td>
                    </tr>
                `;
            });
        }
        tableBody.innerHTML = html;
    };

    // Global function to view Service History Grid logs for a customer
    window.viewHistory = async (cxId, cxName) => {
        historyModalTitle.textContent = `Service History: ${cxName}`;
        historyContent.innerHTML = `<p class="text-center text-slate-400 py-6">Loading service cards logs...</p>`;
        historyModal.classList.remove('hidden');
        historyModal.classList.add('flex');

        try {
            const logsQuery = query(collection(db, "customers", cxId, "service_logs"), orderBy("date", "desc"));
            const snapshot = await getDocs(logsQuery);
            
            if(snapshot.empty) {
                historyContent.innerHTML = `<div class="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl"><p>No service history recorded yet.</p><p class="text-xs mt-1">Technician will update this during scheduled visits.</p></div>`;
                return;
            }

            let logsHtml = `<div class="space-y-3">`;
            snapshot.forEach(doc => {
                const log = doc.data();
                logsHtml += `
                    <div class="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-2">
                        <div class="flex justify-between items-center">
                            <span class="text-xs font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-md">📅 ${log.date || 'N/A'}</span>
                            <span class="text-xs font-semibold text-slate-500">Engineer: ${log.engineer || 'Amey'}</span>
                        </div>
                        <div class="grid grid-cols-2 gap-2 text-xs pt-1">
                            <div><span class="text-slate-400">Status:</span> <strong class="text-slate-700">${log.status || 'Service'}</strong></div>
                            <div><span class="text-slate-400">Part Replaced:</span> <strong class="text-slate-700">${log.partReplaced || 'None'}</strong></div>
                        </div>
                        <div class="text-xs pt-1 border-t border-slate-200/60">
                            <span class="text-slate-400">Remark:</span> <span class="text-slate-800 font-medium">${log.remark || 'N/A'}</span>
                        </div>
                    </div>
                `;
            });
            logsHtml += `</div>`;
            historyContent.innerHTML = logsHtml;

        } catch (err) {
            console.error(err);
            historyContent.innerHTML = `<p class="text-center text-red-500 py-4">Failed to load history logs.</p>`;
        }
    };

    // Save New Customer / Service Card
    if(addCxForm) {
        addCxForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const saveBtn = document.getElementById('save-cx-btn');
            saveBtn.textContent = "Saving Record...";
            saveBtn.disabled = true;

            try {
                const name = document.getElementById('cx-name').value;
                const phone = document.getElementById('cx-phone').value;
                const address = document.getElementById('cx-address').value;
                const unitType = document.getElementById('cx-unit').value;
                const startDate = document.getElementById('cx-start-date').value;
                const endDate = document.getElementById('cx-end-date').value;
                const amount = Number(document.getElementById('cx-amount').value);
                const billNo = document.getElementById('cx-bill').value;

                // Default next service date: 3 months from start date
                const startDt = new Date(startDate || Date.now());
                startDt.setMonth(startDt.getMonth() + 3);
                const nextServiceDate = startDt.toISOString().split('T')[0];

                await addDoc(collection(db, "customers"), {
                    name, phone, address, unitType, startDate, endDate, nextServiceDate, amount, billNo,
                    status: "Active",
                    createdAt: serverTimestamp()
                });

                addCxModal.classList.add('hidden');
                addCxModal.classList.remove('flex');
                addCxForm.reset();
                fetchMasterData();
            } catch (error) {
                console.error(error);
                alert("Failed to save customer record.");
            } finally {
                saveBtn.textContent = "Save Record";
                saveBtn.disabled = false;
            }
        });
    }

    // Filter Buttons logic
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => {
                b.classList.remove('bg-white', 'shadow', 'text-slate-800');
                b.classList.add('text-slate-500');
            });
            e.target.classList.add('bg-white', 'shadow', 'text-slate-800');
            e.target.classList.remove('text-slate-500');
            renderTable(e.target.dataset.filter);
        });
    });

    if(logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionStorage.clear();
            window.location.replace('index.html');
        });
    }

    fetchMasterData();
});
