// src/pages/Pricing.jsx
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Crown, Loader2 } from "lucide-react";
import api from "../lib/api";
import SubscriptionCheckout from "../components/subscription/SubscriptionCheckout";

export default function Pricing() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await api.get("/plans"); // ✅ same as SubscriptionManagement
      setPlans(res.data?.plans || []); // ✅ unwrap `plans` key
    } catch (err) {
      console.error("Error fetching plans:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setCheckoutOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="py-12 px-6 lg:px-12">
      <div className="max-w-6xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900">Choose Your Plan</h1>
        <p className="mt-2 text-lg text-gray-600">
          Flexible pricing for businesses of all sizes
        </p>
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
        {plans.length > 0 ? (
          plans.map((plan) => (
            <Card
              key={plan._id}
              className="flex flex-col justify-between rounded-xl shadow-sm  hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-semibold">
                  <Crown className="w-5 h-5 text-purple-600" />
                  {plan.name}
                </CardTitle>
                <p className="text-gray-500 mt-1">{plan.description}</p>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 justify-between space-y-4">
                <div>
                  <p className="text-3xl font-bold text-gray-900">
                    ${plan.prices?.[0]?.amount || 0}
                    <span className="text-lg font-medium text-gray-600">
                      /{plan.prices?.[0]?.interval || "month"}
                    </span>
                  </p>
                  {plan.badge && (
                    <Badge className="mt-2 bg-purple-100 text-purple-700">
                      {plan.badge}
                    </Badge>
                  )}
                </div>

                <ul className="text-sm text-gray-600 space-y-2 mt-4">
                  {Array.isArray(plan.features) && plan.features.length > 0 ? (
                    plan.features.map((f, i) => (
                      <li key={i} className="flex items-center">
                        ✅ {f.key}: {String(f.value)}
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-400">No features listed</li>
                  )}
                </ul>

                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white mt-6"
                  onClick={() => handleSelectPlan(plan)}
                >
                  Subscribe
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-center text-gray-500 col-span-3">
            No plans available right now.
          </p>
        )}
      </div>

      {/* Checkout Modal */}
      <SubscriptionCheckout
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        plan={selectedPlan}
      />
    </div>
  );
}
