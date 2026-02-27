import { ArrowLeft } from "lucide-react";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";

export default function AdminHeader({ title, subtitle, icon }) {
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        {/* Left: Page title + icon */}
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>
        </div>

        {/* Right: Back to Dashboard button */}
        <Button
          onClick={() => navigate("/dashboard/overview")}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    </header>
  );
}
