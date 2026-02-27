
import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import {
  Key,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Plus,
  AlertTriangle,
  Trash,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { toast } from "../../hooks/use-toast";
import api from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";

export function ApiCredentials() {
  const { user } = useAuth();
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeys, setApiKeys] = useState([]);

  const [webhooks, setWebhooks] = useState([]);
  const [availableEvents] = useState([
    "messageReceived",
    "messageSent",
    "mediaMessageSent",
    "groupMessageReceived",
    "groupMessageSent",
    "statusUpdated",
    "testWebhook",
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [globalConnectionStatus, setGlobalConnectionStatus] =
    useState("inactive");
  const [sessionId, setSessionId] = useState("");

  // ✅ Dynamically fetch active WhatsApp session
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await api.get("/sessions");
        const list = res.data?.data || [];
        const connected = list.find((s) => s.status === "connected");
        if (connected) setSessionId(connected.sessionId);
      } catch (err) {
        console.warn("⚠️ Could not fetch session:", err.message);
      }
    };
    fetchSession();
  }, []);

  // Load keys & webhooks when session available
  useEffect(() => {
    if (sessionId) {
      fetchKeys();
      fetchExternalWebhook();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // === API Keys ===
  const fetchKeys = async () => {
    try {
      const res = await api.get("/settings/api-keys");
      setApiKeys(res.data);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load API keys",
        variant: "destructive",
      });
    }
  };

  // === Webhooks ===
  const fetchExternalWebhook = async () => {
    try {
      const res = await api.get(`/webhook/${sessionId}`);
      const payload = res.data?.data;
      if (!payload) {
        setWebhooks([]);
        setGlobalConnectionStatus("inactive");
        return;
      }

      if (Array.isArray(payload)) {
        const prepared = payload.map((d) => ({
          webhookUrl: d.webhookUrl || d.url || "",
          events: Array.isArray(d.events)
            ? d.events
            : d.events
            ? [d.events]
            : [],
          connectionStatus: d.updatedAt ? "connected" : "inactive",
          lastTestTime: d.updatedAt
            ? new Date(d.updatedAt).toLocaleTimeString()
            : null,
        }));
        setWebhooks(prepared);
      } else if (typeof payload === "object") {
        setWebhooks([
          {
            webhookUrl: payload.webhookUrl || payload.url || "",
            events: Array.isArray(payload.events)
              ? payload.events
              : payload.events
              ? [payload.events]
              : [],
            connectionStatus: payload.updatedAt ? "connected" : "inactive",
            lastTestTime: payload.updatedAt
              ? new Date(payload.updatedAt).toLocaleTimeString()
              : null,
          },
        ]);
      } else {
        setWebhooks([]);
      }
    } catch (err) {
      if (err?.response?.status === 404) {
        setWebhooks([]);
        setGlobalConnectionStatus("inactive");
        return;
      }
      console.error("❌ Error fetching webhook(s):", err?.message || err);
      toast({
        title: "Error",
        description: "Failed to load webhook data.",
        variant: "destructive",
      });
    }
  };

  const addWebhookRow = () => {
    setWebhooks((prev) => [
      ...prev,
      {
        webhookUrl: "",
        events: [],
        connectionStatus: "inactive",
        lastTestTime: null,
      },
    ]);
  };

  const updateWebhookField = (index, field, value) => {
    setWebhooks((prev) =>
      prev.map((w, i) => (i === index ? { ...w, [field]: value } : w))
    );
  };

  const toggleWebhookEvent = (index, event) => {
    setWebhooks((prev) =>
      prev.map((w, i) =>
        i === index
          ? {
              ...w,
              events: w.events?.includes(event)
                ? w.events.filter((e) => e !== event)
                : [...(w.events || []), event],
            }
          : w
      )
    );
  };

  // ✅ Save webhook (corrected)
  const saveWebhookRow = async (index) => {
    const hook = webhooks[index];
    if (!hook?.webhookUrl) {
      toast({
        title: "Error",
        description: "Please enter a webhook URL.",
        variant: "destructive",
      });
      return;
    }

    const selectedEvents = Array.isArray(hook.events) ? hook.events : [];
    if (selectedEvents.length === 0) {
      toast({
        title: "Warning",
        description: "Please select at least one event before saving.",
        variant: "destructive",
      });
      return;
    }

    if (!sessionId) {
      toast({
        title: "Error",
        description: "No active WhatsApp session found.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post("/webhook/set", {
        sessionId,
        webhookUrl: hook.webhookUrl.trim(),
        events: selectedEvents,
      });

      if (res.data?.success && res.data?.data) {
        const saved = res.data.data;
        const updatedWebhook = {
          webhookUrl: saved.webhookUrl,
          events: saved.events,
          connectionStatus: "connected",
          lastTestTime: new Date(saved.updatedAt || new Date()).toLocaleTimeString(),
        };

        setWebhooks((prev) => {
          const copy = [...prev];
          copy[index] = updatedWebhook;
          return copy;
        });

        setGlobalConnectionStatus("connected");

        toast({
          title: "Webhook Saved",
          description: "Webhook and selected events saved successfully.",
        });
      } else {
        throw new Error(res.data?.message || "Failed to save webhook.");
      }
    } catch (err) {
      console.error("❌ saveWebhookRow error:", err);
      toast({
        title: "Error",
        description:
          err?.response?.data?.message ||
          err.message ||
          "Failed to save webhook URL.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Test webhook (unchanged)
  const testWebhookRow = async (index) => {
    const hook = webhooks[index];
    if (!hook?.webhookUrl) {
      toast({
        title: "Error",
        description: "Enter a webhook URL before testing.",
        variant: "destructive",
      });
      return;
    }

    if (!sessionId) {
      toast({
        title: "Error",
        description: "No active WhatsApp session found.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    updateWebhookField(index, "connectionStatus", "pending");
    setGlobalConnectionStatus("pending");

    try {
      const res = await api.post("/webhook/test", { sessionId });
      const successMsg = res.data?.message || "Test webhook triggered.";

      updateWebhookField(index, "connectionStatus", "connected");
      updateWebhookField(index, "lastTestTime", new Date().toLocaleTimeString());
      setGlobalConnectionStatus("connected");

      toast({ title: "Success", description: successMsg });
    } catch (err) {
      console.error("❌ Test webhook error:", err);
      updateWebhookField(index, "connectionStatus", "failed");
      setGlobalConnectionStatus("failed");

      toast({
        title: "Test Failed",
        description:
          err?.response?.data?.message ||
          err.message ||
          "Webhook test failed.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteWebhookRow = async (index) => {
    const hook = webhooks[index];
    if (!hook) return;
    if (!hook.webhookUrl || hook.webhookUrl.trim() === "") {
      setWebhooks((prev) => prev.filter((_, i) => i !== index));
      toast({
        title: "Removed",
        description: "Blank webhook configuration removed from UI.",
      });
      return;
    }

    const confirmDelete = window.confirm(`Delete webhook?\n${hook.webhookUrl}`);
    if (!confirmDelete) return;

    setIsLoading(true);
    try {
      const res = await api.delete(`/webhook/${sessionId}`, {
        params: { webhookUrl: hook.webhookUrl },
      });

      if (res.data?.success) {
        toast({ title: "Deleted", description: "Webhook deleted successfully." });
        setWebhooks((prev) => prev.filter((_, i) => i !== index));
      } else {
        toast({
          title: "Warning",
          description:
            res.data?.message || "Webhook delete returned unexpected response.",
        });
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message;
      toast({
        title: "Error",
        description: msg || "Failed to delete webhook.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewKey = async () => {
    try {
      await api.post("/settings/api-keys/generate");
      toast({
        title: "New API Key Generated",
        description: "Your new API key has been created successfully.",
      });
      fetchKeys();
    } catch {
      toast({
        title: "Error",
        description: "Failed to generate API key.",
        variant: "destructive",
      });
    }
  };

  const deleteKey = async (id) => {
    try {
      await api.delete(`/settings/api-keys/${id}`);
      toast({
        title: "Key Deleted",
        description: "API key removed successfully.",
      });
      fetchKeys();
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete API key.",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: `${label} copied to clipboard.` });
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            <CardTitle>API Credentials & External Webhooks</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.open("https://docs.walytic.com/", "_blank")}
            >
              View Docs
            </Button>
            <Button variant="outline" size="sm" onClick={generateNewKey}>
              <Plus className="h-4 w-4 mr-2" />
              New Key
            </Button>
          </div>
        </div>
        <CardDescription>
          Manage your API keys and connect external webhook integrations (Pabbly, Zapier, Make).
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Webhooks Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="webhook">External Webhooks</Label>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  globalConnectionStatus === "connected"
                    ? "default"
                    : globalConnectionStatus === "failed"
                    ? "destructive"
                    : globalConnectionStatus === "inactive"
                    ? "outline"
                    : "secondary"
                }
                className="text-xs"
              >
                {globalConnectionStatus === "connected" && (
                  <>
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Connected
                  </>
                )}
                {globalConnectionStatus === "failed" && (
                  <>
                    <AlertTriangle className="h-3 w-3 mr-1" /> Failed
                  </>
                )}
                {globalConnectionStatus === "inactive" && (
                  <>
                    <Loader2 className="h-3 w-3 mr-1" /> Inactive
                  </>
                )}
                {globalConnectionStatus === "pending" && (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Testing...
                  </>
                )}
              </Badge>
              <Button variant="outline" size="sm" onClick={addWebhookRow}>
                <Plus className="h-4 w-4 mr-2" />
                Add Webhook
              </Button>
            </div>
          </div>

          {/* List of webhook rows */}
          <div className="space-y-3">
            {webhooks.length === 0 && (
              <div className="text-sm text-muted-foreground">
                No webhooks configured yet. Click "Add Webhook".
              </div>
            )}

            {webhooks.map((hook, i) => (
              <div key={i} className="border rounded p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Webhook URL #{i + 1}</Label>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        hook.connectionStatus === "connected"
                          ? "default"
                          : hook.connectionStatus === "failed"
                          ? "destructive"
                          : hook.connectionStatus === "pending"
                          ? "secondary"
                          : "outline"
                      }
                      className="text-xs"
                    >
                      {hook.connectionStatus === "connected" && (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Connected
                        </>
                      )}
                      {hook.connectionStatus === "failed" && (
                        <>
                          <AlertTriangle className="h-3 w-3 mr-1" /> Failed
                        </>
                      )}
                      {hook.connectionStatus === "pending" && (
                        <>
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Testing
                        </>
                      )}
                      {hook.connectionStatus === "inactive" && "Inactive"}
                    </Badge>
                    {hook.lastTestTime && (
                      <span className="text-xs text-muted-foreground">
                        Last tested {hook.lastTestTime}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="https://connect.pabbly.com/workflow/sendwebhookdata/..."
                    value={hook.webhookUrl}
                    onChange={(e) =>
                      updateWebhookField(i, "webhookUrl", e.target.value)
                    }
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      copyToClipboard(hook.webhookUrl || "", "Webhook URL")
                    }
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <div>
                  <Label className="text-sm">Trigger Events</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                    {availableEvents.map((ev) => (
                      <label
                        key={ev}
                        className="flex items-center space-x-2 text-sm border rounded-md px-2 py-1 cursor-pointer hover:bg-muted transition"
                      >
                        <input
                          type="checkbox"
                          checked={hook.events?.includes(ev)}
                          onChange={() => toggleWebhookEvent(i, ev)}
                          className="h-4 w-4 accent-primary cursor-pointer"
                        />
                        <span className="capitalize">
                          {ev.replace(/([A-Z])/g, " $1")}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={() => testWebhookRow(i)} disabled={isLoading}>
                    {isLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      "Test"
                    )}
                  </Button>
                  <Button onClick={() => saveWebhookRow(i)} disabled={isLoading}>
                    {isLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      "Save"
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => deleteWebhookRow(i)}
                    disabled={isLoading}
                  >
                    <Trash className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* API Keys Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>API Keys</Label>
            <p className="text-xs text-muted-foreground">
              {apiKeys.length} key(s)
            </p>
          </div>

          {apiKeys.map((apiKey) => (
            <div key={apiKey._id} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">API Key</p>
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(apiKey.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="default">active</Badge>
              </div>

              <div>
                <Label className="text-xs">API Key</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={showApiKey ? apiKey.key : "•" + "•".repeat(20)}
                    readOnly
                    className="text-sm font-mono"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(apiKey.key, "API Key")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => deleteKey(apiKey._id)}
                  >
                    ✕
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

