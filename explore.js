import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCGUollPBdzMcO9C6RCRapVgSk0XKZi7W4",
    authDomain: "globe-trek-22297.firebaseapp.com",
    databaseURL: "https://globe-trek-22297-default-rtdb.firebaseio.com",
    projectId: "globe-trek-22297",
    storageBucket: "globe-trek-22297.firebasestorage.app",
    messagingSenderId: "1071677396250",
    appId: "1:1071677396250:web:a24c340a20f7568da948a3"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

const urlParams = new URLSearchParams(window.location.search);
const pkgId = urlParams.get('id');

// Global user state
let currentUser = null;

// லாகின் நிலையை கண்காணிக்க
onAuthStateChanged(auth, (user) => {
    currentUser = user;
});

// --- Booking Logic ---
// Book Button-க்கான திருத்தப்பட்ட ஃபங்க்ஷன்
window.handleBooking = function() {
    if (!currentUser) {
        // 1. அழகான Alert காட்டிவிட்டு, பயனர் "OK" அழுத்திய பின் மட்டும் Redirect செய்தல்
        Swal.fire({
            title: 'Login Required!',
            text: "Please register or login to continue with your booking! ✈️",
            icon: 'info',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Go to Register',
            allowOutsideClick: false // பயனர் தெரியாமல் வெளியே கிளிக் செய்தாலும் மெசேஜ் மறையாது
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = "register.html";
            }
        });
    } else {
        console.log("User is logged in. Proceeding to dashboard payment...");
        
        // 2. லாகின் செய்திருந்தால் ஒரு சின்ன 'Processing' மெசேஜ் காட்டிவிட்டு அனுப்பலாம்
        Swal.fire({
            title: 'Processing...',
            text: 'Redirecting to payment dashboard',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
            willClose: () => {
                window.location.href = `userdashboard.html?page=payment&id=${pkgId}`;
            }
        });
    }
};

function renderPageData(data) {
    console.log("Rendering combined data:", data);

    // 1. Hero Section
    const heroData = data.hero || {};
    const mainImg = heroData.img || data.img || "";
    document.getElementById('heroBg').style.backgroundImage = `url('${mainImg}')`;
    document.getElementById('displayTitle').innerText = heroData.title || data.name || "Explore Expedition";
    document.getElementById('displayTagline').innerText = heroData.tagline || "";

    // 2. Card Side Info
    const card = data.cardInfo || {};
    document.getElementById('cardPlaceName').innerText = data.placeName || data.name || "";
    document.getElementById('displayPrice').innerText = card.price || data.price || "TBA";
    document.getElementById('displayDuration').innerText = card.duration || data.time || "Flexible";
    document.getElementById('displayRating').innerText = card.rating || "4.9";
    document.getElementById('displayMaxPeople').innerText = card.maxPeople || "12";

    // 3. Description & Highlights
    document.getElementById('displayDesc').innerText = data.description || "";
    
    const highlightsContainer = document.getElementById('displayHighlights');
    if (data.highlights && Array.isArray(data.highlights)) {
        highlightsContainer.innerHTML = data.highlights.map(h => 
            `<div class="flex items-center gap-2">✦ ${h.trim()}</div>`).join('');
    }

    // 4. Gallery
    const galleryContainer = document.getElementById('displayGallery');
    const photos = data.gallery || [];
    if (photos.length >= 3) {
        galleryContainer.innerHTML = `
            <div class="col-span-1 h-full"><img src="${photos[0]}" class="w-full h-full object-cover rounded-[2rem]"></div>
            <div class="col-span-1 grid grid-rows-2 gap-4 h-full">
                <img src="${photos[1]}" class="w-full h-full object-cover rounded-[2rem]">
                <img src="${photos[2]}" class="w-full h-full object-cover rounded-[2rem]">
            </div>`;
    } else {
        galleryContainer.innerHTML = `<img src="${mainImg}" class="col-span-2 w-full h-[400px] object-cover rounded-[2rem]">`;
    }

    // 5. Itinerary Fix (Bullet points without dot for Day Heading)
    const itinContainer = document.getElementById('displayItinerary');
    if (itinContainer && data.itinerary) {
        const itineraryArray = Array.isArray(data.itinerary) ? data.itinerary : Object.values(data.itinerary);
        
        itinContainer.innerHTML = itineraryArray.map((item) => {
            const rawDesc = item.desc || "";
            const bulletPoints = rawDesc.split(',').map(point => {
                if(point.trim() !== "") {
                    return `
                        <li class="flex items-center gap-3 text-slate-500 py-1">
                            <div class="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0"></div>
                            <span class="text-sm md:text-base">${point.trim()}</span>
                        </li>`;
                }
                return "";
            }).join('');

            return `
                <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div class="mb-4">
                        <h4 class="font-bold text-2xl text-slate-800">Day ${item.day}</h4>
                    </div>
                    <ul class="space-y-1">
                        ${bulletPoints}
                    </ul>
                </div>
            `;
        }).join('');
    }

    // 6. Included & Not Included
    const includedContainer = document.getElementById('displayIncluded');
    if (includedContainer) {
        let combinedListHTML = "";

        if (data.included && Array.isArray(data.included)) {
            combinedListHTML += data.included.map(i => `<li class="flex items-center gap-2">✓ ${i.trim()}</li>`).join('');
        }

        if (data.notIncluded && Array.isArray(data.notIncluded)) {
            combinedListHTML += `<hr class="my-4 border-slate-100">`;
            combinedListHTML += `<h4 class="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-2">Not Included</h4>`;
            combinedListHTML += data.notIncluded.map(i => `<li class="flex items-center gap-2 text-rose-400">✕ ${i.trim()}</li>`).join('');
        }
        includedContainer.innerHTML = combinedListHTML;
    }
}

