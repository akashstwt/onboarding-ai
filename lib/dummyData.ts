/**
 * Centralized Dummy Data for Development/Testing
 * All dummy data used across the application
 */

// ============ BROADCAST DATA ============
export const DUMMY_BROADCAST_CLIENTS = [
  {
    id: "1",
    name: "Acme Corp",
    status: "active",
    telegramChatId: "123456",
  },
  {
    id: "2",
    name: "TechStart Inc",
    status: "active",
    telegramChatId: "234567",
  },
  {
    id: "3",
    name: "Global Solutions",
    status: "active",
    telegramChatId: "345678",
  },
  {
    id: "4",
    name: "Innovation Labs",
    status: "pending",
    telegramChatId: "456789",
  },
  {
    id: "5",
    name: "Digital Ventures",
    status: "active",
    telegramChatId: "567890",
  },
];

export const DUMMY_BROADCAST_SEGMENTS = [
  "Enterprise Clients",
  "Small Business",
  "Startup Clients",
  "Premium Tier",
  "Trial Users",
];

// ============ CHAT-LINK DATA ============
export const DUMMY_LINKED_CLIENTS = [
  {
    id: "1",
    name: "Acme Corp",
    status: "active",
    telegramChatId: "-1001234567890",
    slackChannels: [
      {
        id: "C01ABC123",
        name: "acme-internal",
        type: "internal" as const,
        memberCount: 15,
      },
      {
        id: "C01ABC124",
        name: "acme-external",
        type: "external" as const,
        memberCount: 8,
      },
    ],
  },
  {
    id: "2",
    name: "TechStart Inc",
    status: "active",
    telegramChatId: "-1001234567891",
    slackChannels: [
      {
        id: "C02DEF456",
        name: "techstart-internal",
        type: "internal" as const,
        memberCount: 12,
      },
    ],
  },
];

export const DUMMY_UNLINKED_CLIENTS = [
  { id: "3", name: "Global Solutions", status: "pending" },
  { id: "4", name: "Innovation Labs", status: "active" },
  { id: "5", name: "Digital Ventures", status: "pending" },
];

export const DUMMY_TELEGRAM_CHATS = [
  {
    id: "-1001234567890",
    title: "Acme Corp Support",
    type: "supergroup",
    username: "acme_support",
    memberCount: 45,
  },
  {
    id: "-1001234567891",
    title: "TechStart Team",
    type: "supergroup",
    username: "techstart_team",
    memberCount: 32,
  },
  {
    id: "-1001234567892",
    title: "Global Solutions Chat",
    type: "group",
    memberCount: 18,
  },
  {
    id: "-1001234567893",
    title: "Innovation Hub",
    type: "supergroup",
    username: "innovation_hub",
    memberCount: 67,
  },
  {
    id: "-1001234567894",
    title: "Digital Ventures Group",
    type: "group",
    memberCount: 24,
  },
];

// Slack Channels (Bot Channels)
export const DUMMY_SLACK_CHANNELS = [
  {
    id: "C01ABC123",
    name: "acme-internal",
    type: "internal" as const,
    memberCount: 15,
  },
  {
    id: "C01ABC124",
    name: "acme-external",
    type: "external" as const,
    memberCount: 8,
  },
  {
    id: "C02DEF456",
    name: "techstart-internal",
    type: "internal" as const,
    memberCount: 12,
  },
  {
    id: "C03GHI789",
    name: "global-solutions",
    type: "internal" as const,
    memberCount: 20,
  },
  {
    id: "C04JKL012",
    name: "innovation-external",
    type: "external" as const,
    memberCount: 25,
  },
  {
    id: "C05MNO345",
    name: "digital-ventures",
    type: "internal" as const,
    memberCount: 18,
  },
  {
    id: "C06PQR678",
    name: "general-updates",
    type: "internal" as const,
    memberCount: 50,
  },
  {
    id: "C07STU901",
    name: "client-pulse",
    type: "internal" as const,
    memberCount: 30,
  },
];

