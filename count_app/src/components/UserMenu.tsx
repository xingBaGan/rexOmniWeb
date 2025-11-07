import { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { getCurrentUser, User } from "../services/auth";
import { cancelSubscription } from "../services/payment";
import { toast } from "sonner";
import { LogOut, Crown, Settings } from "lucide-react";

export function UserMenu() {
  const { signOut, getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

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
      }
    };

    loadUserData();
  }, [getToken]);

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your subscription?")) {
      return;
    }

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
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const userInitials = clerkUser?.emailAddresses[0]?.emailAddress
    ?.charAt(0)
    .toUpperCase() || "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={clerkUser?.imageUrl} alt={clerkUser?.emailAddresses[0]?.emailAddress || ""} />
            <AvatarFallback className="bg-[#2F2F2F] text-white">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-[#1F1F1F] border-[#2F2F2F] text-white" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-white">
              {clerkUser?.emailAddresses[0]?.emailAddress}
            </p>
            <div className="flex items-center gap-2 mt-1">
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
            {userData?.tier === "free" && userData?.dailyCount !== undefined && (
              <p className="text-xs text-[#E0E0E0]">
                {userData.dailyCount}/5 counts today
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-[#2F2F2F]" />
        {userData?.tier === "pro" && (
          <>
            <DropdownMenuItem
              onClick={handleCancelSubscription}
              disabled={loading}
              className="text-[#E0E0E0] hover:bg-[#2F2F2F] cursor-pointer"
            >
              <Settings className="mr-2 h-4 w-4" />
              {loading ? "Canceling..." : "Cancel Subscription"}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#2F2F2F]" />
          </>
        )}
        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-[#E0E0E0] hover:bg-[#2F2F2F] cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

