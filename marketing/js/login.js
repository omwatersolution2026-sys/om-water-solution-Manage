// marketing/js/login.js

document.addEventListener('DOMContentLoaded', () => {
    // Agar pehle se logged in hai, toh sidha dashboard bhejo
    if (sessionStorage.getItem('marketingAuth') === 'true') {
        window.location.replace('dashboard.html');
        return;
    }

    const numpadBtns = document.querySelectorAll('.numpad-btn');
    const backspaceBtn = document.getElementById('backspace-btn');
    const pinDots = document.querySelectorAll('.pin-dot');
    const errorAlert = document.getElementById('error-alert');
    const errorMsg = document.getElementById('error-msg');
    const loadingOverlay = document.getElementById('loading-overlay');
    const dotContainer = pinDots[0].parentElement;

    let currentPin = '';
    const CORRECT_PIN = '2026';
    let isProcessing = false;

    const updateDotsUI = () => {
        pinDots.forEach((dot, index) => {
            if (index < currentPin.length) {
                dot.classList.add('filled');
            } else {
                dot.classList.remove('filled');
            }
        });
    };

    const triggerErrorState = () => {
        if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
        if(errorMsg) errorMsg.textContent = "Incorrect PIN. Try again.";
        if(errorAlert) errorAlert.classList.remove('hidden');
        dotContainer.classList.add('animate-shake');

        setTimeout(() => {
            dotContainer.classList.remove('animate-shake');
            currentPin = '';
            updateDotsUI();
            isProcessing = false;
        }, 500);
    };

    const verifyPin = () => {
        isProcessing = true;
        if (currentPin === CORRECT_PIN) {
            if(errorAlert) errorAlert.classList.add('hidden');
            if(loadingOverlay) {
                loadingOverlay.classList.remove('hidden');
                loadingOverlay.classList.add('flex');
            }
            
            // Set session key correctly
            sessionStorage.setItem('marketingAuth', 'true');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 600);
        } else {
            triggerErrorState();
        }
    };

    const handleInput = (value) => {
        if (isProcessing) return;
        if (errorAlert && !errorAlert.classList.contains('hidden')) errorAlert.classList.add('hidden');
        
        if (currentPin.length < 4) {
            currentPin += value;
            updateDotsUI();
            if (currentPin.length === 4) {
                setTimeout(verifyPin, 100);
            }
        }
    };

    const handleBackspace = () => {
        if (isProcessing) return;
        if (currentPin.length > 0) {
            currentPin = currentPin.slice(0, -1);
            updateDotsUI();
            if(errorAlert) errorAlert.classList.add('hidden');
        }
    };

    numpadBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault(); 
            handleInput(e.target.dataset.val);
        });
    });

    if(backspaceBtn) {
        backspaceBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleBackspace();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (isProcessing) return;
        if (e.key >= '0' && e.key <= '9') handleInput(e.key);
        else if (e.key === 'Backspace') handleBackspace();
    });
});
