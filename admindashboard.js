import { auth, db } from './firebase.js';
import { ref, onValue, query, limitToLast, push, set, update, remove} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Fetch Users for Table (இதை HTML-ல் 'userTableBody' என்று ID உள்ள இடத்தில் மட்டும் இயக்கவும்)
const usersRef = ref(db, 'users/');
onValue(usersRef, (snapshot) => {
    const data = snapshot.val();
    const tbody = document.getElementById('userTableBody');
    if (tbody) { // tbody இருக்கிறதா என்று செக் செய்வது அவசியம்
        tbody.innerHTML = ''; 
        for (let key in data) {
            const user = data[key];
            tbody.innerHTML += `
                <tr class="border-t">
                    <td class="py-4">${user.fullName || 'N/A'}</td>
                    <td><span class="px-2 py-1 bg-gray-100 rounded text-xs">${user.role || 'User'}</span></td>
                    <td><span class="text-green-500">•</span> Online</td>
                </tr>
            `;
        }
    }
});

window.setActive = function(selectedId) {
    const buttons = document.querySelectorAll('.nav-btn');
    buttons.forEach(btn => {
        btn.classList.remove('bg-blue-50/70', 'text-gt-blue');
        btn.classList.add('text-gray-500');
    });

    // இங்கே ID-யைச் சரியாகக் குறிப்பிடவும்
    const activeBtn = document.getElementById('nav-' + selectedId);
    if (activeBtn) {
        activeBtn.classList.remove('text-gray-500');
        activeBtn.classList.add('bg-blue-50/70', 'text-gt-blue');
    }
};

// 2. Load Dashboard View
window.showDashboard = function() {
    const dashboardView = document.getElementById('dashboard-view');
    const mainContent = document.getElementById('main-content');
    
    dashboardView.classList.remove('hidden');
    
    // Dashboard தவிர மற்றவைகளை நீக்க
    const dynamicContent = mainContent.querySelector(':scope > div:not(#dashboard-view)');
    if (dynamicContent) dynamicContent.remove();
    
    setActive('dashboard');
};

// 3. Load User Management View
window.loadUserManagement = function() { // பங்க்ஷன் பெயரை மாற்றியுள்ளேன்
    const dashboardView = document.getElementById('dashboard-view');
    const mainContent = document.getElementById('main-content');
    
    dashboardView.classList.add('hidden');
    
    const existing = mainContent.querySelector(':scope > div:not(#dashboard-view)');
    if (existing) existing.remove();
    
    fetch('adminusermanagement.html') // ஃபைல் பெயரைச் சரியாக மாற்றவும்
        .then(response => response.text())
        .then(html => {
            mainContent.insertAdjacentHTML('beforeend', html);
            setActive('usermanagement'); // ID: nav-usermanagement
        })
        .catch(err => console.error('Error:', err));
};

window.loadOperation = function() { // பங்க்ஷன் பெயரை மாற்றியுள்ளேன்
    const dashboardView = document.getElementById('dashboard-view');
    const mainContent = document.getElementById('main-content');
    
    dashboardView.classList.add('hidden');
    
    const existing = mainContent.querySelector(':scope > div:not(#dashboard-view)');
    if (existing) existing.remove();
    
    fetch('adminoperation.html') // ஃபைல் பெயரைச் சரியாக மாற்றவும்
        .then(response => response.text())
        .then(html => {
            mainContent.insertAdjacentHTML('beforeend', html);
            setActive('operation'); // ID: nav-usermanagement
        })
        .catch(err => console.error('Error:', err));
};
window.loadSetting = function() { // பங்க்ஷன் பெயரை மாற்றியுள்ளேன்
    const dashboardView = document.getElementById('dashboard-view');
    const mainContent = document.getElementById('main-content');
    
    dashboardView.classList.add('hidden');
    
    const existing = mainContent.querySelector(':scope > div:not(#dashboard-view)');
    if (existing) existing.remove();
    
    fetch('adminsetting.html') // ஃபைல் பெயரைச் சரியாக மாற்றவும்
        .then(response => response.text())
        .then(html => {
            mainContent.insertAdjacentHTML('beforeend', html);
            setActive('setting'); // ID: nav-usermanagement
        })
        .catch(err => console.error('Error:', err));
};



