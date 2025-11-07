const mongoose = require("mongoose");

const guestSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        unique: true,
        index: true,
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
 * Find or create guest by session ID
 */
const findOrCreateGuest = async (sessionId) => {
    let guest = await Guest.findOne({ sessionId });
    if (!guest) {
        guest = new Guest({
            sessionId,
            dailyCount: 0,
        });
        await guest.save();
    }
    return guest;
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
    updateGuestDailyCount,
    getGuestDailyCount,
    getGuestData,
    deleteGuest,
};

