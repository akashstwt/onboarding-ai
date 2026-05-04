  import {
    UserMapping,
    UserMappingStats,
    SlackMember,
    SlackMembersResponse,
    ImportSlackResult,
    TelegramMention,
    TelegramStats,
    LinkedClient,
    ChatInfo,
    BroadcastResult,
    TelegramSettings,
    Prompt,
    PromptStats,
    PulseSettings,
    CRLASettings,
    DigestData,
    DigestHistory,
    PulseReport,
    PulseLog,
  } from "./types";
  import {
    DUMMY_BROADCAST_SEGMENTS,
    DUMMY_CRLA_DIGESTS,
    DUMMY_CRLA_SETTINGS,
    DUMMY_LINKED_CLIENTS,
    DUMMY_PROMPTS,
    DUMMY_PULSE_LOGS,
    DUMMY_PULSE_REPORTS,
    DUMMY_PULSE_SETTINGS,
    DUMMY_SLACK_CHANNELS,
    DUMMY_SLACK_MEMBERS,
    DUMMY_TELEGRAM_CHATS,
    DUMMY_TELEGRAM_MENTIONS,
    DUMMY_TELEGRAM_SETTINGS,
    DUMMY_UNLINKED_CLIENTS,
  } from "./dummyData";

  const ENV = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env || {};

  export const API_BASE_URL =
    ENV.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

  export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    [key: string]: unknown;
  }

  export interface TelegramChat {
    id: string;
    title: string;
    type: string;
    username?: string;
    memberCount?: number;
  }
  export interface ProviderStatus {
    disabled: boolean;
    reason: string | null;
    disabledAt: string | null;
  }

  const USE_DUMMY_DATA = ENV.NEXT_PUBLIC_USE_DUMMY_DATA !== "false";

  let mockSlackMembers: SlackMember[] = DUMMY_SLACK_MEMBERS.map((member) => ({ ...member }));
  let mockPrompts: Prompt[] = DUMMY_PROMPTS.map((prompt) => ({ ...prompt }));
  let mockPulseSettings = { ...DUMMY_PULSE_SETTINGS };
  let mockCRLASettings = { ...DUMMY_CRLA_SETTINGS };
  let mockTelegramSettings = { ...DUMMY_TELEGRAM_SETTINGS };
  let mockPulseLogs: PulseLog[] = (DUMMY_PULSE_LOGS as unknown as PulseLog[]).map((log) => ({ ...log }));
  let mockLinkedClients: Array<{
    id: string;
    name: string;
    status: string;
    telegramChatId: string;
    slackChannels?: Array<{ id: string; name: string; type: "internal" | "external"; memberCount?: number }>;
  }> = DUMMY_LINKED_CLIENTS.map((client) => ({
    ...client,
    slackChannels: [...(client.slackChannels || [])],
  }));
  let mockUnlinkedClients: Array<{ id: string; name: string; status: string }> = DUMMY_UNLINKED_CLIENTS.map((client) => ({
    ...client,
  }));
  let mockMentions: TelegramMention[] = DUMMY_TELEGRAM_MENTIONS.map((mention) => ({
    id: mention.id,
    messageId: String(mention.messageId),
    chatId: mention.chatId,
    clientId: mention.chatId,
    clientName: mention.chatTitle,
    mentionedUsername: "bot",
    mentionedTelegramId: "0",
    messageText: mention.text,
    mentionedBy: mention.authorName,
    messageLink: undefined,
    addressed: mention.status === "addressed",
    notificationSent: mention.status === "notified",
    slackMessageTs: undefined,
    createdAt: mention.mentionedAt,
    checkedAt: undefined,
  }));
  let mockAiConfig = { provider: "openai", model: "GPT4" };

  function parseJsonBody(options: RequestInit): Record<string, unknown> {
    if (!options.body || typeof options.body !== "string") {
      return {};
    }

    try {
      return JSON.parse(options.body) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  function getClientById(clientId: string) {
    const linked = mockLinkedClients.find((client) => client.id === clientId);
    if (linked) {
      return { ...linked, hasTelegramLinked: true, hasSlackLinked: true };
    }

    const unlinked = mockUnlinkedClients.find((client) => client.id === clientId);
    if (unlinked) {
      return {
        ...unlinked,
        hasTelegramLinked: false,
        hasSlackLinked: false,
        slackChannels: [],
      };
    }

    return null;
  }

  function getAllClients() {
    const linked = mockLinkedClients.map((client) => ({
      ...client,
      hasTelegramLinked: true,
      hasSlackLinked: (client.slackChannels || []).length > 0,
    }));

    const unlinked = mockUnlinkedClients.map((client) => ({
      ...client,
      hasTelegramLinked: false,
      hasSlackLinked: false,
      slackChannels: [],
    }));

    return [...linked, ...unlinked];
  }

  function getMappingsStats() {
    const total = mockSlackMembers.length;
    const complete = mockSlackMembers.filter((member) => member.isMapped).length;
    return {
      total,
      withSlack: total,
      withTelegram: complete,
      withNotion: 0,
      complete,
      incomplete: total - complete,
    };
  }

  function getMentionsByStatus(status?: string) {
    if (!status) return mockMentions;

    if (status === "addressed") {
      return mockMentions.filter((mention) => mention.addressed);
    }

    if (status === "notified") {
      return mockMentions.filter(
        (mention) => mention.notificationSent && !mention.addressed
      );
    }

    return mockMentions.filter(
      (mention) => !mention.notificationSent && !mention.addressed
    );
  }

  function mockApiResponse<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): ApiResponse<T> {
    const method = (options.method || "GET").toUpperCase();
    const url = new URL(endpoint, "http://localhost");
    const path = url.pathname;
    const body = parseJsonBody(options);

    if (path === "/api/user-mappings/slack-members" && method === "GET") {
      const query = (url.searchParams.get("search") || "").toLowerCase();
      const members = query
        ? mockSlackMembers.filter(
            (member) =>
              member.name.toLowerCase().includes(query) ||
              member.slackEmail.toLowerCase().includes(query) ||
              (member.telegramUsername || "").toLowerCase().includes(query)
          )
        : mockSlackMembers;

      return {
        success: true,
        total: members.length,
        mapped: members.filter((member) => member.isMapped).length,
        unmapped: members.filter((member) => !member.isMapped).length,
        members,
      } as ApiResponse<T>;
    }

    if (path === "/api/user-mappings/stats" && method === "GET") {
      return { success: true, stats: getMappingsStats() } as ApiResponse<T>;
    }

    if (path === "/api/user-mappings/import-slack" && method === "POST") {
      return {
        success: true,
        message: "Slack members imported. Now add Telegram usernames via the UI.",
        results: {
          created: 12,
          updated: 3,
          skipped: 0,
          errors: [],
        },
      } as ApiResponse<T>;
    }

    if (path.startsWith("/api/user-mappings/") && method === "PUT") {
      const mappingId = path.split("/").pop();
      const memberIndex = mockSlackMembers.findIndex(
        (member) => member.mappingId === mappingId
      );

      if (memberIndex === -1) {
        return { success: false, error: "Mapping not found" } as ApiResponse<T>;
      }

      const telegramUsername = (body.telegramUsername as string | undefined) || null;
      mockSlackMembers[memberIndex] = {
        ...mockSlackMembers[memberIndex],
        telegramUsername,
        telegramId: telegramUsername ? `${Date.now()}` : null,
        isMapped: Boolean(telegramUsername),
      };

      return { success: true, mapping: mockSlackMembers[memberIndex] } as ApiResponse<T>;
    }

    if (path === "/api/telegram/linked-clients" && method === "GET") {
      return {
        success: true,
        count: mockLinkedClients.length,
        clients: mockLinkedClients,
      } as ApiResponse<T>;
    }

    if (path === "/api/telegram/unlinked-clients" && method === "GET") {
      return {
        success: true,
        count: mockUnlinkedClients.length,
        clients: mockUnlinkedClients,
      } as ApiResponse<T>;
    }

    if (path === "/api/telegram/all-chats" && method === "GET") {
      return {
        success: true,
        count: DUMMY_TELEGRAM_CHATS.length,
        chats: DUMMY_TELEGRAM_CHATS,
      } as ApiResponse<T>;
    }

    if (path === "/api/telegram/link-chat" && method === "POST") {
      const clientId = String(body.clientId || "");
      const chatId = String(body.chatId || "");
      const chat = DUMMY_TELEGRAM_CHATS.find((item) => item.id === chatId);
      const targetClient = getClientById(clientId);

      if (!targetClient || !chat) {
        return { success: false, error: "Client or chat not found" } as ApiResponse<T>;
      }

      mockUnlinkedClients = mockUnlinkedClients.filter((client) => client.id !== clientId);
      mockLinkedClients = [
        ...mockLinkedClients.filter((client) => client.id !== clientId),
        {
          id: targetClient.id,
          name: targetClient.name,
          status: targetClient.status,
          telegramChatId: chat.id,
          slackChannels: targetClient.slackChannels || [],
        },
      ];

      return {
        success: true,
        message: "Chat linked successfully",
        client: { id: targetClient.id, name: targetClient.name, telegramChatId: chat.id },
      } as ApiResponse<T>;
    }

    if (path.startsWith("/api/telegram/unlink-chat/") && method === "DELETE") {
      const clientId = path.split("/").pop() || "";
      const target = mockLinkedClients.find((client) => client.id === clientId);

      if (!target) {
        return { success: false, error: "Client not found" } as ApiResponse<T>;
      }

      mockLinkedClients = mockLinkedClients.filter((client) => client.id !== clientId);
      mockUnlinkedClients = [
        ...mockUnlinkedClients,
        { id: target.id, name: target.name, status: target.status },
      ];

      return { success: true, message: "Chat unlinked successfully" } as ApiResponse<T>;
    }

    if (path === "/api/telegram/mentions/all" && method === "GET") {
      const status = url.searchParams.get("status") || undefined;
      const mentions = getMentionsByStatus(status);
      return { success: true, count: mentions.length, mentions } as ApiResponse<T>;
    }

    if (path === "/api/telegram/mentions/stats" && method === "GET") {
      const addressed = mockMentions.filter((mention) => mention.addressed).length;
      const notified = mockMentions.filter(
        (mention) => mention.notificationSent && !mention.addressed
      ).length;
      const pending = mockMentions.length - addressed - notified;

      return {
        success: true,
        stats: {
          total: mockMentions.length,
          addressed,
          notified,
          pending,
          addressRate: mockMentions.length
            ? `${Math.round((addressed / mockMentions.length) * 100)}%`
            : "0%",
        },
      } as ApiResponse<T>;
    }

    if (path === "/api/telegram/mentions/check" && method === "POST") {
      return {
        success: true,
        message: "Mentions checked successfully",
        result: {
          checked: mockMentions.length,
          notified: getMentionsByStatus("pending").length,
          failed: 0,
          errors: [],
        },
      } as ApiResponse<T>;
    }

    if (path.includes("/api/telegram/mentions/") && path.endsWith("/address") && method === "POST") {
      const mentionId = path.split("/")[4];
      mockMentions = mockMentions.map((mention) =>
        mention.id === mentionId
          ? {
              ...mention,
              addressed: true,
              notificationSent: true,
              checkedAt: new Date().toISOString(),
            }
          : mention
      );
      return { success: true, message: "Mention marked as addressed" } as ApiResponse<T>;
    }

    if (path === "/api/client-field" && method === "GET") {
      return { success: true, message: DUMMY_BROADCAST_SEGMENTS } as ApiResponse<T>;
    }

    if (path.startsWith("/api/telegram/segment/") && path.endsWith("/clients") && method === "GET") {
      const segment = decodeURIComponent(path.split("/")[4] || "");
      const clients = getAllClients().map((client, index) => ({
        ...client,
        category: DUMMY_BROADCAST_SEGMENTS[index % DUMMY_BROADCAST_SEGMENTS.length],
      }));
      const filtered = clients.filter((client) =>
        client.category === segment || !segment
      );

      return {
        success: true,
        segment,
        clients: filtered,
        count: filtered.length,
        linkedCount: filtered.filter((client) => client.hasTelegramLinked).length,
      } as ApiResponse<T>;
    }

    if (path === "/api/telegram/broadcast" && method === "POST") {
      const clientIds = Array.isArray(body.clientIds) ? body.clientIds : [];
      return {
        success: true,
        message: "Telegram broadcast sent",
        results: { sent: clientIds.length, failed: 0, errors: [] },
      } as ApiResponse<T>;
    }

    if (path === "/api/slack-broadcast/broadcast" && method === "POST") {
      const clientIds = Array.isArray(body.clientIds) ? body.clientIds : [];
      return {
        success: true,
        message: "Slack broadcast sent",
        results: { sent: clientIds.length, failed: 0, errors: [] },
      } as ApiResponse<T>;
    }

    if (path === "/api/slack-broadcast/linked-clients" && method === "GET") {
      return {
        success: true,
        count: mockLinkedClients.length,
        clients: mockLinkedClients.map((client) => ({
          id: client.id,
          name: client.name,
          status: client.status,
          customerSegment: "Enterprise",
          channelId: client.slackChannels?.[0]?.id || "",
          hasSlackLinked: (client.slackChannels || []).length > 0,
        })),
      } as ApiResponse<T>;
    }

    if (path === "/api/slack-broadcast/unlinked-clients" && method === "GET") {
      return {
        success: true,
        count: mockUnlinkedClients.length,
        clients: mockUnlinkedClients,
      } as ApiResponse<T>;
    }

    if (path.includes("/api/slack-broadcast/client/") && path.endsWith("/members") && method === "GET") {
      const clientId = path.split("/")[4];
      return {
        success: true,
        client: { id: clientId, name: getClientById(clientId)?.name || "Client", channelId: `C-${clientId}` },
        members: mockSlackMembers.slice(0, 5).map((member) => ({
          id: member.slackUserId,
          name: member.name,
          realName: member.name,
          email: member.slackEmail,
          isBot: false,
        })),
        memberCount: 5,
        cached: true,
      } as ApiResponse<T>;
    }

    if (path === "/api/slack/bot-channels" && method === "GET") {
      return {
        success: true,
        count: DUMMY_SLACK_CHANNELS.length,
        channels: DUMMY_SLACK_CHANNELS,
      } as ApiResponse<T>;
    }

    if (path === "/api/slack/linked-clients" && method === "GET") {
      return {
        success: true,
        count: mockLinkedClients.length,
        clients: mockLinkedClients,
      } as ApiResponse<T>;
    }

    if (path === "/api/slack/unlinked-clients" && method === "GET") {
      return {
        success: true,
        count: mockUnlinkedClients.length,
        clients: mockUnlinkedClients,
      } as ApiResponse<T>;
    }

    if (path === "/api/slack/link-channel" && method === "POST") {
      const clientId = String(body.clientId || "");
      const channelId = String(body.channelId || "");
      const channelName = String(body.channelName || "");
      const channelType = String(body.channelType || "internal");
      const target = getClientById(clientId);

      if (!target) {
        return { success: false, error: "Client not found" } as ApiResponse<T>;
      }

      mockLinkedClients = mockLinkedClients.map((client) =>
        client.id === clientId
          ? {
              ...client,
              slackChannels: [
                ...(client.slackChannels || []).filter((ch) => ch.type !== channelType),
                {
                  id: channelId,
                  name: channelName,
                  type: channelType as "internal" | "external",
                  memberCount: 0,
                },
              ],
            }
          : client
      );

      return {
        success: true,
        message: "Channel linked successfully",
        client: {
          id: target.id,
          name: target.name,
          slackChannels:
            mockLinkedClients.find((client) => client.id === clientId)?.slackChannels || [],
        },
      } as ApiResponse<T>;
    }

    if (path.startsWith("/api/slack/unlink-channel/") && method === "DELETE") {
      const parts = path.split("/");
      const clientId = parts[4];
      const channelType = parts[5];

      mockLinkedClients = mockLinkedClients.map((client) =>
        client.id === clientId
          ? {
              ...client,
              slackChannels: (client.slackChannels || []).filter(
                (channel) => channel.type !== channelType
              ),
            }
          : client
      );

      return { success: true, message: "Channel unlinked successfully" } as ApiResponse<T>;
    }

    if (path === "/api/settings/pulse/config") {
      if (method === "GET") {
        return { success: true, config: mockPulseSettings } as ApiResponse<T>;
      }
      if (method === "PUT") {
        mockPulseSettings = { ...mockPulseSettings, ...(body as Partial<typeof mockPulseSettings>) };
        return { success: true, updated: true } as ApiResponse<T>;
      }
    }

    if (path === "/api/settings/crla/config") {
      if (method === "GET") {
        return { success: true, config: mockCRLASettings } as ApiResponse<T>;
      }
      if (method === "PUT") {
        mockCRLASettings = { ...mockCRLASettings, ...(body as Partial<typeof mockCRLASettings>) };
        return { success: true, updated: true } as ApiResponse<T>;
      }
    }

    if (path === "/api/settings/telegram/config") {
      if (method === "GET") {
        return { success: true, config: mockTelegramSettings } as ApiResponse<T>;
      }
      if (method === "PUT") {
        mockTelegramSettings = {
          ...mockTelegramSettings,
          ...(body as Partial<typeof mockTelegramSettings>),
        };
        return { success: true, updated: true } as ApiResponse<T>;
      }
    }

    if (path === "/api/prompts" && method === "GET") {
      const filterType = url.searchParams.get("type");
      const prompts = filterType
        ? mockPrompts.filter((prompt) => prompt.type === filterType)
        : mockPrompts;
      return { success: true, prompts } as ApiResponse<T>;
    }

    if (path.startsWith("/api/prompts/") && method === "PUT") {
      const key = path.split("/").pop() || "";
      mockPrompts = mockPrompts.map((prompt) =>
        prompt.key === key
          ? {
              ...prompt,
              ...body,
              updatedAt: new Date().toISOString(),
              updatedBy: "Local User",
            }
          : prompt
      );

      return {
        success: true,
        prompt: mockPrompts.find((prompt) => prompt.key === key),
      } as ApiResponse<T>;
    }

    if (path === "/api/prompts/initialize" && method === "POST") {
      mockPrompts = DUMMY_PROMPTS.map((prompt) => ({ ...prompt }));
      return { success: true, initialized: true } as ApiResponse<T>;
    }

    if (path === "/api/prompts/stats" && method === "GET") {
      return {
        success: true,
        stats: {
          total: mockPrompts.length,
          system: mockPrompts.filter((prompt) => prompt.type === "system").length,
          user: mockPrompts.filter((prompt) => prompt.type === "user").length,
        },
      } as ApiResponse<T>;
    }

    if (path === "/api/crla/generate" && method === "POST") {
      return {
        success: true,
        count: DUMMY_CRLA_DIGESTS.length,
        digests: DUMMY_CRLA_DIGESTS,
      } as ApiResponse<T>;
    }

    if (path === "/api/pulse/history" && method === "GET") {
      const limit = Number(url.searchParams.get("limit") || 20);
      const offset = Number(url.searchParams.get("offset") || 0);
      const logs = mockPulseLogs.slice(offset, offset + limit);
      return {
        success: true,
        total: mockPulseLogs.length,
        limit,
        offset,
        hasMore: offset + limit < mockPulseLogs.length,
        logs,
      } as ApiResponse<T>;
    }

    if (path.startsWith("/api/pulse/history/") && method === "GET") {
      const id = path.split("/").pop() || "";
      const log = mockPulseLogs.find((entry) => entry.id === id);
      if (!log) {
        return { success: false, error: "Log not found" } as ApiResponse<T>;
      }
      return { success: true, log } as ApiResponse<T>;
    }

    if (path === "/api/pulse/generate" && method === "POST") {
      const reportSet = DUMMY_PULSE_REPORTS as PulseReport[];
      const generatedLog: PulseLog = {
        id: `log_${Date.now()}`,
        runType: "manual" as const,
        triggeredBy: "local-user",
        totalClients: reportSet.length,
        summary: {
          onTrack: reportSet.filter((item) => item.status === "On Track").length,
          attention: reportSet.filter((item) => item.status === "Attention").length,
          blocked: reportSet.filter((item) => item.status === "Blocked").length,
        },
        postedToSlack: endpoint.includes("post=true"),
        slackMessageTs: null,
        slackChannelId: null,
        slackError: null,
        createdAt: new Date().toISOString(),
        reports: reportSet,
      };

      mockPulseLogs = [generatedLog, ...mockPulseLogs];

      return {
        success: true,
        logId: generatedLog.id,
        message: "Pulse generated successfully",
        reportsGenerated: reportSet.length,
        summary: generatedLog.summary,
        postedToSlack: generatedLog.postedToSlack,
        reports: generatedLog.reports,
      } as ApiResponse<T>;
    }

    if (path === "/api/ai/config") {
      if (method === "GET") {
        return {
          success: true,
          provider: mockAiConfig.provider,
          data: { provider: mockAiConfig.provider },
        } as unknown as ApiResponse<T>;
      }

      if (method === "POST") {
        mockAiConfig = {
          provider: String(body.provider || "openai"),
          model: String(body.model || "GPT4"),
        };

        return {
          success: true,
          message: "AI provider updated",
          config: mockAiConfig,
        } as ApiResponse<T>;
      }
    }

    if (path === "/api/ai/providers/status" && method === "GET") {
      return {
        success: true,
        statuses: {
          openai: { disabled: false, reason: null, disabledAt: null },
          grok: { disabled: false, reason: null, disabledAt: null },
          claude: { disabled: false, reason: null, disabledAt: null },
          gemini: { disabled: false, reason: null, disabledAt: null },
        },
        data: {
          statuses: {
            openai: { disabled: false, reason: null, disabledAt: null },
            grok: { disabled: false, reason: null, disabledAt: null },
            claude: { disabled: false, reason: null, disabledAt: null },
            gemini: { disabled: false, reason: null, disabledAt: null },
          },
        },
      } as unknown as ApiResponse<T>;
    }

    return {
      success: false,
      error: `No dummy handler defined for ${method} ${path}`,
    } as ApiResponse<T>;
  }


  function getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  async function apiFetch<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    if (USE_DUMMY_DATA) {
      return mockApiResponse<T>(endpoint, options);
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          ...getAuthHeaders(),
          ...(options.headers ?? {}),
        },
        ...options,
      });

      return (await response.json()) as ApiResponse<T>;
    } catch (error) {
      // Fallback to dummy responses when backend is unavailable.
      return mockApiResponse<T>(endpoint, options);
    }
  }

  export const userMappingsAPI = {
    // GET /api/user-mappings/slack-members - Main admin table data
    getSlackMembers: (search?: string) => {
      const queryString = search ? `?search=${encodeURIComponent(search)}` : "";
      return apiFetch<SlackMembersResponse>(
        `/api/user-mappings/slack-members${queryString}`
      );
    },

    // POST /api/user-mappings/import-slack - Import all Slack members
    importFromSlack: () =>
      apiFetch<ImportSlackResult>("/api/user-mappings/import-slack", {
        method: "POST",
      }),

    // GET /api/user-mappings?search= - Search mappings
    search: (searchQuery: string, params?: {
      hasSlack?: boolean;
      hasTelegram?: boolean;
    }) => {
      const searchParams = new URLSearchParams({ search: searchQuery });
      if (params?.hasSlack !== undefined) searchParams.set('hasSlack', String(params.hasSlack));
      if (params?.hasTelegram !== undefined) searchParams.set('hasTelegram', String(params.hasTelegram));
      return apiFetch<{ success: boolean; count: number; mappings: UserMapping[] }>(
        `/api/user-mappings?${searchParams.toString()}`
      );
    },

    // GET /api/user-mappings/stats - Dashboard stats
    stats: () =>
      apiFetch<{ success: boolean; stats: UserMappingStats }>(
        "/api/user-mappings/stats"
      ),

    // Legacy list endpoint
    list: (params?: {
      hasSlack?: boolean;
      hasTelegram?: boolean;
      hasNotion?: boolean;
    }) => {
      const queryString = params
        ? `?${new URLSearchParams(
          Object.entries(params).reduce<Record<string, string>>(
            (acc, [k, v]) => {
              if (v !== undefined) acc[k] = String(v);
              return acc;
            },
            {}
          )
        ).toString()}`
        : "";
      return apiFetch<{ success: boolean; mappings: UserMapping[] }>(
        `/api/user-mappings${queryString}`
      );
    },

    // PUT /api/user-mappings/:id - Update mapping (used for inline Telegram username edit)
    update: (
      id: string,
      data: Partial<Omit<UserMapping, "id" | "createdAt" | "updatedAt">>
    ) =>
      apiFetch<{ success: boolean; mapping: UserMapping }>(
        `/api/user-mappings/${id}`,
        {
          method: "PUT",
          body: JSON.stringify(data),
        }
      ),

    create: (data: Omit<UserMapping, "id" | "createdAt" | "updatedAt">) =>
      apiFetch<{ success: boolean; mapping: UserMapping }>("/api/user-mappings", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      apiFetch<{ success: boolean }>(`/api/user-mappings/${id}`, {
        method: "DELETE",
      }),

    bulkImport: (
      mappings: Array<Omit<UserMapping, "id" | "createdAt" | "updatedAt">>
    ) =>
      apiFetch<{ success: boolean; imported: number }>(
        "/api/user-mappings/bulk-import",
        {
          method: "POST",
          body: JSON.stringify({ mappings }),
        }
      ),
      
  };

  export const telegramAPI = {
    broadcast: (data: { clientIds: string[]; message: string }) =>
      apiFetch<{ success: boolean; message: string; results: BroadcastResult }>(
        "/api/telegram/broadcast",
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      ),

    broadcastSegment: (data: { segment: string; message: string }) =>
      apiFetch<{
        success: boolean;
        message: string;
        segment: string;
        totalClients: number;
        results: BroadcastResult;
      }>("/api/telegram/broadcast-segment", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    linkedClients: () =>
      apiFetch<{ success: boolean; count: number; clients: LinkedClient[] }>(
        "/api/telegram/linked-clients"
      ),

    unlinkedClients: () =>
      apiFetch<{
        success: boolean;
        count: number;
        clients: Array<{ id: string; name: string; status: string }>;
      }>("/api/telegram/unlinked-clients"),

    getAvailableChats: () =>
      apiFetch<{ success: boolean; count: number; chats: TelegramChat[] }>(
        "/api/telegram/available-chats"
      ),

    getAllDiscoveredChats: () =>
      apiFetch<{ success: boolean; count: number; chats: TelegramChat[] }>(
        "/api/telegram/all-chats"
      ),

    linkChat: (data: { clientId: string; chatId: string }) =>
      apiFetch<{
        success: boolean;
        message: string;
        client: {
          id: string;
          name: string;
          telegramChatId: string;
        };
      }>("/api/telegram/link-chat", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    unlinkChat: (clientId: string) =>
      apiFetch<{ success: boolean; message: string }>(
        `/api/telegram/unlink-chat/${clientId}`,
        { method: "DELETE" }
      ),

    getChatInfo: (chatId: string) =>
      apiFetch<{ success: boolean; chat: ChatInfo; hint?: string }>(
        `/api/telegram/chat-info/${chatId}`
      ),

    mentions: (params?: { username?: string; limit?: number }) =>
      apiFetch<{
        success: boolean;
        count: number;
        mentions: TelegramMention[];
      }>(
        `/api/telegram/mentions${params
          ? `?${new URLSearchParams(
            Object.entries(params).reduce<Record<string, string>>(
              (acc, [k, v]) => {
                if (v !== undefined) acc[k] = String(v);
                return acc;
              },
              {}
            )
          ).toString()}`
          : ""
        }`
      ),

    allMentions: (params?: {
      status?: "pending" | "notified" | "addressed";
      limit?: number;
    }) =>
      apiFetch<{
        success: boolean;
        count: number;
        mentions: TelegramMention[];
      }>(
        `/api/telegram/mentions/all${params
          ? `?${new URLSearchParams(
            Object.entries(params).reduce<Record<string, string>>(
              (acc, [k, v]) => {
                if (v !== undefined) acc[k] = String(v);
                return acc;
              },
              {}
            )
          ).toString()}`
          : ""
        }`
      ),

    mentionStats: () =>
      apiFetch<{ success: boolean; stats: TelegramStats }>(
        "/api/telegram/mentions/stats"
      ),

    checkMentions: () =>
      apiFetch<{
        success: boolean;
        message: string;
        result: {
          checked: number;
          notified: number;
          failed: number;
          errors: string[];
        };
      }>("/api/telegram/mentions/check", { method: "POST" }),

    markMentionAddressed: (mentionId: string) =>
      apiFetch<{ success: boolean; message: string }>(
        `/api/telegram/mentions/${mentionId}/address`,
        { method: "POST" }
      ),

    segment: () => {
      return apiFetch<{ success: boolean; message: string[] }>(
        `/api/client-field`,
        { method: "GET" }
      )
    },

    clientsWithMembers: () =>
      apiFetch<{
        success: boolean;
        count: number;
        totalMembers: number;
        clients: Array<{
          id: string;
          name: string;
          status: string;
          telegramChatId: string;
          members: Array<{
            id: string;
            name: string;
            email: string;
            telegramId: string | null;
            telegramUsername: string | null;
            slackUserId: string | null;
            slackEmail: string | null;
            hasSlack: boolean;
            hasTelegram: boolean;
          }>;
          memberCount: number;
        }>;
      }>("/api/telegram/clients-with-members"),

    getClientMembers: (clientId: string) =>
      apiFetch<{
        success: boolean;
        client: {
          id: string;
          name: string;
          status: string;
          telegramChatId?: string;
          hasTelegramLinked: boolean;
        };
        members: Array<{
          id: string;
          name: string;
          email: string;
          telegramId: string | null;
          telegramUsername: string | null;
          slackUserId: string | null;
          slackEmail: string | null;
          hasSlack: boolean;
          hasTelegram: boolean;
        }>;
        memberCount: number;
      }>(`/api/telegram/client/${clientId}/members`),

    getSegmentClients: (segment: string) =>
      apiFetch<{
        success: boolean;
        segment: string;
        clients: Array<{
          id: string;
          name: string;
          status: string;
          category: string | null;
          telegramChatId?: string;
          hasTelegramLinked: boolean;
        }>;
        count: number;
        linkedCount: number;
      }>(`/api/telegram/segment/${segment}/clients`),
  };

  // Slack Broadcast API
  export const slackAPI = {
    broadcast: (data: { clientIds: string[]; message: string }) =>
      apiFetch<{ success: boolean; message: string; results: BroadcastResult }>(
        "/api/slack-broadcast/broadcast",
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      ),

    broadcastSegment: (data: { segment: string; message: string }) =>
      apiFetch<{
        success: boolean;
        message: string;
        segment: string;
        totalClients: number;
        results: BroadcastResult;
      }>("/api/slack-broadcast/broadcast-segment", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    linkedClients: () =>
      apiFetch<{ 
        success: boolean; 
        count: number; 
        clients: Array<{
          id: string;
          name: string;
          status: string;
          customerSegment: string;
          channelId: string;
          hasSlackLinked: boolean;
        }>;
      }>("/api/slack-broadcast/linked-clients"),

    unlinkedClients: () =>
      apiFetch<{
        success: boolean;
        count: number;
        clients: Array<{ id: string; name: string; status: string }>;
      }>("/api/slack-broadcast/unlinked-clients"),

    segments: () =>
      apiFetch<{ success: boolean; segments: string[] }>(
        "/api/slack-broadcast/segments"
      ),

    getSegmentClients: (segment: string) =>
      apiFetch<{
        success: boolean;
        segment: string;
        count: number;
        linkedCount: number;
        clients: Array<{
          id: string;
          name: string;
          status: string;
          channelId?: string;
          hasSlackLinked: boolean;
        }>;
      }>(`/api/slack-broadcast/segment/${encodeURIComponent(segment)}/clients`),

    getClientMembers: (clientId: string, refresh?: boolean) =>
      apiFetch<{
        success: boolean;
        client: {
          id: string;
          name: string;
          channelId: string;
        };
        members: Array<{
          id: string;
          name: string;
          realName: string;
          email: string;
          isBot: boolean;
        }>;
        memberCount: number;
        cached: boolean;
      }>(`/api/slack-broadcast/client/${clientId}/members${refresh ? '?refresh=true' : ''}`),

    clientsWithMembers: () =>
      apiFetch<{
        success: boolean;
        count: number;
        clients: Array<{
          id: string;
          name: string;
          channelId: string;
          members: Array<{
            id: string;
            name: string;
            realName: string;
            email: string;
            isBot: boolean;
          }>;
          memberCount: number;
        }>;
      }>("/api/slack-broadcast/clients-with-members"),
  };

  export type SettingsValue = string | number | boolean | object | null;

  export const settingsAPI = {
    getAll: (prefix?: string) =>
      apiFetch<{ success: boolean; settings: Record<string, SettingsValue> }>(
        `/api/settings${prefix ? `?prefix=${prefix}` : ""}`
      ),

    get: (key: string) =>
      apiFetch<{ success: boolean; key: string; value: SettingsValue }>(
        `/api/settings/${key}`
      ),

    update: (key: string, value: SettingsValue) =>
      apiFetch<{ success: boolean }>(`/api/settings/${key}`, {
        method: "PUT",
        body: JSON.stringify({ value }),
      }),

    getPulseConfig: () =>
      apiFetch<{ success: boolean; config: PulseSettings }>(
        "/api/settings/pulse/config"
      ),

    updatePulseConfig: (data: {
      cadence?: "daily" | "weekly";
      targetChannel?: string;
      enabled?: boolean;
    }) =>
      apiFetch<{ success: boolean; updated: boolean }>(
        "/api/settings/pulse/config",
        {
          method: "PUT",
          body: JSON.stringify(data),
        }
      ),

    getCRLAConfig: () =>
      apiFetch<{ success: boolean; config: CRLASettings }>(
        "/api/settings/crla/config"
      ),

    updateCRLAConfig: (data: {
      cadence?: "daily" | "weekly";
      enabled?: boolean;
    }) =>
      apiFetch<{ success: boolean; updated: boolean }>(
        "/api/settings/crla/config",
        {
          method: "PUT",
          body: JSON.stringify(data),
        }
      ),

    getTelegramConfig: () =>
      apiFetch<{ success: boolean; config: TelegramSettings }>(
        "/api/settings/telegram/config"
      ),

    updateTelegramConfig: (data: {
      routingEnabled?: boolean;
      mentionCheckInterval?: number;
    }) =>
      apiFetch<{ success: boolean; updated: boolean }>(
        "/api/settings/telegram/config",
        {
          method: "PUT",
          body: JSON.stringify(data),
        }
      ),

    initialize: () =>
      apiFetch<{ success: boolean; initialized: boolean }>(
        "/api/settings/initialize",
        { method: "POST" }
      ),
  };

  export const promptsAPI = {
    list: (type?: "system" | "user") =>
      apiFetch<{ success: boolean; prompts: Prompt[] }>(
        `/api/prompts${type ? `?type=${type}` : ""}`
      ),

    get: (key: string) =>
      apiFetch<{ success: boolean; prompt: Prompt }>(`/api/prompts/${key}`),

    update: (
      key: string,
      data: Pick<Prompt, "content"> & Partial<Pick<Prompt, "name" | "type">>
    ) =>
      apiFetch<{ success: boolean; prompt: Prompt }>(`/api/prompts/${key}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    initialize: () =>
      apiFetch<{ success: boolean; initialized: boolean }>(
        "/api/prompts/initialize",
        { method: "POST" }
      ),

    stats: () =>
      apiFetch<{ success: boolean; stats: PromptStats }>("/api/prompts/stats"),
  };

  export const crlaAPI = {
    generate: (data: { digestType: "daily" | "weekly"; post: boolean }) =>
      apiFetch<{
        success: boolean;
        count: number;
        digests: DigestData[];
      }>("/api/crla/generate", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    generateForClient: (
      clientId: string,
      data: { digestType: "daily" | "weekly"; post: boolean }
    ) =>
      apiFetch<{ success: boolean; digest: DigestData }>(
        `/api/crla/generate/${clientId}`,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      ),

    history: (clientId: string, limit?: number) =>
      apiFetch<{ success: boolean; digests: DigestHistory[] }>(
        `/api/crla/history/${clientId}${limit ? `?limit=${limit}` : ""}`
      ),
  };

  export const pulseAPI = {
    // Generate pulse for all clients
    generate: (post: boolean = false) =>
      apiFetch<{
        success: boolean;
        logId: string;
        message: string;
        reportsGenerated: number;
        summary: {
          onTrack: number;
          attention: number;
          blocked: number;
        };
        postedToSlack: boolean;
        reports: Array<{
          clientId: string;
          clientName: string;
          summary: string;
          status: string;
          statusEmoji: string;
          statusReason: string;
          actionItems: string[];
          metrics: {
            meetings: number;
            linearIssues: number;
            githubPRs: number;
            pipedriveActivities: number;
          };
        }>;
      }>(`/api/pulse/generate${post ? "?post=true" : ""}`, {
        method: "POST",
      }),

    // Generate pulse for single client
    generateForClient: (clientId: string, post: boolean = false) =>
      apiFetch<{
        success: boolean;
        logId: string;
        message: string;
        postedToSlack: boolean;
        report: {
          clientId: string;
          clientName: string;
          summary: string;
          status: string;
          statusEmoji: string;
          statusReason: string;
          actionItems: string[];
          metrics: {
            meetings: number;
            linearIssues: number;
            githubPRs: number;
            pipedriveActivities: number;
          };
        };
      }>(`/api/pulse/generate/${clientId}${post ? "?post=true" : ""}`, {
        method: "POST",
      }),

    // Get pulse history (list)
    getHistory: (params?: { limit?: number; offset?: number }) =>
      apiFetch<{
        success: boolean;
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
        logs: Array<{
          id: string;
          runType: "manual" | "scheduled";
          triggeredBy: string;
          totalClients: number;
          summary: {
            onTrack: number;
            attention: number;
            blocked: number;
          };
          postedToSlack: boolean;
          slackMessageTs: string | null;
          slackChannelId: string | null;
          slackError: string | null;
          createdAt: string;
        }>;
      }>(
        `/api/pulse/history${
          params
            ? `?${new URLSearchParams(
                Object.entries(params).reduce<Record<string, string>>(
                  (acc, [k, v]) => {
                    if (v !== undefined) acc[k] = String(v);
                    return acc;
                  },
                  {}
                )
              ).toString()}`
            : ""
        }`
      ),

    // Get single pulse log with full reports
    getLog: (id: string) =>
      apiFetch<{
        success: boolean;
        log: {
          id: string;
          runType: "manual" | "scheduled";
          triggeredBy: string;
          totalClients: number;
          summary: {
            onTrack: number;
            attention: number;
            blocked: number;
          };
          postedToSlack: boolean;
          slackMessageTs: string | null;
          slackChannelId: string | null;
          slackError: string | null;
          createdAt: string;
          reports: Array<{
            clientId: string;
            clientName: string;
            summary: string;
            status: string;
            statusEmoji: string;
            statusReason: string;
            actionItems: string[];
            metrics: {
              meetings: number;
              linearIssues: number;
              githubPRs: number;
              pipedriveActivities: number;
            };
          }>;
        };
      }>(`/api/pulse/history/${id}`),
  };


  export const aiConfigAPI = {
    getConfig: () =>
      apiFetch<{ success: boolean; provider: string }>("/api/ai/config"),

    updateConfig: (data: { provider: string; model?: string }) =>
      apiFetch<{
        success: boolean;
        message: string;
        config: { provider: string; model: string };
      }>("/api/ai/config", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    getProviderStatus: () =>
      apiFetch<{
        success: boolean;
        statuses: Record<string, ProviderStatus>;
      }>("/api/ai/providers/status"),

    enableProvider: (provider: string) =>
      apiFetch<{ success: boolean; message: string }>(
        `/api/ai/providers/${provider}/enable`,
        { method: "POST" }
      ),
  };

  export const slackApi = {
    getBotChannels: () =>
      apiFetch<{ success: boolean; count: number; channels: Array<{ id: string; name: string; type: "internal" | "external"; memberCount?: number }> }>(
        "/api/slack/bot-channels"
      ),

    linkedClients: () =>
      apiFetch<{ success: boolean; count: number; clients: Array<{ id: string; name: string; status: string; slackChannels: Array<{ id: string; name: string; type: "internal" | "external" }> }> }>(
        "/api/slack/linked-clients"
      ),

    unlinkedClients: () =>
      apiFetch<{ success: boolean; count: number; clients: Array<{ id: string; name: string; status: string }> }>(
        "/api/slack/unlinked-clients"
      ),

    linkChannel: (data: { clientId: string; channelId: string; channelName: string; channelType: "internal" | "external" }) =>
      apiFetch<{ success: boolean; message: string; client: { id: string; name: string; slackChannels: Array<{ id: string; name: string; type: string }> } }>(
        "/api/slack/link-channel",
        { method: "POST", body: JSON.stringify(data) }
      ),
    unlinkChannel: (clientId: string, channelType: string) =>
      apiFetch<{ success: boolean; message: string }>(
        `/api/slack/unlink-channel/${clientId}/${channelType}`,
        { method: "DELETE" }
      ),
  };

  export type {
    UserMapping,
    UserMappingStats,
    TelegramMention,
    TelegramStats,
    LinkedClient,
    ChatInfo,
    BroadcastResult,
    TelegramSettings,
    PulseReport,
    PulseLog,
  };