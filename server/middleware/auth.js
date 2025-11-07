const { clerkClient } = require("@clerk/clerk-sdk-node");

/**
 * Clerk authentication middleware
 */
const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace("Bearer ", "");
        
        if (!token) {
            return res.status(401).json({ error: "Authentication required" });
        }

        // Verify token with Clerk
        const session = await clerkClient.verifyToken(token);
        
        if (!session) {
            return res.status(401).json({ error: "Invalid token" });
        }

        req.clerkId = session.sub;
        req.userEmail = session.email || session.email_addresses?.[0]?.email_address;
        next();
    } catch (error) {
        console.error("Authentication error:", error);
        res.status(401).json({ error: "Authentication failed" });
    }
};

module.exports = { authenticate };

