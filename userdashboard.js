import { auth, db } from './firebase.js'; 
import { ref, get, child, update, onValue, remove, set, push, serverTimestamp} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { onAuthStateChanged, updatePassword, EmailAuthProvider, reauthenticateWithCredential, updateEmail, updateProfile, deleteUser, signOut} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// --- 1. Sidebar Active State ---
window.setActive = function(selectedId) {
    const buttons = document.querySelectorAll('.nav-btn');
    buttons.forEach(btn => {
        btn.classList.remove('bg-blue-50/70', 'text-gt-blue');
        btn.classList.add('text-gray-500');
    });
    const activeBtn = document.getElementById('nav-' + selectedId);
    if (activeBtn) {
        activeBtn.classList.remove('text-gray-500');
        activeBtn.classList.add('bg-blue-50/70', 'text-gt-blue');
    }
};

// --- 2. Show Dashboard ---
window.showDashboard = function() {
    const dashboardView = document.getElementById('dashboard-view');
    if (dashboardView) dashboardView.classList.remove('hidden');
    
    const existing = document.getElementById('main-content').querySelector(':scope > div:not(#dashboard-view)');
    if (existing) existing.remove();
    setActive('dashboard');
};

window.loadPage = function(pageName, activeId, initFunction = null) {
    const dashboardView = document.getElementById('dashboard-view');
    const mainContent = document.getElementById('main-content');
    
    if (dashboardView) dashboardView.classList.add('hidden');
    
    // Pathaiya content-ai remove seiya
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

// --- 3. Dynamic Page Loader ---
async function loadDynamicPage(pageName, activeId, callback = null) {
    const dashboardView = document.getElementById('dashboard-view');
    const mainContent = document.getElementById('main-content');
    
    if (dashboardView) dashboardView.classList.add('hidden');
    
    const existing = mainContent.querySelector(':scope > div:not(#dashboard-view)');
    if (existing) existing.remove();

    try {
        const response = await fetch(pageName);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const html = await response.text();
        const wrapper = document.createElement('div');
        wrapper.innerHTML = html;
        mainContent.appendChild(wrapper);
        
        setActive(activeId);
        if (pageName === 'usersupport.html') {
            console.log("Support page detected, loading history...");
            // 300ms தாமதம் கொடுப்பதன் மூலம் HTML முழுமையாக லோடு ஆன பின் 
            // Firebase டேட்டாவை கொண்டு வர முடியும்.
            setTimeout(() => {
                if (typeof loadInquiries === "function") {
                    loadInquiries();
                }
            }, 300);
        }
        if (pageName === 'usersettings.html') {
    setTimeout(() => {
        if (typeof loadUserProfile === "function") {
            loadUserProfile();
        }
    }, 300);
}
        if (callback) callback();
        
    } catch (err) {
        console.error("Fetch failed:", err);
        mainContent.insertAdjacentHTML('beforeend', `<div class="p-10 text-red-500">Error: ${pageName} லோடு ஆகவில்லை.</div>`);
    }
}

// --- 4. Load Packages & Location Filter Logic ---
window.loadPackages = (selectedCountry = 'all') => {
    loadDynamicPage('userpackages.html', 'packages', () => {
        const grid = document.getElementById('allPackagesGrid');
        const filterContainer = document.getElementById('filterButtons');
        const packagesRef = ref(db, 'packages');

        onValue(packagesRef, async (snapshot) => {
            const allPackages = snapshot.val();
            if (!allPackages || !grid) return;

            grid.innerHTML = ""; 

            const keys = Object.keys(allPackages);
            for (const key of keys) {
                const item = allPackages[key];

                // பில்டர் சரிபார்ப்பு
                const itemCountry = (item.country || item.location || "").toLowerCase().trim();
                const targetFilter = selectedCountry.toLowerCase().trim();

                if (targetFilter === 'all' || targetFilter === 'all packages' || itemCountry === targetFilter) {
                    
                    // மேலதிக விவரங்களை எடுத்தல் (Price & Duration)
                    const detailsRef = ref(db, `package_details_data/${key}/cardInfo`);
                    const detailSnap = await get(detailsRef);
                    const detailData = detailSnap.exists() ? detailSnap.val() : {};

                    const rawPrice = detailData.price || item.price || "0";
                    const displayPrice = rawPrice.replace(/[^0-9,]/g, "");
                    const duration = detailData.duration || item.time || '5 Days';

                    renderPackageCard(key, item, displayPrice, duration, grid);
                }
            }
            
            // கிளிக் செய்த பட்டனை ஹைலைட் செய்தல்
            updateFilterButtonsUI(selectedCountry);
        });

        // பட்டன் கிளிக் ஈவென்ட்
        filterContainer?.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                const countryText = e.target.innerText;
                window.loadPackages(countryText); 
            }
        });
    });
};

