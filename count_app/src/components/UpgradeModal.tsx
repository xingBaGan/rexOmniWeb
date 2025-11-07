import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Check, Zap } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Card } from "./ui/card";
import { createCheckoutSession } from "../services/payment";
import { toast } from "sonner";

type UpgradeModalProps = {
  open: boolean;
  onClose: () => void;
  onUpgrade: () => void;
};

export function UpgradeModal({ open, onClose, onUpgrade }: UpgradeModalProps) {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  // Get price IDs from environment variables
  const monthlyPriceId = import.meta.env.VITE_STRIPE_PRICE_ID_MONTHLY;
  const annualPriceId = import.meta.env.VITE_STRIPE_PRICE_ID_ANNUAL;

  const features = [
    "Unlimited counts per day",
    "High-resolution image support",
    "View all detected categories",
    "Manual editing tools",
    "Export without watermark",
    "CSV data export",
    "Unlimited history storage",
    "Priority processing",
  ];

  const handlePayment = async (priceId: string) => {
    try {
      setLoading(priceId);
      const token = await getToken();
      if (!token) {
        toast.error("Please sign in to continue");
        return;
      }

      const { url } = await createCheckoutSession(token, priceId);
      if (url) {
        // Redirect to Stripe checkout
        window.location.href = url;
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || "Payment failed. Please try again.");
      setLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#1F1F1F] border-[#2F2F2F] text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Zap className="w-6 h-6 text-[#4D8FFF]" />
            Upgrade to Pro
          </DialogTitle>
          <DialogDescription className="text-[#E0E0E0]">
            Unlock unlimited counting power and advanced features
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Features List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {features.map((feature) => (
              <div key={feature} className="flex items-start gap-2">
                <Check className="w-5 h-5 text-[#4CAF50] flex-shrink-0 mt-0.5" />
                <span className="text-sm text-[#E0E0E0]">{feature}</span>
              </div>
            ))}
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-[#2F2F2F] border-[#3F3F3F] p-6 space-y-4">
              <div>
                <div className="text-sm text-[#E0E0E0] mb-1">Monthly</div>
                <div className="text-3xl">$9.99</div>
                <div className="text-sm text-[#E0E0E0]">per month</div>
              </div>
              <Button
                onClick={() => monthlyPriceId ? handlePayment(monthlyPriceId) : onUpgrade()}
                disabled={loading === monthlyPriceId}
                className="w-full bg-[#4D8FFF] hover:bg-[#3D7FEF]"
              >
                {loading === monthlyPriceId ? "Processing..." : "Start Free Trial"}
              </Button>
            </Card>

            <Card className="bg-[#4D8FFF] border-[#3D7FEF] p-6 space-y-4 relative overflow-hidden">
              <div className="absolute top-2 right-2 bg-[#4CAF50] text-white text-xs px-2 py-1 rounded">
                SAVE 40%
              </div>
              <div>
                <div className="text-sm mb-1">Annual</div>
                <div className="text-3xl">$59.99</div>
                <div className="text-sm">per year ($5/month)</div>
              </div>
              <Button
                onClick={() => annualPriceId ? handlePayment(annualPriceId) : onUpgrade()}
                disabled={loading === annualPriceId}
                variant="secondary"
                className="w-full bg-white text-[#4D8FFF] hover:bg-gray-100"
              >
                {loading === annualPriceId ? "Processing..." : "Start Free Trial"}
              </Button>
            </Card>
          </div>

          <p className="text-xs text-center text-[#E0E0E0]">
            7-day free trial • Cancel anytime • No commitment
          </p>
          <p className="text-xs text-center text-[#E0E0E0]">
            Note: Figma Make is not intended for collecting PII or securing sensitive data
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
