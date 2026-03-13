// ============================================
// auth.js — Handles Login and Register
// ============================================

function showAlert(alertId, message, type) {
    const alert = document.getElementById(alertId);
    alert.className = `alert alert-${type} show`;
    alert.innerHTML = `<span>${type === 'danger' ? '❌' : '✅'}</span> ${message}`;
}

function setLoading(loading) {
    const btn = document.getElementById('loginBtn') || document.getElementById('registerBtn');
    const btnText = document.getElementById('btnText');
    const btnSpinner = document.getElementById('btnSpinner');
    if (btn) btn.disabled = loading;
    if (btnText) btnText.style.display = loading ? 'none' : 'inline';
    if (btnSpinner) btnSpinner.style.display = loading ? 'inline-block' : 'none';
}

// ---- LOGIN ----
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        setLoading(true);

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (data.success) {
                showAlert('alert', 'Login successful! Redirecting...', 'success');
                setTimeout(() => {
                    if (data.user.role === 'admin') {
                        window.location.href = 'admin-dashboard.html';
                    } else {
                        window.location.href = 'user-dashboard.html';
                    }
                }, 800);
            } else {
                showAlert('alert', data.message, 'danger');
                setLoading(false);
            }
        } catch (err) {
            showAlert('alert', 'Connection error. Check if server is running.', 'danger');
            setLoading(false);
        }
    });
}

// ---- REGISTER ----
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password.length < 6) {
            return showAlert('alert', 'Password must be at least 6 characters.', 'danger');
        }

        if (password !== confirmPassword) {
            return showAlert('alert', 'Passwords do not match.', 'danger');
        }

        setLoading(true);

        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name, email, password, confirmPassword })
            });
            const data = await res.json();

            if (data.success) {
                showAlert('alert', data.message + ' Redirecting to login...', 'success');
                setTimeout(() => window.location.href = 'index.html', 1500);
            } else {
                showAlert('alert', data.message, 'danger');
                setLoading(false);
            }
        } catch (err) {
            showAlert('alert', 'Connection error. Check if server is running.', 'danger');
            setLoading(false);
        }
    });
}

// ---- LOGOUT (global) ----
async function logout() {
    try {
        await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {}
    window.location.href = 'index.html';
}
