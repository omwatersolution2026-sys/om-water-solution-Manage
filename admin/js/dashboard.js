import { getDocs, collection } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

document.addEventListener('DOMContentLoaded', async () => {

    // 👉 YAHAN BHI 'adminAuth' CHECK HO RAHA HAI
    if(sessionStorage.getItem('adminAuth') !== 'true') {
        window.location.replace('index.html');
        return; // Add return to stop execution if not logged in
    }

    const tableBody = document.getElementById('master-table-body');
    const filterBtns = document.querySelectorAll('.filter-btn');
    let masterData = [];

    // Helper functions for dates
    const getTodayStr = () => new Date().toISOString().split('T')[0];
    
    const getStatusInfo = (serviceDate) => {
        if (!serviceDate) return { text: 'No Data', class: 'bg-slate-100 text-slate-600', category: 'unknown' };
        
        const today = getTodayStr();
        if (serviceDate < today) return { text: 'Overdue / Missed', class: 'bg-red-100 text-red-700', category: 'missed' };
        if (serviceDate === today) return { text: 'Due Today', class: 'bg-orange-100 text-orange-700', category: 'today' };
        return { text: 'Upcoming', class: 'bg-green-100 text-green-700', category: 'upcoming' };
    };

    // Fetch and process data
    const fetchMasterData = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "customers"));
            masterData = [];
            
            let counts = { total: 0, today: 0, missed: 0, upcoming: 0 };

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if(data.status === "Active") { 
                    counts.total++;
                    const statusObj = getStatusInfo(data.nextServiceDate);
                    
                    if(statusObj.category === 'missed') counts.missed++;
                    if(statusObj.category === 'today') counts.today++;
                    if(statusObj.category === 'upcoming') counts.upcoming++;

                    masterData.push({ id: doc.id, ...data, statusObj });
                }
            });

            // Update Stats UI
            document.getElementById('stat-total').textContent = counts.total;
            document.getElementById('stat-today').textContent = counts.today;
            document.getElementById('stat-missed').textContent = counts.missed;
            document.getElementById('stat-upcoming').textContent = counts.upcoming;

            if(counts.missed > 0 || counts.today > 0) {
                document.getElementById('bell-badge').classList.remove('hidden');
            }

            renderTable('all');

        } catch (error) {
            console.error("Error fetching admin data:", error);
            if(tableBody) tableBody.innerHTML = `<tr><td colspan="4" class="p-8 text-center text-red-500">Failed to load data. Check console.</td></tr>`;
        }
    };

    // Render Table based on filter
    const renderTable = (filterCat) => {
        if(!tableBody) return;
        let html = '';
        const filteredData = filterCat === 'all' 
            ? masterData 
            : masterData.filter(item => item.statusObj.category === filterCat);

        if(filteredData.length === 0) {
            html = `<tr><td colspan="4" class="p-8 text-center text-slate-400">No records found for this category.</td></tr>`;
        } else {
            filteredData.sort((a, b) => new Date(a.nextServiceDate) - new Date(b.nextServiceDate));

            filteredData.forEach(item => {
                html += `
                    <tr class="hover:bg-slate-50 transition-colors">
                        <td class="p-4">
                            <p class="font-bold text-slate-800">${item.name}</p>
                            <p class="text-xs text-slate-500 mt-1">📞 ${item.phone}</p>
                        </td>
                        <td class="p-4 text-sm text-slate-600">
                            ${item.unitType || 'RO Service'}
                        </td>
                        <td class="p-4">
                            <span class="font-semibold text-slate-700">${item.nextServiceDate ? new Date(item.nextServiceDate).toLocaleDateString('en-IN') : '-'}</span>
                        </td>
                        <td class="p-4">
                            <span class="px-3 py-1 rounded-full text-xs font-bold ${item.statusObj.class}">${item.statusObj.text}</span>
                        </td>
                    </tr>
                `;
            });
        }
        tableBody.innerHTML = html;
    };

    // Filter Button Click Events
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => {
                b.classList.remove('active', 'bg-white', 'shadow', 'text-slate-800');
                b.classList.add('text-slate-500');
            });
            e.target.classList.add('active', 'bg-white', 'shadow', 'text-slate-800');
            e.target.classList.remove('text-slate-500');

            renderTable(e.target.dataset.filter);
        });
    });

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if(logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('adminAuth'); // Yahan bhi correct key remove karni hai
            window.location.replace('index.html');
        });
    }

    // Boot up
    fetchMasterData();
});
