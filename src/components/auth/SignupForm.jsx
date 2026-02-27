import { useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useAuth } from "../../contexts/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function SignupForm({ onSwitchToLogin, onOtpSent }) {
  const { signup } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // 👁️ toggle state

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signup(form.email, form.password, form.name);
      onOtpSent(form.email); // go to OTP step
    } catch (err) {
      toast.error(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-center">
      <h2 className="text-2xl font-semibold text-gray-800">
        Create an account
      </h2>
      <p className="text-gray-500 mb-6">
        Enter your details to create a new account.
      </p>

      <Input
        name="name"
        placeholder="Full Name"
        onChange={handleChange}
        required
      />
      <Input
        name="email"
        type="email"
        placeholder="Email"
        onChange={handleChange}
        required
      />

      {/* 👁️ Password input with show/hide toggle */}
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
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Signing up..." : "Sign Up"}
      </Button>

      <p className="text-sm text-gray-600 mt-4">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-blue-600 hover:underline"
        >
          Login
        </button>
      </p>
    </form>
  );
}

