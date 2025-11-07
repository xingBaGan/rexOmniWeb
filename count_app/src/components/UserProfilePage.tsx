import { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { getCurrentUser, User } from "../services/auth";
import { cancelSubscription } from "../services/payment";
import { toast } from "sonner";
import { Home, Crown, Mail, Calendar, CreditCard, LogOut } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

type UserProfilePageProps = {
  onBack: () => void;
};

export function UserProfilePage({ onBack }: UserProfilePageProps) {
  const { signOut, getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const token = await getToken();
        if (token) {
          const data = await getCurrentUser(token);
          setUserData(data);
        }
      } catch (error) {
        console.error("Failed to load user data:", error);
        toast.error("Failed to load user data");
      }
    };

    loadUserData();
  }, [getToken]);

  const handleCancelSubscription = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (token) {
        await cancelSubscription(token);
        toast.success("Subscription canceled successfully");
        
        // Refresh user data
        const data = await getCurrentUser(token);
        setUserData(data);
      }
    } catch (error: any) {
      console.error("Cancel subscription error:", error);
      toast.error(error.message || "Failed to cancel subscription");
    } finally {
      setLoading(false);
      setShowCancelDialog(false);
    }
  };

  const handleSignOutConfirm = async () => {
    setShowSignOutDialog(false);
    await signOut();
  };

  const userInitials = clerkUser?.emailAddresses[0]?.emailAddress
    ?.charAt(0)
    .toUpperCase() || "U";

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#121212]">
      {/* Header */}
      <header className="border-b border-[#1F1F1F] py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-[#E0E0E0] hover:text-white"
          >
            <Home className="w-5 h-5 mr-2" />
            Back
          </Button>
          <h1 className="text-xl font-semibold">User Profile</h1>
          <div className="w-20"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Card */}
          <Card className="bg-[#1F1F1F] border-[#2F2F2F] p-6">
            <div className="flex items-start gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={clerkUser?.imageUrl} alt={clerkUser?.emailAddresses[0]?.emailAddress || ""} />
                <AvatarFallback className="bg-[#2F2F2F] text-white text-2xl">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-white">
                    {clerkUser?.firstName && clerkUser?.lastName
                      ? `${clerkUser.firstName} ${clerkUser.lastName}`
                      : "User"}
                  </h2>
                  <Badge
                    variant={userData?.tier === "pro" ? "default" : "outline"}
                    className={
                      userData?.tier === "pro"
                        ? "bg-[#4D8FFF] text-white"
                        : "border-[#4D8FFF] text-[#4D8FFF]"
                    }
                  >
                    {userData?.tier === "pro" ? (
                      <>
                        <Crown className="w-3 h-3 mr-1" />
                        Pro
                      </>
                    ) : (
                      "Free"
                    )}
                  </Badge>
                </div>
                <div className="space-y-2 text-[#E0E0E0]">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{clerkUser?.emailAddresses[0]?.emailAddress}</span>
                  </div>
                  {clerkUser?.createdAt && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Member since {formatDate(clerkUser.createdAt.toString())}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Usage Statistics */}
          <Card className="bg-[#1F1F1F] border-[#2F2F2F] p-6">
            <h3 className="text-xl font-semibold mb-4 text-white">Usage Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#2F2F2F] rounded-lg p-4">
                <div className="text-sm text-[#E0E0E0] mb-1">Daily Count</div>
                <div className="text-3xl font-bold text-[#4D8FFF]">
                  {userData?.dailyCount || 0}
                </div>
                <div className="text-xs text-[#E0E0E0] mt-1">
                  {userData?.tier === "free" ? "of 5 free counts" : "Unlimited"}
                </div>
              </div>
              <div className="bg-[#2F2F2F] rounded-lg p-4">
                <div className="text-sm text-[#E0E0E0] mb-1">Account Type</div>
                <div className="text-2xl font-bold text-white">
                  {userData?.tier === "pro" ? "Pro" : "Free"}
                </div>
                <div className="text-xs text-[#E0E0E0] mt-1">
                  {userData?.tier === "pro" ? "Full access" : "Limited access"}
                </div>
              </div>
            </div>
          </Card>

          {/* Subscription Information */}
          {userData?.tier === "pro" && (
            <Card className="bg-[#1F1F1F] border-[#2F2F2F] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Subscription
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[#E0E0E0]">Status</span>
                  <Badge className="bg-[#4CAF50] text-white">
                    {userData.subscriptionStatus === "active" ? "Active" : "Inactive"}
                  </Badge>
                </div>
                {userData.subscriptionEndDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#E0E0E0]">Renews on</span>
                    <span className="text-white">{formatDate(userData.subscriptionEndDate)}</span>
                  </div>
                )}
                <Button
                  onClick={() => setShowCancelDialog(true)}
                  variant="outline"
                  className="w-full border-[#F44336] text-[#F44336] hover:bg-[#F44336] hover:text-white mt-4"
                  disabled={loading}
                >
                  {loading ? "Canceling..." : "Cancel Subscription"}
                </Button>
              </div>
            </Card>
          )}

          {/* Actions */}
          <Card className="bg-[#1F1F1F] border-[#2F2F2F] p-6">
            <h3 className="text-xl font-semibold mb-4 text-white">Account Actions</h3>
            <div className="space-y-3">
              <Button
                onClick={() => setShowSignOutDialog(true)}
                variant="outline"
                className="w-full border-[#F44336] text-[#F44336] hover:bg-[#F44336] hover:text-white"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </Card>
        </div>
      </main>

      {/* Sign Out Confirmation Dialog */}
      <AlertDialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
        <AlertDialogContent className="bg-[#1F1F1F] border-[#2F2F2F] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Sign Out</AlertDialogTitle>
            <AlertDialogDescription className="text-[#E0E0E0]">
              Are you sure you want to sign out? You will need to sign in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#2F2F2F] border-[#3F3F3F] text-white hover:bg-[#3F3F3F]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSignOutConfirm}
              className="bg-[#F44336] hover:bg-[#D32F2F] text-white"
            >
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Subscription Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="bg-[#1F1F1F] border-[#2F2F2F] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Cancel Subscription</AlertDialogTitle>
            <AlertDialogDescription className="text-[#E0E0E0]">
              Are you sure you want to cancel your subscription? You will lose access to Pro features at the end of your current billing period.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#2F2F2F] border-[#3F3F3F] text-white hover:bg-[#3F3F3F]">
              Keep Subscription
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              className="bg-[#F44336] hover:bg-[#D32F2F] text-white"
              disabled={loading}
            >
              {loading ? "Canceling..." : "Cancel Subscription"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

