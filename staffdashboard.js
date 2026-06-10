import { auth, db } from './firebase.js';
import { 
    ref, onValue, push, set, serverTimestamp, update, remove, get 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// --- 1. Navigation & View Management ---

window.setActive = function(selectedId) {
    // 1. அனைத்து பட்டன்களையும் தேர்ந்தெடுத்து பழைய ஸ்டைலை நீக்குதல்
    const buttons = document.querySelectorAll('.nav-btn');
    buttons.forEach(btn => {
        // நீல நிற கிளாஸ்களை நீக்கிவிட்டு சாம்பல் நிறத்தைச் சேர்த்தல்
        btn.classList.remove('bg-blue-50/70', 'text-gt-blue', 'font-bold');
        btn.classList.add('text-gray-500');
    });

    // 2. கிளிக் செய்யப்பட்ட பட்டனை மட்டும் தேர்ந்தெடுத்தல்
    // நீங்கள் அனுப்பும் selectedId-இல் ஏற்கனவே 'nav-' இருந்தால் அதை அப்படியே பயன்படுத்தும்
    const activeBtn = document.getElementById(selectedId);
    
    if (activeBtn) {
        // சாம்பல் நிறத்தை நீக்கிவிட்டு நீல நிறத்தை (Active State) சேர்த்தல்
        activeBtn.classList.remove('text-gray-500');
        activeBtn.classList.add('bg-blue-50/70', 'text-gt-blue', 'font-bold');
    }
};

window.showDashboard = function() {
    const dashboardView = document.getElementById('dashboard-view');
    if (dashboardView) dashboardView.classList.remove('hidden');
    
    // Pathaiya dynamic pages-ai remove seiya
    const mainContent = document.getElementById('main-content');
    const existing = mainContent.querySelector(':scope > div:not(#dashboard-view)');
    if (existing) existing.remove();

    window.setActive('dashboard');
    window.loadStaffStats();
    window.loadTrendingPackage();
    
    // IMPORTANT: Dashboard varumpothu performance list-ai load seiya vendum
    window.loadPackagePerformance(); 
};

window.loadPage = function(pageName, activeId, initFunction = null) {
    const dashboardView = document.getElementById('dashboard-view');
    const mainContent = document.getElementById('main-content');
    
    if (dashboardView) dashboardView.classList.add('hidden');
    
    const existing = mainContent.querySelector(':scope > div:not(#dashboard-view)');
    if (existing) existing.remove();
    
    fetch(pageName)
        .then(res => {
            if(!res.ok) throw new Error("File not found: " + pageName);
            return res.text();
        })
        .then(html => {
            mainContent.insertAdjacentHTML('beforeend', html);
            window.setActive(activeId);
            if (initFunction) initFunction();
        })
        .catch(err => console.error("Error loading page:", err));
};



// Navigation Links
window.loadBooking = () => window.loadPage('staffbooking.html', 'booking');
window.loadQueries = () => window.loadPage('staffquieres.html', 'queries', window.loadStaffQueries);
window.loadCreate = () => window.loadPage('package-editor.html', 'create');
// staffdashboard.js
window.loadPackage = () => {
    window.loadPage('staffpackages.html', 'package', () => {
        // Page load aanavudan intha functions run aahum
        if (typeof window.loadStaffStats === "function") window.loadStaffStats();
        if (typeof window.loadTrendingPackage === "function") window.loadTrendingPackage();
        if (typeof window.loadPackagePerformance === "function") window.loadPackagePerformance();
    });
};

// staffdashboard.js
window.loadManagePackages = function() {
    window.loadPage('package-editor.html', 'manage', () => {
        console.log("Package Editor HTML injected.");
        // Ippo window.findPackage nichayamaga irukkum
    });
};



// --- 2. Live Stats & Performance List ---

window.loadStaffStats = function() {
    const statsRef = ref(db, 'dashboard_stats');
    const packagesRef = ref(db, 'packages');
    
    onValue(packagesRef, (snapshot) => {
        let count = snapshot.exists() ? snapshot.size : 0;
        const activeElem = document.getElementById('stat-active');
        if(activeElem) activeElem.innerText = count;
    });

    onValue(statsRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            if(document.getElementById('stat-sold')) document.getElementById('stat-sold').innerText = data.soldMonth || "0";
            if(document.getElementById('stat-revenue')) document.getElementById('stat-revenue').innerText = data.avgRevenue || "$0";
            if(document.getElementById('stat-rating')) document.getElementById('stat-rating').innerText = data.rating || "0/5";
        }
    });
};

