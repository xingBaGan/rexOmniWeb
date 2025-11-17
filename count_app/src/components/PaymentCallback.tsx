import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { getCurrentUser } from "../services/auth";
import { toast } from "sonner";

type PaymentCallbackProps = {
  onComplete: () => void;
};

export function PaymentCallback({ onComplete }: PaymentCallbackProps) {
  const { getToken, isSignedIn } = useAuth();
  const location = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "canceled" | "error">("loading");

  useEffect(() => {
    const handleCallback = async () => {
      if (!isSignedIn) {
        setStatus("error");
        return;
      }

      // Check URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get("session_id");

      // Check if canceled
      if (window.location.hash.includes("cancel") || location.pathname.includes("cancel")) {
        setStatus("canceled");
        return;
      }

      // Check if success
      if (sessionId) {
        try {
          // Wait a bit for webhook to process
          await new Promise((resolve) => setTimeout(resolve, 2000));

          const token = await getToken();
          if (token) {
            const userData = await getCurrentUser(token);
            if (userData.tier === "pro") {
              setStatus("success");
              toast.success("Subscription activated successfully!");
              // Call onComplete after a delay
              setTimeout(() => {
                onComplete();
              }, 2000);
            } else {
              setStatus("error");
            }
          }
        } catch (error) {
          console.error("Payment callback error:", error);
          setStatus("error");
        }
      } else {
        setStatus("error");
      }
    };

    handleCallback();
  }, [isSignedIn, getToken, onComplete, location.pathname]);

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
      <Card className="bg-[#1F1F1F] border-[#2F2F2F] p-8 max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-16 h-16 text-[#4D8FFF] mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-white mb-2">Processing Payment</h2>
            <p className="text-[#E0E0E0]">Please wait while we confirm your subscription...</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="w-16 h-16 text-[#4CAF50] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
            <p className="text-[#E0E0E0] mb-6">
              Your subscription has been activated. You now have access to all Pro features.
            </p>
            <Button
              onClick={onComplete}
              className="bg-[#4D8FFF] hover:bg-[#3D7FEF]"
            >
              Go to Dashboard
            </Button>
          </>
        )}

        {status === "canceled" && (
          <>
            <XCircle className="w-16 h-16 text-[#F44336] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Payment Canceled</h2>
            <p className="text-[#E0E0E0] mb-6">
              Your payment was canceled. No charges were made.
            </p>
            <Button
              onClick={onComplete}
              className="bg-[#4D8FFF] hover:bg-[#3D7FEF]"
            >
              Return Home
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-16 h-16 text-[#F44336] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Payment Error</h2>
            <p className="text-[#E0E0E0] mb-6">
              There was an error processing your payment. Please try again or contact support.
            </p>
            <Button
              onClick={onComplete}
              className="bg-[#4D8FFF] hover:bg-[#3D7FEF]"
            >
              Return Home
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
