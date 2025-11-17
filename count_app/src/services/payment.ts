const API_BASE_URL = (import.meta.env as any).VITE_API_BASE_URL || "http://localhost:3000";

export interface CreateCheckoutParams {
  priceId: string;
  mode?: "subscription" | "payment";
  paymentType?: "card" | "alipay" | "wechat_pay" | "usdc" | "all";
}

/**
 * Create checkout session
 * @param token - Authentication token
 * @param params - Checkout parameters (priceId is required, mode and paymentType are optional)
 */
export const createCheckoutSession = async (
  token: string,
  params: CreateCheckoutParams | string
): Promise<{ sessionId: string; url: string }> => {
  // Support both old API (string priceId) and new API (object params)
  const requestBody = typeof params === "string"
    ? { priceId: params }
    : {
        priceId: params.priceId,
        mode: params.mode || "subscription",
        paymentType: params.paymentType || "card",
      };

  const response = await fetch(`${API_BASE_URL}/api/payment/create-checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || "Failed to create checkout session");
  }

  return response.json();
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async (token: string): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/payment/cancel-subscription`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || "Failed to cancel subscription");
  }

  return response.json();
};