function renderPackageCard(key, item, price, duration, container) {
    container.innerHTML += `
        <div class="bg-white rounded-[2.5rem] p-5 shadow-sm border border-gt-border group hover:shadow-2xl transition-all duration-500 flex flex-col min-w-0 w-full">
            <div class="relative overflow-hidden rounded-[2rem] mb-6">
                <img src="${item.img}" class="h-72 w-full object-cover group-hover:scale-110 transition-transform duration-700">
                <div class="absolute top-4 left-4 bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter">${item.tag || 'Featured'}</div>
            </div>
            <div class="px-2 flex-1">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="text-2xl font-bold text-gt-blue leading-tight w-2/3 break-words">${item.name}</h3>
                    <div class="text-right flex-shrink-0">
                        <p class="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Per Person</p>
                        <p class="text-xl font-bold text-gt-orange leading-none">LKR ${price}</p>
                    </div>
                </div>
                <div class="flex gap-2 mb-6">
                    <span class="text-[10px] font-bold text-gray-400 uppercase border border-gt-border px-2 py-1 rounded whitespace-nowrap">${item.country}</span>
                    <span class="text-[10px] font-bold text-gray-400 uppercase border border-gt-border px-2 py-1 rounded whitespace-nowrap">${duration}</span>
                </div>
                <div class="flex gap-3">
                    <button onclick="window.location.href='explore.html?id=${key}&from=user'" class="flex-1 bg-blue-50 text-gt-blue font-bold py-4 rounded-2xl hover:bg-blue-100 transition-colors">Details</button>
                    <button onclick="loadPaymentPage('${key}')" class="flex-1 bg-gt-orange text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-500/20">Book Now</button>
                </div>
            </div>
        </div>`;
}

function updateFilterButtonsUI(selected) {
    const filterContainer = document.getElementById('filterButtons');
    if (!filterContainer) return;
    filterContainer.querySelectorAll('button').forEach(btn => {
        if (btn.innerText.toLowerCase() === selected.toLowerCase()) {
            btn.className = "px-6 py-2 rounded-full bg-gt-orange/10 text-gt-blue font-bold text-sm border border-gt-orange whitespace-nowrap flex-shrink-0";
        } else {
            btn.className = "px-6 py-2 rounded-full bg-white text-gray-400 font-medium text-sm border border-gt-border hover:border-gt-orange transition-all whitespace-nowrap flex-shrink-0";
        }
    });
}

// --- 5. Payment Page Logic ---
window.loadPaymentPage = (packageId) => {
    loadDynamicPage('userpayment.html', 'payments', () => {
        setTimeout(async () => {
            try {
                const mainPkgRef = ref(db, `packages/${packageId}`);
                const mainSnap = await get(mainPkgRef);
                const mainData = mainSnap.val();

                const detailsRef = ref(db, `package_details_data/${packageId}/cardInfo`);
                const detailSnap = await get(detailsRef);
                const detailData = detailSnap.exists() ? detailSnap.val() : {};

                if (mainData && detailData) {
                    document.getElementById('payTripImg').src = mainData.img;
                    document.getElementById('payTripName').innerText = mainData.name;

                    const pricePerPerson = parseFloat(detailData.price.replace(/[^0-9.]/g, "")) || 0;
                    const taxAmount = 245.50;

                    const calculatePayment = () => {
                        const travelerInput = document.getElementById('travelerCount');
                        const count = travelerInput ? parseInt(travelerInput.value) || 1 : 1;
                        const subTotal = pricePerPerson * count;
                        const grandTotal = subTotal + taxAmount;

                        if(document.getElementById('payPackagePrice')) 
                            document.getElementById('payPackagePrice').innerText = `LKR ${subTotal.toLocaleString()}`;
                        if(document.getElementById('payTotal')) 
                            document.getElementById('payTotal').innerText = `LKR ${grandTotal.toLocaleString()}`;
                    };

                    document.getElementById('travelerCount')?.addEventListener('input', calculatePayment);
                    calculatePayment();

                    // ... முந்தைய கோட் ...

let selectedMethod = "Credit Card";
const paypalBtn = document.getElementById('paypalOption');
const creditCardBtn = document.getElementById('creditCardOption');

// பட்டன் ஸ்டைல்களை மாற்றும் பங்க்ஷன்
const updateButtonStyles = (method) => {
    if (method === "PayPal") {
        // PayPal பட்டனை Blue ஆக்குதல்
        paypalBtn.classList.replace('border-gray-200', 'border-blue-100');
        paypalBtn.classList.replace('bg-gray-50', 'bg-blue-50');
        paypalBtn.classList.replace('text-gray-400', 'text-blue-700');
        paypalBtn.classList.add('border-2');

        // Credit Card பட்டனை Gray ஆக்குதல்
        creditCardBtn.classList.replace('border-blue-100', 'border-gray-200');
        creditCardBtn.classList.replace('bg-blue-50', 'bg-gray-50');
        creditCardBtn.classList.replace('text-blue-700', 'text-gray-400');
        creditCardBtn.classList.remove('border-2');
    } else {
        // Credit Card பட்டனை Blue ஆக்குதல்
        creditCardBtn.classList.replace('border-gray-200', 'border-blue-100');
        creditCardBtn.classList.replace('bg-gray-50', 'bg-blue-50');
        creditCardBtn.classList.replace('text-gray-400', 'text-blue-700');
        creditCardBtn.classList.add('border-2');

        // PayPal பட்டனை Gray ஆக்குதல்
        paypalBtn.classList.replace('border-blue-100', 'border-gray-200');
        paypalBtn.classList.replace('bg-blue-50', 'bg-gray-50');
        paypalBtn.classList.replace('text-blue-700', 'text-gray-400');
        paypalBtn.classList.remove('border-2');
    }
};

paypalBtn?.addEventListener('click', () => {
    selectedMethod = "PayPal";
    updateButtonStyles("PayPal"); // ஸ்டைலை மாற்றும்
    document.getElementById('creditCardFields')?.classList.add('hidden');
    document.getElementById('paypalMessage')?.classList.remove('hidden');
});

creditCardBtn?.addEventListener('click', () => {
    selectedMethod = "Credit Card";
    updateButtonStyles("Credit Card"); // ஸ்டைலை மாற்றும்
    document.getElementById('creditCardFields')?.classList.remove('hidden');
    document.getElementById('paypalMessage')?.classList.add('hidden');
});



                    document.querySelector('button.bg-orange-500')?.addEventListener('click', async () => {
                        const user = auth.currentUser;
                        if (!user) return Swal.fire('Error', 'Please log in', 'error');

                        const bookingInfo = {
                            userId: user.uid,
                            packageId: packageId,
                            packageName: mainData.name,
                            packageImg: mainData.img,
                            travelerName: document.getElementById('travelerName').value,
                            travelerEmail: document.getElementById('travelerEmail').value,
                            travelDate: document.getElementById('travelDate').value,
                            numTravelers: document.getElementById('travelerCount').value,
                            totalAmount: document.getElementById('payTotal').innerText,
                            paymentMethod: selectedMethod,
                            status: "pending",
                            bookingDate: new Date().toLocaleString()
                        };

                        const newBookingRef = push(ref(db, 'bookings'));
                        await set(newBookingRef, bookingInfo);
                        Swal.fire('Success!', 'Booking Confirmed', 'success').then(() => window.loadBookings());
                    });
                }
            } catch (error) { console.error(error); }
        }, 300);
    });
};

