const mongoose = require("mongoose");

const historySchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true,
    },
    isGuest: {
        type: Boolean,
        default: false,
    },
    imageUrl: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Number,
        required: true,
    },
    totalCount: {
        type: Number,
        required: true,
    },
    categories: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
    objects: {
        type: Array,
        default: [],
    },
}, {
    timestamps: true,
});

// Index for faster queries
historySchema.index({ userId: 1, timestamp: -1 });
historySchema.index({ userId: 1, isGuest: 1 });

const History = mongoose.model("History", historySchema);

/**
 * Save history item
 */
const saveHistory = async (userId, isGuest, historyData) => {
    const history = new History({
        userId,
        isGuest,
        imageUrl: historyData.imageUrl,
        timestamp: historyData.timestamp,
        totalCount: historyData.totalCount,
        categories: historyData.categories,
        objects: historyData.objects,
    });
    await history.save();
    return history;
};

/**
 * Get user history
 */
const getUserHistory = async (userId, isGuest, limit = 50) => {
    return await History.find({ userId, isGuest })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();
};

/**
 * Delete history item
 */
const deleteHistory = async (historyId, userId, isGuest) => {
    return await History.findOneAndDelete({ 
        _id: historyId, 
        userId, 
        isGuest 
    });
};

/**
 * Delete all user history
 */
const deleteAllUserHistory = async (userId, isGuest) => {
    return await History.deleteMany({ userId, isGuest });
};

/**
 * Migrate guest history to user account
 */
const migrateGuestHistoryToUser = async (sessionId, clerkId) => {
    const result = await History.updateMany(
        { userId: sessionId, isGuest: true },
        { $set: { userId: clerkId, isGuest: false } }
    );
    return result;
};

module.exports = {
    History,
    saveHistory,
    getUserHistory,
    deleteHistory,
    deleteAllUserHistory,
    migrateGuestHistoryToUser,
};

