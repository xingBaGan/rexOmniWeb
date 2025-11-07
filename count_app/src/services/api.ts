// API client service for count app
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export interface UploadResponse {
  message: string;
  fileKey: string;
  imageUrl: string;
}

export interface PredictResponse {
  data: any[];
}

export interface TaggerResponse {
  success: boolean;
  tags: string[];
  rawResponse: string;
}

export interface HealthResponse {
  status: "healthy" | "unhealthy";
  backendUrl?: string;
  message?: string;
  error?: string;
}

/**
 * Upload image file to server
 */
export const uploadImage = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Predict objects in image
 */
export const predictImage = async (
  imageUrl: string,
  categories?: string[]
): Promise<PredictResponse> => {
  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      imageUrl,
      categories,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `Prediction failed: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Get tags for image
 */
export const tagImage = async (imageUrl: string): Promise<TaggerResponse> => {
  const response = await fetch(`${API_BASE_URL}/tagger`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      imageUrl,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `Tagging failed: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Check backend health
 */
export const checkHealth = async (): Promise<HealthResponse> => {
  const response = await fetch(`${API_BASE_URL}/health`);

  if (!response.ok) {
    return {
      status: "unhealthy",
      error: `Health check failed: ${response.statusText}`,
    };
  }

  return response.json();
};

