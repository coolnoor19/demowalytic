// src/components/ui/sidebar.jsx
import React, { createContext, useContext, useState, useCallback } from "react";
import { useIsMobile } from "../../hooks/use-mobile";

const SidebarContext = createContext();

export function SidebarProvider({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const isMobile = useIsMobile();

  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setIsMobileOpen((prev) => !prev);
    } else {
      setIsCollapsed((prev) => !prev);
    }
  }, [isMobile]);

  const closeSidebar = useCallback(() => {
    if (isMobile) setIsMobileOpen(false);
  }, [isMobile]);

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        toggleSidebar,
        isMobile,
        isMobileOpen,
        closeSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) throw new Error("useSidebar must be used within SidebarProvider");
  return context;
}

export function Sidebar({ children, className = "" }) {
  const { isCollapsed, isMobile, isMobileOpen, closeSidebar } = useSidebar();

  const baseClasses =
    "bg-surface h-screen fixed top-0 z-50 transition-[width,transform] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col justify-between border-r border-border " +
    className;

  if (isMobile) {
    return (
      <>
        <aside
          className={`${baseClasses} w-64 ${
            isMobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div
            onClick={closeSidebar}
            className="flex flex-col flex-1 overflow-y-auto"
          >
            {children}
          </div>
        </aside>

        {isMobileOpen && (
          <div
            onClick={closeSidebar}
            className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-300"
          />
        )}
      </>
    );
  }

  return (
    <aside
      className={`${baseClasses} ${
        isCollapsed ? "w-16" : "w-64"
      } left-0`}
    >
      {children}
    </aside>
  );
}