async function loadExperience() {
    if (!pkgId) return;
    try {
        const packagesRef = ref(db, 'packages');
        const snap = await get(packagesRef);
        
        if (snap.exists()) {
            const allPackages = snap.val();
            let firebaseKey = null;
            let baseData = {};

            // 1. முதலில் pkgId என்பது ஒரு Firebase Key-ஆ என சோதிக்கிறது (-Nxyz...)
            if (allPackages[pkgId]) {
                firebaseKey = pkgId;
                baseData = allPackages[pkgId];
            } 
            // 2. இல்லையெனில், உள்ளே இருக்கும் 'id' (1, 2, 3...) உடன் ஒப்பிடுகிறது
            else {
                Object.keys(allPackages).forEach(key => {
                    if (allPackages[key].id == pkgId) {
                        firebaseKey = key;
                        baseData = allPackages[key];
                    }
                });
            }

            if (firebaseKey) {
                // மேலதிக விவரங்களை (Details) எடுக்கிறது
                const detailsRef = ref(db, `package_details_data/${firebaseKey}`);
                const detailSnap = await get(detailsRef);
                
                const combinedData = detailSnap.exists() ? { ...baseData, ...detailSnap.val() } : baseData;
                renderPageData(combinedData);
            } else {
                console.error("Package Not Found for ID:", pkgId);
            }
        }
    } catch (err) {
        console.error("Fetch Error:", err);
    }
    // explore.js -ல் சேர்க்க வேண்டிய பகுதி
const urlParams = new URLSearchParams(window.location.search);
const source = urlParams.get('from');

// 'Book' பட்டன் இருக்கும் HTML Element-ன் ID 'bookBtn' என்று வைத்துக்கொள்வோம்
const bookBtn = document.getElementById('bookBtn'); 

if (source === 'user') {
    if (bookBtn) {
        bookBtn.style.display = 'none'; // யூசர் டேஷ்போர்டில் இருந்து வந்தால் பட்டன் மறையும்
    }
} else {
    if (bookBtn) {
        bookBtn.style.display = 'block'; // ஹோம் பேஜில் இருந்து வந்தால் பட்டன் தெரியும்
    }
}
}
loadExperience();