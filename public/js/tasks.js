// ============================================
// tasks.js — Task Management (Admin + User view)
// ============================================

let allTasks = [];
let currentUser = null;
let editingTaskId = null;
let deletingTaskId = null;
let currentFilter = 'all';

async function logout() {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    window.location.href = 'index.html';
}

function getStatusBadge(status) {
    const map = {
        pending: '<span class="badge badge-pending">⏳ Pending</span>',
        in_progress: '<span class="badge badge-in_progress">🔄 In Progress</span>',
        completed: '<span class="badge badge-completed">✅ Completed</span>'
    };
    return map[status] || status;
}

function formatDate(d) {
    if (!d) return '<span style="color:var(--text-muted);">—</span>';
    const date = new Date(d);
    const today = new Date();
    today.setHours(0,0,0,0);
    const diff = Math.ceil((date - today) / (1000*60*60*24));
    const str = date.toLocaleDateString('en-US', {year:'numeric', month:'short', day:'numeric'});
    if (diff < 0) return `<span class="overdue" title="Overdue">⚠️ ${str}</span>`;
    if (diff <= 3) return `<span class="due-soon">🔔 ${str}</span>`;
    return `<span class="on-time">${str}</span>`;
}

function buildSidebar(role) {
    const nav = document.getElementById('sidebarNav');
    document.getElementById('sidebarSubtitle').textContent = role === 'admin' ? 'Admin Panel' : 'My Workspace';

    if (role === 'admin') {
        nav.innerHTML = `
            <div class="nav-section-label">Overview</div>
            <a href="admin-dashboard.html" class="nav-item"><span class="nav-icon">🏠</span> Dashboard</a>
            <div class="nav-section-label">Management</div>
            <a href="users.html" class="nav-item"><span class="nav-icon">👥</span> User Management</a>
            <a href="tasks.html" class="nav-item active"><span class="nav-icon">✅</span> Task Management</a>
        `;
        document.getElementById('sidebarRoleBadge').innerHTML = '<span class="badge-role badge-admin">Admin</span>';
        document.getElementById('addTaskBtn').style.display = 'flex';
        document.getElementById('pageTitle').textContent = 'Task Management';
        
        // Hide status selection for admins (as users update status)
        const statusGroup = document.getElementById('taskStatusGroup');
        if (statusGroup) statusGroup.style.display = 'none';
    } else {
        nav.innerHTML = `
            <div class="nav-section-label">Overview</div>
            <a href="user-dashboard.html" class="nav-item"><span class="nav-icon">🏠</span> My Dashboard</a>
            <div class="nav-section-label">Tasks</div>
            <a href="tasks.html" class="nav-item active"><span class="nav-icon">✅</span> My Tasks</a>
        `;
        document.getElementById('sidebarRoleBadge').innerHTML = '<span class="badge-role badge-user">Employee</span>';
        document.getElementById('addTaskBtn').style.display = 'none';
        document.getElementById('pageTitle').textContent = 'My Tasks';
    }
}

async function init() {
    try {
        const res = await fetch('/api/me', { credentials: 'include' });
        const data = await res.json();
        if (!data.success) { window.location.href = 'index.html'; return; }
        currentUser = data.user;
        document.getElementById('sidebarName').textContent = currentUser.name;
        document.getElementById('sidebarAvatar').textContent = currentUser.name.charAt(0).toUpperCase();
        buildSidebar(currentUser.role);
    } catch (e) {
        window.location.href = 'index.html'; return;
    }

    if (currentUser.role === 'admin') {
        await loadUsersForDropdown();
    }
    await loadTasks();
}

async function loadUsersForDropdown() {
    try {
        const res = await fetch('/api/users', { credentials: 'include' });
        const data = await res.json();
        const select = document.getElementById('taskAssignedUser');
        if (data.success && data.users) {
            data.users.filter(u => u.role === 'user').forEach(u => {
                const opt = document.createElement('option');
                opt.value = u.id;
                opt.textContent = u.name;
                select.appendChild(opt);
            });
        }
    } catch (e) {}
}

async function loadTasks() {
    try {
        const res = await fetch('/api/tasks', { credentials: 'include' });
        const data = await res.json();
        allTasks = data.tasks || [];
        applyFilter();
    } catch (e) {
        document.getElementById('tasksTableBody').innerHTML =
            `<tr><td colspan="6" style="text-align:center; color:var(--danger); padding:20px;">Failed to load tasks.</td></tr>`;
    }
}

function filterByStatus(status) {
    currentFilter = status;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.className = 'btn btn-secondary btn-sm filter-btn';
    });
    document.getElementById(`filter-${status}`).className = 'btn btn-primary btn-sm filter-btn';
    applyFilter();
}

function applyFilter() {
    let tasks = currentFilter === 'all' ? allTasks : allTasks.filter(t => t.status === currentFilter);
    const q = document.getElementById('searchInput').value.toLowerCase();
    if (q) tasks = tasks.filter(t => t.title.toLowerCase().includes(q) || (t.assigned_user_name || '').toLowerCase().includes(q));
    document.getElementById('taskCount').textContent = `${tasks.length} task${tasks.length !== 1 ? 's' : ''}`;
    renderTasks(tasks);
}

