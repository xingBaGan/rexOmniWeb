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
        
        // Try to get email from session first
        let email = session.email || session.email_addresses?.[0]?.email_address;
        
        // If email is not in session, fetch user from Clerk API
        if (!email && session.sub) {
            try {
                const clerkUser = await clerkClient.users.getUser(session.sub);
                email = clerkUser.emailAddresses?.[0]?.emailAddress || 
                        clerkUser.primaryEmailAddress?.emailAddress;
            } catch (error) {
                console.error("Failed to fetch user from Clerk:", error);
            }
        }
        
        if (!email) {
            return res.status(400).json({ error: "User email not found" });
        }
        
        req.userEmail = email;
        next();
    } catch (error) {
        console.error("Authentication error:", error);
        res.status(401).json({ error: "Authentication failed" });
    }
};

module.exports = { authenticate };

