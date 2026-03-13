const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { isAuthenticated } = require('../middleware/auth');

// POST /api/comments — Add comment to a task
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { task_id, comment } = req.body;
        const user = req.session.user;

        if (!task_id || !comment) {
            return res.status(400).json({ success: false, message: 'Task ID and comment are required.' });
        }

        // Check task exists and user has access
        const [tasks] = await db.query('SELECT * FROM tasks WHERE id = ?', [task_id]);
        if (tasks.length === 0) {
            return res.status(404).json({ success: false, message: 'Task not found.' });
        }

        const task = tasks[0];

        // Users can only comment on their assigned tasks
        if (user.role !== 'admin' && task.assigned_user_id !== user.id) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        const [result] = await db.query(
            'INSERT INTO comments (task_id, user_id, comment) VALUES (?, ?, ?)',
            [task_id, user.id, comment.trim()]
        );

        res.status(201).json({ success: true, message: 'Comment added.', id: result.insertId });
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// GET /api/comments/:task_id — Get all comments for a task
router.get('/:task_id', isAuthenticated, async (req, res) => {
    try {
        const { task_id } = req.params;
        const user = req.session.user;

        // Check task exists and user has access
        const [tasks] = await db.query('SELECT * FROM tasks WHERE id = ?', [task_id]);
        if (tasks.length === 0) {
            return res.status(404).json({ success: false, message: 'Task not found.' });
        }

        const task = tasks[0];

        if (user.role !== 'admin' && task.assigned_user_id !== user.id) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        const [comments] = await db.query(`
            SELECT c.*, u.name as user_name 
            FROM comments c 
            JOIN users u ON c.user_id = u.id 
            WHERE c.task_id = ? 
            ORDER BY c.created_at ASC
        `, [task_id]);

        res.json({ success: true, comments });
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

module.exports = router;
