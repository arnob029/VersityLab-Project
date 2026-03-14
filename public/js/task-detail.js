// ============================================
// task-detail.js — Task Details + Status Update + Comments
// ============================================

let currentUser = null;
let currentTask = null;
const taskId = new URLSearchParams(window.location.search).get('id');

async function logout() {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    window.location.href = 'index.html';
}

function goBack() { window.history.back(); }

function buildSidebar(role) {
    const nav = document.getElementById('sidebarNav');
    const subtitleEl = document.getElementById('sidebarSubtitle');
    const roleBadgeEl = document.getElementById('sidebarRoleBadge');

    if (subtitleEl) subtitleEl.textContent = role === 'admin' ? 'Admin Panel' : 'My Workspace';

    if (role === 'admin') {
        if (nav) {
            nav.innerHTML = `
                <div class="nav-section-label">Overview</div>
                <a href="admin-dashboard.html" class="nav-item"><span class="nav-icon">🏠</span> Dashboard</a>
                <div class="nav-section-label">Management</div>
                <a href="users.html" class="nav-item"><span class="nav-icon">👥</span> User Management</a>
                <a href="tasks.html" class="nav-item"><span class="nav-icon">✅</span> Task Management</a>
                <div class="nav-section-label">Settings</div>
                <a href="profile.html" class="nav-item"><span class="nav-icon">👤</span> My Profile</a>
            `;
        }
        if (roleBadgeEl) roleBadgeEl.innerHTML = '<span class="badge-role badge-admin">Admin</span>';
    } else {
        if (nav) {
            nav.innerHTML = `
                <div class="nav-section-label">Overview</div>
                <a href="user-dashboard.html" class="nav-item"><span class="nav-icon">🏠</span> Dashboard</a>
                <div class="nav-section-label">Work</div>
                <a href="tasks.html" class="nav-item"><span class="nav-icon">✅</span> My Tasks</a>
                <div class="nav-section-label">Settings</div>
                <a href="profile.html" class="nav-item"><span class="nav-icon">👤</span> My Profile</a>
            `;
        }
        if (roleBadgeEl) roleBadgeEl.innerHTML = '<span class="badge-role badge-user">User</span>';
    }
}

function getStatusBadge(status) {
    const map = {
        pending: '<span class="badge badge-pending">⏳ Pending</span>',
        ongoing: '<span class="badge badge-ongoing">🔄 Ongoing</span>',
        completed: '<span class="badge badge-completed">✅ Completed</span>'
    };
    return map[status] || status;
}

function formatDateFull(d) {
    if (!d) return 'No deadline set';
    const date = new Date(d);
    const today = new Date();
    today.setHours(0,0,0,0);
    const diff = Math.ceil((date - today) / (1000*60*60*24));
    const str = date.toLocaleDateString('en-US', {weekday:'long', year:'numeric', month:'long', day:'numeric'});
    if (diff < 0) return `<span class="overdue">${str} (${Math.abs(diff)} days overdue)</span>`;
    if (diff === 0) return `<span class="due-soon">${str} (Due Today!)</span>`;
    if (diff <= 3) return `<span class="due-soon">${str} (${diff} days left)</span>`;
    return `<span class="on-time">${str}</span>`;
}

