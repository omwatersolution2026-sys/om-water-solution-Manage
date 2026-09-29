// marketing/js/dashboard.js

import { onSnapshot, collection, addDoc, updateDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

document.addEventListener('DOMContentLoaded', () => {

    const tableBody = document.getElementById('mkt-table-body');
    const filterBtns = document.querySelectorAll('.mkt-filter-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const searchInput = document.getElementById('mkt-search-input');
    const clearSearchBtn = document.getElementById('mkt-clear-search');

    const callModal = document.getElementById('call-modal');
    const closeCallModalBtn = document.getElementById('close-call-modal');
    const callForm = document.getElementById('call-form');

    const addCxModal = document.getElementById('add-cx-modal');
    const openAddCxBtn = document.getElementById('open-add-cx-btn');
    const closeAddModalBtn = document.getElementById('close-add-modal');
    const addCxForm = document.getElementById('add-cx-form');

    let allLeads = [];
    let currentFilter = 'all';
    let searchQuery = '';

    // --- Modal Toggles ---
    if(openAddCxBtn) {
        openAddCxBtn.addEventListener('click', () => {
            document.getElementById('new-service-date').value = new Date().toISOString().split('T')[0];
            addCxModal.classList.remove('hidden');
            addCxModal.classList.add('flex');
        });
    }
    if(closeAddModalBtn) {
        closeAddModalBtn.addEventListener('click', () => {
            addCxModal.classList.add('hidden');
            addCxModal.classList.remove('flex');
        });
    }
    if(closeCallModalBtn) {
        closeCallModalBtn.addEventListener('click', () => {
            callModal.classList.add('hidden');
            callModal.classList.remove('flex');
        });
    }

    // --- Search Bar Logic ---
    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
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
            searchInput.value = '';
            searchQuery = '';
            clearSearchBtn.classList.add('hidden');
            renderTable(currentFilter);
        });
    }

    // --- Real-time Sync ---
    const initRealtimeMarketing = () => {
        onSnapshot(collection(db, "customers"), (snapshot) => {
            allLeads = [];
            let total = 0, pending = 0, converted = 0;

            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                if(data.status !== "Deleted") {
                    total++;
                    const callStatus = data.callStatus || 'Pending';
                    
                    if(callStatus === 'Pending' || callStatus === 'Call Back Later') {
                        pending++;
                    } else if(callStatus === 'Confirmed / Scheduled') {
                        converted++;
                    }

                    allLeads.push({ id: docSnap.id, ...data, callStatus });
                }
            });

            document.getElementById('mkt-total').textContent = total;
            document.getElementById('mkt-pending').textContent = pending;
            document.getElementById('mkt-converted').textContent = converted;

            renderTable(currentFilter);
        }, (error) => {
            console.error("Marketing real-time sync error:", error);
            if(tableBody) tableBody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-red-500">Failed to sync calling data.</td></tr>`;
        });
    };

    // --- Render Table (With Tech Highlight Logic) ---
    const renderTable = (filterCat) => {
        if(!tableBody) return;
        currentFilter = filterCat;
        let html = '';

        let filtered = allLeads.filter(item => {
            if(filterCat === 'pending') {
                if(item.callStatus !== 'Pending' && item.callStatus !== 'Call Back Later') return false;
            } else if(filterCat === 'done') {
                if(item.callStatus === 'Pending' || item.callStatus === 'Call Back Later') return false;
            }

            if(searchQuery) {
                const nameMatch = item.name && item.name.toLowerCase().includes(searchQuery);
                const phoneMatch = item.phone && item.phone.includes(searchQuery);
                const billMatch = item.billNo && item.billNo.toLowerCase().includes(searchQuery);
                return nameMatch || phoneMatch || billMatch;
            }
            return true;
        });

        filtered.sort((a, b) => new Date(a.nextServiceDate || '2099-01-01') - new Date(b.nextServiceDate || '2099-01-01'));

        if(filtered.length === 0) {
            html = `<tr><td colspan="5" class="p-8 text-center text-gray-400">No leads or service records found.</td></tr>`;
        } else {
            filtered.forEach(item => {
                let badgeColor = 'bg-yellow-50 text-yellow-700 border-yellow-200';
                if(item.callStatus === 'Confirmed / Scheduled') badgeColor = 'bg-green-50 text-green-700 border-green-200';
                if(item.callStatus === 'Not Interested') badgeColor = 'bg-red-50 text-red-700 border-red-200';

                // HIGHLIGHT TECH UPDATE LOGIC
                let remarkText = item.callRemarks || 'No remarks added yet';
                let remarkDisplay = '';
                
                if (remarkText.startsWith('✅ Tech')) {
                    // Tech update ayega toh green box mein clear dikhega Caller ko
                    remarkDisplay = `<div class="bg-green-50 border border-green-200 text-green-800 p-2.5 rounded-lg shadow-sm text-xs font-semibold leading-relaxed">${remarkText}</div>`;
                } else {
                    // Normal caller remark
                    remarkDisplay = `<p class="truncate text-xs text-gray-500" title="${remarkText}">${remarkText}</p>`;
                }

                html += `
                    <tr class="hover:bg-purple-50/30 transition-colors border-b border-gray-50 last:border-0">
                        <td class="p-4">
                            <p class="font-bold text-gray-900">${item.name}</p>
                            <p class="text-xs text-gray-500 mt-0.5">📞 ${item.phone} • <span class="text-purple-600 font-bold">Bill: #${item.billNo || 'N/A'}</span></p>
                        </td>
                        <td class="p-4 text-sm font-semibold text-gray-700">
                            ${item.nextServiceDate ? new Date(item.nextServiceDate).toLocaleDateString('en-IN') : 'N/A'}
                        </td>
                        <td class="p-4">
                            <span class="px-3 py-1 rounded-lg border text-[11px] font-bold inline-block ${badgeColor}">${item.callStatus || 'Pending'}</span>
                        </td>
                        <td class="p-4 max-w-[250px]">
                            ${remarkDisplay}
                        </td>
                        <td class="p-4 text-right">
                            <button onclick="window.openCallModal('${item.id}', '${item.name}', '${item.callStatus || 'Pending'}', '${remarkText.replace(/'/g, "\\'")}')" class="bg-purple-100 text-purple-700 font-bold px-4 py-2 rounded-xl text-xs hover:bg-purple-200 transition shadow-sm">
                                Update Status
                            </button>
                        </td>
                    </tr>
                `;
            });
        }
        tableBody.innerHTML = html;
    };

    // --- Open Call Modal ---
    window.openCallModal = (id, name, status, remarks) => {
        document.getElementById('call-cx-id').value = id;
        document.getElementById('call-cx-name').value = name;
        document.getElementById('call-status-select').value = status;
        
        // Agar tech update wala remark hai, toh usey overwrite karne denge
        let currentRemark = remarks === 'No remarks added yet' ? '' : remarks;
        if(currentRemark.startsWith('✅ Tech')) currentRemark = ''; // Clear tech note so caller can type fresh update for next service

        document.getElementById('call-remarks').value = currentRemark;

        callModal.classList.remove('hidden');
        callModal.classList.add('flex');
    };

    // --- Save Call Status Form ---
    callForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('save-call-btn');
        btn.textContent = "Saving..."; btn.disabled = true;

        try {
            const cxId = document.getElementById('call-cx-id').value;
            const callStatus = document.getElementById('call-status-select').value;
            const callRemarks = document.getElementById('call-remarks').value;

            await updateDoc(doc(db, "customers", cxId), {
                callStatus, 
                callRemarks,
                lastCalledAt: serverTimestamp()
            });

            callModal.classList.add('hidden');
            callModal.classList.remove('flex');
            alert("Call status pushed successfully to Tech/Admin!");
        } catch (err) {
            console.error(err);
            alert("Error updating call status.");
        } finally {
            btn.textContent = "Save & Push to Tech Portal"; btn.disabled = false;
        }
    });

    // --- Add New Lead Form ---
    addCxForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('save-new-cx-btn');
        btn.textContent = "Saving Lead..."; btn.disabled = true;

        try {
            const name = document.getElementById('new-name').value;
            const phone = document.getElementById('new-phone').value;
            const address = document.getElementById('new-address').value;
            const unitType = document.getElementById('new-unit').value;
            const nextServiceDate = document.getElementById('new-service-date').value;

            const randomNum = Math.floor(1000 + Math.random() * 9000);
            const billNo = `OWS-MKT-${randomNum}`;

            await addDoc(collection(db, "customers"), {
                name, phone, address, unitType, nextServiceDate, billNo,
                status: "Active",
                callStatus: "Pending",
                callRemarks: "New lead added by Marketing team",
                createdAt: serverTimestamp()
            });

            addCxModal.classList.add('hidden');
            addCxModal.classList.remove('flex');
            addCxForm.reset();
            alert("New lead added successfully! Bill ID: " + billNo);
        } catch (err) {
            console.error(err);
            alert("Error adding lead.");
        } finally {
            btn.textContent = "Save Lead to Database"; btn.disabled = false;
        }
    });

    // Filter Buttons 
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('bg-white', 'shadow', 'text-gray-800'));
            filterBtns.forEach(b => b.classList.add('text-gray-500'));
            
            e.target.classList.remove('text-gray-500');
            e.target.classList.add('bg-white', 'shadow', 'text-gray-800');
            
            renderTable(e.target.dataset.filter);
        });
    });

    if(logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionStorage.clear();
            window.location.replace('index.html');
        });
    }

    initRealtimeMarketing();
});