// Package Performance Section Logic
window.loadPackagePerformance = function() {
    const container = document.getElementById('package-list-container');
    if (!container) return; 

    onValue(ref(db, 'packages'), (snapshot) => {
        container.innerHTML = ""; 
        if (snapshot.exists()) {
            const data = snapshot.val();
            Object.keys(data).forEach(key => {
                const pkg = data[key];
                
                container.innerHTML += `
                    <!-- Main Card: White Background & Neat Shadow -->
                    <div class="flex items-center justify-between p-4 mb-4 bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                        
                        <div class="flex items-center gap-4">
                            <!-- Image with slight rounded corners -->
                            <img src="${pkg.img || 'https://via.placeholder.com/60'}" 
                                 class="w-14 h-14 rounded-2xl object-cover shadow-inner">
                            
                            <div>
                                <!-- Package Name in Dark Text -->
                                <h4 class="font-bold text-gray-800 text-sm mb-1">${pkg.name || 'Unnamed Package'}</h4>
                                
                                <!-- Badges with soft colors for neat look -->
                                <div class="flex flex-wrap gap-2">
                                    <span class="flex items-center gap-1 text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                                        <i class="fa-solid fa-location-dot"></i> ${pkg.location || 'Global'}
                                    </span>
                                    <span class="flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                                        <i class="fa-solid fa-tag"></i> ${pkg.price || 'N/A'}
                                    </span>
                                    <span class="flex items-center gap-1 text-[10px] font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
                                        <i class="fa-solid fa-calendar-days"></i> ${pkg.time || 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Action Buttons: Clear & Modern -->
                        <div class="flex gap-2 pr-2">
                            <!-- Edit: Subtle Blue -->
                            <button onclick="editPackage('${key}')" 
                                    class="w-9 h-9 flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all duration-200">
                                <i class="fa-solid fa-pen-to-square text-sm"></i>
                            </button>
                            
                            <!-- Delete: Subtle Red -->
                            <button onclick="deletePackage('${key}')" 
                                    class="w-9 h-9 flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all duration-200">
                                <i class="fa-solid fa-trash text-sm"></i>
                            </button>
                        </div>
                    </div>`;
            });
        } else {
            container.innerHTML = `
                <div class="text-center py-10 bg-white rounded-3xl border border-dashed border-gray-200">
                    <p class="text-gray-400 text-xs">No packages found in the database.</p>
                </div>`;
        }
    });
};

// --- 3. Edit & Delete Actions ---

window.deletePackage = function(id) {
    // 1. அழகான Warning Popup - பேக்கேஜ் நீக்குவதை உறுதி செய்ய
    Swal.fire({
        title: 'Delete Package?',
        text: "Are you sure you want to remove this package from GlobeTrek? 📦",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33', // சிவப்பு நிறம் (Delete)
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel',
        borderRadius: '15px'
    }).then((result) => {
        // 2. யூசர் 'Yes' அழுத்தினால் மட்டும் நீக்கப்படும்
        if (result.isConfirmed) {
            remove(ref(db, `packages/${id}`))
                .then(() => {
                    // 3. வெற்றிகரமாக நீக்கப்பட்ட பின் வரும் மெசேஜ்
                    Swal.fire({
                        title: 'Deleted!',
                        text: 'The package has been successfully removed.',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    });
                })
                .catch((err) => {
                    // 4. பிழை ஏற்பட்டால் வரும் மெசேஜ்
                    Swal.fire({
                        title: 'Error!',
                        text: 'Failed to delete the package: ' + err.message,
                        icon: 'error'
                    });
                });
        }
    });
};