function renderTaskInfo(task) {
    document.getElementById('taskTitleHeader').textContent = task.title;
    document.getElementById('taskStatusBadge').className = 'badge badge-' + task.status;
    document.getElementById('taskStatusBadge').innerHTML = getStatusBadge(task.status).replace(/<[^>]+>/g, '');
    document.getElementById('taskStatusBadge').className = 'badge badge-' + task.status;

    document.getElementById('taskInfoContent').innerHTML = `
        <div class="detail-row">
            <div class="detail-label">Title</div>
            <div class="detail-value" style="font-size:16px; font-weight:600;">${task.title}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Description</div>
            <div class="detail-value">${task.description || '<span style="color:var(--text-muted);">No description provided.</span>'}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Status</div>
            <div class="detail-value">${getStatusBadge(task.status)}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Assigned To</div>
            <div class="detail-value">
                ${task.assigned_user_name
                    ? `<div style="display:flex;align-items:center;gap:10px;">
                        <div class="user-avatar" style="width:30px;height:30px;font-size:13px;">${task.assigned_user_name.charAt(0).toUpperCase()}</div>
                        ${task.assigned_user_name}
                       </div>`
                    : '<span style="color:var(--text-muted);">Unassigned</span>'
                }
            </div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Deadline</div>
            <div class="detail-value">${formatDateFull(task.deadline)}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">Created</div>
            <div class="detail-value" style="color:var(--text-secondary);">${new Date(task.created_at).toLocaleDateString('en-US', {year:'numeric',month:'long',day:'numeric'})}</div>
        </div>
    `;

    // Meta panel
    document.getElementById('taskMetaPanel').innerHTML = `
        <div style="display:flex; flex-direction:column; gap:16px;">
            <div>
                <div style="font-size:12px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">Status</div>
                <div>${getStatusBadge(task.status)}</div>
            </div>
            <div>
                <div style="font-size:12px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">Assigned To</div>
                <div style="font-size:14px; color:var(--text-primary);">${task.assigned_user_name || '—'}</div>
            </div>
            <div>
                <div style="font-size:12px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">Deadline</div>
                <div style="font-size:13px;">${task.deadline ? formatDateFull(task.deadline) : '<span style="color:var(--text-muted);">Not set</span>'}</div>
            </div>
        </div>
    `;

    // Set status select to current status
    document.getElementById('statusSelect').value = task.status;

    // Admin edit button & hide status/comment controls
    if (currentUser.role === 'admin') {
        document.getElementById('adminActions').innerHTML = `
            <a href="tasks.html" class="btn btn-secondary btn-sm">← All Tasks</a>
        `;
        // Hide update status card for admin (users will update status)
        const updateStatusCard = document.getElementById('updateStatusCard');
        if (updateStatusCard) updateStatusCard.style.display = 'none';

        // Admins CAN comment now, so we don't hide the comment form anymore
        // const commentForm = document.getElementById('commentForm');
        // if (commentForm) commentForm.style.display = 'none';
    }
}

