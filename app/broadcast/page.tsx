"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import LoadingSpinner from "@/components/LoadingSpinner";
import StatsCard from "@/components/StatsCard";
import ConfirmModal from "@/components/ConfirmModal";
import { AdminRoute } from "@/components/ProtectedRoute";
import { telegramAPI, slackAPI } from "@/lib/api";
import { Client } from "@/lib/types";
import {
  Send,
  Users,
  CheckCircle,
  XCircle,
  RotateCcw,
  UserCheck,
  AtSign,
  MessageSquare,
  Plus,
  X,
  Tag,
} from "lucide-react";

type BroadcastType = "telegram" | "slack";

interface SlackMember {
  id: string;
  name: string;
  realName: string;
  email: string;
  isBot: boolean;
}

interface CustomSlug {
  key: string;
  label: string;
}

const BUILTIN_SLUGS: CustomSlug[] = [
  { key: "clientName", label: "Client Name" },
  { key: "date", label: "Today's Date" },
];

export default function BroadcastPage() {
  const [broadcastType, setBroadcastType] = useState<BroadcastType>("telegram");

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmSend, setConfirmSend] = useState<{
    isOpen: boolean;
    message: string;
  }>({
    isOpen: false,
    message: "",
  });
  const [broadcastMode, setBroadcastMode] = useState<"individual" | "segment">(
    "individual",
  );
  const [selectedSegment, setSelectedSegment] = useState<string>("");
  const [results, setResults] = useState<{
    sent: number;
    failed: number;
    errors: string[];
  } | null>(null); // errors normalised from details

  const [segments, setSegments] = useState<string[]>([]);
  const [segmentsLoading, setSegmentsLoading] = useState(false);
  const [segmentClients, setSegmentClients] = useState<Client[]>([]);
  const [segmentClientsLoading, setSegmentClientsLoading] = useState(false);
  const [selectedSegmentClients, setSelectedSegmentClients] = useState<
    string[]
  >([]);

  const [slackMembers, setSlackMembers] = useState<
    Record<string, SlackMember[]>
  >({});
  const [fetchingMembers, setFetchingMembers] = useState<
    Record<string, boolean>
  >({});

  const [showSlugDropdown, setShowSlugDropdown] = useState(false);
  const [slugSearchQuery, setSlugSearchQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [slugStartPos, setSlugStartPos] = useState(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Custom slugs panel
  const [showSlugPanel, setShowSlugPanel] = useState(false);
  const [customSlugs, setCustomSlugs] = useState<CustomSlug[]>([]);
  const [newSlugKey, setNewSlugKey] = useState("");
  const [newSlugLabel, setNewSlugLabel] = useState("");

  // ── Segments: both Telegram and Slack now use category field ─────────────────
  const loadSegments = useCallback(async () => {
    setSegmentsLoading(true);
    try {
      const res = await telegramAPI.segment();
      if (Array.isArray(res)) {
        setSegments(res);
      } else if (res?.success && Array.isArray(res?.message)) {
        setSegments(res.message);
      } else {
        setSegments([]);
      }
    } catch {
      setSegments([]);
    } finally {
      setSegmentsLoading(false);
    }
  }, []);

  const fetchSegmentClients = useCallback(
    async (segment: string) => {
      setSegmentClientsLoading(true);
      setSegmentClients([]);
      setSelectedSegmentClients([]);
      try {
        const res = await telegramAPI.getSegmentClients(segment);
        if (res?.success && Array.isArray(res.clients)) {
          if (broadcastType === "telegram") {
            const clientList = res.clients as Client[];
            setSegmentClients(clientList);
            setSelectedSegmentClients(
              clientList.filter((c) => c.hasTelegramLinked).map((c) => c.id),
            );
          } else {
            const slackLinked = await slackAPI
              .linkedClients()
              .catch(() => ({ success: false, clients: [] }));
            const slackLinkedIds = new Set(
              slackLinked.success && Array.isArray(slackLinked.clients)
                ? slackLinked.clients.map((c: Client) => c.id)
                : [],
            );
            const clientList = (res.clients as Client[]).map((c) => ({
              ...c,
              hasSlackLinked: slackLinkedIds.has(c.id),
            }));
            setSegmentClients(clientList);
            setSelectedSegmentClients(
              clientList.filter((c) => c.hasSlackLinked).map((c) => c.id),
            );
          }
        }
      } catch {
        setSegmentClients([]);
      } finally {
        setSegmentClientsLoading(false);
      }
    },
    [broadcastType],
  );

  const loadClients = useCallback(async () => {
    setIsLoading(true);
    try {
      if (broadcastType === "telegram") {
        const [linked, unlinked] = await Promise.all([
          telegramAPI.linkedClients(),
          telegramAPI.unlinkedClients(),
        ]);
        const linkedClients: Client[] = Array.isArray(linked.clients)
          ? linked.clients.map(
              (c) => ({ ...c, hasTelegramLinked: true }) as Client,
            )
          : [];
        const unlinkedClients: Client[] = Array.isArray(unlinked.clients)
          ? unlinked.clients.map(
              (c) => ({ ...c, hasTelegramLinked: false }) as Client,
            )
          : [];
        const all = [...linkedClients, ...unlinkedClients].sort((a, b) =>
          a.name.localeCompare(b.name),
        );
        setClients(all);
      } else {
        const [tgLinked, tgUnlinked, slackLinkedRes] = await Promise.all([
          telegramAPI.linkedClients(),
          telegramAPI.unlinkedClients(),
          slackAPI
            .linkedClients()
            .catch(() => ({ success: false, clients: [] })),
        ]);
        const slackLinkedIds = new Set(
          slackLinkedRes.success && Array.isArray(slackLinkedRes.clients)
            ? slackLinkedRes.clients.map((c: Client) => c.id)
            : [],
        );
        const allClients: Client[] = [
          ...(Array.isArray(tgLinked.clients) ? tgLinked.clients : []),
          ...(Array.isArray(tgUnlinked.clients) ? tgUnlinked.clients : []),
        ]
          .map(
            (c) =>
              ({ ...c, hasSlackLinked: slackLinkedIds.has(c.id) }) as Client,
          )
          .sort((a, b) => a.name.localeCompare(b.name));
        setClients(allClients);
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [broadcastType]);

  const fetchMembersForClient = useCallback(
    async (clientId: string) => {
      if (slackMembers[clientId] || fetchingMembers[clientId]) return;
      setFetchingMembers((prev) => ({ ...prev, [clientId]: true }));
      try {
        const result = await slackAPI.getClientMembers(clientId);
        if (result.success && result.members) {
          setSlackMembers((prev) => ({
            ...prev,
            [clientId]: result.members as SlackMember[],
          }));
        }
      } catch {
        // silent
      } finally {
        setFetchingMembers((prev) => ({ ...prev, [clientId]: false }));
      }
    },
    [slackMembers, fetchingMembers],
  );

  useEffect(() => {
    loadClients();
    if (broadcastMode === "segment") loadSegments();
    setSelectedClients([]);
    setSelectedSegment("");
    setSelectedSegmentClients([]);
    setMessage("");
    setResults(null);
    setError("");
    setSlackMembers({});
    setFetchingMembers({});
  }, [broadcastType, broadcastMode, loadClients, loadSegments]);

  useEffect(() => {
    if (broadcastMode === "segment") loadSegments();
  }, [broadcastMode, loadSegments]);

  useEffect(() => {
    if (!selectedSegment) {
      setSegmentClients([]);
      setSelectedSegmentClients([]);
      return;
    }
    fetchSegmentClients(selectedSegment);
  }, [selectedSegment, fetchSegmentClients]);

  useEffect(() => {
    if (broadcastType !== "slack" || broadcastMode !== "segment") return;
    selectedSegmentClients.forEach((id) => fetchMembersForClient(id));
  }, [
    broadcastType,
    broadcastMode,
    selectedSegmentClients,
    fetchMembersForClient,
  ]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMessage = e.target.value;
    const newCursorPos = e.target.selectionStart || 0;
    setMessage(newMessage);
    setCursorPosition(newCursorPos);

    if (broadcastType !== "slack") return;

    const textBeforeCursor = newMessage.substring(0, newCursorPos);
    const lastBraceIndex = textBeforeCursor.lastIndexOf("{");

    if (lastBraceIndex !== -1) {
      const textAfterBrace = textBeforeCursor.substring(lastBraceIndex + 1);
      if (!textAfterBrace.includes("}") && !textAfterBrace.includes(" ")) {
        setSlugStartPos(lastBraceIndex);
        setSlugSearchQuery(textAfterBrace);
        setShowSlugDropdown(true);
        return;
      }
    }
    setShowSlugDropdown(false);
  };

  const insertSlug = (key: string) => {
    if (slugStartPos === -1) return;
    const beforeSlug = message.substring(0, slugStartPos);
    const afterCursor = message.substring(cursorPosition);
    const newMessage = `${beforeSlug}{${key}}${afterCursor}`;
    setMessage(newMessage);
    setShowSlugDropdown(false);
    setSlugStartPos(-1);
    setTimeout(() => {
      if (textareaRef.current) {
        const pos = slugStartPos + key.length + 2;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(pos, pos);
      }
    }, 0);
  };

  const getAllSlugs = (): Array<{
    key: string;
    label: string;
    type: "builtin" | "member" | "custom";
  }> => {
    const slugs: Array<{
      key: string;
      label: string;
      type: "builtin" | "member" | "custom";
    }> = [...BUILTIN_SLUGS.map((s) => ({ ...s, type: "builtin" as const }))];

    const clientsToCheck =
      broadcastMode === "individual" ? selectedClients : selectedSegmentClients;
    const seenIds = new Set<string>();
    clientsToCheck.forEach((clientId) => {
      (slackMembers[clientId] || []).forEach((member) => {
        if (!seenIds.has(member.id)) {
          seenIds.add(member.id);
          slugs.push({
            key: member.name,
            label: `${member.realName} (${member.email})`,
            type: "member",
          });
        }
      });
    });

    customSlugs.forEach((s) => slugs.push({ ...s, type: "custom" }));

    if (!slugSearchQuery) return slugs.slice(0, 12);
    const q = slugSearchQuery.toLowerCase();
    return slugs
      .filter(
        (s) =>
          s.key.toLowerCase().includes(q) || s.label.toLowerCase().includes(q),
      )
      .slice(0, 12);
  };

  const toggleClient = (clientId: string, isLinked: boolean) => {
    if (!isLinked) return; // can't select unlinked
    const isSelecting = !selectedClients.includes(clientId);
    setSelectedClients((prev) =>
      prev.includes(clientId)
        ? prev.filter((id) => id !== clientId)
        : [...prev, clientId],
    );
    if (isSelecting && broadcastType === "slack")
      fetchMembersForClient(clientId);
  };

  const toggleSegmentClient = (clientId: string) => {
    const isSelecting = !selectedSegmentClients.includes(clientId);
    setSelectedSegmentClients((prev) =>
      prev.includes(clientId)
        ? prev.filter((id) => id !== clientId)
        : [...prev, clientId],
    );
    if (isSelecting && broadcastType === "slack")
      fetchMembersForClient(clientId);
  };

  const selectAllClients = () => {
    const linked = clients
      .filter((c) =>
        broadcastType === "telegram" ? c.hasTelegramLinked : true,
      )
      .map((c) => c.id);
    setSelectedClients(linked);
    if (broadcastType === "slack")
      linked.forEach((id) => fetchMembersForClient(id));
  };

  const selectAllSegmentClients = () => {
    const linked = segmentClients
      .filter((c) =>
        broadcastType === "telegram" ? c.hasTelegramLinked : c.hasSlackLinked,
      )
      .map((c) => c.id);
    setSelectedSegmentClients(linked);
    if (broadcastType === "slack")
      linked.forEach((id) => fetchMembersForClient(id));
  };

  const addCustomSlug = () => {
    const key = newSlugKey.trim().replace(/\s+/g, "_");
    const label = newSlugLabel.trim() || key;
    if (!key) return;
    if (customSlugs.find((s) => s.key === key)) return; // no duplicates
    setCustomSlugs((prev) => [...prev, { key, label }]);
    setNewSlugKey("");
    setNewSlugLabel("");
  };

  const removeCustomSlug = (key: string) => {
    setCustomSlugs((prev) => prev.filter((s) => s.key !== key));
  };

  // ── Send handlers ─────────────────────────────────────────────────────────────
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (broadcastMode === "individual" && selectedClients.length === 0) {
      setError("Please select at least one client");
      return;
    }
    if (broadcastMode === "segment") {
      if (!selectedSegment) {
        setError("Please select a segment");
        return;
      }
      if (selectedSegmentClients.length === 0) {
        setError("Please select at least one client from the segment");
        return;
      }
    }
    if (!message.trim()) {
      setError("Please enter a message");
      return;
    }
    const count =
      broadcastMode === "individual"
        ? selectedClients.length
        : selectedSegmentClients.length;
    const confirmMsg =
      broadcastMode === "individual"
        ? `Send to ${count} client(s)?`
        : `Send to ${count} client(s) in "${selectedSegment}"?`;
    setConfirmSend({ isOpen: true, message: confirmMsg });
  };

  const confirmSendBroadcast = async () => {
    setIsSending(true);
    setResults(null);
    setError("");
    try {
      const clientIds =
        broadcastMode === "individual"
          ? selectedClients
          : selectedSegmentClients;
      let result;
      if (broadcastType === "telegram") {
        result = await telegramAPI.broadcast({ clientIds, message });
      } else {
        result = await slackAPI.broadcast({ clientIds, message });
      }
      if (result.success && result.results) {
        const raw = result.results as {
          sent: number;
          failed: number;
          errors?: string[];
          details?: Array<{
            clientId: string;
            clientName?: string;
            success: boolean;
            error?: string;
          }>;
        };
        const errors: string[] =
          raw.errors ??
          (raw.details ?? [])
            .filter((d) => !d.success)
            .map(
              (d) => `${d.clientName ?? d.clientId}: ${d.error ?? "failed"}`,
            );
        setResults({ sent: raw.sent, failed: raw.failed, errors });
        setMessage("");
        setSelectedClients([]);
        setSelectedSegmentClients([]);
        setSelectedSegment("");
      } else {
        setError(
          "Failed to send broadcast: " + (result.error || "Unknown error"),
        );
      }
    } catch (err) {
      setError(
        "Failed to send broadcast: " +
          ((err as Error).message || "Unknown error"),
      );
    } finally {
      setIsSending(false);
    }
  };

  const canSend =
    !isSending &&
    message.trim().length > 0 &&
    (broadcastMode === "individual"
      ? selectedClients.length > 0
      : selectedSegmentClients.length > 0);

  const isClientLinked = (client: Client) =>
    broadcastType === "telegram"
      ? !!client.hasTelegramLinked
      : !!client.hasSlackLinked;

  const linkedCount = clients.filter(isClientLinked).length;

  if (isLoading) {
    return (
      <AdminRoute>
        <AdminLayout>
          <div className="flex items-center justify-center h-96">
            <LoadingSpinner size="lg" text="Loading clients..." />
          </div>
        </AdminLayout>
      </AdminRoute>
    );
  }

  const allSlugs = getAllSlugs();

  return (
    <AdminRoute>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-light mb-2 text-white">
                {broadcastType === "telegram" ? "Telegram" : "Slack"} Broadcast
              </h1>
              <p className="mt-1 text-sm text-white/70">
                Send messages to multiple clients at once
              </p>
            </div>
            <button
              onClick={() => {
                loadClients();
                loadSegments();
              }}
              className="flex items-center gap-2 px-4 sm:px-6 py-2.5 bg-black/10 hover:bg-white/20 border border-gradient-primary text-white rounded-lg transition-all shadow-lg"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-sm">Refresh</span>
            </button>
          </div>

          {/* Broadcast Type Selector */}
          <div className="flex items-center gap-3 p-1 bg-black/20 rounded-lg border border-primary-border w-fit">
            <button
              onClick={() => setBroadcastType("telegram")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-all ${
                broadcastType === "telegram"
                  ? "bg-light-black border border-gradient-primary text-white shadow-lg"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Telegram</span>
            </button>
            <button
              onClick={() => setBroadcastType("slack")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-all ${
                broadcastType === "slack"
                  ? "bg-light-black border border-gradient-primary text-white shadow-lg"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <AtSign className="w-4 h-4" />
              <span>Slack</span>
            </button>
          </div>

          {/* Mode Selector */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBroadcastMode("individual")}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                broadcastMode === "individual"
                  ? "border border-gradient-primary text-white"
                  : "bg-black-light text-white hover:bg-white/20 border-2 border-primary-border"
              }`}
            >
              Individual Clients
            </button>
            <button
              onClick={() => setBroadcastMode("segment")}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                broadcastMode === "segment"
                  ? "border border-gradient-primary text-white"
                  : "bg-black-light text-white hover:bg-white/20 border-2 border-primary-border"
              }`}
            >
              Segment Broadcast
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <StatsCard
              title="Total Clients"
              value={
                broadcastMode === "individual"
                  ? linkedCount
                  : segmentClients.filter(isClientLinked).length
              }
              icon={<Users className="w-6 h-6" />}
              color="blue"
            />
            <StatsCard
              title="Selected"
              value={
                broadcastMode === "individual"
                  ? selectedClients.length
                  : selectedSegmentClients.length
              }
              icon={<UserCheck className="w-6 h-6" />}
              color="green"
            />
            {results && (
              <>
                <StatsCard
                  title="Successfully Sent"
                  value={results.sent}
                  icon={<CheckCircle className="w-6 h-6" />}
                  color="green"
                />
                <StatsCard
                  title="Failed"
                  value={results.failed}
                  icon={<XCircle className="w-6 h-6" />}
                  color="red"
                />
              </>
            )}
          </div>

          {/* Error Details */}
          {results && results.errors.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-red-300 mb-2 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Broadcast Errors:
              </h3>
              <ul className="space-y-1">
                {results.errors.slice(0, 10).map((err, idx) => (
                  <li key={idx} className="text-xs text-red-200 font-mono">
                    • {err}
                  </li>
                ))}
                {results.errors.length > 10 && (
                  <li className="text-xs text-red-200/70 mt-2 italic">
                    ... and {results.errors.length - 10} more errors
                  </li>
                )}
              </ul>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ── Left panel ── */}
            {broadcastMode === "individual" ? (
              <div className="bg-light-black border border-primary-border rounded-lg">
                <div className="px-4 sm:px-6 py-4 border-b border-white/10 flex items-center justify-between">
                  <h2 className="text-base sm:text-lg font-medium text-white">
                    Clients
                    <span className="ml-2 text-sm text-white/40 font-normal">
                      ({linkedCount} linked)
                    </span>
                  </h2>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={selectAllClients}
                      className="text-sm text-white hover:text-white/80"
                    >
                      Select all
                    </button>
                    <span className="text-white/30">|</span>
                    <button
                      onClick={() => setSelectedClients([])}
                      className="text-sm text-white/70 hover:text-white"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="divide-y divide-white/10 max-h-96 overflow-y-auto">
                  {clients.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                      <Users className="w-12 h-12 mx-auto mb-4 text-white/50" />
                      <p className="text-white/70">No clients found</p>
                    </div>
                  ) : (
                    clients.map((client) => {
                      const linked = isClientLinked(client);
                      const selected = selectedClients.includes(client.id);
                      return (
                        <div
                          key={client.id}
                          className={`px-4 sm:px-6 py-4 flex items-center gap-3 transition-colors ${
                            linked
                              ? "hover:bg-white/5 cursor-pointer"
                              : "opacity-40 cursor-not-allowed"
                          }`}
                          onClick={() => toggleClient(client.id, linked)}
                        >
                          <div
                            className={`w-5 h-5 rounded border-2 shrink-0 transition-all ${
                              selected && linked
                                ? "bg-black border-gradient-primary"
                                : "border-gradient-primary bg-light-black"
                            }`}
                          >
                            {selected && linked && (
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
                          <p className="text-sm font-medium text-white flex-1">
                            {client.name}
                          </p>
                          {/* Linked status tag */}
                          {!linked && (
                            <span className="text-xs text-white/40 shrink-0">
                              No{" "}
                              {broadcastType === "telegram"
                                ? "Telegram"
                                : "Slack"}
                            </span>
                          )}
                          {/* Slack member count */}
                          {broadcastType === "slack" && selected && (
                            <span className="text-xs text-white/40 shrink-0">
                              {fetchingMembers[client.id] ? (
                                <span className="flex items-center gap-1">
                                  <div className="w-3 h-3 border border-white/30 border-t-transparent rounded-full animate-spin" />
                                  fetching…
                                </span>
                              ) : slackMembers[client.id] ? (
                                `${slackMembers[client.id].length} members`
                              ) : null}
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Segment picker */}
                <div className="bg-light-black border border-primary-border rounded-lg p-4">
                  <h2 className="text-base font-medium text-white mb-3">
                    Select Segment
                  </h2>
                  <div className="space-y-2">
                    {segmentsLoading ? (
                      <p className="text-white/60 text-sm">
                        Loading segments...
                      </p>
                    ) : segments.length === 0 ? (
                      <p className="text-white/60 text-sm">No segments found</p>
                    ) : (
                      segments.map((segment) => (
                        <button
                          key={segment}
                          onClick={() => setSelectedSegment(segment)}
                          className={`w-full px-4 py-2.5 rounded-lg text-left transition-all text-sm ${
                            selectedSegment === segment
                              ? "bg-white/10 border border-gradient-primary text-white"
                              : "bg-black/20 text-white/70 hover:bg-white/10 border border-primary-border"
                          }`}
                        >
                          {segment}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Clients in selected segment */}
                {selectedSegment && (
                  <div className="bg-light-black border border-primary-border rounded-lg">
                    <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-white">
                          Clients in &quot;{selectedSegment}&quot;
                        </h3>
                        <p className="text-xs text-white/50 mt-0.5">
                          {selectedSegmentClients.length} of{" "}
                          {segmentClients.filter(isClientLinked).length} linked
                          selected
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={selectAllSegmentClients}
                          className="text-sm text-white hover:text-white/80"
                        >
                          Select all
                        </button>
                        <span className="text-white/30">|</span>
                        <button
                          onClick={() => setSelectedSegmentClients([])}
                          className="text-sm text-white/70 hover:text-white"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    <div className="divide-y divide-white/10 max-h-64 overflow-y-auto">
                      {segmentClientsLoading ? (
                        <div className="px-6 py-8 text-center">
                          <LoadingSpinner size="sm" text="Loading clients..." />
                        </div>
                      ) : segmentClients.length === 0 ? (
                        <div className="px-6 py-8 text-center text-white/50 text-sm">
                          No clients in this segment
                        </div>
                      ) : (
                        segmentClients.map((client) => {
                          const linked = isClientLinked(client);
                          const selected = selectedSegmentClients.includes(
                            client.id,
                          );
                          return (
                            <div
                              key={client.id}
                              onClick={() =>
                                linked && toggleSegmentClient(client.id)
                              }
                              className={`px-4 py-3 flex items-center gap-3 transition-colors ${
                                linked
                                  ? "hover:bg-white/5 cursor-pointer"
                                  : "opacity-40 cursor-not-allowed"
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded border-2 shrink-0 transition-all ${
                                  selected && linked
                                    ? "bg-black border-gradient-primary"
                                    : "border-primary-border bg-light-black"
                                }`}
                              >
                                {selected && linked && (
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
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                  {client.name}
                                </p>
                              </div>
                              {broadcastType === "slack" && selected && (
                                <span className="text-xs text-white/40 shrink-0">
                                  {fetchingMembers[client.id] ? (
                                    <div className="w-3 h-3 border border-white/30 border-t-transparent rounded-full animate-spin" />
                                  ) : slackMembers[client.id] ? (
                                    `${slackMembers[client.id].length} members`
                                  ) : null}
                                </span>
                              )}
                              {!linked && (
                                <span className="text-xs text-white/40 shrink-0">
                                  No{" "}
                                  {broadcastType === "telegram"
                                    ? "Telegram"
                                    : "Slack"}
                                </span>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Message Composer ── */}
            <div className="rounded-lg flex flex-col gap-3">
              {/* Custom Slug Panel — Slack only */}
              {broadcastType === "slack" && (
                <div className="bg-light-black border border-primary-border rounded-lg">
                  <button
                    type="button"
                    onClick={() => setShowSlugPanel((v) => !v)}
                    className="w-full px-4 py-3 flex items-center justify-between text-sm text-white/70 hover:text-white transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Custom Slugs
                      {customSlugs.length > 0 && (
                        <span className="bg-white/10 text-white/60 text-xs px-1.5 py-0.5 rounded-full">
                          {customSlugs.length}
                        </span>
                      )}
                    </span>
                    <span className="text-white/40 text-xs">
                      {showSlugPanel ? "▲" : "▼"}
                    </span>
                  </button>

                  {showSlugPanel && (
                    <div className="px-4 pb-4 border-t border-white/10 space-y-3">
                      {/* Built-in slugs */}
                      <div className="pt-3">
                        <p className="text-xs text-white/40 mb-2">Built-in</p>
                        <div className="flex flex-wrap gap-2">
                          {BUILTIN_SLUGS.map((s) => (
                            <button
                              key={s.key}
                              type="button"
                              onClick={() => {
                                const pos =
                                  textareaRef.current?.selectionStart ??
                                  message.length;
                                const before = message.substring(0, pos);
                                const after = message.substring(pos);
                                setMessage(`${before}{${s.key}}${after}`);
                                setTimeout(() => {
                                  textareaRef.current?.focus();
                                  const newPos = pos + s.key.length + 2;
                                  textareaRef.current?.setSelectionRange(
                                    newPos,
                                    newPos,
                                  );
                                }, 0);
                              }}
                              className="flex items-center gap-1 px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-xs text-white/70 hover:text-white transition-colors font-mono"
                            >
                              {`{${s.key}}`}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Custom slugs list */}
                      {customSlugs.length > 0 && (
                        <div>
                          <p className="text-xs text-white/40 mb-2">Custom</p>
                          <div className="flex flex-wrap gap-2">
                            {customSlugs.map((s) => (
                              <div
                                key={s.key}
                                className="flex items-center gap-1 bg-white/5 border border-white/10 rounded px-2 py-1"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    const pos =
                                      textareaRef.current?.selectionStart ??
                                      message.length;
                                    const before = message.substring(0, pos);
                                    const after = message.substring(pos);
                                    setMessage(`${before}{${s.key}}${after}`);
                                    setTimeout(() => {
                                      textareaRef.current?.focus();
                                      const newPos = pos + s.key.length + 2;
                                      textareaRef.current?.setSelectionRange(
                                        newPos,
                                        newPos,
                                      );
                                    }, 0);
                                  }}
                                  className="text-xs text-white/70 hover:text-white font-mono transition-colors"
                                >
                                  {`{${s.key}}`}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeCustomSlug(s.key)}
                                  className="text-white/30 hover:text-red-400 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Add new slug */}
                      <div className="flex gap-2 pt-1">
                        <input
                          type="text"
                          value={newSlugKey}
                          onChange={(e) => setNewSlugKey(e.target.value)}
                          placeholder="slug_key"
                          className="flex-1 px-3 py-1.5 bg-black/30 text-white text-xs rounded border border-white/10 focus:outline-none focus:border-white/30 font-mono placeholder-white/30"
                        />
                        <input
                          type="text"
                          value={newSlugLabel}
                          onChange={(e) => setNewSlugLabel(e.target.value)}
                          placeholder="Display label (optional)"
                          className="flex-1 px-3 py-1.5 bg-black/30 text-white text-xs rounded border border-white/10 focus:outline-none focus:border-white/30 placeholder-white/30"
                        />
                        <button
                          type="button"
                          onClick={addCustomSlug}
                          disabled={!newSlugKey.trim()}
                          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed rounded text-white transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSend} className="flex flex-col gap-3">
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={handleMessageChange}
                    rows={12}
                    placeholder={
                      broadcastType === "slack"
                        ? "Type your message... Use { to insert member mentions or slugs"
                        : "Type your message..."
                    }
                    className="w-full px-5 py-4 bg-light-black text-primary-text rounded-lg border border-primary-border focus:outline-none focus:ring-1 focus:ring-primary-border transition-all resize-none"
                  />

                  {/* Slug dropdown — triggered by "{" */}
                  {showSlugDropdown && broadcastType === "slack" && (
                    <div className="absolute left-5 right-5 bottom-full mb-2 bg-light-black border border-primary-border rounded-lg shadow-2xl max-h-52 overflow-y-auto z-50">
                      {allSlugs.length === 0 ? (
                        <div className="px-4 py-3 text-white/50 text-sm">
                          {(broadcastMode === "individual"
                            ? selectedClients
                            : selectedSegmentClients
                          ).length === 0
                            ? "Select clients first to use member slugs"
                            : "No slugs found"}
                        </div>
                      ) : (
                        allSlugs.map((slug) => (
                          <button
                            key={slug.key}
                            type="button"
                            onClick={() => insertSlug(slug.key)}
                            className="w-full px-4 py-2.5 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`text-xs px-1.5 py-0.5 rounded shrink-0 font-mono ${
                                  slug.type === "member"
                                    ? "bg-blue-500/20 text-blue-300"
                                    : slug.type === "custom"
                                      ? "bg-orange-500/20 text-orange-300"
                                      : "bg-white/10 text-white/50"
                                }`}
                              >
                                {slug.type === "member"
                                  ? "@"
                                  : slug.type === "custom"
                                    ? "✦"
                                    : "#"}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate font-mono">
                                  {`{${slug.key}}`}
                                </p>
                                <p className="text-xs text-white/50 truncate">
                                  {slug.label}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Hint */}
                {broadcastType === "slack" &&
                  (broadcastMode === "individual"
                    ? selectedClients.length > 0
                    : selectedSegmentClients.length > 0) && (
                    <div className="flex items-center gap-2 text-xs text-white/50">
                      <span className="font-mono text-white/40">{`{}`}</span>
                      <span>
                        Type {"{"} to insert a slug — members, built-ins, or
                        custom
                      </span>
                    </div>
                  )}

                <button
                  type="submit"
                  disabled={!canSend}
                  className="w-full px-6 py-3 rounded-lg border border-gradient-primary cursor-pointer font-medium hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  {isSending ? (
                    <>
                      <div className="w-5 h-5 border-2 border-gradient-primary border-t-transparent rounded-full animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>
                        {broadcastMode === "segment"
                          ? `Send to ${selectedSegmentClients.length} Client${selectedSegmentClients.length !== 1 ? "s" : ""}`
                          : `Send to ${selectedClients.length} Client${selectedClients.length !== 1 ? "s" : ""}`}
                      </span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        <ConfirmModal
          isOpen={confirmSend.isOpen}
          onClose={() => setConfirmSend({ isOpen: false, message: "" })}
          onConfirm={confirmSendBroadcast}
          title="Confirm Broadcast"
          message={confirmSend.message}
          confirmText="Send"
          cancelText="Cancel"
          variant="info"
        />
      </AdminLayout>
    </AdminRoute>
  );
}
