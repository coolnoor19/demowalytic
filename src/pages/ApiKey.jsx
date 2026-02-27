import React from "react";
import { ApiCredentials } from "../components/dashboard/ApiCredentials";
import { Button } from "../components/ui/button";

export default function ApiKeyPage() {
  return (
    <div className="rounded-xl bg-surface border border-border p-6">
      <h2 className="text-lg font-semibold text-text-dark mb-4">Integration</h2>
      {/* <div>
         <Button
      variant="secondary"
      size="sm"
      onClick={() => window.open("https://docs.walytic.com/", "_blank")}
    >
      View Docs
    </Button>
      </div> */}
      <ApiCredentials />
    </div>
    
  );
}