// staffdashboard.js
window.editPackage = function(id) {
    // 1. Editor page-ai load seigirom
    window.loadPage('package-editor.html', 'package', async () => {
        
        // 2. Verification section-ai (Step 1) maraithu, Form-ai (Step 2) kaattugirom
        const verificationSection = document.querySelector('section.bg-white.rounded-\\[2\\.5rem\\]');
        if (verificationSection) verificationSection.classList.add('hidden');
        
        const detailsForm = document.getElementById('detailsForm');
        if (detailsForm) detailsForm.classList.remove('hidden');

        // 3. Submit logic-ai register seigirom
        if (typeof window.initPackageForm === "function") {
            window.initPackageForm();
        }

        try {
            // 4. Firebase node 'package_details_data'ilirunthu data-vai edukkirom[cite: 5, 7]
            const detailSnap = await get(ref(db, `package_details_data/${id}`));

            if (detailSnap.exists()) {
                const data = detailSnap.val();

                // ID matrum Place Name-ai hidden fields-il vaikkirom
                document.getElementById('verifiedId').value = id;
                document.getElementById('targetPlaceName').value = data.placeName || "";

                // Hero Section & Visuals
                document.getElementById('heroTitle').value = data.hero?.title || "";
                document.getElementById('heroTagline').value = data.hero?.tagline || "";
                document.getElementById('heroImg').value = data.hero?.img || "";

                // Quick Info[cite: 6]
                document.getElementById('pPrice').value = data.cardInfo?.price || "";
                document.getElementById('pDuration').value = data.cardInfo?.duration || "";
                document.getElementById('pRating').value = data.cardInfo?.rating || "";
                document.getElementById('pMaxPeople').value = data.cardInfo?.maxPeople || "";

                // Narrative & Highlights[cite: 6]
                document.getElementById('pFullDesc').value = data.description || "";
                if(data.highlights) document.getElementById('pHighlights').value = data.highlights.join('\n');

                // Gallery Links (Textarea-vukku maatruthal)[cite: 6]
                if(data.gallery) document.getElementById('galleryUrls').value = data.gallery.join('\n');

                // Included & Not Included[cite: 6]
                if(data.included) document.getElementById('pIncluded').value = data.included.join('\n');
                if(data.notIncluded) document.getElementById('pNotIncluded').value = data.notIncluded.join('\n');

                // staffdashboard.js - editPackage function-kulle
if (data.itinerary && Array.isArray(data.itinerary)) {
    // 500ms delay koduppathu mukkhiyam, appothu thaan editor page load aahi mudinthirukkum
    setTimeout(() => {
        const container = document.getElementById('itineraryContainer');
        if (container) {
            container.innerHTML = ""; // Pazhaya empty fields-ai clear seiyavum
            window.dayCount = 0; // Counter-ai reset seiyavum

            data.itinerary.forEach(item => {
                // Intha function package-editor.js-il irukka vendum
                if (typeof window.addDayField === "function") {
                    window.addDayField(item.desc || ""); 
                }
            });
        }
    }, 500); 
}
            }
        } catch (err) {
            console.error("Firebase load error:", err);
        }
    });
};


document.addEventListener('DOMContentLoaded', () => {
    window.loadStaffStats();
    window.loadTrendingPackage();
    
    // Ippo ithu nichayamaaga list-ai kaattum
    if (typeof window.loadPackagePerformance === "function") {
        window.loadPackagePerformance();
    }
    window.showDashboard();
    window.setActive('dashboard');
});

// --- 4. Queries Logic ---

