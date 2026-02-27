import { useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "sonner";

export default function VerifyOtpForm({ email, onSuccess }) {
  const { verifyOtp } = useAuth();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyOtp(email, otp);
      toast.success("OTP verified successfully! You can now log in.");
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-center">
      {/* ✅ Replaced DialogTitle / Description with plain elements */}
      <h2 className="text-2xl font-semibold text-gray-800">Verify Email</h2>
      <p className="text-gray-500 mb-4">
        Enter the OTP sent to{" "}
        <span className="font-medium text-gray-700">{email}</span>.
      </p>

      <Input
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        placeholder="Enter OTP"
        required
      />

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Verifying..." : "Verify OTP"}
      </Button>
    </form>
  );
}
