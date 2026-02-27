import React, { useEffect, useState } from "react";
import api from "../../../lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { showSuccess, showError } from "../../shared/Toast";
import LoadingSpinner from "../../shared/LoadingSpinner";
import { Trash2, Edit } from "lucide-react";

export default function FeatureManager({ onFeatureUpdate }) {
  const [features, setFeatures] = useState([]);
  const [key, setKey] = useState("");
  const [label, setLabel] = useState("");
  const [type, setType] = useState("value"); // "value" or "bool"
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeatures();
  }, []);

  const normalizeFeaturesResp = (res) => {
    // handle different backend shapes gracefully
    return (
      res?.data?.data ||
      res?.data?.features ||
      res?.features ||
      res?.data ||
      []
    );
  };

  const fetchFeatures = async () => {
    try {
      setLoading(true);
      // call admin route (this will be /api/admin/features if your api base is /api)
      const res = await api.get("/admin/features");
      const list = normalizeFeaturesResp(res);
      setFeatures(list);
    } catch (err) {
      console.error(err);
      showError("Failed to load features");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!label || !key) return showError("Label and Key are required");

    try {
      if (editing) {
        const res = await api.put(`/admin/features/${editing}`, { key, label, type });
        showSuccess("Feature updated");
      } else {
        await api.post("/admin/features", { key, label, type });
        showSuccess("Feature added");
      }

      setKey("");
      setLabel("");
      setType("value");
      setEditing(null);
      await fetchFeatures();
      onFeatureUpdate?.();
    } catch (err) {
      console.error(err);
      showError("Failed to save feature");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this feature?")) return;
    try {
      await api.delete(`/admin/features/${id}`);
      showSuccess("Feature deleted");
      await fetchFeatures();
      onFeatureUpdate?.();
    } catch (err) {
      console.error(err);
      showError("Failed to delete feature");
    }
  };

  if (loading) return <LoadingSpinner text="Loading features..." />;

  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader>
        <CardTitle>Feature Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <Input
            placeholder="Feature Key (unique)"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
          <Input
            placeholder="Label (display name)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="border rounded p-2"
          >
            <option value="value">Value</option>
            <option value="bool">Yes / No</option>
          </select>
          <Button onClick={handleSave}>{editing ? "Update" : "Create"}</Button>
        </div>

        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b text-gray-700">
              <th className="p-2">Key</th>
              <th className="p-2">Label</th>
              <th className="p-2">Type</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {features.map((f) => (
              <tr key={f._id || f.id || f.key} className="border-b hover:bg-gray-50">
                <td className="p-2 break-words">{f.key}</td>
                <td className="p-2 break-words">{f.label}</td>
                <td className="p-2">{f.type}</td>
                <td className="p-2 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setKey(f.key);
                      setLabel(f.label);
                      setType(f.type || "value");
                      setEditing(f._id || f.id);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(f._id || f.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
