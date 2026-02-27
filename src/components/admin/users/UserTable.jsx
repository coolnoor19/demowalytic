import React from "react";
import { Button } from "../../ui/button";
import { Card, CardContent } from "../../ui/card";
import { Trash2, ShieldCheck } from "lucide-react";

export default function UserTable({ users, onRoleChange, onDelete }) {
  return (
    <Card className="rounded-xl border shadow-sm">
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-b hover:bg-gray-50 transition">
                <td className="p-3">{u.name || "—"}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">
                  <select
                    value={u.role || "user"}
                    onChange={(e) => onRoleChange(u._id, e.target.value)}
                    className="border rounded p-1 text-sm bg-white"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="p-3 flex justify-center gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDelete(u._id)}
                    className="flex items-center gap-1"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                  {u.role === "admin" && (
                    <ShieldCheck className="h-4 w-4 text-green-600" title="Admin" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