async function updateStatus() {
    const newStatus = document.getElementById('statusSelect').value;
    const btn = document.getElementById('statusBtn');
    const alert = document.getElementById('statusAlert');

    btn.disabled = true;
    btn.textContent = 'Updating...';

    try {
        const res = await fetch(`/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ status: newStatus })
        });
        const data = await res.json();

        if (data.success) {
            alert.className = 'alert alert-success show';
            alert.innerHTML = '✅ Status updated successfully!';
            // Update displayed badge
            currentTask.status = newStatus;
            document.getElementById('taskStatusBadge').innerHTML = getStatusBadge(newStatus);
            setTimeout(() => { alert.className = 'alert'; }, 3000);
        } else {
            alert.className = 'alert alert-danger show';
            alert.innerHTML = `❌ ${data.message}`;
        }
    } catch (e) {
        alert.className = 'alert alert-danger show';
        alert.innerHTML = '❌ Server error.';
    }

    btn.disabled = false;
    btn.textContent = 'Update Status';
}

let replyingToId = null;

async function loadComments() {
    try {
        const res = await fetch(`/api/comments/${taskId}`, { credentials: 'include' });
        const data = await res.json();
        const container = document.getElementById('commentsList');

        if (data.success && data.comments.length > 0) {
            const comments = data.comments;
            // Separate top-level comments and replies
            const parents = comments.filter(c => !c.parent_id);
            const replies = comments.filter(c => c.parent_id);

            container.innerHTML = parents.map(c => renderCommentHTML(c, replies)).join('');
        } else {
            container.innerHTML = `<div class="empty-state" style="padding:30px 0;">
                <div class="empty-icon">💬</div>
                <h4>No comments yet</h4>
                <p>Be the first to add a comment</p>
            </div>`;
        }
    } catch (e) {
        console.error('Load comments error:', e);
        document.getElementById('commentsList').innerHTML = '<p style="color:var(--danger); text-align:center;">Failed to load comments.</p>';
    }
}

function renderCommentHTML(c, allReplies) {
    const commentReplies = allReplies.filter(r => r.parent_id === c.id);
    
    return `
        <div class="comment-item" id="comment-${c.id}">
            <div class="comment-avatar">${c.user_name.charAt(0).toUpperCase()}</div>
            <div class="comment-content">
                <div class="comment-meta">
                    <span class="comment-author">${c.user_name}</span>
                    <span class="comment-time">${new Date(c.created_at).toLocaleString('en-US', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</span>
                </div>
                <div class="comment-text">${c.comment}</div>
                
                <div class="comment-actions">
                    <div class="reactions">
                        <button class="reaction-btn ${c.my_reaction === '👍' ? 'active' : ''}" onclick="react(${c.id}, '👍')">👍 <span>${c.like_count || 0}</span></button>
                        <button class="reaction-btn ${c.my_reaction === '❤️' ? 'active' : ''}" onclick="react(${c.id}, '❤️')">❤️ <span>${c.heart_count || 0}</span></button>
                        <button class="reaction-btn ${c.my_reaction === '😆' ? 'active' : ''}" onclick="react(${c.id}, '😆')">😆 <span>${c.laugh_count || 0}</span></button>
                    </div>
                    <button class="btn-text" onclick="toggleReply(${c.id})">Reply</button>
                    ${currentUser.role === 'admin' ? `<button class="btn-text" style="color:var(--danger); margin-left:10px;" onclick="deleteComment(${c.id})">Delete</button>` : ''}
                </div>
                
                <div id="reply-form-${c.id}" class="reply-form" style="display:none; margin-top:10px;">
                    <textarea class="form-control" id="reply-input-${c.id}" rows="2" placeholder="Write a reply..."></textarea>
                    <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:8px;">
                        <button class="btn btn-sm btn-secondary" onclick="toggleReply(${c.id})">Cancel</button>
                        <button class="btn btn-sm btn-primary" onclick="postReply(${c.id})">Post Reply</button>
                    </div>
                </div>

                ${commentReplies.length > 0 ? `
                    <div class="replies-container">
                        ${commentReplies.map(r => renderCommentHTML(r, allReplies)).join('')}
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

function toggleReply(id) {
    const form = document.getElementById(`reply-form-${id}`);
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
    if (form.style.display === 'block') {
        document.getElementById(`reply-input-${id}`).focus();
    }
}

async function postReply(parentId) {
    const input = document.getElementById(`reply-input-${parentId}`);
    const comment = input.value.trim();
    if (!comment) return;

    try {
        const res = await fetch('/api/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ task_id: taskId, comment, parent_id: parentId })
        });
        const data = await res.json();
        if (data.success) {
            await loadComments();
        } else {
            alert(data.message);
        }
    } catch (e) { console.error(e); }
}

async function react(commentId, reaction) {
    try {
        const res = await fetch(`/api/comments/${commentId}/react`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ reaction })
        });
        const data = await res.json();
        if (data.success) {
            await loadComments();
        }
    } catch (e) { console.error(e); }
}

async function deleteComment(commentId) {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
        const res = await fetch(`/api/comments/${commentId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        const data = await res.json();
        if (data.success) {
            await loadComments();
        } else {
            alert(data.message);
        }
    } catch (e) { console.error(e); }
}

async function addComment() {
    const input = document.getElementById('commentInput');
    const comment = input.value.trim();
    const alert = document.getElementById('commentAlert');
    const btn = document.getElementById('commentBtn');

    if (!comment) {
        alert.className = 'alert alert-danger show';
        alert.innerHTML = '❌ Please write a comment first.';
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Posting...';

    try {
        const res = await fetch('/api/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ task_id: taskId, comment, parent_id: null })
        });
        const data = await res.json();

        if (data.success) {
            input.value = '';
            alert.className = 'alert';
            await loadComments();
        } else {
            alert.className = 'alert alert-danger show';
            alert.innerHTML = `❌ ${data.message}`;
        }
    } catch (e) {
        alert.className = 'alert alert-danger show';
        alert.innerHTML = '❌ Server error.';
    }

    btn.disabled = false;
    btn.textContent = 'Post Comment';
}

async function init() {
    if (!taskId) { window.location.href = 'tasks.html'; return; }

    try {
        const res = await fetch('/api/me', { credentials: 'include' });
        const data = await res.json();
        if (!data.success) { window.location.href = 'index.html'; return; }
        
        currentUser = data.user;
        
        // Safely set sidebar info
        const nameEl = document.getElementById('sidebarName');
        const avatarEl = document.getElementById('sidebarAvatar');
        if (nameEl) nameEl.textContent = currentUser.name;
        if (avatarEl) avatarEl.textContent = currentUser.name.charAt(0).toUpperCase();
        
        buildSidebar(currentUser.role);
    } catch (e) {
        console.error('Init error:', e);
        window.location.href = 'index.html'; 
        return;
    }

    // Load task details
    try {
        const res = await fetch(`/api/tasks/${taskId}`, { credentials: 'include' });
        const data = await res.json();
        if (!data.success) {
            document.getElementById('taskInfoContent').innerHTML = `<p style="color:var(--danger); text-align:center;">Task not found or access denied.</p>`;
            return;
        }
        currentTask = data.task;
        renderTaskInfo(currentTask);
    } catch (e) {
        document.getElementById('taskInfoContent').innerHTML = `<p style="color:var(--danger); text-align:center;">Failed to load task.</p>`;
    }

    await loadComments();
}

init();
