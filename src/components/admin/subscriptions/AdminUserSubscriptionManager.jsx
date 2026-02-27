import React, { useEffect, useState } from "react";
import api from "../../../lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";
import LoadingSpinner from "../../shared/LoadingSpinner";
import AssignPlanModal from "./AssignPlanModal";
import { showError } from "../../shared/Toast";

export default function AdminUserSubscriptionManager() {
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [usersRes, plansRes] = await Promise.all([
        api.get("/admin/users"),
        api.get("/admin/plans"),
      ]);

      // Filter out admins
      const usersData =
        usersRes.data?.data?.filter((u) => u.role !== "admin") || [];

      const plansData = plansRes.data?.plans || plansRes.data?.data || [];
      setUsers(usersData);
      setPlans(plansData);

      // Fetch each user's subscription
      const subs = {};
      for (const user of usersData) {
        try {
         const res = await api.get(`/admin/users/${user._id}/subscription`);


          const { subscription, plan } = res.data || {};

          if (subscription && plan) {
            subs[user._id] = {
              userId: user._id,
              planName: plan.name,
              planKey: plan.key,
              interval:
                subscription.interval ||
                plan.defaultInterval ||
                "month",
              status: subscription.status || "inactive",
              nextRenewal: subscription.current_period_end,
            };
          } else {
            subs[user._id] = null;
          }
        } catch (err) {
          console.warn(`Subscription fetch failed for ${user.email}`);
          subs[user._id] = null;
        }
      }

      setSubscriptions(subs);
    } catch (err) {
      console.error("Failed to fetch subscriptions:", err);
      showError("Failed to load users or plans");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d)) return "—";
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">
            Active
          </span>
        );
      case "expired":
      case "canceled":
        return (
          <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold">
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-semibold">
            Inactive
          </span>
        );
    }
  };

  if (loading) return <LoadingSpinner text="Loading subscriptions..." />;

  return (
    <div className="space-y-8">
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>User Subscriptions</CardTitle>
            <Button onClick={() => setOpenModal(true)}>Assign Plan</Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b text-gray-700 bg-gray-50">
                  <th className="p-3">User</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Plan</th>
                  <th className="p-3">Interval</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Next Renewal</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const sub = subscriptions[u._id];
                  return (
                    <tr
                      key={u._id}
                      className="border-b hover:bg-gray-50 transition"
                    >
                      <td className="p-3 font-medium">
                        {u.name || u.username || "—"}
                      </td>
                      <td className="p-3 text-gray-600">{u.email}</td>
                      <td className="p-3">{sub?.planName || "—"}</td>
                      <td className="p-3 capitalize">
                        {sub?.interval === "year"
                          ? "Yearly"
                          : sub?.interval === "month"
                          ? "Monthly"
                          : "—"}
                      </td>
                      <td className="p-3">{renderStatusBadge(sub?.status)}</td>
                      <td className="p-3">{formatDate(sub?.nextRenewal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Assign Plan Modal */}
      <AssignPlanModal
        users={users}
        plans={plans}
        open={openModal}
        onClose={() => setOpenModal(false)}
        onAssigned={fetchAllData}
      />
    </div>
  );
}
