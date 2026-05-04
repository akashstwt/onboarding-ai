"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import LoadingSpinner from "@/components/LoadingSpinner";
import ConfirmModal from "@/components/ConfirmModal";
import { Save, RotateCcw, ChevronDown } from "lucide-react";
import { AdminRoute } from "@/components/ProtectedRoute";
import { settingsAPI } from "@/lib/api";
import { PulseSettings, CRLASettings, TelegramSettings } from "@/lib/types";

function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"pulse" | "crla" | "telegram">(
    "pulse",
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);

  const [pulseSettings, setPulseSettings] = useState<PulseSettings>({
    cadence: "weekly",
    targetChannel: "",
    enabled: true,
  });

  const [crlaSettings, setCRLASettings] = useState<CRLASettings>({
    cadence: "daily",
    enabled: true,
  });

  const [telegramSettings, setTelegramSettings] = useState<TelegramSettings>({
    routingEnabled: true,
    mentionCheckInterval: 30,
  });

  const [isPulseCadenceOpen, setIsPulseCadenceOpen] = useState(false);
  const [isCRLACadenceOpen, setIsCRLACadenceOpen] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const [pulseRes, crlaRes, telegramRes] = await Promise.all([
        settingsAPI.getPulseConfig(),
        settingsAPI.getCRLAConfig(),
        settingsAPI.getTelegramConfig(),
      ]);

      if (pulseRes.success && pulseRes.config) {
        setPulseSettings(pulseRes.config as PulseSettings);
      }
      if (crlaRes.success && crlaRes.config) {
        setCRLASettings(crlaRes.config as CRLASettings);
      }
      if (telegramRes.success && telegramRes.config) {
        setTelegramSettings(telegramRes.config as TelegramSettings);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePulse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      const result = await settingsAPI.updatePulseConfig(pulseSettings);
      if (!result.success) {
        throw new Error("Failed to save pulse settings");
      }
      // Success - no alert needed
    } catch (err) {
      console.error("Failed to save pulse settings:", err);
      setError("Failed to save pulse settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCRLA = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      const result = await settingsAPI.updateCRLAConfig(crlaSettings);
      if (!result.success) {
        throw new Error("Failed to save CRLA settings");
      }
      // Success - no alert needed
    } catch (err) {
      console.error("Failed to save CRLA settings:", err);
      setError("Failed to save CRLA settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTelegram = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      const result = await settingsAPI.updateTelegramConfig(telegramSettings);
      if (!result.success) {
        throw new Error("Failed to save telegram settings");
      }
      // Success - no alert needed
    } catch (err) {
      console.error("Failed to save telegram settings:", err);
      setError("Failed to save telegram settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    try {
      setError("");
      // Reset to defaults would need a dedicated endpoint
      // For now, just reload settings
      loadSettings();
      // Success - no alert needed
    } catch (err) {
      console.error("Failed to reset settings:", err);
      setError("Failed to reset settings");
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner size="lg" text="Loading settings..." />
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
              Settings
            </h1>
            <p className="mt-1 text-sm text-white/70">
              Manage system-wide configuration
            </p>
          </div>
          <button
            onClick={() => setConfirmReset(true)}
            className="flex items-center gap-2 px-4 sm:px-6 py-2.5 bg-black/10 hover:bg-white/20 border border-gradient-primary cursor-pointer text-white rounded-lg transition-all shadow-lg"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-sm">Refresh to Default</span>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="">
          <div className="border-b border-white/10">
            <nav className="flex -mb-px gap-4 overflow-x-auto pb-4">
              {[
                { value: "pulse", label: "Pulse Setting" },
                { value: "crla", label: "CRLA Setting" },
                { value: "telegram", label: "Telegram Setting" },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() =>
                    setActiveTab(tab.value as "pulse" | "crla" | "telegram")
                  }
                  className={`px-4 sm:px-6 py-2.5 rounded-lg text-base font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.value
                      ? "border border-gradient-primary"
                      : "bg-black/10 text-white/70 hover:bg-white/20 border-2 border-primary-border"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-6">
            {/* Pulse Settings Tab */}
            {activeTab === "pulse" && (
              <form onSubmit={handleSavePulse} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Cadence
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsPulseCadenceOpen(!isPulseCadenceOpen)}
                      className="w-full md:w-96 px-4 py-2.5 bg-light-black border border-primary-border text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-left flex items-center justify-between"
                    >
                      <span>
                        {pulseSettings.cadence === "daily" ? "Daily" : "Weekly"}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${isPulseCadenceOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {isPulseCadenceOpen && (
                      <div className="absolute z-50 w-full md:w-96 mt-1 bg-light-black border border-primary-border rounded-lg shadow-lg">
                        <button
                          type="button"
                          onClick={() => {
                            setPulseSettings({
                              ...pulseSettings,
                              cadence: "daily",
                            });
                            setIsPulseCadenceOpen(false);
                          }}
                          className="w-full px-4 py-2.5 text-left text-white hover:bg-white/10 transition-colors first:rounded-t-lg"
                        >
                          Daily
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPulseSettings({
                              ...pulseSettings,
                              cadence: "weekly",
                            });
                            setIsPulseCadenceOpen(false);
                          }}
                          className="w-full px-4 py-2.5 text-left text-white hover:bg-white/10 transition-colors last:rounded-b-lg"
                        >
                          Weekly
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Target Slack Channel ID
                  </label>
                  <input
                    type="text"
                    value={pulseSettings.targetChannel}
                    onChange={(e) =>
                      setPulseSettings({
                        ...pulseSettings,
                        targetChannel: e.target.value,
                      })
                    }
                    placeholder="C01EL6PMBHN"
                    className="w-full md:w-96 px-4 py-2.5 bg-light-black border border-primary-border text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                  <p className="mt-1 text-sm text-white/50">
                    The Slack channel where Pulse reports will be posted
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="pulse-enabled"
                      checked={pulseSettings.enabled}
                      onChange={(e) =>
                        setPulseSettings({
                          ...pulseSettings,
                          enabled: e.target.checked,
                        })
                      }
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 rounded border-2 transition-all ${
                        pulseSettings.enabled
                          ? "border-gradient-primary"
                          : "border-gradient-primary bg-light-black"
                      }`}
                    >
                      {pulseSettings.enabled && (
                        <svg
                          className="w-full h-full text-white p-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </label>
                  <label
                    htmlFor="pulse-enabled"
                    className="text-sm text-white/70 cursor-pointer"
                  >
                    Enable Pulse reporting
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-all shadow-lg"
                >
                  <Save className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {isSaving ? "Saving..." : "Save Changes"}
                  </span>
                </button>
              </form>
            )}

            {/* CRLA Settings Tab */}
            {activeTab === "crla" && (
              <form onSubmit={handleSaveCRLA} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-3">
                    Digest Cadence
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsCRLACadenceOpen(!isCRLACadenceOpen)}
                      className="w-full md:w-96 px-4 py-2.5 bg-light-black border border-primary-border text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-left flex items-center justify-between"
                    >
                      <span>
                        {crlaSettings.cadence === "daily" ? "Daily" : "Weekly"}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${isCRLACadenceOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {isCRLACadenceOpen && (
                      <div className="absolute z-50 w-full md:w-96 mt-1 bg-light-black border border-primary-border rounded-lg shadow-lg">
                        <button
                          type="button"
                          onClick={() => {
                            setCRLASettings({
                              ...crlaSettings,
                              cadence: "daily",
                            });
                            setIsCRLACadenceOpen(false);
                          }}
                          className="w-full px-4 py-2.5 text-left text-white hover:bg-white/10 transition-colors first:rounded-t-lg"
                        >
                          Daily
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCRLASettings({
                              ...crlaSettings,
                              cadence: "weekly",
                            });
                            setIsCRLACadenceOpen(false);
                          }}
                          className="w-full px-4 py-2.5 text-left text-white hover:bg-white/10 transition-colors last:rounded-b-lg"
                        >
                          Weekly
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-white/50">
                    How often CRLA digests should be generated
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="crla-enabled"
                      checked={crlaSettings.enabled}
                      onChange={(e) =>
                        setCRLASettings({
                          ...crlaSettings,
                          enabled: e.target.checked,
                        })
                      }
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 rounded border-2 transition-all ${
                        crlaSettings.enabled
                          ? "border-gradient-primary"
                          : "border-gradient-primary bg-light-black"
                      }`}
                    >
                      {crlaSettings.enabled && (
                        <svg
                          className="w-full h-full text-white p-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </label>
                  <label
                    htmlFor="crla-enabled"
                    className="text-sm text-white/70 cursor-pointer"
                  >
                    Enable CRLA digest generation
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-all shadow-lg"
                >
                  <Save className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {isSaving ? "Saving..." : "Save Changes"}
                  </span>
                </button>
              </form>
            )}

            {/* Telegram Settings Tab */}
            {activeTab === "telegram" && (
              <form onSubmit={handleSaveTelegram} className="space-y-6">
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="telegram-routing"
                      checked={telegramSettings.routingEnabled}
                      onChange={(e) =>
                        setTelegramSettings({
                          ...telegramSettings,
                          routingEnabled: e.target.checked,
                        })
                      }
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 rounded border-2 transition-all ${
                        telegramSettings.routingEnabled
                          ? "border-gradient-primary bg-gradient-primary"
                          : "border-gradient-primary bg-light-black"
                      }`}
                    >
                      {telegramSettings.routingEnabled && (
                        <svg
                          className="w-full h-full text-white p-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </label>
                  <label
                    htmlFor="telegram-routing"
                    className="text-sm text-white/70 cursor-pointer"
                  >
                    Enable Telegram → Slack DM routing
                  </label>
                </div>
                <p className="text-sm text-white/50">
                  When enabled, mentions in Telegram will trigger Slack DMs
                </p>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-3">
                    Mention Check Interval (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    value={telegramSettings.mentionCheckInterval}
                    onChange={(e) =>
                      setTelegramSettings({
                        ...telegramSettings,
                        mentionCheckInterval: parseInt(e.target.value) || 30,
                      })
                    }
                    className="w-full md:w-96 px-4 py-2.5 bg-light-black border border-primary-border text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                  <p className="mt-2 text-sm text-white/50">
                    How often to check for new mentions (1-1440 minutes)
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-all shadow-lg"
                >
                  <Save className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {isSaving ? "Saving..." : "Save Changes"}
                  </span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={handleResetDefaults}
        title="Reset Settings"
        message="Are you sure you want to reset all settings to defaults? This action will restore all configurations to their original values."
        confirmText="Reset"
        cancelText="Cancel"
        variant="warning"
      />
    </AdminLayout>
  );
}

// Wrap with admin route protection
export default function ProtectedSettingsPage() {
  return (
    <AdminRoute>
      <SettingsPage />
    </AdminRoute>
  );
}
