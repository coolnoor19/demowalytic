import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, useSidebar } from "../components/ui/sidebar";
import { DashboardSidebar } from "../components/dashboard/DashboardSidebar";
import { DashboardHeader } from "../components/dashboard/DashboardHeader";

// Pages
import OverviewPage from "../components/dashboard/OverviewPage";
import Message from "../pages/Message";
import Billing from "../pages/Billing";
import WhatsAppPage from "../pages/WhatsApp";
import ApiKeyPage from "../pages/ApiKey";
import NumberVerification from "../pages/NumberVerification";
import ImageToUrl from "../pages/ImageToUrl";
import SendViaExcel from "../pages/SendviaExcel";
import Groupexports from "../pages/Groupexports";
import Profile from "../pages/Profile";
import FlowBuilderPage from "../pages/FlowBuilderPage";
import Kanban from "../pages/Kanban";


function DashboardLayout({ children }) {
  const { isCollapsed, isMobile, isMobileOpen, closeSidebar } = useSidebar();

  const contentMargin = isMobile
    ? "ml-0"
    : isCollapsed
      ? "ml-16"
      : "ml-64";

  return (
    <div className="relative flex min-h-screen w-full bg-page-bg overflow-hidden">
      <DashboardSidebar />

      <div
        className={`flex flex-1 flex-col transition-[margin] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${contentMargin}`}
      >
        <DashboardHeader />
        <main className="flex-1 p-4 sm:p-6 md:p-8 bg-page-bg overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}


export default function Dashboard() {
  return (
    <SidebarProvider>
      <DashboardLayout>
        <Routes>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<OverviewPage />} />
          <Route path="messages" element={<Message />} />
          <Route path="billing" element={<Billing />} />
          <Route path="whatsapp" element={<WhatsAppPage />} />
          <Route path="api" element={<ApiKeyPage />} />
          <Route path="number-verification" element={<NumberVerification />} />
          <Route path="image-to-uri" element={<ImageToUrl />} />
          <Route path="send-excel" element={<SendViaExcel />} />
          <Route path="group-export" element={<Groupexports />} />
          <Route path="profile" element={<Profile />} />
          <Route path="flow-builder" element={<FlowBuilderPage />} />
          <Route path="kanban" element={<Kanban />} />
          <Route path="*" element={<Navigate to="overview" replace />} />
        </Routes>
      </DashboardLayout>
    </SidebarProvider>
  );
}
