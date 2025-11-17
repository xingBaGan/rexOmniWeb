const { findGuestByToken } = require('../models/guest');

/**
 * Guest authentication middleware
 * Verifies guest token from Authorization header
 */
const authenticateGuest = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Guest authentication required' });
        }
        
        const token = authHeader.replace('Bearer ', '');
        
        if (!token.startsWith('guest_')) {
            return res.status(401).json({ error: 'Invalid guest token format' });
        }
        
        const guest = await findGuestByToken(token);
        
        if (!guest) {
            return res.status(401).json({ error: 'Invalid guest token' });
        }
        
        req.guestSessionId = guest.sessionId;
        req.guestToken = token;
        next();
    } catch (error) {
        console.error('Guest authentication error:', error);
        res.status(401).json({ error: 'Guest authentication failed' });
    }
};

/**
 * Optional guest authentication middleware
 * Tries to authenticate guest, but doesn't fail if no token provided
 */
const optionalGuestAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.replace('Bearer ', '');
            
            if (token.startsWith('guest_')) {
                const guest = await findGuestByToken(token);
                if (guest) {
                    req.guestSessionId = guest.sessionId;
                    req.guestToken = token;
                }
            }
        }
        
        // Fallback to session ID if no token
        if (!req.guestSessionId) {
            req.guestSessionId = req.headers['x-session-id'];
        }
        
        next();
    } catch (error) {
        console.error('Optional guest authentication error:', error);
        // Don't fail, just continue without guest auth
        req.guestSessionId = req.headers['x-session-id'];
        next();
    }
};

module.exports = { authenticateGuest, optionalGuestAuth };