// --- 6. My Bookings Page Logic ---
window.loadBookings = () => {
    loadDynamicPage('usermybookings.html', 'bookings', () => {
        setTimeout(() => {
            const latestContainer = document.getElementById('latestBookingHighlight');
            const gridContainer = document.getElementById('bookingsGrid');
            const countDisplay = document.getElementById('bookingCount');
            const user = auth.currentUser;

            if (!latestContainer || !gridContainer) {
                console.error("Booking containers not found in DOM yet!");
                return;
            }

            if (!user) return;

            onValue(ref(db, 'bookings'), (snapshot) => {
                if (snapshot.exists()) {
                    const allBookings = snapshot.val();
                    const userBookings = Object.keys(allBookings)
                        .map(key => ({ id: key, ...allBookings[key] }))
                        .filter(b => b.userId === user.uid)
                        .reverse();

                    if (userBookings.length === 0) {
                        latestContainer.innerHTML = `
                            <div class="bg-white p-10 rounded-[2.5rem] border border-gt-border text-center">
                                <p class="text-gray-400 font-medium">You haven't booked any journeys yet.</p>
                                <button onclick="loadPackages()" class="mt-4 text-gt-orange font-bold text-sm underline">EXPLORE PACKAGES</button>
                            </div>`;
                        gridContainer.innerHTML = "";
                        if (countDisplay) countDisplay.innerText = "00";
                        return;
                    }

                    if (countDisplay) countDisplay.innerText = userBookings.length.toString().padStart(2, '0');

                    // 1. Highlight Latest Booking (திருத்தப்பட்ட பகுதி)
                    const latest = userBookings[0];
                    const latestStatus = latest.status || 'Pending';
                    // Status-க்கு ஏற்ப நிறத்தை மாற்றும் லாஜிக்
                    const latestStatusClass = latestStatus === 'Confirmed' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-orange-100 text-orange-700';

                    latestContainer.innerHTML = `
                        <div class="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gt-border shadow-sm flex flex-col md:flex-row gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div class="flex-1">
                                <span class="inline-block ${latestStatusClass} text-[10px] font-bold px-3 py-1 rounded-full uppercase mb-4">
                                    ${latestStatus}
                                </span>
                                <h2 class="text-3xl font-bold text-gt-blue leading-tight mb-4">${latest.packageName}</h2>
                                <div class="space-y-3 mb-8 text-sm text-gray-600">
                                    <p class="flex items-center gap-2 font-medium">📅 Travel Date: ${latest.travelDate}</p>
                                    <p class="flex items-center gap-2 font-bold text-gt-blue text-lg">💳 ${latest.totalAmount}</p>
                                </div>
                                <button onclick="window.location.href='explore.html?id=${latest.packageId}&from=user'" class="bg-gt-orange text-white font-bold py-4 px-8 rounded-2xl shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all flex items-center gap-2">
                                    VIEW ITINERARY DETAILS ➔
                                </button>
                            </div>
                            <img src="${latest.packageImg}" class="w-full md:w-64 h-64 rounded-3xl object-cover shadow-md">
                        </div>`;

                    // 2. Previous Bookings (திருத்தப்பட்ட பகுதி)
                    let gridHtml = "";
                    const remaining = userBookings.slice(1);
                    if (remaining.length > 0) {
                        remaining.forEach(b => {
                            const bStatus = b.status || 'Pending';
                            const bStatusClass = bStatus === 'Confirmed' 
                                ? 'bg-green-50 text-green-600' 
                                : 'bg-orange-50 text-orange-600';

                            gridHtml += `
                                <div class="bg-white p-6 rounded-3xl border border-gt-border flex flex-col md:flex-row items-center gap-6 shadow-sm hover:shadow-md transition-all animate-in fade-in duration-500">
                                    <img src="${b.packageImg}" class="w-24 h-24 rounded-2xl object-cover">
                                    <div class="flex-1">
                                        <span class="text-[9px] ${bStatusClass} px-2 py-1 rounded-full font-bold uppercase">${bStatus}</span>
                                        <h3 class="text-xl font-bold text-gt-blue mt-1">${b.packageName}</h3>
                                        <p class="text-xs text-gray-500">📅 ${b.travelDate}</p>
                                    </div>
                                    <div class="text-right">
                                        <p class="text-lg font-bold text-gt-blue">${b.totalAmount}</p>
                                    </div>
                                </div>`;
                        });
                        gridContainer.innerHTML = gridHtml;
                    } else {
                        gridContainer.innerHTML = "<p class='text-gray-400 italic px-6'>No previous bookings found.</p>";
                    }
                } else {
                    latestContainer.innerHTML = "<p class='p-10 text-center text-gray-400'>No database records found.</p>";
                }
            });
        }, 500); 
    });
};

