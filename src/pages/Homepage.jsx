// src/pages/Homepage.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import LoginForm from "../components/auth/LoginForm";
import SignupForm from "../components/auth/SignupForm";
import VerifyOtpForm from "../components/auth/VerifyOtpForm";
import { MessageCircle } from "lucide-react";
import { useIsMobile } from "../hooks/use-mobile";
import { motion, AnimatePresence } from "framer-motion";


export default function Homepage() {
  const { user } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "signup" | "verify"
  const [pendingEmail, setPendingEmail] = useState(null);
    const isMobile = useIsMobile();


  useEffect(() => {
    if (user) window.location.href = "/dashboard";
  }, [user]);

  const isSignupMode = mode === "signup" || mode === "verify";
    const fadeVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  const renderDesktopView = () => (
  <div className="min-h-screen w-full flex items-center justify-center bg-page-bg p-6">
      <div className="relative bg-surface rounded-2xl shadow-sm border border-border overflow-hidden w-[768px] max-w-full min-h-[520px]">
        {/* LEFT (Login form when mode === 'login') */}
        <div
          className={
            "absolute top-0 left-0 h-full w-1/2 flex items-center justify-center px-10 transition-transform duration-700 " +
            (isSignupMode
              ? "-translate-x-full opacity-0 pointer-events-none z-10"
              : "translate-x-0 opacity-100 pointer-events-auto z-40")
          }
        >
          <div className="w-full max-w-md">
            {mode === "login" && (
              <LoginForm
                onSwitchToSignup={() => {
                  setMode("signup");
                }}
              />
            )}
          </div>
        </div>

        {/* RIGHT (Signup / Verify form when mode === 'signup' or 'verify') */}
        <div
          className={
            "absolute top-0 right-0 h-full w-1/2 flex items-center justify-center px-10 transition-transform duration-700 " +
            (isSignupMode
              ? "translate-x-0 opacity-100 pointer-events-auto z-40"
              : "translate-x-full opacity-0 pointer-events-none z-10")
          }
        >
          <div className="w-full max-w-md">
            {mode === "signup" && (
              <SignupForm
                onSwitchToLogin={() => setMode("login")}
                onOtpSent={(email) => {
                  setPendingEmail(email);
                  setMode("verify");
                }}
              />
            )}

            {mode === "verify" && (
              <VerifyOtpForm
                email={pendingEmail}
                onSuccess={() => {
                  setMode("login");
                }}
              />
            )}
          </div>
        </div>

        {/* CENTERED GRADIENT PANEL (moves between left/right halves) */}
        <div
          className={
            "absolute top-0 left-1/2 h-full w-1/2 overflow-hidden transition-all duration-700 " +
            (isSignupMode ? "-translate-x-full rounded-r-[40px]" : "translate-x-0 rounded-l-[40px]")
          }
          aria-hidden
        >
          {/* big sliding bar (200% width) that reveals one of two gradient halves */}
          <div
            className={
              "absolute left-[-100%] top-0 h-full w-[200%] flex transition-transform duration-700 " +
              (isSignupMode ? "translate-x-1/2" : "translate-x-0")
            }
          >
            {/* left gradient half (shows when signup is active) */}
            <div className="w-1/2 h-full flex flex-col items-center justify-center px-8 bg-primary text-white">
              <h2 className="text-3xl font-extrabold mb-3">Welcome Back to Walytic</h2>
<p className="text-sm mb-6">Log in to access your WhatsApp automation dashboard and manage conversations seamlessly.</p>

              <button
                onClick={() => setMode("login")}
                className="bg-white text-green-600 px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition"
              >
                Sign In
              </button>
            </div>

            {/* right gradient half (shows when login is active) */}
            <div className="w-1/2 h-full flex flex-col items-center justify-center px-8 bg-primary text-white">
              <h2 className="text-3xl font-extrabold mb-3">Welcome to Walytic</h2>
<p className="text-sm mb-6">Empower your business with efficient WhatsApp web services, campaign automation, and real-time engagement insights.</p>

              <button
                onClick={() => setMode("signup")}
                className="bg-white text-blue-600 px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>

        {/* LOGO: moves left/right depending on mode */}
        {/* <div
          className={
            "absolute top-4 flex items-center gap-3 transition-all duration-700 " +
            (isSignupMode ? "right-4 pr-2" : "left-4 pl-2")
          }
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">
            Walytic
          </span>
        </div> */}
       <div
  className={
    "absolute top-4 flex items-center transition-all duration-700 " +
    (isSignupMode ? "right-4 pr-2" : "left-4 pl-2")
  }
>
  <img
    src="/bluecanva.png"
    alt="Walytic"
    /* Negative margin pulls the text closer to match the logo exactly */
    className="h-8 w-auto md:h-10 transition-all -mr-1.5"
  />
  <span 
    style={{ fontFamily: "'Montserrat', sans-serif" }}
    className="text-lg md:text-[24px] font-bold tracking-[-0.05em] leading-none bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600"
  >
    Walytic
  </span>
</div>

      </div>
    </div>
  );
  // ✅ Custom mobile layout
  const renderMobileView = () => (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-primary p-6">
      {/* Logo */}
      {/* <div className="flex items-center gap-3 mb-8 mt-4">
        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
          <MessageCircle className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">Walytic</h1>
      </div> */}
      <div className="flex items-center justify-center mb-8 mt-4">
  <img
    src="/walytic.png"
    alt="Walytic"
    className="h-10 w-auto md:h-12 object-contain"
  />
  <h1 className="text-2xl font-bold text-white">Walytic</h1>
</div>


      {/* Animated Card */}
      <div className="w-full max-w-sm bg-surface rounded-2xl p-6 shadow-sm border border-border">
        <AnimatePresence mode="wait">
          {mode === "login" && (
            <motion.div
              key="login"
              variants={fadeVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <LoginForm onSwitchToSignup={() => setMode("signup")} />
            </motion.div>
          )}
          {mode === "signup" && (
            <motion.div
              key="signup"
              variants={fadeVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <SignupForm
                onSwitchToLogin={() => setMode("login")}
                onOtpSent={(email) => {
                  setPendingEmail(email);
                  setMode("verify");
                }}
              />
            </motion.div>
          )}
          {mode === "verify" && (
            <motion.div
              key="verify"
              variants={fadeVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <VerifyOtpForm
                email={pendingEmail}
                onSuccess={() => setMode("login")}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Small footer */}
      <p className="text-white/80 text-xs mt-8">
        © {new Date().getFullYear()} Walytic. All rights reserved.
      </p>
    </div>
  );

  return (
    <div className="w-full min-h-screen flex items-center justify-center">
      {isMobile ? renderMobileView() : renderDesktopView()}
    </div>
  );
}
