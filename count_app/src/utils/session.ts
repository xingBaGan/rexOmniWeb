/**
 * Get or create guest session ID
 * This is stored in localStorage to persist across page refreshes
 */
export const getGuestSessionId = (): string => {
  let sessionId = localStorage.getItem("guestSessionId");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("guestSessionId", sessionId);
  }
  return sessionId;
};

/**
 * Get headers with session ID for guest requests
 */
export const getGuestHeaders = (): HeadersInit => {
  const sessionId = getGuestSessionId();
  return {
    "Content-Type": "application/json",
    "x-session-id": sessionId,
  };
};