// Dashboard டேட்டாவை லோடு செய்யும் முதன்மை பங்க்ஷன்
window.loadDashboardData = () => {
    // 1. பயனர் லாகின் நிலையைச் சரிபார்த்தல்
    const user = auth.currentUser;
    if (!user) {
        console.warn("User state not found yet. Retrying...");
        return;
    }

    // HTML Elements
    const expeditionsList = document.getElementById('expeditionsList');
    const totalInvestedDisplay = document.getElementById('totalInvestedDisplay');
    const activityList = document.getElementById('activityList');
    const curatedList = document.getElementById('curatedList');

    // --- A. புக்கிங் மற்றும் செயல்பாடுகளை லோடு செய்தல் ---
    const bookingsRef = ref(db, 'bookings');
    onValue(bookingsRef, (snapshot) => {
        if (snapshot.exists()) {
            const allData = snapshot.val();
            
            // லாகின் செய்த யூசரின் புக்கிங்கை மட்டும் பிரித்து வரிசைப்படுத்துதல்
            const userBookings = Object.keys(allData)
                .map(key => ({ id: key, ...allData[key] }))
                .filter(b => b.userId === user.uid)
                .sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));

            console.log("Upcoming Expeditions found:", userBookings.length);

            if (userBookings.length > 0) {
                // 1. Total Investment அப்டேட்
                const total = userBookings.reduce((sum, b) => {
                    const price = parseFloat(b.totalAmount.replace(/[^0-9.]/g, "")) || 0;
                    return sum + price;
                }, 0);
                if (totalInvestedDisplay) totalInvestedDisplay.innerText = `LKR ${total.toLocaleString()}`;

                // 2. Upcoming Expeditions கார்டுகள்
                if (expeditionsList) {
                    let html = "";
                    userBookings.slice(0, 2).forEach(b => {
                        html += `
                        <div class="group bg-gray-50 p-5 rounded-[2rem] border border-transparent hover:border-gt-orange/20 hover:bg-white hover:shadow-xl transition-all duration-500 flex flex-col md:flex-row items-center gap-6 animate-in fade-in">
                            <div class="relative w-32 h-32 shrink-0 overflow-hidden rounded-2xl shadow-sm">
                                <img src="${b.packageImg}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" onerror="this.src='https://via.placeholder.com/150'">
                            </div>
                            <div class="flex-1 text-left">
                                <span class="text-[9px] font-black uppercase tracking-widest bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Confirmed</span>
                                <h3 class="text-xl font-bold text-gt-blue mt-1">${b.packageName}</h3>
                                <p class="text-sm text-gray-500 font-medium italic">📅 Travel Date: ${b.travelDate}</p>
                            </div>
                            <div class="text-right">
                                <p class="text-lg font-black text-gt-blue">${b.totalAmount}</p>
                                <button onclick="window.location.href='explore.html?id=${b.packageId}'" class="mt-2 text-[10px] font-bold border border-gt-border px-4 py-2 rounded-xl hover:bg-gt-blue hover:text-white transition-all uppercase tracking-widest">Details</button>
                            </div>
                        </div>`;
                    });
                    expeditionsList.innerHTML = html;
                }

                // 3. Recent Activity அப்டேட்
                if (activityList) {
                    let actHtml = "";
                    userBookings.slice(0, 3).forEach(b => {
                        actHtml += `
                        <div class="flex items-center gap-4 p-2 hover:bg-gray-50 rounded-2xl transition-colors">
                            <div class="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                            </div>
                            <div class="overflow-hidden">
                                <p class="text-sm font-bold text-gt-blue truncate">Booked ${b.packageName}</p>
                                <p class="text-[10px] text-gray-400 uppercase font-medium">${b.bookingDate || 'Recent'}</p>
                            </div>
                        </div>`;
                    });
                    activityList.innerHTML = actHtml;
                }
            } else {
                if (expeditionsList) expeditionsList.innerHTML = `<div class="py-10 text-center border-2 border-dashed border-gray-100 rounded-3xl"><p class="text-gray-400">No upcoming expeditions found.</p></div>`;
            }
        }
    });

    // --- B. "Curated For Your Taste" (Packages) லோடு செய்தல் ---
   // Curated List பகுதியை மட்டும் இந்த கோடால் மாற்றவும்
