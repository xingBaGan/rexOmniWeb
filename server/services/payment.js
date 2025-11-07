const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

/**
 * Create checkout session
 */
const createCheckoutSession = async (userId, priceId, mode = "subscription") => {
    try {
        const session = await stripe.checkout.sessions.create({
            mode,
            payment_method_types: ["card"],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
            client_reference_id: userId.toString(),
            metadata: {
                userId: userId.toString(),
            },
        });

        return session;
    } catch (error) {
        console.error("Stripe checkout error:", error);
        throw error;
    }
};

/**
 * Get subscription details
 */
const getSubscription = async (subscriptionId) => {
    try {
        return await stripe.subscriptions.retrieve(subscriptionId);
    } catch (error) {
        console.error("Stripe get subscription error:", error);
        throw error;
    }
};

/**
 * Cancel subscription
 */
const cancelSubscription = async (subscriptionId) => {
    try {
        return await stripe.subscriptions.cancel(subscriptionId);
    } catch (error) {
        console.error("Stripe cancel subscription error:", error);
        throw error;
    }
};

/**
 * Handle webhook event
 */
const handleWebhook = async (event) => {
    switch (event.type) {
        case "checkout.session.completed":
            const session = event.data.object;
            return { type: "checkout.completed", session };
        
        case "customer.subscription.updated":
        case "customer.subscription.deleted":
            const subscription = event.data.object;
            return { type: "subscription.updated", subscription };
        
        default:
            return null;
    }
};

module.exports = {
    createCheckoutSession,
    getSubscription,
    cancelSubscription,
    handleWebhook,
};

