import React, { useEffect, useState } from "react";
import api from "../../../lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";
import LoadingSpinner from "../../shared/LoadingSpinner";
import { RefreshCw } from "lucide-react";
import { showError } from "../../shared/Toast";

export default function WhatsAppSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  // Fetch WhatsApp sessions from backend
  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await api.get("/sessions"); // ✅ backend route
      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      setSessions(data);
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
      showError("Failed to load WhatsApp sessions");
    } finally {
      setLoading(false);
    }
  };

  // Manual refresh button
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSessions();
    setTimeout(() => setRefreshing(false), 500);
  };

  if (loading) return <LoadingSpinner text="Loading WhatsApp sessions..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-800">
          WhatsApp Sessions Overview
        </h1>
        <Button
          onClick={handleRefresh}
          variant="outline"
          disabled={refreshing}
          className="border-gray-300 text-gray-700"
        >
          <RefreshCw
            className={`w-4 h-4 mr-1 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Session Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-green-500 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Connected Sessions</p>
            <h2 className="text-2xl font-semibold text-green-600">
              {sessions.filter((s) => s.status === "connected").length}
            </h2>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-yellow-500 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Pending Sessions</p>
            <h2 className="text-2xl font-semibold text-yellow-600">
              {sessions.filter((s) => s.status === "pending").length}
            </h2>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-red-500 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Disconnected Sessions</p>
            <h2 className="text-2xl font-semibold text-red-600">
              {sessions.filter((s) => s.status === "disconnected").length}
            </h2>
          </CardContent>
        </Card>
      </div>

      {/* Detailed List */}
      {sessions.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-300 py-10 text-center">
          <CardContent>
            <p className="text-gray-500">No WhatsApp sessions found.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-xl border shadow-sm">
          <CardHeader>
            <CardTitle>All WhatsApp Sessions</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-3">Phone Number</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Last Active</th>
                  <th className="p-3">Pending Messages</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr
                    key={s.sessionId}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <td className="p-3 font-medium text-gray-800">
                      {s.number || s.sessionId}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          s.status === "connected"
                            ? "bg-green-100 text-green-700"
                            : s.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="p-3 text-gray-700">
                      {s.lastMessageTime
                        ? new Date(s.lastMessageTime).toLocaleString()
                        : "—"}
                    </td>
                    <td className="p-3 text-gray-700">
                      {s.pendingMessages || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
