const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

/**
 * Create checkout session
 */
export const createCheckoutSession = async (token: string, priceId: string): Promise<{ sessionId: string; url: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/payment/create-checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ priceId }),
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

