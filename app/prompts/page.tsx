"use client";

import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import StatsCard from "@/components/StatsCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import Modal from "@/components/Modal";
import ConfirmModal from "@/components/ConfirmModal";
import { AdminRoute } from "@/components/ProtectedRoute";
import { promptsAPI } from "@/lib/api";
import { Prompt } from "@/lib/types";
import {
  FileText,
  Edit,
  Eye,
  RotateCcw,
  Copy,
  Settings,
  User,
} from "lucide-react";

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [stats, setStats] = useState({ total: 0, system: 0, user: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editName, setEditName] = useState("");
  const [error, setError] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "system" | "user">(
    "all",
  );

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [promptsRes, statsRes] = await Promise.all([
        promptsAPI.list(filterType === "all" ? undefined : filterType),
        promptsAPI.stats(),
      ]);

      if (promptsRes.success) {
        setPrompts((promptsRes.prompts || []) as Prompt[]);
      }
      if (statsRes.success) {
        setStats(
          statsRes.stats as { total: number; system: number; user: number },
        );
      }
    } catch (error) {
      console.error("Failed to load prompts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openEditModal = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setEditContent(prompt.content);
    setEditName(prompt.name);
    setViewMode("edit");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!selectedPrompt) return;

    setError("");
    try {
      const result = await promptsAPI.update(selectedPrompt.key, {
        content: editContent,
        name: editName,
        type: selectedPrompt.type,
      });

      if (result.success) {
        setShowModal(false);
        loadData();
        // Success - no alert needed
      }
    } catch (err) {
      console.error("Failed to update prompt:", err);
      setError("Failed to update prompt");
    }
  };

  const handleResetPrompts = async () => {
    try {
      setError("");
      const result = await promptsAPI.initialize();
      if (result.success) {
        loadData();
        // Success - no alert needed
      }
    } catch (err) {
      console.error("Failed to reset prompts:", err);
      setError("Failed to reset prompts");
    }
  };

  if (isLoading) {
    return (
      <AdminRoute>
        <AdminLayout>
          <div className="flex items-center justify-center h-96">
            <LoadingSpinner size="lg" text="Loading prompts..." />
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
              <h1 className="text-2xl lg:text-3xl font-light mb-2 text-white">
                Prompts
              </h1>
              <p className="mt-1 text-sm text-primary-text">
                Manage AI prompts for processing and automation
              </p>
            </div>
            <button
              onClick={() => setConfirmReset(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-white/20 border border-gradient-primary cursor-pointer rounded-lg transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-base">Reset to Default</span>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            <StatsCard
              title="Total Prompts"
              value={stats.total}
              icon={<FileText className="w-6 h-6" />}
              color="blue"
            />
            <StatsCard
              title="System Prompts"
              value={stats.system}
              icon={<Settings className="w-6 h-6" />}
              color="purple"
            />
            <StatsCard
              title="User Prompts"
              value={stats.user}
              icon={<User className="w-6 h-6" />}
              color="green"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-4 overflow-x-auto">
            {[
              { value: "all", label: "All" },
              { value: "system", label: "System" },
              { value: "user", label: "Users" },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() =>
                  setFilterType(filter.value as "all" | "system" | "user")
                }
                className={`px-2 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  filterType === filter.value
                    ? "text-white border-2 border-gradient-primary"
                    : "bg-black/20 text-white/70 hover:bg-black/5 border-2 border-primary-border"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Prompts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prompts.map((prompt) => (
              <div
                key={prompt.id}
                className="bg-light-black rounded-lg justify-between flex flex-col p-4 sm:p-6 transition-all"
              >
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h3 className="text-lg sm:text-xl font-medium text-white mb-2">
                      {prompt.name}
                    </h3>
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                        prompt.type === "system"
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          : "bg-green-500/20 text-green-300 border border-green-500/30"
                      }`}
                    >
                      {prompt.type}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(prompt.content);
                    }}
                    className="p-2 rounded-lg cursor-pointer [&>svg]:w-5 [&>svg]:h-5 [&>svg]:stroke-[url(#icon-gradient)] bg-black/20 border border-primary-border hover:border-transparent hover:bg-gradient-primary transition-all group"
                    title="Copy prompt content"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>

                <div className="bg-white/5 rounded p-3 mb-4 max-h-32 overflow-y-auto">
                  <p className="text-xs text-white/70 font-mono leading-relaxed">
                    {prompt.content.substring(0, 200)}
                    {prompt.content.length > 200 && "..."}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-white/50 mb-4">
                  <span>
                    Updated:{" "}
                    {new Date(prompt.updatedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  {prompt.updatedBy && <span>By: {prompt.updatedBy}</span>}
                </div>

                <button
                  onClick={() => openEditModal(prompt)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-primary hover:scale-105 cursor-pointer text-white rounded-lg transition-all duration-300 shadow-lg"
                >
                  <Edit className="w-4 h-4" />
                  Edit Prompt
                </button>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {prompts.length === 0 && (
            <div className="bg-black/20 backdrop-blur-xl rounded-lg p-12 text-center">
              <FileText className="w-16 h-16 text-white/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                No Prompts Found
              </h3>
              <p className="text-white/70">
                No prompts match the current filter
              </p>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={selectedPrompt?.name || "Edit Prompt"}
          size="xl"
        >
          {selectedPrompt && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Prompt Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-black/20 border border-primary-border text-white rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-white/70">
                    Prompt Content
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewMode("edit")}
                      className={`px-3 py-1 text-xs rounded ${
                        viewMode === "edit"
                          ? "bg-gradient-primary text-white"
                          : "bg-white/10 text-white/70 border border-primary-border"
                      }`}
                    >
                      <Edit className="w-3 h-3 inline mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => setViewMode("preview")}
                      className={`px-3 py-1 text-xs rounded ${
                        viewMode === "preview"
                          ? "bg-gradient-primary text-white"
                          : "bg-white/10 text-white/70 border border-primary-border"
                      }`}
                    >
                      <Eye className="w-3 h-3 inline mr-1" />
                      Preview
                    </button>
                  </div>
                </div>

                {viewMode === "edit" ? (
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2 bg-black/20 border border-primary-border text-white rounded-lg font-mono text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                ) : (
                  <div className="w-full px-3 py-2 bg-black/20 border border-primary-border text-white rounded-lg font-mono text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
                    {editContent}
                  </div>
                )}
              </div>

              <div className="text-sm flex flex-row gap-5 text-white/70 font-light">
                <strong>Key: {selectedPrompt.key}</strong>
                <br />
                <strong>Type: {selectedPrompt.type}</strong>
                <br />
                <strong>Characters: {editContent.length}</strong>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-black/20 border border-gradient-primary rounded-lg text-white hover:bg-white/20"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-gradient-primary text-white rounded-lg hover:from-pink-600 hover:to-pink-700 shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </Modal>

        <ConfirmModal
          isOpen={confirmReset}
          onClose={() => setConfirmReset(false)}
          onConfirm={handleResetPrompts}
          title="Reset All Prompts"
          message="Are you sure you want to reset all prompts to their default values? This will overwrite any custom changes you've made."
          confirmText="Reset All"
          cancelText="Cancel"
          variant="warning"
        />
      </AdminLayout>
    </AdminRoute>
  );
}