window.loadAdminStats = function() {
    
    const bookingsRef = ref(db, 'bookings');
    onValue(bookingsRef, (snapshot) => {
        let total = 0;
        let completed = 0;
        
        if (snapshot.exists()) {
            const data = snapshot.val();
          
            total = Object.keys(data).length;
            
          
            Object.values(data).forEach(booking => {
                if (booking.status === 'completed') completed++;
            });
        }
        
        document.getElementById('total-bookings-count').innerText = total;
        document.getElementById('completed-bookings').innerText = completed;
        
      
        const target = 2000;
        const percent = Math.round((completed / target) * 100);
        const progressBar = document.getElementById('booking-progress-bar');
        if (progressBar) progressBar.style.width = `${percent}%`;
        
        const targetText = document.getElementById('target-reached-text');
        if (targetText) targetText.innerText = `LKR{percent}% Target reached for Q3`;
    });

    // --- 2. New Registrations (Total Users) கணக்கிடுதல் ---
    const usersRef = ref(db, 'users');
    onValue(usersRef, (snapshot) => {
        let userCount = 0;
        if (snapshot.exists()) {
            userCount = Object.keys(snapshot.val()).length;
        }
        document.getElementById('new-registrations').innerText = userCount;
    });

    // --- 3. Customer Queries (Active Logins-க்கு பதிலாக இதைப் பயன்படுத்தலாம்) ---
    const queriesRef = ref(db, 'queries');
    onValue(queriesRef, (snapshot) => {
        let queryCount = 0;
        if (snapshot.exists()) {
            queryCount = Object.keys(snapshot.val()).length;
        }
        // உங்கள் விருப்பப்படி இதை எதாவது ஒரு கார்டில் காட்டலாம்
        const activeLoginElem = document.getElementById('active-logins');
        if (activeLoginElem) activeLoginElem.innerText = queryCount;
    });

    // --- 4. Monthly Sales Revenue ---
    // இது வழக்கமாக 'bookings' நோடில் உள்ள 'price' அல்லது 'amount'-ஐ கூட்டி வரும்
  onValue(bookingsRef, (snapshot) => {
    let totalRevenue = 0;
    
    if (snapshot.exists()) {
        const bookingsData = snapshot.val();

        Object.values(bookingsData).forEach(booking => {
            let rawAmount = booking.totalAmount || "0";
            
            // "LKR 22,245.5" என்பதில் இருந்து எண்களை மட்டும் பிரித்தல்
            // 1. "LKR" ஐ நீக்குகிறது
            // 2. கமா (,) ஐ நீக்குகிறது
            let cleanAmount = rawAmount.toString().replace(/[^\d.-]/g, '');
            
            const amount = parseFloat(cleanAmount || 0);
            
            if (!isNaN(amount)) {
                totalRevenue += amount;
            }
        });
    }

    const salesElem = document.getElementById('monthly-sales-amt');
    if (salesElem) {
        // LKR உடன் காட்ட விரும்பினால் இப்படி மாற்றவும்:
        salesElem.innerText = `LKR ${totalRevenue.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    }
});
};

document.addEventListener('DOMContentLoaded', window.loadAdminStats);

function updateSystemActivity() {
    const activityList = document.getElementById('system-activity-list');
    // சமீபத்திய 3 புக்கிங்குகளை மட்டும் எடுக்கிறோம்
    const bookingsRef = query(ref(db, 'bookings'), limitToLast(3));

    onValue(bookingsRef, (snapshot) => {
        activityList.innerHTML = ''; // பழைய தரவை நீக்க

        if (snapshot.exists()) {
            const activities = [];
            
            snapshot.forEach((childSnapshot) => {
                const data = childSnapshot.val();
                activities.push(data);
            });

            // சமீபத்தியது மேலே வர வேண்டும் என்பதால் reverse செய்கிறோம்
            activities.reverse().forEach(data => {
                const itemHTML = `
                    <div class="flex gap-4 border-l-4 border-globetrek-blue pl-4">
                        <div class="w-10 h-10 bg-blue-50 text-globetrek-blue rounded-full flex items-center justify-center shrink-0">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <div>
                            <span class="font-semibold block text-globetrek-dark">New Booking: ${data.packageName || 'Unknown'}</span>
                            <p class="text-xs text-gray-400">Customer: ${data.customerName || 'Customer'} • ${data.bookingDate || 'Just now'}</p>
                        </div>
                    </div>`;
                activityList.innerHTML += itemHTML;
            });
        } else {
            activityList.innerHTML = '<p class="text-gray-400 text-xs pl-4">No recent bookings found.</p>';
        }
    });
}

// பக்கம் லோட் ஆனதும் இந்த பங்க்ஷனை இயக்கவும்
document.addEventListener('DOMContentLoaded', updateSystemActivity);
function updateAdminUserTable() {
    const userTableBody = document.getElementById('userTableBody');
    const usersRef = ref(db, 'users');

    onValue(usersRef, (snapshot) => {
        userTableBody.innerHTML = '';
        if (snapshot.exists()) {
            const users = snapshot.val();
            // முதல் 4 பயனர்களை மட்டும் டேஷ்போர்டில் காட்ட (Limit)
            const limitedUsers = Object.keys(users).slice(0, 4);

            limitedUsers.forEach(userId => {
                const user = users[userId];
                const role = user.role || 'traveler';
                const fullName = user.fullName || "Anonymous"; // fullName என மாற்றப்பட்டது
                
                // 1. படத்தின் லாஜிக்: profilePic இருந்தால் அதைப் பயன்படுத்து, இல்லையெனில் எழுத்துக்களைக் காட்டு
                const userImg = user.profilePic 
                    ? user.profilePic 
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random&color=fff`;

                // Role color logic
                const roleStyles = role === 'admin' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'bg-orange-50 text-orange-600';

                const row = `
                    <tr class="group hover:bg-gray-50 transition-colors">
                        <td class="py-5 px-2 flex items-center gap-3">
                            <!-- ப்ரொபைல் படம் -->
                            <img src="${userImg}" 
                                 alt="Avatar" 
                                 class="w-10 h-10 rounded-full border border-gray-100 object-cover">
                            <div>
                                <div class="font-semibold text-gray-800">${fullName}</div>
                                <div class="text-xs text-gray-400">${user.email || ''}</div>
                            </div>
                        </td>
                        <td class="py-5 px-2">
                            <span class="px-3 py-1 ${roleStyles} text-[10px] font-bold rounded-lg uppercase tracking-wider">
                                ${role}
                            </span>
                        </td>
                        <td class="py-5 px-2">
                            <div class="flex items-center gap-2">
                                <span class="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
                                <span class="text-gray-600 font-medium">Online</span>
                            </div>
                        </td>
                        <td class="py-5 px-2 text-right">
                            <button onclick="loadUserManagement()" class="text-gray-300 hover:text-globetrek-blue transition-all">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                                </svg>
                            </button>
                        </td>
                    </tr>`;
                userTableBody.innerHTML += row;
            });
        } else {
            userTableBody.innerHTML = '<tr><td colspan="4" class="py-10 text-center text-gray-400">No members found.</td></tr>';
        }
    });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', updateAdminUserTable);

