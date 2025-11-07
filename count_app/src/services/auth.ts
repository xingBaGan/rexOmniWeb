const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export interface User {
  id: string;
  email: string;
  tier: "free" | "pro";
  subscriptionStatus?: string;
  subscriptionEndDate?: string;
  dailyCount?: number;
}

/**
 * Get current user from backend
 */
export const getCurrentUser = async (token: string): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to get user");
  }

  return response.json();
};

/**
 * Update daily count
 */
export const updateDailyCount = async (token: string): Promise<{ dailyCount: number; tier: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/user/update-count`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to update count");
  }

  return response.json();
};

