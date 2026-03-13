// ============================================
// admin-dashboard.js
// ============================================

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
    if (!d) return '<span style="color:var(--text-muted);">No deadline</span>';
    const date = new Date(d);
    const today = new Date();
    today.setHours(0,0,0,0);
    const diff = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
    const str = date.toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });
    if (diff < 0) return `<span class="overdue">${str} (Overdue)</span>`;
    if (diff <= 3) return `<span class="due-soon">${str} (${diff}d left)</span>`;
    return `<span class="on-time">${str}</span>`;
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
        document.getElementById('welcomeText').textContent = `Welcome, ${user.name}!`;
    } catch (e) {
        window.location.href = 'index.html';
        return;
    }

    // Load stats
    try {
        const res = await fetch('/api/tasks/stats/summary', { credentials: 'include' });
        const data = await res.json();
        if (data.success) {
            document.getElementById('statUsers').textContent = data.stats.totalUsers;
            document.getElementById('statTasks').textContent = data.stats.totalTasks;
            document.getElementById('statCompleted').textContent = data.stats.completedTasks;
            document.getElementById('statPending').textContent = data.stats.pendingTasks;
            document.getElementById('statInProgress').textContent = data.stats.inProgressTasks;
        }
    } catch (e) {}

    // Load recent tasks (max 5)
    try {
        const res = await fetch('/api/tasks', { credentials: 'include' });
        const data = await res.json();
        const tbody = document.getElementById('recentTasksBody');

        if (data.success && data.tasks.length > 0) {
            const recent = data.tasks.slice(0, 5);
            tbody.innerHTML = recent.map(t => `
                <tr>
                    <td><strong>${t.title}</strong></td>
                    <td>${t.assigned_user_name || '<span style="color:var(--text-muted);">Unassigned</span>'}</td>
                    <td>${getStatusBadge(t.status)}</td>
                    <td>${formatDate(t.deadline)}</td>
                    <td>
                        <a href="task-detail.html?id=${t.id}" class="btn btn-sm btn-secondary">View</a>
                    </td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:40px;">
                <div class="empty-state"><div class="empty-icon">📋</div><h4>No tasks yet</h4><p>Create your first task</p></div>
            </td></tr>`;
        }
    } catch (e) {
        document.getElementById('recentTasksBody').innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--danger); padding:20px;">Failed to load tasks.</td></tr>`;
    }
}

init();
