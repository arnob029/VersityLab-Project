// Middleware: Check if user is logged in
function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    return res.status(401).json({ success: false, message: 'Unauthorized. Please login.' });
}

// Middleware: Check if user is admin
function isAdmin(req, res, next) {
    // Temporary Admin Logic for Borhan (Expires 5 hours from now: 2026-04-19 03:51 AM)
    const tempAdminEmail = 'borhan2305341720@diu.edu';
    const tempAdminEmailBD = 'borhan2305341720@diu.edu.bd';
    const expirationTime = new Date('2026-04-19T03:51:12+06:00').getTime();

    if (req.session && req.session.user) {
        const userEmail = req.session.user.email;
        const currentTime = Date.now();

        // Check if it's the temporary admin
        if (userEmail === tempAdminEmail || userEmail === tempAdminEmailBD) {
            if (currentTime < expirationTime) {
                return next(); // Grant temporary access
            } else {
                // If expired, ensure they are treated as a regular user
                req.session.user.role = 'user';
                return res.status(403).json({ success: false, message: 'Temporary admin access has expired.' });
            }
        }

        // Standard admin check
        if (req.session.user.role === 'admin') {
            return next();
        }
    }
    return res.status(403).json({ success: false, message: 'Forbidden. Admin access required.' });
}

module.exports = { isAuthenticated, isAdmin };
