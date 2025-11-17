const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

/**
 * Create checkout session with multiple payment methods support
 * @param {string} userId - User ID
 * @param {string} priceId - Stripe Price ID
 * @param {string} mode - Payment mode: "subscription" or "payment"
 * @param {string} paymentType - Payment type: "card", "alipay", "wechat_pay", "usdc", or "all"
 * @param {string} returnTo - Return path after payment cancel (default: "/")
 */
const createCheckoutSession = async (userId, priceId, mode = "subscription", paymentType = "card", returnTo = "/") => {
    try {
        // Determine payment methods based on mode and payment type
        // Note: Subscriptions only support card payment
        // WeChat Pay and Alipay typically don't support subscriptions
        let paymentMethodTypes;
        
        if (mode === "subscription") {
            // Subscriptions only support card
            paymentMethodTypes = ["card"];
        } else {
            // One-time payments support multiple methods
            if (paymentType === "all") {
                paymentMethodTypes = ["card", "alipay", "wechat_pay"];
            } else if (paymentType === "alipay") {
                paymentMethodTypes = ["alipay"];
            } else if (paymentType === "wechat_pay") {
                paymentMethodTypes = ["wechat_pay"];
            } else if (paymentType === "usdc") {
                // USDC support depends on Stripe configuration
                paymentMethodTypes = ["usdc"];
            } else {
                paymentMethodTypes = ["card"];
            }
        }

        const sessionConfig = {
            mode,
            payment_method_types: paymentMethodTypes,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/payment/cancel?return_to=${encodeURIComponent(returnTo)}`,
            client_reference_id: userId.toString(),
            metadata: {
                userId: userId.toString(),
            },
        };

        // Add WeChat Pay specific configuration
        if (paymentMethodTypes.includes("wechat_pay")) {
            sessionConfig.payment_method_options = {
                wechat_pay: {
                    client: "web",
                },
            };
        }

        const session = await stripe.checkout.sessions.create(sessionConfig);

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