window.loadStaffQueries = function() {
    const container = document.getElementById('queries-list-container');
    if (!container) return;

    onValue(ref(db, 'queries'), (snapshot) => {
        container.innerHTML = ""; 
        if (snapshot.exists()) {
            const data = snapshot.val();
            Object.keys(data).reverse().forEach(key => {
                const q = data[key];
                const statusColor = q.status === "UNREAD" ? "red" : "green";
                container.innerHTML += `
                    <div class="bg-white p-6 rounded-[2rem] border-l-4 border-l-${statusColor}-500 mb-4 shadow-sm">
                        <div class="flex justify-between items-start">
                            <h4 class="font-bold text-slate-900">${q.userName}</h4>
                            <span class="px-3 py-1 rounded-full text-[10px] font-bold bg-${statusColor}-50 text-${statusColor}-500 uppercase">${q.status}</span>
                        </div>
                        <p class="text-sm text-gray-500 italic mt-1">"${q.message}"</p>
                        <button onclick="selectQueryForReply('${key}', '${q.userName}', '${q.subject}')" class="text-blue-600 font-bold text-[10px] mt-2">REPLY NOW →</button>
                    </div>`;
            });
        }
    });
};

window.selectQueryForReply = function(id, name, subject) {
    document.getElementById('reply-to').value = `TO: ${name}`;
    document.getElementById('reply-subject').value = `RE: ${subject}`;
    document.getElementById('current-query-id').value = id;
    document.getElementById('reply-message').focus();
};

window.sendStaffReply = async function() {
    const queryId = document.getElementById('current-query-id').value;
    const replyMsg = document.getElementById('reply-message').value;

    
    if (!queryId || !replyMsg) {
        return Swal.fire({
            icon: 'warning',
            title: 'Empty Reply',
            text: 'Please select a query and type your message before sending!',
            confirmButtonColor: '#3085d6'
        });
    }

    try {
        // 2. ஒரு 'Sending...' லோடிங் மெசேஜ் காட்டலாம் (Optional but good UX)
        Swal.fire({
            title: 'Sending Reply...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        await update(ref(db, `queries/${queryId}`), {
            status: "REPLIED",
            staffReply: replyMsg,
            repliedAt: serverTimestamp()
        });

        // 3. வெற்றிகரமாக அனுப்பப்பட்ட பிறகு வரும் மெசேஜ்
        Swal.fire({
            icon: 'success',
            title: 'Reply Sent! ✅',
            text: 'The customer will be able to see your response now.',
            timer: 2000,
            showConfirmButton: false
        });

        document.getElementById('reply-message').value = ""; // மெசேஜ் பாக்ஸை காலி செய்ய

    } catch (error) {
        console.error("Reply Error:", error);
        // 4. எரர் வந்தால் வரும் மெசேஜ்
        Swal.fire({
            icon: 'error',
            title: 'Failed to Send',
            text: 'Something went wrong: ' + error.message,
            confirmButtonColor: '#d33'
        });
    }
};

// --- 5. Trending & Initialization ---

window.loadTrendingPackage = function() {
    onValue(ref(db, 'packages'), (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            let trendingPkg = null;
            let maxBookings = -1;
            Object.values(data).forEach(pkg => {
                const count = pkg.bookingsCount || 0;
                if (count > maxBookings) { maxBookings = count; trendingPkg = pkg; }
            });
            if (trendingPkg) {
                if(document.getElementById('trending-name')) document.getElementById('trending-name').innerText = trendingPkg.name;
                if(document.getElementById('trending-img')) document.getElementById('trending-img').src = trendingPkg.img;
            }
        }
    });
};


window.handlePackageSubmit = async function(event) {
    event.preventDefault();
    
    const newPackage = {
    name: document.getElementById('pName').value,
    country: document.getElementById('pCountry').value,    
    img: document.getElementById('pImg').value,
    tag: document.getElementById('pTag').value,
    time: document.getElementById('pTime').value,
    description: document.getElementById('pDesc').value,
    places: document.getElementById('pPlaces').value,
    createdAt: serverTimestamp()
};

    try {
    await push(ref(db, 'packages'), newPackage);

    await Swal.fire({
        icon: 'success',
        title: 'Package Created!',
        text: 'New travel package has been added to GlobeTrek. 🌍',
        timer: 2000,
        showConfirmButton: false,
        borderRadius: '15px'
    });

    
    document.getElementById('addPackageForm').reset();
    document.getElementById('packageModal').classList.add('hidden');

} catch (error) {
    console.error("Error creating package:", error);

    
    Swal.fire({
        icon: 'error',
        title: 'Creation Failed',
        text: 'Something went wrong: ' + error.message,
        confirmButtonColor: '#d33'
    });
}
};


