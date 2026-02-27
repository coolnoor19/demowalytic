import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/api";
import { useAuth } from "./AuthContext"; // ✅ import AuthContext for token

const SubscriptionContext = createContext();

export function SubscriptionProvider({ children }) {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  const { token } = useAuth(); // ✅ wait for user auth

  /* ---------------- Fetch Subscription ---------------- */
  const fetchSubscription = async () => {
    if (!token) return; // 🛑 skip if not authenticated
    try {
      setLoading(true);
      const res = await api.get("/me/subscription");
      // backend should return { success: true, data: {...} }
      setSubscription(res.data?.data || res.data || null);
    } catch (err) {
      console.error("❌ Failed to fetch subscription:", err);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- Run when token changes ---------------- */
  useEffect(() => {
    if (!token) return; // ✅ only fetch once user has a token
    fetchSubscription();
  }, [token]);

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        loading,
        refreshSubscription: fetchSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export const useSubscription = () => useContext(SubscriptionContext);
