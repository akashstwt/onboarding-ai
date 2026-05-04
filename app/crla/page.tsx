"use client";

import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import LoadingSpinner from "@/components/LoadingSpinner";
import StatsCard from "@/components/StatsCard";
import { AdminRoute } from "@/components/ProtectedRoute";
import { crlaAPI } from "@/lib/api";
import {
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Package,
  Recycle,
} from "lucide-react";

interface DigestData {
  clientName: string;
  newRequests: number;
  progressed: number;
  shipped: number;
  blocked: number;
  needsAttention: boolean;
}

export default function CRLAPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [digestType, setDigestType] = useState<"daily" | "weekly">("daily");
  const [postToSlack, setPostToSlack] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState("");

  const [digests, setDigests] = useState<DigestData[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setShowResults(false);
    setError("");
    try {
      const result = await crlaAPI.generate({
        digestType,
        post: postToSlack,
      });

      if (result.success) {
        setDigests(Array.isArray(result.digests) ? result.digests : []);
        setShowResults(true);
      } else {
        setError("Failed to generate digests: " + result.error);
      }
    } catch (error) {
      console.error("Failed to generate digests:", error);
      setError("Failed to generate digests");
    } finally {
      setIsGenerating(false);
    }
  };

  const needsAttentionCount = digests.filter((d) => d.needsAttention).length;

  return (
    <AdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-light mb-2 text-white">
              CRLA Dashboard
            </h1>
            <p className="mt-1 text-sm text-primary-text">
              Customer Request Lifecycle Automation - Generate and manage
              digests
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Generation Controls */}
          <div className="">
            <h2 className="text-2xl border-b border-primary-border pb-2 text-white mb-4">
              Generate Digests
            </h2>
            <div className="flex flex-col gap-4 items-start">
              <div className="w-full sm:w-auto">
                <label className="block text-lg text-white mb-3">
                  Digest Type
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={postToSlack}
                      onChange={(e) => setPostToSlack(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-4 h-4 border-2 border-gradient-primary rounded bg-light-black transition-all duration-200 flex items-center justify-center">
                      {postToSlack && (
                        <svg
                          className="w-3 h-3 text-white"
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
                  </div>
                  <span className="text-sm text-primary-text group-hover:text-white transition-colors">
                    Also Post to Slack
                  </span>
                </label>
              </div>

              <div className="w-full flex gap-4 items-center">
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="w-48 px-4 py-3 bg-light-black border-2 border-primary-border rounded-lg text-white focus:outline-none transition-all flex items-center justify-between hover:border-white/40"
                  >
                    <span>{digestType === "daily" ? "Daily" : "Weekly"}</span>
                    <svg
                      className={`w-4 h-4 transition-transform ${showDropdown ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {showDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowDropdown(false)}
                      ></div>
                      <div className="absolute top-full mt-2 w-48 bg-light-black border-2 border-primary-border rounded-lg overflow-hidden z-20 shadow-xl">
                        <button
                          onClick={() => {
                            setDigestType("daily");
                            setShowDropdown(false);
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-white/10 transition-colors ${
                            digestType === "daily"
                              ? "text-white"
                              : "text-white/70"
                          }`}
                        >
                          Daily
                        </button>
                        <button
                          onClick={() => {
                            setDigestType("weekly");
                            setShowDropdown(false);
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-white/10 transition-colors ${
                            digestType === "weekly"
                              ? "text-white"
                              : "text-white/70"
                          }`}
                        >
                          Weekly
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-white border border-gradient-primary rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Recycle size={20} />
                  {isGenerating ? "Gathering..." : "Gather All Data"}
                </button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isGenerating && (
            <div className="bg-black/20 backdrop-blur-xl rounded-lg p-8 sm:p-12">
              <LoadingSpinner
                size="lg"
                text="Generating digests for all clients..."
              />
            </div>
          )}

          {/* Results */}
          {showResults && !isGenerating && (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                <StatsCard
                  title="Total Clients"
                  value={digests.length}
                  icon={<BarChart3 className="w-6 h-6" />}
                  color="blue"
                />
                <StatsCard
                  title="New Requests"
                  value={digests.reduce((sum, d) => sum + d.newRequests, 0)}
                  icon={<Package className="w-6 h-6" />}
                  color="green"
                />
                <StatsCard
                  title="Shipped"
                  value={digests.reduce((sum, d) => sum + d.shipped, 0)}
                  icon={<CheckCircle className="w-6 h-6" />}
                  color="purple"
                />
                <StatsCard
                  title="Needs Attention"
                  value={needsAttentionCount}
                  icon={<AlertTriangle className="w-6 h-6" />}
                  color="red"
                />
              </div>

              {/* Attention Alert */}
              {needsAttentionCount > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 mr-3 shrink-0" />
                    <div>
                      <h3 className="text-sm font-medium text-red-300">
                        Attention Required
                      </h3>
                      <p className="mt-1 text-sm text-red-200">
                        {needsAttentionCount} client
                        {needsAttentionCount > 1 ? "s" : ""} need
                        {needsAttentionCount === 1 ? "s" : ""} immediate
                        attention due to blocked requests or unusual activity.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Digests Table */}
              <div className="bg-light-black border border-primary-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/10">
                    <thead className="bg-black/30">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                          Client
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-center text-xs font-medium text-white/70 uppercase tracking-wider">
                          New
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-center text-xs font-medium text-white/70 uppercase tracking-wider hidden sm:table-cell">
                          Progressed
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-center text-xs font-medium text-white/70 uppercase tracking-wider">
                          Shipped
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-center text-xs font-medium text-white/70 uppercase tracking-wider hidden md:table-cell">
                          Blocked
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-center text-xs font-medium text-white/70 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {digests.map((digest, index) => (
                        <tr
                          key={index}
                          className={
                            digest.needsAttention
                              ? "bg-red-500/10 hover:bg-red-500/20"
                              : "hover:bg-white/5"
                          }
                        >
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {digest.needsAttention && (
                                <AlertTriangle className="w-4 h-4 text-red-400 mr-2 shrink-0" />
                              )}
                              <span className="text-sm text-white">
                                {digest.clientName}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-sm text-white">
                              {digest.newRequests}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center hidden sm:table-cell">
                            <span className="text-sm text-white">
                              {digest.progressed}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-sm text-green-400 font-medium">
                              {digest.shipped}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center hidden md:table-cell">
                            <span
                              className={`text-sm font-medium ${
                                digest.blocked > 0
                                  ? "text-red-400"
                                  : "text-white/40"
                              }`}
                            >
                              {digest.blocked}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center">
                            {digest.needsAttention ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">
                                Needs Attention
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                                On Track
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Empty State */}
          {!showResults && !isGenerating && (
            <div className="bg-black/20 backdrop-blur-xl rounded-lg p-8 sm:p-12 text-center">
              <BarChart3 className="w-12 h-12 sm:w-16 sm:h-16 text-white/30 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-white mb-2">
                No Digests Generated Yet
              </h3>
              <p className="text-sm sm:text-base text-white/70 mb-6">
                Click &quot;Gather All Data&quot; to create reports for all
                clients
              </p>
            </div>
          )}
        </div>
      </AdminLayout>
    </AdminRoute>
  );
}
