import React, { useEffect, useState } from "react";
import api from "../../../lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "../../ui/card";
import AnalyticsCards from "./AnalyticsCards";
import LoadingSpinner from "../../shared/LoadingSpinner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { showError } from "../../shared/Toast";

export default function AdminAnalytics() {
  const [stats, setStats] = useState({
    users: 0,
    subscriptions: 0,
    plans: 0,
    sessions: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

const fetchAnalytics = async () => {
  try {
    setLoading(true);

    // Helper function for safe API call
    const safeApi = async (url) => {
      try {
        const res = await api.get(url);
        return res?.data || {};
      } catch (err) {
        console.warn(`⚠️ Failed to fetch ${url}:`, err.message);
        return {};
      }
    };

    // Fetch everything safely
    const [usersRes, plansRes, sessionsRes, activeSubsRes] = await Promise.all([
      safeApi("/admin/users"),
      safeApi("/admin/plans"),
      safeApi("/sessions"),
      safeApi("/admin/subscriptions/active-count"),
    ]);

    // Normalize data (avoid undefined errors)
    const users = Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.data || [];
    const plans = Array.isArray(plansRes.plans)
      ? plansRes.plans
      : plansRes.data?.plans || plansRes.data || [];
    const sessions = Array.isArray(sessionsRes.data)
      ? sessionsRes.data.filter((s) => s.status === "connected")
      : [];

    const activeSubsCount = activeSubsRes?.count || activeSubsRes?.data?.count || 0;

    // Prepare chart data
    const usageData = plans.map((plan) => ({
      name: plan.name || plan.key,
      users: users.filter((u) => u.planKey === plan.key).length,
    }));

    setStats({
      users: users.length,
      plans: plans.length,
      sessions: sessions.length,
      subscriptions: activeSubsCount, // ✅ real active subs
    });

    setChartData(usageData);
  } catch (err) {
    console.error("Analytics fetch error:", err);
    showError("Failed to load analytics data");
  } finally {
    setLoading(false);
  }
};


  if (loading) return <LoadingSpinner text="Loading analytics..." />;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <AnalyticsCards stats={stats} />

      {/* Chart */}
      <Card className="rounded-xl border shadow-sm">
        <CardHeader>
          <CardTitle>Plan Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              No plan data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="users" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