// Curated Section-க்கான திருத்தப்பட்ட கோட்
if (curatedList) {
    onValue(ref(db, 'packages'), (snapshot) => {
        if (snapshot.exists()) {
            const packages = snapshot.val();
            let curatedHtml = "";
            
            Object.keys(packages).slice(0, 3).forEach(id => {
                const p = packages[id];
                
                // --- இமேஜ் வராததற்கு இதுதான் தீர்வு ---
                // உங்கள் Firebase-ல் இமேஜ் எந்தப் பெயரில் இருந்தாலும் இது தேடி எடுத்துக்கொள்ளும்
                const imgSource = p.mainImg || p.image || p.img || p.packageImg || p.thumbnail || 'https://via.placeholder.com/400x300?text=No+Image+Found';
                
                // விலைக்கும் இதேபோல் பல பெயர்களைச் சோதிக்கிறோம்
                const priceSource = p.price || p.totalAmount || p.packagePrice || 'Contact Us';

                curatedHtml += `
                <div class="bg-white rounded-[2rem] overflow-hidden border border-gt-border hover:shadow-2xl transition-all duration-500 group cursor-pointer" onclick="window.location.href='explore.html?id=${id}'">
                    <div class="relative h-48 overflow-hidden bg-gray-100">
                        <img src="${imgSource}" 
                             class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                             loading="lazy"
                             onerror="this.src='https://via.placeholder.com/400x300?text=Check+Firebase+Path'">
                        
                        <div class="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full shadow-sm">
                            <p class="text-[10px] font-bold text-gt-blue">⭐ Recommended</p>
                        </div>
                    </div>
                    <div class="p-6">
                        <h3 class="text-xl font-bold text-gt-blue mb-1">${p.packageName || p.name || 'Expedition'}</h3>
                        <p class="text-xs text-gray-500 mb-4 line-clamp-1 font-medium">${p.description || 'Luxury travel experience'}</p>
                        <div class="flex justify-between items-center pt-4 border-t border-gray-50">
                            <div>
                                <p class="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Starts from</p>
                                <p class="text-md font-black text-gt-orange">${priceSource}</p>
                            </div>
                            <div class="w-8 h-8 bg-gt-blue text-white rounded-full flex items-center justify-center group-hover:bg-gt-orange transition-colors">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                            </div>
                        </div>
                    </div>
                </div>`;
            });
            curatedList.innerHTML = curatedHtml;
        }
    });
}
}
    


// 3. Auth State மாற்றம் கவனித்தல்
onAuthStateChanged(auth, (user) => {
    if (user) {
        // பக்கம் முழுமையாக ரெண்டர் ஆக 300ms தாமதம்
        setTimeout(() => {
            loadDashboardData();
        }, 300);
    }
});

// --- 7. Sidebar Links ---
window.loadSupport = () => loadDynamicPage('usersupport.html', 'support');
window.loadSettings = () => loadDynamicPage('usersetting.html', 'settings');
window.loadPayments = () => loadDynamicPage('userpayment.html', 'payments');

// --- 8. Auth State & Profile ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        onValue(ref(db, `users/${user.uid}`), (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                if (document.getElementById("profileName")) document.getElementById("profileName").innerText = data.fullName || "User";
                if (document.getElementById("profileEmail")) document.getElementById("profileEmail").innerText = data.email || user.email;
                if (document.getElementById("profilePhone")) document.getElementById("profilePhone").innerText = data.phone || "N/A";
                if (document.getElementById("profilePic")) document.getElementById("profilePic").src = data.profilePic || "https://i.pravatar.cc/100";
                if (document.getElementById("userName")) document.getElementById("userName").innerText = data.fullName;
            }
        });
    } else {
        window.location.href = "login.html";
    }
});




