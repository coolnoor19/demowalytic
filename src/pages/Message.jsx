import { useEffect, useState, useRef, useCallback } from "react";
import api from "../lib/api";
import { socket } from "../socket";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import sanitizeHtml from "sanitize-html"; // optional: run-time client sanitize

export default function Message() {
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState("");
  const [activeChat, setActiveChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [contactTyping, setContactTyping] = useState(false);
  const scrollRef = useRef(null);
  const [inputHtml, setInputHtml] = useState(""); // HTML from CKEditor
  const [inputText, setInputText] = useState(""); // plain text fallback

  // ===============================================
  // NORMALIZATION HELPERS
  // ===============================================

  const normalizeJid = useCallback((jid) => {
    if (!jid) return jid;
    if (
      jid.endsWith("@s.whatsapp.net") ||
      jid.endsWith("@g.us") ||
      jid.endsWith("@lid")
    )
      return jid;
    return `${jid.replace(/\D/g, "")}@s.whatsapp.net`;
  }, []);

  const cleanCompare = useCallback(
    (a, b) => {
      if (!a || !b) return false;
      return normalizeJid(a) === normalizeJid(b);
    },
    [normalizeJid]
  );

  // Correct chatId detection for ANY msg
  const getChatId = useCallback(
    (m) => {
      if (m.chatId) return normalizeJid(m.chatId);

      if (m.isGroup) {
        if (m.groupId) return m.groupId;
        if (m.sender?.endsWith("@g.us")) return m.sender;
        if (m.recipient?.endsWith("@g.us")) return m.recipient;
      }

      return m.direction === "in"
        ? normalizeJid(m.sender)
        : normalizeJid(m.recipient);
    },
    [normalizeJid]
  );

  function convertHtmlToWhatsApp(html) {
    if (!html) return "";

    const sanitized = html
      .replace(/\r\n/g, "\n")
      .replace(/&nbsp;/g, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/div>/gi, "\n");

    let txt = sanitized
      .replace(/<\s*strong[^>]*>(.*?)<\s*\/\s*strong>/gi, "*$1*")
      .replace(/<\s*b[^>]*>(.*?)<\s*\/\s*b>/gi, "*$1*")
      .replace(/<\s*i[^>]*>(.*?)<\s*\/\s*i>/gi, "_$1_")
      .replace(/<\s*em[^>]*>(.*?)<\s*\/\s*em>/gi, "_$1_")
      .replace(/<\s*s(t|trike)[^>]*>(.*?)<\s*\/\s*s(t|trike)>/gi, "~$2~");

    txt = txt.replace(/<[^>]+>/g, "");
    txt = txt.replace(/\n{3,}/g, "\n\n").trim();

    return txt;
  }

  // ============================================================
  // FETCH SESSIONS
  // ============================================================
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const res = await api.get("/sessions");
        const list = res.data?.data || [];
        setSessions(list);

        const connected = list.find((s) => s.status === "connected");
        if (connected && !sessionId) setSessionId(connected.sessionId);
      } catch (err) {
        console.error("Session fetch error", err);
      }
    };

    loadSessions();
  }, []);

  // ============================================================
  // SOCKET HANDLING — ONLY FOR INCOMING MESSAGES
  // ============================================================
  useEffect(() => {
    if (!sessionId) return;

    const handleNewMessage = (msg) => {
      const chatId = getChatId(msg);
      console.log("📨 Received socket message:", msg);

      // Only handle INCOMING messages from socket
      // Outgoing messages are handled by temp message + API response
      if (msg.direction === "out") {
        console.log(
          "⏭️ Skipping outgoing message from socket (handled by temp)"
        );
        return;
      }

      // Add incoming message
      setMessages((prevMessages) => {
        const exists = prevMessages.some(
          (m) =>
            (m.messageId && msg.messageId && m.messageId === msg.messageId) ||
            (m._id && msg._id && String(m._id) === String(msg._id))
        );

        if (exists) {
          console.log("🛑 Duplicate blocked:", msg.messageId || msg._id);
          return prevMessages;
        }

        // Only add if this chat is active
        if (activeChat && cleanCompare(chatId, activeChat)) {
          console.log("✅ Adding incoming message to active chat");
          return [...prevMessages, msg];
        }

        console.log(
          "ℹ️ Message for different chat, not adding to current view"
        );
        return prevMessages;
      });

      // UPDATE SIDEBAR
      setChats((prev) => {
        const filtered = prev.filter((c) => !cleanCompare(c.recipient, chatId));
        return [
          {
            recipient: chatId,
            lastMessage: msg.content,
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            isGroup: msg.isGroup || chatId.endsWith("@g.us"),
          },
          ...filtered,
        ];
      });
    };

    const handleStatusUpdate = (update) => {
      console.log("📊 Status update:", update);
      setMessages((prev) =>
        prev.map((m) => {
          if (m.messageId === update.messageId) {
            return { ...m, status: update.status };
          }
          return m;
        })
      );
    };

    const handleTyping = ({ contact, isTyping }) => {
      if (cleanCompare(contact, activeChat)) {
        setContactTyping(isTyping);
      }
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("messageStatusUpdate", handleStatusUpdate);
    socket.on("typingUpdate", handleTyping);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messageStatusUpdate", handleStatusUpdate);
      socket.off("typingUpdate", handleTyping);
    };
  }, [sessionId, activeChat, getChatId, cleanCompare]);

  // ============================================================
  // FETCH CHAT LIST — FIXED GROUPING
  // ============================================================
  useEffect(() => {
    if (!sessionId) return;

    const loadChats = async () => {
      try {
        const res = await api.get(`/whatsapp/${sessionId}/history`);
        const msgs = res.data.data || [];

        // Group messages by proper chat ID
        const grouped = Object.values(
          msgs.reduce((acc, m) => {
            // Extract chat ID based on direction
            let chatId;
            if (m.direction === "in") {
              chatId = m.sender;
            } else {
              chatId = m.recipient;
            }

            // Normalize
            if (chatId && !chatId.includes("@")) {
              chatId = `${chatId.replace(/\D/g, "")}@s.whatsapp.net`;
            }

            // Keep latest message per chat
            if (
              !acc[chatId] ||
              new Date(m.createdAt) > new Date(acc[chatId].createdAt)
            ) {
              acc[chatId] = { ...m, chatId };
            }

            return acc;
          }, {})
        );

        setChats(
          grouped.map((m) => ({
            recipient: m.chatId,
            lastMessage: m.content,
            time: new Date(m.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            isGroup: m.chatId?.endsWith("@g.us") || false,
          }))
        );
      } catch (err) {
        console.error("Chat list load failed", err);
      }
    };

    loadChats();
  }, [sessionId]);

  // ============================================================
  // FETCH MESSAGES FOR ACTIVE CHAT
  // ============================================================
  useEffect(() => {
    if (!sessionId || !activeChat) return;

    const loadMessages = async () => {
      try {
        const res = await api.get(
          `/whatsapp/${sessionId}/history/${activeChat}`
        );
        const sorted = (res.data.data || []).sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
        setMessages(sorted);
      } catch (err) {
        console.error("Message load failed", err);
      }
    };

    loadMessages();

    const roomJid = normalizeJid(activeChat);
    socket.emit("joinChat", { sessionId, recipient: roomJid });

    return () => {
      socket.emit("leaveChat", { sessionId, recipient: roomJid });
    };
  }, [sessionId, activeChat, normalizeJid]);

  // ============================================================
  // AUTO SCROLL
  // ============================================================
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ============================================================
  // SEND MESSAGE — NO SOCKET EMISSION NEEDED
  // ============================================================
  const sendMessage = async () => {
    if (!input.trim() || !sessionId || !activeChat) return;

    const jid = normalizeJid(activeChat);
    const isGroup = jid.endsWith("@g.us");
    const tempId = `temp-${Date.now()}-${Math.random()}`;

    const temp = {
      _id: tempId,
      sender: sessionId,
      recipient: jid,
      content: input,
      direction: "out",
      status: "pending",
      isGroup,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, temp]);
    const messageContent = input;
    setInput("");

    try {
      const url = isGroup
        ? `/whatsapp/${sessionId}/send-group`
        : `/whatsapp/${sessionId}/send`;

      const payload = isGroup
  ? { 
      groupId: jid, 
      message: inputText,     // converted WhatsApp markup
      htmlMessage: inputHtml  // CKEditor HTML (ADD HERE)
    }
  : { 
      number: jid, 
      message: inputText,     // converted WhatsApp markup
      htmlMessage: inputHtml  // CKEditor HTML (ADD HERE)
    };


      const res = await api.post(url, payload);

      if (res.data.success) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === tempId
              ? { ...m, status: "sent", messageId: res.data.messageId }
              : m
          )
        );
      } else {
        setMessages((prev) =>
          prev.map((m) => (m._id === tempId ? { ...m, status: "failed" } : m))
        );
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) => (m._id === tempId ? { ...m, status: "failed" } : m))
      );
      console.error("Send error", err);
    }
  };
  const sendMessageWithHtml = async () => {
    if (!inputHtml.trim() && !inputText.trim()) return;
    if (!sessionId || !activeChat) return;

    const jid = normalizeJid(activeChat);
    const isGroup = jid.endsWith("@g.us");
    const tempId = `temp-${Date.now()}`;

    const temp = {
      _id: tempId,
      sender: sessionId,
      recipient: jid,
      contentHtml: inputHtml,
      contentText: inputText,
      direction: "out",
      status: "pending",
      isGroup,
      createdAt: new Date(),
    };

    setMessages((p) => [...p, temp]);

    setInputHtml("");
    setInputText("");

    try {
      const url = isGroup
        ? `/whatsapp/${sessionId}/send-group`
        : `/whatsapp/${sessionId}/send`;

      const payload = isGroup
        ? { groupId: jid, message: inputText, htmlMessage: inputHtml }
        : { number: jid, message: inputText, htmlMessage: inputHtml };

      const res = await api.post(url, payload);

      if (res.data.success) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === tempId
              ? { ...m, status: "sent", messageId: res.data.messageId }
              : m
          )
        );
      } else {
        setMessages((prev) =>
          prev.map((m) => (m._id === tempId ? { ...m, status: "failed" } : m))
        );
      }
    } catch (err) {
      console.error("Send error", err);
    }
  };

  // ============================================================
  // HELPERS
  // ============================================================
  const getStatus = (status) => {
    if (status === "read") return "💙💙";
    if (status === "delivered") return "✅✅";
    if (status === "sent") return "✅";
    if (status === "pending") return "⏳";
    return "❌";
  };

  const formatTime = (t) =>
    new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const formatContactName = (id) => id.replace(/@(s\.whatsapp\.net|g\.us)/, "");

  /* ---------------- UI ---------------- */
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">💬</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">WhatsApp Web</h1>
              <p className="text-sm text-gray-600">Send messages seamlessly</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Active Session</span>
            </label>
            <select
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white shadow-sm"
            >
              <option value="">Select Session</option>
              {sessions.map((s) => (
                <option key={s.sessionId} value={s.sessionId}>
                  {s.number} ({s.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search or start new chat"
              className="w-full bg-gray-100 border-none rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:bg-white transition-all duration-200"
            />
          </div>
        </div>

        {/* Chats Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">💭</span>
              <h2 className="font-semibold text-lg text-gray-800">Chats</h2>
            </div>
            <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full">
              {chats.length}
            </span>
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl">💬</span>
              </div>
              <p className="text-center text-sm">No chats yet</p>
              <p className="text-center text-xs mt-1">
                Start a conversation to see it here
              </p>
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.recipient}
                onClick={() => setActiveChat(chat.recipient)}
                className={`p-4 border-b border-gray-100 cursor-pointer transition-all duration-200 hover:bg-white group ${
                  activeChat === chat.recipient
                    ? "bg-green-50 border-l-4 border-l-green-500"
                    : "bg-white"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div
                      className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                        chat.recipient.endsWith("@g.us")
                          ? "bg-purple-100 text-purple-600"
                          : "bg-green-100 text-green-600"
                      }`}
                    >
                      {chat.recipient.endsWith("@g.us") ? (
                        <span className="text-lg">👥</span>
                      ) : (
                        <span className="text-lg">👤</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-gray-900 text-sm truncate flex items-center gap-2">
                          {formatContactName(chat.recipient)}
                          {chat.recipient.endsWith("@g.us") && (
                            <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-medium">
                              Group
                            </span>
                          )}
                        </h4>
                        <span className="text-xs text-gray-500 font-medium flex-shrink-0 ml-2">
                          {chat.time}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {chat.lastMessage || "No messages yet"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Window with WhatsApp-like Light Pattern Background */}
      <div className="flex-1 flex flex-col bg-white">
        {!activeChat ? (
          <div
            className="flex-1 flex flex-col items-center justify-center bg-[#efeae2] text-gray-400 p-8"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%239C92AC' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E")`,
              backgroundAttachment: "fixed",
            }}
          >
            <div className="w-24 h-24 bg-white/80 rounded-full flex items-center justify-center mb-6 shadow-lg backdrop-blur-sm">
              <span className="text-4xl">💬</span>
            </div>
            <h3 className="text-xl font-medium text-gray-500 mb-2">
              Welcome to WhatsApp Web
            </h3>
            <p className="text-sm text-center max-w-md">
              Select a chat from the sidebar to start messaging or create a new
              conversation.
            </p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="bg-[#f0f2f5] border-b border-gray-300 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      activeChat.endsWith("@g.us")
                        ? "bg-purple-100 text-purple-600"
                        : "bg-green-100 text-green-600"
                    }`}
                  >
                    {activeChat.endsWith("@g.us") ? (
                      <span className="text-xl">👥</span>
                    ) : (
                      <span className="text-xl">👤</span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {activeChat.endsWith("@g.us")
                        ? `${activeChat.replace("@g.us", "")}`
                        : activeChat.replace("@s.whatsapp.net", "")}
                    </h3>
                    <div className="flex items-center space-x-2">
                      {contactTyping && (
                        <p className="text-sm text-green-600 font-medium flex items-center">
                          <span className="flex space-x-1 mr-2">
                            <span className="w-1 h-1 bg-green-600 rounded-full animate-bounce"></span>
                            <span
                              className="w-1 h-1 bg-green-600 rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></span>
                            <span
                              className="w-1 h-1 bg-green-600 rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></span>
                          </span>
                          Typing...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-6 text-gray-500">
                  <button className="hover:text-gray-700 transition-colors p-2">
                    <span className="text-xl">🔍</span>
                  </button>
                  <button className="hover:text-gray-700 transition-colors p-2">
                    <span className="text-xl">⋮</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Messages Area with WhatsApp Pattern Background */}
            <div
              className="flex-1 overflow-y-auto p-4"
              style={{
                backgroundColor: "#efeae2",
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%239C92AC' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                backgroundAttachment: "fixed",
              }}
            >
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <div className="w-20 h-20 bg-white/80 rounded-full flex items-center justify-center mb-4 shadow-lg backdrop-blur-sm">
                    <span className="text-3xl">💬</span>
                  </div>
                  <p className="text-sm font-medium">No messages yet</p>
                  <p className="text-xs mt-1">
                    Send a message to start the conversation
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((msg, idx) => (
                    <div
                      key={msg._id || msg.messageId || idx}
                      className={`flex ${
                        msg.direction === "out"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl relative group ${
                          msg.direction === "out"
                            ? "bg-[#d9fdd3] rounded-br-none shadow-sm"
                            : "bg-white rounded-bl-none shadow-sm"
                        }`}
                        style={{
                          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
                        }}
                      >
                        {/* Sender name for group messages */}
                        {msg.isGroup && msg.direction === "in" && (
                          <div className="font-semibold text-green-700 text-xs mb-1">
                            {msg.senderName || msg.sender?.split("@")[0]}
                          </div>
                        )}

                        {/* Message content */}
                        {msg.contentHtml ? (
                          <div
                            className="text-sm break-words leading-relaxed"
                            dangerouslySetInnerHTML={{
                              __html: msg.contentHtml,
                            }}
                          />
                        ) : (
                          <div className="text-sm text-gray-800 break-words leading-relaxed">
                            {msg.content || msg.contentText}
                          </div>
                        )}

                        {/* Message timestamp and status */}
                        <div
                          className={`flex items-center justify-end space-x-1 mt-1 ${
                            msg.direction === "out"
                              ? "text-gray-500"
                              : "text-gray-400"
                          }`}
                        >
                          <span className="text-xs font-medium">
                            {formatTime(msg.createdAt)}
                          </span>
                          {msg.direction === "out" && (
                            <span className="text-xs ml-1">
                              {getStatus(msg.status)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={scrollRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="bg-[#f0f2f5] border-t border-gray-300 p-3">
              <div className="flex items-center space-x-2 max-w-6xl mx-auto">
                <div className="flex items-center space-x-1">
                  <button className="text-gray-500 hover:text-gray-700 transition-colors p-3 rounded-full hover:bg-gray-300">
                    📎
                  </button>
                  <button className="text-gray-500 hover:text-gray-700 transition-colors p-3 rounded-full hover:bg-gray-300">
                    😊
                  </button>
                </div>

                <div className="flex-1 bg-white rounded-3xl px-2 py-2 border border-gray-300">
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
                        "redo",
                      ],
                      placeholder: "Type a message...",
                    }}
                    onChange={(event, editor) => {
                      const data = editor.getData();
                      setInputHtml(data);
                      setInputText(convertHtmlToWhatsApp(data));
                    }}
                  />
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => sendMessageWithHtml()}
                    disabled={!inputText.trim() && !inputHtml.trim()}
                    className={`p-3 rounded-full ${
                      inputText.trim()
                        ? "bg-green-500 text-white"
                        : "bg-gray-300 text-gray-400"
                    }`}
                  >
                    ➤
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
