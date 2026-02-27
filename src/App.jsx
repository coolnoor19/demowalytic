// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/AuthContext";
import { SubscriptionProvider } from "./contexts/SubscriptionContext";
import { SessionProvider } from "./contexts/SessionContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminRoute from "./components/auth/AdminRoute";
import TwoFactorSetup from "./components/settings/TwoFactorSetup";

import Homepage from "./pages/Homepage";
import Dashboard from "./pages/Dashboard";
import Pricing from "./pages/Pricing";
import NotFound from "./pages/NotFound";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancelled from "./pages/PaymentCancelled";
import AuthSuccess from "./pages/AuthSuccess";
import ResetPassword from "./pages/ResetPassword";
import AdminDashboard from "./pages/AdminDashboard";
import Message from "./pages/Message";

export default function App() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <SessionProvider>
          <Router>
            <Toaster position="top-right" richColors />
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Homepage />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/notfound" element={<NotFound />} />
              <Route path="/onauthsuccess" element={<AuthSuccess />} />
              <Route path="/resetpassword" element={<ResetPassword />} />
              <Route path="/billing/success" element={<PaymentSuccess />} />
              <Route path="/billing/cancel" element={<PaymentCancelled />} />
              <Route path="/settings/twofactor" element={<TwoFactorSetup />} />

              {/* Protected user routes */}
              <Route
                path="/dashboard/*"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/message"
                element={
                  <ProtectedRoute>
                    <Message />
                  </ProtectedRoute>
                }
              />

              {/* Admin-only routes */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </SessionProvider>
      </SubscriptionProvider>
    </AuthProvider>
  );
}
