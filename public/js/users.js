// ============================================
// users.js — User Management (Admin)
// ============================================

let allUsers = [];
let editingUserId = null;
let deletingUserId = null;

async function logout() {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    window.location.href = 'index.html';
}

function showModalAlert(message, type) {
    const a = document.getElementById('modalAlert');
    a.className = `alert alert-${type} show`;
    a.innerHTML = `<span>${type === 'danger' ? '❌' : '✅'}</span> ${message}`;
}

async function init() {
    // Verify admin session
    try {
        const res = await fetch('/api/me', { credentials: 'include' });
        const data = await res.json();
        if (!data.success || data.user.role !== 'admin') {
            window.location.href = 'index.html';
            return;
        }
        const user = data.user;
        document.getElementById('sidebarName').textContent = user.name;
        document.getElementById('sidebarAvatar').textContent = user.name.charAt(0).toUpperCase();
    } catch (e) {
        window.location.href = 'index.html';
        return;
    }

    loadUsers();
}

async function loadUsers() {
    try {
        const res = await fetch('/api/users', { credentials: 'include' });
        const data = await res.json();
        allUsers = data.users || [];
        renderUsers(allUsers);
    } catch (e) {
        document.getElementById('usersTableBody').innerHTML =
            `<tr><td colspan="6" style="text-align:center; color:var(--danger); padding:20px;">Failed to load users.</td></tr>`;
    }
}

function renderUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    if (!users.length) {
        tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">👥</div><h4>No users found</h4></div></td></tr>`;
        return;
    }
    tbody.innerHTML = users.map((u, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>
                <div style="display:flex; align-items:center; gap:10px;">
                    <div class="user-avatar" style="width:32px;height:32px;font-size:13px;">${u.name.charAt(0).toUpperCase()}</div>
                    <strong>${u.name}</strong>
                </div>
            </td>
            <td style="color:var(--text-secondary);">${u.email}</td>
            <td><span class="badge-role ${u.role === 'admin' ? 'badge-admin' : 'badge-user'}">${u.role}</span></td>
            <td style="color:var(--text-muted); font-size:13px;">${new Date(u.created_at).toLocaleDateString('en-US', {year:'numeric', month:'short', day:'numeric'})}</td>
            <td>
                <div class="action-group">
                    <button class="btn btn-warning btn-sm btn-icon" onclick="openEditModal(${u.id})" title="Edit">✏️</button>
                    <button class="btn btn-danger btn-sm btn-icon" onclick="openDeleteModal(${u.id}, '${u.name}')" title="Delete">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function filterUsers() {
    const q = document.getElementById('searchInput').value.toLowerCase();
    const filtered = allUsers.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    renderUsers(filtered);
}

function openAddModal() {
    editingUserId = null;
    document.getElementById('modalTitle').textContent = 'Add New User';
    document.getElementById('pwdNote').style.display = 'none';
    document.getElementById('userName').value = '';
    document.getElementById('userEmail').value = '';
    document.getElementById('userPassword').value = '';
    document.getElementById('userRole').value = 'user';
    const a = document.getElementById('modalAlert');
    a.className = 'alert';
    document.getElementById('userModal').classList.add('active');
}

function openEditModal(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    editingUserId = userId;
    document.getElementById('modalTitle').textContent = 'Edit User';
    document.getElementById('pwdNote').style.display = 'inline';
    document.getElementById('userName').value = user.name;
    document.getElementById('userEmail').value = user.email;
    document.getElementById('userPassword').value = '';
    document.getElementById('userRole').value = user.role;
    const a = document.getElementById('modalAlert');
    a.className = 'alert';
    document.getElementById('userModal').classList.add('active');
}

function closeModal() {
    document.getElementById('userModal').classList.remove('active');
}

async function saveUser() {
    const name = document.getElementById('userName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const password = document.getElementById('userPassword').value;
    const role = document.getElementById('userRole').value;

    if (!name || !email) return showModalAlert('Name and email are required.', 'danger');
    if (!editingUserId && !password) return showModalAlert('Password is required for new users.', 'danger');

    const btn = document.getElementById('saveUserBtn');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    try {
        const isEdit = !!editingUserId;
        const url = isEdit ? `/api/users/${editingUserId}` : '/api/users';
        const body = { name, email, role };
        if (password) body.password = password;

        const res = await fetch(url, {
            method: isEdit ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(body)
        });
        const data = await res.json();

        if (data.success) {
            closeModal();
            loadUsers();
        } else {
            showModalAlert(data.message, 'danger');
        }
    } catch (e) {
        showModalAlert('Server error.', 'danger');
    }

    btn.disabled = false;
    btn.textContent = 'Save User';
}

function openDeleteModal(userId, name) {
    deletingUserId = userId;
    document.getElementById('deleteUserName').textContent = name;
    document.getElementById('deleteModal').classList.add('active');
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('active');
    deletingUserId = null;
}

async function confirmDelete() {
    if (!deletingUserId) return;
    const btn = document.getElementById('confirmDeleteBtn');
    btn.disabled = true;
    btn.textContent = 'Deleting...';

    try {
        const res = await fetch(`/api/users/${deletingUserId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        const data = await res.json();
        if (data.success) {
            closeDeleteModal();
            loadUsers();
        } else {
            alert(data.message);
        }
    } catch (e) {
        alert('Server error.');
    }

    btn.disabled = false;
    btn.textContent = 'Delete';
}

init();
