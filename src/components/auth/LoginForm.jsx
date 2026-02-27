// import { useState, useEffect } from "react";
// import { Input } from "../ui/input";
// import { Button } from "../ui/button";
// import { useAuth } from "../../contexts/AuthContext";
// import api from "../../lib/api";
// import { Eye, EyeOff } from "lucide-react";
// import { toast } from "sonner";

// export default function LoginForm({ onSwitchToSignup, onSuccess }) {
//   const { login } = useAuth();
//   const [form, setForm] = useState({ email: "", password: "" });
//   const [loading, setLoading] = useState(false);
//   const [twoFactorStep, setTwoFactorStep] = useState(false);
//   const [otp, setOtp] = useState("");

//   // 👁️ password visibility states
//   const [showPassword, setShowPassword] = useState(false);
//   const [showNewPassword, setShowNewPassword] = useState(false);

//   // forgot password states
//   const [showForgot, setShowForgot] = useState(false);
//   const [resetStep, setResetStep] = useState(1);
//   const [resetData, setResetData] = useState({
//     email: "",
//     otp: "",
//     newPassword: "",
//   });

//   useEffect(() => {
//     const params = new URLSearchParams(window.location.search);
//     const token = params.get("token");
//     if (token) {
//       localStorage.setItem("token", token);
//       window.history.replaceState({}, document.title, "/dashboard");
//       window.location.href = "/dashboard";
//     }
//   }, []);

//   const handleChange = (e) =>
//     setForm({ ...form, [e.target.name]: e.target.value });

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       const res = await login(form.email, form.password);

//       if (res?.twoFactorRequired) {
//         setTwoFactorStep(true);
//         return;
//       }

//       window.location.href = "/dashboard";
//       if (onSuccess) onSuccess();
//     } catch (err) {
//       toast.error(err.response?.data?.message || "Login failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleVerify2FA = async () => {
//     try {
//       setLoading(true);
//       const apiBase = import.meta.env.VITE_API_URL || "http://localhost:3003/api";
//       const res = await fetch(`${apiBase}/auth/verify-2fa`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email: form.email, token: otp }),
//       });

//       const data = await res.json();
//       if (!data.success) throw new Error(data.message || "Invalid OTP");

//       localStorage.setItem("token", data.accessToken);
//       window.location.href = "/dashboard";
//     } catch (err) {
//       toast.error(err.message || "2FA verification failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleGoogleLogin = () => {
//     const apiBase = import.meta.env.VITE_API_URL || "http://localhost:3003/api";
//     window.location.href = `${apiBase}/auth/google`;
//   };

//   // forgot password handlers
//   const handleSendOtp = async () => {
//     try {
//       setLoading(true);
//       const res = await api.post("/auth/forgot-password", {
//         email: resetData.email,
//       });
//       toast.success(res.data.message || "OTP sent to your email");
//       setResetStep(2);
//     } catch (err) {
//       toast.error(err.response?.data?.message || "Failed to send OTP");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleResetPassword = async () => {
//     try {
//       setLoading(true);
//       const res = await api.post("/auth/reset-password", resetData);
//       toast.success(res.data.message || "Password reset successful");
//       setShowForgot(false);
//       setResetStep(1);
//     } catch (err) {
//       toast.error(err.response?.data?.message || "Failed to reset password");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // forgot password view
//   if (showForgot) {
//     return (
//       <div className="space-y-4 text-center">
//         <h2 className="text-2xl font-semibold text-gray-800">Forgot Password</h2>
//         <p className="text-gray-500 mb-4">
//           {resetStep === 1
//             ? "Enter your email to receive an OTP."
//             : "Enter the OTP and your new password."}
//         </p>

//         {resetStep === 1 ? (
//           <>
//             <Input
//               type="email"
//               placeholder="Email"
//               value={resetData.email}
//               onChange={(e) =>
//                 setResetData({ ...resetData, email: e.target.value })
//               }
//               required
//             />
//             <Button onClick={handleSendOtp} disabled={loading} className="w-full">
//               {loading ? "Sending..." : "Send OTP"}
//             </Button>
//           </>
//         ) : (
//           <>
//             <Input
//               placeholder="OTP"
//               maxLength={6}
//               value={resetData.otp}
//               onChange={(e) =>
//                 setResetData({ ...resetData, otp: e.target.value })
//               }
//               required
//             />

