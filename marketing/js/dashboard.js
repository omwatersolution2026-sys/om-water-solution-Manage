// marketing/js/dashboard.js

import { getDocs, collection, updateDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

document.addEventListener('DOMContentLoaded', async () => {
    
    // --- 1. SECURE SESSION CHECK ---
    const mktAuth = sessionStorage.getItem('marketingAuth');
    const adminAuth = sessionStorage.getItem('isAdminLoggedIn') || sessionStorage.getItem('adminAuth');
    if (mktAuth !== 'true' && adminAuth !== 'true') {
        window.location.replace('index.html');
        return;
    }

    const tableBody = document.getElementById('mkt-table-body');
    const filterBtns = document.querySelectorAll('.mkt-filter-btn');
    const logoutBtn = document.getElementById('logout-btn');

    const callModal = document.getElementById('call-modal');
    const closeCallModalBtn = document.getElementById('close-call-modal');
    const callForm = document.getElementById('call-form');

    let marketingData = [];

    closeCallModalBtn.addEventListener('click', () => {
        callModal.classList.add('hidden');
        callModal.classList.remove('flex');
    });

    // --- Fetch Data for Calling Queue ---
    const fetchMarketingData = async () => {
        try {
            const snapshot = await getDocs(collection(db, "customers"));
            marketingData = [];
            let counts = { total: 0, pending: 0, converted: 0 };

            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                if(data.status !== "Deleted") {
                    counts.total++;
                    const cStatus = data.callingStatus || 'Pending';
                    if(cStatus === 'Pending' || cStatus === 'Call Back Later') {
                        counts.pending++;
                    } else if(cStatus === 'Confirmed / Scheduled') {
                        counts.converted++;
                    }

                    marketingData.push({ id: docSnap.id, ...data, cStatus });
                }
            });

            document.getElementById('mkt-total').textContent = counts.total;
            document.getElementById('mkt-pending').textContent = counts.pending;
            document.getElementById('mkt-converted').textContent = counts.converted;

            renderTable('all');
        } catch (err) {
            console.error(err);
            if(tableBody) tableBody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-red-500">Failed to load calling data.</td></tr>`;
        }
    };

    // --- Render Table ---
    const renderTable = (filter) => {
        if(!tableBody) return;
        let html = '';
        const filtered = marketingData.filter(item => {
            if(filter === 'pending') return item.cStatus === 'Pending' || item.cStatus === 'Call Back Later';
            if(filter === 'done') return item.cStatus === 'Confirmed / Scheduled' || item.cStatus === 'Not Interested';
            return true;
        });

        if(filtered.length === 0) {
            html = `<tr><td colspan="5" class="p-8 text-center text-slate-400">No leads found.</td></tr>`;
        } else {
            filtered.forEach(item => {
                let badgeClass = 'bg-yellow-100 text-yellow-700';
                if(item.cStatus === 'Confirmed / Scheduled') badgeClass = 'bg-green-100 text-green-700';
                if(item.cStatus === 'Not Interested') badgeClass = 'bg-red-100 text-red-700';
                if(item.cStatus === 'Call Back Later') badgeClass = 'bg-orange-100 text-orange-700';

                html += `
                    <tr class="hover:bg-slate-50 transition">
                        <td class="p-4">
                            <p class="font-bold text-slate-800">${item.name}</p>
                            <p class="text-xs text-slate-500">📞 ${item.phone} • 📍 ${item.address || 'N/A'}</p>
                        </td>
                        <td class="p-4 font-semibold text-slate-700">${item.nextServiceDate || 'N/A'}</td>
                        <td class="p-4">
                            <span class="px-3 py-1 rounded-full text-xs font-bold ${badgeClass}">${item.cStatus}</span>
                        </td>
                        <td class="p-4 text-xs text-slate-600">${item.callingRemark || 'No remarks yet'}</td>
                        <td class="p-4 text-right flex items-center justify-end gap-2">
                            <a href="tel:${item.phone}" class="bg-green-50 text-green-600 font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-green-100">Call</a>
                            <button onclick="window.openCallModal('${item.id}', '${item.name}', '${item.cStatus || 'Pending'}', '${item.callingRemark || ''}')" class="bg-purple-50 text-purple-600 font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-purple-100">Update</button>
                        </td>
                    </tr>
                `;
            });
        }
        tableBody.innerHTML = html;
    };

    // --- Open Modal for Status Update ---
    window.openCallModal = (id, name, status, remark) => {
        document.getElementById('call-cx-id').value = id;
        document.getElementById('call-cx-name').value = name;
        document.getElementById('call-status-select').value = status;
        document.getElementById('call-remarks').value = remark;
        callModal.classList.remove('hidden');
        callModal.classList.add('flex');
    };

    // --- Save Call Status Form ---
    callForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('save-call-btn');
        btn.textContent = "Saving...";
        btn.disabled = true;

        try {
            const cxId = document.getElementById('call-cx-id').value;
            const callingStatus = document.getElementById('call-status-select').value;
            const callingRemark = document.getElementById('call-remarks').value;

            await updateDoc(doc(db, "customers", cxId), {
                callingStatus,
                callingRemark,
                lastCalledAt: serverTimestamp()
            });

            callModal.classList.add('hidden');
            callModal.classList.remove('flex');
            fetchMarketingData();
            alert("Calling status updated successfully!");
        } catch (err) {
            console.error(err);
            alert("Failed to update status.");
        } finally {
            btn.textContent = "Save Call Status";
            btn.disabled = false;
        }
    });

    // Filters Event Listeners
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('bg-white', 'shadow', 'text-slate-800'));
            e.target.classList.add('bg-white', 'shadow', 'text-slate-800');
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

    fetchMarketingData();
});
