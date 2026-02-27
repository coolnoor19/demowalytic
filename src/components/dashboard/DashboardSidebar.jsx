import {
  LayoutDashboard,
  MessageSquare,
  Smartphone,
  CreditCard,
  Key,
  Settings,
  LogOut,
  Wrench,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  Image,
  Users,
  CheckCircle,
  Trello,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useSidebar } from "../ui/sidebar";
import { useState, useRef, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";

export function DashboardSidebar() {
  const { logout } = useAuth();
  const { isCollapsed, isMobile, isMobileOpen, closeSidebar } = useSidebar();
  const [toolsOpen, setToolsOpen] = useState(false);
  const location = useLocation();

  const toggleRef = useRef(null);
  const panelRef = useRef(null);

  const isToolsPath = (pathname) =>
    pathname.includes("send-excel") ||
    pathname.includes("image-to-uri") ||
    pathname.includes("number-verification") ||
    pathname.includes("group-export");

  // Sync tools state with location
  useEffect(() => {
    setToolsOpen(isToolsPath(location.pathname));
  }, [location.pathname]);

  // Click outside listener
  useEffect(() => {
    function handlePointerDown(e) {
      if (
        toggleRef.current?.contains(e.target) ||
        panelRef.current?.contains(e.target)
      ) {
        return;
      }
      if (!isToolsPath(location.pathname)) {
        setToolsOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [location.pathname]);

  const base = "/dashboard";

  const mainMenu = [
    { to: `${base}/overview`, title: "Overview", icon: LayoutDashboard },
    { to: `${base}/whatsapp`, title: "WhatsApp", icon: Smartphone },
    { to: `${base}/messages`, title: "Messages", icon: MessageSquare },
    { to: `${base}/kanban`, title: "Kanban", icon: Trello },
    { to: `${base}/api`, title: "Integration", icon: Key },
    { to: `${base}/flow-builder`, title: "Flow Builder", icon: Wrench },
    { to: `${base}/billing`, title: "Billing", icon: CreditCard },
  ];

  const navItemClass = ({ isActive }) =>
    `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-out outline-none ${
      isActive
        ? "bg-primary text-white shadow-sm"
        : "text-text-secondary hover:bg-gray-50 hover:text-text-dark"
    }`;

  const subNavItemClass = ({ isActive }) =>
    `flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-all duration-200 ease-out ${
      isActive
        ? "bg-primary-light text-primary font-medium"
        : "text-text-secondary hover:bg-gray-50 hover:text-text-dark"
    }`;

  return (
    <>
      {/* Sidebar Container */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-surface flex flex-col z-50 border-r border-border
        ${
          isMobile
            ? `transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] w-64 ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}`
            : `transition-[width,transform] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isCollapsed ? "w-16" : "w-64"}`
        }`}
      >
        {/* Header / Logo Area */}
        <div className={`flex h-16 items-center border-b border-border ${isCollapsed ? 'justify-center' : 'px-5'}`}>
          <div className="flex items-center">
            <img
              src="/bluecanva.png"
              alt="Logo"
              className={`h-10 w-10 object-contain ${!isCollapsed ? '-mr-1.5' : ''}`}
            />
            {!isCollapsed && !isMobile && (
              <span
                style={{ fontFamily: "'Montserrat', sans-serif" }}
                className="text-[24px] font-bold tracking-[-0.05em] text-[#0066da] leading-none"
              >
                Walytic
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1 custom-scrollbar">
          {mainMenu.map(({ to, title, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={closeSidebar}
              className={navItemClass}
            >
              <Icon
                className={`h-5 w-5 flex-shrink-0 transition-colors ${
                  isCollapsed ? "mx-auto" : ""
                }`}
              />
              {!isCollapsed && <span className="truncate">{title}</span>}
            </NavLink>
          ))}

          {/* Tools Dropdown Section */}
          <div className="pt-2">
            {!isCollapsed && (
              <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Utilities
              </p>
            )}

            <div className="relative">
              <button
                ref={toggleRef}
                onClick={() => setToolsOpen((s) => !s)}
                className={`w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-out ${
                  toolsOpen
                    ? "bg-gray-50 text-text-dark"
                    : "text-text-secondary hover:bg-gray-50 hover:text-text-dark"
                }`}
              >
                <div className={`flex items-center gap-3 ${isCollapsed ? "w-full justify-center" : ""}`}>
                  <Wrench className="h-5 w-5 text-text-muted" />
                  {!isCollapsed && <span>Tools</span>}
                </div>
                {!isCollapsed &&
                  (toolsOpen ? (
                    <ChevronDown className="h-4 w-4 text-text-muted" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-text-muted" />
                  ))}
              </button>

              {/* Tools Submenu with animation */}
              <div
                ref={panelRef}
                className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                style={{ gridTemplateRows: toolsOpen && !isCollapsed ? "1fr" : "0fr" }}
              >
                <div className="overflow-hidden">
                  <div className="mt-1 ml-4 space-y-0.5 border-l-2 border-border pl-3">
                    <NavLink
                      to={`${base}/send-excel`}
                      onClick={closeSidebar}
                      className={subNavItemClass}
                    >
                      Send via Excel
                    </NavLink>
                    <NavLink
                      to={`${base}/image-to-uri`}
                      onClick={closeSidebar}
                      className={subNavItemClass}
                    >
                      Image to URL
                    </NavLink>
                    <NavLink
                      to={`${base}/group-export`}
                      onClick={closeSidebar}
                      className={subNavItemClass}
                    >
                      Group Export
                    </NavLink>
                    <NavLink
                      to={`${base}/number-verification`}
                      onClick={closeSidebar}
                      className={subNavItemClass}
                    >
                      Number Check
                    </NavLink>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Footer Section */}
        <div className="border-t border-border p-4 space-y-1">
          <NavLink
            to="/dashboard/overview?tab=settings"
            onClick={closeSidebar}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ease-out ${
                isActive
                  ? "bg-primary-light text-primary"
                  : "text-text-secondary hover:bg-gray-50 hover:text-text-dark"
              }`
            }
          >
            <Settings className={`h-4 w-4 ${isCollapsed ? "mx-auto" : ""}`} />
            {!isCollapsed && "Settings"}
          </NavLink>

          <button
            onClick={() => {
              logout();
              closeSidebar();
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-danger hover:bg-danger-light transition-all duration-200 ease-out"
          >
            <LogOut className={`h-4 w-4 ${isCollapsed ? "mx-auto" : ""}`} />
            {!isCollapsed && "Sign Out"}
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobile && (
        <div
          onClick={closeSidebar}
          className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
            isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        />
      )}
    </>
  );
}
