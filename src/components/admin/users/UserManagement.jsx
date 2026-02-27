import React, { useEffect, useState } from "react";
import api from "../../../lib/api";
import UserTable from "./UserTable";
import { Card, CardHeader, CardTitle } from "../../ui/card";
import LoadingSpinner from "../../shared/LoadingSpinner";
import { showSuccess, showError } from "../../shared/Toast";
import { Button } from "../../ui/button";
import { RefreshCcw } from "lucide-react";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/users");
      setUsers(res.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      showError("Failed to load user list");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (id, role) => {
    try {
      await api.put(`/admin/users/${id}`, { role });
      setUsers((prev) =>
        prev.map((u) => (u._id === id ? { ...u, role } : u))
      );
      showSuccess("User role updated");
    } catch (err) {
      console.error("Failed to update role:", err);
      showError("Failed to update user role");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
      showSuccess("User deleted successfully");
    } catch (err) {
      console.error("Failed to delete user:", err);
      showError("Failed to delete user");
    }
  };

  if (loading) return <LoadingSpinner text="Loading users..." />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>User Management</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            className="flex items-center gap-1"
          >
            <RefreshCcw className="h-4 w-4" /> Refresh
          </Button>
        </CardHeader>
      </Card>

      <UserTable
        users={users}
        onRoleChange={handleRoleChange}
        onDelete={handleDelete}
      />
    </div>
  );
}
