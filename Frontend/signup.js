const API_BASE = "https://medicine-inventory-system-3923.onrender.com";

document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signup-form');
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const errorMessage = document.getElementById('error-message');
  const successMessage = document.getElementById('success-message');

  if (signupForm) {
    signupForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      // Clear previous messages
      errorMessage.classList.add('hidden');
      successMessage.classList.add('hidden');

      const payload = {
        name: nameInput ? nameInput.value.trim() : '',
        email: emailInput.value.trim(),
        password: passwordInput.value,
      };

      try {
        const response = await fetch(`${API_BASE}/login/sign_up`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok) {
          successMessage.textContent = 'Account created successfully! Redirecting to login...';
          successMessage.classList.remove('hidden');

          // Redirect to login page after 2 seconds
          setTimeout(() => {
            window.location.href = 'login.html';
          }, 2000);
        } else {
          errorMessage.textContent = data.detail || 'Registration failed. Please try again.';
          errorMessage.classList.remove('hidden');
        }
      } catch (error) {
        console.error('Signup error:', error);
        errorMessage.textContent = 'Unable to connect to server. Please try again later.';
        errorMessage.classList.remove('hidden');
      }
    });
  }
});