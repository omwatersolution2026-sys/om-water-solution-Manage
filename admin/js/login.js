// admin/js/login.js

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. DOM Elements Selection ---
    const numpadBtns = document.querySelectorAll('.numpad-btn');
    const backspaceBtn = document.getElementById('backspace-btn');
    const pinDots = document.querySelectorAll('.pin-dot');
    const errorAlert = document.getElementById('error-alert');
    const errorMsg = document.getElementById('error-msg');
    const loadingOverlay = document.getElementById('loading-overlay');
    const dotContainer = pinDots[0].parentElement;

    // --- 2. State Management ---
    let currentPin = '';
    const CORRECT_PIN = '2026'; // Aapka Universal Admin PIN
    let isProcessing = false; // Multiple clicks ko block karne ke liye

    // --- 3. UI Update Logic (Dots Fill Effect) ---
    const updateDotsUI = () => {
        pinDots.forEach((dot, index) => {
            if (index < currentPin.length) {
                dot.classList.add('filled');
            } else {
                dot.classList.remove('filled');
            }
        });
    };

    // --- 4. Error Handling & Animation ---
    const triggerErrorState = () => {
        // Haptic feedback for mobile devices (Vibrates phone)
        if (navigator.vibrate) {
            navigator.vibrate([50, 50, 50]); // Short vibration pattern
        }

        // Show error message
        errorMsg.textContent = "Incorrect PIN. Please try again.";
        errorAlert.classList.remove('hidden');
        errorAlert.classList.add('fade-in-up');

        // Add shake animation to dots
        dotContainer.classList.add('animate-shake');

        // Reset state after animation completes
        setTimeout(() => {
            dotContainer.classList.remove('animate-shake');
            currentPin = '';
            updateDotsUI();
            isProcessing = false;
        }, 500);
    };

    // --- 5. PIN Verification Logic ---
    const verifyPin = () => {
        isProcessing = true; // Prevent further typing while verifying

        if (currentPin === CORRECT_PIN) {
            // Hide errors
            errorAlert.classList.add('hidden');
            
            // Show premium loading overlay
            loadingOverlay.classList.remove('hidden');
            loadingOverlay.classList.add('flex', 'fade-in-up');
            
            // Secure Session Entry
            sessionStorage.setItem('isAdminLoggedIn', 'true');
            sessionStorage.setItem('loginTime', new Date().toISOString());
            
            // Artificial delay for smooth UX transition (App feel)
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 800);
        } else {
            // Trigger error if PIN is wrong
            triggerErrorState();
        }
    };

    // --- 6. Input Handlers ---
    const handleInput = (value) => {
        if (isProcessing) return; // Block input if already verifying

        // Hide error message if user starts typing again
        if (!errorAlert.classList.contains('hidden')) {
            errorAlert.classList.add('hidden');
        }

        if (currentPin.length < 4) {
            currentPin += value;
            updateDotsUI();

            // Automatically verify when 4 digits are entered
            if (currentPin.length === 4) {
                // Short delay so user can see the 4th dot get filled before verification starts
                setTimeout(verifyPin, 150);
            }
        }
    };

    const handleBackspace = () => {
        if (isProcessing) return;

        if (currentPin.length > 0) {
            currentPin = currentPin.slice(0, -1);
            updateDotsUI();
            errorAlert.classList.add('hidden');
        }
    };

    // --- 7. Event Listeners (On-Screen Numpad) ---
    numpadBtns.forEach(btn => {
        // Touch/Click event
        btn.addEventListener('click', (e) => {
            // Remove focus to prevent ghost clicks
            e.preventDefault(); 
            const value = e.target.closest('.numpad-btn').dataset.val;
            handleInput(value);
        });
    });

    backspaceBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleBackspace();
    });

    // --- 8. Event Listeners (Physical Keyboard - for Laptop testing) ---
    document.addEventListener('keydown', (e) => {
        if (isProcessing) return;

        // Allow numbers 0-9
        if (e.key >= '0' && e.key <= '9') {
            handleInput(e.key);
        } 
        // Allow Backspace
        else if (e.key === 'Backspace') {
            handleBackspace();
        }
    });
});