// Remove the first definition entirely, keep this one corrected:
window.loadBooking = () => {
    console.log("Booking button clicked!");
    window.loadPage('staffbooking.html', 'booking', () => {   // ✅ changed to 'booking'
        console.log("HTML Injected. Initializing Firebase...");
        setTimeout(() => {
            if (typeof window.loadStaffBookings === "function") {
                window.loadStaffBookings();
            } else {
                console.error("Error: staffbooking.js load aagavillai!");
            }
        }, 300);
    });
};

window.loadQueryInbox = function() {
    const queryInbox = document.getElementById('queryInbox');
    const queriesRef = ref(db, 'queries');

    if (!queryInbox) return;

    onValue(queriesRef, (snapshot) => {
        queryInbox.innerHTML = ""; 

        if (snapshot.exists()) {
            const data = snapshot.val();
            const queryIds = Object.keys(data).reverse();

            queryIds.forEach(id => {
                const q = data[id];
                
                // Database keys-ukku etrapola variables (userName, userEmail, dateLabel)
                const name = q.userName || "Guest";
                const email = q.userEmail || "No Email";
                const date = q.dateLabel || "Recent";
                const status = q.status || "UNREAD";

                const queryCard = `
                    <div class="bg-white/5 border ${status === 'UNREAD' ? 'border-blue-500/50' : 'border-white/10'} p-5 rounded-2xl hover:bg-white/10 transition-all group relative">
                        ${status === 'UNREAD' ? '<span class="absolute top-3 right-3 w-2 h-2 bg-blue-500 rounded-full"></span>' : ''}
                        
                        <div class="flex justify-between items-start mb-3">
                            <div class="flex-1">
                                <h4 class="font-bold text-blue-400 text-sm truncate">${name}</h4>
                                <p class="text-[10px] text-gray-400">${email}</p>
                            </div>
                            <span class="text-[9px] bg-white/10 px-2 py-1 rounded text-gray-300">
                                ${date}
                            </span>
                        </div>
                        
                        <div class="mb-3">
                            <p class="text-xs font-semibold text-white mb-1">${q.subject || 'No Subject'}</p>
                            <p class="text-[11px] text-gray-300 leading-relaxed italic line-clamp-3">
                                "${q.message}"
                            </p>
                        </div>

                        <div class="flex gap-2 pt-2 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onclick="replyQuery('${email}', '${id}')" 
                                class="text-[10px] flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded-lg font-bold transition-colors">
                                Reply
                            </button>
                            <button onclick="deleteQuery('${id}')" 
                                class="text-[10px] px-3 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white py-1.5 rounded-lg transition-all">
                                Clear
                            </button>
                        </div>
                    </div>
                `;
                queryInbox.insertAdjacentHTML('beforeend', queryCard);
            });
        } else {
            queryInbox.innerHTML = `<p class="text-center text-gray-500 text-sm py-10">No messages in inbox.</p>`;
        }
    });
};

// Reply seiyum pothu status-ai 'READ' endru maatra logic
window.replyQuery = async function(email, id) {
    try {
        await update(ref(db, `queries/${id}`), { status: "READ" });
        window.location.href = `mailto:${email}?subject=Regarding your Globe Trek Inquiry`;
    } catch (err) {
        console.error("Status Update Error:", err);
    }
};

