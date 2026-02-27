import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../lib/api";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async () => {
    try {
      setLoading(true);
      await api.post("/auth/reset-password", { email, token, password });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-6">
        <h1 className="text-xl font-bold mb-4">Reset Password</h1>
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-4"
        />
        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
        <button
          onClick={handleReset}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </div>
    </div>
  );
}
