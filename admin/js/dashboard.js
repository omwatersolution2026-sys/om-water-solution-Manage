// admin/js/dashboard.js

import { onSnapshot, collection, addDoc, updateDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

document.addEventListener('DOMContentLoaded', async () => {

    // --- 1. SECURE SESSION CHECK ---
    const authLoggedIn = sessionStorage.getItem('isAdminLoggedIn');
    const authTrue = sessionStorage.getItem('adminAuth');
    if (authLoggedIn !== 'true' && authTrue !== 'true') {
        window.location.replace('index.html');
        return;
    }

    const tableBody = document.getElementById('master-table-body');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const globalSearchInput = document.getElementById('global-search-input');
    const clearSearchBtn = document.getElementById('clear-search-btn');

    // Modals elements
    const addCxModal = document.getElementById('add-cx-modal');
    const openAddCxBtn = document.getElementById('open-add-cx-btn');
    const closeAddCxBtn = document.getElementById('close-add-cx-modal');
    const addCxForm = document.getElementById('add-cx-form');

    const historyModal = document.getElementById('history-modal');
    const closeHistoryBtn = document.getElementById('close-history-modal');
    const historyContent = document.getElementById('history-content');
    const historyTitle = document.getElementById('history-modal-title');

    const quickServiceModal = document.getElementById('quick-service-modal');
    const openQuickServiceBtn = document.getElementById('open-quick-service-btn');
    const closeQuickServiceBtn = document.getElementById('close-quick-service');
    const quickServiceForm = document.getElementById('quick-service-form');
    const quickCxSelect = document.getElementById('quick-cx-select');
    const manualFieldsDiv = document.getElementById('manual-cx-fields');

    let masterData = [];
    let currentFilter = 'all';
    let searchQuery = '';

    // --- Modal Toggles ---
    openAddCxBtn.addEventListener('click', () => { addCxModal.classList.remove('hidden'); addCxModal.classList.add('flex'); });
    closeAddCxBtn.addEventListener('click', () => { addCxModal.classList.add('hidden'); addCxModal.classList.remove('flex'); });

    closeHistoryBtn.addEventListener('click', () => { historyModal.classList.add('hidden'); historyModal.classList.remove('flex'); });

    openQuickServiceBtn.addEventListener('click', () => {
        populateCustomerDropdown();
        document.getElementById('quick-service-date').value = new Date().toISOString().split('T')[0];
        quickServiceModal.classList.remove('hidden');
        quickServiceModal.classList.add('flex');
    });
    closeQuickServiceBtn.addEventListener('click', () => { 
        quickServiceModal.classList.add('hidden'); 
        quickServiceModal.classList.remove('flex');
        if(manualFieldsDiv) manualFieldsDiv.classList.add('hidden');
    });

    // Toggle Manual Fields if "+ Add New (From Paper Bill)" is selected
    if(quickCxSelect) {
        quickCxSelect.addEventListener('change', (e) => {
            if(e.target.value === 'NEW_MANUAL') {
                manualFieldsDiv.classList.remove('hidden');
            } else {
                manualFieldsDiv.classList.add('hidden');
            }
        });
    }

    // --- Search Bar Input Event ---
    if(globalSearchInput) {
        globalSearchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            if(searchQuery.length > 0) {
                clearSearchBtn.classList.remove('hidden');
            } else {
                clearSearchBtn.classList.add('hidden');
            }
            renderTable(currentFilter);
        });
    }

    if(clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            globalSearchInput.value = '';
            searchQuery = '';
            clearSearchBtn.classList.add('hidden');
            renderTable(currentFilter);
        });
    }

    // Helper functions for dates
    const getTodayStr = () => new Date().toISOString().split('T')[0];
    
    const getStatusInfo = (serviceDate) => {
        if (!serviceDate) return { text: 'No Schedule', class: 'bg-slate-100 text-slate-600', category: 'unknown' };
        const today = getTodayStr();
        if (serviceDate < today) return { text: 'Overdue / Missed', class: 'bg-red-100 text-red-700', category: 'missed' };
        if (serviceDate === today) return { text: 'Due Today', class: 'bg-orange-100 text-orange-700', category: 'today' };
        return { text: 'Upcoming', class: 'bg-green-100 text-green-700', category: 'upcoming' };
    };

    // --- Real-Time Data Sync using onSnapshot ---
    const initRealtimeListener = () => {
        onSnapshot(collection(db, "customers"), (snapshot) => {
            masterData = [];
            let counts = { total: 0, today: 0, missed: 0, upcoming: 0 };

            snapshot.forEach((docSnap) => {
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

            // Update Stats UI Live
            document.getElementById('stat-total').textContent = counts.total;
            document.getElementById('stat-today').textContent = counts.today;
            document.getElementById('stat-missed').textContent = counts.missed;
            document.getElementById('stat-upcoming').textContent = counts.upcoming;

            renderTable(currentFilter);
        }, (error) => {
            console.error("Real-time sync error:", error);
            if(tableBody) tableBody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-red-500">Failed to sync live data.</td></tr>`;
        });
    };

    // Populate Customer Dropdown for Quick Log
    const populateCustomerDropdown = () => {
        let optionsHtml = '<option value="">-- Choose Customer --</option>';
        optionsHtml += '<option value="NEW_MANUAL" class="font-bold text-blue-600">+ Add New (From Paper Bill)</option>';
        masterData.forEach(cx => {
            optionsHtml += `<option value="${cx.id}">${cx.name} (${cx.phone}) - Bill: #${cx.billNo || 'N/A'}</option>`;
        });
        quickCxSelect.innerHTML = optionsHtml;
        if(manualFieldsDiv) manualFieldsDiv.classList.add('hidden');
    };

    // --- Render Table with Search and Filters ---
    const renderTable = (filterCat) => {
        if(!tableBody) return;
        currentFilter = filterCat;
        let html = '';

        // Filter by category first
        let filteredData = filterCat === 'all' 
            ? masterData 
            : masterData.filter(item => item.statusObj.category === filterCat);

        // Filter by Search Query (Name, Phone, or Bill No)
        if(searchQuery) {
            filteredData = filteredData.filter(item => {
                const nameMatch = item.name && item.name.toLowerCase().includes(searchQuery);
                const phoneMatch = item.phone && item.phone.includes(searchQuery);
                const billMatch = item.billNo && item.billNo.toLowerCase().includes(searchQuery);
                return nameMatch || phoneMatch || billMatch;
            });
        }

        if(filteredData.length === 0) {
            html = `<tr><td colspan="5" class="p-8 text-center text-slate-400">No matching customer records found.</td></tr>`;
        } else {
            filteredData.sort((a, b) => new Date(a.nextServiceDate || '2099-01-01') - new Date(b.nextServiceDate || '2099-01-01'));

            filteredData.forEach(item => {
                html += `
                    <tr class="hover:bg-slate-50 transition-colors">
                        <td class="p-4">
                            <p class="font-bold text-slate-800">${item.name}</p>
                            <p class="text-xs text-slate-500 mt-0.5">📞 ${item.phone} • 📍 ${item.address || 'N/A'}</p>
                        </td>
                        <td class="p-4 text-sm text-slate-600">
                            <span class="font-semibold block text-slate-800">${item.unitType || 'Compact'}</span>
                            <span class="text-xs text-blue-600 font-bold">Bill ID: #${item.billNo || 'N/A'}</span> (₹${item.amount || '0'})
                        </td>
                        <td class="p-4">
                            <span class="font-semibold text-slate-700">${item.nextServiceDate ? new Date(item.nextServiceDate).toLocaleDateString('en-IN') : '-'}</span>
                        </td>
                        <td class="p-4">
                            <span class="px-3 py-1 rounded-full text-xs font-bold ${item.statusObj.class}">${item.statusObj.text}</span>
                        </td>
                        <td class="p-4 text-right">
                            <button onclick="window.viewServiceHistory('${item.id}', '${item.name}')" class="bg-blue-50 text-blue-600 font-semibold px-3 py-1.5 rounded-lg text-xs hover:bg-blue-100 transition">
                                View History Card
                            </button>
                        </td>
                    </tr>
                `;
            });
        }
        tableBody.innerHTML = html;
    };

    // --- View Service History Grid (Physical Card View) ---
    window.viewServiceHistory = async (cxId, cxName) => {
        historyTitle.textContent = `Service History Card: ${cxName}`;
        historyContent.innerHTML = `<div class="p-4 text-center text-slate-400">Loading service logs...</div>`;
        historyModal.classList.remove('hidden');
        historyModal.classList.add('flex');

        try {
            const { getDocs, collection } = await import("https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js");
            const logsSnapshot = await getDocs(collection(db, "customers", cxId, "service_logs"));
            let logsHtml = `
                <div class="bg-slate-50 p-3 rounded-xl border text-xs font-bold grid grid-cols-4 gap-2 text-slate-500 uppercase">
                    <div>Date / Status</div>
                    <div>Part Replaced</div>
                    <div>Amount</div>
                    <div>Engineer</div>
                </div>
            `;

            if(logsSnapshot.empty) {
                logsHtml += `<div class="p-6 text-center text-slate-400 text-sm">No service history logs recorded yet.</div>`;
            } else {
                logsSnapshot.forEach(logDoc => {
                    const log = logDoc.data();
                    logsHtml += `
                        <div class="bg-white p-3 rounded-xl border border-slate-100 text-sm grid grid-cols-4 gap-2 items-center shadow-sm">
                            <div>
                                <span class="font-bold text-slate-800 block">${log.date || 'N/A'}</span>
                                <span class="text-[11px] text-blue-600 font-semibold">${log.status || 'Service'}</span>
                            </div>
                            <div class="text-slate-600 text-xs">${log.partReplaced || 'None'}</div>
                            <div class="font-bold text-slate-800">₹${log.amount || '0'}</div>
                            <div class="text-xs text-slate-500">${log.engineer || 'Amey'}</div>
                        </div>
                    `;
                });
            }
            historyContent.innerHTML = logsHtml;
        } catch (err) {
            console.error(err);
            historyContent.innerHTML = `<div class="p-4 text-center text-red-500">Failed to load history.</div>`;
        }
    };

    // --- Add New Customer Form with Auto Parent Bill Number Generation ---
    addCxForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('save-cx-btn');
        btn.textContent = "Saving...";
        btn.disabled = true;

        try {
            const name = document.getElementById('cx-name').value;
            const phone = document.getElementById('cx-phone').value;
            const address = document.getElementById('cx-address').value;
            const unitType = document.getElementById('cx-unit').value;
            const startDate = document.getElementById('cx-start-date').value;
            const endDate = document.getElementById('cx-end-date').value;
            const amount = Number(document.getElementById('cx-amount').value);
            
            let billNo = document.getElementById('cx-bill').value;
            if(!billNo) {
                const randomNum = Math.floor(1000 + Math.random() * 9000);
                billNo = `OWS-2026-${randomNum}`;
            }

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
            alert("New service card added successfully with Bill ID: " + billNo);
        } catch (err) {
            console.error(err);
            alert("Error saving customer record.");
        } finally {
            btn.textContent = "Save Service Card Record";
            btn.disabled = false;
        }
    });

    // --- Direct Quick Service / Paper Bill Entry ---
    quickServiceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('save-quick-service-btn');
        btn.textContent = "Logging & Updating...";
        btn.disabled = true;

        try {
            let cxId = quickCxSelect.value;
            const serviceDate = document.getElementById('quick-service-date').value;
            const status = document.getElementById('quick-service-status').value;
            const partReplaced = document.getElementById('quick-service-part').value || 'None';
            const amount = document.getElementById('quick-service-amount').value;
            const engineer = document.getElementById('quick-service-engineer').value;
            const remark = document.getElementById('quick-service-remark').value;

            if(cxId === 'NEW_MANUAL') {
                const name = document.getElementById('manual-name').value;
                const phone = document.getElementById('manual-phone').value;
                const address = document.getElementById('manual-address').value;
                const unitType = document.getElementById('manual-unit').value;

                if(!name || !phone) {
                    alert("Please enter customer name and phone number.");
                    btn.textContent = "Save Service Log & Update";
                    btn.disabled = false;
                    return;
                }

                const autoBillNo = `OWS-PB-${Math.floor(1000 + Math.random() * 9000)}`;

                const newCxRef = await addDoc(collection(db, "customers"), {
                    name, phone, address, unitType,
                    startDate: serviceDate,
                    amount: Number(amount),
                    billNo: autoBillNo,
                    status: "Active",
                    createdAt: serverTimestamp()
                });
                cxId = newCxRef.id;
            }

            if(!cxId) {
                alert("Please select or add a customer.");
                btn.textContent = "Save Service Log & Update";
                btn.disabled = false;
                return;
            }

            // 1. Save log to sub-collection
            await addDoc(collection(db, "customers", cxId, "service_logs"), {
                date: serviceDate, status, partReplaced, amount, engineer, remark,
                createdAt: serverTimestamp()
            });

            // 2. Next Service Date 3 months forward
            const nextDt = new Date(serviceDate);
            nextDt.setMonth(nextDt.getMonth() + 3);
            const nextServiceDateStr = nextDt.toISOString().split('T')[0];

            // 3. Update main record
            await updateDoc(doc(db, "customers", cxId), {
                nextServiceDate: nextServiceDateStr
            });

            quickServiceModal.classList.add('hidden');
            quickServiceModal.classList.remove('flex');
            quickServiceForm.reset();
            if(manualFieldsDiv) manualFieldsDiv.classList.add('hidden');
            alert("Service logged successfully and next due date updated!");
        } catch (err) {
            console.error(err);
            alert("Failed to process paper record.");
        } finally {
            btn.textContent = "Save Service Log & Update";
            btn.disabled = false;
        }
    });

    // Filters Event Listeners
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active', 'bg-white', 'shadow', 'text-slate-800'));
            e.target.classList.add('active', 'bg-white', 'shadow', 'text-slate-800');
            renderTable(e.target.dataset.filter);
        });
    });

    // Logout
    if(logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionStorage.clear();
            window.location.replace('index.html');
        });
    }

    // Initialize Real-time Listener on Load
    initRealtimeListener();
});
