import { useState } from "react";
import api from "../../lib/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { toast } from "sonner";

export default function TwoFactorSetup() {
  const [secret, setSecret] = useState(null);
  const [otp, setOtp] = useState("");
  const [verified, setVerified] = useState(false);

  const enable2FA = async () => {
    try {
      const res = await api.post("/2fa/generate"); // JWT required
      setSecret(res.data.secret);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate secret");
    }
  };

  const verify2FA = async () => {
    try {
      const res = await api.post("/2fa/verify", { token: otp });
      if (res.data.success) {
        setVerified(true);
        toast.success("2FA setup verified successfully!");
      } else {
        toast.error("Invalid OTP. Try again.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed");
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md space-y-4">
      <h2 className="text-xl font-semibold">Two-Factor Authentication (2FA)</h2>

      {!secret && !verified && (
        <Button onClick={enable2FA}>Enable 2FA</Button>
      )}

      {secret && !verified && (
        <div className="space-y-3">
          <p className="text-gray-700">
            Enter this key manually into Google Authenticator:
          </p>
          <div className="font-mono bg-gray-100 p-2 rounded text-lg text-center select-all">
            {secret}
          </div>
          <p className="text-sm text-gray-500">
            Then enter the 6-digit code shown in your app:
          </p>
          <div className="flex gap-2">
            <Input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
            />
            <Button onClick={verify2FA}>Verify</Button>
          </div>
        </div>
      )}

      {verified && (
        <p className="text-green-600 font-medium">✅ 2FA Enabled Successfully</p>
      )}
    </div>
  );
}