// ============ PROMPTS DATA ============
export const DUMMY_PROMPTS = [
  {
    id: "1",
    key: "query_processing",
    name: "Query Processing",
    type: "system" as const,
    content:
      "You are an AI assistant helping users with their queries. Provide clear, accurate, and helpful responses.",
    updatedBy: "Admin",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    key: "summarization",
    name: "Summarization",
    type: "system" as const,
    content:
      "Summarize the following content in a concise way, highlighting key points.",
    updatedBy: "Admin",
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "3",
    key: "telegram_response",
    name: "Telegram Response",
    type: "user" as const,
    content: "Generate a friendly response for Telegram messages.",
    updatedBy: "User",
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: "4",
    key: "crla_digest",
    name: "CRLA Digest",
    type: "system" as const,
    content:
      "Generate a comprehensive digest for customer requests showing progress and status.",
    updatedBy: "Admin",
    updatedAt: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: "5",
    key: "pulse_report",
    name: "Pulse Report",
    type: "system" as const,
    content:
      "Create weekly pulse report highlighting important updates and metrics.",
    updatedBy: "Admin",
    updatedAt: new Date(Date.now() - 345600000).toISOString(),
  },
];

// ============ SETTINGS DATA ============
export const DUMMY_PULSE_SETTINGS = {
  cadence: "weekly" as const,
  targetChannel: "#general-updates",
  enabled: true,
};

export const DUMMY_CRLA_SETTINGS = {
  cadence: "daily" as const,
  enabled: true,
};

export const DUMMY_TELEGRAM_SETTINGS = {
  routingEnabled: true,
  mentionCheckInterval: 30,
};

// ============ TELEGRAM MENTIONS DATA ============
export const DUMMY_TELEGRAM_MENTIONS = [
  {
    id: "1",
    chatId: "-1001234567890",
    chatTitle: "Acme Corp Support",
    messageId: 1245,
    text: "@bot Can you help us with the latest feature request?",
    authorName: "John Doe",
    mentionedAt: new Date(Date.now() - 3600000).toISOString(),
    status: "pending" as const,
  },
  {
    id: "2",
    chatId: "-1001234567891",
    chatTitle: "TechStart Team",
    messageId: 5678,
    text: "@bot Please review the deployment status",
    authorName: "Jane Smith",
    mentionedAt: new Date(Date.now() - 7200000).toISOString(),
    status: "notified" as const,
  },
  {
    id: "3",
    chatId: "-1001234567892",
    chatTitle: "Global Solutions Chat",
    messageId: 9012,
    text: "@bot What's the timeline for the next release?",
    authorName: "Mike Johnson",
    mentionedAt: new Date(Date.now() - 10800000).toISOString(),
    status: "addressed" as const,
  },
  {
    id: "4",
    chatId: "-1001234567890",
    chatTitle: "Acme Corp Support",
    messageId: 1346,
    text: "@bot Need urgent help with API integration",
    authorName: "Sarah Wilson",
    mentionedAt: new Date(Date.now() - 14400000).toISOString(),
    status: "pending" as const,
  },
  {
    id: "5",
    chatId: "-1001234567893",
    chatTitle: "Innovation Hub",
    messageId: 2234,
    text: "@bot Can we schedule a demo?",
    authorName: "Robert Brown",
    mentionedAt: new Date(Date.now() - 18000000).toISOString(),
    status: "notified" as const,
  },
];

// ============ USER MAPPINGS DATA ============
export const DUMMY_USER_MAPPINGS = [
  {
    id: "1",
    email: "john.doe@example.com",
    name: "John Doe",
    telegramId: "123456789",
    telegramUsername: "@johndoe",
    slackUserId: "EngxLab",
    slackEmail: "john.doe@example.com",
    notionUserId: "notion-user-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-03-01T00:00:00.000Z"
  },
  {
    id: "2",
    email: "jane.smith@example.com",
    name: "Jane Smith",
    telegramId: "234567890",
    telegramUsername: "@janesmith",
    slackUserId: "U02DEF456",
    slackEmail: "jane.smith@example.com",
    notionUserId: "notion-user-2",
    createdAt: "2026-01-02T00:00:00.000Z",
    updatedAt: "2026-03-02T00:00:00.000Z"
  },
  {
    id: "3",
    email: "mike.johnson@example.com",
    name: "Mike Johnson",
    telegramId: "345678901",
    telegramUsername: "@mikej",
    slackUserId: "U03GHI789",
    slackEmail: "mike.johnson@example.com",
    notionUserId: undefined,
    createdAt: "2026-01-03T00:00:00.000Z",
    updatedAt: "2026-03-03T00:00:00.000Z"
  },
  {
    id: "4",
    email: "sarah.wilson@example.com",
    name: "Sarah Wilson",
    telegramId: undefined,
    telegramUsername: undefined,
    slackUserId: "U04JKL012",
    slackEmail: "sarah.wilson@example.com",
    notionUserId: "notion-user-4",
    createdAt: "2026-01-04T00:00:00.000Z",
    updatedAt: "2026-03-04T00:00:00.000Z"
  },
  {
    id: "5",
    email: "robert.brown@example.com",
    name: "Robert Brown",
    telegramId: "567890123",
    telegramUsername: "@robertb",
    slackUserId: undefined,
    slackEmail: undefined,
    notionUserId: "notion-user-5",
    createdAt: "2026-01-05T00:00:00.000Z",
    updatedAt: "2026-03-05T00:00:00.000Z"
  },
];

