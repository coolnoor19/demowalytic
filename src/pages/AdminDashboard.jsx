import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Shield } from "lucide-react";

import AdminHeader from "../components/shared/AdminHeader";
import AdminAnalytics from "../components/admin/analytics/AdminAnalytics";
import AdminUserSubscriptionManager from "../components/admin/subscriptions/AdminUserSubscriptionManager";
import UserManagement from "../components/admin/users/UserManagement";
import PlanManagement from "../components/admin/plans/PlanManagement";
import MessageUsageManagement from "../components/admin/usage/MessageUsageManagement";
import WhatsAppSessions from "../components/admin/sessions/WhatsAppSessions";
import AdminSettings from "../components/admin/settings/AdminSettings";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header */}
      <AdminHeader
        title="Admin Dashboard"
        subtitle="System administration and management"
        icon={<Shield className="h-8 w-8 text-indigo-600" />}
      />

      {/* Main Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="analytics" className="space-y-6">
          {/* Tabs list (responsive / scrollable) */}
          <div className="w-full overflow-x-auto">
            <TabsList className="flex min-w-max lg:min-w-0 w-full justify-start lg:justify-between bg-gray-100 rounded-lg gap-2 p-1">
              {[
                "analytics",
                "subscriptions",
                "users",
                "plans",
                "usage",
                "sessions",
                "settings",
              ].map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="flex-shrink-0 flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-600 rounded-md 
                    data-[state=active]:bg-white data-[state=active]:text-gray-900
                    data-[state=active]:shadow-sm hover:bg-gray-200 transition-all"
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Tab contents — make them scrollable. Plans tab has a unique class we can target. */}
          <TabsContent
            value="analytics"
            className="space-y-6 tab-section overflow-y-auto max-h-[80vh] pr-2"
          >
            <AdminAnalytics />
          </TabsContent>

          <TabsContent
            value="subscriptions"
            className="space-y-6 tab-section overflow-y-auto max-h-[80vh] pr-2"
          >
            <AdminUserSubscriptionManager />
          </TabsContent>

          <TabsContent
            value="users"
            className="space-y-6 tab-section overflow-y-auto max-h-[80vh] pr-2"
          >
            <UserManagement />
          </TabsContent>

          {/* Plans tab: scroll container class = main-scroll-container */}
          <TabsContent
            value="plans"
            className="space-y-6 tab-section overflow-y-auto max-h-[80vh] pr-2 main-scroll-container"
          >
            <PlanManagement />
          </TabsContent>

          <TabsContent
            value="usage"
            className="space-y-6 tab-section overflow-y-auto max-h-[80vh] pr-2"
          >
            <MessageUsageManagement />
          </TabsContent>

          <TabsContent
            value="sessions"
            className="space-y-6 tab-section overflow-y-auto max-h-[80vh] pr-2"
          >
            <WhatsAppSessions />
          </TabsContent>

          <TabsContent
            value="settings"
            className="space-y-6 tab-section overflow-y-auto max-h-[80vh] pr-2"
          >
            <AdminSettings />
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <footer className="text-center text-sm text-gray-500 py-6">
        © {new Date().getFullYear()} Walytic Systems. All rights reserved.
      </footer>
    </div>
  );
}
