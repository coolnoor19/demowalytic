import React, { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { PlanDisplay } from "../components/dashboard/PlanDisplay";
import Pricing from "../pages/Pricing";

export default function Billing() {
  const pricingRef = useRef(null);
  const location = useLocation();

  const handleViewPlansClick = () => {
    pricingRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // ✅ Scroll to pricing section if user arrived with /billing#pricing
  useEffect(() => {
    if (location.hash === "#pricing" && pricingRef.current) {
      setTimeout(() => {
        pricingRef.current.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }
  }, [location]);

  return (
    <div className="space-y-12">
      {/* Current Plan Section */}
      <div className="bg-surface rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-text-dark mb-4">Billing & Subscription</h2>
        <PlanDisplay onViewPlansClick={handleViewPlansClick} />
      </div>

      {/* Pricing Section */}
      <div ref={pricingRef} id="pricing" className="bg-surface rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-6">Available Plans</h2>
        <Pricing />
      </div>
    </div>
  );
}