// Slack Members for User Mappings (matches API spec)
export const DUMMY_SLACK_MEMBERS = [
  {
    slackUserId: "U12345",
    slackEmail: "john@company.com",
    name: "John Smith",
    avatar: "https://avatars.slack-edge.com/2024-01-01/avatar1.jpg",
    isMapped: true,
    mappingId: "clxyz123",
    telegramUsername: "john_smith",
    telegramId: "123456789"
  },
  {
    slackUserId: "U67890",
    slackEmail: "sarah@company.com",
    name: "Sarah Lee",
    avatar: "https://avatars.slack-edge.com/2024-01-02/avatar2.jpg",
    isMapped: false,
    mappingId: null,
    telegramUsername: null,
    telegramId: null
  },
  {
    slackUserId: "U11111",
    slackEmail: "michael@company.com",
    name: "Michael Chen",
    avatar: "https://avatars.slack-edge.com/2024-01-03/avatar3.jpg",
    isMapped: true,
    mappingId: "clxyz124",
    telegramUsername: "michael_c",
    telegramId: "234567890"
  },
  {
    slackUserId: "U22222",
    slackEmail: "emma@company.com",
    name: "Emma Wilson",
    avatar: "https://avatars.slack-edge.com/2024-01-04/avatar4.jpg",
    isMapped: false,
    mappingId: null,
    telegramUsername: null,
    telegramId: null
  },
  {
    slackUserId: "U33333",
    slackEmail: "david@company.com",
    name: "David Brown",
    avatar: "https://avatars.slack-edge.com/2024-01-05/avatar5.jpg",
    isMapped: true,
    mappingId: "clxyz125",
    telegramUsername: "david_b",
    telegramId: "345678901"
  },
  {
    slackUserId: "U44444",
    slackEmail: "lisa@company.com",
    name: "Lisa Anderson",
    avatar: "https://avatars.slack-edge.com/2024-01-06/avatar6.jpg",
    isMapped: false,
    mappingId: null,
    telegramUsername: null,
    telegramId: null
  },
  {
    slackUserId: "U55555",
    slackEmail: "james@company.com",
    name: "James Martinez",
    avatar: "https://avatars.slack-edge.com/2024-01-07/avatar7.jpg",
    isMapped: true,
    mappingId: "clxyz126",
    telegramUsername: "james_m",
    telegramId: "456789012"
  },
  {
    slackUserId: "U66666",
    slackEmail: "olivia@company.com",
    name: "Olivia Taylor",
    avatar: "https://avatars.slack-edge.com/2024-01-08/avatar8.jpg",
    isMapped: false,
    mappingId: null,
    telegramUsername: null,
    telegramId: null
  },
  {
    slackUserId: "U77777",
    slackEmail: "william@company.com",
    name: "William Davis",
    avatar: "https://avatars.slack-edge.com/2024-01-09/avatar9.jpg",
    isMapped: true,
    mappingId: "clxyz127",
    telegramUsername: "will_d",
    telegramId: "567890123"
  },
  {
    slackUserId: "U88888",
    slackEmail: "sophia@company.com",
    name: "Sophia Garcia",
    avatar: "https://avatars.slack-edge.com/2024-01-10/avatar10.jpg",
    isMapped: false,
    mappingId: null,
    telegramUsername: null,
    telegramId: null
  },
  {
    slackUserId: "U99999",
    slackEmail: "daniel@company.com",
    name: "Daniel Rodriguez",
    avatar: "https://avatars.slack-edge.com/2024-01-11/avatar11.jpg",
    isMapped: true,
    mappingId: "clxyz128",
    telegramUsername: "dan_r",
    telegramId: "678901234"
  },
  {
    slackUserId: "U00000",
    slackEmail: "ava@company.com",
    name: "Ava Johnson",
    avatar: "https://avatars.slack-edge.com/2024-01-12/avatar12.jpg",
    isMapped: false,
    mappingId: null,
    telegramUsername: null,
    telegramId: null
  },
  {
    slackUserId: "UAAAAA",
    slackEmail: "robert@company.com",
    name: "Robert Miller",
    avatar: "https://avatars.slack-edge.com/2024-01-13/avatar13.jpg",
    isMapped: true,
    mappingId: "clxyz129",
    telegramUsername: "rob_m",
    telegramId: "789012345"
  },
  {
    slackUserId: "UBBBBBB",
    slackEmail: "mia@company.com",
    name: "Mia Thompson",
    avatar: "https://avatars.slack-edge.com/2024-01-14/avatar14.jpg",
    isMapped: false,
    mappingId: null,
    telegramUsername: null,
    telegramId: null
  },
  {
    slackUserId: "UCCCCCC",
    slackEmail: "alex@company.com",
    name: "Alex Martinez",
    avatar: "https://avatars.slack-edge.com/2024-01-15/avatar15.jpg",
    isMapped: true,
    mappingId: "clxyz130",
    telegramUsername: "alex_m",
    telegramId: "890123456"
  },
];