//             {/* 👁️ New Password Field with visibility toggle */}
//             <div className="relative">
//               <Input
//                 type={showNewPassword ? "text" : "password"}
//                 placeholder="New Password"
//                 value={resetData.newPassword}
//                 onChange={(e) =>
//                   setResetData({ ...resetData, newPassword: e.target.value })
//                 }
//                 required
//               />
//               <button
//                 type="button"
//                 className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
//                 onClick={() => setShowNewPassword(!showNewPassword)}
//               >
//                 {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//               </button>
//             </div>

//             <Button
//               onClick={handleResetPassword}
//               disabled={loading}
//               className="w-full"
//             >
//               {loading ? "Resetting..." : "Reset Password"}
//             </Button>
//           </>
//         )}

//         <p className="text-sm text-gray-600 mt-4">
//           Remember your password?{" "}
//           <button
//             type="button"
//             onClick={() => setShowForgot(false)}
//             className="text-blue-600 hover:underline"
//           >
//             Back to Login
//           </button>
//         </p>
//       </div>
//     );
//   }

//   // normal login
//   return (
//     <div className="space-y-4 text-center">
//       {!twoFactorStep ? (
//         <form onSubmit={handleSubmit} className="space-y-4 text-center">
//           <h2 className="text-2xl font-semibold text-gray-800 mt-10">
//             Welcome Back
//           </h2>

//           <p className="text-gray-500 mb-6">
//             Enter your credentials to access your account.
//           </p>

//           <Input
//             name="email"
//             type="email"
//             placeholder="Email"
//             onChange={handleChange}
//             required
//           />

//           {/* 👁️ Password Field with Show/Hide */}
//           <div className="relative">
//             <Input
//               name="password"
//               type={showPassword ? "text" : "password"}
//               placeholder="Password"
//               onChange={handleChange}
//               required
//             />
//             <button
//               type="button"
//               className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
//               onClick={() => setShowPassword(!showPassword)}
//             >
//               {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//             </button>
//           </div>

//           {/* Forgot Password Link */}
//           <div className="flex justify-end">
//             <button
//               type="button"
//               onClick={() => setShowForgot(true)}
//               className="text-sm text-blue-600 hover:underline"
//             >
//               Forgot password?
//             </button>
//           </div>

//           <Button type="submit" className="w-full" disabled={loading}>
//             {loading ? "Logging in..." : "Login"}
//           </Button>

//           {/* Divider */}
//           <div className="flex items-center my-4">
//             <hr className="flex-grow border-gray-300" />
//             <span className="mx-2 text-gray-500">or</span>
//             <hr className="flex-grow border-gray-300" />
//           </div>

//           {/* Google Login */}
//           <Button
//             type="button"
//             className="w-full bg-white border text-gray-800 hover:bg-gray-100 flex items-center justify-center"
//             onClick={handleGoogleLogin}
//           >
//             <img
//               src="https://developers.google.com/identity/images/g-logo.png"
//               alt="Google"
//               className="w-5 h-5 mr-2"
//             />
//             Continue with Google
//           </Button>

//           <p className="text-sm text-gray-600 mt-4">
//             Don’t have an account?{" "}
//             <button
//               type="button"
//               onClick={onSwitchToSignup}
//               className="text-blue-600 hover:underline"
//             >
//               Sign Up
//             </button>
//           </p>
//         </form>
//       ) : (
//         <div className="space-y-4">
//           <h2 className="text-2xl font-semibold text-gray-800">
//             Two-Factor Authentication
//           </h2>
//           <p className="text-gray-500 mb-4">
//             Enter the 6-digit code from your Google Authenticator app.
//           </p>
//           <Input
//             name="otp"
//             placeholder="Enter 6-digit OTP"
//             maxLength={6}
//             value={otp}
//             onChange={(e) => setOtp(e.target.value)}
//             required
//           />
//           <Button
//             type="button"
//             onClick={handleVerify2FA}
//             className="w-full"
//             disabled={loading}
//           >
//             {loading ? "Verifying..." : "Verify & Login"}
//           </Button>
//         </div>
//       )}
//     </div>
//   );
// }




import { useState, useEffect } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../lib/api";
import { Eye, EyeOff } from "lucide-react"; // 👁️ for show/hide icons

