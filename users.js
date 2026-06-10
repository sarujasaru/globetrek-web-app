import { auth, db } from './firebase.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, onValue, remove } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";


function loadMembers() {
    const tableBody = document.getElementById('members-table-body');
    const usersRef = ref(db, 'users');

    onValue(usersRef, (snapshot) => {
        tableBody.innerHTML = '';
        if (snapshot.exists()) {
            const users = snapshot.val();
            
            Object.keys(users).forEach(userId => {
                const user = users[userId];
                const role = user.role || 'traveler';
                
                // Role-க்கு ஏற்ற வண்ணம்
                const roleClass = role === 'admin' ? 'bg-purple-100 text-purple-700' : 
                                 role === 'staff' ? 'bg-blue-100 text-blue-700' : 
                                 'bg-slate-100 text-slate-600';

                const row = `
                    <tr class="group hover:bg-slate-50/80 transition-all">
                        <td class="py-6 px-10 font-bold text-gt-dark">${user.fullName || 'Anonymous'}</td>
                        <td class="py-6 px-6 text-slate-500 font-medium">${user.email || 'N/A'}</td>
                        <td class="py-6 px-6">
                            <span class="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${roleClass}">
                                ${role}
                            </span>
                        </td>
                        <td class="py-6 px-6">
                            <div class="flex items-center gap-1.5">
                                <span class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                <span class="text-[10px] text-emerald-600 font-bold uppercase">Online</span>
                            </div>
                        </td>
                        <td class="py-6 px-10 text-right">
                            <button onclick="deleteUser('${userId}')" class="text-slate-300 hover:text-red-500 transition-colors">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                            </button>
                        </td>
                    </tr>`;
                tableBody.innerHTML += row;
            });
        } else {
            tableBody.innerHTML = '<tr><td colspan="5" class="py-20 text-center text-slate-400">No members registered yet.</td></tr>';
        }
    });
}

// Delete User Function (Global-ஆக மாற்ற window-ல் இணைக்கிறோம்)
window.deleteUser = (id) => {
    if(confirm("Are you sure you want to delete this user?")) {
        remove(ref(db, `users/${id}`));
    }
};



// Search Logic
document.getElementById('memberSearch').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    document.querySelectorAll('#members-table-body tr').forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(term) ? '' : 'none';
    });
});

document.addEventListener('DOMContentLoaded', loadMembers);