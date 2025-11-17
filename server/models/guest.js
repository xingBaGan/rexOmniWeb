const mongoose = require("mongoose");

const guestSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    token: {
        type: String,
        unique: true,
        index: true,
        sparse: true,
    },
    dailyCount: {
        type: Number,
        default: 0,
    },
    lastCountDate: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});

// Index for faster queries
guestSchema.index({ sessionId: 1 });

const Guest = mongoose.model("Guest", guestSchema);

/**
 * Generate guest token
 */
const generateGuestToken = () => {
    const crypto = require('crypto');
    return `guest_${crypto.randomBytes(32).toString('hex')}`;
};

/**
 * Find or create guest by session ID
 * Uses findOneAndUpdate with upsert to handle concurrent requests safely
 */
const findOrCreateGuest = async (sessionId) => {
    try {
        // Use findOneAndUpdate with upsert to atomically find or create
        // This prevents race conditions when multiple requests try to create the same guest
        const token = generateGuestToken();
        let guest = await Guest.findOneAndUpdate(
            { sessionId },
            {
                $setOnInsert: {
                    sessionId,
                    token,
                    dailyCount: 0,
                }
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true
            }
        );
        
        // If guest already existed but doesn't have a token, update it
        if (guest && !guest.token) {
            guest.token = token;
            await guest.save();
        }
        
        return guest;
    } catch (error) {
        // Handle duplicate key error (race condition)
        if (error.code === 11000) {
            // Another request created the guest, just find it
            const guest = await Guest.findOne({ sessionId });
            if (guest) {
                // Ensure token exists
                if (!guest.token) {
                    guest.token = generateGuestToken();
                    await guest.save();
                }
                return guest;
            }
        }
        throw error;
    }
};

/**
 * Find guest by token
 */
const findGuestByToken = async (token) => {
    return await Guest.findOne({ token });
};

/**
 * Update daily count for guest
 */
const updateGuestDailyCount = async (sessionId) => {
    const guest = await findOrCreateGuest(sessionId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastDate = guest.lastCountDate ? new Date(guest.lastCountDate) : null;

    if (!lastDate || lastDate.getTime() !== today.getTime()) {
        guest.dailyCount = 1;
        guest.lastCountDate = today;
    } else {
        guest.dailyCount += 1;
    }

    await guest.save();
    return guest;
};

/**
 * Get daily count for guest
 */
const getGuestDailyCount = async (sessionId) => {
    const guest = await Guest.findOne({ sessionId });
    if (!guest) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastDate = guest.lastCountDate ? new Date(guest.lastCountDate) : null;

    if (!lastDate || lastDate.getTime() !== today.getTime()) {
        return 0;
    }

    return guest.dailyCount;
};

/**
 * Get guest data for migration
 */
const getGuestData = async (sessionId) => {
    return await Guest.findOne({ sessionId });
};

/**
 * Delete guest data after migration
 */
const deleteGuest = async (sessionId) => {
    return await Guest.findOneAndDelete({ sessionId });
};

module.exports = {
    Guest,
    findOrCreateGuest,
    findGuestByToken,
    updateGuestDailyCount,
    getGuestDailyCount,
    getGuestData,
    deleteGuest,
};

