// marketing/js/dashboard.js

import { onSnapshot, collection, addDoc, updateDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

document.addEventListener('DOMContentLoaded', () => {

    const tableBody = document.getElementById('mkt-table-body');
    const filterBtns = document.querySelectorAll('.mkt-filter-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const searchInput = document.getElementById('mkt-search-input');
    const clearSearchBtn = document.getElementById('mkt-clear-search');

    // Modals
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

    // --- Search Bar Event Listeners ---
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

    // --- Real-time Sync with onSnapshot ---
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
                    } else {
                        converted++;
                    }
                    allLeads.push({ id: docSnap.id, ...data, callStatus });
                }
            });

            // Update Stats UI
            document.getElementById('mkt-total').textContent = total;
            document.getElementById('mkt-pending').textContent = pending;
            document.getElementById('mkt-converted').textContent = converted;

            renderTable(currentFilter);
        }, (error) => {
            console.error("Marketing real-time sync error:", error);
            if(tableBody) tableBody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-red-500">Failed to sync calling data.</td></tr>`;
        });
    };

    // --- Render Table with Filters and Search ---
    const renderTable = (filterCat) => {
        if(!tableBody) return;
        currentFilter = filterCat;
        let html = '';

        let filtered = allLeads.filter(item => {
            // Category Filter
            if(filterCat === 'pending') {
                if(item.callStatus !== 'Pending' && item.callStatus !== 'Call Back Later') return false;
            } else if(filterCat === 'done') {
                if(item.callStatus === 'Pending' || item.callStatus === 'Call Back Later') return false;
            }

            // Search Query Filter
            if(searchQuery) {
                const nameMatch = item.name && item.name.toLowerCase().includes(searchQuery);
                const phoneMatch = item.phone && item.phone.includes(searchQuery);
                const billMatch = item.billNo && item.billNo.toLowerCase().includes(searchQuery);
                return nameMatch || phoneMatch || billMatch;
            }
            return true;
        });

        if(filtered.length === 0) {
            html = `<tr><td colspan="5" class="p-8 text-center text-gray-400">No leads or service records found.</td></tr>`;
        } else {
            filtered.forEach(item => {
                let badgeColor = 'bg-yellow-100 text-yellow-800';
                if(item.callStatus === 'Confirmed / Scheduled') badgeColor = 'bg-green-100 text-green-800';
                if(item.callStatus === 'Not Interested') badgeColor = 'bg-red-100 text-red-800';

                html += `
                    <tr class="hover:bg-gray-50 transition">
                        <td class="p-4">
                            <p class="font-bold text-gray-900">${item.name}</p>
                            <p class="text-xs text-gray-500 mt-0.5">📞 ${item.phone} • <span class="text-purple-600 font-bold">Bill ID: #${item.billNo || 'N/A'}</span></p>
                        </td>
                        <td class="p-4 text-sm text-gray-600">
                            ${item.nextServiceDate || 'N/A'}
                        </td>
                        <td class="p-4">
                            <span class="px-3 py-1 rounded-full text-xs font-bold ${badgeColor}">${item.callStatus || 'Pending'}</span>
                        </td>
                        <td class="p-4 text-xs text-gray-500 max-w-xs truncate">
                            ${item.callRemarks || 'No remarks added yet'}
                        </td>
                        <td class="p-4 text-right">
                            <button onclick="window.openCallModal('${item.id}', '${item.name}', '${item.callStatus || 'Pending'}', '${item.callRemarks || ''}')" class="bg-purple-50 text-purple-600 font-semibold px-3 py-1.5 rounded-lg text-xs hover:bg-purple-100 transition">
                                Update Call
                            </button>
                        </td>
                    </tr>
                `;
            });
        }
        tableBody.innerHTML = html;
    };

    // --- Open Call Status Modal ---
    window.openCallModal = (id, name, status, remarks) => {
        document.getElementById('call-cx-id').value = id;
        document.getElementById('call-cx-name').value = name;
        document.getElementById('call-status-select').value = status;
        document.getElementById('call-remarks').value = remarks === 'No remarks added yet' ? '' : remarks;

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
                callStatus, callRemarks,
                lastCalledAt: serverTimestamp()
            });

            callModal.classList.add('hidden');
            callModal.classList.remove('flex');
            alert("Call status updated successfully!");
        } catch (err) {
            console.error(err);
            alert("Error updating call status.");
        } finally {
            btn.textContent = "Save Call Status"; btn.disabled = false;
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
            alert("New lead added successfully with Bill ID: " + billNo);
        } catch (err) {
            console.error(err);
            alert("Error adding lead.");
        } finally {
            btn.textContent = "Save & Push to Master Database"; btn.disabled = false;
        }
    });

    // Filter Buttons Event Listeners
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active', 'bg-white', 'shadow', 'text-gray-800'));
            e.target.classList.add('active', 'bg-white', 'shadow', 'text-gray-800');
            renderTable(e.target.dataset.filter);
        });
    });

    if(logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionStorage.clear();
            window.location.replace('index.html');
        });
    }

    // Initialize Real-time Sync
    initRealtimeMarketing();
});
