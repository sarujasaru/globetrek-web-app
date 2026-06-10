import { auth } from './firebase.js';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
// Realtime Database-க்காக இம்போர்ட் செய்யவும்
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const loginForm = document.getElementById('loginForm');
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');
const db = getDatabase(); // Database instance

// Password Toggle Logic (SVG swapping)
togglePassword.addEventListener('click', () => {
    const isPassword = passwordInput.getAttribute('type') === 'password';
    passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
    // SVG மாற்றம்... (நீங்கள் ஏற்கனவே எழுதியது அப்படியே இருக்கட்டும்)
});


loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
       
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

       
        const userRef = ref(db, 'users/' + user.uid);
        const snapshot = await get(userRef);

       if (snapshot.exists()) {
    const userData = snapshot.val();
    const role = userData.role;

   
    Swal.fire({
        icon: 'success',
        title: 'Login Successful!',
        text: 'Redirecting to your dashboard... 🚀',
        timer: 2000, 
        showConfirmButton: false,
        timerProgressBar: true, 
        willClose: () => {
           
            if (role === 'admin') {
                window.location.href = "admindashboard.html";
            } else if (role === 'staff') {
                window.location.href = "staffdashboard.html";
            } else {
                window.location.href = "userdashboard.html";
            }
        }
    });

} else {
    
    Swal.fire({
        icon: 'error',
        title: 'Access Denied',
        text: 'User role not found in database. Please contact Admin.',
        confirmButtonColor: '#d33'
    });
}

    } catch (error) {
    console.error("Login Error:", error.code);

    // 1. பிழைக் குறியீடுகளுக்கு ஏற்ப மெசேஜ்களை மாற்றுதல்
    let errorMessage = "An error occurred. Please try again.";
    let errorTitle = "Login Failed";

    if (error.code === 'auth/user-not-found') {
        errorMessage = "We couldn't find an account with this email.";
    } else if (error.code === 'auth/wrong-password') {
        errorMessage = "The password you entered is incorrect.";
    } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
    } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many failed attempts. Please try again later.";
        errorTitle = "Account Locked Temporarily";
    }

    // 2. SweetAlert2 பாப்-அப்
    Swal.fire({
        icon: 'error',
        title: errorTitle,
        text: errorMessage,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Try Again',
        borderRadius: '15px'
    });
}
});

const forgotPasswordLink = document.getElementById('forgotPassword');

forgotPasswordLink.addEventListener('click', async (e) => {
    e.preventDefault();
    
    // 1. பயனரிடம் மின்னஞ்சல் முகவரியைக் கேட்கும் பாப்-அப்
    const { value: email } = await Swal.fire({
        title: 'Reset Password',
        input: 'email',
        inputLabel: 'Enter your registered email address',
        inputPlaceholder: 'explorer@example.com',
        showCancelButton: true,
        confirmButtonColor: '#1e3a8a', // Blue 900
        confirmButtonText: 'Send Reset Link'
    });

    if (email) {
        try {
            // 2. Firebase மூலம் Reset Email அனுப்புதல்
            await sendPasswordResetEmail(auth, email);
            
            Swal.fire({
                icon: 'success',
                title: 'Email Sent!',
                text: 'Please check your inbox (and spam folder) for the password reset link. 📧',
                confirmButtonColor: '#1e3a8a'
            });
        } catch (error) {
            console.error("Reset Error:", error.code);
            
            let errorMessage = "Could not send reset email. Please try again.";
            if (error.code === 'auth/user-not-found') {
                errorMessage = "No account found with this email address.";
            }

            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorMessage,
                confirmButtonColor: '#d33'
            });
        }
    }
});
