import { useEffect, useState } from "react";
import api from "../lib/api";
import { toast } from "../hooks/use-toast";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import SampleFormatModal from "./SampleFormatModal";

export default function SendViaExcel() {
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState("");
  const [file, setFile] = useState(null);
  const [bulkMessage, setBulkMessage] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [delaySettings, setDelaySettings] = useState({
    delayEveryCount: 5,
    delayEverySec: 30,
    delayBeforeFrom: 1,
    delayBeforeTo: 3,
  });
  const [scheduledTime, setScheduledTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [showSample, setShowSample] = useState(false);

  /* ---------------- Fetch Active Sessions ---------------- */
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

  /* ---------------- Fetch Campaign History ---------------- */
  const fetchCampaigns = async () => {
    if (!sessionId) return;
    try {
      const res = await api.get(`/bulk/${sessionId}/all`);
      setCampaigns(res.data || []);
    } catch (err) {
      console.error("❌ Failed to fetch campaigns:", err);
    }
  };

  useEffect(() => {
    fetchCampaigns();
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
        description: "Please upload an Excel (.xlsx/.csv) file.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("campaignName", campaignName);
    formData.append("bulkMessage", bulkMessage);
    formData.append("delaySettings", JSON.stringify(delaySettings));
    if (scheduledTime) formData.append("scheduledTime", scheduledTime);

    setLoading(true);
    try {
      await api.post(`/bulk/${sessionId}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast({
        title: "✅ Campaign Created",
        description: "Messages will be sent shortly.",
      });
      setCampaignName("");
      setBulkMessage("");
      setFile(null);
      fetchCampaigns();
    } catch (err) {
      console.error("❌ Bulk send failed:", err);
      toast({
        title: "Error",
        description: "Failed to send messages via Excel.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">📤 Send Messages via Excel</h1>

      {/* Select Session */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
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

      {/* Campaign Name & Message */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Campaign Name
          </label>
          <Input
            placeholder="Enter campaign name"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Default Message
          </label>
          <Textarea
            placeholder="Enter default message"
            value={bulkMessage}
            onChange={(e) => setBulkMessage(e.target.value)}
          />
        </div>
      </div>

      {/* Upload File + Sample Button */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Upload Excel/CSV File
          </label>
          <Button
            variant="outline"
            onClick={() => setShowSample(true)}
            className="text-sm"
          >
            📘 View Sample Format
          </Button>
        </div>

        <Input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => setFile(e.target.files[0])}
          className="border border-gray-300 bg-white"
        />
        <p className="text-xs text-gray-500 mt-1">
          Required columns: <b>To</b>, <b>Message</b>,{" "}
          <b>Image/File Url (Optional)</b>, <b>whatsapp_client_id</b>,{" "}
          <b>Schedule Time (Optional)</b>
        </p>
      </div>

      {/* Delay Settings */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-medium mb-3">⚙️ Delay Settings</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="text-sm text-gray-600">Batch Count</label>
            <Input
              type="number"
              value={delaySettings.delayEveryCount}
              onChange={(e) =>
                setDelaySettings({
                  ...delaySettings,
                  delayEveryCount: e.target.value,
                })
              }
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">
              Delay After Batch (sec)
            </label>
            <Input
              type="number"
              value={delaySettings.delayEverySec}
              onChange={(e) =>
                setDelaySettings({
                  ...delaySettings,
                  delayEverySec: e.target.value,
                })
              }
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Per Msg Delay From (sec)</label>
            <Input
              type="number"
              value={delaySettings.delayBeforeFrom}
              onChange={(e) =>
                setDelaySettings({
                  ...delaySettings,
                  delayBeforeFrom: e.target.value,
                })
              }
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">To (sec)</label>
            <Input
              type="number"
              value={delaySettings.delayBeforeTo}
              onChange={(e) =>
                setDelaySettings({
                  ...delaySettings,
                  delayBeforeTo: e.target.value,
                })
              }
            />
          </div>
        </div>
      </div>

      {/* Schedule Time */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Schedule Time (optional)
        </label>
        <Input
          type="datetime-local"
          value={scheduledTime}
          onChange={(e) => setScheduledTime(e.target.value)}
          className="border border-gray-300 bg-white"
        />
      </div>

      {/* Send Button */}
      <Button
        onClick={handleUpload}
        disabled={loading}
        className="bg-green-600 text-white hover:bg-green-700 w-full sm:w-auto"
      >
        {loading ? "Processing..." : "Upload & Send"}
      </Button>

      {/* Campaign History */}
      <div className="mt-8 bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-medium mb-3">📋 Campaign History</h2>
        {campaigns.length === 0 ? (
          <p className="text-sm text-gray-500">No campaigns found.</p>
        ) : (
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Total</th>
                <th className="p-2 border">Delivered</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Created</th>
                <th className="p-2 border">Completed</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c._id}>
                  <td className="p-2 border">{c.name}</td>
                  <td className="p-2 border">{c.total}</td>
                  <td className="p-2 border">{c.delivered}</td>
                  <td
                    className={`p-2 border font-medium ${
                      c.status === "completed"
                        ? "text-green-600"
                        : c.status === "scheduled"
                        ? "text-yellow-600"
                        : "text-blue-600"
                    }`}
                  >
                    {c.status}
                  </td>
                  <td className="p-2 border">
                    {new Date(c.createdAt).toLocaleString()}
                  </td>
                  <td className="p-2 border">
                    {c.completedAt
                      ? new Date(c.completedAt).toLocaleString()
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Sample Format Modal */}
      <SampleFormatModal open={showSample} onClose={() => setShowSample(false)} />
    </div>
  );
}
