import React from "react";
import { LogOut, User, Settings, Shield } from "lucide-react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Dropdown } from "../ui/dropdown";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export function UserNav() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  // Get initials from name or email
  const getInitials = (str) => {
    if (!str) return "U";
    return str
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const initials = getInitials(user?.name || user?.email);
  const isAdmin = role === "admin" || role === "Administrator";

  // Dropdown items
  const menuItems = [
    {
      label: (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4" /> Profile
        </div>
      ),
      onClick: () => navigate("/dashboard/profile"),
    },

    isAdmin && {
      label: (
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4" /> Admin Panel
        </div>
      ),
      onClick: () => navigate("/admin"),
    },
    {
      label: (
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4" /> Settings
        </div>
      ),
      onClick: () => navigate("/dashboard/overview?tab=settings"), // ✅ changed
    },
    {
      label: (
        <div className="flex items-center gap-2 text-red-600">
          <LogOut className="h-4 w-4" /> Sign Out
        </div>
      ),
      danger: true,
      onClick: logout,
    },
  ].filter(Boolean); // remove false if not admin

  return (
    <Dropdown
      // Avatar is the dropdown trigger
      label={
        <Avatar className="h-8 w-8 cursor-pointer">
          <AvatarFallback className="bg-gradient-to-r from-green-500 to-blue-600 text-white">
            {initials}
          </AvatarFallback>
        </Avatar>
      }
      items={menuItems}
    />
  );
}
