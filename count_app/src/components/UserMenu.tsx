import React from "react";
import { useUser } from "@clerk/clerk-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

type UserMenuProps = {
  onNavigateProfile?: () => void;
};

export function UserMenu({ onNavigateProfile }: UserMenuProps) {
  const { user: clerkUser } = useUser();

  const userInitials = clerkUser?.emailAddresses[0]?.emailAddress
    ?.charAt(0)
    .toUpperCase() || "U";

  const handleAvatarClick = () => {
    if (onNavigateProfile) {
      onNavigateProfile();
    }
  };

  return (
    <Button 
      variant="ghost" 
      className="relative h-10 w-10 rounded-full cursor-pointer"
      onClick={handleAvatarClick}
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={clerkUser?.imageUrl} alt={clerkUser?.emailAddresses[0]?.emailAddress || ""} />
        <AvatarFallback className="bg-[#2F2F2F] text-white">
          {userInitials}
        </AvatarFallback>
      </Avatar>
    </Button>
  );
}
