// POST /api/comments — Add comment to a task (supports replies)
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { task_id, comment, parent_id } = req.body;
        const user = req.session.user;

        if (!task_id || !comment) {
            return res.status(400).json({ success: false, message: 'Task ID and comment are required.' });
        }

        const [tasks] = await db.query('SELECT * FROM tasks WHERE id = ?', [task_id]);
        if (tasks.length === 0) {
            return res.status(404).json({ success: false, message: 'Task not found.' });
        }

        const task = tasks[0];
        if (user.role !== 'admin' && task.assigned_user_id !== user.id) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        const [result] = await db.query(
            'INSERT INTO comments (task_id, user_id, comment, parent_id) VALUES (?, ?, ?, ?)',
            [task_id, user.id, comment.trim(), parent_id || null]
        );

        res.status(201).json({ success: true, message: 'Comment added.', id: result.insertId });
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// GET /api/comments/:task_id — Get all comments with reaction counts
router.get('/:task_id', isAuthenticated, async (req, res) => {
    try {
        const { task_id } = req.params;
        const user = req.session.user;

        const [tasks] = await db.query('SELECT * FROM tasks WHERE id = ?', [task_id]);
        if (tasks.length === 0) {
            return res.status(404).json({ success: false, message: 'Task not found.' });
        }

        if (user.role !== 'admin' && tasks[0].assigned_user_id !== user.id) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        // Fetch comments along with reaction metrics
        const [comments] = await db.query(`
            SELECT c.*, u.name as user_name,
            (SELECT COUNT(*) FROM comment_reactions WHERE comment_id = c.id AND reaction = '👍') as like_count,
            (SELECT COUNT(*) FROM comment_reactions WHERE comment_id = c.id AND reaction = '❤️') as heart_count,
            (SELECT COUNT(*) FROM comment_reactions WHERE comment_id = c.id AND reaction = '😆') as laugh_count,
            (SELECT reaction FROM comment_reactions WHERE comment_id = c.id AND user_id = ?) as my_reaction
            FROM comments c 
            JOIN users u ON c.user_id = u.id 
            WHERE c.task_id = ? 
            ORDER BY c.created_at ASC
        `, [user.id, task_id]);

        res.json({ success: true, comments });
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// POST /api/comments/:id/react — Add/Toggle reaction
router.post('/:id/react', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const { reaction } = req.body;
        const user = req.session.user;

        if (!reaction) return res.status(400).json({ success: false, message: 'Reaction is required.' });

        // Check if reaction already exists
        const [existing] = await db.query(
            'SELECT id FROM comment_reactions WHERE comment_id = ? AND user_id = ? AND reaction = ?',
            [id, user.id, reaction]
        );

        if (existing.length > 0) {
            // Toggle off: Delete reaction
            await db.query('DELETE FROM comment_reactions WHERE id = ?', [existing[0].id]);
            return res.json({ success: true, message: 'Reaction removed.', action: 'removed' });
        } else {
            // Toggle on: Add reaction
            // Optional: Remove other reactions by this user on this comment first if you want only one reaction per user
            // await db.query('DELETE FROM comment_reactions WHERE comment_id = ? AND user_id = ?', [id, user.id]);
            
            await db.query(
                'INSERT INTO comment_reactions (comment_id, user_id, reaction) VALUES (?, ?, ?)',
                [id, user.id, reaction]
            );
            return res.json({ success: true, message: 'Reaction added.', action: 'added' });
        }
    } catch (error) {
        console.error('React error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// DELETE /api/comments/:id — Admin: Delete comment
router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if comment exists
        const [existing] = await db.query('SELECT id FROM comments WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Comment not found.' });
        }

        // Delete the comment (cascade will handle reactions and nested replies)
        await db.query('DELETE FROM comments WHERE id = ?', [id]);
        
        res.json({ success: true, message: 'Comment deleted successfully.' });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

module.exports = router;
