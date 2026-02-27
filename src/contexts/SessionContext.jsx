import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/api";
import { socket } from "../socket";
import { useAuth } from "./AuthContext";

const SessionContext = createContext();

export function SessionProvider({ children }) {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [loading, setLoading] = useState(true);

  const { token } = useAuth(); // ✅ wait for valid JWT before fetching

  /* ---------------- Fetch All Sessions ---------------- */
  const fetchSessions = async () => {
    if (!token) return; // 🛑 prevent 401 calls before login
    try {
      setLoading(true);
      const res = await api.get("/sessions");
      const data = res?.data?.data ?? res?.data ?? [];
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Failed to fetch sessions:", err);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- Start New WhatsApp Session ---------------- */
  const startSession = async (phoneNumber) => {
    if (!token) throw new Error("Not authorized");
    try {
      await api.post(`/sessions/${phoneNumber}`);
      await fetchSessions();
      setActiveSessionId(phoneNumber);
    } catch (err) {
      console.error("❌ Failed to start session:", err);
      throw err;
    }
  };

  /* ---------------- Disconnect Existing Session ---------------- */
  const disconnectSession = async (sessionId) => {
    if (!token) throw new Error("Not authorized");
    try {
      await api.delete(`/sessions/${sessionId}`);
      await fetchSessions();
      if (activeSessionId === sessionId) setActiveSessionId(null);
    } catch (err) {
      console.error("❌ Failed to disconnect session:", err);
      throw err;
    }
  };

  /* ---------------- Delete Session (Permanent) ---------------- */
  const deleteSession = async (sessionId) => {
    if (!token) throw new Error("Not authorized");
    try {
      await api.delete(`/sessions/${sessionId}?force=true`);
      await fetchSessions();
      if (activeSessionId === sessionId) setActiveSessionId(null);
    } catch (err) {
      console.error("❌ Failed to delete session:", err);
      throw err;
    }
  };

  /* ---------------- Socket + Auto Sync ---------------- */
  useEffect(() => {
    if (!token) return; // wait until user is logged in
    fetchSessions();

    const events = ["session_update", "qr", "connected", "disconnected"];
    events.forEach((e) => socket.on(e, fetchSessions));

    return () => {
      events.forEach((e) => socket.off(e, fetchSessions));
    };
  }, [token]); // ✅ only runs when token changes

  return (
    <SessionContext.Provider
      value={{
        sessions,
        activeSessionId,
        setActiveSessionId,
        startSession,
        disconnectSession,
        deleteSession,
        refreshSessions: fetchSessions,
        loading,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => useContext(SessionContext);
