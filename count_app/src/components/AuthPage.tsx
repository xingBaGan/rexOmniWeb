import { SignIn, SignUp } from "@clerk/clerk-react";
import { useState } from "react";

type AuthPageProps = {
  mode?: "sign-in" | "sign-up";
};

export function AuthPage({ mode: initialMode = "sign-in" }: AuthPageProps) {
  const [mode, setMode] = useState<"sign-in" | "sign-up">(initialMode);

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
                formButtonPrimary: "bg-[#4D8FFF] hover:bg-[#3D7FEF]",
                formFieldInput: "bg-[#2F2F2F] border-[#3F3F3F] text-white",
                formFieldLabel: "text-white",
                footerActionLink: "text-[#4D8FFF]",
                identityPreviewText: "text-white",
                identityPreviewEditButton: "text-[#4D8FFF]",
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
                formButtonPrimary: "bg-[#4D8FFF] hover:bg-[#3D7FEF]",
                formFieldInput: "bg-[#2F2F2F] border-[#3F3F3F] text-white",
                formFieldLabel: "text-white",
                footerActionLink: "text-[#4D8FFF]",
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