// ============ CRLA DATA ============
export const DUMMY_CRLA_DIGESTS = [
  {
    clientName: "Acme Corp",
    newRequests: 12,
    progressed: 8,
    shipped: 5,
    blocked: 2,
    needsAttention: true,
  },
  {
    clientName: "TechStart Inc",
    newRequests: 7,
    progressed: 15,
    shipped: 10,
    blocked: 0,
    needsAttention: false,
  },
  {
    clientName: "Global Solutions",
    newRequests: 5,
    progressed: 6,
    shipped: 8,
    blocked: 1,
    needsAttention: true,
  },
  {
    clientName: "Innovation Labs",
    newRequests: 15,
    progressed: 12,
    shipped: 6,
    blocked: 0,
    needsAttention: false,
  },
  {
    clientName: "Digital Ventures",
    newRequests: 9,
    progressed: 10,
    shipped: 12,
    blocked: 0,
    needsAttention: false,
  },
  {
    clientName: "Cloud Systems",
    newRequests: 3,
    progressed: 4,
    shipped: 2,
    blocked: 3,
    needsAttention: true,
  },
];

// ============ PULSE DATA ============
// Individual Pulse Reports for each client
export const DUMMY_PULSE_REPORTS = [
  {
    clientId: "1",
    clientName: "Acme Corp",
    summary: "Active week with 2 meetings and 4 PRs merged.",
    status: "On Track",
    statusEmoji: "🟢",
    statusReason: "Good progress this week with strong engagement",
    actionItems: [
      "Fix auth bug (John) - from meeting",
      "Update API docs - Linear",
    ],
    metrics: {
      meetings: 2,
      linearIssues: 4,
      githubPRs: 3,
      pipedriveActivities: 1,
    },
  },
  {
    clientId: "2",
    clientName: "TechStart Inc",
    summary: "Steady progress with 3 issues resolved and 2 PRs merged.",
    status: "On Track",
    statusEmoji: "🟢",
    statusReason: "Maintaining good velocity",
    actionItems: [
      "Review deployment pipeline - GitHub",
      "Schedule Q1 planning meeting",
    ],
    metrics: {
      meetings: 1,
      linearIssues: 3,
      githubPRs: 2,
      pipedriveActivities: 2,
    },
  },
  {
    clientId: "3",
    clientName: "Global Solutions",
    summary: "Slower week with delayed feature release.",
    status: "Attention",
    statusEmoji: "🟡",
    statusReason: "Feature release delayed by 2 days",
    actionItems: [
      "Investigate deployment issues - urgent",
      "Client check-in scheduled for Friday",
    ],
    metrics: {
      meetings: 1,
      linearIssues: 2,
      githubPRs: 1,
      pipedriveActivities: 0,
    },
  },
  {
    clientId: "4",
    clientName: "Innovation Labs",
    summary: "Blocked on infrastructure setup.",
    status: "Blocked",
    statusEmoji: "🔴",
    statusReason: "Waiting for AWS credentials from client",
    actionItems: [
      "Follow up on AWS access (urgent) - Mike",
      "Prepare fallback deployment plan",
    ],
    metrics: {
      meetings: 2,
      linearIssues: 1,
      githubPRs: 0,
      pipedriveActivities: 3,
    },
  },
  {
    clientId: "5",
    clientName: "Digital Ventures",
    summary: "Strong week with major milestone completed.",
    status: "On Track",
    statusEmoji: "🟢",
    statusReason: "MVP delivered ahead of schedule",
    actionItems: ["No open action items"],
    metrics: {
      meetings: 3,
      linearIssues: 8,
      githubPRs: 5,
      pipedriveActivities: 2,
    },
  },
  {
    clientId: "6",
    clientName: "Cloud Systems",
    summary: "Integration work progressing with some delays.",
    status: "Attention",
    statusEmoji: "🟡",
    statusReason: "API integration taking longer than expected",
    actionItems: [
      "Complete API integration - Sarah (due Wed)",
      "Update technical documentation",
    ],
    metrics: {
      meetings: 1,
      linearIssues: 5,
      githubPRs: 2,
      pipedriveActivities: 1,
    },
  },
  {
    clientId: "7",
    clientName: "EngXlab",
    summary: "Excellent progress with new feature rollout.",
    status: "On Track",
    statusEmoji: "🟢",
    statusReason: "All sprint goals met",
    actionItems: [
      "Prepare demo for stakeholder meeting",
      "Review security audit results",
    ],
    metrics: {
      meetings: 2,
      linearIssues: 6,
      githubPRs: 4,
      pipedriveActivities: 1,
    },
  },
];

