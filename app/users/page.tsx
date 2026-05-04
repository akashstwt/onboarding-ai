"use client";

import { useState, useEffect, useRef } from "react";
import AdminLayout from "@/components/AdminLayout";
import StatsCard from "@/components/StatsCard";
import ConfirmModal from "@/components/ConfirmModal";
import { adminAPI, type User } from "@/lib/authApi";
import { AdminRoute } from "@/components/ProtectedRoute";
import {
  UserIcon,
  Users as UsersIcon,
  Shield,
  ChevronDown,
  Trash2,
} from "lucide-react";

function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [openRoleDropdown, setOpenRoleDropdown] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    userId: string | null;
  }>({ isOpen: false, userId: null });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUsers();
      if (response.success && response.data) setUsers(response.data.users);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: "USER" | "ADMIN") => {
    try {
      setUpdatingUserId(userId);
      setError("");
      const response = await adminAPI.updateUserRole(userId, newRole);
      if (response.success) {
        setUsers(users.map((user) => user.id === userId ? { ...user, role: newRole } : user));
      }
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to update user role");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteUser = async () => {
    const userId = confirmDelete.userId;
    if (!userId) return;
    try {
      setError("");
      const response = await adminAPI.deleteUser(userId);
      if (response.success) setUsers(users.filter((user) => user.id !== userId));
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to delete user");
    }
  };

  const closeDropdown = () => {
    setOpenRoleDropdown(null);
    setDropdownPosition(null);
  };

  const handleRoleButtonClick = (e: React.MouseEvent<HTMLButtonElement>, userId: string) => {
    if (openRoleDropdown === userId) { closeDropdown(); return; }

    const buttonRect = e.currentTarget.getBoundingClientRect();
    const containerRect = tableContainerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    const topRelative = buttonRect.bottom - containerRect.top + 4;
    const leftRelative = buttonRect.left - containerRect.left;

    const DROPDOWN_HEIGHT = 80;
    const clampedTop = Math.min(topRelative, containerRect.height - DROPDOWN_HEIGHT - 8);

    setDropdownPosition({ top: clampedTop, left: leftRelative });
    setOpenRoleDropdown(userId);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-light mb-2 text-white">User Management</h1>
            <p className="mt-1 text-sm text-white/70">Manage User role and permission</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 bg-black/10 border border-gradient-primary rounded-lg">
            <UserIcon className="w-5 h-5 text-white" />
            <span className="text-sm text-white">{users.length} Total Users</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <StatsCard title="Total Users" value={users.length} icon={<UsersIcon className="w-6 h-6" />} color="blue" />
          <StatsCard title="Admins" value={users.filter((u) => u.role === "ADMIN").length} icon={<Shield className="w-6 h-6" />} color="purple" />
          <StatsCard title="Regular Users" value={users.filter((u) => u.role === "USER").length} icon={<UserIcon className="w-6 h-6" />} color="green" />
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Users Table */}
        <div
          ref={tableContainerRef}
          className="relative bg-light-black backdrop-blur-sm border border-white/10 rounded-lg overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-black/30">
                <tr>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider">User</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider">email ID</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider hidden md:table-cell">Provider</th>
                  <th className="px-4 sm:px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider">Role</th>
                  <th className="px-4 sm:px-6 py-4 text-right text-xs font-medium text-white/70 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {users.map((user) => (
                  // h-16 + align-middle = every row exactly 64px tall
                  <tr key={user.id} className="h-16">
                    <td className="px-4 sm:px-6 py-0 align-middle whitespace-nowrap">
                      <div className="text-sm text-white">{user.name || "User"}</div>
                    </td>
                    <td className="px-4 sm:px-6 py-0 align-middle whitespace-nowrap">
                      <div className="text-sm text-white">{user.email}</div>
                    </td>
                    <td className="px-4 sm:px-6 py-0 align-middle whitespace-nowrap text-sm text-white hidden md:table-cell">
                      {user.provider}
                    </td>
                    <td className="px-4 sm:px-6 py-0 align-middle whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => handleRoleButtonClick(e, user.id)}
                        disabled={updatingUserId === user.id}
                        className="w-24 px-2 py-2 bg-light-black border-2 border-primary-border text-white text-sm rounded-lg focus:outline-none transition-all flex items-center justify-between disabled:opacity-50 hover:border-white/40"
                      >
                        <span>{user.role === "ADMIN" ? "Admin" : "User"}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${openRoleDropdown === user.id ? "rotate-180" : ""}`} />
                      </button>
                    </td>
                    <td className="px-4 sm:px-4 py-0 align-middle whitespace-nowrap text-right">
                      <button
                        onClick={() => setConfirmDelete({ isOpen: true, userId: user.id })}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-red-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-sm">Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && !loading && (
            <div className="text-center py-12">
              <UserIcon className="mx-auto h-12 w-12 text-white/50" />
              <h3 className="mt-2 text-sm font-medium text-white">No users found</h3>
              <p className="mt-1 text-sm text-white/70">No users have registered yet.</p>
            </div>
          )}

      
          {openRoleDropdown && dropdownPosition && (() => {
            const user = users.find((u) => u.id === openRoleDropdown);
            if (!user) return null;
            return (
              <>
                <div className="absolute inset-0 z-40" onClick={closeDropdown} />
                <div
                  className="absolute z-50 w-24 bg-light-black border-2 border-primary-border rounded-lg shadow-xl flex flex-col overflow-hidden"
                  style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
                >
                  <button
                    type="button"
                    onClick={() => { handleRoleChange(user.id, "USER"); closeDropdown(); }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-white/10 transition-colors border-b border-white/10 ${user.role === "USER" ? "text-white" : "text-white/70"}`}
                  >
                    User
                  </button>
                  <button
                    type="button"
                    onClick={() => { handleRoleChange(user.id, "ADMIN"); closeDropdown(); }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-white/10 transition-colors ${user.role === "ADMIN" ? "text-white" : "text-white/70"}`}
                  >
                    Admin
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, userId: null })}
        onConfirm={handleDeleteUser}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </AdminLayout>
  );
}

export default function ProtectedUsersPage() {
  return (
    <AdminRoute>
      <UsersManagementPage />
    </AdminRoute>
  );
}