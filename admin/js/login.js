// admin/js/login.js

document.addEventListener('DOMContentLoaded', () => {
    const pin1 = document.getElementById('pin1');
    const pin2 = document.getElementById('pin2');
    const pin3 = document.getElementById('pin3');
    const pin4 = document.getElementById('pin4');
    const loginBtn = document.getElementById('login-btn');
    const errorAlert = document.getElementById('error-alert');
    const errorMsg = document.getElementById('error-msg');
    const loadingOverlay = document.getElementById('loading-overlay');

    const CORRECT_PIN = '2026';

    // Auto-focus move logic between boxes
    const inputs = [pin1, pin2, pin3, pin4];
    
    inputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            const val = e.target.value;
            if (val && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !input.value && index > 0) {
                inputs[index - 1].focus();
            }
        });
    });

    const handleLogin = () => {
        const enteredPin = pin1.value + pin2.value + pin3.value + pin4.value;

        if (enteredPin === CORRECT_PIN) {
            errorAlert.classList.add('hidden');
            if(loadingOverlay) {
                loadingOverlay.classList.remove('hidden');
                loadingOverlay.classList.add('flex');
            }

            // Set secure session key
            sessionStorage.setItem('isAdminLoggedIn', 'true');

            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 500);
        } else {
            errorMsg.textContent = "Incorrect PIN. Try 2026";
            errorAlert.classList.remove('hidden');
            inputs.forEach(inp => inp.value = '');
            pin1.focus();
        }
    };

    loginBtn.addEventListener('click', handleLogin);
    
    // Press Enter to submit
    inputs[3].addEventListener('input', () => {
        if (pin1.value && pin2.value && pin3.value && pin4.value) {
            handleLogin();
        }
    });
});
