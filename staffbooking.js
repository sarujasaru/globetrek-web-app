import { db } from './firebase.js';
import { ref, onValue, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Global variable to store all bookings for filtering and exporting
let allBookingsData = {};

window.loadStaffBookings = function() {
    console.log("Firebase Listener Active...");
    const bookingsRef = ref(db, 'bookings');

    onValue(bookingsRef, (snapshot) => {
        if (snapshot.exists()) {
            allBookingsData = snapshot.val();
            // Default-aaga 'all' status-ai render seigirom
            renderTableByStatus('all');
            updateStats(allBookingsData);
        } else {
            const list = document.getElementById('bookings-list');
            if (list) list.innerHTML = "<tr><td colspan='6' class='py-10 text-center text-gray-400'>No bookings found.</td></tr>";
        }
    });
};

// 1. Table Rendering based on Filter Status (All, Pending, Confirmed)
window.renderTableByStatus = function(statusFilter) {
    const list = document.getElementById('bookings-list');
    if (!list) return;

    list.innerHTML = "";
    
    Object.keys(allBookingsData).forEach(id => {
        const b = allBookingsData[id];
        const currentStatus = (b.status || "Pending").toLowerCase();

        // Status Filter Logic
        if (statusFilter !== 'all' && currentStatus !== statusFilter.toLowerCase()) {
            return;
        }

        const tr = document.createElement('tr');
        tr.className = "border-b border-gray-100 hover:bg-gray-50 transition-all";
        
        tr.innerHTML = `
            <td class="py-6 font-bold text-blue-600">#${id.substring(1, 7)}</td>
            <td class="font-bold text-slate-700">${b.travelerName || 'Guest'}</td>
            <td class="text-slate-600">${b.packageName || 'Package'}</td>
            <td class="text-slate-500">${b.travelDate || 'N/A'}</td>
            <td>
                <span class="${currentStatus === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'} px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                    ${b.status}
                </span>
            </td>
            <td class="flex gap-2 py-4">
                <button onclick="viewBookingDetails('${id}')" class="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-100">View</button>
                ${currentStatus === 'pending' ? 
                    `<button onclick="confirmBooking('${id}')" class="bg-orange-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-orange-700">Confirm</button>` : ''
                }
            </td>
        `;
        list.appendChild(tr);
    });

    updateTabUI(statusFilter);
};

// 2. Stats Calculation and UI Update
function updateStats(data) {
    const activeElem = document.getElementById('total-active');
    const revenueElem = document.getElementById('total-revenue');
    const pendingElem = document.getElementById('total-pending');

    let activeCount = 0;
    let pendingCount = 0;
    let totalRevenue = 0;

    Object.values(data).forEach(b => {
        const status = (b.status || "Pending").toLowerCase();
        if (status === "confirmed") activeCount++;
        if (status === "pending") pendingCount++;
        
        // Extract numbers from "LKR 22,245.5"
        const amount = b.totalAmount ? parseFloat(b.totalAmount.replace(/[^\d.-]/g, '')) : 0;
        totalRevenue += amount;
    });

    if (activeElem) activeElem.innerText = activeCount;
    if (pendingElem) pendingElem.innerText = pendingCount;
    if (revenueElem) {
        const formattedRev = totalRevenue >= 1000 ? `LKR ${(totalRevenue/1000).toFixed(1)}k` : `LKR ${totalRevenue}`;
        revenueElem.innerText = formattedRev;
    }
}


window.confirmBooking = async function(id) {
   
    const result = await Swal.fire({
        title: 'Confirm Booking?',
        text: "Are you sure you want to mark this booking as Confirmed? ✅",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745', 
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, Confirm it!',
        cancelButtonText: 'No, Wait',
        borderRadius: '15px'
    });

   
    if (result.isConfirmed) {
        try {
            const bookingRef = ref(db, `bookings/${id}`);
            
            // Firebase-இல் status-ஐ அப்டேட் செய்தல்
            await update(bookingRef, { 
                status: "Confirmed" 
            });

            // 3. வெற்றிகரமாக அப்டேட் ஆன பின் வரும் மெசேஜ்
            Swal.fire({
                title: 'Confirmed!',
                text: 'The booking status has been updated to Confirmed. ✈️',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });

        } catch (err) {
            console.error("Update Error:", err);
            
            // 4. எரர் வந்தால் வரும் மெசேஜ்
            Swal.fire({
                title: 'Update Failed',
                text: 'Could not confirm the booking. Please try again.',
                icon: 'error',
                footer: `<span style="color: #d33">${err.message}</span>`
            });
        }
    }
}; 



// 4. View Details in Professional Card (Modal)
window.viewBookingDetails = function(id) {
    const b = allBookingsData[id];
    const modal = document.getElementById('bookingModal');
    const content = document.getElementById('modalContent');

    if (!b || !modal || !content) return;

    content.innerHTML = `
        <div class="flex items-center gap-4 mb-6">
            <img src="${b.packageImg || 'https://via.placeholder.com/150'}" class="w-20 h-20 rounded-2xl object-cover shadow-md">
            <div>
                <h4 class="text-xl font-bold text-slate-800">${b.packageName}</h4>
                <p class="text-sm text-blue-600 font-medium">Booking ID: #${id.substring(1, 8)}</p>
            </div>
        </div>
        <div class="grid grid-cols-2 gap-y-6 gap-x-4 border-t pt-6">
            <div>
                <p class="text-xs text-gray-400 uppercase font-bold tracking-wider">Customer Name</p>
                <p class="text-slate-700 font-semibold">${b.travelerName}</p>
            </div>
            <div>
                <p class="text-xs text-gray-400 uppercase font-bold tracking-wider">Email Address</p>
                <p class="text-slate-700 font-semibold text-sm truncate">${b.travelerEmail}</p>
            </div>
            <div>
                <p class="text-xs text-gray-400 uppercase font-bold tracking-wider">Travel Date</p>
                <p class="text-slate-700 font-semibold">${b.travelDate}</p>
            </div>
            <div>
                <p class="text-xs text-gray-400 uppercase font-bold tracking-wider">Travelers</p>
                <p class="text-slate-700 font-semibold">${b.numTravelers} Person(s)</p>
            </div>
            <div>
                <p class="text-xs text-gray-400 uppercase font-bold tracking-wider">Payment Method</p>
                <p class="text-slate-700 font-semibold">${b.paymentMethod}</p>
            </div>
            <div>
                <p class="text-xs text-gray-400 uppercase font-bold tracking-wider">Total Paid</p>
                <p class="text-emerald-600 font-bold text-lg">${b.totalAmount}</p>
            </div>
        </div>
        <div class="mt-4 p-4 bg-blue-50 rounded-2xl flex justify-between items-center">
            <span class="text-sm text-blue-700 font-bold">Current Status:</span>
            <span class="px-4 py-1 bg-white text-blue-700 rounded-full text-xs font-black shadow-sm uppercase italic">${b.status}</span>
        </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
};

// 5. Export to CSV Logic
window.exportBookings = function() {
    if (Object.keys(allBookingsData).length === 0) {
        alert("No data to export!");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,Booking ID,Customer,Package,Date,Status,Amount\n";
    Object.keys(allBookingsData).forEach(id => {
        const b = allBookingsData[id];
        csvContent += `${id},${b.travelerName},${b.packageName},${b.travelDate},${b.status},${b.totalAmount}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "GlobeTrek_Bookings.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// UI Helpers
window.closeModal = function() {
    const modal = document.getElementById('bookingModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
};

function updateTabUI(status) {
    const tabs = {
        'all': document.getElementById('tab-all'),
        'pending': document.getElementById('tab-pending'),
        'confirmed': document.getElementById('tab-confirmed')
    };

    Object.keys(tabs).forEach(key => {
        if (tabs[key]) {
            tabs[key].className = (key === status) 
                ? "px-4 py-2 bg-white shadow-sm rounded-lg text-sm font-bold text-blue-600" 
                : "px-4 py-2 text-sm font-medium text-gray-500 hover:text-blue-600 transition-all";
        }
    });
}