let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    loadProfileData();

    document.getElementById('profileForm').addEventListener('submit', handleProfileUpdate);
    document.getElementById('passwordForm').addEventListener('submit', handlePasswordUpdate);

    // Password strength meter for the Change Password section
    if (typeof initPasswordStrength === 'function') {
        initPasswordStrength('newPassword', 'profile-pwd-strength', 'profile-pwd-sym-popup');
    }
});

async function checkAuth() {
    try {
        console.log('[Auth] Checking session...');
        const res = await fetch('/api/me');
        const data = await res.json();
        console.log('[Auth] Session data:', data);
        if (data.success) {
            currentUser = data.user;
            updateSidebarNav(data.user);
            
            // Fill sidebar safely
            const nameEl = document.getElementById('sidebarName');
            const avatarEl = document.getElementById('sidebarAvatar');
            const roleEl = document.getElementById('sidebarRole');
            const subtitleEl = document.getElementById('roleSubtitle');

            if (nameEl) nameEl.textContent = data.user.name;
            if (avatarEl) avatarEl.textContent = data.user.name.charAt(0).toUpperCase();
            if (roleEl) {
                roleEl.innerHTML = data.user.role === 'admin' 
                    ? '<span class="badge-role badge-admin">Admin</span>' 
                    : '<span class="badge-role badge-user">User</span>';
            }
            if (subtitleEl) subtitleEl.textContent = data.user.role === 'admin' ? 'Admin Panel' : 'User Panel';

            // Fill profile data once we have user
            loadProfileData();
        } else {
            console.warn('[Auth] Not authenticated, redirecting to index.html');
            window.location.href = 'index.html';
        }
    } catch (e) {
        console.error('[Auth] Error:', e);
        window.location.href = 'index.html';
    }
}

function updateSidebarNav(user) {
    const nav = document.getElementById('sidebarNav');
    if (user.role === 'admin') {
        nav.innerHTML = `
            <div class="nav-section-label">Overview</div>
            <a href="admin-dashboard.html" class="nav-item"><span class="nav-icon">🏠</span> Dashboard</a>
            <div class="nav-section-label">Management</div>
            <a href="users.html" class="nav-item"><span class="nav-icon">👥</span> User Management</a>
            <a href="tasks.html" class="nav-item"><span class="nav-icon">✅</span> Task Management</a>
            <div class="nav-section-label">Settings</div>
            <a href="profile.html" class="nav-item active"><span class="nav-icon">👤</span> My Profile</a>
        `;
    } else {
        nav.innerHTML = `
            <div class="nav-section-label">Overview</div>
            <a href="user-dashboard.html" class="nav-item"><span class="nav-icon">🏠</span> Dashboard</a>
            <div class="nav-section-label">Work</div>
            <a href="tasks.html" class="nav-item"><span class="nav-icon">✅</span> My Tasks</a>
            <div class="nav-section-label">Settings</div>
            <a href="profile.html" class="nav-item active"><span class="nav-icon">👤</span> My Profile</a>
        `;
    }
}

function loadProfileData() {
    console.log('[Profile] Loading data for:', currentUser);
    if (currentUser) {
        const nameInput = document.getElementById('profileName');
        const emailInput = document.getElementById('profileEmail');
        if (nameInput) nameInput.value = currentUser.name || '';
        if (emailInput) emailInput.value = currentUser.email || '';
    }
}

function enableEdit(fieldId) {
    const input = document.getElementById(fieldId);
    input.removeAttribute('readonly');
    input.focus();
    input.parentElement.classList.add('editing-active');
    
    document.getElementById('saveProfileBtn').style.display = 'inline-block';
    document.getElementById('cancelEditBtn').style.display = 'inline-block';
}

function cancelEdit() {
    loadProfileData(); // Reset values
    const fields = ['profileName']; // Email is now read-only
    fields.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.setAttribute('readonly', true);
            input.parentElement.classList.remove('editing-active');
        }
    });

    document.getElementById('saveProfileBtn').style.display = 'none';
    document.getElementById('cancelEditBtn').style.display = 'none';
}

function switchSection(section) {
    // Update nav items
    document.querySelectorAll('.settings-nav-item').forEach(item => item.classList.remove('active'));
    // Handle synthetic event or click
    if (window.event && window.event.target) {
        window.event.target.classList.add('active');
    }

    // Update sections
    document.querySelectorAll('.settings-section').forEach(sec => sec.classList.remove('active'));
    if (section === 'profile') {
        document.getElementById('profileSection').classList.add('active');
    } else {
        document.getElementById('securitySection').classList.add('active');
    }
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    const name = document.getElementById('profileName').value.trim();
    const alert = document.getElementById('profileAlert');
    const btn = document.getElementById('saveProfileBtn');

    if (!name) {
        alert.className = 'alert alert-danger show';
        alert.innerHTML = '❌ Name cannot be empty.';
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Saving...';

    try {
        const res = await fetch('/api/users/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        const data = await res.json();

        if (data.success) {
            alert.className = 'alert alert-success show';
            alert.innerHTML = '✅ Profile updated successfully.';
            document.getElementById('sidebarName').textContent = name;
            currentUser.name = name;
            cancelEdit(); // Lock fields again
        } else {
            alert.className = 'alert alert-danger show';
            alert.innerHTML = `❌ ${data.message}`;
        }
    } catch (err) {
        alert.className = 'alert alert-danger show';
        alert.innerHTML = '❌ Server error.';
    }

    btn.disabled = false;
    btn.textContent = 'Save Changes';
    setTimeout(() => alert.classList.remove('show'), 3000);
}

async function handlePasswordUpdate(e) {
    e.preventDefault();
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;
    const alert = document.getElementById('passwordAlert');
    const btn = document.getElementById('savePasswordBtn');

    if (newPassword === currentPassword) {
        alert.className = 'alert alert-danger show';
        alert.innerHTML = '❌ New password cannot be the same as current password.';
        return;
    }

    if (newPassword !== confirmNewPassword) {
        alert.className = 'alert alert-danger show';
        alert.innerHTML = '❌ New passwords do not match.';
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Updating...';

    try {
        const res = await fetch('/api/users/change-password', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword, newPassword })
        });
        const data = await res.json();

        if (data.success) {
            alert.className = 'alert alert-success show';
            alert.innerHTML = '✅ Password updated successfully!';
            document.getElementById('passwordForm').reset();

            // Manually reset strength bar since it's outside the form
            const fill  = document.getElementById('profile-pwd-strength-fill');
            const lbl   = document.getElementById('profile-pwd-strength-label');
            const rec   = document.getElementById('profile-pwd-strength-rec');
            if (fill)  { fill.style.width = '0%'; fill.style.background = ''; }
            if (lbl)   { lbl.textContent = ''; }
            if (rec)   { rec.textContent = ''; }

            // Hide success alert after 3s
            setTimeout(() => alert.classList.remove('show'), 3000);
        } else {
            alert.className = 'alert alert-danger show';
            alert.innerHTML = `❌ ${data.message}`;
            setTimeout(() => alert.classList.remove('show'), 4000);
        }
    } catch (err) {
        alert.className = 'alert alert-danger show';
        alert.innerHTML = '❌ Server error.';
        setTimeout(() => alert.classList.remove('show'), 4000);
    }

    btn.disabled = false;
    btn.textContent = 'Update Password';
}
