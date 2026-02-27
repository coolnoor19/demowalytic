// src/components/auth/AuthModal.jsx
import { Dialog, DialogContent } from "../ui/dialog";
import { useState, useEffect } from "react";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import VerifyOtpForm from "./VerifyOtpForm";

export default function AuthModal({
  open,
  onOpenChange,
  initialStep = "login",
  inlineMode = false, // 👈 new prop
}) {
  const [step, setStep] = useState(initialStep);
  const [pendingEmail, setPendingEmail] = useState(null);

  useEffect(() => {
    if (open) setStep(initialStep);
  }, [open, initialStep]);

  // The core form content
  const renderForm = () => {
    switch (step) {
      case "login":
        return (
          <LoginForm
            onSwitchToSignup={() => setStep("signup")}
            onSuccess={() => {
              if (!inlineMode) onOpenChange(false);
            }}
          />
        );
      case "signup":
        return (
          <SignupForm
            onSwitchToLogin={() => setStep("login")}
            onOtpSent={(email) => {
              setPendingEmail(email);
              setStep("verifyOtp");
            }}
          />
        );
      case "verifyOtp":
        return (
          <VerifyOtpForm
            email={pendingEmail}
            onSuccess={() => setStep("login")}
          />
        );
      default:
        return null;
    }
  };

  // ✅ Inline mode (no popup)
  if (inlineMode) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        {renderForm()}
      </div>
    );
  }

  // ✅ Default modal mode
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {renderForm()}
      </DialogContent>
    </Dialog>
  );
}
