import { getDocs, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

document.addEventListener('DOMContentLoaded', async () => {

    // --- 1. SECURE SESSION CHECK (Loop Fix) ---
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

    const addCxModal = document.getElementById('add-cx-modal');
    const openAddCxBtn = document.getElementById('open-add-cx-btn');
    const closeAddCxBtn = document.getElementById('close-add-cx-modal');
    const addCxForm = document.getElementById('add-cx-form');

    let masterData = [];

    // Modal Toggles
    if(openAddCxBtn) {
        openAddCxBtn.addEventListener('click', () => {
            addCxModal.classList.remove('hidden');
            addCxModal.classList.add('flex');
        });
    }

    if(closeAddCxBtn) {
        closeAddCxBtn.addEventListener('click', () => {
            addCxModal.classList.add('hidden');
            addCxModal.classList.remove('flex');
        });
    }

    const getTodayStr = () => new Date().toISOString().split('T')[0];
    
    const getStatusInfo = (serviceDate) => {
        if (!serviceDate) return { text: 'No Data', class: 'bg-gray-100 text-gray-600', category: 'unknown' };
        const today = getTodayStr();
        if (serviceDate < today) return { text: 'Missed', class: 'bg-red-50 text-red-600 border border-red-200', category: 'missed' };
        if (serviceDate === today) return { text: 'Today', class: 'bg-orange-50 text-orange-600 border border-orange-200', category: 'today' };
        return { text: 'Upcoming', class: 'bg-green-50 text-green-600 border border-green-200', category: 'upcoming' };
    };

    // Fetch Master Data
    const fetchMasterData = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "customers"));
            masterData = [];
            let counts = { total: 0, today: 0, missed: 0, upcoming: 0 };

            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                if(data.status === "Active") { 
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
            tableBody.innerHTML = `<tr><td colspan="4" class="p-8 text-center text-red-500">Failed to load data.</td></tr>`;
        }
    };

    // Render Table
    const renderTable = (filterCat) => {
        let html = '';
        const filteredData = filterCat === 'all' 
            ? masterData 
            : masterData.filter(item => item.statusObj.category === filterCat);

        if(filteredData.length === 0) {
            html = `<tr><td colspan="4" class="p-8 text-center text-gray-400">No records found.</td></tr>`;
        } else {
            filteredData.sort((a, b) => new Date(a.nextServiceDate) - new Date(b.nextServiceDate));
            filteredData.forEach(item => {
                const formattedDate = item.nextServiceDate ? new Date(item.nextServiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
                html += `
                    <tr class="hover:bg-slate-50 transition-colors">
                        <td class="p-4">
                            <p class="font-bold text-slate-800">${item.name}</p>
                            <p class="text-xs text-slate-500">📞 ${item.phone} | ${item.address || ''}</p>
                        </td>
                        <td class="p-4 text-sm text-slate-600">${item.unitType || 'RO + UV'}</td>
                        <td class="p-4 font-semibold text-slate-700">${formattedDate}</td>
                        <td class="p-4"><span class="px-3 py-1 rounded-full text-xs font-bold ${item.statusObj.class}">${item.statusObj.text}</span></td>
                    </tr>
                `;
            });
        }
        tableBody.innerHTML = html;
    };

    // Save New Customer
    if(addCxForm) {
        addCxForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const saveBtn = document.getElementById('save-cx-btn');
            saveBtn.textContent = "Saving...";
            saveBtn.disabled = true;

            try {
                const name = document.getElementById('cx-name').value;
                const phone = document.getElementById('cx-phone').value;
                const address = document.getElementById('cx-address').value;
                const unitType = document.getElementById('cx-unit').value;
                const startDate = document.getElementById('cx-start-date').value;
                const amount = Number(document.getElementById('cx-amount').value);
                const billNo = document.getElementById('cx-bill').value;

                const startDt = new Date(startDate);
                startDt.setMonth(startDt.getMonth() + 3);
                const nextServiceDate = startDt.toISOString().split('T')[0];

                await addDoc(collection(db, "customers"), {
                    name, phone, address, unitType, startDate, nextServiceDate, amount, billNo,
                    status: "Active",
                    createdAt: serverTimestamp()
                });

                addCxModal.classList.add('hidden');
                addCxModal.classList.remove('flex');
                addCxForm.reset();
                fetchMasterData();
            } catch (error) {
                alert("Failed to save customer.");
            } finally {
                saveBtn.textContent = "Save Customer Data";
                saveBtn.disabled = false;
            }
        });
    }

    // Filter Buttons
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
