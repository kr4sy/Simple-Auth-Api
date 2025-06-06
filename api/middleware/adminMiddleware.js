const authMiddleware = require('./authMiddleware');

module.exports = (req, res, next) => {
    authMiddleware(req, res, function() {
        if (!req.user || !req.user.is_admin) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        next();
    });
};