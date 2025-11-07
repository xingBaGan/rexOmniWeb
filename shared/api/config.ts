// API configuration
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
  endpoints: {
    upload: "/upload",
    predict: "/predict",
    tagger: "/tagger",
    health: "/health",
  },
};

