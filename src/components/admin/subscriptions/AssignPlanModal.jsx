import React from "react";
import { Button } from "../../ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../../ui/card";
import { showSuccess, showError } from "../../shared/Toast";
import api from "../../../lib/api";

export default function AssignPlanModal({ users, plans, open, onClose, onAssigned }) {
  const [selectedUser, setSelectedUser] = React.useState("");
  const [selectedPlan, setSelectedPlan] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleAssign = async () => {
    if (!selectedUser || !selectedPlan) return showError("Select both user and plan");
    setLoading(true);
    try {
  await api.post(`/admin/users/${selectedUser}/assign-plan`, {
  planKey: selectedPlan,
});



      showSuccess("Plan assigned successfully");
      onAssigned();
      onClose();
    } catch (err) {
      console.error("Assign plan error:", err);
      showError("Failed to assign plan");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <Card className="w-full max-w-md bg-white rounded-xl shadow-lg">
        <CardHeader>
          <CardTitle>Assign Plan to User</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <select
            className="w-full border rounded p-2"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
          >
            <option value="">Select User</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.email}
              </option>
            ))}
          </select>

          <select
            className="w-full border rounded p-2"
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
          >
            <option value="">Select Plan</option>
            {plans.map((p) => (
              <option key={p.key} value={p.key}>
                {p.name} ({p.defaultInterval})
              </option>
            ))}
          </select>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={loading}>
              {loading ? "Assigning..." : "Assign Plan"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
