// User Mappings
export interface UserMapping {
  id: string;
  email: string;
  name?: string;
  telegramId?: string;
  telegramUsername?: string;
  slackUserId?: string;
  slackEmail?: string;
  notionUserId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SlackMember {
  slackUserId: string;
  slackEmail: string;
  name: string;
  avatar: string;
  isMapped: boolean;
  mappingId: string | null;
  telegramUsername: string | null;
  telegramId: string | null;
}

export interface SlackMembersResponse {
  success: boolean;
  total: number;
  mapped: number;
  unmapped: number;
  members: SlackMember[];
}

export interface ImportSlackResult {
  success: boolean;
  message: string;
  results: {
    created: number;
    updated: number;
    skipped: number;
    errors: string[];
  };
}

export interface UserMappingStats {
  total: number;
  withSlack: number;
  withTelegram: number;
  withNotion: number;
  complete: number;
  incomplete: number;
}

// CRLA
export interface DigestData {
  clientName: string;
  newRequests: number;
  progressed: number;
  shipped: number;
  blocked: number;
  needsAttention: boolean;
}

export interface DigestHistory {
  id: string;
  clientName: string;
  digestType: "daily" | "weekly";
  periodStart: string;
  periodEnd: string;
  needsAttention: boolean;
  postedToSlack: boolean;
  createdAt: string;
}

// Pulse
export interface PulseReport {
  clientId: string;
  clientName: string;
  summary: string;
  status: "On Track" | "Attention" | "Blocked";
  statusEmoji: string;
  statusReason: string;
  actionItems: string[];
  metrics: {
    meetings: number;
    linearIssues: number;
    githubPRs: number;
    pipedriveActivities: number;
  };
}

export interface PulseLog {
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
  reports?: PulseReport[];
}

// Settings
export interface PulseSettings {
  cadence: "daily" | "weekly";
  targetChannel: string;
  enabled: boolean;
}

export interface CRLASettings {
  cadence: "daily" | "weekly";
  enabled: boolean;
}

export interface TelegramSettings {
  routingEnabled: boolean;
  mentionCheckInterval: number;
}

// Chat Linking
export interface TelegramChat {
  id: string;
  title: string;
  type: string;
  username?: string;
  memberCount?: number;
}

export interface SlackChannel {
  id: string;
  name: string;
  type: "internal" | "external";
  memberCount?: number;
}

export interface Client {
  id: string;
  name: string;
  status: string;
  telegramChatId?: string;
  hasTelegramLinked?: boolean;
  hasSlackLinked?: boolean;
  slackChannels?: SlackChannel[];
}

// Prompts
export interface Prompt {
  id: string;
  key: string;
  name: string;
  type: "system" | "user";
  content: string;
  updatedBy?: string;
  updatedAt: string;
}

export interface PromptStats {
  total: number;
  system: number;
  user: number;
}

// Telegram
export interface TelegramClient {
  id: string;
  name: string;
  status: string;
  telegramChatId: string;
}

export interface TelegramMention {
  id: string;
  messageId: string;
  chatId: string;
  clientId?: string;
  clientName?: string;
  mentionedUsername?: string;
  mentionedTelegramId: string;
  messageText: string;
  mentionedBy?: string;
  messageLink?: string;
  addressed: boolean;
  notificationSent: boolean;
  slackMessageTs?: string;
  createdAt: string;
  checkedAt?: string;
}

export interface TelegramStats {
  total: number;
  addressed: number;
  notified: number;
  pending: number;
  addressRate: string;
}

export interface LinkedClient {
  id: string;
  name: string;
  status: string;
  telegramChatId: string;
}

export interface ChatInfo {
  id: number;
  type: string;
  title: string;
  username?: string;
  description?: string;
}

export interface BroadcastResult {
  sent: number;
  failed: number;
  errors: string[];
}

// Chat
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  summary?: string;
  bulletPoints?: string[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  [key: string]: unknown;
}