import React, { useEffect, useState } from "react";
import api from "../../lib/api";

export default function SubscriptionManagement() {
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlansAndSub();
  }, []);

  async function fetchPlansAndSub() {
    try {
      setLoading(true);
      const [plansRes, subRes] = await Promise.all([
        api.get("/plans"),
        api.get("/me/subscription"),
      ]);
      setPlans(plansRes.data?.plans || []);
      setSubscription(subRes.data?.subscription || null);
    } catch (err) {
      console.error("Error loading subscription data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubscribe(planId) {
    try {
      const res = await api.post(`/checkout/${planId}`);
      if (res.data?.url) {
        window.location.href = res.data.url; // redirect to Stripe checkout
      }
    } catch (err) {
      console.error("Checkout error:", err);
    }
  }

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-xl shadow text-center">
        <p className="text-gray-500">Loading subscription...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Manage Subscription</h2>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const isActive = subscription?.planKey === plan.key && subscription?.status === "active";
          return (
            <div
              key={plan._id}
              className={`p-6 rounded-xl shadow-sm border transition ${
                isActive ? "border-green-500 bg-green-50" : "border-gray-200 bg-white"
              }`}
            >
              {plan.badge && (
                <span className="inline-block mb-2 text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  {plan.badge}
                </span>
              )}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="text-sm text-gray-600">{plan.description}</p>

              <p className="text-3xl font-bold mt-4">
                ${plan.prices[0]?.amount || 0}
                <span className="text-sm font-normal text-gray-500">
                  /{plan.prices[0]?.interval || "month"}
                </span>
              </p>

              <ul className="mt-4 space-y-1 text-sm text-gray-600">
                {plan.features?.map((f, i) => (
                  <li key={i}>✅ {f.key}: {String(f.value)}</li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan._id)}
                disabled={isActive}
                className={`mt-6 w-full py-2 rounded-lg font-medium ${
                  isActive
                    ? "bg-gray-300 text-gray-700 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {isActive ? "Current Plan" : "Subscribe"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
