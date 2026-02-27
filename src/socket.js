// // src/socket.js
// import { io } from "socket.io-client";

// // ⚠️ Replace with your backend URL (check index.js in backend, default is 3003)
// const SOCKET_URL = "http://localhost:3003";  //"https://api.walytic.com"

// export const socket = io(SOCKET_URL, {
//   withCredentials: true,
//   autoConnect: true,
// });

// src/socket.js
import { io } from "socket.io-client";

// ⚙️ Use backend URL from your local setup or production
const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3003";

// ✅ Create socket instance
export const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: false, // we’ll control when it connects
  transports: ["websocket", "polling"],
});

// ✅ Handle connection lifecycle for debugging
socket.on("connect", () => {
  console.log("🟢 Socket connected:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("🔴 Socket disconnected:", reason);
});

socket.on("connect_error", (err) => {
  console.error("⚠️ Socket connection error:", err.message);
});
socket.on("reconnect", () => {
  const storedUser = JSON.parse(localStorage.getItem("user") || "null");
  if (storedUser?._id || storedUser?.id) {
    socket.emit("join_user", { userId: storedUser._id || storedUser.id });
    console.log("🔁 Rejoined user room after reconnect:", storedUser._id || storedUser.id);
  }
});


// ✅ Optional: expose a helper to (re)connect safely
export const connectSocket = (userId) => {
  if (!socket.connected) {
    socket.connect();
  }

  if (userId) {
    socket.emit("join_user", { userId: String(userId) });
    console.log("👤 Joined user room:", userId);
  }
};

