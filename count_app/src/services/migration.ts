const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
import { getGuestSessionId, clearGuestToken } from "../utils/session";

export interface MigrationResult {
  success: boolean;
  message: string;
  historyMigrated: number;
  countMigrated: boolean;
}

/**
 * Migrate guest data to user account
 */
export const migrateGuestToUser = async (token: string): Promise<MigrationResult> => {
  const sessionId = getGuestSessionId();
  
  const response = await fetch(`${API_BASE_URL}/api/migrate/guest-to-user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "x-session-id": sessionId,
    },
    body: JSON.stringify({ sessionId }),
  });

  if (!response.ok) {
    throw new Error("Failed to migrate guest data");
  }

  const result = await response.json();
  
  // Clear guest session ID and token after successful migration
  if (result.success) {
    clearGuestToken();
  }
  
  return result;
};

