import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

// Firebase Config
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "globe-trek-22297.firebaseapp.com",
    databaseURL: "https://globe-trek-22297-default-rtdb.firebaseio.com",
    projectId: "globe-trek-22297",
    storageBucket: "globe-trek-22297.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

function loadAllActivities() {
    const tableBody = document.getElementById('full-activity-table-body');
    const bookingsRef = ref(db, 'bookings');

    onValue(bookingsRef, (snapshot) => {
        tableBody.innerHTML = '';
        if (snapshot.exists()) {
            const data = snapshot.val();
            const sorted = Object.keys(data).map(key => ({ id: key, ...data[key] })).reverse();

            sorted.forEach(item => {
                let rawAmount = item.totalAmount || "0";
                let cleanAmount = rawAmount.toString().replace(/[^\d.-]/g, '');
                let formattedAmount = parseFloat(cleanAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

                const row = `
                    <tr class="group hover:bg-slate-50/80 transition-all duration-300">
                        <td class="py-6 px-10">
                            <span class="px-4 py-1.5 bg-blue-50 text-gt-blue rounded-full text-[10px] font-extrabold uppercase tracking-widest border border-blue-100 shadow-sm">
                                Booking
                            </span>
                        </td>
                        <td class="py-6 px-6">
                            <div class="font-bold text-gt-dark text-base">${item.packageName || 'Unknown'}</div>
                            <div class="text-[11px] text-slate-400 mt-1 font-mono">REF: ${item.id.substring(0, 10)}</div>
                        </td>
                        <td class="py-6 px-6">
                            <div class="font-semibold text-slate-600">${item.customerName || 'Guest'}</div>
                            <div class="text-gt-blue font-bold mt-1 text-sm">LKR ${formattedAmount}</div>
                        </td>
                        <td class="py-6 px-10">
                            <div class="text-slate-400 text-xs font-medium">${item.bookingDate || 'N/A'}</div>
                            <div class="flex items-center gap-1.5 mt-2">
                                <span class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                <span class="text-[10px] text-emerald-600 font-black uppercase tracking-widest">${item.status || 'Confirmed'}</span>
                            </div>
                        </td>
                    </tr>`;
                tableBody.innerHTML += row;
            });
        } else {
            tableBody.innerHTML = '<tr><td colspan="4" class="py-32 text-center text-slate-400 font-medium italic">No transactions found in system logs.</td></tr>';
        }
    });
}

// Search Function
document.getElementById('activitySearch').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    document.querySelectorAll('#full-activity-table-body tr').forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(term) ? '' : 'none';
    });
});

document.addEventListener('DOMContentLoaded', loadAllActivities);

