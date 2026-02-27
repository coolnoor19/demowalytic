import { useEffect, useState } from "react";
import api from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { toast } from "sonner";

export default function Profile() {
  const { user, token, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
  });

  useEffect(() => {
    if (token) {
      api.get("/auth/me").then((res) => {
        setProfile(res.data.user);
        setName(res.data.user.name || "");
        setAvatar(res.data.user.avatar || "");
      });
    }
  }, [token]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put("/auth/update-profile", { name, avatar });
      toast.success(res.data.message);
      setProfile(res.data.user);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/change-password", passwordData);
      toast.success(res.data.message);
      setPasswordData({ currentPassword: "", newPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return <div className="text-center mt-20 text-text-secondary">Loading profile...</div>;

  return (
    <div className="max-w-2xl mx-auto bg-surface rounded-xl border border-border p-6">
      <h2 className="text-2xl font-bold mb-4 text-center text-text-dark">User Profile</h2>

      <div className="flex flex-col items-center mb-6">
        <img
          src={avatar || "https://via.placeholder.com/100"}
          alt="Avatar"
          className="w-24 h-24 rounded-full border border-border mb-2"
        />
        <p className="text-text-secondary">{profile.email}</p>
      </div>

      <form onSubmit={handleUpdate} className="space-y-4">
        <Input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          type="text"
          placeholder="Profile photo URL"
          value={avatar}
          onChange={(e) => setAvatar(e.target.value)}
        />
        <Button
          type="submit"
          disabled={loading}
          className="w-full"
        >
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </form>

      <hr className="my-6 border-border" />

      <h3 className="text-lg font-semibold mb-2 text-text-dark">Change Password</h3>
      <form onSubmit={handlePasswordChange} className="space-y-3">
        <Input
          type="password"
          placeholder="Current Password"
          value={passwordData.currentPassword}
          onChange={(e) =>
            setPasswordData({ ...passwordData, currentPassword: e.target.value })
          }
        />
        <Input
          type="password"
          placeholder="New Password"
          value={passwordData.newPassword}
          onChange={(e) =>
            setPasswordData({ ...passwordData, newPassword: e.target.value })
          }
        />
        <Button
          type="submit"
          disabled={loading}
          className="w-full"
        >
          {loading ? "Changing..." : "Change Password"}
        </Button>
      </form>

      <hr className="my-6 border-border" />
      <Button
        variant="destructive"
        onClick={logout}
        className="w-full"
      >
        Logout
      </Button>
    </div>
  );
}