// Pulse History Logs
export const DUMMY_PULSE_LOGS = [
  {
    id: "log_20260306_001",
    runType: "manual" as const,
    triggeredBy: "admin@company.com",
    totalClients: 7,
    summary: {
      onTrack: 4,
      attention: 2,
      blocked: 1,
    },
    postedToSlack: true,
    slackMessageTs: "1709723456.123456",
    slackChannelId: "C07STU901",
    slackError: null,
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    reports: DUMMY_PULSE_REPORTS,
  },
  {
    id: "log_20260305_001",
    runType: "scheduled" as const,
    triggeredBy: "system",
    totalClients: 7,
    summary: {
      onTrack: 5,
      attention: 1,
      blocked: 1,
    },
    postedToSlack: true,
    slackMessageTs: "1709637056.123456",
    slackChannelId: "C07STU901",
    slackError: null,
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    reports: [
      {
        clientId: "1",
        clientName: "Acme Corp",
        summary: "Productive week with multiple deliverables.",
        status: "On Track",
        statusEmoji: "🟢",
        statusReason: "All deliverables on schedule",
        actionItems: ["Complete code review - pending"],
        metrics: { meetings: 3, linearIssues: 5, githubPRs: 4, pipedriveActivities: 2 },
      },
      {
        clientId: "2",
        clientName: "TechStart Inc",
        summary: "Good progress on sprint tasks.",
        status: "On Track",
        statusEmoji: "🟢",
        statusReason: "Sprint on track",
        actionItems: ["No open action items"],
        metrics: { meetings: 2, linearIssues: 4, githubPRs: 3, pipedriveActivities: 1 },
      },
    ],
  },
  {
    id: "log_20260304_001",
    runType: "scheduled" as const,
    triggeredBy: "system",
    totalClients: 7,
    summary: {
      onTrack: 6,
      attention: 1,
      blocked: 0,
    },
    postedToSlack: true,
    slackMessageTs: "1709550656.123456",
    slackChannelId: "C07STU901",
    slackError: null,
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    reports: [],
  },
  {
    id: "log_20260303_001",
    runType: "manual" as const,
    triggeredBy: "john.doe@company.com",
    totalClients: 6,
    summary: {
      onTrack: 4,
      attention: 2,
      blocked: 0,
    },
    postedToSlack: false,
    slackMessageTs: null,
    slackChannelId: null,
    slackError: null,
    createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    reports: [],
  },
  {
    id: "log_20260302_001",
    runType: "scheduled" as const,
    triggeredBy: "system",
    totalClients: 7,
    summary: {
      onTrack: 3,
      attention: 3,
      blocked: 1,
    },
    postedToSlack: true,
    slackMessageTs: "1709377856.123456",
    slackChannelId: "C07STU901",
    slackError: "Failed to post: Rate limit exceeded",
    createdAt: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
    reports: [],
  },
  {
    id: "log_20260301_001",
    runType: "scheduled" as const,
    triggeredBy: "system",
    totalClients: 7,
    summary: {
      onTrack: 5,
      attention: 2,
      blocked: 0,
    },
    postedToSlack: true,
    slackMessageTs: "1709291456.123456",
    slackChannelId: "C07STU901",
    slackError: null,
    createdAt: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
    reports: [],
  },
  {
    id: "log_20260228_001",
    runType: "manual" as const,
    triggeredBy: "admin@company.com",
    totalClients: 6,
    summary: {
      onTrack: 6,
      attention: 0,
      blocked: 0,
    },
    postedToSlack: true,
    slackMessageTs: "1709205056.123456",
    slackChannelId: "C07STU901",
    slackError: null,
    createdAt: new Date(Date.now() - 518400000).toISOString(), // 6 days ago
    reports: [],
  },
];

