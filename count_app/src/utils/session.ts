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
 * Get guest token (pseudo-login token)
 */
export const getGuestToken = (): string | null => {
  return localStorage.getItem("guestToken");
};

/**
 * Set guest token
 */
export const setGuestToken = (token: string): void => {
  localStorage.setItem("guestToken", token);
};

/**
 * Clear guest token
 */
export const clearGuestToken = (): void => {
  localStorage.removeItem("guestToken");
  localStorage.removeItem("guestSessionId");
};

/**
 * Get headers with token or session ID for guest requests
 */
export const getGuestHeaders = (): HeadersInit => {
  const token = getGuestToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    // Use token for pseudo-login (preferred)
    headers["Authorization"] = `Bearer ${token}`;
  } else {
    // Fallback to session ID
    const sessionId = getGuestSessionId();
    headers["x-session-id"] = sessionId;
  }
  
  return headers;
};