window.submitInquiry = async function(event) {
    if(event) event.preventDefault();
    
    const user = auth.currentUser;
    
   
    const subjectElem = document.getElementById('query-subject');
    const messageElem = document.getElementById('query-message');

    
    if (!subjectElem || !messageElem) {
        console.error("Input fields not found! Check ID.");
        return;
    }

    const subject = subjectElem.value.trim();
    const message = messageElem.value.trim();

  // 1. அனைத்து பீல்டுகளும் நிரப்பப்படவில்லை என்றால் வரும் எச்சரிக்கை
if (subject === "" || message === "") {
    return Swal.fire({
        icon: 'warning',
        title: 'Empty Fields!',
        text: 'Please fill both subject and message before sending your inquiry.',
        confirmButtonColor: '#3085d6',
        borderRadius: '15px'
    });
}

try {
    const queriesRef = ref(db, 'queries');
    const newQueryRef = push(queriesRef); 

    // டேட்டாபேஸில் சேமிக்கும் போது ஒரு லோடிங் காட்டலாம்
    Swal.fire({
        title: 'Sending Inquiry...',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });

    await set(newQueryRef, {
        userId: user ? user.uid : "Guest",
        userName: user ? (user.displayName || "Explorer") : "Guest User",
        userEmail: user ? user.email : "No Email",
        subject: subject,
        message: message,
        status: "UNREAD", 
        timestamp: Date.now(),
        dateLabel: new Date().toLocaleDateString()
    });

    // 2. வெற்றிகரமாக அனுப்பப்பட்டால் வரும் மெசேஜ்
    await Swal.fire({
        icon: 'success',
        title: 'Inquiry Sent! 🚀',
        text: 'Your message has been delivered to GlobeTrek team. We will get back to you soon!',
        timer: 3000,
        showConfirmButton: false
    });
    
    // Fields-ai clear seiya
    subjectElem.value = "";
    messageElem.value = "";
    
} catch (error) {
    console.error("Firebase Error:", error);
    
    // 3. பிழை ஏற்பட்டால் வரும் மெசேஜ்
    Swal.fire({
        icon: 'error',
        title: 'Submission Failed',
        text: 'Something went wrong: ' + error.message,
        confirmButtonColor: '#d33'
    });
}
};


function loadInquiries() {
    const container = document.getElementById('inquiryHistoryContainer'); 
    if (!container) return;

    const user = auth.currentUser;
    onValue(ref(db, 'queries'), (snapshot) => {
        container.innerHTML = "";
        if (snapshot.exists()) {
            const data = snapshot.val();
            const userQueries = Object.keys(data)
                .map(key => ({ id: key, ...data[key] }))
                .filter(q => q.userId === user?.uid)
                .sort((a, b) => b.timestamp - a.timestamp);

            if (userQueries.length === 0) {
                container.innerHTML = "<p class='text-center text-gray-400 py-10'>No inquiry history found.</p>";
                return;
            }

            userQueries.forEach(q => {
                container.innerHTML += `
                    <div class="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm mb-4">
                        <div class="flex justify-between items-center mb-2">
                            <h3 class="font-bold text-slate-800">${q.subject}</h3>
                            <span class="text-[10px] font-bold px-3 py-1 rounded-full ${q.status === 'REPLIED' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}">${q.status}</span>
                        </div>
                        <p class="text-sm text-gray-600 italic">"${q.message}"</p>
                        
                        ${q.staffReply ? `
                        <div class="bg-blue-50 p-4 rounded-2xl mt-4 border-l-4 border-blue-500">
                            <p class="text-[10px] font-bold text-blue-700 uppercase mb-1">Staff Response</p>
                            <p class="text-sm text-slate-700 font-medium">"${q.staffReply}"</p>
                        </div>
                        ` : '<p class="text-[10px] text-gray-400 mt-2 italic">Waiting for staff response...</p>'}
                    </div>
                `;
            });
        } else {
            container.innerHTML = "<p class='text-center text-gray-400 py-10'>Start your first inquiry below.</p>";
        }
    });
}



