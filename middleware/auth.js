// Middleware: Check if user is logged in
function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    return res.status(401).json({ success: false, message: 'Unauthorized. Please login.' });
}

// Middleware: Check if user is admin
function isAdmin(req, res, next) {
    if (req.session && req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Forbidden. Admin access required.' });
}

module.exports = { isAuthenticated, isAdmin };