function updateRegionalPerformanceFromBookings() {
    const container = document.getElementById('regionalPerformanceContainer');
    const bookingsRef = ref(db, 'bookings');

    onValue(bookingsRef, (snapshot) => {
        if (snapshot.exists()) {
            const bookings = snapshot.val();
            const bookingArray = Object.values(bookings);
            const totalBookings = bookingArray.length;

            // 1. இடங்களின் அடிப்படையில் புக்கிங்கை வகைப்படுத்துதல்
            const stats = {};
            bookingArray.forEach(booking => {
                const place = booking.packageName || "Unknown";
                const img = booking.packageImg || "https://via.placeholder.com/400x300";
                
                if (!stats[place]) {
                    stats[place] = { count: 0, image: img };
                }
                stats[place].count++;
            });

            container.innerHTML = ''; // பழைய கார்டுகளை நீக்க

            // 2. ஒவ்வொரு இடத்திற்கும் சதவீதத்தை கணக்கிட்டு கார்டு உருவாக்குதல்
            Object.keys(stats).forEach(placeName => {
                const data = stats[placeName];
                // சதவீதம் கணக்கீடு: (இந்த இடத்தின் புக்கிங் / மொத்த புக்கிங்) * 100
                const percentage = Math.round((data.count / totalBookings) * 100);

                const cardHTML = `
                    <div class="relative rounded-3xl overflow-hidden shadow-lg group h-60">
                        <img src="${data.image}" alt="${placeName}" 
                             class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                        
                        <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-6 flex flex-col justify-end text-white">
                            <p class="text-xs font-semibold text-gray-300 uppercase tracking-wider">${placeName}</p>
                            <h4 class="text-2xl font-bold">${percentage}% Occupancy</h4>
                            <p class="text-[10px] opacity-60">${data.count} Total Bookings</p>
                        </div>
                    </div>
                `;
                container.innerHTML += cardHTML;
            });
        } else {
            container.innerHTML = '<p class="col-span-3 text-center py-10 text-gray-400">No bookings yet to calculate performance.</p>';
        }
    });
}

