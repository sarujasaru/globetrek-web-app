import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// 1. Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCGUollPBdzMcO9C6RCRapVgSk0XKZi7W4",
    authDomain: "globe-trek-22297.firebaseapp.com",
    databaseURL: "https://globe-trek-22297-default-rtdb.firebaseio.com",
    projectId: "globe-trek-22297",
    storageBucket: "globe-trek-22297.firebasestorage.app",
    messagingSenderId: "1071677396250",
    appId: "1:1071677396250:web:a24c340a20f7568da948a3",
    measurementId: "G-JTLL2XS9QN"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let allLocations = [];

// 2. Navigation Function (Using window to make it accessible for onclick)
window.goToExplore = function(id) {
    if (id) {
        // ID இருந்தால் நேரடியாக அந்தப் பக்கத்திற்குச் செல்லும்
        window.location.href = `explore.html?id=${id}`;
    } else {
        // 1. ID கிடைக்காதபோது வரும் அழகான மெசேஜ்
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Expedition ID not found! 🗺️',
            footer: 'Please try selecting the package again.',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'Got it',
            borderRadius: '15px'
        });
    }
};

// 3. Listen for Data from Firebase
const packagesRef = ref(db, 'packages');
onValue(packagesRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        // Convert object to array and include the Firebase Key as 'id'
        allLocations = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
        }));
        displayFirebasePackages('all');
    } else {
        const grid = document.getElementById('allPackagesGrid');
        if(grid) grid.innerHTML = "<p class='col-span-full text-center text-gray-500 py-20'>No expeditions found in the database.</p>";
    }
});



// 4. Function to Display Cards
window.displayFirebasePackages = function(filterCountry) {
    const grid = document.getElementById('allPackagesGrid');
    if (!grid) return;

    // Filter Buttons UI Update
    const buttons = document.querySelectorAll('.coun-btn');
    buttons.forEach(btn => {
        const btnText = btn.textContent.trim().toLowerCase();
        const filterText = filterCountry.trim().toLowerCase();
        if (btnText === filterText) {
            btn.className = "coun-btn p-3 px-6 rounded-xl transition-all text-sm bg-blue-900 text-white font-bold border border-blue-900";
        } else {
            btn.className = "coun-btn p-3 px-6 rounded-xl transition-all text-sm bg-white text-gray-600 border border-gray-100";
        }
    });

    grid.innerHTML = "";
    
    // Filter logic
    const filteredData = filterCountry === 'all' 
    ? allLocations 
    : allLocations.filter(item => {
        const countryValue = (item.country || item.location || '').trim().toLowerCase();
        return countryValue === filterCountry.trim().toLowerCase();
    });

    if (filteredData.length === 0) {
        grid.innerHTML = "<p class='col-span-full text-center text-gray-400 py-10'>No expeditions found for this region.</p>";
        return;
    }

    // Render Cards
    filteredData.forEach(place => {
        grid.innerHTML += `
            <div class="package-card group bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 flex flex-col">
                <div class="h-64 relative overflow-hidden">
                    <img src="${place.img || 'https://via.placeholder.com/400x300?text=No+Image'}" 
                         class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
                    <div class="absolute top-4 left-4 bg-orange-600 text-white px-4 py-1.5 rounded-full shadow-sm">
                        <p class="text-[10px] font-black tracking-widest uppercase">${place.tag || 'Adventure'}</p>
                    </div>
                </div>
                <div class="p-8 flex-1 flex flex-col">
                    <h3 class="text-2xl font-bold text-gray-900">${place.name}</h3>
                    <p class="text-xs font-bold text-orange-600 uppercase tracking-tighter mb-4">${place.description || ''}</p>
                    
                    <div class="space-y-3 mb-8">
                        <div class="flex items-center gap-3 text-sm text-gray-500 font-medium">
                            <span class="text-lg">📍</span> ${place.places || 'Explore Sites'}
                        </div>
                        <div class="flex items-center gap-3 text-sm text-gray-500 font-medium">
                            <span class="text-lg">📅</span> ${place.time || 'Flexible Dates'}
                        </div>
                    </div>

                    <div class="mt-auto pt-6 border-t border-gray-50">
                        <div class="mt-auto pt-6 border-t border-gray-100 flex justify-between items-center">
    <span class="text-xs font-bold text-gray-400">Expedition</span>
    
    <button onclick="goToExplore('${place.id}')" 
            class="bg-white p-3 rounded-2xl shadow-sm hover:shadow-md transition-all group/btn border border-gray-50">
        <svg class="w-5 h-5 text-blue-900 group-hover/btn:text-orange-600 transition-colors" 
             fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
        </svg>
    </button>
</div>
                    </div>
                </div>
            </div>
        `;
    });
};

// 5. Search Functionality
const searchInput = document.getElementById('packageSearch');
if(searchInput) {
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = allLocations.filter(item => 
            (item.name && item.name.toLowerCase().includes(query)) || 
            (item.country && item.country.toLowerCase().includes(query))
        );
        
        const grid = document.getElementById('allPackagesGrid');
        grid.innerHTML = "";
        
        if(filtered.length === 0) {
            grid.innerHTML = "<p class='col-span-full text-center py-20 text-gray-400'>No expeditions match your search.</p>";
        } else {
            // (பழைய கார்டு டிசைனை விட இது எளிதானது, reuse logic is better)
            // இங்கு filterCountry-க்கு 'all' கொடுத்து, ஆனால் தரவை மட்டும் மாற்றுகிறோம்.
            renderFilteredOnly(filtered);
        }
    });
}

function renderFilteredOnly(data) {
    const grid = document.getElementById('allPackagesGrid');
    data.forEach(place => {
        grid.innerHTML += `
            <div class="package-card group bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 flex flex-col">
                <div class="h-64 relative overflow-hidden">
                    <img src="${place.img}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
                </div>
                <div class="p-8">
                    <h3 class="text-2xl font-bold text-gray-900">${place.name}</h3>
                    <p class="text-sm text-gray-500 mb-6">${place.description}</p>
                    <button onclick="goToExplore('${place.id}')" class="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold">Explore Experience</button>
                </div>
            </div>`;
    });
}