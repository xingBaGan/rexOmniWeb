import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import { HomePage } from "./components/HomePage";
import { ProcessingPage } from "./components/ProcessingPage";
import { ResultPage } from "./components/ResultPage";
import { HistoryPage } from "./components/HistoryPage";
import { AuthPage } from "./components/AuthPage";
import { PaymentCallback } from "./components/PaymentCallback";
import { UserProfilePage } from "./components/UserProfilePage";
import { UpgradeModal } from "./components/UpgradeModal";
import { Toaster } from "./components/ui/sonner";
import { getCurrentUser, updateDailyCount } from "./services/auth";
import { getGuestSession, getGuestDailyCount, updateGuestDailyCount } from "./services/guest";
import { saveHistory, saveGuestHistory } from "./services/history";
import { migrateGuestToUser } from "./services/migration";
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

// Main app component with routing
function AppRoutes() {
  const { isSignedIn, getToken, isLoaded } = useAuth();
  const { user: clerkUser } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [userTier, setUserTier] = useState<UserTier>("free");
  const [dailyCount, setDailyCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const freeLimit = 5;

  // Initialize guest session immediately on mount (before Clerk loads)
  useEffect(() => {
    const initGuestSession = async () => {
      try {
        await getGuestSession();
      } catch (error) {
        console.error("Failed to initialize guest session:", error);
      }
    };
    
    initGuestSession();
  }, []);

  // Load user data from backend
  useEffect(() => {
    const loadUserData = async () => {
      if (!isLoaded) {
        return;
      }

      if (!isSignedIn) {
        try {
          const { dailyCount: count } = await getGuestSession();
          setDailyCount(count);
        } catch (error) {
          console.error("Failed to load guest data:", error);
          setDailyCount(0);
        }
        setUserTier("free");
        setLoading(false);
        return;
      }

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
    navigate("/processing", { state: { imageUrl } });
  };

  const handleProcessingComplete = async (result: ProcessedImage) => {
    // Update daily count
    if (isSignedIn) {
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
      try {
        const newCount = await updateGuestDailyCount();
        setDailyCount(newCount);
      } catch (error) {
        console.error("Failed to update guest count:", error);
      }
    }

    // Save to history
    try {
      if (isSignedIn) {
        const token = await getToken();
        if (token) {
          await saveHistory(token, result);
        }
      } else {
        await saveGuestHistory(result);
      }
    } catch (error) {
      console.error("Failed to save history:", error);
    }

    // Navigate to result page with result data
    navigate("/result", { state: { result } });
  };

  const handleUpgrade = async () => {
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
    try {
      const token = await getToken();
      if (token) {
        try {
          const migrationResult = await migrateGuestToUser(token);
          if (migrationResult.historyMigrated > 0 || migrationResult.countMigrated) {
            toast.success(
              `Migrated ${migrationResult.historyMigrated} history items to your account`
            );
          }
        } catch (error) {
          console.error("Failed to migrate guest data:", error);
        }

        const userData = await getCurrentUser(token);
        setUserTier(userData.tier);
        setDailyCount(userData.dailyCount || 0);
        navigate("/");
        
        if (userData.tier === "free") {
          setShowUpgradeModal(true);
        }
      }
    } catch (error) {
      console.error("Failed to load user data after login:", error);
      toast.error("Failed to load user data after login");
    }
  };

  const handlePaymentCallbackComplete = async () => {
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
    
    // Get return_to from URL params or default to home
    const urlParams = new URLSearchParams(window.location.search);
    const returnTo = urlParams.get("return_to") || "/";
    navigate(returnTo);
  };

  // Show loading state
  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              onImageUpload={handleImageUpload}
              onNavigateHistory={() => navigate("/history")}
              onNavigateAuth={() => navigate("/auth")}
              onNavigateProfile={() => navigate("/profile")}
              onSelectImage={(result) => {
                navigate("/result", { state: { result } });
              }}
              userTier={userTier}
              dailyCount={dailyCount}
              isSignedIn={isSignedIn}
              freeLimit={freeLimit}
            />
          }
        />
        <Route
          path="/processing"
          element={
            <ProcessingPageWrapper
              onComplete={handleProcessingComplete}
              onCancel={() => navigate("/")}
            />
          }
        />
        <Route
          path="/result"
          element={
            <ResultPageWrapper
              userTier={userTier}
              onUpgrade={handleUpgrade}
              onBack={() => navigate("/")}
            />
          }
        />
        <Route
          path="/history"
          element={
            <HistoryPage
              onBack={() => navigate("/")}
              onSelectImage={(result) => {
                navigate("/result", { state: { result } });
              }}
              userTier={userTier}
            />
          }
        />
        <Route
          path="/profile"
          element={<UserProfilePage onBack={() => navigate("/")} />}
        />
        <Route
          path="/auth"
          element={<AuthPage mode="sign-in" onLoginSuccess={handleLoginSuccess} />}
        />
        <Route
          path="/payment/success"
          element={<PaymentCallback onComplete={handlePaymentCallbackComplete} />}
        />
        <Route
          path="/payment/cancel"
          element={<PaymentCallback onComplete={handlePaymentCallbackComplete} />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      <UpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={handleUpgrade}
        returnTo={location.pathname}
      />
      <Toaster theme="dark" />
    </div>
  );
}

// Wrapper component for ProcessingPage to access location state
function ProcessingPageWrapper({
  onComplete,
  onCancel,
}: {
  onComplete: (result: ProcessedImage) => void;
  onCancel: () => void;
}) {
  const location = useLocation();
  const imageUrl = (location.state as { imageUrl?: string })?.imageUrl;

  if (!imageUrl) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">
        <div className="text-center">
          <p className="mb-4">No image selected</p>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-[#4D8FFF] rounded hover:bg-[#3D7FEF]"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <ProcessingPage imageUrl={imageUrl} onComplete={onComplete} onCancel={onCancel} />;
}

// Wrapper component for ResultPage to access location state
function ResultPageWrapper({
  userTier,
  onUpgrade,
  onBack,
}: {
  userTier: UserTier;
  onUpgrade: () => void;
  onBack: () => void;
}) {
  const location = useLocation();
  const result = (location.state as { result?: ProcessedImage })?.result;

  if (!result) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center text-white">
        <div className="text-center">
          <p className="mb-4">No result data available</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-[#4D8FFF] rounded hover:bg-[#3D7FEF]"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <ResultPage result={result} onBack={onBack} userTier={userTier} onUpgrade={onUpgrade} />;
}

// Root App component with Router
export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