window.loadUserProfile = function() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("Logged in user UID:", user.uid); 
            const userRef = ref(db, 'users/' + user.uid);
            
            onValue(userRef, (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    console.log("Fetched Data:", data);

                    // --- 1. கார்டு டிஸ்ப்ளே (Identity Card) ---
                    const nameTag = document.getElementById('display-fullname');
                    if (nameTag) nameTag.innerText = data.fullName || "User"; 

                    const imgTag = document.getElementById('display-profile-img');
                    if (imgTag) {
                        imgTag.src = data.profilePic || 'default-avatar.png'; // படம் இல்லையெனில் டிபால்ட் படம்
                    }

                    // --- 2. Identity & Contact படிவத்தில் நிரப்புதல் ---
                    const fields = {
                        'prof-fullname': data.fullName,
                        'prof-email': data.email,
                        'prof-phone': data.phone,
                        'prof-lang': data.language || "English (US)",
                        'prof-address': data.address
                    };

                    for (let id in fields) {
                        const elem = document.getElementById(id);
                        if (elem) elem.value = fields[id] || "";
                    }

                    // --- 3. Fortress & Security செட்டிங்ஸ் ---
                    const twoFactorElem = document.getElementById('two-factor-check');
                    if (twoFactorElem) {
                        twoFactorElem.checked = data.twoFactorEnabled || false;
                    }

                    // --- 4. Travel Stats (image_b2167c.png & image_b2252a.png) ---
                    
                    // Countries Visited: '0' என்று இருந்தால் அதை அப்படியே காட்டும்
                    const countryCount = document.getElementById('countries-visited-count');
                    if (countryCount) {
                        countryCount.innerText = data.countriesVisited !== undefined ? data.countriesVisited : "0";
                    }

                    // Expedition Goal சதவீதம் மற்றும் Progress Bar
                    const goalPercentElem = document.getElementById('expedition-goal-percent');
                    const progressBar = document.getElementById('goal-progress-bar');
                    
                    if (goalPercentElem) {
                        const percent = data.goalCompletion !== undefined ? data.goalCompletion : 0;
                        goalPercentElem.innerText = `${percent}% Complete`;
                        
                        // Progress Bar-ன் நீளத்தை மாற்றுதல்
                        if (progressBar) {
                            progressBar.style.width = `${percent}%`;
                        }
                    }

                    // Explorer Status
                    const statusTag = document.getElementById('display-status');
                    if (statusTag) {
                        statusTag.innerText = `Explorer Status: ${data.status || 'Active'}`;
                    }

                } else {
                    console.warn("No data found for this UID.");
                }
            });
        } else {
            // பயனர் லாக் அவுட் செய்திருந்தால் லாகின் பக்கத்திற்கு அனுப்பவும்
            window.location.href = "login.html";
        }
    });
};

// மாற்றங்களைச் சேமிப்பதற்கான பங்க்ஷன் (ஏற்கனவே உங்களிடம் உள்ளது)
window.updateUserProfile = async function(event) {
    if(event) event.preventDefault();
    const user = auth.currentUser;
    if (!user) return alert("Please login first!");

    // பட்டன் ரெஃபரன்ஸ் (பட்டனை நேரடியாக கிளிக் செய்தால் 'event.target' வேலை செய்யும்)
    // அல்லது பட்டனுக்கு ஒரு ID கொடுத்து பயன்படுத்தலாம்
    const btn = document.querySelector('button[onclick="updateUserProfile(event)"]') || event.target;
    
    const updatedData = {
        fullName: document.getElementById('prof-fullname').value,
        email: document.getElementById('prof-email').value,
        phone: document.getElementById('prof-phone').value,
        address: document.getElementById('prof-address').value,
        language: document.getElementById('prof-lang').value
    };

    try {
        if(btn && btn.innerText) btn.innerText = "Saving...";
        
        await update(ref(db, 'users/' + user.uid), updatedData);
        alert("Changes saved successfully! ✅");
    } catch (error) {
        console.error("Update Error:", error);
        alert("Error: " + error.message);
    } finally {
        if(btn && btn.innerText) btn.innerText = "Save Changes";
    }
};

