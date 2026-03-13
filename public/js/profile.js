let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    loadProfileData();

    document.getElementById('profileForm').addEventListener('submit', handleProfileUpdate);
    document.getElementById('passwordForm').addEventListener('submit', handlePasswordUpdate);
});

async function checkAuth() {
    try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.success) {
            currentUser = data.user;
            updateSidebarNav(data.user);
            
            // Fill sidebar
            document.getElementById('sidebarName').textContent = data.user.name;
            document.getElementById('sidebarAvatar').textContent = data.user.name.charAt(0).toUpperCase();
            document.getElementById('sidebarRole').innerHTML = data.user.role === 'admin' 
                ? '<span class="badge-role badge-admin">Admin</span>' 
                : '<span class="badge-role badge-user">User</span>';
            document.getElementById('roleSubtitle').textContent = data.user.role === 'admin' ? 'Admin Panel' : 'User Panel';

        } else {
            window.location.href = 'login.html';
        }
    } catch (e) {
        window.location.href = 'login.html';
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
    if (currentUser) {
        document.getElementById('profileName').value = currentUser.name;
        document.getElementById('profileEmail').value = currentUser.email;
    }
}

function switchSection(section) {
    // Update nav items
    document.querySelectorAll('.settings-nav-item').forEach(item => item.classList.remove('active'));
    event.target.classList.add('active');

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
    const name = document.getElementById('profileName').value;
    const email = document.getElementById('profileEmail').value;
    const alert = document.getElementById('profileAlert');
    const btn = document.getElementById('saveProfileBtn');

    btn.disabled = true;
    btn.textContent = 'Saving...';

    try {
        const res = await fetch('/api/users/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email })
        });
        const data = await res.json();

        if (data.success) {
            alert.className = 'alert alert-success show';
            alert.innerHTML = '✅ Profile updated successfully.';
            document.getElementById('sidebarName').textContent = name;
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
            alert.innerHTML = '✅ Password updated successfully.';
            document.getElementById('passwordForm').reset();
        } else {
            alert.className = 'alert alert-danger show';
            alert.innerHTML = `❌ ${data.message}`;
        }
    } catch (err) {
        alert.className = 'alert alert-danger show';
        alert.innerHTML = '❌ Server error.';
    }

    btn.disabled = false;
    btn.textContent = 'Update Password';
    setTimeout(() => alert.classList.remove('show'), 3000);
}
