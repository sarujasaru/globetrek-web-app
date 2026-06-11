🌍 GlobeTrek – Expedition Management Platform
📌 Overview
        Full‑stack web application for booking and managing travel expeditions
        Built with vanilla HTML/CSS/JS and Firebase (Auth + Realtime Database)
        Supports three roles: Admin, Staff, and Traveler

👑 Admin Features
        Dashboard with live analytics (monthly sales, total bookings, customer activity)
        User management – view all users, delete accounts, change roles
        Operations map (Leaflet) with live booking pipeline stats
        System settings – configure site name, timezone, support email, 2FA toggle, flush sandbox data
        Activity log – searchable audit trail of all bookings

👥 Staff Features
        Manage all bookings – view, confirm pending reservations, export to CSV
        Create, edit, and delete travel packages (simple form + detailed itinerary editor)
        Reply to customer queries (status changes from UNREAD to REPLIED)
        Real‑time statistics – active bookings, pending, revenue forecast
        Trending destinations & monthly booking charts (Chart.js)

🧳 Traveler Features
        Browse packages – filter by country, view details, book trips
        Booking – select travel date, number of travelers, payment method (demo)
        View booking history – past/upcoming trips with status (pending/confirmed)
        Submit support inquiries – view staff replies with timestamps
        Profile management – upload avatar, change password, update personal info, deactivate account

🛠️ Tech Stack
        Frontend – HTML5, Tailwind CSS, JavaScript (ES Modules)
        Backend – Firebase Realtime Database, Firebase Authentication
        Maps – Leaflet (OpenStreetMap)
        Charts – Chart.js
        Icons – Font Awesome, Heroicons (SVG)
        Notifications – SweetAlert2
        Deployment – Any static hosting (GitHub Pages, Netlify, Vercel, Firebase Hosting)

📁 Key Files
        home.html – Landing page
        login.html / register.html – Authentication pages
        admindashboard.html – Admin main view
        staffdashboard.html – Staff main view
        userdashboard.html – Traveler main view
        explore.html – Package detail page
        activities.html – Global activity log
        js/firebase.js – Firebase config & exports
        js/login.js / js/register.js – Auth logic
        js/admindashboard.js – Admin SPA + data loading
        js/staffdashboard.js – Staff SPA + booking/package logic
        js/userdashboard.js – User SPA + bookings/profile
        js/homepackages.js – Package card rendering
        js/explore.js – Single package view + booking trigger
        js/package-editor.js – Itinerary builder & submit
        js/staffbooking.js – Booking table & export
        css/styles.css – Custom overrides

🧪 Usage by Role
       Traveler – Register → Browse packages → Book trip → View bookings → Submit query → Manage profile
       Staff – Login → Confirm pending bookings → Reply to queries → Add/edit packages
       Admin – Login → View analytics → Manage users → Monitor operations → Configure system settings
