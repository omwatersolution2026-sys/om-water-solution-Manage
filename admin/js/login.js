document.addEventListener('DOMContentLoaded', () => {
    // Agar pehle se login hai, toh direct dashboard par bhej do
    if (sessionStorage.getItem('adminAuth') === 'true') {
        window.location.replace('dashboard.html');
    }

    const loginForm = document.getElementById('login-form'); // Apna form ID check kar lena
    const pinInput = document.getElementById('pin-input');   // Apna input ID check kar lena

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const enteredPin = pinInput.value;

            if (enteredPin === '2026') {
                // YE HAI MAIN FIX: Session set karna zaroori hai
                sessionStorage.setItem('adminAuth', 'true');
                
                // Uske baad dashboard par redirect karo
                window.location.replace('dashboard.html');
            } else {
                alert('Galat PIN! Kripya sahi 4-digit code (2026) dalein.');
                pinInput.value = ''; // Input clear kar do
            }
        });
    }
});
