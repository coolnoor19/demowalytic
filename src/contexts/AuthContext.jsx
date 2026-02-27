import { createContext, useContext, useState, useEffect } from "react";
import api from "../lib/api";
import { jwtDecode } from "jwt-decode";
import { socket, connectSocket } from "../socket";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(localStorage.getItem("role") || "user");
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);

  /* ---------------- Load & decode token ---------------- */
  useEffect(() => {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      try {
        const decoded = jwtDecode(token);
        setUser(decoded);
        localStorage.setItem("user", JSON.stringify(decoded));
        setRole(decoded.role || "user");
        localStorage.setItem("role", decoded.role || "user");
      } catch {
        setUser(null);
        setRole("user");
      }
    } else {
      delete api.defaults.headers.common["Authorization"];
      setUser(null);
      setRole("user");
    }
    setLoading(false);
  }, [token]);

  /* ---------------- Capture Google redirect token ---------------- */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) {
      localStorage.setItem("token", t);
      window.history.replaceState({}, document.title, "/dashboard");
      window.location.href = "/dashboard";
    }
  }, []);

  /* ---------------- Socket connection & room join ---------------- */
  useEffect(() => {
    if (user?.id || user?._id) {
      const uid = user.id || user._id;
      connectSocket(uid);
    }
  }, [user]);

  /* ---------------- Auth actions ---------------- */
  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    const newToken = res.data.accessToken;
    localStorage.setItem("token", newToken);
    localStorage.setItem("role", res.data.role || "user");
    setToken(newToken);
    setRole(res.data.role || "user");
    return res.data;
  };

  const signup = async (email, password, name) => {
    const res = await api.post("/auth/signup", { email, password, name });
    return res.data;
  };

  const verifyOtp = async (email, otp) => {
    const res = await api.post("/auth/verify-otp", { email, otp });
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.warn("Backend logout failed:", err.response?.data || err.message);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      setToken(null);
      setUser(null);
      setRole("user");
      try {
        socket.disconnect();
      } catch {}
      window.location.href = "/";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        login,
        signup,
        verifyOtp,
        logout,
        loading,
        isAdmin: role === "admin" || role === "Administrator",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
