import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Crown, ArrowUpRight, Loader2, Shield } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../lib/api";

export function PlanDisplay({ onViewPlansClick }) {
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const res = await api.get("/me/subscription");
      setSubscription(res.data?.subscription || null);
    } catch (error) {
      console.error("Error fetching subscription:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-sm text-text-muted font-medium">Loading plan details...</p>
        </CardContent>
      </Card>
    );
  }

  const isExpired =
    subscription && subscription.status && subscription.status !== "active";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              isAdmin
                ? "bg-primary-light"
                : "bg-primary-light"
            }`}>
              {isAdmin ? (
                <Shield className="w-5 h-5 text-primary" />
              ) : (
                <Crown className="w-5 h-5 text-primary" />
              )}
            </div>
            <span className="text-text-dark">Current Plan</span>
          </CardTitle>

          <Badge
            variant={
              isAdmin
                ? "primary"
                : !subscription
                ? "default"
                : isExpired
                ? "danger"
                : "success"
            }
          >
            {isAdmin
              ? "Admin Access"
              : !subscription
              ? "No Plan"
              : isExpired
              ? "Expired"
              : "Active"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isAdmin ? (
          <div className="p-4 rounded-lg bg-page-bg">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2" />
              <div>
                <p className="text-lg font-bold text-primary mb-1">
                  Administrator Access
                </p>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Full platform access with admin privileges
                </p>
              </div>
            </div>
          </div>
        ) : !subscription ? (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-page-bg">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-2 h-2 rounded-full bg-text-muted mt-2" />
                <div>
                  <p className="text-lg font-bold text-text-secondary mb-1">
                    No Active Plan
                  </p>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Subscribe to unlock premium features
                  </p>
                </div>
              </div>
            </div>

            <Button
              size="sm"
              className="w-full py-5"
              onClick={onViewPlansClick}
            >
              <Crown className="w-4 h-4 mr-2" />
              Choose Plan
            </Button>
          </div>
        ) : isExpired ? (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-danger-light">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-2 h-2 rounded-full bg-danger mt-2" />
                <div>
                  <p className="text-lg font-bold text-danger mb-2">
                    Plan Expired
                  </p>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Your <span className="font-bold">{subscription.planKey}</span>{" "}
                    plan expired on{" "}
                    <span className="font-bold">
                      {new Date(subscription.current_period_end).toLocaleDateString()}
                    </span>
                    . Please renew to continue using premium features.
                  </p>
                </div>
              </div>
            </div>

            <Button
              size="sm"
              variant="destructive"
              className="w-full py-5"
              onClick={onViewPlansClick}
            >
              <ArrowUpRight className="w-4 h-4 mr-2" />
              Renew Plan
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-page-bg">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <div>
                  <p className="text-lg font-bold text-primary mb-2">
                    Active Subscription
                  </p>
                  <div className="space-y-1">
                    <p className="text-sm text-text-secondary">
                      <span className="font-semibold">Plan:</span>{" "}
                      <span className="font-bold text-primary">
                        {subscription.planKey}
                      </span>
                    </p>
                    <p className="text-sm text-text-secondary">
                      <span className="font-semibold">Billing:</span>{" "}
                      <span className="font-medium text-text-dark">
                        {subscription.billingCycle || subscription.interval}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              className="w-full py-5"
              onClick={onViewPlansClick}
            >
              <ArrowUpRight className="w-4 h-4 mr-2" />
              View All Plans
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
