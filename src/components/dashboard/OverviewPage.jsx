import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import QuickActions from "./QuickActions";
import TopOverviewCards from "./TopOverviewCards";
import { RecentMessages } from "./RecentMessages";
import MessageStats from "./MessageStats";
import { PlanDisplay } from "./PlanDisplay";
import UsageCounter from "./UsageCounter";
import { ApiCredentials } from "./ApiCredentials";
import SubscriptionManagement from "../subscription/SubscriptionManagement";

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../ui/tabs";

export default function OverviewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab) setActiveTab(tab);
  }, [location]);

  const handleTabChange = (value) => {
    setActiveTab(value);
    navigate(`/dashboard/overview?tab=${value}`);
  };

  const handleViewPlansClick = () => {
    navigate("/dashboard/billing#pricing");
  };

  const goToWhatsAppPage = () => navigate("/dashboard/whatsapp");

  return (
    <div className="space-y-8">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-6"
      >
        <TabsList className="rounded-lg bg-gray-100 p-1">
          {["overview", "subscription", "settings"].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="flex-1 py-2 rounded-md text-sm font-medium text-text-secondary
                         data-[state=active]:bg-primary data-[state=active]:text-white
                         data-[state=active]:shadow-sm transition"
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ================= OVERVIEW ================= */}
        <TabsContent value="overview" className="space-y-8">
          <TopOverviewCards />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface rounded-xl border border-border p-6">
              <h3 className="text-sm font-semibold text-text-dark mb-4">
                Quick Actions
              </h3>
              <QuickActions />
            </div>

            <div className="bg-surface rounded-xl border border-border p-6">
              <MessageStats />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface rounded-xl border border-border p-6">
              <h3 className="text-sm font-semibold text-text-dark mb-4">
                Recent Messages
              </h3>
              <RecentMessages />
            </div>

            <div className="bg-surface rounded-xl border border-border p-6">
              <h3 className="text-sm font-semibold text-text-dark mb-6">
                System Status
              </h3>

              <div className="space-y-4">
                {[
                  { label: "WhatsApp Connection", status: "Connected" },
                  { label: "Message Delivery", status: "Operational" },
                  { label: "Background Workers", status: "Running" },
                  { label: "API Services", status: "Healthy" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="h-2.5 w-2.5 rounded-full bg-success" />
                      <p className="text-sm text-text-secondary">{item.label}</p>
                    </div>
                    <span className="text-sm font-medium text-success">
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-border">
                <p className="text-xs text-text-muted">Last checked: just now</p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ================= SUBSCRIPTION ================= */}
        <TabsContent value="subscription">
          <div className="bg-surface rounded-xl border border-border p-6">
            <SubscriptionManagement />
          </div>
        </TabsContent>

        {/* ================= SETTINGS ================= */}
        <TabsContent value="settings">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ApiCredentials />

            <div className="bg-surface rounded-xl border border-border p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-text-dark">
                  WhatsApp Connection
                </h3>
                <p className="text-sm text-text-secondary mt-2">
                  Manage WhatsApp connections and QR codes from the WhatsApp page.
                </p>
              </div>
              <button
                onClick={goToWhatsAppPage}
                className="mt-4 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-md text-sm transition-colors"
              >
                Open WhatsApp Page
              </button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
