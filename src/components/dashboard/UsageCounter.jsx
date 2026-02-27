import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";

import { useSubscription } from "../../contexts/SubscriptionContext";

export default function UsageCounter() {
  const { subscription, loading } = useSubscription();

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-text-dark">
            Usage Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse flex space-x-2">
              <div className="w-3 h-3 bg-primary rounded-full" />
              <div className="w-3 h-3 bg-primary rounded-full" />
              <div className="w-3 h-3 bg-primary rounded-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const usageByKey = subscription?.usageByKey || {};

  const connections = usageByKey.whatsappConnection || { used: 0, total: 0 };
  const messages = usageByKey.message || { used: 0, total: 0 };

  const getPercent = (used, total) => {
    if (!total || total === -1) return 0;
    return Math.min((used / total) * 100, 100);
  };

  const connectionPercent = getPercent(connections.used, connections.total);
  const messagePercent = getPercent(messages.used, messages.total);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-text-dark">
          Usage Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-2">
        {/* Connections */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-sm font-semibold text-text-secondary">Connections</span>
            </div>
            <div className="px-3 py-1 rounded-full bg-primary-light">
              <span className="text-sm font-bold text-primary">
                {connections.used}
              </span>
              <span className="text-xs text-primary mx-1">/</span>
              <span className="text-sm font-medium text-primary">
                {connections.total === -1 ? "∞" : connections.total}
              </span>
            </div>
          </div>
          <div className="relative">
            <Progress
              value={connectionPercent}
              className="h-3 bg-primary-light"
            />
            {connectionPercent > 75 && (
              <div className="absolute -top-6 right-0 text-xs font-medium text-warning bg-warning-light px-2 py-0.5 rounded-full">
                {connectionPercent.toFixed(0)}% used
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span className="text-sm font-semibold text-text-secondary">Messages</span>
            </div>
            <div className="px-3 py-1 rounded-full bg-success-light">
              <span className="text-sm font-bold text-success">
                {messages.used}
              </span>
              <span className="text-xs text-success mx-1">/</span>
              <span className="text-sm font-medium text-success">
                {messages.total === -1 ? "∞" : messages.total}
              </span>
            </div>
          </div>
          <div className="relative">
            <Progress
              value={messagePercent}
              className="h-3 bg-success-light"
            />
            {messagePercent > 75 && (
              <div className="absolute -top-6 right-0 text-xs font-medium text-warning bg-warning-light px-2 py-0.5 rounded-full">
                {messagePercent.toFixed(0)}% used
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