// ============ USERS DATA ============
export const DUMMY_USERS = [
  {
    id: "user_1",
    name: "Admin User",
    email: "admin@example.com",
    role: "ADMIN" as const,
    provider: "GOOGLE" as const,
    createdAt: new Date(Date.now() - 31536000000).toISOString(), // 1 year ago
  },
  {
    id: "user_2",
    name: "John Doe",
    email: "john.doe@example.com",
    role: "USER" as const,
    provider: "GOOGLE" as const,
    createdAt: new Date(Date.now() - 15552000000).toISOString(), // 6 months ago
  },
  {
    id: "user_3",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    role: "ADMIN" as const,
    provider: "EMAIL" as const,
    createdAt: new Date(Date.now() - 7776000000).toISOString(), // 3 months ago
  },
  {
    id: "user_4",
    name: "Mike Johnson",
    email: "mike.johnson@example.com",
    role: "USER" as const,
    provider: "GOOGLE" as const,
    createdAt: new Date(Date.now() - 2592000000).toISOString(), // 1 month ago
  },
  {
    id: "user_5",
    name: "Sarah Wilson",
    email: "sarah.wilson@example.com",
    role: "USER" as const,
    provider: "EMAIL" as const,
    createdAt: new Date(Date.now() - 1296000000).toISOString(), // 15 days ago
  },
  {
    id: "user_6",
    name: "Robert Brown",
    email: "robert.brown@example.com",
    role: "USER" as const,
    provider: "GOOGLE" as const,
    createdAt: new Date(Date.now() - 604800000).toISOString(), // 7 days ago
  },
  {
    id: "user_7",
    name: "Emily Davis",
    email: "emily.davis@example.com",
    role: "ADMIN" as const,
    provider: "GOOGLE" as const,
    createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
  },
  {
    id: "user_8",
    name: "David Martinez",
    email: "david.martinez@example.com",
    role: "USER" as const,
    provider: "EMAIL" as const,
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
  },
  {
    id: "user_9",
    name: "Lisa Anderson",
    email: "lisa.anderson@example.com",
    role: "USER" as const,
    provider: "GOOGLE" as const,
    createdAt: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
  },
  {
    id: "user_10",
    name: null,
    email: "anonymous@example.com",
    role: "USER" as const,
    provider: "EMAIL" as const,
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  },
];

// ============ HELPER FUNCTIONS ============

/**
 * Calculate stats for prompts based on dummy data
 */
export const getDummyPromptStats = (filterType: "all" | "system" | "user") => {
  const filtered =
    filterType === "all"
      ? DUMMY_PROMPTS
      : DUMMY_PROMPTS.filter((p) => p.type === filterType);

  return {
    prompts: filtered,
    stats: {
      total: DUMMY_PROMPTS.length,
      system: DUMMY_PROMPTS.filter((p) => p.type === "system").length,
      user: DUMMY_PROMPTS.filter((p) => p.type === "user").length,
    },
  };
};

