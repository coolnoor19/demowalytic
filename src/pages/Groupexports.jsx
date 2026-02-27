import React, { useState, useEffect } from "react";
import api from "../lib/api";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { toast } from "sonner";

export default function GroupExport() {
  const [sessions, setSessions] = useState([]);
  const [sessionId, setSessionId] = useState("");
  const [groups, setGroups] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingMembers, setFetchingMembers] = useState(false);

  useEffect(() => {
    const loadConnectedSession = async () => {
      try {
        const res = await api.get("/sessions");
        const list = res.data?.data || res.data || [];
        setSessions(list);

        const connected = list.find((s) => s.status === "connected");
        if (connected) {
          setSessionId(connected.sessionId);
        }
      } catch (err) {
        console.error("Failed to fetch sessions:", err);
      }
    };
    loadConnectedSession();
  }, []);

  const fetchGroups = async () => {
    if (!sessionId) {
      toast.error("Please select or enter a valid Session ID.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/groups/${sessionId}`);
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      if (!list.length) {
        toast.error("No groups found for this session.");
      }
      setGroups(list);
      setMembers([]);
    } catch (err) {
      console.error("Failed to load groups:", err);
      toast.error("Failed to load groups. Check if WhatsApp session is connected.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async (groupId) => {
    if (!sessionId) {
      toast.error("Please select a WhatsApp session first.");
      return;
    }
    setFetchingMembers(true);
    try {
      const res = await api.get(`/groups/${sessionId}/${groupId}/members`);
      setMembers(res.data.members || []);
    } catch (err) {
      console.error("Failed to fetch group members:", err);
      toast.error("Failed to fetch group members. Make sure your session is active.");
    } finally {
      setFetchingMembers(false);
    }
  };

  const exportToExcel = () => {
    if (!members.length) {
      toast.error("No members to export!");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(members);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Group Members");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([excelBuffer]), `group-members-${sessionId}.xlsx`);
  };

  const exportAllGroups = async () => {
    if (!sessionId) {
      toast.error("Please select or enter a Session ID first.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/groups/${sessionId}`);
      const allGroups = Array.isArray(res.data) ? res.data : res.data?.data || [];
      if (!allGroups.length) {
        toast.error("No groups found for this session.");
        setLoading(false);
        return;
      }

      let allMembers = [];
      for (const g of allGroups) {
        const membersRes = await api.get(`/groups/${sessionId}/${g.id}/members`);
        const groupMembers = membersRes.data.members || [];
        const tagged = groupMembers.map((m) => ({
          group: g.name,
          number: m.number,
          isAdmin: m.isAdmin,
        }));
        allMembers = allMembers.concat(tagged);
      }

      if (!allMembers.length) {
        toast.error("No members found in any group.");
        setLoading(false);
        return;
      }

      const ws = XLSX.utils.json_to_sheet(allMembers);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "All Group Members");
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      saveAs(new Blob([excelBuffer]), `all-group-members-${sessionId}.xlsx`);
      toast.success(`Exported ${allMembers.length} members across all groups.`);
    } catch (err) {
      console.error("Failed to export all groups:", err);
      toast.error("Failed to export all groups. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-surface rounded-xl border border-border p-6">
      <h4 className="text-xl font-semibold text-text-dark mb-3">WhatsApp Group Member Export</h4>

      {/* Session selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-text-secondary mb-1">
          WhatsApp Session
        </label>

        <select
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          className="w-full border border-border rounded-lg px-3 py-2 mb-2 bg-surface text-text-dark focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
        >
          <option value="">-- Select Connected Session --</option>
          {sessions.map((s) => (
            <option key={s.sessionId} value={s.sessionId}>
              {s.number || s.sessionId} ({s.status})
            </option>
          ))}
        </select>

        <Input
          type="text"
          placeholder="Or enter session ID manually"
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mb-4">
        <Button
          onClick={fetchGroups}
          disabled={loading}
          className="flex-1"
        >
          {loading ? "Fetching..." : "Fetch Groups"}
        </Button>
        <Button
          onClick={exportAllGroups}
          disabled={loading}
          variant="secondary"
          className="flex-1"
        >
          {loading ? "Exporting..." : "Export All Groups"}
        </Button>
      </div>

      {/* Groups list */}
      {groups.length > 0 && (
        <ul className="border border-border rounded-lg divide-y divide-border">
          {groups.map((g) => (
            <li
              key={g.id}
              className="flex justify-between items-center p-3 hover:bg-page-bg transition-colors"
            >
              <span className="text-text-dark">
                <strong>{g.name}</strong>{" "}
                <span className="text-text-muted">({g.size})</span>
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchMembers(g.id)}
                disabled={fetchingMembers}
              >
                {fetchingMembers ? "Loading..." : "View Members"}
              </Button>
            </li>
          ))}
        </ul>
      )}

      {/* Members list */}
      {members.length > 0 && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <h6 className="text-lg font-medium text-text-dark">Group Members</h6>
            <Button
              size="sm"
              onClick={exportToExcel}
            >
              Export This Group
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border border-border text-sm">
              <thead className="bg-page-bg text-text-secondary">
                <tr>
                  <th className="p-2 border border-border">Number</th>
                  <th className="p-2 border border-border">Is Admin</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m, i) => (
                  <tr key={i} className="border-t border-border hover:bg-page-bg">
                    <td className="p-2 text-text-dark">{m.number}</td>
                    <td className="p-2 text-center">
                      {m.isAdmin ? "Yes" : "No"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && groups.length === 0 && (
        <p className="text-sm text-text-muted mt-3">
          Select or enter your connected session and click{" "}
          <b>"Fetch Groups"</b> to begin.
        </p>
      )}
    </div>
  );
}
