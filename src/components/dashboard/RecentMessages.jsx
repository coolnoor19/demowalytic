import { useEffect, useState } from "react";
import api from "../../lib/api";
import { Badge } from "../ui/badge";

export function RecentMessages() {
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await api.get("/sessions");
        const list = res.data?.data || [];
        setSessions(list);

        const connected = list.find((s) => s.status === "connected");
        if (connected && !sessionId) setSessionId(connected.sessionId);
      } catch (err) {
        console.error("Failed to fetch sessions:", err);
        setSessions([]);
      }
    };

    fetchSessions();
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    async function fetchHistory() {
      setLoading(true);
      try {
        const res = await api.get(`/whatsapp/${sessionId}/history`);
        const allMsgs = res.data.data || [];

        const outgoing = allMsgs.filter((m) => m.direction === "out");
        const sorted = outgoing.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setMessages(sorted);
      } catch (err) {
        console.error("Failed to load history:", err);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
    const interval = setInterval(fetchHistory, 5000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const statusBadge = (status) => {
    switch (status) {
      case "sent":
        return <Badge variant="success">Sent</Badge>;
      case "delivered":
        return <Badge variant="primary">Delivered</Badge>;
      case "read":
        return <Badge variant="primary">Read</Badge>;
      default:
        return <Badge variant="warning">Pending</Badge>;
    }
  };

  return (
    <div>
      {/* Session selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-text-secondary mb-1">
          Select WhatsApp Session
        </label>
        <select
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
        >
          <option value="">-- Select Session --</option>
          {sessions.map((s) => (
            <option key={s.sessionId} value={s.sessionId}>
              {s.number} ({s.status})
            </option>
          ))}
        </select>
      </div>

      {/* Message list */}
      {loading ? (
        <p className="text-text-secondary text-sm">Loading messages...</p>
      ) : messages.length === 0 ? (
        <p className="text-sm text-text-secondary">No outgoing messages yet.</p>
      ) : (
        <ul className="space-y-3">
          {messages.map((msg) => (
            <li
              key={msg._id}
              className="p-3 border border-border rounded-lg bg-page-bg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-full bg-primary-light flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary">
                    {msg.recipient?.replace("@s.whatsapp.net", "").slice(-2)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-dark truncate">
                    {msg.recipient?.replace("@s.whatsapp.net", "")}
                  </p>
                  <p className="text-xs text-text-secondary truncate mt-0.5">
                    {msg.content}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {statusBadge(msg.status)}
                  <span className="text-xs text-text-muted">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
