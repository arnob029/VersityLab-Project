const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// GET /api/tasks — Admin sees all, User sees assigned
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const user = req.session.user;
        let query, params;

        if (user.role === 'admin') {
            query = `
                SELECT t.*, u.name as assigned_user_name 
                FROM tasks t 
                LEFT JOIN users u ON t.assigned_user_id = u.id 
                ORDER BY t.created_at DESC
            `;
            params = [];
        } else {
            query = `
                SELECT t.*, u.name as assigned_user_name 
                FROM tasks t 
                LEFT JOIN users u ON t.assigned_user_id = u.id 
                WHERE t.assigned_user_id = ? 
                ORDER BY t.created_at DESC
            `;
            params = [user.id];
        }

        const [tasks] = await db.query(query, params);
        res.json({ success: true, tasks });
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// GET /api/tasks/:id — Get single task
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.session.user;

        const [tasks] = await db.query(`
            SELECT t.*, u.name as assigned_user_name 
            FROM tasks t 
            LEFT JOIN users u ON t.assigned_user_id = u.id 
            WHERE t.id = ?
        `, [id]);

        if (tasks.length === 0) {
            return res.status(404).json({ success: false, message: 'Task not found.' });
        }

        const task = tasks[0];

        // Users can only view their assigned tasks
        if (user.role !== 'admin' && task.assigned_user_id !== user.id) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        res.json({ success: true, task });
    } catch (error) {
        console.error('Get task error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// POST /api/tasks — Admin: create task
router.post('/', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { title, description, assigned_user_id, deadline } = req.body;

        if (!title) {
            return res.status(400).json({ success: false, message: 'Task title is required.' });
        }

        const [result] = await db.query(
            'INSERT INTO tasks (title, description, assigned_user_id, deadline) VALUES (?, ?, ?, ?)',
            [title, description || null, assigned_user_id || null, deadline || null]
        );

        res.status(201).json({ success: true, message: 'Task created successfully.', id: result.insertId });
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// PUT /api/tasks/:id — Admin: full edit | User: status update only
router.put('/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.session.user;

        const [tasks] = await db.query('SELECT * FROM tasks WHERE id = ?', [id]);
        if (tasks.length === 0) {
            return res.status(404).json({ success: false, message: 'Task not found.' });
        }

        const task = tasks[0];

        if (user.role === 'admin') {
            // Admin can update all fields
            const { title, description, status, assigned_user_id, deadline } = req.body;
            await db.query(
                'UPDATE tasks SET title = ?, description = ?, status = ?, assigned_user_id = ?, deadline = ? WHERE id = ?',
                [
                    title || task.title,
                    description !== undefined ? description : task.description,
                    status || task.status,
                    assigned_user_id !== undefined ? assigned_user_id : task.assigned_user_id,
                    deadline !== undefined ? deadline : task.deadline,
                    id
                ]
            );
        } else {
            // User can only update status of their own assigned task
            if (task.assigned_user_id !== user.id) {
                return res.status(403).json({ success: false, message: 'Access denied.' });
            }
            const { status } = req.body;
            if (!status) {
                return res.status(400).json({ success: false, message: 'Status is required.' });
            }
            await db.query('UPDATE tasks SET status = ? WHERE id = ?', [status, id]);
        }

        res.json({ success: true, message: 'Task updated successfully.' });
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// DELETE /api/tasks/:id — Admin only
router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await db.query('SELECT id FROM tasks WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Task not found.' });
        }

        await db.query('DELETE FROM tasks WHERE id = ?', [id]);
        res.json({ success: true, message: 'Task deleted successfully.' });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// GET /api/tasks/stats/summary — Dashboard statistics
router.get('/stats/summary', isAuthenticated, async (req, res) => {
    try {
        const user = req.session.user;
        console.log(`[Stats] Fetching summary for user: ${user.email} (Role: ${user.role})`);

        if (user.role === 'admin') {
            const [totalUsersRows] = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'user'");
            const [totalTasksRows] = await db.query('SELECT COUNT(*) as count FROM tasks');
            const [completedTasksRows] = await db.query("SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'");
            const [pendingTasksRows] = await db.query("SELECT COUNT(*) as count FROM tasks WHERE status = 'pending'");
            const [ongoingTasksRows] = await db.query("SELECT COUNT(*) as count FROM tasks WHERE status = 'ongoing'");

            const stats = {
                totalUsers: totalUsersRows[0].count,
                totalTasks: totalTasksRows[0].count,
                completedTasks: completedTasksRows[0].count,
                pendingTasks: pendingTasksRows[0].count,
                ongoingTasks: ongoingTasksRows[0].count
            };

            console.log('[Stats] Admin stats calculated:', stats);
            res.json({ success: true, stats });
        } else {
            const [assignedTasksRows] = await db.query('SELECT COUNT(*) as count FROM tasks WHERE assigned_user_id = ?', [user.id]);
            const [completedTasksRows] = await db.query("SELECT COUNT(*) as count FROM tasks WHERE assigned_user_id = ? AND status = 'completed'", [user.id]);
            const [pendingTasksRows] = await db.query("SELECT COUNT(*) as count FROM tasks WHERE assigned_user_id = ? AND status = 'pending'", [user.id]);
            const [ongoingTasksRows] = await db.query("SELECT COUNT(*) as count FROM tasks WHERE assigned_user_id = ? AND status = 'ongoing'", [user.id]);

            const stats = {
                assignedTasks: assignedTasksRows[0].count,
                completedTasks: completedTasksRows[0].count,
                pendingTasks: pendingTasksRows[0].count,
                ongoingTasks: ongoingTasksRows[0].count
            };

            console.log(`[Stats] User stats for ${user.name}:`, stats);
            res.json({ success: true, stats });
        }
    } catch (error) {
        console.error('[Stats Error]:', error);
        res.status(500).json({ success: false, message: 'Server error fetching stats.' });
    }
});

module.exports = router;