export default function LoginForm({ onSwitchToSignup, onSuccess }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [twoFactorStep, setTwoFactorStep] = useState(false);
  const [otp, setOtp] = useState("");

  // 👁️ password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // forgot password states
  const [showForgot, setShowForgot] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetData, setResetData] = useState({
    email: "",
    otp: "",
    newPassword: "",
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("token", token);
      window.history.replaceState({}, document.title, "/dashboard");
      window.location.href = "/dashboard";
    }
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(form.email, form.password);

      if (res?.twoFactorRequired) {
        setTwoFactorStep(true);
        return;
      }

      window.location.href = "/dashboard";
      if (onSuccess) onSuccess();
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:3003/api/auth/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, token: otp }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Invalid OTP");

      localStorage.setItem("token", data.accessToken);
      window.location.href = "/dashboard";
    } catch (err) {
      alert(err.message || "2FA verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:3003/api/auth/google";
  };

  // forgot password handlers
  const handleSendOtp = async () => {
    try {
      setLoading(true);
      const res = await api.post("/auth/forgot-password", {
        email: resetData.email,
      });
      alert(res.data.message || "OTP sent to your email");
      setResetStep(2);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      setLoading(true);
      const res = await api.post("/auth/reset-password", resetData);
      alert(res.data.message || "Password reset successful");
      setShowForgot(false);
      setResetStep(1);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  // forgot password view
  if (showForgot) {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-2xl font-semibold text-gray-800">Forgot Password</h2>
        <p className="text-gray-500 mb-4">
          {resetStep === 1
            ? "Enter your email to receive an OTP."
            : "Enter the OTP and your new password."}
        </p>

        {resetStep === 1 ? (
          <>
            <Input
              type="email"
              placeholder="Email"
              value={resetData.email}
              onChange={(e) =>
                setResetData({ ...resetData, email: e.target.value })
              }
              required
            />
            <Button onClick={handleSendOtp} disabled={loading} className="w-full">
              {loading ? "Sending..." : "Send OTP"}
            </Button>
          </>
        ) : (
          <>
            <Input
              placeholder="OTP"
              maxLength={6}
              value={resetData.otp}
              onChange={(e) =>
                setResetData({ ...resetData, otp: e.target.value })
              }
              required
            />

            {/* 👁️ New Password Field with visibility toggle */}
            <div className="relative">
              <Input
                type={showNewPassword ? "text" : "password"}
                placeholder="New Password"
                value={resetData.newPassword}
                onChange={(e) =>
                  setResetData({ ...resetData, newPassword: e.target.value })
                }
                required
              />
              <button
                type="button"
                className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <Button
              onClick={handleResetPassword}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </>
        )}

        <p className="text-sm text-gray-600 mt-4">
          Remember your password?{" "}
          <button
            type="button"
            onClick={() => setShowForgot(false)}
            className="text-blue-600 hover:underline"
          >
            Back to Login
          </button>
        </p>
      </div>
    );
  }

  // normal login
  return (
    <div className="space-y-4 text-center">
      {!twoFactorStep ? (
        <form onSubmit={handleSubmit} className="space-y-4 text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mt-10">
            Welcome Back
          </h2>

          <p className="text-gray-500 mb-6">
            Enter your credentials to access your account.
          </p>

          <Input
            name="email"
            type="email"
            placeholder="Email"
            onChange={handleChange}
            required
          />

          {/* 👁️ Password Field with Show/Hide */}
          <div className="relative">
            <Input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Forgot Password Link */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowForgot(true)}
              className="text-sm text-blue-600 hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>

          {/* Divider */}
          <div className="flex items-center my-4">
            <hr className="flex-grow border-gray-300" />
            <span className="mx-2 text-gray-500">or</span>
            <hr className="flex-grow border-gray-300" />
          </div>

          {/* Google Login */}
          <Button
            type="button"
            className="w-full bg-white border text-gray-800 hover:bg-gray-100 flex items-center justify-center"
            onClick={handleGoogleLogin}
          >
            <img
              src="https://developers.google.com/identity/images/g-logo.png"
              alt="Google"
              className="w-5 h-5 mr-2"
            />
            Continue with Google
          </Button>

          <p className="text-sm text-gray-600 mt-4">
            Don’t have an account?{" "}
            <button
              type="button"
              onClick={onSwitchToSignup}
              className="text-blue-600 hover:underline"
            >
              Sign Up
            </button>
          </p>
        </form>
      ) : (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800">
            Two-Factor Authentication
          </h2>
          <p className="text-gray-500 mb-4">
            Enter the 6-digit code from your Google Authenticator app.
          </p>
          <Input
            name="otp"
            placeholder="Enter 6-digit OTP"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
          <Button
            type="button"
            onClick={handleVerify2FA}
            className="w-full"
            disabled={loading}
          >
            {loading ? "Verifying..." : "Verify & Login"}
          </Button>
        </div>
      )}
    </div>
  );
}