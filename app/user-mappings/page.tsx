"use client";

import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import StatsCard from "@/components/StatsCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { AdminRoute } from "@/components/ProtectedRoute";
import { userMappingsAPI } from "@/lib/api";
import { SlackMember, UserMappingStats } from "@/lib/types";
import {
  Users,
  CheckCircle,
  XCircle,
  Download,
  Search,
  AlertCircle,
} from "lucide-react";

export default function UserMappingsPage() {
  const [members, setMembers] = useState<SlackMember[]>([]);
  const [stats, setStats] = useState<UserMappingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [membersRes, statsRes] = await Promise.all([
        userMappingsAPI.getSlackMembers(searchQuery),
        userMappingsAPI.stats(),
      ]);

      if (membersRes.success && membersRes.members) {
        setMembers(membersRes.members as SlackMember[]);
      }

      // Stats can be in data property or directly in response
      if (statsRes.success) {
        const statsData = (statsRes.data || statsRes.stats) as UserMappingStats;
        if (statsData) {
          setStats(statsData);
        }
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleImportSlack = async () => {
    setIsImporting(true);
    try {
      const result = await userMappingsAPI.importFromSlack();
      if (!result.success) {
        throw new Error(result.error as string);
      }
      await loadData();
    } catch (error) {
      console.error("Failed to import Slack members:", error);
      setError("Failed to import Slack members. Please try again.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleStartEdit = (member: SlackMember) => {
    setEditingId(member.slackUserId);
    setEditValue(member.telegramUsername || "");
  };

  const handleSaveEdit = async (member: SlackMember) => {
    try {
      if (!member.mappingId) {
        console.error("No mapping ID found. Please import from Slack first.");
        setError(
          "This user needs to be imported from Slack first. Click 'Import from Slack' button.",
        );
        setEditingId(null);
        return;
      }

      const result = await userMappingsAPI.update(member.mappingId, {
        telegramUsername: editValue || undefined,
      });

      if (result.success) {
        // Reload data to get updated state
        await loadData();
      } else {
        setError("Failed to update mapping. Please try again.");
      }
      setEditingId(null);
    } catch (error) {
      console.error("Failed to update mapping:", error);
      setError("Failed to update mapping. Please check console for details.");
      setEditingId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <LoadingSpinner />
      </AdminLayout>
    );
  }

  const mappedCount = stats?.complete || 0;
  const totalCount = stats?.total || 0;
  const progressPercent =
    totalCount > 0 ? Math.round((mappedCount / totalCount) * 100) : 0;

  return (
    <AdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-light text-white">User Mappings</h1>
              <p className="text-white/60 mt-1">
                Map Slack users to Telegram usernames for @mention routing
              </p>
            </div>
            <button
              onClick={handleImportSlack}
              disabled={isImporting}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gradient-primary cursor-pointer hover:bg-primary-purple/90 disabled:bg-primary-purple/50 text-white rounded-lg transition-all"
            >
              <Download className="w-4 h-4" />
              {isImporting ? "Importing..." : "Import from Slack"}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            <StatsCard
              icon={<Users className="w-5 h-5" />}
              title="Total Members"
              value={stats?.total || 0}
              color="blue"
            />
            <StatsCard
              icon={<CheckCircle className="w-5 h-5" />}
              title="Mapped"
              value={stats?.complete || 0}
              color="green"
            />
            <StatsCard
              icon={<XCircle className="w-5 h-5" />}
              title="Unmapped"
              value={stats?.incomplete || 0}
              color="red"
            />
            <StatsCard
              icon={<AlertCircle className="w-5 h-5" />}
              title="Progress"
              value={`${progressPercent}%`}
              color="purple"
            />
          </div>

          {/* Progress Bar */}
          <div className="bg-light-black p-4 rounded-lg border border-primary-border">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-white/70">Mapping Progress</span>
              <span className="text-sm text-white font-medium">
                {mappedCount} / {totalCount}
              </span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary-purple to-blue-500 h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or Telegram username..."
              className="w-full pl-10 pr-4 py-2.5 bg-light-black border border-primary-border rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-primary-purple transition-colors"
            />
          </div>

          {/* Members Table */}
          <div className="bg-light-black rounded-lg border border-primary-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-primary-border bg-black/30">
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Slack User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                      Telegram Username
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-white/60 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-border">
                  {members.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-12 text-center text-white/40"
                      >
                        {searchQuery
                          ? "No members found matching your search"
                          : "No Slack members found. Click 'Import from Slack' to get started."}
                      </td>
                    </tr>
                  ) : (
                    members.map((member) => (
                      <tr
                        key={member.slackUserId}
                        className={`transition-colors ${
                          member.isMapped
                            ? "hover:bg-white/5"
                            : "bg-red-500/5 hover:bg-red-500/10"
                        }`}
                      >
                        {/* Slack User */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                              <span className="text-sm font-medium text-white">
                                {member.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">
                                {member.name}
                              </div>
                              <div className="text-xs text-white/40">
                                {member.slackUserId}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-4 py-3">
                          <div className="text-sm text-white/70">
                            {member.slackEmail}
                          </div>
                        </td>

                        {/* Telegram Username (Inline Editable) */}
                        <td className="px-4 w-92 py-3">
                          {editingId === member.slackUserId ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                placeholder="telegram_username"
                                className="flex-1 px-2 py-1 bg-dark-black border border-primary-purple rounded text-sm text-white focus:outline-none"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveEdit(member);
                                  if (e.key === "Escape") handleCancelEdit();
                                }}
                              />
                              <button
                                onClick={() => handleSaveEdit(member)}
                                className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded hover:bg-green-500/30"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded hover:bg-red-500/30"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleStartEdit(member)}
                              className="text-left w-full group"
                            >
                              {member.telegramUsername ? (
                                <span className="text-sm text-white group-hover:text-primary-purple transition-colors">
                                  {member.telegramUsername}
                                </span>
                              ) : (
                                <span className="text-sm text-white/40 italic group-hover:text-white/60 transition-colors">
                                  Click to add
                                </span>
                              )}
                            </button>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3 text-center">
                          {member.isMapped ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                              <CheckCircle className="w-3 h-3" />
                              Mapped
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                              <XCircle className="w-3 h-3" />
                              Unmapped
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
}