// --- Profile Photo Upload & Save ---
window.uploadProfilePhoto = async function(event) {
    const file = event.target.files[0];
    const user = auth.currentUser;

    if (!user || !file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        const base64Image = e.target.result; 
       try {
    // Firebase-இல் போட்டோவை அப்டேட் செய்தல்
    await update(ref(db, 'users/' + user.uid), {
        profilePic: base64Image
    });
    
    // உடனடியாக திரையில் போட்டோ மாற
    document.getElementById('display-profile-img').src = base64Image; 

    // 1. அழகான Success Notification
    Swal.fire({
        icon: 'success',
        title: 'Profile Updated!',
        text: 'Your profile picture has been changed successfully. ✨',
        timer: 2000,
        showConfirmButton: false,
        position: 'top-end', // ஸ்கிரீனின் மேல் மூலையில் காட்ட (Toast ஸ்டைல்)
        toast: true, // இது சின்னதாக ஒரு நோட்டிபிகேஷன் போல வரும்
        background: '#fff',
        iconColor: '#28a745'
    });

} catch (error) {
    console.error("Save Error:", error);

    // 2. எரர் வந்தால் வரும் மெசேஜ்
    Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: 'Could not save the profile picture: ' + error.message,
        confirmButtonColor: '#d33'
    });
}
    };
    reader.readAsDataURL(file);
};
// இந்த இடத்தில் இருந்த அந்தத் தவறான வரியை நீக்கிவிடவும்.
// --- 3. Update Security (Password) ---
window.updateUserPassword = async function(event) {
    if(event) event.preventDefault();
    
    const user = auth.currentUser;
    
    // 1. லாகின் சரிபார்ப்பு
    if (!user) {
        return Swal.fire({
            icon: 'error',
            title: 'Authentication Required',
            text: 'Please login first to update your security settings!',
            confirmButtonColor: '#3085d6'
        });
    }

    const currPass = document.getElementById('curr-password').value;
    const newPass = document.getElementById('new-password').value;
    const confirmPass = document.getElementById('confirm-password').value;
    const is2FAEnabled = document.getElementById('two-factor-check').checked;

    // 2. உள்ளீடு சரிபார்ப்பு
    if (!currPass) {
        return Swal.fire({
            icon: 'warning',
            title: 'Verification Needed',
            text: 'Please enter your current password to verify your identity.',
            confirmButtonColor: '#f8bb86'
        });
    }
    
    if (newPass || confirmPass) {
        if (newPass !== confirmPass) {
            return Swal.fire({
                icon: 'error',
                title: 'Mismatch!',
                text: 'New passwords do not match.',
                confirmButtonColor: '#d33'
            });
        }
        if (newPass.length < 6) {
            return Swal.fire({
                icon: 'info',
                title: 'Weak Password',
                text: 'New password must be at least 6 characters.',
                confirmButtonColor: '#3085d6'
            });
        }
    }

    // பட்டன் ஸ்டேட்
    const btn = event.submitter || event.target.querySelector('button[type="submit"]') || event.target;
    const originalText = btn.innerText;

    try {
        btn.innerText = "Securing...";
        btn.disabled = true;

        // லோடிங் பாப்-அப்
        Swal.fire({
            title: 'Verifying...',
            text: 'Please wait while we secure your account.',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        // 3. Re-authentication
        const credential = EmailAuthProvider.credential(user.email, currPass);
        await reauthenticateWithCredential(user, credential);
        
        // 4. பாஸ்வர்ட் மாற்றம்
        if (newPass) {
            await updatePassword(user, newPass);
        }

        // 5. Database அப்டேட்
        await update(ref(db, 'users/' + user.uid), {
            twoFactorEnabled: is2FAEnabled
        });

        // வெற்றி மெசேஜ்
        await Swal.fire({
            icon: 'success',
            title: 'Security Updated! 🛡️',
            text: 'Your preferences have been saved.',
            timer: 2500,
            showConfirmButton: false
        });
        
        // ஃபார்ம் ரீசெட்
        document.getElementById('curr-password').value = "";
        document.getElementById('new-password').value = "";
        document.getElementById('confirm-password').value = "";

    } catch (error) {
        console.error("Security update error:", error);
        
        let errorMsg = "Verification failed. Check your password.";
        if (error.code === 'auth/wrong-password') {
            errorMsg = "The current password you entered is incorrect.";
        }

        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: errorMsg,
            confirmButtonColor: '#d33'
        });
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
};

window.deactivateAccount = async function() {
    const user = auth.currentUser;
    if (!user) {
        return Swal.fire({
            icon: 'error',
            title: 'Authentication Required',
            text: 'Please login first to deactivate your account.',
            confirmButtonColor: '#3085d6'
        });
    }

    // 1. கணக்கை நீக்கப்போவதை உறுதி செய்ய ஒரு வார்னிங் மெசேஜ்
    const confirmResult = await Swal.fire({
        title: 'Are you sure?',
        text: "This will permanently delete your account and all data from Globe Treck. This action cannot be undone! ⚠️",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, proceed to delete',
        cancelButtonText: 'No, keep my account'
    });

    if (!confirmResult.isConfirmed) return;

    // 2. பாஸ்வர்ட் வாங்க அழகான ஒரு பாப்-அப் இன்புட் பாக்ஸ்
    const { value: password } = await Swal.fire({
        title: 'Verify Identity',
        input: 'password',
        inputLabel: 'Enter your password to confirm account deactivation',
        inputPlaceholder: 'Your password',
        inputAttributes: {
            autocapitalize: 'off',
            autocorrect: 'off'
        },
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Confirm Deactivation'
    });

    if (!password) return;

    try {
        // லோடிங் மெசேஜ்
        Swal.fire({
            title: 'Deleting Account...',
            text: 'We are processing your request. Please wait.',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        // 3. Re-authenticate
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);

        // 4. Database-ல் இருந்து டேட்டாவை நீக்குதல்
        const userRef = ref(db, 'users/' + user.uid);
        await remove(userRef);

        // 5. Firebase Auth-ல் இருந்து நீக்குதல்
        await deleteUser(user);

        // 6. விடைபெறும் மெசேஜ்
        await Swal.fire({
            icon: 'success',
            title: 'Account Deleted',
            text: "Your account has been permanently removed. We're sorry to see you go! 👋",
            confirmButtonColor: '#3085d6'
        });

        window.location.href = "login.html"; 

    } catch (error) {
        console.error("Deactivation error:", error);
        
        let errorMsg = error.message;
        if (error.code === 'auth/wrong-password') {
            errorMsg = "Incorrect password. Deactivation cancelled.";
        }

        Swal.fire({
            icon: 'error',
            title: 'Deactivation Failed',
            text: errorMsg,
            confirmButtonColor: '#d33'
        });
    }
};




// Logout
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    auth.signOut().then(() => { window.location.href = 'login.html'; });
});

// Initial Load

onAuthStateChanged(auth, (user) => {
    if (user) {
        showDashboard(); // இது டேஷ்போர்டை முதலில் காட்டும்
    }
});

loadUserProfile();