/**
 * Calculate stats for telegram mentions based on dummy data
 */
export const getDummyTelegramStats = (filterStatus: "all" | "pending" | "notified" | "addressed") => {
  const filtered =
    filterStatus === "all"
      ? DUMMY_TELEGRAM_MENTIONS
      : DUMMY_TELEGRAM_MENTIONS.filter((m) => m.status === filterStatus);

  return {
    mentions: filtered,
    stats: {
      total: DUMMY_TELEGRAM_MENTIONS.length,
      pending: DUMMY_TELEGRAM_MENTIONS.filter((m) => m.status === "pending").length,
      notified: DUMMY_TELEGRAM_MENTIONS.filter((m) => m.status === "notified").length,
      addressed: DUMMY_TELEGRAM_MENTIONS.filter((m) => m.status === "addressed").length,
    },
  };
};

/**
 * Calculate stats for user mappings based on dummy data
 */
export const getDummyUserMappingStats = () => {
  const mapped = DUMMY_SLACK_MEMBERS.filter((m) => m.isMapped).length;
  const unmapped = DUMMY_SLACK_MEMBERS.filter((m) => !m.isMapped).length;
  
  return {
    mappings: DUMMY_USER_MAPPINGS,
    stats: {
      total: DUMMY_SLACK_MEMBERS.length,
      withTelegram: mapped,
      withSlack: DUMMY_SLACK_MEMBERS.length,
      withNotion: DUMMY_USER_MAPPINGS.filter((m) => m.notionUserId).length,
      complete: mapped,
      incomplete: unmapped,
    },
  };
};

/**
 * Get Slack members for user mappings (main admin table)
 */
export const getDummySlackMembers = (searchQuery?: string) => {
  let members = DUMMY_SLACK_MEMBERS;
  
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    members = members.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.slackEmail.toLowerCase().includes(query) ||
        (m.telegramUsername && m.telegramUsername.toLowerCase().includes(query))
    );
  }
  
  const mapped = members.filter((m) => m.isMapped).length;
  const unmapped = members.filter((m) => !m.isMapped).length;
  
  return {
    success: true,
    total: members.length,
    mapped,
    unmapped,
    members,
  };
};

/**
 * Import Slack members (simulates POST /api/user-mappings/import-slack)
 */
export const getDummyImportSlackResult = () => {
  return {
    success: true,
    message: "Slack members imported. Now add Telegram usernames via the UI.",
    results: {
      created: 12,
      updated: 3,
      skipped: 0,
      errors: [],
    },
  };
};

/**
 * Search user mappings
 */
export const getDummyUserMappingsSearch = (searchQuery: string) => {
  const query = searchQuery.toLowerCase();
  const mappings = DUMMY_USER_MAPPINGS.filter(
    (m) =>
      m.name?.toLowerCase().includes(query) ||
      m.email.toLowerCase().includes(query) ||
      (m.telegramUsername && m.telegramUsername.toLowerCase().includes(query))
  );
  
  return {
    success: true,
    count: mappings.length,
    mappings,
  };
};

/**
 * Get dummy pulse logs with pagination
 */
export const getDummyPulseLogs = (params?: { limit?: number; offset?: number }) => {
  const limit = params?.limit || 20;
  const offset = params?.offset || 0;
  const logs = DUMMY_PULSE_LOGS.slice(offset, offset + limit);

  return {
    success: true,
    total: DUMMY_PULSE_LOGS.length,
    limit,
    offset,
    hasMore: offset + limit < DUMMY_PULSE_LOGS.length,
    logs,
  };
};

/**
 * Get a single pulse log by ID
 */
export const getDummyPulseLogById = (id: string) => {
  const log = DUMMY_PULSE_LOGS.find((l) => l.id === id);
  return log
    ? { success: true, log }
    : { success: false, error: "Log not found" };
};

/**
 * Calculate stats for pulse logs
 */
export const getDummyPulseStats = () => {
  const latestLog = DUMMY_PULSE_LOGS[0];
  return {
    totalRuns: DUMMY_PULSE_LOGS.length,
    latestRun: latestLog,
    summary: latestLog.summary,
    postedCount: DUMMY_PULSE_LOGS.filter((l) => l.postedToSlack).length,
    failedCount: DUMMY_PULSE_LOGS.filter((l) => l.slackError).length,
  };
};
