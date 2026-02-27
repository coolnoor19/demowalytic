// /mnt/data/WhatsAppConnection.jsx
// Full updated component — replaced "Upload WhatsApp Status" with "Send Media Message" (URL + file upload)
// NOTE: original file used as base. See: /mnt/data/WhatsAppConnection.jsx. :contentReference[oaicite:2]{index=2}

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "../ui/card";
import { Button } from "../ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";
import { useSubscription } from "../../contexts/SubscriptionContext";
import { useSession } from "../../contexts/SessionContext";
import api from "../../lib/api";
import { toast } from "../../hooks/use-toast";
import { socket } from "../../socket";
import { Smartphone } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";


export default function WhatsAppConnection() {
  const [sessions, setSessions] = useState([]);
  const [phone, setPhone] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [qrCode, setQrCode] = useState(null);
  const [qrSessionId, setQrSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [inputHtml, setInputHtml] = useState("");

  // existing message fields
  const [sendNumber, setSendNumber] = useState("");
  const [sendMessage, setSendMessage] = useState("");

  // new: media send fields (support both URL and file upload)
  const [mediaNumber, setMediaNumber] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaCaption, setMediaCaption] = useState("");
  const [mediaCaptionHtml, setMediaCaptionHtml] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  // add near other state/refs
  const [qrTimeLeft, setQrTimeLeft] = useState(null);
  const qrTimerRef = useRef({}); // map sessionId -> interval id
  const qrStartedRef = useRef({}); // map sessionId -> boolean (timer running)

  const { setActiveSessionId, startSession, disconnectSession, deleteSession } =
    useSession();
  const { subscription } = useSubscription();
  const { role } = useAuth();
  const isAdmin = role === "admin" || role === "Administrator";
  const currentSessionRef = useRef(null);
  const [selectedAction, setSelectedAction] = useState({});

  const usageByKey = subscription?.usageByKey || {};
  const maxConnections = isAdmin
    ? Infinity
    : usageByKey.whatsappConnection?.total || 0;
  const usedConnections = isAdmin
    ? 0
    : usageByKey.whatsappConnection?.used || 0;
  const isExpired = isAdmin ? false : subscription?.status === "expired";

  const fetchSessions = async () => {
    try {
      const res = await api.get("/sessions");
      const data = res?.data?.data ?? res?.data ?? [];
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch sessions", err);
    }
  };
  const htmlToPlain = (html = "") =>
    html
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\r\n/g, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();


  useEffect(() => {
    fetchSessions();
    socket.on("session_update", fetchSessions);
    return () => socket.off("session_update", fetchSessions);
  }, []);

  useEffect(() => {
    const dbg = (data) => console.log("📡 QR event received (debug):", data);
    socket.on("qr", dbg);
    return () => socket.off("qr", dbg);
  }, []);

  // ✅ NEW: Automatically fetch groups when any session becomes connected
  useEffect(() => {
    const connected = sessions.find((s) => s.status === "connected");
    if (connected) fetchGroups(connected.sessionId || connected.number);
  }, [sessions]);

  useEffect(() => {
    const onQr = ({ qr, sessionId, qrStart }) => {
      if (!currentSessionRef.current || sessionId === currentSessionRef.current) {
        setQrCode(qr);
        setQrSessionId(sessionId);

        const startTs = qrStart ? Number(qrStart) : Date.now();

        if (!qrStartedRef.current[sessionId]) {
          qrStartedRef.current[sessionId] = true;

          const elapsedSec = Math.floor((Date.now() - startTs) / 1000);
          const totalSeconds = 300; // 5 minutes
          let remaining = Math.max(0, totalSeconds - elapsedSec);

          setQrTimeLeft(remaining);

          if (qrTimerRef.current[sessionId]) {
            clearInterval(qrTimerRef.current[sessionId]);
          }

          qrTimerRef.current[sessionId] = setInterval(() => {
            setQrTimeLeft((prev) => {
              if (prev === null) {
                const elapsedSecInner = Math.floor((Date.now() - startTs) / 1000);
                const remInner = Math.max(0, totalSeconds - elapsedSecInner);
                if (remInner <= 0) {
                  clearInterval(qrTimerRef.current[sessionId]);
                  delete qrTimerRef.current[sessionId];
                  qrStartedRef.current[sessionId] = false;
                  return null;
                }
                return remInner;
              }
              if (prev <= 1) {
                clearInterval(qrTimerRef.current[sessionId]);
                delete qrTimerRef.current[sessionId];
                qrStartedRef.current[sessionId] = false;
                return null;
              }
              return prev - 1;
            });
          }, 1000);
        } else {
          const elapsedSec2 = Math.floor((Date.now() - startTs) / 1000);
          const remaining2 = Math.max(0, 300 - elapsedSec2);
          setQrTimeLeft(remaining2);
        }
      }
    };

    const onConnected = async ({ sessionId }) => {
      try {
        if (sessionId === currentSessionRef.current) {
          await fetchGroups(sessionId);

          setQrCode(null);
          setQrSessionId(null);
          toast({
            title: "Connected",
            description: `WhatsApp ${sessionId} connected successfully.`,
          });

          if (qrTimerRef.current[sessionId]) {
            clearInterval(qrTimerRef.current[sessionId]);
            delete qrTimerRef.current[sessionId];
          }

          qrStartedRef.current[sessionId] = false;
          setQrTimeLeft(null);
        }
        fetchSessions();
      } catch (err) {
        console.error("❌ Error in onConnected:", err);
      }
    };

    const onDisconnected = ({ sessionId }) => {
      if (sessionId === currentSessionRef.current) {
        setQrCode(null);
        setQrSessionId(null);
        toast({
          title: "Disconnected",
          description: `WhatsApp ${sessionId} disconnected.`,
          variant: "destructive",
        });

        if (qrTimerRef.current[sessionId]) {
          clearInterval(qrTimerRef.current[sessionId]);
          delete qrTimerRef.current[sessionId];
        }
        qrStartedRef.current[sessionId] = false;
        setQrTimeLeft(null);
      }
      fetchSessions();
    };

    const onQrExpired = ({ sessionId }) => {
      if (sessionId === currentSessionRef.current) {
        setQrCode(null);
        setQrSessionId(null);
        toast({
          title: "QR Expired",
          description: `QR for session ${sessionId} expired after 5 minutes. Please reconnect.`,
          variant: "destructive",
        });
        if (qrTimerRef.current[sessionId]) {
          clearInterval(qrTimerRef.current[sessionId]);
          delete qrTimerRef.current[sessionId];
        }
        qrStartedRef.current[sessionId] = false;
        setQrTimeLeft(null);
      }
      fetchSessions();
    };

    socket.on("qr", onQr);
    socket.on("connected", onConnected);
    socket.on("disconnected", onDisconnected);
    socket.on("qr_expired", onQrExpired);

    return () => {
      Object.values(qrTimerRef.current).forEach((id) => clearInterval(id));
      qrTimerRef.current = {};
      qrStartedRef.current = {};
      socket.off("qr", onQr);
      socket.off("connected", onConnected);
      socket.off("disconnected", onDisconnected);
      socket.off("qr_expired", onQrExpired);
    };
  }, []);

  const normalizePhone = (raw) => (raw || "").replace(/\D/g, "");
  const getSessionId = (s) => s?.sessionId ?? s?.id ?? s?._id ?? s?.number ?? null;

  const handleConnect = async (targetPhone = null) => {
    const number = normalizePhone(targetPhone || phone);
    if (!number) {
      toast({
        title: "Error",
        description: "Enter valid phone",
        variant: "destructive",
      });
      return;
    }

    currentSessionRef.current = number;
    setActiveSessionId(number);
    setQrCode(null);
    setQrSessionId(null);
    setLoading(true);

    try {
      await startSession(number);
      await fetchSessions();
    } catch (err) {
      console.error("Failed to start session", err);
      toast({
        title: "Error",
        description: "Failed to start session",
        variant: "destructive",
      });
      currentSessionRef.current = null;
      setActiveSessionId(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (sessionId) => {
    try {
      await disconnectSession(sessionId);
      setQrCode(null);
      setQrSessionId(null);
      currentSessionRef.current = null;
      setActiveSessionId(null);
      toast({
        title: "Disconnected",
        description: "WhatsApp session disconnected.",
      });
      await fetchSessions();
    } catch (err) {
      console.error("Disconnect failed", err);
      toast({
        title: "Error",
        description: "Failed to disconnect",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (sessionId) => {
    if (!window.confirm("Are you sure you want to permanently delete this session?"))
      return;
    try {
      await deleteSession(sessionId);
      setQrCode(null);
      setQrSessionId(null);
      currentSessionRef.current = null;
      setActiveSessionId(null);
      toast({ title: "Deleted", description: "Session deleted successfully." });
      await fetchSessions();
    } catch (err) {
      console.error("Delete failed", err);
      toast({
        title: "Error",
        description: "Delete failed",
        variant: "destructive",
      });
    }
  };

  const handleActionSelect = async (sessionKey, value, s) => {
    setSelectedAction((prev) => ({ ...prev, [sessionKey]: value }));
    try {
      if (value === "connect") {
        const number = normalizePhone(s?.number ?? sessionKey);
        await handleConnect(number);
      } else if (value === "disconnect") {
        const id = getSessionId(s);
        await handleDisconnect(id);
      } else if (value === "delete") {
        const id = getSessionId(s);
        await handleDelete(id);
      }
    } catch (err) {
      console.error("Action failed:", err);
    } finally {
      setTimeout(
        () => setSelectedAction((prev) => ({ ...prev, [sessionKey]: null })),
        100
      );
    }
  };

  // ✅ Send message through selected session
  const handleSendMessage = async () => {
    // User must select a session first
    if (!selectedSessionId) {
      toast({
        title: "Error",
        description: "Please select a session first.",
        variant: "destructive",
      });
      return;
    }

    const sessionId = selectedSessionId;

    if (!sendNumber || !sendMessage) {
      toast({
        title: "Error",
        description: "Enter receiver number and message.",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await api.post(`/whatsapp/${sessionId}/send`, {
        number: sendNumber,
        message: sendMessage,
        htmlMessage: inputHtml,
      });

      if (res.data.success) {
        toast({ title: "Message Sent", description: `Sent to ${sendNumber}` });
        setSendMessage("");
        setSendNumber("");
      } else {
        toast({
          title: "Error",
          description: res.data.error || "Failed to send",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to send message.",
        variant: "destructive",
      });
    }
  };


  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [groupMessage, setGroupMessage] = useState("");
  const [groupHtml, setGroupHtml] = useState("");

  const fetchGroups = async (sessionId) => {
    try {
      const res = await api.get(`/whatsapp/${sessionId}/groups`);
      if (res.data.success) {
        setGroups(res.data.groups);
      } else {
        toast({
          title: "Error",
          description: res.data.error || "Failed to load groups",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Failed to fetch groups:", err);
      toast({
        title: "Error",
        description: "Failed to load groups.",
        variant: "destructive",
      });
    }
  };

  // -------------------------------
  // File upload helper (frontend)
  // -------------------------------
  // This expects your backend endpoint POST /upload to accept multipart/form-data
  // and return { success: true, fileUrl: "https://..." }.
  // If you don't have /upload, either create it or change this to use Cloudinary/S3.
  // File upload helper - works with backend's { url: ... } response
  const handleFileUpload = async (file) => {
    if (!file) return null;
    setUploadingFile(true);
    try {
      const form = new FormData();
      form.append("file", file);

      console.log("📤 Uploading file:", file.name);

      const res = await api.post("/media/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("📥 Upload response:", res.data);

      // Backend returns { url: "..." }
      if (res.data?.url) {
        console.log("✅ File uploaded:", res.data.url);
        return res.data.url;
      } else {
        toast({
          title: "Upload failed",
          description: res.data?.error || "No URL returned",
          variant: "destructive",
        });
        return null;
      }
    } catch (err) {
      console.error("❌ Upload error:", err);
      toast({
        title: "Upload error",
        description: err.response?.data?.error || "Failed to upload",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingFile(false);
    }
  };

  // -------------------------------
  // Send media message (URL or uploaded file)
  // -------------------------------
  const handleSendMedia = async () => {
    // User must select a session first
    if (!selectedSessionId) {
      toast({
        title: "Error",
        description: "Please select a session first.",
        variant: "destructive",
      });
      return;
    }

    const sessionId = selectedSessionId;

    if (!mediaNumber) {
      toast({
        title: "Error",
        description: "Receiver number is required.",
        variant: "destructive",
      });
      return;
    }

    let finalFileUrl = mediaUrl?.trim() || null;

    // If file selected → upload first
    if (selectedFile) {
      const uploaded = await handleFileUpload(selectedFile);
      if (!uploaded) return;
      finalFileUrl = uploaded;
    }

    if (!finalFileUrl) {
      toast({
        title: "Error",
        description: "Provide a media URL or upload a file.",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await api.post(`/whatsapp/${sessionId}/send-media`, {
        number: mediaNumber,
        fileUrl: finalFileUrl,
        caption: mediaCaption,       // WhatsApp plain text
        captionHtml: mediaCaptionHtml // <-- add this
      });

      if (res.data.success) {
        toast({
          title: "Media Sent",
          description: `Sent to ${mediaNumber}`,
        });
        setMediaNumber("");
        setMediaUrl("");
        setMediaCaption("");
        setSelectedFile(null);
      } else {
        toast({
          title: "Error",
          description: res.data.error || "Failed to send media",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to send media.",
        variant: "destructive",
      });
    }
  };


  // -------------------------------
  // Group message send (existing)
  // -------------------------------
  // ... unchanged (kept here for completeness) ...

  return (
    <Card className="border-green-200">
      <CardHeader>
        <Smartphone className="h-5 w-5" />
        <CardTitle className="text-lg"> WhatsApp Device</CardTitle>
        <CardDescription>
          Connect your WhatsApp device to start sending and receiving messages
          via API
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600">
          Quota: {usedConnections} / {maxConnections}
        </div>

        <div className="space-y-3">
          {sessions.map((s) => {
            const sid = getSessionId(s);
            return (
              <div
                key={sid || Math.random()}
                className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex flex-col">
                  <p className="font-semibold text-gray-800">
                    {s.number || s.sessionId || s._id}
                  </p>
                  <p
                    className={`text-sm font-medium ${s.status === "connected"
                      ? "text-green-600"
                      : s.status === "pending"
                        ? "text-yellow-600"
                        : "text-red-600"
                      }`}
                  >
                    {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                  </p>
                </div>

                {/* Professional Dropdown */}
                <div className="relative">
                  <Select
                    value={selectedAction[sid] ?? ""}
                    onValueChange={(v) => handleActionSelect(sid, v, s)}
                  >
                    <SelectTrigger
                      className="w-[150px] h-[38px] bg-white border border-gray-300 text-gray-800 font-medium text-sm 
                                 rounded-lg shadow-sm hover:border-green-400 focus:border-green-500 focus:ring-2 
                                 focus:ring-green-200 transition-all flex justify-between items-center px-3"
                    >
                      <SelectValue placeholder="Select Action" />
                    </SelectTrigger>

                    <SelectContent className="rounded-lg border border-gray-200 shadow-lg bg-white text-gray-700 font-medium text-sm mt-1">
                      {s.status !== "connected" && (
                        <SelectItem
                          value="connect"
                          className="px-3 py-2 rounded-md hover:bg-green-50 hover:text-green-700 cursor-pointer transition-colors flex items-center gap-2"
                        >
                          <span>🔗</span> Connect
                        </SelectItem>
                      )}

                      {s.status === "connected" && (
                        <SelectItem
                          value="disconnect"
                          className="px-3 py-2 rounded-md hover:bg-yellow-50 hover:text-yellow-700 cursor-pointer transition-colors flex items-center gap-2"
                        >
                          <span>🔌</span> Disconnect
                        </SelectItem>
                      )}

                      <SelectItem
                        value="delete"
                        className="px-3 py-2 rounded-md hover:bg-red-50 hover:text-red-700 cursor-pointer transition-colors flex items-center gap-2"
                      >
                        <span>🗑️</span> Delete
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          })}

          {sessions.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-2">
              No WhatsApp sessions yet
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Input
            placeholder="Enter WhatsApp phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Button
            onClick={() => handleConnect()}
            disabled={
              (!isAdmin && (isExpired || usedConnections >= maxConnections)) ||
              loading
            }
          >
            {loading ? "Starting..." : "Connect"}
          </Button>
        </div>

        {qrCode && (
          <div className="flex flex-col items-center space-y-2">
            <p className="text-sm">Scan QR for session {qrSessionId}:</p>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
                qrCode
              )}&size=250x250`}
              alt="QR Code"
              className="border rounded-lg shadow-md"
            />

            {/* Countdown Timer */}
            {qrTimeLeft !== null && (
              <p className="text-xs text-gray-600 mt-1">
                QR expires in{" "}
                <span className="font-semibold text-red-600">
                  {`${Math.floor(qrTimeLeft / 60)
                    .toString()
                    .padStart(2, "0")}:${(qrTimeLeft % 60)
                      .toString()
                      .padStart(2, "0")}`}
                </span>
              </p>
            )}
          </div>
        )}

        {/* Select Session to Send Messages */}
        {/* Choose Session */}
        <div className="mt-6 pt-4">
          <h3 className="text-md font-semibold mb-2 text-gray-800">
            Select WhatsApp Session
          </h3>

          <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
            <SelectTrigger
              className="
        w-full 
        h-11
        bg-white 
        border border-gray-300 
        text-gray-800 
        font-medium 
        text-sm 
        rounded-lg 
        shadow-sm 
        hover:border-green-400 
        focus:border-green-500 
        focus:ring-2 
        focus:ring-green-200 
        transition-all 
        px-3
      "
            >
              <SelectValue placeholder="Choose session to send messages" />
            </SelectTrigger>

            <SelectContent
              className="
        z-[9999] 
        mt-1 
        bg-white 
        border 
        border-gray-200 
        rounded-lg 
        shadow-xl 
        w-[var(--radix-select-trigger-width)] 
        text-gray-800 
        text-sm 
      "
            >
              {sessions
                .filter((s) => s.status === "connected")
                .map((s) => (
                  <SelectItem
                    key={s.sessionId}
                    value={s.sessionId}
                    className="
              cursor-pointer 
              px-3 
              py-2 
              rounded-md 
              hover:bg-green-50 
              hover:text-green-700 
              flex 
              items-center 
              justify-between
            "
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      {s.number}
                    </div>


                    <span className="text-green-600 font-semibold">
                      ● Connected
                    </span>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>


        {/* ✅ Send Message Section */}
        <div className="mt-6  pt-4">
          <h3 className="text-md font-semibold mb-2">Send WhatsApp Message</h3>
          <div className="flex flex-col space-y-2">
            <Input
              placeholder="Receiver number with country code (e.g. 919876543210)"
              value={sendNumber}
              onChange={(e) => setSendNumber(e.target.value)}
            />
            {/* CKEditor for admin send message */}
            <div className="bg-white rounded-md border border-gray-200 p-2">
              <CKEditor
                editor={ClassicEditor}
                data={inputHtml}
                config={{
                  toolbar: [
                    "bold",
                    "italic",
                    "strikethrough",
                    "|",
                    "bulletedList",
                    "numberedList",
                    "|",
                    "undo",
                    "redo"
                  ],
                  placeholder: "Type your message..."
                }}
                onChange={(event, editor) => {
                  const data = editor.getData();
                  setInputHtml(data);
                  // Map HTML -> plain text so `message` payload always has text
                  setSendMessage(htmlToPlain(data));
                }}
              />
            </div>

            <Button
              onClick={handleSendMessage}
              disabled={!sendNumber || !sendMessage}
            >
              Send Message
            </Button>
          </div>
        </div>

        {/* ✅ Send Group Message Section with Group Fetch */}
        <div className="mt-6 pt-4">
          <h3 className="text-md font-semibold mb-2">Send Group Message</h3>
          <div className="flex flex-col space-y-2">
            <Select value={selectedGroupId} onValueChange={(val) => setSelectedGroupId(val)}>
              <SelectTrigger className="w-full bg-white border border-gray-300 text-gray-800 font-medium text-sm rounded-lg shadow-sm">
                <SelectValue placeholder="Select WhatsApp Group" />
              </SelectTrigger>
              <SelectContent className="rounded-lg border border-gray-200 shadow-lg bg-white text-gray-700 font-medium text-sm mt-1 max-h-[250px] overflow-y-auto">
                {groups.length > 0 ? (
                  groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name} ({g.size || 0} members)
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-3 py-2 text-gray-500 text-sm">No groups found</div>
                )}
              </SelectContent>
            </Select>

            {/* CKEditor for Group Message */}
            <div className="bg-white rounded-md border border-gray-200 p-2">
              <CKEditor
                editor={ClassicEditor}
                data={groupHtml}
                config={{
                  toolbar: [
                    "bold",
                    "italic",
                    "|",
                    "bulletedList",
                    "numberedList",
                    "|",
                    "undo",
                    "redo"
                  ],
                  placeholder: "Type your group message..."
                }}
                onChange={(event, editor) => {
                  const html = editor.getData();
                  setGroupHtml(html);
                  setGroupMessage(htmlToPlain(html)); // <-- plain text conversion
                }}
              />
            </div>


            <Button
              onClick={async () => {
                const session = sessions.find((s) => s.status === "connected");
                if (!session) {
                  toast({
                    title: "Error",
                    description: "No active WhatsApp session found.",
                    variant: "destructive",
                  });
                  return;
                }

                const sessionId = session.sessionId || session.number;
                const selectedGroup = groups.find((g) => g.id === selectedGroupId);

                try {
                  const res = await api.post(`/whatsapp/${sessionId}/send-group`, {
                    groupName: selectedGroup?.name,
                    message: groupMessage,
                    htmlMessage: groupHtml,
                  });
                  if (res.data.success) {
                    toast({
                      title: "Group Message Sent",
                      description: `Sent to ${selectedGroup?.name}`,
                    });
                    setGroupMessage("");
                    setSelectedGroupId("");
                  } else {
                    toast({
                      title: "Error",
                      description: res.data.error || "Failed to send group message",
                      variant: "destructive",
                    });
                  }
                } catch (err) {
                  console.error("❌ Group send failed:", err);
                  toast({
                    title: "Error",
                    description: "Failed to send group message.",
                    variant: "destructive",
                  });
                }
              }}
              disabled={!selectedGroupId || !groupMessage}
            >
              Send to Group
            </Button>
          </div>
        </div>

        {/* ---------------------------------------------------------
            REPLACED: "Upload WhatsApp Status"
            WITH: "Send Media Message" (supports URL + file upload)
           --------------------------------------------------------- */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h3 className="text-md font-semibold mb-2">Send Media Message</h3>

          <div className="flex flex-col space-y-2">
            <Input
              placeholder="Receiver number (e.g. 919876543210)"
              value={mediaNumber}
              onChange={(e) => setMediaNumber(e.target.value)}
            />

            <Input
              placeholder="Media File URL (image/video/document) — optional if uploading a file"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
            />

            <div className="flex items-center gap-2">
              <input
                id="fileInput"
                type="file"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setSelectedFile(f);
                  // If user chooses a file, clear the URL field to avoid confusion.
                  if (f) setMediaUrl("");
                }}
                className="text-sm"
              />
              <div className="text-xs text-gray-500">
                {selectedFile ? selectedFile.name : "No file chosen"}
              </div>
            </div>

            {selectedFile && (
              <div className="text-xs text-gray-600">
                Tip: file will be uploaded to your backend via <code>/upload</code> before sending.
              </div>
            )}

            {/* CKEditor for Media Caption */}
            <div className="bg-white rounded-md border border-gray-200 p-2">
              <CKEditor
                editor={ClassicEditor}
                data={mediaCaptionHtml}
                config={{
                  toolbar: [
                    "bold",
                    "italic",
                    "|",
                    "bulletedList",
                    "numberedList",
                    "|",
                    "undo",
                    "redo"
                  ],
                  placeholder: "Media caption..."
                }}
                onChange={(event, editor) => {
                  const html = editor.getData();
                  setMediaCaptionHtml(html);
                  setMediaCaption(htmlToPlain(html)); // <-- fallback plain text
                }}
              />
            </div>


            <div className="flex gap-2">
              <Button
                onClick={handleSendMedia}
                disabled={
                  !mediaNumber ||
                  (!mediaUrl && !selectedFile) ||
                  uploadingFile
                }
              >
                {uploadingFile ? "Uploading..." : "Send Media"}
              </Button>

              <Button
                variant="ghost"
                onClick={() => {
                  setMediaNumber("");
                  setMediaUrl("");
                  setMediaCaption("");
                  setSelectedFile(null);
                }}
              >
                Clear
              </Button>
            </div>

            <div className="text-xs text-gray-500">
              Note: If both a file and a URL are provided, the selected file will be uploaded and used.
            </div>
          </div>
        </div>

        {/* end card content */}
      </CardContent>
    </Card>
  );
}
