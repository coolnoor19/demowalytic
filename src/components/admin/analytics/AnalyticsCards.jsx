import { Card, CardHeader, CardTitle, CardContent } from "../../ui/card";
import { Users, Layers, Zap, Activity } from "lucide-react";

const icons = {
  users: <Users className="h-6 w-6 text-blue-600" />,
  plans: <Layers className="h-6 w-6 text-green-600" />,
  subscriptions: <Zap className="h-6 w-6 text-purple-600" />,
  sessions: <Activity className="h-6 w-6 text-orange-600" />,
};

export default function AnalyticsCards({ stats }) {
  const data = [
    {
      label: "Total Users",
      value: stats.users || 0,
      icon: icons.users,
    },
    {
      label: "Active Subscriptions",
      value: stats.subscriptions || 0,
      icon: icons.subscriptions,
    },
    {
      label: "Available Plans",
      value: stats.plans || 0,
      icon: icons.plans,
    },
    {
      label: "Active Sessions",
      value: stats.sessions || 0,
      icon: icons.sessions,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {data.map((item, i) => (
        <Card key={i} className="rounded-xl border shadow-sm hover:shadow-md transition">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-600">
              {item.label}
            </CardTitle>
            {item.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-gray-900">
              {item.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