function filterTasks() { applyFilter(); }

function renderTasks(tasks) {
    const tbody = document.getElementById('tasksTableBody');
    if (!tasks.length) {
        tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state">
            <div class="empty-icon">✅</div>
            <h4>No tasks found</h4>
            <p>${currentUser.role === 'admin' ? 'Create your first task' : 'No tasks assigned to you yet'}</p>
        </div></td></tr>`;
        return;
    }

    tbody.innerHTML = tasks.map((t, i) => `
        <tr>
            <td style="color:var(--text-muted);">${i+1}</td>
            <td>
                <a href="task-detail.html?id=${t.id}" style="color:var(--text-primary); text-decoration:none; font-weight:600;">
                    ${t.title}
                </a>
                ${t.description ? `<br><span style="font-size:12px; color:var(--text-muted);">${t.description.substring(0,60)}${t.description.length>60?'...':''}</span>` : ''}
            </td>
            <td>${t.assigned_user_name ? `<div style="display:flex;align-items:center;gap:8px;"><div class="user-avatar" style="width:28px;height:28px;font-size:12px;">${t.assigned_user_name.charAt(0).toUpperCase()}</div>${t.assigned_user_name}</div>` : '<span style="color:var(--text-muted);">Unassigned</span>'}</td>
            <td>${getStatusBadge(t.status)}</td>
            <td>${formatDate(t.deadline)}</td>
            <td>
                <div class="action-group">
                    <a href="task-detail.html?id=${t.id}" class="btn btn-secondary btn-sm">👁️</a>
                    ${currentUser.role === 'admin' ? `
                        <button class="btn btn-warning btn-sm btn-icon" onclick="openEditModal(${t.id})" title="Edit">✏️</button>
                        <button class="btn btn-danger btn-sm btn-icon" onclick="openDeleteModal(${t.id})" title="Delete">🗑️</button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

function openAddModal() {
    editingTaskId = null;
    document.getElementById('taskModalTitle').textContent = 'Create New Task';
    document.getElementById('saveTaskBtn').textContent = 'Create Task';
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDescription').value = '';
    document.getElementById('taskAssignedUser').value = '';
    document.getElementById('taskStatus').value = 'pending';
    document.getElementById('taskDeadline').value = '';
    document.getElementById('taskModalAlert').className = 'alert';
    document.getElementById('taskModal').classList.add('active');
}

function openEditModal(taskId) {
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;
    editingTaskId = taskId;
    document.getElementById('taskModalTitle').textContent = 'Edit Task';
    document.getElementById('saveTaskBtn').textContent = 'Save Changes';
    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskDescription').value = task.description || '';
    document.getElementById('taskAssignedUser').value = task.assigned_user_id || '';
    document.getElementById('taskStatus').value = task.status;
    document.getElementById('taskDeadline').value = task.deadline ? task.deadline.split('T')[0] : '';
    document.getElementById('taskModalAlert').className = 'alert';
    document.getElementById('taskModal').classList.add('active');
}

function closeModal() {
    document.getElementById('taskModal').classList.remove('active');
}

async function saveTask() {
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const assigned_user_id = document.getElementById('taskAssignedUser').value || null;
    const status = document.getElementById('taskStatus').value;
    const deadline = document.getElementById('taskDeadline').value || null;

    if (!title) {
        const a = document.getElementById('taskModalAlert');
        a.className = 'alert alert-danger show';
        a.innerHTML = '❌ Task title is required.';
        return;
    }

    const btn = document.getElementById('saveTaskBtn');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    try {
        const isEdit = !!editingTaskId;
        const url = isEdit ? `/api/tasks/${editingTaskId}` : '/api/tasks';
        const res = await fetch(url, {
            method: isEdit ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ title, description, assigned_user_id, status, deadline })
        });
        const data = await res.json();
        if (data.success) {
            closeModal();
            loadTasks();
        } else {
            const a = document.getElementById('taskModalAlert');
            a.className = 'alert alert-danger show';
            a.innerHTML = `❌ ${data.message}`;
        }
    } catch (e) {
        const a = document.getElementById('taskModalAlert');
        a.className = 'alert alert-danger show';
        a.innerHTML = '❌ Server error.';
    }

    btn.disabled = false;
    btn.textContent = editingTaskId ? 'Save Changes' : 'Create Task';
}

function openDeleteModal(taskId) {
    deletingTaskId = taskId;
    document.getElementById('deleteModal').classList.add('active');
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('active');
    deletingTaskId = null;
}

async function confirmDelete() {
    if (!deletingTaskId) return;
    const btn = document.getElementById('confirmDeleteBtn');
    btn.disabled = true;
    btn.textContent = 'Deleting...';

    try {
        const res = await fetch(`/api/tasks/${deletingTaskId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        const data = await res.json();
        if (data.success) {
            closeDeleteModal();
            loadTasks();
        } else {
            alert(data.message);
        }
    } catch (e) {
        alert('Server error.');
    }

    btn.disabled = false;
    btn.textContent = 'Delete Task';
}

init();
