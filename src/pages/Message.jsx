import { useEffect, useState, useRef, useCallback } from "react";
import api from "../lib/api";
import { socket } from "../socket";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import sanitizeHtml from "sanitize-html"; // optional: run-time client sanitize
import { Search, Plus, Phone, Video, Info, MoreHorizontal, Paperclip, Smile, Send } from "lucide-react";

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

  const getInitials = (id) => {
    const name = formatContactName(id);
    if (!name) return "?";
    const digits = name.replace(/\D/g, "");
    if (digits.length > 4) return digits.slice(-2);
    return name.slice(0, 2).toUpperCase();
  };

  const AVATAR_COLORS = [
    "bg-blue-100 text-blue-600",
    "bg-emerald-100 text-emerald-600",
    "bg-amber-100 text-amber-600",
    "bg-rose-100 text-rose-600",
    "bg-purple-100 text-purple-600",
    "bg-cyan-100 text-cyan-600",
  ];

  const getAvatarColor = (id) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  };

  const STATUS_DOTS = ["bg-emerald-500", "bg-amber-400", "bg-rose-400"];
  const getStatusDot = (id) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return STATUS_DOTS[Math.abs(hash) % STATUS_DOTS.length];
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="flex h-full bg-page-bg p-4 gap-4">
      {/* ============ SIDEBAR ============ */}
      <div className="w-[360px] flex-shrink-0 bg-surface rounded-2xl border border-border flex flex-col overflow-hidden">
        {/* Sidebar Header */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-text-dark">Chats</h1>
            <button className="w-8 h-8 rounded-full bg-page-bg border border-border flex items-center justify-center text-text-secondary hover:bg-primary hover:text-white hover:border-primary transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full bg-page-bg border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-dark placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Session Selector (compact) */}
        <div className="px-5 pb-3">
          <select
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            className="w-full bg-page-bg border border-border rounded-lg px-3 py-2 text-sm text-text-dark focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          >
            <option value="">Select Session</option>
            {sessions.map((s) => (
              <option key={s.sessionId} value={s.sessionId}>
                {s.number} ({s.status})
              </option>
            ))}
          </select>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-text-muted p-6">
              <div className="w-14 h-14 bg-page-bg rounded-full flex items-center justify-center mb-3 border border-border">
                <span className="text-2xl">💬</span>
              </div>
              <p className="text-sm font-medium">No chats yet</p>
              <p className="text-xs mt-1">Start a conversation to see it here</p>
            </div>
          ) : (
            chats.map((chat) => {
              const isActive = activeChat === chat.recipient;
              const isGroup = chat.recipient.endsWith("@g.us");
              return (
                <div
                  key={chat.recipient}
                  onClick={() => setActiveChat(chat.recipient)}
                  className={`flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-colors border-l-3 ${
                    isActive
                      ? "bg-primary/5 border-l-primary"
                      : "border-l-transparent hover:bg-page-bg"
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold ${
                      isGroup ? "bg-primary/10 text-primary" : getAvatarColor(chat.recipient)
                    }`}>
                      {isGroup ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      ) : (
                        getInitials(chat.recipient)
                      )}
                    </div>
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-surface ${getStatusDot(chat.recipient)}`} />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className={`text-sm font-semibold truncate ${isActive ? "text-primary" : "text-text-dark"}`}>
                        {formatContactName(chat.recipient)}
                      </h4>
                      <span className="text-[11px] text-text-muted flex-shrink-0 ml-2">{chat.time}</span>
                    </div>
                    <p className="text-xs text-text-secondary truncate">
                      {chat.lastMessage || "No messages yet"}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ============ CHAT AREA ============ */}
      <div className="flex-1 bg-surface rounded-2xl border border-border flex flex-col overflow-hidden">
        {!activeChat ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center bg-page-bg text-text-muted p-8">
            <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mb-5 shadow-sm border border-border">
              <span className="text-3xl">💬</span>
            </div>
            <h3 className="text-lg font-semibold text-text-dark mb-1">Welcome to Chats</h3>
            <p className="text-sm text-text-secondary text-center max-w-sm">
              Select a conversation from the sidebar to start messaging
            </p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="bg-surface border-b border-border px-5 py-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                      activeChat.endsWith("@g.us") ? "bg-primary/10 text-primary" : getAvatarColor(activeChat)
                    }`}>
                      {activeChat.endsWith("@g.us") ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      ) : (
                        getInitials(activeChat)
                      )}
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-surface" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-dark">
                      {activeChat.endsWith("@g.us")
                        ? activeChat.replace("@g.us", "")
                        : activeChat.replace("@s.whatsapp.net", "")}
                    </h3>
                    {contactTyping ? (
                      <p className="text-xs text-primary font-medium flex items-center gap-1">
                        <span className="flex gap-0.5">
                          <span className="w-1 h-1 bg-primary rounded-full animate-bounce" />
                          <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                          <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                        </span>
                        Typing...
                      </p>
                    ) : (
                      <p className="text-xs text-emerald-500 font-medium">Online</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button className="w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary hover:bg-page-bg transition-colors">
                    <Phone className="w-[18px] h-[18px]" />
                  </button>
                  <button className="w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary hover:bg-page-bg transition-colors">
                    <Video className="w-[18px] h-[18px]" />
                  </button>
                  <button className="w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary hover:bg-page-bg transition-colors">
                    <Info className="w-[18px] h-[18px]" />
                  </button>
                  <button className="w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary hover:bg-page-bg transition-colors">
                    <MoreHorizontal className="w-[18px] h-[18px]" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 bg-page-bg">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-text-muted">
                  <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-3 border border-border">
                    <span className="text-2xl">💬</span>
                  </div>
                  <p className="text-sm font-medium">No messages yet</p>
                  <p className="text-xs mt-1">Send a message to start the conversation</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg, idx) => {
                    const isOut = msg.direction === "out";
                    return (
                      <div
                        key={msg._id || msg.messageId || idx}
                        className={`flex items-end gap-2 ${isOut ? "justify-end" : "justify-start"}`}
                      >
                        {/* Incoming avatar */}
                        {!isOut && (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${getAvatarColor(msg.sender || activeChat)}`}>
                            {getInitials(msg.sender || activeChat)}
                          </div>
                        )}

                        <div className={`max-w-xs lg:max-w-md ${isOut ? "items-end" : "items-start"}`}>
                          <div
                            className={`px-4 py-2.5 ${
                              isOut
                                ? "bg-primary text-white rounded-2xl rounded-br-sm"
                                : "bg-surface text-text-dark rounded-2xl rounded-bl-sm border border-border"
                            }`}
                            style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.06)" }}
                          >
                            {/* Sender name for group messages */}
                            {msg.isGroup && msg.direction === "in" && (
                              <div className="font-semibold text-primary text-xs mb-1">
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
                              <div className="text-sm break-words leading-relaxed">
                                {msg.content || msg.contentText}
                              </div>
                            )}
                          </div>

                          {/* Timestamp + status below bubble */}
                          <div className={`flex items-center gap-1 mt-1 px-1 ${isOut ? "justify-end" : "justify-start"}`}>
                            <span className="text-[11px] text-text-muted">
                              {formatTime(msg.createdAt)}
                            </span>
                            {isOut && (
                              <span className="text-[11px]">
                                {getStatus(msg.status)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={scrollRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="bg-surface border-t border-border px-5 py-3">
              <div className="flex items-center gap-2">
                <button className="w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary hover:bg-page-bg transition-colors">
                  <Paperclip className="w-[18px] h-[18px]" />
                </button>
                <button className="w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary hover:bg-page-bg transition-colors">
                  <Smile className="w-[18px] h-[18px]" />
                </button>

                <div className="flex-1 bg-page-bg rounded-xl px-2 py-1.5 border border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all [&_.ck-editor]:border-0 [&_.ck-toolbar]:bg-transparent [&_.ck-toolbar]:border-0 [&_.ck-toolbar]:p-0 [&_.ck-content]:bg-transparent [&_.ck-content]:border-0 [&_.ck-content]:shadow-none [&_.ck-content]:min-h-[28px] [&_.ck-content]:p-0 [&_.ck-content]:text-sm [&_.ck.ck-editor]:shadow-none [&_.ck-focused]:shadow-none [&_.ck-focused]:border-0 [&_.ck.ck-reset]:text-text-dark">
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

                <button className="w-9 h-9 rounded-lg flex items-center justify-center text-text-secondary hover:bg-page-bg transition-colors">
                  <Smile className="w-[18px] h-[18px]" />
                </button>

                <button
                  onClick={() => sendMessageWithHtml()}
                  disabled={!inputText.trim() && !inputHtml.trim()}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    inputText.trim() || inputHtml.trim()
                      ? "bg-primary text-white hover:bg-primary-hover shadow-sm"
                      : "bg-border text-text-muted"
                  }`}
                >
                  <Send className="w-[18px] h-[18px]" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
