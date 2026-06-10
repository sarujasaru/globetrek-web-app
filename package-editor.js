// package-editor.js
import { db } from './firebase.js';
import { ref, get, set, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// --- 1. Global Variables ---
window.dayCount = 0;

// --- 2. Verification Logic ---
window.findPackage = async function() {
    console.log("Verify button clicked!"); 
    const pName = document.getElementById('targetPlaceName').value.trim();
    const msg = document.getElementById('verifyMsg');

    if(!pName) return alert("Enter a name!");

    try {
        const q = query(ref(db, 'packages'), orderByChild('name'), equalTo(pName));
        const snap = await get(q);

        if(snap.exists()) {
            const id = Object.keys(snap.val())[0];
            document.getElementById('verifiedId').value = id;
            document.getElementById('detailsForm').classList.remove('hidden');
            
            msg.innerText = "✅ Place Verified!";
            msg.className = "mt-4 text-sm font-bold text-emerald-600";
            msg.classList.remove('hidden');
        } else {
            msg.innerText = "❌ No package found!";
            msg.className = "mt-4 text-sm font-bold text-rose-600";
            msg.classList.remove('hidden');
        }
    } catch (err) {
        console.error("Verification Error:", err);
    }
};

// --- 3. Dynamic Itinerary Fields ---
window.addDayField = function(defaultText = "") {
    const container = document.getElementById('itineraryContainer');
    if (!container) return;

    window.dayCount++;
    const dayDiv = document.createElement('div');
    dayDiv.className = "day-input bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 mb-4";
    dayDiv.innerHTML = `
        <h4 class="font-bold text-slate-700 mb-3 text-lg flex justify-between items-center">
            Day ${window.dayCount}
            <button type="button" onclick="this.parentElement.parentElement.remove()" class="text-xs text-rose-500 font-bold uppercase tracking-widest">Remove</button>
        </h4>
        <textarea class="w-full p-4 bg-white rounded-3xl border-none outline-none h-24 text-sm shadow-sm" 
                  placeholder="Describe activities for Day ${window.dayCount}">${defaultText}</textarea>
    `;
    container.appendChild(dayDiv);
};



// --- 4. Form Initiation & Submission Logic ---
window.initPackageForm = function() {
    const form = document.getElementById('detailsForm');
    if (!form) return;

    // Direct addEventListener-ukku pathilaga form.onsubmit payanpaduthugirom (SPA safety)
    form.onsubmit = async (e) => {
        e.preventDefault();
        
        const pkgId = document.getElementById('verifiedId').value;
        if (!pkgId) return alert("Please verify place first!");

        // Helper to split textareas into arrays
        const splitArr = (id) => {
            const el = document.getElementById(id);
            return el ? el.value.split('\n').filter(l => l.trim() !== "") : [];
        };

        // Collect Itinerary Data
        const dayNodes = document.querySelectorAll('.day-input textarea');
        let itineraryData = [];
        dayNodes.forEach((node, index) => {
            itineraryData.push({
                day: index + 1,
                desc: node.value.trim()
            });
        });

        const finalData = {
            mainId: pkgId,
            placeName: document.getElementById('targetPlaceName').value,
            hero: {
                title: document.getElementById('heroTitle').value,
                tagline: document.getElementById('heroTagline').value,
                img: document.getElementById('heroImg').value
            },
            cardInfo: {
                price: document.getElementById('pPrice').value,
                duration: document.getElementById('pDuration').value,
                rating: document.getElementById('pRating').value,
                maxPeople: document.getElementById('pMaxPeople').value
            },
            itinerary: itineraryData,
            gallery: splitArr('galleryUrls'),
            description: document.getElementById('pFullDesc').value,
            highlights: splitArr('pHighlights'),
            included: splitArr('pIncluded'),
            notIncluded: splitArr('pNotIncluded'),
            updatedAt: new Date().toISOString()
        };

        try {
            await set(ref(db, `package_details_data/${pkgId}`), finalData);
            alert("Awesome! The experience is now live. 🚀");
            // Dashboard-ukku thirumbi selluvarku
            if (window.showDashboard) {
                window.showDashboard();
            } else {
                window.location.reload();
            }
        } catch (err) {
            alert("Error saving: " + err.message);
        }
    };
};