import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import api from "../../lib/api";

export default function MessageStats() {
  const [data, setData] = useState([]);
  const [range, setRange] = useState("12");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMessages() {
      setLoading(true);
      try {
        const res = await api.get("/messages");
        const messages = res.data?.data || res.data?.history || [];

        const now = new Date();
        const hours = parseInt(range, 10);
        const fromTime = new Date(now.getTime() - hours * 60 * 60 * 1000);

        const recent = messages.filter(
          (m) => new Date(m.createdAt) >= fromTime
        );

        const grouped = {};
        for (let i = 0; i <= hours; i++) {
          const hour = new Date(fromTime.getTime() + i * 60 * 60 * 1000);
          const label = hour.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          grouped[label] = { time: label, sent: 0, failed: 0 };
        }

        recent.forEach((msg) => {
          const msgTime = new Date(msg.createdAt);
          const label = msgTime.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          if (!grouped[label])
            grouped[label] = { time: label, sent: 0, failed: 0 };
          if (msg.status === "sent") grouped[label].sent += 1;
          else grouped[label].failed += 1;
        });

        setData(Object.values(grouped));
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchMessages();
    const interval = setInterval(fetchMessages, 60 * 1000);
    return () => clearInterval(interval);
  }, [range]);

  const totalSent = data.reduce((sum, item) => sum + item.sent, 0);
  const totalFailed = data.reduce((sum, item) => sum + item.failed, 0);
  const successRate = totalSent + totalFailed > 0
    ? ((totalSent / (totalSent + totalFailed)) * 100).toFixed(1)
    : 0;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface px-4 py-3 rounded-lg shadow-lg border border-border">
          <p className="text-xs font-semibold text-text-secondary mb-2">{payload[0].payload.time}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm font-medium text-text-dark">
                {entry.name}: <span className="font-bold">{entry.value}</span>
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-text-dark">
            Messages Activity
          </h2>
          <p className="text-xs text-text-muted mt-1">Real-time message tracking</p>
        </div>

        {/* Range Selector */}
        <div className="flex gap-1 bg-page-bg p-1 rounded-lg border border-border">
          {["12", "24"].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                range === r
                  ? "bg-primary text-white shadow-sm"
                  : "text-text-secondary hover:bg-surface"
              }`}
            >
              Last {r}h
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      {!loading && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-success-light p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-success" />
              <p className="text-xs font-semibold text-success">Sent</p>
            </div>
            <p className="text-2xl font-bold text-text-dark">{totalSent}</p>
          </div>

          <div className="bg-danger-light p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-danger" />
              <p className="text-xs font-semibold text-danger">Failed</p>
            </div>
            <p className="text-2xl font-bold text-text-dark">{totalFailed}</p>
          </div>

          <div className="bg-primary-light p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <p className="text-xs font-semibold text-primary">Success Rate</p>
            </div>
            <p className="text-2xl font-bold text-text-dark">{successRate}%</p>
          </div>
        </div>
      )}

      {/* Chart */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="flex space-x-2 mb-3">
            <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
            <div className="w-3 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="w-3 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
          <p className="text-text-muted text-sm font-medium">Loading chart...</p>
        </div>
      ) : (
        <div className="bg-page-bg rounded-lg p-4 border border-border">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data}>
              <XAxis
                dataKey="time"
                stroke="#6b7280"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickLine={{ stroke: '#d1d5db' }}
              />
              <YAxis
                allowDecimals={false}
                stroke="#6b7280"
                tick={{ fill: '#6b7280', fontSize: 12 }}
                tickLine={{ stroke: '#d1d5db' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              <Line
                type="monotone"
                dataKey="sent"
                stroke="#22c55e"
                name="Sent"
                strokeWidth={3}
                dot={{ fill: '#22c55e', r: 4 }}
                activeDot={{ r: 6, fill: '#22c55e', stroke: '#fff', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="failed"
                stroke="#ef4444"
                name="Failed"
                strokeWidth={3}
                dot={{ fill: '#ef4444', r: 4 }}
                activeDot={{ r: 6, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
