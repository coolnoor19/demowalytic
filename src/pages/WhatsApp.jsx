import React from "react";
import WhatsAppConnection from "../components/dashboard/WhatsAppConnection";

export default function WhatsAppPage() {
  return (
    <div className="rounded-xl bg-surface border border-border p-6">
      <h2 className="text-lg font-semibold mb-4">WhatsApp Connection</h2>
      <WhatsAppConnection />
    </div>
  );
}
