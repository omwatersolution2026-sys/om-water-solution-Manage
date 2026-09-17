// marketing/js/login.js

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
    const CORRECT_PIN = '2026'; // Universal PIN
    let isProcessing = false;

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
        if (navigator.vibrate) {
            navigator.vibrate([50, 50, 50]); // Haptic feedback
        }

        errorMsg.textContent = "Incorrect PIN. Please try again.";
        errorAlert.classList.remove('hidden');
        errorAlert.classList.add('fade-in-up');
        dotContainer.classList.add('animate-shake');

        setTimeout(() => {
            dotContainer.classList.remove('animate-shake');
            currentPin = '';
            updateDotsUI();
            isProcessing = false;
        }, 500);
    };

    // --- 5. PIN Verification Logic ---
    const verifyPin = () => {
        isProcessing = true;

        if (currentPin === CORRECT_PIN) {
            errorAlert.classList.add('hidden');
            
            loadingOverlay.classList.remove('hidden');
            loadingOverlay.classList.add('flex', 'fade-in-up');
            
            // ISOLATED SESSION FOR MARKETING PORTAL
            sessionStorage.setItem('isMarketingLoggedIn', 'true');
            sessionStorage.setItem('marketingLoginTime', new Date().toISOString());
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 800);
        } else {
            triggerErrorState();
        }
    };

    // --- 6. Input Handlers ---
    const handleInput = (value) => {
        if (isProcessing) return;

        if (!errorAlert.classList.contains('hidden')) {
            errorAlert.classList.add('hidden');
        }

        if (currentPin.length < 4) {
            currentPin += value;
            updateDotsUI();

            if (currentPin.length === 4) {
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

    // --- 7. Event Listeners ---
    numpadBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault(); 
            const value = e.target.closest('.numpad-btn').dataset.val;
            handleInput(value);
        });
    });

    backspaceBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleBackspace();
    });

    // Keyboard support for testing on laptop
    document.addEventListener('keydown', (e) => {
        if (isProcessing) return;
        if (e.key >= '0' && e.key <= '9') {
            handleInput(e.key);
        } else if (e.key === 'Backspace') {
            handleBackspace();
        }
    });
});
