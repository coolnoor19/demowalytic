import { useEffect, useState } from "react";
import api from "../lib/api";
import { toast } from "../hooks/use-toast";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

export default function NumberVerification() {
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState("");
  const [file, setFile] = useState(null);
  const [results, setResults] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [singleNumber, setSingleNumber] = useState("");

  /* ---------------- Fetch Available Sessions ---------------- */
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await api.get("/sessions");
        const list = res.data?.data || [];
        setSessions(list);
        const connected = list.find((s) => s.status === "connected");
        if (connected && !sessionId) setSessionId(connected.sessionId);
      } catch (err) {
        console.error("❌ Failed to fetch sessions:", err);
      }
    };
    fetchSessions();
  }, []);

  /* ---------------- Fetch Verification History ---------------- */
  const fetchHistory = async () => {
    try {
      const res = await api.get(`/verify/history`, {
        params: sessionId ? { session: sessionId } : {},
      });
      setHistory(res.data || []);
    } catch (err) {
      console.error("❌ Failed to fetch verification history:", err);
    }
  };

  useEffect(() => {
    if (sessionId) fetchHistory();
  }, [sessionId]);

  /* ---------------- Handle Bulk Upload ---------------- */
  const handleUpload = async () => {
    if (!sessionId) {
      toast({
        title: "Error",
        description: "Please select a WhatsApp session.",
        variant: "destructive",
      });
      return;
    }

    if (!file) {
      toast({
        title: "Error",
        description: "Please upload an Excel (.xlsx) or CSV file.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    try {
      const res = await api.post(`/verify/${sessionId}/bulk-verify`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResults(res.data.results || []);
      toast({
        title: "Verification Complete",
        description: `Verified ${res.data.results?.length || 0} numbers.`,
      });
      fetchHistory();
    } catch (err) {
      console.error("❌ Upload failed:", err);
      toast({
        title: "Error",
        description: "Bulk verification failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setFile(null);
    }
  };

  /* ---------------- Handle Single Number Verify ---------------- */
  const handleSingleVerify = async () => {
    if (!sessionId) {
      toast({
        title: "Error",
        description: "Please select a WhatsApp session.",
        variant: "destructive",
      });
      return;
    }

    if (!singleNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter a number to verify.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(`/verify/${sessionId}/verify-single`, {
        number: singleNumber,
      });

      setResults([{ number: res.data.number, status: res.data.status }]);
      toast({
        title: "Verification Complete",
        description: `${res.data.number} is ${res.data.status}`,
      });
      fetchHistory();
    } catch (err) {
      console.error("❌ Single verify failed:", err);
      toast({
        title: "Error",
        description: "Single number verification failed.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setSingleNumber("");
    }
  };

  /* ---------------- Handle Export ---------------- */
  const handleExport = async (format = "csv") => {
    if (!sessionId) {
      toast({
        title: "Error",
        description: "Please select a session before exporting.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await api.get(`/verify/export`, {
        params: { session: sessionId, format },
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type:
          format === "xlsx"
            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            : "text/csv;charset=utf-8;",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `verification-history-${sessionId}.${format}`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("❌ Export failed:", err);
      toast({
        title: "Error",
        description: "Failed to export verification history.",
        variant: "destructive",
      });
    }
  };

  /* ---------------- Handle Clear History ---------------- */
  const handleClearHistory = async () => {
    if (!sessionId) {
      toast({
        title: "Error",
        description: "Please select a WhatsApp session to clear history for.",
        variant: "destructive",
      });
      return;
    }

    const confirmClear = window.confirm(
      "⚠️ Are you sure you want to clear the verification history for this session only?"
    );

    if (!confirmClear) return;

    try {
      const res = await api.delete(`/verify/clear`, {
        params: { session: sessionId },
      });

      toast({
        title: "History Cleared",
        description: `${res.data.deletedCount || 0} records deleted for this session.`,
      });
      setHistory([]);
    } catch (err) {
      console.error("❌ Clear history failed:", err);
      toast({
        title: "Error",
        description: "Failed to clear verification history.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 py-4">
      <h1 className="text-xl sm:text-2xl font-semibold mb-6">📞 Number Verification</h1>

      {/* Select Session */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1 text-gray-700">
          Select WhatsApp Session
        </label>
        <select
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">-- Select Session --</option>
          {sessions.map((s) => (
            <option key={s.sessionId} value={s.sessionId}>
              {s.number} ({s.status})
            </option>
          ))}
        </select>
      </div>

      {/* Single Number Verification */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-medium mb-2">Single Number Verification</h2>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Input
            type="text"
            placeholder="Enter number (e.g. 919876543210)"
            value={singleNumber}
            onChange={(e) => setSingleNumber(e.target.value)}
            className="border border-gray-300 bg-gray-50 flex-1"
          />
          <Button
            onClick={handleSingleVerify}
            disabled={loading}
            className="bg-blue-600 text-white hover:bg-blue-700 w-full sm:w-auto"
          >
            {loading ? "Verifying..." : "Verify"}
          </Button>
        </div>
      </div>

      {/* Bulk Upload Verification */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-medium mb-2">Bulk Verification</h2>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => setFile(e.target.files[0])}
            className="border border-gray-300 bg-gray-50 flex-1"
          />
          <Button
            onClick={handleUpload}
            disabled={loading}
            className="bg-green-600 text-white hover:bg-green-700 w-full sm:w-auto"
          >
            {loading ? "Verifying..." : "Upload & Verify"}
          </Button>
        </div>
      </div>

      {/* Verification Results */}
      {results.length > 0 && (
        <div className="bg-white shadow-sm border rounded-lg p-4 mb-6 overflow-x-auto">
          <h2 className="text-lg font-medium mb-3">Verification Results</h2>
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Number</th>
                <th className="p-2 border">Status</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, idx) => (
                <tr key={idx}>
                  <td className="p-2 border">{r.number}</td>
                  <td
                    className={`p-2 border font-medium ${
                      r.status === "Valid" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {r.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Verification History */}
      <div className="bg-white shadow-sm border rounded-lg p-4 overflow-x-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
          <h2 className="text-lg font-medium">Verification History</h2>
          <div className="flex gap-2">
            <Button
              onClick={() => handleExport("csv")}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Export CSV
            </Button>
            <Button
              onClick={() => handleExport("xlsx")}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              Export Excel
            </Button>
            <Button
              onClick={handleClearHistory}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Clear History
            </Button>
          </div>
        </div>

        {history.length === 0 ? (
          <p className="text-sm text-gray-500">No verification history found.</p>
        ) : (
          <table className="w-full text-sm border min-w-[500px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Session ID</th>
                <th className="p-2 border">Number</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Verified At</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h._id}>
                  <td className="p-2 border">{h.sessionId}</td>
                  <td className="p-2 border">{h.number}</td>
                  <td
                    className={`p-2 border font-medium ${
                      h.status === "Valid" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {h.status}
                  </td>
                  <td className="p-2 border whitespace-nowrap">
                    {new Date(h.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
