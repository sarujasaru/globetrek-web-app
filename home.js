import { db } from './firebase.js'; 
import { ref, get, push} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";



let allLocations = []; 
let scrollInterval; 

// DOM Elements
const expeditionGrid = document.getElementById('expeditionGrid');
const testimonialGrid = document.getElementById('testimonialGrid');


const testimonials = [
    { name: "Sarah Jenkins", role: "Explorer", text: "The attention to detail on our Ireland trek was incredible.", avatar: "https://i.pravatar.cc/150?u=sarah" },
    { name: "Marcus Chen", role: "Photographer", text: "Kyoto was a dream. GlobeTrek found spots I never would have found alone.", avatar: "https://i.pravatar.cc/150?u=marcus" },
    { name: "Elena Rodriguez", role: "Backpacker", text: "Sustainable travel matters to me. They handled everything perfectly.", avatar: "https://i.pravatar.cc/150?u=elena" }
];


async function loadDataFromFirebase() {
    try {
        const expRef = ref(db, 'packages');
        const snapshot = await get(expRef);

        if (snapshot.exists()) {
            const data = snapshot.val();
            allLocations = Object.values(data); 
            renderExpeditions(allLocations, true); 
        } else {
            expeditionGrid.innerHTML = "<p class='text-center text-gray-400 w-full'>No expeditions available.</p>";
        }
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}


function renderExpeditions(data, shouldScroll = false) {
    if (!expeditionGrid) return;

    
    stopAutoScroll();

    expeditionGrid.innerHTML = data.map(item => `
        <div class="min-w-[350px] bg-white rounded-[2.5rem] overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-50 group flex flex-col">
            <div class="relative h-64 overflow-hidden">
                <img src="${item.img}" class="w-full h-full object-cover group-hover:scale-110 transition duration-700">
                <div class="absolute top-4 left-4 bg-blue-900 text-white px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase shadow-sm">
                    ${item.tag || 'Trending'}
                </div>
            </div>
            <div class="p-8 flex-1 flex flex-col">
                <span class="text-[10px] text-blue-900 font-bold uppercase tracking-widest mb-2 block">🕒 ${item.time}</span>
                <h3 class="text-2xl font-bold text-gray-900 mb-2">${item.name}</h3>
                <p class="text-gray-500 text-sm mb-4 line-clamp-1 italic">${item.description}</p>
                <div class="mt-auto">
                    <button class="w-full border border-blue-900/10 py-3.5 rounded-2xl text-xs font-bold text-blue-900 hover:bg-blue-900 hover:text-white transition-all duration-300">
                        Explore Details →
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    
    if (shouldScroll && data.length > 0) {
        startAutoScroll();
    }
}


function startAutoScroll() {
    stopAutoScroll(); 
    scrollInterval = setInterval(() => {
        if (expeditionGrid) {
            expeditionGrid.scrollLeft += 1;
            if (expeditionGrid.scrollLeft >= (expeditionGrid.scrollWidth - expeditionGrid.clientWidth)) {
                expeditionGrid.scrollLeft = 0;
            }
        }
    }, 30);
}

function stopAutoScroll() {
    if (scrollInterval) {
        clearInterval(scrollInterval);
    }
}


window.searchPackages = function() {
    const query = document.getElementById('packageSearch').value.toLowerCase().trim();
    
    if (query === "") {
        renderExpeditions(allLocations, true); 
        return;
    }

    const searchedData = allLocations.filter(item => 
        (item.name && item.name.toLowerCase().includes(query)) || 
        (item.country && item.country.toLowerCase().includes(query)) ||
        (item.places && item.places.toLowerCase().includes(query))
    );

   
    renderExpeditions(searchedData, false);

    if (searchedData.length === 0) {
        expeditionGrid.innerHTML = `
            <div class="w-full text-center py-10 min-w-[300px]">
                <p class="text-gray-400">No packages found for "${query}"</p>
            </div>`;
    }
};



function renderTestimonials() {
    if (!testimonialGrid) return;
    testimonialGrid.innerHTML = testimonials.map(t => `
        <div class="bg-white p-8 rounded-3xl shadow-sm border border-gray-50 text-left relative">
            <span class="text-gray-100 text-6xl absolute top-4 right-8 font-serif">“</span>
            <div class="text-orange-400 mb-4 text-xs">★★★★★</div>
            <p class="text-gray-500 italic mb-8 relative z-10">"${t.text}"</p>
            <div class="flex items-center gap-4">
                <img src="${t.avatar}" class="w-10 h-10 rounded-full border border-gray-200">
                <div>
                    <h4 class="text-sm font-bold">${t.name}</h4>
                    <span class="text-[10px] text-gray-400 uppercase">${t.role}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Page Load
document.addEventListener('DOMContentLoaded', () => {
    loadDataFromFirebase();
    renderTestimonials();
});


const contactForm = document.querySelector('form');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 

        
        const name = contactForm.querySelector('input[placeholder="John Doe"]').value;
        const email = contactForm.querySelector('input[placeholder="john@example.com"]').value;
        const subject = contactForm.querySelector('select').value;
        const message = contactForm.querySelector('textarea').value;

        
        const newQuery = {
            name: name,
            email: email,
            subject: subject,
            message: message,
            timestamp: new Date().toLocaleString(), 
            status: "New" 
        };

       try {
   
    const queriesRef = ref(db, 'queries');
    await push(queriesRef, newQuery);

  
    await Swal.fire({
        title: 'Message Sent!',
        text: 'Staff will check your query and get back to you soon. 📩',
        icon: 'success',
        confirmButtonColor: '#28a745', 
        confirmButtonText: 'Great!',
        borderRadius: '15px'
    });

    contactForm.reset(); 

} catch (error) {
    console.error("Firebase Error Details:", error);
    

    Swal.fire({
        title: 'Oops...',
        text: 'Something went wrong while sending your message.',
        icon: 'error',
        footer: `<span style="color: #d33">Error: ${error.message}</span>`,
        confirmButtonColor: '#d33'
    });
}
    });
}