document.addEventListener('DOMContentLoaded', updateRegionalPerformanceFromBookings);

// User Management பக்கத்திற்கான பிரத்யேக பங்க்ஷன்
window.initUserManagementPage = function() {
    const tableBody = document.getElementById('mgmt-user-table-body');
    const usersRef = ref(db, 'users');

    onValue(usersRef, (snapshot) => {
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        let counts = { total: 0, admin: 0, customer: 0, deactivated: 0 };

        if (snapshot.exists()) {
            const users = snapshot.val();
            
            Object.keys(users).forEach(userId => {
                const user = users[userId];
                const fullName = user.fullName || 'Anonymous';
                counts.total++;
                
                if (user.role === 'admin') counts.admin++;
                if (user.role === 'customer') counts.customer++;
                if (user.status === 'Deactivated') counts.deactivated++;

                // 1. ப்ரொபைல் படத்திற்கான லாஜிக்
                const userImg = user.profilePic 
                    ? user.profilePic 
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random&color=fff`;

                const row = `
                    <tr class="group hover:bg-gray-50 transition-colors">
                        <td class="py-5 px-4">
                            <div class="flex items-center gap-3">
                                <!-- ப்ரொபைல் ஐகான் இமேஜ் -->
                                <img src="${userImg}" 
                                     alt="Avatar" 
                                     class="w-10 h-10 rounded-full border border-gray-100 object-cover shadow-sm">
                                <div>
                                    <div class="font-bold text-gt-blue text-sm">${fullName}</div>
                                    <div class="text-[10px] text-gray-400 font-medium">${userId}</div>
                                </div>
                            </div>
                        </td>
                        <td class="py-5 px-2">
                            <span class="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg uppercase tracking-wider">
                                ${user.role || 'traveler'}
                            </span>
                        </td>
                        <td class="py-5 px-2 text-gray-500 text-xs font-medium">${user.email || 'N/A'}</td>
                        <td class="py-5 px-2">
                            <div class="flex items-center gap-2">
                                <span class="w-2 h-2 bg-green-500 rounded-full"></span>
                                <span class="text-[10px] font-bold text-green-600 uppercase">Active</span>
                            </div>
                        </td>
                        <td class="py-5 px-4 text-right">
                            <button onclick="deleteUser('${userId}')" class="text-gray-300 hover:text-red-500 transition-all text-xs font-bold">
                                Delete
                            </button>
                        </td>
                    </tr>`;
                tableBody.innerHTML += row;
            });

            // ஸ்டேட்ஸ் கார்டுகளை அப்டேட் செய்தல்
            if(document.getElementById('mgmt-total-users')) document.getElementById('mgmt-total-users').innerText = counts.total;
            if(document.getElementById('mgmt-admins')) document.getElementById('mgmt-admins').innerText = counts.admin;
            if(document.getElementById('mgmt-customers')) document.getElementById('mgmt-customers').innerText = counts.customer;
            if(document.getElementById('mgmt-deactivated')) document.getElementById('mgmt-deactivated').innerText = counts.deactivated;
        }
    });
};

// SPA-ல் பக்கம் லோட் ஆகும் போது இதை அழைக்கவும்
const originalLoadUserManagement = window.loadUserManagement;
window.loadUserManagement = function() {
    const mainContent = document.getElementById('main-content');
    fetch('adminusermanagement.html')
        .then(response => response.text())
        .then(html => {
            const dashboardView = document.getElementById('dashboard-view');
            dashboardView.classList.add('hidden');
            
            // பழைய கன்டென்டை நீக்கிவிட்டு புதியதை சேர்க்கவும்
            const existing = mainContent.querySelector(':scope > div:not(#dashboard-view)');
            if (existing) existing.remove();
            
            mainContent.insertAdjacentHTML('beforeend', html);
            setActive('usermanagement');
            
            // டேட்டாவை லோட் செய்யும் பங்க்ஷனை அழைக்கவும்
            initUserManagementPage();
        });
};


window.deleteUser = function(userId) {
    
    Swal.fire({
        title: 'Are you sure?',
        text: "You want to delete this user? This action cannot be undone!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33', 
        cancelButtonColor: '#3085d6', 
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'No, keep it',
        background: '#fff',
        borderRadius: '15px'
    }).then((result) => {
      
        if (result.isConfirmed) {
            
            const userRef = ref(db, 'users/' + userId);
            
            remove(userRef)
                .then(() => {
                  
                    Swal.fire({
                        title: 'Deleted!',
                        text: 'User has been removed from GlobeTrek.',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    });
                })
                .catch((error) => {
                   
                    Swal.fire({
                        title: 'Error!',
                        text: 'Failed to delete: ' + error.message,
                        icon: 'error'
                    });
                });
        }
    });
};
window.initOperationsPage = function() {
    console.log("Initializing Operations Page components...");

    // --- 1. MAP INITIALIZATION ---
    try {
        const mapElement = document.getElementById('map');
        if (mapElement) {
            const map = L.map('map').setView([7.8731, 80.7718], 7); // Sri Lanka view
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap'
            }).addTo(map);
            console.log("Map initialized.");
        }
    } catch (error) {
        console.error("Map Error:", error);
    }

    // --- 2. BOOKING PIPELINE & TRIPS ---
    const bookingsRef = ref(db, 'bookings');
    onValue(bookingsRef, (snapshot) => {
        try {
            if (snapshot.exists()) {
                const bookings = snapshot.val();
                let pending = 0, confirmed = 0, total = 0;

                Object.values(bookings).forEach(booking => {
                    total++;
                    const status = (booking.status || "").toLowerCase();
                    if (status === 'pending') pending++;
                    if (status === 'confirmed' || status === 'completed') confirmed = confirmed + 1;
                });

                // UI அப்டேட்கள் (ID இருக்கிறதா என்று செக் செய்துவிட்டு)
                if(document.getElementById('active-trips-count')) 
                    document.getElementById('active-trips-count').innerText = `${total} ACTIVE TRIPS`;
                
                if(document.getElementById('pipe-pending')) 
                    document.getElementById('pipe-pending').innerText = pending;
                
                if(document.getElementById('pipe-confirmed')) 
                    document.getElementById('pipe-confirmed').innerText = confirmed;
                
                console.log("Pipeline updated.");
            }
        } catch (e) { console.error("Pipeline update error:", e); }
    });

    // --- 3. QUERIES (CRITICAL TASKS) ---
    const queriesRef = ref(db, 'queries');
    onValue(queriesRef, (snapshot) => {
        try {
            const tasksList = document.getElementById('critical-tasks-list');
            if (!tasksList) return;

            if (snapshot.exists()) {
                tasksList.innerHTML = '';
                Object.values(snapshot.val()).forEach(query => {
                    tasksList.innerHTML += `
                        <div class="p-4 border border-gray-100 rounded-2xl bg-white shadow-sm mb-2">
                            <p class="text-sm font-bold text-gt-blue">${query.subject || 'Inquiry'}</p>
                            <p class="text-[10px] text-gray-400">From: ${query.name || 'Guest'}</p>
                        </div>`;
                });
            }
        } catch (e) { console.error("Tasks error:", e); }
    });
};

// SPA முறையில் பக்கத்தை லோட் செய்யும் போது
window.loadOperation = function() {
    const mainContent = document.getElementById('main-content');
    
    fetch('adminoperation.html')
        .then(res => {
            if (!res.ok) throw new Error("File not found");
            return res.text();
        })
        .then(html => {
            // 1. பழைய கன்டென்டை முழுமையாக நீக்கிவிட்டு புதியதைச் சேர்க்கவும்
            document.getElementById('dashboard-view').classList.add('hidden');
            const dynamicContent = mainContent.querySelectorAll(':scope > div:not(#dashboard-view)');
            dynamicContent.forEach(el => el.remove());

            mainContent.insertAdjacentHTML('beforeend', html);
            setActive('operation');

            // 2. ஒரு சிறிய இடைவேளைக்குப் பிறகு டேட்டாவை லோட் செய்யவும்
            // இது HTML எலிமெண்ட்கள் DOM-ல் செட்டில் ஆக உதவும்
            setTimeout(() => {
                console.log("Initializing dynamic data...");
                initOperationsPage();
            }, 100); 
        })
        .catch(err => console.error('Error:', err));
};

// 1. Settings பக்கத்தை இனிஷியலைஸ் செய்தல்
window.initSettingsPage = function() {
    const settingsRef = ref(db, 'system_settings');
    
    // Firebase-ல் இருந்து தரவை எடுத்து இன்புட் பெட்டிகளில் நிரப்புதல்
    onValue(settingsRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            document.getElementById('set-site-name').value = data.siteName || '';
            document.getElementById('set-timezone').value = data.timezone || '';
            document.getElementById('set-support-email').value = data.supportEmail || '';
            document.getElementById('set-2fa').checked = data.twoFactor || false;
            document.getElementById('set-session-timeout').checked = data.sessionTimeout || false;
        }
    });

    // System Status-க்காக பயனர்களின் எண்ணிக்கையை எடுத்தல்
    onValue(ref(db, 'users'), (snapshot) => {
        const count = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
        if(document.getElementById('stat-total-users')) 
            document.getElementById('stat-total-users').innerText = count.toLocaleString();
    });
};

// 2. சேமிக்கும் பங்க்ஷன் (இதுதான் 'system_settings' நோடை உருவாக்கும்)
window.saveSystemSettings = function() {
    // Firebase-ல் 'system_settings' என்ற இடத்திற்கு Reference எடுத்தல்
    const settingsRef = ref(db, 'system_settings');
    
    // இன்புட் பெட்டிகளில் உள்ள மதிப்புகளைச் சேகரித்தல்
    const updatedData = {
        siteName: document.getElementById('set-site-name').value,
        timezone: document.getElementById('set-timezone').value,
        supportEmail: document.getElementById('set-support-email').value,
        twoFactor: document.getElementById('set-2fa').checked,
        sessionTimeout: document.getElementById('set-session-timeout').checked,
        lastUpdated: new Date().toLocaleString() // கடைசியாக மாற்றப்பட்ட நேரம்
    };

    // Firebase-ல் தரவை அப்டேட் செய்தல்
    // இந்த நோட் இல்லை என்றால் Firebase இதைத் தானாகவே உருவாக்கிவிடும்
   update(settingsRef, updatedData)
    .then(() => {
        // வெற்றிகரமாக அப்டேட் ஆகும்போது வரும் அழகான மெசேஜ்
        Swal.fire({
            icon: 'success',
            title: 'Settings Updated!',
            text: 'Your changes have been saved successfully. ✅',
            timer: 2500, // 2.5 செகண்டில் தானாகவே மறைந்துவிடும்
            showConfirmButton: false,
            borderRadius: '15px'
        });
    })
    .catch((error) => {
        // எரர் வரும்போது வரும் மெசேஜ்[cite: 3, 4]
        console.error("Update failed:", error);
        Swal.fire({
            icon: 'error',
            title: 'Update Failed',
            text: 'Something went wrong while saving your settings.',
            footer: `<span style="color: #d33">${error.message}</span>` // எரர் மெசேஜை கீழ காண்பிக்கும்
        });
    });
};

// 3. Sandbox தரவுகளை நீக்குதல் (உதாரணத்திற்கு)
window.flushSandboxData = function() {
    if(confirm("Are you sure you want to wipe all sandbox data? This cannot be undone.")) {
        // உங்கள் sandbox நோடை இங்கே டெலிட் செய்யலாம்
        // remove(ref(db, 'sandbox_data')); 
        alert("Sandbox data flushed.");
    }
};

// 4. SPA-ல் Settings லோட் ஆகும் போது இயக்குதல்
const originalLoadSettings = window.loadSettings; // ஏற்கனவே இருந்தால்
window.loadSettings = function() {
    const mainContent = document.getElementById('main-content');
    fetch('adminsettings.html')
        .then(res => res.text())
        .then(html => {
            document.getElementById('dashboard-view').classList.add('hidden');
            const existing = mainContent.querySelector(':scope > div:not(#dashboard-view)');
            if (existing) existing.remove();
            
            mainContent.insertAdjacentHTML('beforeend', html);
            setActive('settings');
            
            // பக்கம் லோட் ஆனதும் டேட்டாவை கொண்டு வரவும்
            initSettingsPage();
        });
};





// Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => window.location.href = "login.html")
                     .catch(err => alert("Error logging out"));
    });
}