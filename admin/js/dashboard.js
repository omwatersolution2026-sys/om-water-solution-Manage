<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Master Admin | Om Water Solution</title>
    
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="css/style.css">

    <!-- Tailwind Config -->
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: { sans: ['Inter', 'sans-serif'] },
                    colors: { brandBlue: '#2563eb' }
                }
            }
        }
    </script>
</head>
<body class="bg-gray-50 text-gray-800 antialiased">

    <!-- Top Navigation Bar -->
    <nav class="bg-white border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm glass-effect">
        <div class="flex items-center gap-3 sm:gap-4">
            <div class="w-10 h-10 bg-brandBlue text-white rounded-xl flex items-center justify-center font-black text-xl shadow-inner">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            </div>
            <div>
                <h1 class="font-bold text-lg sm:text-xl leading-none text-gray-900">Admin Control</h1>
                <p class="text-[10px] sm:text-xs text-brandBlue font-bold uppercase tracking-wider mt-1">Om Water Solution</p>
            </div>
        </div>
        
        <div class="flex items-center gap-2 sm:gap-4">
            <button id="open-add-cx-btn" class="bg-gray-900 hover:bg-gray-800 text-white text-xs sm:text-sm font-semibold px-3 py-2 sm:px-4 sm:py-2 rounded-lg shadow transition-colors flex items-center gap-1 sm:gap-2">
                <span class="text-lg leading-none">+</span> <span class="hidden sm:inline">Add Customer</span><span class="sm:hidden">Add</span>
            </button>
            <button id="logout-btn" class="text-xs sm:text-sm font-semibold text-red-500 bg-red-50 hover:bg-red-100 px-3 py-2 sm:px-4 sm:py-2 rounded-lg transition-colors">Logout</button>
        </div>
    </nav>

    <!-- Main Content Container -->
    <div class="max-w-7xl mx-auto p-4 sm:p-6 fade-in-up">
        
        <!-- Dashboard Analytics Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5 mb-8">
            <div class="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-brandBlue flex flex-col justify-between">
                <p class="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total AMC</p>
                <h3 class="text-2xl sm:text-3xl font-black text-gray-800" id="stat-total">0</h3>
            </div>
            <div class="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-orange-400 flex flex-col justify-between">
                <p class="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Due Today</p>
                <h3 class="text-2xl sm:text-3xl font-black text-orange-500" id="stat-today">0</h3>
            </div>
            <div class="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-red-500 flex flex-col justify-between">
                <p class="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Missed</p>
                <h3 class="text-2xl sm:text-3xl font-black text-red-600" id="stat-missed">0</h3>
            </div>
            <div class="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 border-l-4 border-l-green-500 flex flex-col justify-between">
                <p class="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Upcoming</p>
                <h3 class="text-2xl sm:text-3xl font-black text-green-600" id="stat-upcoming">0</h3>
            </div>
        </div>

        <!-- Master Data Table Section -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="p-4 sm:p-5 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 class="text-lg font-bold text-gray-800">Master Service Pipeline</h2>
                
                <!-- Filter Pills -->
                <div class="flex flex-wrap bg-gray-100 p-1 rounded-lg gap-1 w-full md:w-auto">
                    <button class="filter-btn active flex-1 md:flex-none px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md bg-white shadow text-gray-800" data-filter="all">All</button>
                    <button class="filter-btn flex-1 md:flex-none px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md text-gray-500 hover:text-gray-800 transition-colors" data-filter="missed">Missed</button>
                    <button class="filter-btn flex-1 md:flex-none px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md text-gray-500 hover:text-gray-800 transition-colors" data-filter="today">Today</button>
                    <button class="filter-btn flex-1 md:flex-none px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-md text-gray-500 hover:text-gray-800 transition-colors" data-filter="upcoming">Upcoming</button>
                </div>
            </div>
            
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse whitespace-nowrap sm:whitespace-normal">
                    <thead>
                        <tr class="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                            <th class="p-4 font-bold">Customer Info</th>
                            <th class="p-4 font-bold">Plan & Unit</th>
                            <th class="p-4 font-bold">Next Service Date</th>
                            <th class="p-4 font-bold">Status</th>
                            <th class="p-4 font-bold text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody id="master-table-body" class="divide-y divide-gray-100">
                        <tr><td colspan="5" class="p-8 text-center text-gray-400 font-medium">Loading master data...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- ================= ADD NEW CUSTOMER MODAL ================= -->
    <div id="add-cx-modal" class="fixed inset-0 bg-black/60 hidden items-end sm:items-center justify-center z-50 p-0 sm:p-4 transition-opacity duration-300">
        <!-- Form Container -->
        <div class="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col fade-in-up">
            
            <!-- Modal Header -->
            <div class="flex justify-between items-center p-5 sm:p-6 border-b border-gray-100">
                <div>
                    <h3 class="text-xl font-bold text-gray-900">Add New Customer</h3>
                    <p class="text-xs text-gray-500 mt-1">Enroll for AMC / General Service</p>
                </div>
                <button id="close-add-cx-modal" class="text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center transition-colors">&times;</button>
            </div>
            
            <!-- Modal Body (Scrollable) -->
            <div class="p-5 sm:p-6 overflow-y-auto">
                <form id="add-cx-form" class="space-y-5">
                    
                    <!-- Section 1: Customer Details -->
                    <div>
                        <h4 class="text-xs font-bold text-brandBlue uppercase tracking-wider mb-3">1. Personal Details</h4>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-semibold text-gray-600 mb-1">Full Name *</label>
                                <input type="text" id="cx-name" required class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brandBlue focus:ring-2 focus:ring-blue-100 text-sm transition-all" placeholder="e.g. Agarwal Sir">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-gray-600 mb-1">Phone Number *</label>
                                <input type="tel" id="cx-phone" required pattern="[0-9]{10}" class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brandBlue focus:ring-2 focus:ring-blue-100 text-sm transition-all" placeholder="10-digit number">
                            </div>
                            <div class="sm:col-span-2">
                                <label class="block text-xs font-semibold text-gray-600 mb-1">Complete Address *</label>
                                <textarea id="cx-address" required rows="2" class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brandBlue focus:ring-2 focus:ring-blue-100 text-sm transition-all" placeholder="Wing 13/603 Lodha Amara..."></textarea>
                            </div>
                        </div>
                    </div>

                    <!-- Section 2: Machine Details (From Invoice Image) -->
                    <div>
                        <h4 class="text-xs font-bold text-brandBlue uppercase tracking-wider mb-3">2. Machine Details</h4>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-semibold text-gray-600 mb-1">Unit Model / Machine Type</label>
                                <input type="text" id="cx-unit" class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brandBlue text-sm" placeholder="e.g. Compact RO">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-gray-600 mb-1">I/C No. (Install/Complaint)</label>
                                <input type="text" id="cx-icno" class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-brandBlue text-sm" placeholder="Optional">
                            </div>
                        </div>
                    </div>

                    <!-- Section 3: AMC Contract (From T&C Image) -->
                    <div class="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <h4 class="text-xs font-bold text-brandBlue uppercase tracking-wider mb-3">3. AMC Contract Selection</h4>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-semibold text-gray-700 mb-1">Plan Type</label>
                                <select id="cx-plan" class="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl outline-none focus:border-brandBlue text-sm font-medium text-gray-800">
                                    <option value="General Service">General Service (No AMC)</option>
                                    <option value="UV">UV Plan</option>
                                    <option value="RO + UV">RO + UV Plan</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-gray-700 mb-1">Duration</label>
                                <select id="cx-duration" class="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl outline-none focus:border-brandBlue text-sm font-medium text-gray-800" disabled>
                                    <option value="0">Not Applicable</option>
                                    <option value="1">1 Year</option>
                                    <option value="2">2 Years</option>
                                    <option value="3">3 Years</option>
                                </select>
                            </div>
                            <div class="sm:col-span-2 flex items-center justify-between border-t border-blue-200 pt-3 mt-1">
                                <span class="text-sm font-semibold text-gray-600">Total Contract Amount:</span>
                                <div class="flex items-center gap-1">
                                    <span class="font-bold text-gray-500">₹</span>
                                    <input type="number" id="cx-amount" required class="w-24 text-right bg-transparent text-xl font-black text-brandBlue outline-none placeholder-gray-300" placeholder="0000">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Submit Button Area -->
                    <div class="pt-4 border-t border-gray-100">
                        <button type="submit" id="save-cx-btn" class="w-full bg-brandBlue hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-[0_8px_20px_rgba(37,99,235,0.25)] transition-all flex justify-center items-center gap-2">
                            <span>Save Customer & Generate Schedule</span>
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Script Connection -->
    <script type="module" src="js/dashboard.js"></script>
</body>
</html>
