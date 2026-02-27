import { Badge } from "../ui/badge";
import { CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";

export default function WhatsAppStatusIndicator({ status, phoneNumber, lastError }) {
  if (status === "connected") {
    return (
      <div className="flex items-center gap-2">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <span className="text-sm text-gray-700">
          Connected {phoneNumber && `(${phoneNumber})`}
        </span>
        <Badge variant="outline" className="border-green-600 text-green-600">
          Active
        </Badge>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-yellow-600 animate-pulse" />
        <span className="text-sm text-gray-700">Scan QR to connect</span>
        <Badge variant="outline" className="border-yellow-600 text-yellow-600">
          Pending
        </Badge>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-red-600" />
        <span className="text-sm text-gray-700">Error: {lastError || "Connection failed"}</span>
        <Badge variant="outline" className="border-red-600 text-red-600">
          Error
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <XCircle className="h-5 w-5 text-gray-500" />
      <span className="text-sm text-gray-700">Not connected</span>
      <Badge variant="outline" className="border-gray-500 text-gray-500">
        Disconnected
      </Badge>
    </div>
  );
}
