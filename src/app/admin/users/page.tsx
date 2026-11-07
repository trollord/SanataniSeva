"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils/formatters";
import { Loader2 } from "lucide-react";

interface UserRow {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: string;
  disabled: boolean;
}

const ROLE_OPTIONS = ["USER", "OWNER", "ADMIN"];

type FilterTab = "all" | "owners" | "disabled";

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [tab, setTab] = useState<FilterTab>("all");

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .catch(() => toast.error("Failed to load users"))
      .finally(() => setLoading(false));
  }, []);

  async function updateRole(userId: string, role: string) {
    if (role === "ADMIN") {
      const user = users.find((u) => u.id === userId);
      const ok = window.confirm(
        `Make ${user?.name ?? user?.email ?? "this user"} an Admin? They will get full access to the admin panel.`
      );
      if (!ok) return;
    }
    setUpdating(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) { toast.error("Failed to update role"); return; }
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u));
      toast.success("Role updated");
    } catch {
      toast.error("Failed to update role");
    } finally {
      setUpdating(null);
    }
  }

  async function toggleDisabled(userId: string, disabled: boolean) {
    setUpdating(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/disable`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disabled }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Failed to update user");
        return;
      }
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, disabled } : u));
      toast.success(disabled ? "User disabled" : "User enabled");
    } catch {
      toast.error("Failed to update user");
    } finally {
      setUpdating(null);
    }
  }

  const filteredUsers = users.filter((u) => {
    if (tab === "owners") return u.role === "OWNER";
    if (tab === "disabled") return u.disabled;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Users ({users.length})</h1>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {(["all", "owners", "disabled"] as FilterTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium capitalize transition-colors ${
              tab === t
                ? "bg-[#FF5F15] text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-[#FF5F15] hover:text-[#FF5F15]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {filteredUsers.map((u) => (
          <div key={u.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{u.name ?? "-"}</p>
                <p className="text-xs text-gray-500 truncate">{u.email}</p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  u.role === "ADMIN" ? "bg-red-100 text-red-800" :
                  u.role === "OWNER" ? "bg-blue-100 text-blue-800" :
                  "bg-gray-100 text-gray-600"
                }`}>
                  {u.role}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  u.disabled ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                }`}>
                  {u.disabled ? "Disabled" : "Active"}
                </span>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mb-3">Joined {formatDate(new Date(u.createdAt))}</p>
            <div className="flex items-center gap-2">
              {u.id === session?.user?.id ? (
                <span className="text-xs text-gray-400 italic">You</span>
              ) : (
                <>
                  <select
                    value={u.role}
                    onChange={(e) => updateRole(u.id, e.target.value)}
                    disabled={updating === u.id}
                    className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  {u.id !== session?.user?.id && (
                    u.disabled ? (
                      <button
                        onClick={() => toggleDisabled(u.id, false)}
                        disabled={updating === u.id}
                        className="text-xs px-3 py-1 rounded font-medium bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 transition-colors"
                      >
                        Enable
                      </button>
                    ) : (
                      <button
                        onClick={() => toggleDisabled(u.id, true)}
                        disabled={updating === u.id}
                        className="text-xs px-3 py-1 rounded font-medium bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 transition-colors"
                      >
                        Disable
                      </button>
                    )
                  )}
                </>
              )}
            </div>
          </div>
        ))}
        {filteredUsers.length === 0 && (
          <p className="text-center py-12 text-gray-400">No users found.</p>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Joined</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Change Role</th>
                <th className="px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.name ?? "-"}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-[180px] truncate">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.role === "ADMIN" ? "bg-red-100 text-red-800" :
                      u.role === "OWNER" ? "bg-blue-100 text-blue-800" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 hidden md:table-cell">{formatDate(new Date(u.createdAt))}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.disabled ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                    }`}>
                      {u.disabled ? "Disabled" : "Active"}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {u.id === session?.user?.id ? (
                      <span className="text-xs text-gray-400 italic">You</span>
                    ) : (
                      <select
                        value={u.role}
                        onChange={(e) => updateRole(u.id, e.target.value)}
                        disabled={updating === u.id}
                        className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {u.id !== session?.user?.id && (
                      u.disabled ? (
                        <button
                          onClick={() => toggleDisabled(u.id, false)}
                          disabled={updating === u.id}
                          className="text-xs px-3 py-1 rounded font-medium bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 transition-colors"
                        >
                          Enable
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleDisabled(u.id, true)}
                          disabled={updating === u.id}
                          className="text-xs px-3 py-1 rounded font-medium bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 transition-colors"
                        >
                          Disable
                        </button>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <p className="text-center py-12 text-gray-400">No users found.</p>
        )}
      </div>
    </div>
  );
}
