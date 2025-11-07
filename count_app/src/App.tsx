import React, { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { HomePage } from "./components/HomePage";
import { ProcessingPage } from "./components/ProcessingPage";
import { ResultPage } from "./components/ResultPage";
import { HistoryPage } from "./components/HistoryPage";
import { AuthPage } from "./components/AuthPage";
import { PaymentCallback } from "./components/PaymentCallback";
import { UserProfilePage } from "./components/UserProfilePage";
import { Toaster } from "./components/ui/sonner";
import { getCurrentUser, updateDailyCount } from "./services/auth";
import { toast } from "sonner";

export type DetectedObject = {
  id: string;
  category: string;
  x: number;
  y: number;
  color: string;
};

export type ProcessedImage = {
  id: string;
  imageUrl: string;
  timestamp: number;
  totalCount: number;
  categories: { [key: string]: number };
  objects: DetectedObject[];
};

export type UserTier = "free" | "pro";

export default function App() {
  const { isSignedIn, getToken, isLoaded } = useAuth();
  const { user: clerkUser } = useUser();
  const [currentPage, setCurrentPage] = useState<"home" | "processing" | "result" | "history" | "auth" | "profile">("home");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [processedResult, setProcessedResult] = useState<ProcessedImage | null>(null);
  const [userTier, setUserTier] = useState<UserTier>("free");
  const [dailyCount, setDailyCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const freeLimit = 5;

  // Load user data from backend or localStorage
  useEffect(() => {
    const loadUserData = async () => {
      if (!isLoaded) {
        return;
      }

      if (!isSignedIn) {
        // For guest users, use localStorage
        const savedCount = localStorage.getItem("guestDailyCount");
        const savedDate = localStorage.getItem("guestDailyCountDate");
        const today = new Date().toDateString();

        if (savedDate === today && savedCount) {
          setDailyCount(parseInt(savedCount));
        } else {
          setDailyCount(0);
          localStorage.setItem("guestDailyCountDate", today);
          localStorage.setItem("guestDailyCount", "0");
        }
        setUserTier("free");
        setLoading(false);
        return;
      }

      // For signed-in users, load from backend
      try {
        const token = await getToken();
        if (token) {
          const userData = await getCurrentUser(token);
          setUserTier(userData.tier);
          setDailyCount(userData.dailyCount || 0);
        }
      } catch (error) {
        console.error("Failed to load user data:", error);
        toast.error("Failed to load user data");
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [isSignedIn, isLoaded, getToken]);

  const handleImageUpload = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setCurrentPage("processing");
  };

  const handleProcessingComplete = async (result: ProcessedImage) => {
    setProcessedResult(result);
    setCurrentPage("result");

    // Update daily count
    if (isSignedIn) {
      // For signed-in users, update on backend
      try {
        const token = await getToken();
        if (token) {
          const { dailyCount: newCount } = await updateDailyCount(token);
          setDailyCount(newCount);
        }
      } catch (error) {
        console.error("Failed to update count:", error);
      }
    } else {
      // For guest users, update localStorage
      const newCount = dailyCount + 1;
      setDailyCount(newCount);
      localStorage.setItem("guestDailyCount", newCount.toString());
    }

    // Save to history
    const history = JSON.parse(localStorage.getItem("countHistory") || "[]");
    history.unshift(result);
    localStorage.setItem("countHistory", JSON.stringify(history.slice(0, 50)));
  };

  const handleUpgrade = async () => {
    // Refresh user data after upgrade
    if (isSignedIn) {
      try {
        const token = await getToken();
        if (token) {
          const userData = await getCurrentUser(token);
          setUserTier(userData.tier);
          setDailyCount(userData.dailyCount || 0);
        }
      } catch (error) {
        console.error("Failed to refresh user data:", error);
      }
    }
  };

  const handleLoginSuccess = async () => {
    // After login, load user data and refresh
    try {
      const token = await getToken();
      if (token) {
        const userData = await getCurrentUser(token);
        setUserTier(userData.tier);
        setDailyCount(userData.dailyCount || 0);
        setCurrentPage("home");
      }
    } catch (error) {
      console.error("Failed to load user data after login:", error);
    }
  };

  const handlePaymentCallbackComplete = async () => {
    // Refresh user data and return to home
    if (isSignedIn) {
      try {
        const token = await getToken();
        if (token) {
          const userData = await getCurrentUser(token);
          setUserTier(userData.tier);
          setDailyCount(userData.dailyCount || 0);
        }
      } catch (error) {
        console.error("Failed to refresh user data:", error);
      }
    }
    // Clear URL parameters
    window.history.replaceState({}, "", window.location.pathname);
    setCurrentPage("home");
  };

  // Check if this is a payment callback
  const urlParams = new URLSearchParams(window.location.search);
  const isPaymentCallback = urlParams.has("session_id") || 
    window.location.hash.includes("payment/success") || 
    window.location.hash.includes("payment/cancel");

  // Show loading state
  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  // Show payment callback page if this is a payment callback
  if (isPaymentCallback) {
    return <PaymentCallback onComplete={handlePaymentCallbackComplete} />;
  }

  // Show auth page if navigating to auth
  if (currentPage === "auth") {
    return <AuthPage mode="sign-in" onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {currentPage === "home" && (
        <HomePage
          onImageUpload={handleImageUpload}
          onNavigateHistory={() => setCurrentPage("history")}
          onNavigateAuth={() => setCurrentPage("auth")}
          onNavigateProfile={() => setCurrentPage("profile")}
          userTier={userTier}
          dailyCount={dailyCount}
          isSignedIn={isSignedIn}
          freeLimit={freeLimit}
        />
      )}
      {currentPage === "processing" && selectedImage && (
        <ProcessingPage
          imageUrl={selectedImage}
          onComplete={handleProcessingComplete}
          onCancel={() => setCurrentPage("home")}
        />
      )}
      {currentPage === "result" && processedResult && (
        <ResultPage
          result={processedResult}
          onBack={() => setCurrentPage("home")}
          userTier={userTier}
          onUpgrade={handleUpgrade}
        />
      )}
      {currentPage === "history" && (
        <HistoryPage
          onBack={() => setCurrentPage("home")}
          onSelectImage={(result) => {
            setProcessedResult(result);
            setCurrentPage("result");
          }}
          userTier={userTier}
        />
      )}
      {currentPage === "profile" && (
        <UserProfilePage onBack={() => setCurrentPage("home")} />
      )}
      <Toaster theme="dark" />
    </div>
  );
}
