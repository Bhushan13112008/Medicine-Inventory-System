const API_BASE = "https://medicine-inventory-system-3923.onrender.com";

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('forgot-password-form');
  const emailInput = document.getElementById('email');
  const otpInput = document.getElementById('otp');
  const newPasswordInput = document.getElementById('new-password');
  const sendOtpBtn = document.getElementById('send-otp-btn');
  const messageEl = document.getElementById('message');

  // --- Step 1: Send OTP (/login/request-otp) ---
  if (sendOtpBtn) {
    sendOtpBtn.addEventListener('click', async () => {
      const email = emailInput.value.trim();

      if (!email) {
        showMessage('Please enter your email address first.', false);
        return;
      }

      sendOtpBtn.disabled = true;
      sendOtpBtn.textContent = 'Sending...';

      try {
        const response = await fetch(`${API_BASE}/login/request-otp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email: email })
        });

        const data = await response.json();

        if (response.ok) {
          showMessage(data.message || 'OTP sent successfully to your email!', true);
          sendOtpBtn.textContent = 'Resend OTP';
        } else {
          showMessage(getErrorMessage(data), false);
          sendOtpBtn.textContent = 'Send OTP';
        }
      } catch (error) {
        console.error('Send OTP error:', error);
        showMessage('Error connecting to backend server.', false);
        sendOtpBtn.textContent = 'Send OTP';
      } finally {
        sendOtpBtn.disabled = false;
      }
    });
  }

  // --- Step 2: Submit OTP & Reset Password (/login/forgot_password) ---
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = emailInput.value.trim();
      const otp = otpInput.value.trim();
      const newPassword = newPasswordInput.value.trim();

      if (!email || !otp || !newPassword) {
        showMessage('Please fill in Email, OTP, and New Password.', false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/login/forgot_password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: email,
            otp: otp,
            new_password: newPassword
          })
        });

        const data = await response.json();

        if (response.ok) {
          showMessage(data.message || 'Your account password changed successfully!', true);
          setTimeout(() => {
            window.location.href = 'login.html';
          }, 2000);
        } else {
          showMessage(getErrorMessage(data), false);
        }
      } catch (error) {
        console.error('Password reset error:', error);
        showMessage('Error connecting to backend server.', false);
      }
    });
  }

  function showMessage(text, isSuccess) {
    if (!messageEl) return;
    messageEl.style.color = isSuccess ? '#4ade80' : '#f87171';
    messageEl.textContent = text;
  }

  function getErrorMessage(data) {
    if (Array.isArray(data.detail)) {
      return data.detail.map(err => `${err.loc.slice(-1)[0]}: ${err.msg}`).join(', ');
    }
    return data.detail || 'Request failed.';
  }
});