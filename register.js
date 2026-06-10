import { auth, db } from './firebase.js';
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const registerForm = document.getElementById('registerForm');


registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value; // Confirm Password ஐப் பெறுதல்
    const phone = document.getElementById('phone').value;

    // 1. பாஸ்வர்ட் மேட்ச் ஆகிறதா என்று சரிபார்த்தல்
    if (password !== confirmPassword) {
        return Swal.fire({
            icon: 'error',
            title: 'Password Mismatch',
            text: 'Passwords do not match! Please check and try again.',
            confirmButtonColor: '#d33'
        });
    }

    // 2. பாஸ்வர்ட் நீளம் 6 எழுத்துக்களுக்கு மேல் இருக்க வேண்டும் (Firebase Rule)
    if (password.length < 6) {
        return Swal.fire({
            icon: 'warning',
            title: 'Weak Password',
            text: 'Password should be at least 6 characters long.',
            confirmButtonColor: '#f8bb86'
        });
    }

    let userRole = 'traveler'; 
    if (email === 'GlobeTrek@admin.com') userRole = 'admin';
    else if (email === 'GlobeTrek@staff.com') userRole = 'staff';

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        await set(ref(db, 'users/' + userCredential.user.uid), {
            fullName: fullName,
            email: email,
            role: userRole, 
            phone: phone
        });

        Swal.fire({
            icon: 'success',
            title: 'Registration Successful!',
            text: 'Welcome to GlobeTrek Adventures! 🌍',
            timer: 3000,
            timerProgressBar: true,
            showConfirmButton: false,
            willClose: () => {
                window.location.href = "login.html"; 
            }
        });

    } catch (error) {
        console.error("Registration Error:", error.message);
        Swal.fire({
            icon: 'error',
            title: 'Registration Failed',
            text: error.message,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Try Again'
        });
    }
});