window.deleteQuery = async function(id) {
    // 1. மெசேஜை நீக்குவதற்கு முன்னால் வரும் அழகான எச்சரிக்கை
    const result = await Swal.fire({
        title: 'Delete Message?',
        text: "Are you sure you want to permanently delete this customer query? 📩",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33', // சிவப்பு நிறம் (Delete)
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel',
        borderRadius: '15px'
    });

    // 2. பயனர் 'Yes' அழுத்தினால் மட்டும் Firebase-இல் இருந்து நீக்கப்படும்
    if (result.isConfirmed) {
        try {
            await remove(ref(db, `queries/${id}`));

            // 3. வெற்றிகரமாக நீக்கப்பட்ட பின் வரும் மெசேஜ்
            Swal.fire({
                title: 'Deleted!',
                text: 'The query has been removed.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error) {
            // 4. எரர் வந்தால் அதைக் காட்டுதல்
            Swal.fire({
                title: 'Error!',
                text: 'Could not delete the message: ' + error.message,
                icon: 'error'
            });
        }
    }
};

// Dashboard load aanavudan inbox-ai fetch seiya
document.addEventListener('DOMContentLoaded', () => {
    if (typeof loadQueryInbox === 'function') {
        loadQueryInbox();
    }
});

// இந்த பங்க்ஷனை பக்கம் லோடு ஆகும் போது (window.onload) அழைக்கவும்
function renderBookingChart() {
    const ctx = document.getElementById('bookingChart');
    
    if (!ctx) {
        console.error("Canvas element 'bookingChart' missing!");
        return;
    }

    onValue(ref(db, 'bookings'), (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            // மாதங்களை வரிசையாக வைத்திருக்கிறோம்
            const monthCounts = { 'Jan': 0, 'Feb': 0, 'Mar': 0, 'Apr': 0, 'May': 0, 'Jun': 0 };

            // 1. Firebase-இல் இருந்து வரும் தேதியை வைத்து மாதங்களை கணக்கிடுதல்
            Object.values(data).forEach(booking => {
                if (booking.travelDate) {
                    const date = new Date(booking.travelDate);
                    const monthName = date.toLocaleString('default', { month: 'short' });
                    if (monthCounts.hasOwnProperty(monthName)) {
                        monthCounts[monthName]++;
                    }
                }
            });

            // 2. ஏற்கனவே இருக்கும் சார்ட்டை அழித்துவிட்டு புதிய Bar Chart உருவாக்குதல்
            if (window.myChart instanceof Chart) {
                window.myChart.destroy();
            }

            window.myChart = new Chart(ctx.getContext('2d'), {
                type: 'bar', // இங்கே 'line' என்பதற்கு பதில் 'bar' என மாற்றப்பட்டுள்ளது
                data: {
                    labels: Object.keys(monthCounts),
                    datasets: [{
                        label: 'Total Bookings',
                        data: Object.values(monthCounts),
                        backgroundColor: [
                            'rgba(255, 87, 34, 0.6)', // ஜனவரி - ஆரஞ்சு
                            'rgba(54, 162, 235, 0.6)', // பிப்ரவரி - நீலம்
                            'rgba(255, 206, 86, 0.6)', // மார்ச் - மஞ்சள்
                            'rgba(75, 192, 192, 0.6)', // ஏப்ரல் - பச்சை
                            'rgba(153, 102, 255, 0.6)', // மே - ஊதா
                            'rgba(255, 159, 64, 0.6)'  // ஜூன் - வெளிர் ஆரஞ்சு
                        ],
                        borderColor: '#ff5722',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { 
                            beginAtZero: true,
                            ticks: { stepSize: 1 } // முழு எண்களாக மட்டும் காட்டும்
                        }
                    },
                    plugins: {
                        legend: { display: false } // லெஜண்ட் தேவையில்லை எனில் மறைக்கலாம்
                    }
                }
            });
        }
    });
}

// பக்கம் லோடு ஆனதும் அழைக்கவும்
document.addEventListener('DOMContentLoaded', renderBookingChart);

function loadTrendingHotspots() {
    const hotspotContainer = document.getElementById('hotspotContainer');

    onValue(ref(db, 'bookings'), (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            const destinationStats = {};

            // 1. தரவுகளைச் சேகரித்தல் (Count மற்றும் Image இரண்டையும் எடுக்கிறோம்)
            Object.values(data).forEach(booking => {
                const name = booking.packageName;
                if (!destinationStats[name]) {
                    destinationStats[name] = {
                        count: 0,
                        image: booking.packageImg || 'default-placeholder.jpg' // படம் இல்லையென்றால் ஒரு பொதுவான படத்தை வைக்கலாம்
                    };
                }
                destinationStats[name].count += 1;
            });

            // 2. புக்கிங் எண்ணிக்கையின் அடிப்படையில் வரிசைப்படுத்துதல்
            const sorted = Object.entries(destinationStats)
                .sort(([, a], [, b]) => b.count - a.count)
                .slice(0, 3); // முதல் 3 இடங்கள்

            // 3. HTML-ஐ உருவாக்குதல்
            let html = "";
            sorted.forEach(([name, info], index) => {
                html += `
                    <div class="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-2xl hover:shadow-md transition-all animate-in fade-in slide-in-from-right-4 duration-500">
                        <div class="flex items-center gap-4">
                            <!-- டைனமிக் இமேஜ் இங்கே வரும் -->
                            <img src="${info.image}" class="w-12 h-12 rounded-xl object-cover shadow-sm border border-gray-100" alt="${name}">
                            <div>
                                <p class="font-bold text-gt-blue text-sm">${name}</p>
                                <p class="text-[10px] text-gray-500 font-medium">${info.count} Active Bookings</p>
                            </div>
                        </div>
                        <div class="flex flex-col items-end">
                            <span class="text-[10px] font-bold ${index === 0 ? 'text-gt-orange' : 'text-green-600'}">
                                ${index === 0 ? '🏆 #1 TOP' : '🔥 Trending'}
                            </span>
                        </div>
                    </div>`;
            });

            hotspotContainer.innerHTML = html;
        } else {
            hotspotContainer.innerHTML = "<p class='text-gray-400 text-sm italic'>No booking data yet.</p>";
        }
    });
}

// பக்கம் லோடு ஆனதும் அழைக்கவும்
document.addEventListener('DOMContentLoaded', loadTrendingHotspots);

function updateWelcomeStats() {
    const pendingDisplay = document.getElementById('pendingCountDisplay');
    const queryDisplay = document.getElementById('queryCountDisplay');

    // 1. Pending Bookings எண்ணிக்கையை எடுத்தல்
    onValue(ref(db, 'bookings'), (snapshot) => {
        let pendingCount = 0;
        if (snapshot.exists()) {
            const bookings = snapshot.val();
            // 'status' என்பது 'Pending' ஆகவோ அல்லது காலியாகவோ இருப்பதை எண்ணுதல்
            pendingCount = Object.values(bookings).filter(b => 
                (b.status || 'Pending') === 'Pending'
            ).length;
        }
        if (pendingDisplay) pendingDisplay.innerText = pendingCount;
    });

    // 2. Unread Queries எண்ணிக்கையை எடுத்தல்
    onValue(ref(db, 'queries'), (snapshot) => {
        let unreadCount = 0;
        if (snapshot.exists()) {
            const queries = snapshot.val();
            // ஒருவேளை உங்கள் query நோடில் 'status' இருந்தால் இதைப் பயன்படுத்தலாம்
            unreadCount = Object.values(queries).filter(q => 
                q.status !== 'replied' // உதாரணமாக
            ).length;
        } else {
            // ஒருவேளை 'queries' நோட் இல்லை என்றால் 0 என காட்டும்
            unreadCount = 0;
        }
        if (queryDisplay) queryDisplay.innerText = unreadCount;
    });
}

// பக்கம் லோடு ஆனதும் அழைக்கவும்[cite: 1]
document.addEventListener('DOMContentLoaded', updateWelcomeStats);








// Logout
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    signOut(auth).then(() => window.location.href = 'login.html');
});