const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    clerkId: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    tier: {
        type: String,
        enum: ["free", "pro"],
        default: "free",
    },
    subscriptionId: {
        type: String,
        default: null,
    },
    subscriptionStatus: {
        type: String,
        enum: ["active", "canceled", "past_due", null],
        default: null,
    },
    subscriptionEndDate: {
        type: Date,
        default: null,
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
userSchema.index({ clerkId: 1 });
userSchema.index({ email: 1 });

const User = mongoose.model("User", userSchema);

/**
 * Find or create user by Clerk ID
 */
const findOrCreateUser = async (clerkId, email) => {
    let user = await User.findOne({ clerkId });
    if (!email) {
        throw new Error("Email is required to create user");
    }
    if (!user) {
        user = new User({
            clerkId,
            email,
            tier: "free",
        });
        await user.save();
    } else if (user.email !== email) {
        // Update email if changed
        user.email = email;
        await user.save();
    }
    
    return user;
};

/**
 * Find user by Clerk ID
 */
const findUserByClerkId = async (clerkId) => {
    return await User.findOne({ clerkId });
};

/**
 * Update user subscription
 */
const updateSubscription = async (clerkId, subscriptionData) => {
    const { subscriptionId, status, endDate } = subscriptionData;
    
    return await User.findOneAndUpdate(
        { clerkId },
        {
            subscriptionId,
            subscriptionStatus: status,
            subscriptionEndDate: endDate,
            tier: status === "active" ? "pro" : "free",
        },
        { new: true }
    );
};

/**
 * Update daily count
 */
const updateDailyCount = async (clerkId) => {
    const user = await User.findOne({ clerkId });
    if (!user) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastDate = user.lastCountDate ? new Date(user.lastCountDate) : null;

    if (!lastDate || lastDate.getTime() !== today.getTime()) {
        user.dailyCount = 1;
        user.lastCountDate = today;
    } else {
        user.dailyCount += 1;
    }

    await user.save();
    return user;
};

/**
 * Get daily count
 */
const getDailyCount = async (clerkId) => {
    const user = await User.findOne({ clerkId });
    if (!user) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastDate = user.lastCountDate ? new Date(user.lastCountDate) : null;

    if (!lastDate || lastDate.getTime() !== today.getTime()) {
        return 0;
    }

    return user.dailyCount;
};

/**
 * Merge guest daily count into user account
 */
const mergeGuestDailyCount = async (clerkId, guestDailyCount, guestLastCountDate) => {
    const user = await User.findOne({ clerkId });
    if (!user) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const userLastDate = user.lastCountDate ? new Date(user.lastCountDate) : null;
    const guestDate = guestLastCountDate ? new Date(guestLastCountDate) : null;

    // If guest has count for today and user doesn't, use guest's count
    if (guestDate && guestDate.getTime() === today.getTime()) {
        if (!userLastDate || userLastDate.getTime() !== today.getTime()) {
            // User has no count for today, use guest's count
            user.dailyCount = guestDailyCount;
            user.lastCountDate = guestDate;
        } else {
            // Both have count for today, use the higher one
            user.dailyCount = Math.max(user.dailyCount, guestDailyCount);
        }
    }

    await user.save();
    return user;
};

module.exports = {
    User,
    findOrCreateUser,
    findUserByClerkId,
    updateSubscription,
    updateDailyCount,
    getDailyCount,
    mergeGuestDailyCount,
};

