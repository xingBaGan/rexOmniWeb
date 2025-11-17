const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
import { getGuestHeaders, setGuestToken } from "../utils/session";

/**
 * Get or create guest session
 */
export const getGuestSession = async (): Promise<{
  sessionId: string;
  token?: string;
  dailyCount: number;
}> => {
  const response = await fetch(`${API_BASE_URL}/api/guest/session`, {
    headers: getGuestHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to get guest session");
  }

  const data = await response.json();
  
  // Store token if received (pseudo-login)
  if (data.token) {
    setGuestToken(data.token);
  }
  
  return data;
};

/**
 * Get guest daily count
 */
export const getGuestDailyCount = async (): Promise<number> => {
  const response = await fetch(`${API_BASE_URL}/api/guest/count`, {
    headers: getGuestHeaders(),
  });

  if (!response.ok) {
    return 0;
  }

  const data = await response.json();
  return data.dailyCount || 0;
};

/**
 * Update guest daily count
 */
export const updateGuestDailyCount = async (): Promise<number> => {
  const response = await fetch(`${API_BASE_URL}/api/guest/update-count`, {
    method: "POST",
    headers: getGuestHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to update guest count");
  }

  const data = await response.json();
  return data.dailyCount || 0;
};

