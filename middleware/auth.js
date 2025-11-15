// middleware/auth.js
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ message: 'Not authenticated' });
}

function ensureAuthenticatedRedirect(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

module.exports = { ensureAuthenticated, ensureAuthenticatedRedirect };
