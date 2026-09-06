const API_BASE = "https://medicine-inventory-system-3923.onrender.com";

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', async(event) => {
        event.preventDefault();
        errorMessage.classList.add('hidden');
        errorMessage.textContent = '';

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        try {
            const response = await fetch(`${API_BASE}/login/sign-in`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password,
                }),
            });
            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('userToken', data.access_token || 'authenticated');
                localStorage.setItem('userEmail', email);

                window.location.href = 'dashboard.html';
            }else{
                errorMessage.textContent = data.detail || 'Invalid email or password';
                errorMessage.classList.remove('hidden');
            }
        } catch (error){
            console.error('Login error: ', error);
            errorMessage.textContent = 'Unable to connect to server. Please try again later';
            errorMessage.classList.remove('hidden');
        }
    });
});