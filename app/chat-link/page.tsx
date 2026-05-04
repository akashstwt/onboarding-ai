"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import AdminLayout from "@/components/AdminLayout";
import LoadingSpinner from "@/components/LoadingSpinner";
import Modal from "@/components/Modal";
import ConfirmModal from "@/components/ConfirmModal";
import StatsCard from "@/components/StatsCard";
import { AdminRoute } from "@/components/ProtectedRoute";
import { telegramAPI, slackApi } from "@/lib/api";
import { TelegramChat, SlackChannel, Client } from "@/lib/types";
import {
  Link as LinkIcon,
  Unlink,
  RefreshCw,
  CheckCircle,
  Users,
  MessageSquare,
  ChevronDown,
  Pencil,
  Hash,
  MoreVertical,
} from "lucide-react";

export default function ChatLinkingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [confirmUnlinkTg, setConfirmUnlinkTg] = useState<{
    isOpen: boolean;
    clientId: string | null;
    clientName: string | null;
  }>({ isOpen: false, clientId: null, clientName: null });
  const [confirmUnlinkSlack, setConfirmUnlinkSlack] = useState<{
    isOpen: boolean;
    clientId: string | null;
    clientName: string | null;
    channelType: string | null;
  }>({ isOpen: false, clientId: null, clientName: null, channelType: null });

  const [allChats, setAllChats] = useState<TelegramChat[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [showTgModal, setShowTgModal] = useState(false);
  const [isLinkingTg, setIsLinkingTg] = useState(false);
  const [editingTgClient, setEditingTgClient] = useState<Client | null>(null);
  const [tgForm, setTgForm] = useState({ clientId: "", chatId: "" });
  const [isTgClientDropdownOpen, setIsTgClientDropdownOpen] = useState(false);
  const [isTgChatDropdownOpen, setIsTgChatDropdownOpen] = useState(false);

  const [botChannels, setBotChannels] = useState<SlackChannel[]>([]);
  const [isRefreshingSlack, setIsRefreshingSlack] = useState(false);
  const [showSlackModal, setShowSlackModal] = useState(false);
  const [isLinkingSlack, setIsLinkingSlack] = useState(false);
  const [slackForm, setSlackForm] = useState({
    clientId: "",
    channelId: "",
    channelName: "",
    channelType: "" as "internal" | "external" | "",
  });
  const [isSlackClientDropdownOpen, setIsSlackClientDropdownOpen] =
    useState(false);
  const [isSlackChannelDropdownOpen, setIsSlackChannelDropdownOpen] =
    useState(false);

  const [openActionsMenu, setOpenActionsMenu] = useState<string | null>(null);
  const [menuCoords, setMenuCoords] = useState<{ top: number; right: number }>({
    top: 0,
    right: 0,
  });
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        telegramLinkedRes,
        telegramUnlinkedRes,
        chatsRes,
        slackLinkedRes,
        slackUnlinkedRes,
        botChannelsRes,
      ] = await Promise.all([
        telegramAPI.linkedClients(),
        telegramAPI.unlinkedClients(),
        telegramAPI
          .getAllDiscoveredChats()
          .catch(() => ({ success: false, chats: [] })),
        slackApi.linkedClients(),
        slackApi.unlinkedClients(),
        slackApi
          .getBotChannels()
          .catch(() => ({ success: false, channels: [] })),
      ]);

      const clientMap = new Map<string, Client>();
      const seed = (list: Client[] | undefined) =>
        list?.forEach((c) => {
          if (!clientMap.has(c.id))
            clientMap.set(c.id, { id: c.id, name: c.name, status: c.status });
        });

      seed(telegramUnlinkedRes.clients as Client[]);
      seed(telegramLinkedRes.clients as Client[]);
      seed(slackUnlinkedRes.clients as Client[]);
      seed(slackLinkedRes.clients as Client[]);

      (telegramLinkedRes.clients as Client[])?.forEach((c) => {
        const existing = clientMap.get(c.id)!;
        clientMap.set(c.id, { ...existing, telegramChatId: c.telegramChatId });
      });
      (slackLinkedRes.clients as Client[])?.forEach((c) => {
        const existing = clientMap.get(c.id)!;
        clientMap.set(c.id, {
          ...existing,
          slackChannels: c.slackChannels || [],
        });
      });

      setAllClients(
        Array.from(clientMap.values()).sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      );
      if (chatsRes.success && chatsRes.chats)
        setAllChats(chatsRes.chats as TelegramChat[]);
      if (botChannelsRes.success && botChannelsRes.channels)
        setBotChannels(botChannelsRes.channels as SlackChannel[]);
    } catch {
      setError("Failed to load data. Please refresh the page.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const closeActionsMenu = () => setOpenActionsMenu(null);

  const handleActionsButtonClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    clientId: string,
  ) => {
    e.stopPropagation();
    if (openActionsMenu === clientId) {
      closeActionsMenu();
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();

    setMenuCoords({
      top: rect.bottom + 4,
      right: window.innerWidth - rect.right,
    });
    setOpenActionsMenu(clientId);
  };

  const handleDiscoverChats = async () => {
    setIsDiscovering(true);
    try {
      const result = await telegramAPI.getAllDiscoveredChats();
      if (result.success && result.chats)
        setAllChats(result.chats as TelegramChat[]);
      else throw new Error("Failed");
    } catch {
      setError("Failed to discover chats. Make sure the bot is running.");
    } finally {
      setIsDiscovering(false);
    }
  };

  const openTgModal = (client?: Client) => {
    setEditingTgClient(client?.telegramChatId ? client : null);
    setTgForm({
      clientId: client?.id ?? "",
      chatId: client?.telegramChatId ?? "",
    });
    setShowTgModal(true);
  };

  const closeTgModal = () => {
    setShowTgModal(false);
    setEditingTgClient(null);
    setTgForm({ clientId: "", chatId: "" });
    setIsTgClientDropdownOpen(false);
    setIsTgChatDropdownOpen(false);
  };

  const handleLinkTg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tgForm.clientId || !tgForm.chatId) {
      setError("Please select both a client and a chat");
      return;
    }
    setIsLinkingTg(true);
    try {
      const result = await telegramAPI.linkChat({
        clientId: tgForm.clientId,
        chatId: tgForm.chatId,
      });
      if (!result.success)
        throw new Error(result.error || "Failed to link chat");
      closeTgModal();
      await loadAllData();
    } catch {
      setError("Failed to link chat.");
    } finally {
      setIsLinkingTg(false);
    }
  };

  const handleUnlinkTg = async () => {
    if (!confirmUnlinkTg.clientId) return;
    try {
      const result = await telegramAPI.unlinkChat(confirmUnlinkTg.clientId);
      if (!result.success) throw new Error("Failed");
      setConfirmUnlinkTg({ isOpen: false, clientId: null, clientName: null });
      await loadAllData();
    } catch {
      setError("Failed to unlink chat");
      setConfirmUnlinkTg({ isOpen: false, clientId: null, clientName: null });
    }
  };

  const handleRefreshSlack = async () => {
    setIsRefreshingSlack(true);
    try {
      const result = await slackApi.getBotChannels();
      if (result.success && result.channels)
        setBotChannels(result.channels as SlackChannel[]);
      else throw new Error("Failed");
    } catch {
      setError("Failed to refresh Slack channels.");
    } finally {
      setIsRefreshingSlack(false);
    }
  };

  const openSlackModal = (client?: Client) => {
    setSlackForm({
      clientId: client?.id ?? "",
      channelId: "",
      channelName: "",
      channelType: "",
    });
    setShowSlackModal(true);
  };

  const closeSlackModal = () => {
    setShowSlackModal(false);
    setSlackForm({
      clientId: "",
      channelId: "",
      channelName: "",
      channelType: "",
    });
    setIsSlackClientDropdownOpen(false);
    setIsSlackChannelDropdownOpen(false);
  };

  const handleLinkSlack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slackForm.clientId || !slackForm.channelId || !slackForm.channelType) {
      setError("Please select a client, channel, and type");
      return;
    }
    setIsLinkingSlack(true);
    try {
      const result = await slackApi.linkChannel({
        clientId: slackForm.clientId,
        channelId: slackForm.channelId,
        channelName: slackForm.channelName,
        channelType: slackForm.channelType,
      });
      if (!result.success) throw new Error("Failed");
      closeSlackModal();
      await loadAllData();
    } catch {
      setError("Failed to link Slack channel.");
    } finally {
      setIsLinkingSlack(false);
    }
  };

  const handleUnlinkSlack = async () => {
    if (!confirmUnlinkSlack.clientId || !confirmUnlinkSlack.channelType) return;
    try {
      const result = await slackApi.unlinkChannel(
        confirmUnlinkSlack.clientId,
        confirmUnlinkSlack.channelType,
      );
      if (!result.success) throw new Error("Failed");
      setConfirmUnlinkSlack({
        isOpen: false,
        clientId: null,
        clientName: null,
        channelType: null,
      });
      await loadAllData();
    } catch {
      setError("Failed to unlink Slack channel");
      setConfirmUnlinkSlack({
        isOpen: false,
        clientId: null,
        clientName: null,
        channelType: null,
      });
    }
  };

  const getChatForClient = (clientId: string) => {
    const c = allClients.find((c) => c.id === clientId);
    if (!c?.telegramChatId) return undefined;
    return allChats.find((ch) => ch.id === c.telegramChatId);
  };

  const tgLinkedCount = allClients.filter((c) => c.telegramChatId).length;
  const slackLinkedCount = allClients.filter(
    (c) => c.slackChannels && c.slackChannels.length > 0,
  ).length;
  const tgUnlinkedClients = allClients.filter((c) => !c.telegramChatId);
  const availableTgClients = editingTgClient
    ? [editingTgClient]
    : tgUnlinkedClients;
  const usedChatIds = new Set(
    allClients.filter((c) => c.telegramChatId).map((c) => c.telegramChatId!),
  );
  const availableTgChats = editingTgClient
    ? allChats
    : allChats.filter((ch) => !usedChatIds.has(ch.id));
  const selectedTgChat = allChats.find((ch) => ch.id === tgForm.chatId);
  const selectedTgClient = allClients.find((c) => c.id === tgForm.clientId);
  const selectedSlackClient = allClients.find(
    (c) => c.id === slackForm.clientId,
  );
  const selectedSlackChannel = botChannels.find(
    (ch) => ch.id === slackForm.channelId,
  );
  const openMenuClient = allClients.find((c) => c.id === openActionsMenu);

  const statusBadge = (status: string) =>
    status === "live"
      ? "bg-green-400/10 text-green-400 border border-green-400/20"
      : status === "active"
        ? "bg-blue-400/10 text-blue-400 border border-blue-400/20"
        : "bg-yellow-400/10 text-yellow-400 border border-yellow-400/20";

  if (isLoading) {
    return (
      <AdminRoute>
        <AdminLayout>
          <div className="flex items-center justify-center h-96">
            <LoadingSpinner size="lg" text="Loading..." />
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
                Chat Linking
              </h1>
              <p className="text-sm text-white/70">
                Connect Telegram groups and Slack channels to clients
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleDiscoverChats}
                disabled={isDiscovering}
                className="flex items-center gap-2 px-4 py-2 bg-black/10 hover:bg-white/10 border border-primary-border text-white rounded-lg transition-all text-sm disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isDiscovering ? "animate-spin" : ""}`}
                />
                Refresh Groups
              </button>
              <button
                onClick={handleRefreshSlack}
                disabled={isRefreshingSlack}
                className="flex items-center gap-2 px-4 py-2 bg-black/10 hover:bg-white/10 border border-primary-border text-white rounded-lg transition-all text-sm disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isRefreshingSlack ? "animate-spin" : ""}`}
                />
                Refresh Channels
              </button>
              <button
                onClick={() => openTgModal()}
                disabled={
                  tgUnlinkedClients.length === 0 || allChats.length === 0
                }
                className="flex items-center gap-2 px-4 py-2 bg-black/10 hover:bg-white/10 border border-primary-border text-white rounded-lg transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Link Telegram
              </button>
              <button
                onClick={() => openSlackModal()}
                disabled={botChannels.length === 0}
                className="flex items-center gap-2 px-4 py-2 border border-gradient-primary rounded-lg hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
              >
                <Hash className="w-3.5 h-3.5" />
                Link Slack
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <StatsCard
              title="Total Clients"
              value={allClients.length}
              icon={<Users className="w-5 h-5" />}
              color="purple"
            />
            <StatsCard
              title="TG Linked"
              value={tgLinkedCount}
              icon={<CheckCircle className="w-5 h-5" />}
              color="green"
            />
            <StatsCard
              title="Slack Linked"
              value={slackLinkedCount}
              icon={<CheckCircle className="w-5 h-5" />}
              color="blue"
            />
            <StatsCard
              title="Bot Channels"
              value={botChannels.length}
              icon={<Hash className="w-5 h-5" />}
              color="purple"
            />
          </div>

          <div
            ref={tableContainerRef}
            className="relative bg-light-black border border-primary-border rounded-lg overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10 table-fixed">
                <thead className="bg-black/30">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider w-36">
                      Client
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider w-28">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                        Telegram Group
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                      <div className="flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5 text-purple-400" />
                        Slack Channels
                      </div>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white/70 uppercase tracking-wider w-16">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {allClients.map((client) => {
                    const tgChat = getChatForClient(client.id);
                    return (
                      <tr
                        key={client.id}
                        className="h-14 hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-0 align-middle overflow-hidden">
                          <span className="text-sm font-medium text-white truncate block">
                            {client.name}
                          </span>
                        </td>
                        <td className="px-4 py-0 align-middle overflow-hidden">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge(client.status)}`}
                          >
                            {client.status}
                          </span>
                        </td>
                        <td className="px-4 py-0 align-middle overflow-hidden">
                          {client.telegramChatId ? (
                            <span className="text-sm text-white truncate block">
                              {tgChat?.title || "Unknown Group"}
                              {tgChat?.memberCount && (
                                <span className="text-xs text-white/40 ml-2">
                                  {tgChat.memberCount}m
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-xs text-white/30">—</span>
                          )}
                        </td>
                        {/* Slack */}

                        <td className="px-4 py-0 align-middle overflow-hidden">
                          {client.slackChannels &&
                          client.slackChannels.length > 0 ? (
                            <div className="flex items-center gap-3">
                              {client.slackChannels.map((ch) => (
                                <div
                                  key={ch.id}
                                  className="flex items-center gap-1.5 shrink-0"
                                >
                                  <span
                                    className={`w-2 h-2 rounded-full shrink-0 ${ch.type === "internal" ? "bg-blue-400" : "bg-orange-400"}`}
                                  />
                                  <code className="text-xs text-white/70">
                                    #{ch.name}
                                  </code>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-white/30">—</span>
                          )}
                        </td>
                        <td className="px-4 py-0 align-middle text-right overflow-hidden">
                          <button
                            onClick={(e) =>
                              handleActionsButtonClick(e, client.id)
                            }
                            className="inline-flex items-center justify-center w-8 h-8 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {openActionsMenu && openMenuClient && (
          <>
            <div className="fixed inset-0 z-40" onClick={closeActionsMenu} />
            <div
              className="fixed z-50 w-48 bg-light-black border border-primary-border rounded-lg shadow-xl overflow-hidden"
              style={{ top: menuCoords.top, right: menuCoords.right }}
            >
              {openMenuClient.telegramChatId ? (
                <>
                  <button
                    onClick={() => {
                      openTgModal(openMenuClient);
                      closeActionsMenu();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm text-white hover:bg-white/10 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5 text-blue-400" />
                    <span>Edit Telegram</span>
                  </button>
                  <button
                    onClick={() => {
                      setConfirmUnlinkTg({
                        isOpen: true,
                        clientId: openMenuClient.id,
                        clientName: openMenuClient.name,
                      });
                      closeActionsMenu();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                    <span>Unlink Telegram</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    openTgModal(openMenuClient);
                    closeActionsMenu();
                  }}
                  disabled={allChats.length === 0}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LinkIcon className="w-3.5 h-3.5 text-blue-400" />
                  <span>Link Telegram</span>
                </button>
              )}
              <div className="h-px bg-white/10" />
              {openMenuClient.slackChannels &&
              openMenuClient.slackChannels.length > 0 ? (
                <>
                  {openMenuClient.slackChannels.map((ch) => (
                    <button
                      key={ch.id}
                      onClick={() => {
                        setConfirmUnlinkSlack({
                          isOpen: true,
                          clientId: openMenuClient.id,
                          clientName: openMenuClient.name,
                          channelType: ch.type,
                        });
                        closeActionsMenu();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                      <Unlink className="w-3.5 h-3.5" />
                      <span>
                        Unlink Slack ({ch.type === "internal" ? "INT" : "EXT"})
                      </span>
                    </button>
                  ))}
                  {openMenuClient.slackChannels.length < 2 && (
                    <button
                      onClick={() => {
                        openSlackModal(openMenuClient);
                        closeActionsMenu();
                      }}
                      disabled={botChannels.length === 0}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Hash className="w-3.5 h-3.5 text-purple-400" />
                      <span>Add Slack Channel</span>
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={() => {
                    openSlackModal(openMenuClient);
                    closeActionsMenu();
                  }}
                  disabled={botChannels.length === 0}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LinkIcon className="w-3.5 h-3.5 text-purple-400" />
                  <span>Link Slack</span>
                </button>
              )}
            </div>
          </>
        )}

        {/* ── Telegram Modal ──────────────────────────────────────────────── */}
        <Modal
          isOpen={showTgModal}
          onClose={closeTgModal}
          title={
            editingTgClient
              ? `Edit Telegram — ${editingTgClient.name}`
              : "Link Telegram Group"
          }
          size="lg"
        >
          <form onSubmit={handleLinkTg} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Client <span className="text-red-400">*</span>
              </label>
              {editingTgClient ? (
                <div className="w-full px-4 py-2.5 bg-black/30 border border-primary-border text-white/60 rounded-lg text-sm">
                  {editingTgClient.name}{" "}
                  <span className="text-white/30 ml-2">(locked)</span>
                </div>
              ) : (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setIsTgClientDropdownOpen(!isTgClientDropdownOpen)
                    }
                    className="w-full px-4 py-2.5 bg-light-black border border-primary-border text-white rounded-lg text-left flex items-center justify-between"
                  >
                    <span
                      className={
                        selectedTgClient ? "text-white" : "text-white/40"
                      }
                    >
                      {selectedTgClient
                        ? selectedTgClient.name
                        : "Choose a client..."}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${isTgClientDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isTgClientDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-light-black border border-primary-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {availableTgClients.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setTgForm({ ...tgForm, clientId: c.id });
                            setIsTgClientDropdownOpen(false);
                          }}
                          className="w-full px-4 py-2.5 text-left text-white hover:bg-white/10 transition-colors"
                        >
                          {c.name}
                        </button>
                      ))}
                      {availableTgClients.length === 0 && (
                        <div className="px-4 py-2.5 text-white/50 text-sm">
                          No available clients
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Telegram Group <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsTgChatDropdownOpen(!isTgChatDropdownOpen)}
                  className="w-full px-4 py-2.5 bg-light-black border border-primary-border text-white rounded-lg text-left flex items-center justify-between"
                >
                  <span
                    className={selectedTgChat ? "text-white" : "text-white/40"}
                  >
                    {selectedTgChat
                      ? `${selectedTgChat.title}${selectedTgChat.memberCount ? ` (${selectedTgChat.memberCount} members)` : ""}`
                      : "Choose a group..."}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${isTgChatDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isTgChatDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-light-black border border-primary-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {availableTgChats.map((ch) => (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => {
                          setTgForm({ ...tgForm, chatId: ch.id });
                          setIsTgChatDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-white hover:bg-white/10 transition-colors"
                      >
                        {ch.title}{" "}
                        {ch.memberCount ? `(${ch.memberCount} members)` : ""}
                      </button>
                    ))}
                    {availableTgChats.length === 0 && (
                      <div className="px-4 py-2.5 text-white/50 text-sm">
                        No available groups
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={closeTgModal}
                className="px-5 py-2.5 border border-gradient-primary cursor-pointer rounded-lg text-white bg-black/40 hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLinkingTg || !tgForm.clientId || !tgForm.chatId}
                className="px-5 py-2.5 bg-gradient-primary text-white rounded-lg cursor-pointer hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLinkingTg
                  ? "Saving..."
                  : editingTgClient
                    ? "Save Changes"
                    : "Link Chat"}
              </button>
            </div>
          </form>
        </Modal>

        {/* ── Slack Modal ─────────────────────────────────────────────────── */}
        <Modal
          isOpen={showSlackModal}
          onClose={closeSlackModal}
          title="Link Slack Channel"
          size="lg"
        >
          <form onSubmit={handleLinkSlack} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Client <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setIsSlackClientDropdownOpen(!isSlackClientDropdownOpen)
                  }
                  className="w-full px-4 py-2.5 bg-light-black border border-primary-border text-white rounded-lg text-left flex items-center justify-between"
                >
                  <span
                    className={
                      selectedSlackClient ? "text-white" : "text-white/40"
                    }
                  >
                    {selectedSlackClient
                      ? selectedSlackClient.name
                      : "Choose a client..."}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${isSlackClientDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isSlackClientDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-light-black border border-primary-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {allClients.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSlackForm({ ...slackForm, clientId: c.id });
                          setIsSlackClientDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-white hover:bg-white/10 transition-colors flex items-center justify-between"
                      >
                        <span>{c.name}</span>
                        {c.slackChannels && c.slackChannels.length > 0 && (
                          <span className="text-xs text-white/40">
                            {c.slackChannels.map((ch) => ch.type).join(", ")}{" "}
                            linked
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Slack Channel <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setIsSlackChannelDropdownOpen(!isSlackChannelDropdownOpen)
                  }
                  className="w-full px-4 py-2.5 bg-light-black border border-primary-border text-white rounded-lg text-left flex items-center justify-between"
                >
                  <span
                    className={
                      selectedSlackChannel ? "text-white" : "text-white/40"
                    }
                  >
                    {selectedSlackChannel
                      ? `#${selectedSlackChannel.name}${selectedSlackChannel.memberCount ? ` (${selectedSlackChannel.memberCount} members)` : ""}`
                      : "Choose a channel..."}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${isSlackChannelDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isSlackChannelDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-light-black border border-primary-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {botChannels.map((ch) => (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => {
                          setSlackForm({
                            ...slackForm,
                            channelId: ch.id,
                            channelName: ch.name,
                            channelType: ch.type,
                          });
                          setIsSlackChannelDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                      >
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${ch.type === "internal" ? "bg-blue-400/20 text-blue-400" : "bg-orange-400/20 text-orange-400"}`}
                        >
                          {ch.type === "internal" ? "INT" : "EXT"}
                        </span>
                        <span>#{ch.name}</span>
                        {ch.memberCount && (
                          <span className="text-white/40 text-xs ml-auto">
                            {ch.memberCount} members
                          </span>
                        )}
                      </button>
                    ))}
                    {botChannels.length === 0 && (
                      <div className="px-4 py-2.5 text-white/50 text-sm">
                        No channels found. Add the bot to a channel and refresh.
                      </div>
                    )}
                  </div>
                )}
              </div>
              {selectedSlackChannel && (
                <p className="mt-1.5 text-xs text-white/40">
                  Type auto-detected from channel name prefix (
                  {selectedSlackChannel.type === "external" ? "ext-" : "int-"})
                </p>
              )}
            </div>
            {selectedSlackClient && selectedSlackChannel && (
              <div className="bg-black/60 border border-primary-border rounded-lg p-4">
                <h4 className="text-sm font-medium text-white mb-2">
                  Link Preview
                </h4>
                <div className="text-sm text-white/70 space-y-1">
                  <p>
                    <strong>Client:</strong> {selectedSlackClient.name}
                  </p>
                  <p>
                    <strong>Channel:</strong> #{selectedSlackChannel.name}
                  </p>
                  <p>
                    <strong>Type:</strong>{" "}
                    <span
                      className={
                        selectedSlackChannel.type === "internal"
                          ? "text-blue-400"
                          : "text-orange-400"
                      }
                    >
                      {selectedSlackChannel.type}
                    </span>
                  </p>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={closeSlackModal}
                className="px-5 py-2.5 border border-gradient-primary cursor-pointer rounded-lg text-white bg-black/40 hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  isLinkingSlack || !slackForm.clientId || !slackForm.channelId
                }
                className="px-5 py-2.5 bg-gradient-primary text-white rounded-lg cursor-pointer hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLinkingSlack ? "Linking..." : "Link Channel"}
              </button>
            </div>
          </form>
        </Modal>

        <ConfirmModal
          isOpen={confirmUnlinkTg.isOpen}
          onClose={() =>
            setConfirmUnlinkTg({
              isOpen: false,
              clientId: null,
              clientName: null,
            })
          }
          onConfirm={handleUnlinkTg}
          title="Unlink Telegram Chat"
          message={`Are you sure you want to unlink the Telegram chat from ${confirmUnlinkTg.clientName}?`}
          confirmText="Unlink"
          variant="danger"
        />
        <ConfirmModal
          isOpen={confirmUnlinkSlack.isOpen}
          onClose={() =>
            setConfirmUnlinkSlack({
              isOpen: false,
              clientId: null,
              clientName: null,
              channelType: null,
            })
          }
          onConfirm={handleUnlinkSlack}
          title="Unlink Slack Channel"
          message={`Are you sure you want to unlink the ${confirmUnlinkSlack.channelType} Slack channel from ${confirmUnlinkSlack.clientName}?`}
          confirmText="Unlink"
          variant="danger"
        />
      </AdminLayout>
    </AdminRoute>
  );
}
