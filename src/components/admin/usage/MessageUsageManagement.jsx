import React, { useEffect, useState } from "react";
import api from "../../../lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "../../ui/card";
import LoadingSpinner from "../../shared/LoadingSpinner";
import { showError } from "../../shared/Toast";
import UsageChart from "./UsageChart";

export default function MessageUsageManagement() {
  const [usageData, setUsageData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsageData();
  }, []);

  const fetchUsageData = async () => {
    try {
      setLoading(true);

      // 1️⃣ Fetch all users
      const usersRes = await api.get("/admin/users");
      const users = usersRes.data?.data || [];

      // 2️⃣ For each user, fetch their subscription usage
      const usagePromises = users.map((u) =>
        api
          .get(`/admin/users/${u._id}/subscription`)
          .then((r) => {
            const usageArr = r.data?.subscription?.usage || [];
            const messagesUsed =
              usageArr.find((f) => f.key === "messages")?.used || 0;

            return {
              user: u.name || u.email,
              messages: messagesUsed,
            };
          })
          .catch((err) => {
            console.warn(`⚠️ Failed for user ${u.email}:`, err.message);
            return { user: u.name || u.email, messages: 0 };
          })
      );

      const results = await Promise.all(usagePromises);

      const formatted = results.map((item) => ({
        name: item.user,
        messages: item.messages,
      }));

      setUsageData(formatted);
    } catch (err) {
      console.error("❌ Failed to fetch usage:", err);
      showError("Failed to load message usage data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading message usage..." />;

  return (
    <div className="space-y-8">
      {/* Chart Section */}
      <UsageChart data={usageData} />

      {/* Table Section */}
      <Card className="rounded-xl border shadow-sm">
        <CardHeader>
          <CardTitle>Detailed Usage by User</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Messages Used</th>
              </tr>
            </thead>
            <tbody>
              {usageData.map((item, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50 transition">
                  <td className="p-3">{item.name}</td>
                  <td className="p-3">{item.messages}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
