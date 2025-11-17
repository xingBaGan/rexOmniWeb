import React, { useState, useEffect } from "react";
import { SignIn, SignUp, useAuth } from "@clerk/clerk-react";

type AuthPageProps = {
  mode?: "sign-in" | "sign-up";
  onLoginSuccess?: () => void;
};

export function AuthPage({ mode: initialMode = "sign-in", onLoginSuccess }: AuthPageProps) {
  const [mode, setMode] = useState<"sign-in" | "sign-up">(initialMode);
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (isSignedIn && onLoginSuccess) {
      onLoginSuccess();
    }
  }, [isSignedIn, onLoginSuccess]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121212] p-4">
      <div className="w-full max-w-md">
        {mode === "sign-in" ? (
          <SignIn
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "bg-[#1F1F1F] border-[#2F2F2F]",
                headerTitle: "text-white",
                headerSubtitle: "text-[#E0E0E0]",
                socialButtonsBlockButton: "bg-[#2F2F2F] text-white hover:bg-[#3F3F3F] border-[#3F3F3F]",
                socialButtonsBlockButtonText: "text-white",
                socialButtonsBlockButtonArrow: "text-white",
                formButtonPrimary: "bg-[#4D8FFF] hover:bg-[#3D7FEF]",
                formFieldInput: "bg-[#2F2F2F] border-[#3F3F3F] text-white",
                formFieldLabel: "text-white",
                footerActionLink: "text-[#4D8FFF]",
                identityPreviewText: "text-white",
                identityPreviewEditButton: "text-[#4D8FFF]",
                dividerLine: "bg-[#3F3F3F]",
                dividerText: "text-[#E0E0E0]",
              },
            }}
            routing="hash"
            afterSignInUrl="/"
            signUpUrl="#/sign-up"
          />
        ) : (
          <SignUp
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "bg-[#1F1F1F] border-[#2F2F2F]",
                headerTitle: "text-white",
                headerSubtitle: "text-[#E0E0E0]",
                socialButtonsBlockButton: "bg-[#2F2F2F] text-white hover:bg-[#3F3F3F] border-[#3F3F3F]",
                socialButtonsBlockButtonText: "text-white",
                socialButtonsBlockButtonArrow: "text-white",
                formButtonPrimary: "bg-[#4D8FFF] hover:bg-[#3D7FEF]",
                formFieldInput: "bg-[#2F2F2F] border-[#3F3F3F] text-white",
                formFieldLabel: "text-white",
                footerActionLink: "text-[#4D8FFF]",
                dividerLine: "bg-[#3F3F3F]",
                dividerText: "text-[#E0E0E0]",
              },
            }}
            routing="hash"
            afterSignUpUrl="/"
            signInUrl="#/sign-in"
          />
        )}
      </div>
    </div>
  );
}

