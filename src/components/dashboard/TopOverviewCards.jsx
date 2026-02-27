import {
  Plug,
  BarChart3,
  MessageCircle,
  Crown,
  Shield,
  MoreHorizontal,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "../../contexts/SubscriptionContext";
import { useAuth } from "../../contexts/AuthContext";
import { useSession } from "../../contexts/SessionContext";
import { Badge } from "../ui/badge";

export default function TopOverviewCards() {
  const navigate = useNavigate();
  const { subscription, loading: subLoading } = useSubscription();
  const { sessions, loading: sessionLoading } = useSession();
  const { isAdmin } = useAuth();

  const loading = subLoading || sessionLoading;

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-[140px] rounded-xl bg-surface border border-border animate-pulse"
          />
        ))}
      </div>
    );
  }

  const sub = subscription?.subscription || subscription || null;
  const usage = sub?.usageByKey || {};
  const connections = usage.whatsappConnection || { used: 0, total: 0 };
  const messages = usage.message || { used: 0, total: 0 };
  const planName = sub?.planKey || "Free";
  const planStatus = sub?.status === "active" ? "Active" : "Inactive";
  const activeConnectionsCount = sessions.filter(s => s.status === 'connected').length;
  const isConnected = activeConnectionsCount > 0;

  const cards = [
    {
      label: "WhatsApp",
      value: isConnected ? "Connected" : "Disconnected",
      badge: isConnected ? { text: "Online", variant: "success" } : { text: "Offline", variant: "danger" },
      iconBg: "bg-success-light",
      iconColor: "text-success",
      Icon: Plug,
      onClick: () => navigate("/dashboard/whatsapp"),
    },
    {
      label: "Connections Used",
      value: isAdmin ? "∞" : `${activeConnectionsCount} / ${connections.total}`,
      badge: null,
      iconBg: "bg-primary-light",
      iconColor: "text-primary",
      Icon: BarChart3,
    },
    {
      label: "Messages Used",
      value: isAdmin ? "∞" : `${messages.used} / ${messages.total}`,
      badge: null,
      iconBg: "bg-warning-light",
      iconColor: "text-warning",
      Icon: MessageCircle,
    },
    {
      label: "Current Plan",
      value: isAdmin ? "Admin" : planName,
      badge: isAdmin
        ? { text: "Full Access", variant: "primary" }
        : { text: planStatus, variant: planStatus === "Active" ? "success" : "default" },
      iconBg: "bg-info-light",
      iconColor: "text-primary",
      Icon: isAdmin ? Shield : Crown,
      onClick: !isAdmin ? () => navigate("/dashboard/billing#pricing") : undefined,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-surface rounded-xl border border-border p-5 cursor-default"
        >
          {/* Top row: icon circle + dots menu */}
          <div className="flex items-start justify-between mb-4">
            <div className={`h-12 w-12 rounded-full ${card.iconBg} flex items-center justify-center`}>
              <card.Icon className={`h-6 w-6 ${card.iconColor}`} />
            </div>
            <button className="p-1 rounded hover:bg-gray-100 transition-colors">
              <MoreHorizontal className="h-4 w-4 text-text-muted" />
            </button>
          </div>

          {/* Label + value */}
          <p className="text-sm font-medium text-text-secondary mb-1">{card.label}</p>
          <div className="flex items-end justify-between">
            <p className="text-2xl font-bold text-text-dark">{card.value}</p>
            {card.badge && (
              <Badge variant={card.badge.variant}>{card.badge.text}</Badge>
            )}
          </div>

          {card.onClick && (
            <button
              onClick={card.onClick}
              className="mt-2 text-xs font-medium text-primary hover:underline"
            >
              Manage →
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
