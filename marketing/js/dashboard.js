/**
 * ==========================================
 * MARKETING DASHBOARD CONTROLLER
 * ==========================================
 * Handles Lead Management, Telecalling workflows, 
 * Follow-up tracking, and Lead-to-Customer Conversions.
 */

import { getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";
import { db, leadsCol, customersCol } from "./firebase-config.js";

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Security Check ---
    if(sessionStorage.getItem('marketingAuth') !== 'true') {
        window.location.replace('index.html');
        return;
    }

    // DOM Elements
    const leadsListEl = document.getElementById('leads-list');
    const statTotal = document.getElementById('stat-total');
    const statFollowup = document.getElementById('stat-followup');

    // Helper: Date Formatter
    const formatDate = (dateStr) => {
        if(!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    };

    // --- 2. Fetch & Render Leads ---
    const fetchLeads = async () => {
        try {
            // In a real production app, we would use query(leadsCol, orderBy("createdAt", "desc"))
            const querySnapshot = await getDocs(leadsCol);
            let leadsHTML = '';
            let totalLeads = 0;
            let followUpCount = 0;

            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const leadId = docSnap.id;
                totalLeads++;

                // Status Badge Colors
                let statusBadge = '';
                if(data.status === 'New') statusBadge = '<span class="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">New</span>';
                else if(data.status === 'Follow-up') {
                    followUpCount++;
                    statusBadge = `<span class="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Follow-up: ${formatDate(data.followupDate)}</span>`;
                }
                else if(data.status === 'Not Interested') statusBadge = '<span class="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Dropped</span>';
                
                const encodedData = encodeURIComponent(JSON.stringify({...data, id: leadId}));

                leadsHTML += `
                    <div class="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div class="flex justify-between items-start mb-2">
                            <div>
                                <h4 class="font-bold text-dark text-md">${data.name}</h4>
                                <p class="text-xs text-gray-500 mt-0.5">${data.requirement || 'General Enquiry'}</p>
                            </div>
                            ${statusBadge}
                        </div>
                        
                        ${data.remarks ? `<p class="text-[11px] text-gray-400 italic bg-gray-50 p-1.5 rounded mb-3 truncate">"${data.remarks}"</p>` : ''}
                        
                        <div class="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                            <!-- Direct Call Button -->
                            <a href="tel:+91${data.phone}" class="flex-1 flex items-center justify-center gap-2 bg-green-50 text-green-600 font-semibold py-2 rounded-xl border border-green-100 hover:bg-green-100 transition-colors">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path></svg>
                                Call
                            </a>
                            <!-- Update Status Button -->
                            <button onclick="window.openUpdateModal('${encodedData}')" class="flex-1 flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 font-semibold py-2 rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-colors">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                Update
                            </button>
                        </div>
                    </div>
                `;
            });

            statTotal.textContent = totalLeads;
            statFollowup.textContent = followUpCount;

            if(totalLeads === 0) {
                leadsListEl.innerHTML = `<div class="text-center py-10 text-gray-400 font-medium">No leads in pipeline. Time to add some!</div>`;
            } else {
                leadsListEl.innerHTML = leadsHTML;
            }

        } catch (error) {
            console.error("Error fetching leads:", error);
            leadsListEl.innerHTML = `<div class="text-center text-red-500 py-10">Error loading data.</div>`;
        }
    };


    // --- 3. Add New Lead Logic ---
    const addLeadModal = document.getElementById('add-lead-modal');
    const openAddLeadBtn = document.getElementById('open-add-lead-btn');
    const addLeadForm = document.getElementById('add-lead-form');

    openAddLeadBtn.addEventListener('click', () => {
        addLeadModal.classList.remove('hidden');
        addLeadModal.classList.add('flex');
    });

    document.querySelectorAll('.close-add-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            addLeadModal.classList.add('hidden');
            addLeadModal.classList.remove('flex');
            addLeadForm.reset();
        });
    });

    addLeadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('save-lead-btn');
        submitBtn.textContent = "Saving...";
        submitBtn.disabled = true;

        try {
            await addDoc(leadsCol, {
                name: document.getElementById('new-lead-name').value,
                phone: document.getElementById('new-lead-phone').value,
                requirement: document.getElementById('new-lead-req').value,
                status: 'New',
                remarks: '',
                createdAt: serverTimestamp()
            });

            addLeadModal.classList.add('hidden');
            addLeadModal.classList.remove('flex');
            addLeadForm.reset();
            fetchLeads(); // Refresh list

        } catch (error) {
            alert("Error adding lead!");
        } finally {
            submitBtn.textContent = "Save Lead";
            submitBtn.disabled = false;
        }
    });


    // --- 4. Update / Convert Lead Logic ---
    const updateModal = document.getElementById('update-lead-modal');
    const updateForm = document.getElementById('update-lead-form');
    const statusSelect = document.getElementById('action-status');
    const followupContainer = document.getElementById('followup-date-container');
    const conversionFields = document.getElementById('conversion-fields');

    // Dynamic UI Toggle based on Status Selection
    statusSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        
        // Follow up logic
        if(val === 'Follow-up') followupContainer.classList.remove('hidden');
        else followupContainer.classList.add('hidden');
        
        // Conversion magic logic
        if(val === 'Converted') conversionFields.classList.remove('hidden');
        else conversionFields.classList.add('hidden');
    });

    // Open Modal Function (Global so inline HTML onclick can access it)
    window.openUpdateModal = (encodedData) => {
        const data = JSON.parse(decodeURIComponent(encodedData));
        document.getElementById('action-lead-id').value = data.id;
        document.getElementById('action-lead-phone').value = data.phone;
        document.getElementById('action-lead-name').textContent = data.name + ' (' + data.phone + ')';
        
        // Reset dynamic fields
        statusSelect.value = data.status;
        statusSelect.dispatchEvent(new Event('change')); // trigger UI update
        document.getElementById('action-remarks').value = data.remarks || '';
        
        updateModal.classList.remove('hidden');
        updateModal.classList.add('flex');
    };

    document.querySelectorAll('.close-update-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            updateModal.classList.add('hidden');
            updateModal.classList.remove('flex');
        });
    });

    // Handle Form Submission (Update OR Convert)
    updateForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('update-btn');
        submitBtn.innerHTML = "Processing...";
        submitBtn.disabled = true;

        try {
            const leadId = document.getElementById('action-lead-id').value;
            const newStatus = statusSelect.value;
            const remarks = document.getElementById('action-remarks').value;
            const leadRef = doc(db, "leads", leadId);

            if (newStatus === 'Converted') {
                /**
                 * CONVERSION MAGIC:
                 * 1. Create a new document in 'customers' collection (Admin/Tech can now see it)
                 * 2. Delete the record from 'leads' collection (It's no longer a lead)
                 */
                const nextDate = new Date();
                nextDate.setMonth(nextDate.getMonth() + 3); // Quarterly default

                await addDoc(customersCol, {
                    name: document.getElementById('action-lead-name').textContent.split(' (')[0], // Extract name
                    phone: document.getElementById('action-lead-phone').value,
                    address: document.getElementById('convert-address').value,
                    unitType: document.getElementById('convert-unit').value,
                    amount: document.getElementById('convert-amount').value,
                    planType: 'General Service',
                    status: 'Active',
                    nextServiceDate: nextDate.toISOString().split('T')[0],
                    createdAt: serverTimestamp()
                });

                // Remove from leads pipeline
                await deleteDoc(leadRef);
                alert("🎉 Lead Successfully Converted to Customer!");

            } else {
                // Normal Update (Follow-up, Dropped, etc.)
                let updateData = { status: newStatus, remarks: remarks };
                if (newStatus === 'Follow-up') {
                    updateData.followupDate = document.getElementById('action-followup-date').value;
                }
                await updateDoc(leadRef, updateData);
            }

            // Cleanup & Refresh
            updateModal.classList.add('hidden');
            updateModal.classList.remove('flex');
            updateForm.reset();
            fetchLeads();
            
        } catch (error) {
            console.error(error);
            alert("Error updating lead.");
        } finally {
            submitBtn.innerHTML = "Update Status";
            submitBtn.disabled = false;
        }
    });

    // --- 5. Logout ---
    document.getElementById('logout-btn').addEventListener('click', () => {
        sessionStorage.removeItem('marketingAuth');
        window.location.replace('index.html');
    });

    // Boot up
    fetchLeads();
});
