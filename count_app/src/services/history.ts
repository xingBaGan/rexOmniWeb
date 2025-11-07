const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
import { getGuestHeaders } from "../utils/session";

export interface ProcessedImage {
  id: string;
  imageUrl: string;
  timestamp: number;
  totalCount: number;
  categories: { [key: string]: number };
  objects: any[];
}

/**
 * Save history (authenticated user)
 */
export const saveHistory = async (
  token: string,
  historyData: ProcessedImage
): Promise<ProcessedImage> => {
  const response = await fetch(`${API_BASE_URL}/api/history`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(historyData),
  });

  if (!response.ok) {
    throw new Error("Failed to save history");
  }

  return response.json();
};

/**
 * Save history (guest user)
 */
export const saveGuestHistory = async (
  historyData: ProcessedImage
): Promise<ProcessedImage> => {
  const response = await fetch(`${API_BASE_URL}/api/history/guest`, {
    method: "POST",
    headers: getGuestHeaders(),
    body: JSON.stringify(historyData),
  });

  if (!response.ok) {
    throw new Error("Failed to save guest history");
  }

  return response.json();
};

/**
 * Get history (authenticated user)
 */
export const getHistory = async (
  token: string,
  limit: number = 50
): Promise<ProcessedImage[]> => {
  const response = await fetch(`${API_BASE_URL}/api/history?limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to get history");
  }

  return response.json();
};

/**
 * Get history (guest user)
 */
export const getGuestHistory = async (
  limit: number = 50
): Promise<ProcessedImage[]> => {
  const response = await fetch(
    `${API_BASE_URL}/api/history/guest?limit=${limit}`,
    {
      headers: getGuestHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to get guest history");
  }

  return response.json();
};

/**
 * Delete history (authenticated user)
 */
export const deleteHistoryItem = async (
  token: string,
  id: string
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/history/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to delete history");
  }
};

/**
 * Delete history (guest user)
 */
export const deleteGuestHistoryItem = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/history/guest/${id}`, {
    method: "DELETE",
    headers: getGuestHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to delete guest history");
  }
};

