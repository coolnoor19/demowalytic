import { Smartphone, Layout, Zap, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";

export default function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      title: "WhatsApp",
      desc: "Manage connections and QR codes",
      icon: Smartphone,
      path: "/dashboard/whatsapp",
      btn: "Connect WhatsApp",
      iconBg: "bg-success-light",
      iconColor: "text-success",
    },
    {
      title: "Kanban",
      desc: "Track leads and tasks visually",
      icon: Layout,
      path: "/dashboard/kanban",
      btn: "Open Kanban",
      iconBg: "bg-primary-light",
      iconColor: "text-primary",
    },
    {
      title: "Flow Builder",
      desc: "Create automated workflows",
      icon: Zap,
      path: "/dashboard/flow-builder",
      btn: "Build Flow",
      iconBg: "bg-warning-light",
      iconColor: "text-warning",
    },
    {
      title: "Messages",
      desc: "View and manage sent messages",
      icon: MessageSquare,
      path: "/dashboard/messages",
      btn: "Open Messages",
      iconBg: "bg-danger-light",
      iconColor: "text-danger",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {actions.map((a) => {
        const Icon = a.icon;

        return (
          <div
            key={a.title}
            className="bg-surface rounded-xl border border-border p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-md"
          >
            <div className="space-y-4">
              <div className={`h-11 w-11 rounded-full ${a.iconBg} flex items-center justify-center`}>
                <Icon className={`h-5 w-5 ${a.iconColor}`} />
              </div>

              <div>
                <p className="text-sm font-semibold text-text-dark">
                  {a.title}
                </p>
                <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                  {a.desc}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(a.path)}
              className="mt-6 w-full"
            >
              {a.btn}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
