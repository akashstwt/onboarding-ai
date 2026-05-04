"use client";

import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import LoadingSpinner from "@/components/LoadingSpinner";
import StatsCard from "@/components/StatsCard";
import Modal from "@/components/Modal";
import { AdminRoute } from "@/components/ProtectedRoute";
import { pulseAPI } from "@/lib/api";
import { PulseReport, PulseLog } from "@/lib/types";
import {
  Activity,
  AlertCircle,
  Eye,
  Play,
  CheckCircle,
  XCircle,
  Calendar,
  Users,
  GitPullRequest,
  MessageSquare,
} from "lucide-react";

function PulsePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [logs, setLogs] = useState<PulseLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<PulseLog | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Show direct whole numbers from the latest run (no averaging)
  const latestSummary = logs[0]?.summary || {
    onTrack: 0,
    attention: 0,
    blocked: 0,
  };

  const stats = {
    totalRuns: logs.length,
    summary: {
      onTrack: latestSummary.onTrack,
      attention: latestSummary.attention,
      blocked: latestSummary.blocked,
    },
  };

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await pulseAPI.getHistory({ limit, offset });
      if (result.success && result.logs) {
        setLogs(result.logs as PulseLog[]);
        setHasMore(((result.total as number) || 0) > offset + limit);
      }
    } catch (error) {
      console.error("Failed to load pulse logs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [limit, offset]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleGeneratePulse = async (postToSlack: boolean = false) => {
    setIsGenerating(true);
    setError("");
    try {
      const result = await pulseAPI.generate(postToSlack);
      if (!result.success) {
        throw new Error(result.error || "Failed to generate pulse");
      }
      loadLogs();
    } catch (error) {
      console.error("Failed to generate pulse:", error);
      setError("Failed to generate pulse");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleViewDetails = async (logId: string) => {
    try {
      const result = await pulseAPI.getLog(logId);
      if (result.success && result.log) {
        setSelectedLog(result.log as PulseLog);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error("Failed to load pulse log details:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "On Track":
        return "text-green-400 bg-green-400/10 border-green-400/20";
      case "Attention":
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
      case "Blocked":
        return "text-red-400 bg-red-400/10 border-red-400/20";
      default:
        return "text-white/40 bg-white/10 border-white/20";
    }
  };

  if (isLoading && logs.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" text="Loading pulse logs..." />
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
            <h1 className="text-2xl sm:text-3xl font-light mb-2 text-white">
              Pulse Reports
            </h1>
            <p className="mt-1 text-sm text-white/70">
              Track client health and progress
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleGeneratePulse(false)}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 sm:px-6 py-2.5 bg-black/10 hover:bg-white/20 border border-gradient-primary text-white rounded-lg transition-all shadow-lg disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              <span className="text-sm">Generate</span>
            </button>
            <button
              onClick={() => handleGeneratePulse(true)}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 sm:px-6 py-2.5 border border-gradient-primary rounded-lg hover:bg-white/90 disabled:opacity-50 transition-all text-sm"
            >
              <Play className="w-4 h-4" />
              <span className="text-sm">Generate & Post</span>
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatsCard
            title="Total Runs"
            value={stats.totalRuns}
            icon={<Activity className="w-5 h-5" />}
            color="purple"
          />
          <StatsCard
            title="On Track"
            value={stats.summary.onTrack}
            icon={<CheckCircle className="w-5 h-5" />}
            color="green"
          />
          <StatsCard
            title="Needs Attention"
            value={stats.summary.attention}
            icon={<AlertCircle className="w-5 h-5" />}
            color="yellow"
          />
          <StatsCard
            title="Blocked"
            value={stats.summary.blocked}
            icon={<XCircle className="w-5 h-5" />}
            color="red"
          />
        </div>

        {/* Pulse History Table */}
        <div className="bg-light-black border border-primary-border rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-xl font-light text-white">Pulse History</h2>
            <p className="text-sm text-white/50 mt-1">
              View past pulse reports and their status
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-black/30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                    Triggered By
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                    Clients
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                    Summary
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                    Slack
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/70 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    {/* Timestamp */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-white">
                        <Calendar className="w-4 h-4 text-white/40" />
                        {formatDate(log.createdAt)}
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          log.runType === "manual"
                            ? "bg-blue-400/10 text-blue-400 border border-blue-400/20"
                            : "bg-purple-400/10 text-purple-400 border border-purple-400/20"
                        }`}
                      >
                        {log.runType}
                      </span>
                    </td>

                    {/* Triggered By */}
                    <td className="px-4 py-4 text-sm text-white/70 max-w-xs truncate">
                      {log.triggeredBy}
                    </td>

                    {/* Clients */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-white">
                        <Users className="w-4 h-4 text-white/40" />
                        {log.totalClients}
                      </div>
                    </td>

                    {/* Summary */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-green-400">
                          🟢 {log.summary.onTrack}
                        </span>
                        <span className="text-xs text-yellow-400">
                          🟡 {log.summary.attention}
                        </span>
                        <span className="text-xs text-red-400">
                          🔴 {log.summary.blocked}
                        </span>
                      </div>
                    </td>

                    {/* Slack Status */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      {log.postedToSlack ? (
                        log.slackError ? (
                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-400/10 text-red-400 border border-red-400/20"
                            title={log.slackError}
                          >
                            Failed
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-400/10 text-green-400 border border-green-400/20">
                            Posted
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white/40 border border-white/20">
                          Not posted
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => handleViewDetails(log.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {hasMore && (
            <div className="px-6 py-4 border-t border-white/10 flex justify-center">
              <button
                onClick={() => setOffset(offset + limit)}
                className="px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedLog(null);
        }}
        title={`Pulse Report - ${selectedLog ? formatDate(selectedLog.createdAt) : ""}`}
        size="xl"
      >
        {selectedLog && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {/* Log Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-black/30 rounded-lg border border-white/10">
              <div>
                <p className="text-xs text-white/50 mb-1">Run Type</p>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    selectedLog.runType === "manual"
                      ? "bg-blue-400/10 text-blue-400 border border-blue-400/20"
                      : "bg-purple-400/10 text-purple-400 border border-purple-400/20"
                  }`}
                >
                  {selectedLog.runType}
                </span>
              </div>
              <div>
                <p className="text-xs text-white/50 mb-1">Triggered By</p>
                <p className="text-sm text-white">{selectedLog.triggeredBy}</p>
              </div>
              <div>
                <p className="text-xs text-white/50 mb-1">Total Clients</p>
                <p className="text-sm text-white">{selectedLog.totalClients}</p>
              </div>
              <div>
                <p className="text-xs text-white/50 mb-1">Slack Status</p>
                {selectedLog.postedToSlack ? (
                  selectedLog.slackError ? (
                    <span className="text-sm text-red-400">
                      Failed: {selectedLog.slackError}
                    </span>
                  ) : (
                    <span className="text-sm text-green-400">Posted</span>
                  )
                ) : (
                  <span className="text-sm text-white/40">Not posted</span>
                )}
              </div>
            </div>

            {/* Reports */}
            {selectedLog.reports && selectedLog.reports.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">
                  Client Reports ({selectedLog.reports.length})
                </h3>
                {selectedLog.reports.map((report) => (
                  <div
                    key={report.clientId}
                    className="p-4 bg-light-black border border-primary-border rounded-lg"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-base font-medium text-white flex items-center gap-2">
                          <span>{report.statusEmoji}</span>
                          {report.clientName}
                        </h4>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 border ${getStatusColor(report.status)}`}
                        >
                          {report.status}
                        </span>
                      </div>
                    </div>

                    {/* Summary */}
                    <p className="text-sm text-white/80 italic mb-3">
                      {report.summary}
                    </p>

                    {/* Status Reason */}
                    <p className="text-xs text-white/60 mb-3">
                      {report.statusReason}
                    </p>

                    {/* Metrics */}
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-black/30 rounded">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-xs text-white/70">
                          {report.metrics.meetings}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-black/30 rounded">
                        <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-xs text-white/70">
                          {report.metrics.linearIssues}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-black/30 rounded">
                        <GitPullRequest className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-xs text-white/70">
                          {report.metrics.githubPRs}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-black/30 rounded">
                        <Activity className="w-3.5 h-3.5 text-orange-400" />
                        <span className="text-xs text-white/70">
                          {report.metrics.pipedriveActivities}
                        </span>
                      </div>
                    </div>

                    {/* Action Items */}
                    {report.actionItems.length > 0 &&
                      report.actionItems[0] !== "No open action items" && (
                        <div>
                          <p className="text-xs text-white/50 mb-2">
                            Action Items:
                          </p>
                          <ul className="space-y-1">
                            {report.actionItems.map((item, idx) => (
                              <li
                                key={idx}
                                className="text-xs text-white/70 flex items-start gap-2"
                              >
                                <span className="text-white/40 mt-0.5">•</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-white/50">
                No detailed reports available for this pulse run
              </div>
            )}
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}

export default function PulsePageWithAuth() {
  return (
    <AdminRoute>
      <PulsePage />
    </AdminRoute>
  );
}
