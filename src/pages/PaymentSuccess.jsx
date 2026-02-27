import React, { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import api from "../lib/api";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await api.get(`/checkout/session/${sessionId}`);
        if (res.data.success) {
          setSession(res.data.session);
        } else {
          console.error("Failed to load session details");
          navigate("/billing/cancel");
        }
      } catch (err) {
        console.error("Error fetching session:", err);
        navigate("/billing/cancel");
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) fetchSession();
  }, [sessionId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading payment details...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-50">
        <h1 className="text-3xl font-semibold text-red-600">
          Invalid or expired session
        </h1>
        <Link
          to="/pricing"
          className="mt-6 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Back to Pricing
        </Link>
      </div>
    );
  }

  const amount =
    session.amount_total || session.amount_subtotal || 0;
  const currency = session.currency?.toUpperCase();
  const planName = session.metadata?.planKey || "Subscription Plan";
  const interval = session.metadata?.interval || "month";
  const paymentStatus = session.payment_status || "unknown";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 text-center p-6">
      <h1 className="text-4xl font-bold text-green-600 mb-2">
        Payment Successful 🎉
      </h1>
      <p className="text-gray-700 mb-6">
        Thank you for your purchase! Your subscription is now active.
      </p>

      <div className="bg-white shadow-md rounded-lg p-6 text-left max-w-md w-full mb-6">
        <h2 className="text-lg font-semibold mb-2 text-gray-800">
          Payment Details
        </h2>
        <p className="text-sm text-gray-600">
          <strong>Plan:</strong> {planName} ({interval})
        </p>
        <p className="text-sm text-gray-600">
          <strong>Amount Paid:</strong> {(amount / 100).toFixed(2)} {currency}
        </p>
        <p className="text-sm text-gray-600">
          <strong>Status:</strong>{" "}
          <span
            className={`font-medium ${
              paymentStatus === "paid"
                ? "text-green-600"
                : paymentStatus === "unpaid"
                ? "text-red-600"
                : "text-yellow-600"
            }`}
          >
            {paymentStatus}
          </span>
        </p>
        <p className="text-sm text-gray-600">
          <strong>Transaction ID:</strong>{" "}
          {session.payment_intent || "N/A"}
        </p>
      </div>

      <div className="flex gap-4">
        <Link
          to="/dashboard"
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Go to Dashboard
        </Link>
        <Link
          to="/billing"
          className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
        >
          Manage Subscription
        </Link>
      </div>
    </div>
  );
}
