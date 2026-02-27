import React from "react";
import { Link } from "react-router-dom";

export default function PaymentCancelled() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 text-center p-6">
      <h1 className="text-4xl font-bold text-red-600 mb-2">
        Payment Failed ❌
      </h1>
      <p className="text-gray-600 mb-6">
        Your payment was cancelled or failed. You can try again or go back to the dashboard.
      </p>

      <div className="flex gap-4">
        <Link
          to="/pricing"
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry Payment
        </Link>
        <Link
          to="/dashboard"
          className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
