import { Loader2 } from "lucide-react";

export default function LoadingSpinner({ text = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-gray-500">
      <Loader2 className="w-6 h-6 animate-spin mb-2" />
      <span className="text-sm">{text}</span>
    </div>
  );
}
