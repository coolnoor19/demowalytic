// src/components/subscription/SubscriptionCheckout.jsx
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Loader2, Crown } from "lucide-react";
import api from "../../lib/api";

export default function SubscriptionCheckout({ isOpen, onClose, plan }) {
  const [isLoading, setIsLoading] = useState(false);

  if (!plan) return null; // nothing if no plan selected

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
const res = await api.post(`/checkout/${plan._id}`);
      if (res.data?.url) {
        window.location.href = res.data.url; // redirect to Stripe checkout
      } else {
        alert("Failed to create checkout session");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Error starting checkout. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-xl shadow-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <Crown className="w-5 h-5 text-purple-600" />
            Subscribe to {plan.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-gray-600">
            {plan.description || "Get full access to premium features."}
          </p>
          <p className="text-xl font-bold text-gray-900">
            ${plan.price}/month
          </p>

          <Button
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            onClick={handleCheckout}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Redirecting...
              </>
            ) : (
              "Proceed to Checkout"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
