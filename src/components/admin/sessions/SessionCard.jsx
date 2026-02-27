import { Card, CardHeader, CardTitle, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";
import { Trash2, RefreshCcw, Smartphone } from "lucide-react";

export default function SessionCard({ session, onDisconnect, onDelete }) {
  const statusColor =
    session.status === "connected"
      ? "text-green-600"
      : session.status === "disconnected"
      ? "text-red-500"
      : "text-yellow-500";

  return (
    <Card className="rounded-xl border shadow-sm hover:shadow-md transition">
      <CardHeader className="flex items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-800">
          <Smartphone className="h-4 w-4 text-gray-500" />
          {session.number || "Unknown"}
        </CardTitle>
        <span className={`text-xs font-semibold ${statusColor}`}>
          {session.status}
        </span>
      </CardHeader>

      <CardContent className="space-y-2 text-sm text-gray-600">
        <p><strong>Session ID:</strong> {session.sessionId}</p>
        <p><strong>User ID:</strong> {session.userId}</p>
        <p><strong>Last Message:</strong> {session.lastMessageTime
          ? new Date(session.lastMessageTime).toLocaleString()
          : "—"}</p>

        <div className="flex justify-end gap-2 pt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDisconnect(session.sessionId)}
          >
            <RefreshCcw className="h-4 w-4 mr-1" />
            Disconnect
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(session.sessionId)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
