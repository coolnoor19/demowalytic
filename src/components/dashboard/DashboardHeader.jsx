import { Menu, X, Search, Bell } from "lucide-react";
import { UserNav } from "../navigation/UserNav";
import { useSidebar } from "../ui/sidebar";
import { useLocation } from "react-router-dom";

const pageTitles = {
  overview: "Overview",
  whatsapp: "WhatsApp",
  messages: "Messages",
  kanban: "Kanban Board",
  api: "Integration",
  "flow-builder": "Flow Builder",
  billing: "Billing",
  "send-excel": "Send via Excel",
  "image-to-uri": "Image to URL",
  "group-export": "Group Export",
  "number-verification": "Number Check",
  profile: "Profile",
};

export function DashboardHeader() {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const location = useLocation();

  const segment = location.pathname.split("/").filter(Boolean).pop() || "overview";
  const pageTitle = pageTitles[segment] || "Dashboard";

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between bg-surface px-6 lg:px-8 border-b border-border">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md hover:bg-gray-100 transition-colors"
        >
          {isCollapsed ? (
            <Menu className="h-5 w-5 text-text-secondary" />
          ) : (
            <X className="h-5 w-5 text-text-secondary" />
          )}
        </button>

        <div>
          <h1 className="text-lg font-semibold leading-tight text-text-dark">{pageTitle}</h1>
          <p className="text-sm text-text-secondary">
            Manage your WhatsApp Business API
          </p>
        </div>
      </div>

      {/* Center — Search bar (hidden on small screens) */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full rounded-lg bg-page-bg border border-border pl-10 pr-4 py-2 text-sm text-text-dark placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-md hover:bg-gray-100 transition-colors">
          <Bell className="h-5 w-5 text-text-secondary" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-danger ring-2 ring-surface" />
        </button>
        <UserNav />
      </div>
    </header>
  );
}
