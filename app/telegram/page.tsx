"use client";

import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import LoadingSpinner from "@/components/LoadingSpinner";
import StatsCard from "@/components/StatsCard";
import { AdminRoute } from "@/components/ProtectedRoute";
import { telegramAPI } from "@/lib/api";
import { TelegramMention, TelegramStats } from "@/lib/types";
import {
  MessageSquare,
  ExternalLink,
  RefreshCw,
  Check,
  Clock,
  Bell,
  CheckCircle,
} from "lucide-react";

export default function TelegramMentionsPage() {
  const [mentions, setMentions] = useState<TelegramMention[]>([]);
  const [stats, setStats] = useState<TelegramStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "pending" | "notified" | "addressed"
  >("all");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const statusParam =
        filterStatus !== "all" ? { status: filterStatus } : undefined;

      const [mentionsRes, statsRes] = await Promise.all([
        telegramAPI.allMentions(statusParam),
        telegramAPI.mentionStats(),
      ]);

      if (mentionsRes.success && mentionsRes.mentions) {
        setMentions(mentionsRes.mentions as TelegramMention[]);
      }
      if (statsRes.success && statsRes.stats) {
        setStats(statsRes.stats as TelegramStats);
      }
    } catch (error) {
      console.error("Failed to load mentions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCheckMentions = async () => {
    setIsChecking(true);
    try {
      const result = await telegramAPI.checkMentions();
      if (result.success && result.result) {
        loadData();
      }
    } catch (error) {
      console.error("Failed to check mentions:", error);
      setError("Failed to check mentions");
    } finally {
      setIsChecking(false);
    }
  };

  const handleMarkAddressed = async (mentionId: string) => {
    try {
      const result = await telegramAPI.markMentionAddressed(mentionId);
      if (result.success) {
        loadData();
      }
    } catch (error) {
      console.error("Failed to mark as addressed:", error);
      setError("Failed to mark as addressed");
    }
  };

  if (isLoading) {
    return (
      <AdminRoute>
        <AdminLayout>
          <div className="flex items-center justify-center h-96">
            <LoadingSpinner size="lg" text="Loading configurations..." />
          </div>
        </AdminLayout>
      </AdminRoute>
    );
  }

  return (
    <AdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl mb-2 font-light lg:text-3xl text-white">
                Telegram Mentions
              </h1>
              <p className="mt-1 text-sm text-white/70">
                Monitor and manage Telegram mentions
              </p>
            </div>
            <button
              onClick={handleCheckMentions}
              disabled={isChecking}
              className="flex items-center gap-2 px-4 py-2.5 border border-gradient-primary rounded-lg hover:bg-white/90 disabled:opacity-50 transition-all shadow-lg"
            >
              <RefreshCw
                className={`w-4 h-4 ${isChecking ? "animate-spin" : ""}`}
              />
              <span className="text-base font-medium">
                {isChecking ? "Checking..." : "Check Now"}
              </span>
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <StatsCard
                title="Total Mentions"
                value={stats.total}
                icon={<MessageSquare className="w-6 h-6" />}
                color="purple"
              />
              <StatsCard
                title="Pending"
                value={stats.pending}
                icon={<Clock className="w-6 h-6" />}
                color="yellow"
              />
              <StatsCard
                title="Notified"
                value={stats.notified}
                icon={<Bell className="w-6 h-6" />}
                color="blue"
              />
              <StatsCard
                title="Addressed"
                value={stats.addressed}
                icon={<CheckCircle className="w-6 h-6" />}
                color="green"
              />
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {(["all", "pending", "notified", "addressed"] as const).map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 sm:px-6 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    filterStatus === status
                      ? "bg-white border border-gradient-primary"
                      : "bg-black/10 text-white/70 hover:bg-white/20 border border-primary-border"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ),
            )}
          </div>

          {/* Mentions Table */}
          <div className="bg-light-black backdrop-blur-sm border border-primary-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-black/30">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider hidden md:table-cell">
                      Mentioned User
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider hidden lg:table-cell">
                      Status
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {mentions.map((mention) => (
                    <tr
                      key={mention.id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      {/* Client */}
                      <td className="px-4 sm:px-6 py-4">
                        <div className="text-sm font-medium text-white">
                          {mention.clientName || "Unknown Client"}
                        </div>
                        <div className="text-xs text-white/50">
                          {new Date(mention.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Message */}
                      <td className="px-4 sm:px-6 py-4">
                        <div className="text-sm text-white max-w-md truncate">
                          {mention.messageText}
                        </div>
                        {mention.mentionedBy && (
                          <div className="text-xs text-white/50">
                            by {mention.mentionedBy}
                          </div>
                        )}
                      </td>

                      {/* Mentioned User */}
                      <td className="px-4 sm:px-6 py-4 hidden md:table-cell">
                        <div className="text-sm text-white">
                          {mention.mentionedUsername ? (
                            <span className="text-blue-400">
                              @{mention.mentionedUsername}
                            </span>
                          ) : (
                            <span className="text-white/50">
                              ID: {mention.mentionedTelegramId}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 sm:px-6 py-4 hidden lg:table-cell">
                        <div className="flex flex-col gap-1">
                          {mention.addressed ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full w-fit">
                              <CheckCircle className="w-3 h-3" />
                              Addressed
                            </span>
                          ) : mention.notificationSent ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full w-fit">
                              <Bell className="w-3 h-3" />
                              Notified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full w-fit">
                              <Clock className="w-3 h-3" />
                              Pending
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {mention.messageLink && (
                            <a
                              href={mention.messageLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 transition-colors"
                              title="Open in Telegram"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          {!mention.addressed && (
                            <button
                              onClick={() => handleMarkAddressed(mention.id)}
                              className="text-green-400 hover:text-green-300 transition-colors"
                              title="Mark as addressed"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {mentions.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-white/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  No mentions found
                </h3>
                <p className="text-white/70">
                  {filterStatus !== "all"
                    ? `No ${filterStatus} mentions at the moment`
                    : "No mentions have been detected yet"}
                </p>
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </AdminRoute>
  );
}
