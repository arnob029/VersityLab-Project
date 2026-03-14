const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/db');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// GET /api/users — Admin: get all users
router.get('/', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
        );
        res.json({ success: true, users });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// POST /api/users — Admin: create user
router.post('/', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
        }

        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Email already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userRole = role === 'admin' ? 'admin' : 'user';

        const [result] = await db.query(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, userRole]
        );

        res.status(201).json({ success: true, message: 'User created successfully.', id: result.insertId });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// PUT /api/users/profile — Update current user profile
router.put('/profile', isAuthenticated, async (req, res) => {
    try {
        const { name } = req.body;
        const userId = req.session.user.id;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Name is required.' });
        }

        await db.query('UPDATE users SET name = ? WHERE id = ?', [name, userId]);

        // Update session
        req.session.user.name = name;

        res.json({ success: true, message: 'Profile updated successfully.' });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// PUT /api/users/change-password — Update current user password
router.put('/change-password', isAuthenticated, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.session.user.id;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Current and new passwords are required.' });
        }

        // Get user's current hashed password
        const [users] = await db.query('SELECT password FROM users WHERE id = ?', [userId]);
        const user = users[0];

        // 1. Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
        }

        // 2. Prevent changing to the same password
        const isSameAsOld = await bcrypt.compare(newPassword, user.password);
        if (isSameAsOld) {
            return res.status(400).json({ success: false, message: 'New password cannot be the same as your current password.' });
        }

        // 3. Hash new password and update
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

        res.json({ success: true, message: 'Password changed successfully.' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// PUT /api/users/:id — Admin: update user
router.put('/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, password, role } = req.body;

        const [existing] = await db.query('SELECT id FROM users WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        let query, params;

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            query = 'UPDATE users SET name = ?, email = ?, password = ?, role = ? WHERE id = ?';
            params = [name, email, hashedPassword, role || 'user', id];
        } else {
            query = 'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?';
            params = [name, email, role || 'user', id];
        }

        await db.query(query, params);
        res.json({ success: true, message: 'User updated successfully.' });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// DELETE /api/users/:id — Admin: delete user
router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent deleting yourself
        if (parseInt(id) === req.session.user.id) {
            return res.status(400).json({ success: false, message: 'Cannot delete your own account.' });
        }

        const [existing] = await db.query('SELECT id FROM users WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        await db.query('DELETE FROM users WHERE id = ?', [id]);
        res.json({ success: true, message: 'User deleted successfully.' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

module.exports = router;
