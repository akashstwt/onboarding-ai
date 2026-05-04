# 🌐 Backend API Documentation for Frontend Integration

> **Purpose:** Complete API reference for building the **Web UI MVP** (Chat-style interface)

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Base URL & Authentication](#base-url--authentication)
3. [Core APIs](#core-apis)
4. [Error Handling](#error-handling)
5. [Rate Limits](#rate-limits)
6. [Webhooks (for future)](#webhooks-for-future)

---

## 1. Overview

The backend provides REST APIs for:
- **RAG Query** - Chat-style Q&A with context awareness
- **Client Management** - List and retrieve client data
- **Pulse Reports** - Weekly client summaries
- **Customer Requests** - Feedback lifecycle management
- **AI Configuration** - Switch AI providers dynamically

**Tech Stack:**
- Node.js + Express + TypeScript
- PostgreSQL (via Prisma ORM)
- Redis (BullMQ for queues)
- Pinecone (vector search)
- Gemini/OpenAI/Claude/Grok (AI providers)

---

## 2. Base URL & Authentication

### Base URL

```
Production:  https://api.yourdomain.com
Development: http://localhost:3000
```

### Authentication

**Current:** No authentication (internal use)

**Future:** Add API keys or JWT tokens:
```http
Authorization: Bearer <your-token>
```

---

## 3. Core APIs

### 3.1 RAG Query API (Chat Interface)

**Endpoint:** `POST /api/query`

**Purpose:** Main chat interface for asking questions about clients, meetings, issues, etc.

**Request:**
```json
{
  "query": "What happened with Acme Corp this week?",
  "clientId": "optional-client-id-to-filter",
  "sessionId": "optional-session-id-for-memory"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "answer": "Acme Corp had 2 meetings this week. On Jan 19, they discussed JWT authentication timeline. Sarah Johnson committed to delivering by Jan 27. They opened 3 Linear issues focusing on OAuth integration and error handling...",
    "sources": [
      {
        "id": "meeting-abc123",
        "score": 0.92,
        "title": "Acme Corp - Project Kickoff",
        "type": "meeting",
        "date": "2024-01-19T10:00:00Z"
      },
      {
        "id": "linear-issue-xyz789",
        "score": 0.87,
        "title": "Implement OAuth Support",
        "type": "linear-issue",
        "date": "2024-01-20T14:30:00Z"
      }
    ],
    "sessionId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**Field Descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| `query` | string | User's question (required) |
| `clientId` | string | Filter results by specific client (optional) |
| `sessionId` | string | Maintain conversation memory across queries (optional, auto-generated if missing) |
| `answer` | string | AI-generated response |
| `sources` | array | Documents used to generate answer |
| `sources[].id` | string | Unique document ID |
| `sources[].score` | number | Relevance score (0-1) |
| `sources[].title` | string | Human-readable title |
| `sources[].type` | string | `meeting`, `linear-issue`, `github-pr`, `pipedrive-activity`, etc. |
| `sources[].date` | string | ISO 8601 timestamp |

**Use Cases:**

1. **Simple Query**
```javascript
fetch('/api/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'What meetings happened this week?'
  })
})
```

2. **Client-Specific Query**
```javascript
fetch('/api/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'What are the open Linear issues?',
    clientId: 'client-abc123'
  })
})
```

3. **Conversation with Memory**
```javascript
// First message
const res1 = await fetch('/api/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'What did we discuss in the last meeting?'
  })
})
const { sessionId } = await res1.json()

// Follow-up (uses context)
fetch('/api/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'What were the action items?',
    sessionId: sessionId
  })
})
```

**Error Responses:**
```json
{
  "success": false,
  "error": "query is required and must be a non-empty string"
}
```

---

### 3.2 Client Management APIs

#### 3.2.1 List Active Clients

**Endpoint:** `GET /api/clients`

**Purpose:** Get all active clients for dropdown/filters

**Request:**
```http
GET /api/clients?status=active&limit=50
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | `active` | Filter by status: `active`, `building`, `live`, `closed` |
| `limit` | number | `50` | Max results to return |
| `offset` | number | `0` | Pagination offset |

**Response:**
```json
{
  "success": true,
  "data": {
    "clients": [
      {
        "id": "client-abc123",
        "name": "Acme Corp",
        "status": "active",
        "owner": "Sarah Johnson",
        "contractValue": 50000,
        "startDate": "2024-12-01",
        "notionPageId": "abc123-notion-page-id"
      },
      {
        "id": "client-xyz789",
        "name": "TechCo",
        "status": "live",
        "owner": "Mike Chen",
        "contractValue": 125000,
        "startDate": "2024-11-15",
        "notionPageId": "xyz789-notion-page-id"
      }
    ],
    "total": 10,
    "limit": 50,
    "offset": 0
  }
}
```

**Use Case:**
```javascript
// Populate client dropdown
const res = await fetch('/api/clients?status=active')
const { data } = await res.json()

const options = data.clients.map(c => ({
  value: c.id,
  label: c.name
}))
```

---

#### 3.2.2 Get Client Details

**Endpoint:** `GET /api/clients/:clientId`

**Purpose:** Get detailed info about a specific client

**Request:**
```http
GET /api/clients/client-abc123
```

**Response:**
```json
{
  "success": true,
  "data": {
    "client": {
      "id": "client-abc123",
      "name": "Acme Corp",
      "status": "active",
      "owner": "Sarah Johnson",
      "contractValue": 50000,
      "startDate": "2024-12-01",
      "industry": "Engineering",
      "techStack": ["Node.js", "React", "PostgreSQL"],
      "notionPageId": "abc123-notion-page-id",
      "pipedriveDealId": 123,
      "metadata": {
        "functionOwner": "Engineering",
        "customerSegment": "Supply",
        "productInterest": "API Platform, Authentication",
        "mauRange": "100k-1m",
        "linearProjectId": "proj-abc123"
      },
      "stats": {
        "meetings": 5,
        "linearIssues": 8,
        "githubPRs": 3,
        "customerRequests": 2
      }
    }
  }
}
```

---

### 3.3 Pulse Report APIs

#### 3.3.1 Generate Pulse for All Clients

**Endpoint:** `POST /api/pulse/generate`

**Purpose:** Generate weekly pulse report for all active clients

**Request:**
```http
POST /api/pulse/generate?post=false
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `post` | boolean | `false` | If `true`, posts to Slack |
| `slack` | boolean | `false` | Alias for `post` |

**Response:**
```json
{
  "success": true,
  "message": "Pulse generated (not posted to Slack)",
  "reportsGenerated": 3,
  "reports": [
    {
      "clientName": "Acme Corp",
      "summary": "Strong progress this week. JWT authentication merged, OAuth integration started. 2 meetings completed with action items captured.",
      "status": "On Track",
      "statusReason": "Good progress this week",
      "actionItems": [
        "Implement OAuth integration (Sarah Johnson) - from meeting",
        "Review architecture proposals (Mike Chen) - Linear",
        "Setup staging environment (DevOps) - Linear"
      ],
      "metrics": {
        "meetings": 2,
        "linearIssues": 3,
        "githubPRs": 2,
        "pipedriveActivities": 1
      }
    },
    {
      "clientName": "TechCo",
      "summary": "Mobile app launch preparations underway. Push notifications completed. Analytics dashboard in final QA.",
      "status": "On Track",
      "statusReason": "Good progress this week",
      "actionItems": [
        "Submit app to App Store (Mike Chen)",
        "Recruit beta testers (Lisa Park)"
      ],
      "metrics": {
        "meetings": 1,
        "linearIssues": 4,
        "githubPRs": 3,
        "pipedriveActivities": 2
      }
    },
    {
      "clientName": "StartupXYZ",
      "summary": "No activity this week",
      "status": "Blocked",
      "statusReason": "No activity this week",
      "actionItems": ["No open action items"],
      "metrics": {
        "meetings": 0,
        "linearIssues": 0,
        "githubPRs": 0,
        "pipedriveActivities": 0
      }
    }
  ]
}
```

**Status Values:**
- `On Track` 🟢 - Good progress, no blockers
- `Attention` 🟡 - Issues detected, needs review
- `Blocked` 🔴 - Critical blockers or no activity

**Use Case:**
```javascript
// Generate and display pulse
const res = await fetch('/api/pulse/generate', { method: 'POST' })
const { reports } = await res.json()

reports.forEach(report => {
  console.log(`${report.clientName}: ${report.status}`)
  console.log(report.summary)
})
```

---

#### 3.3.2 Generate Pulse for Single Client

**Endpoint:** `POST /api/pulse/generate/:clientId`

**Purpose:** Generate pulse for specific client

**Request:**
```http
POST /api/pulse/generate/client-abc123
```

**Response:**
```json
{
  "success": true,
  "message": "Pulse generated for client",
  "report": {
    "clientName": "Acme Corp",
    "summary": "...",
    "status": "On Track",
    "statusReason": "...",
    "actionItems": [...],
    "metrics": {...}
  }
}
```

---

### 3.4 Customer Request APIs

#### 3.4.1 Create Customer Request (Dashboard)

**Endpoint:** `POST /api/customer-requests`

**Purpose:** Create customer request from dashboard submission

**Request:**
```json
{
  "title": "OAuth Support for Google",
  "description": "Customer needs OAuth login with Google for their enterprise users",
  "clientName": "Acme Corp",
  "priority": "high",
  "dashboardRequestId": "dash-req-12345",
  "submittedBy": "john@acmecorp.com"
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | ✅ | Request title |
| `description` | string | ✅ | Detailed description |
| `clientName` | string | ✅ | Client name (must exist in DB) |
| `priority` | string | ❌ | `low`, `medium`, `high` (default: `medium`) |
| `dashboardRequestId` | string | ✅ | Unique ID from dashboard |
| `submittedBy` | string | ❌ | Email of submitter |

**Response:**
```json
{
  "success": true,
  "requestId": "req-abc123",
  "alreadyExists": false
}
```

**Error Response:**
```json
{
  "error": "Missing required fields: title, description, clientName, dashboardRequestId"
}
```

---

#### 3.4.2 List Customer Requests

**Endpoint:** `GET /api/customer-requests`

**Purpose:** Get customer requests for a client

**Request:**
```http
GET /api/customer-requests?clientId=client-abc123&status=pending
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientId` | string | ✅ | Filter by client |
| `status` | string | ❌ | Filter by status: `pending`, `in-progress`, `fulfilled` |

**Response:**
```json
{
  "success": true,
  "count": 2,
  "requests": [
    {
      "id": "req-abc123",
      "title": "OAuth Support for Google",
      "description": "Customer needs OAuth login...",
      "priority": "high",
      "status": "pending",
      "source": "dashboard",
      "clientId": "client-abc123",
      "clientName": "Acme Corp",
      "dashboardRequestId": "dash-req-12345",
      "submittedBy": "john@acmecorp.com",
      "submittedAt": "2024-01-20T10:00:00Z",
      "linearIssueId": null,
      "notionPageId": "notion-page-id",
      "createdAt": "2024-01-20T10:00:00Z",
      "updatedAt": "2024-01-20T10:00:00Z"
    },
    {
      "id": "req-xyz789",
      "title": "Kafka Integration",
      "description": "Need real-time event streaming...",
      "priority": "medium",
      "status": "in-progress",
      "source": "linear",
      "clientId": "client-abc123",
      "clientName": "Acme Corp",
      "linearIssueId": "issue-kafka-123",
      "notionPageId": "notion-page-id-2",
      "createdAt": "2024-01-18T14:00:00Z",
      "updatedAt": "2024-01-21T09:00:00Z"
    }
  ]
}
```

---

#### 3.4.3 Get Customer Request by ID

**Endpoint:** `GET /api/customer-requests/:id`

**Request:**
```http
GET /api/customer-requests/req-abc123
```

**Response:**
```json
{
  "success": true,
  "request": {
    "id": "req-abc123",
    "title": "OAuth Support for Google",
    "description": "Customer needs OAuth login...",
    "priority": "high",
    "status": "pending",
    "source": "dashboard",
    "client": {
      "id": "client-abc123",
      "name": "Acme Corp",
      "notionPageId": "notion-client-page"
    },
    "linearIssue": null,
    "notionPageId": "notion-request-page",
    "submittedBy": "john@acmecorp.com",
    "submittedAt": "2024-01-20T10:00:00Z",
    "fulfilledAt": null,
    "fulfilledBy": null,
    "notificationSent": false,
    "createdAt": "2024-01-20T10:00:00Z",
    "updatedAt": "2024-01-20T10:00:00Z"
  }
}
```

---

#### 3.4.4 Mark Request as Fulfilled

**Endpoint:** `PATCH /api/customer-requests/:id/fulfill`

**Purpose:** Manually mark request as fulfilled (or auto-detected by system)

**Request:**
```json
{
  "fulfilledBy": "engineering-team"
}
```

**Response:**
```json
{
  "success": true,
  "request": {
    "id": "req-abc123",
    "status": "fulfilled",
    "fulfilledAt": "2024-01-21T10:00:00Z",
    "fulfilledBy": "engineering-team",
    "notificationSent": true,
    "notifiedAt": "2024-01-21T10:00:05Z"
  }
}
```

**Side Effects:**
1. ✅ Updates status to `fulfilled`
2. ✅ Posts Slack notification
3. ✅ Updates Notion page
4. ✅ Updates Client Hub

---

#### 3.4.5 Auto-Detect Fulfilled Requests

**Endpoint:** `POST /api/customer-requests/detect-fulfilled`

**Purpose:** Trigger automated detection of fulfilled requests (checks if linked Linear issues are "Done")

**Request:**
```http
POST /api/customer-requests/detect-fulfilled
```

**Response:**
```json
{
  "success": true,
  "processed": 15,
  "fulfilled": 3
}
```

**Use Case:**
```javascript
// Run daily to auto-detect fulfilled requests
setInterval(async () => {
  const res = await fetch('/api/customer-requests/detect-fulfilled', {
    method: 'POST'
  })
  const { fulfilled } = await res.json()
  console.log(`Auto-detected ${fulfilled} fulfilled requests`)
}, 24 * 60 * 60 * 1000) // Daily
```

---

### 3.5 AI Configuration API

#### 3.5.1 Get Current AI Provider

**Endpoint:** `GET /api/ai/config`

**Purpose:** Get currently active AI provider

**Response:**
```json
{
  "success": true,
  "provider": "gemini"
}
```

---

#### 3.5.2 Switch AI Provider

**Endpoint:** `POST /api/ai/config`

**Purpose:** Dynamically switch AI provider

**Request:**
```json
{
  "provider": "openai",
  "apiKey": "sk-your-api-key",
  "model": "gpt-4o"
}
```

**Providers:**
- `gemini` (default: `gemini-2.5-flash`)
- `openai` (default: `gpt-4o`)
- `claude` (default: `claude-sonnet-4-20250514`)
- `grok` (default: `grok-beta`)

**Response:**
```json
{
  "success": true,
  "message": "Switched to openai",
  "config": {
    "provider": "openai",
    "model": "gpt-4o"
  }
}
```

---

### 3.6 Notion Sync Logs API

#### 3.6.1 Get Sync Logs

**Endpoint:** `GET /api/notion/logs`

**Purpose:** View Notion webhook sync history

**Request:**
```http
GET /api/notion/logs?limit=20&status=failed&databaseType=clients
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Max results (default: 20) |
| `status` | string | Filter: `success`, `failed`, `pending` |
| `databaseType` | string | Filter: `clients`, `meetings`, `decisions`, `tasks` |

**Response:**
```json
{
  "success": true,
  "logs": [
    {
      "id": "log-abc123",
      "databaseType": "clients",
      "notionPageId": "page-id-123",
      "action": "updated",
      "changedFields": ["Status", "Owner"],
      "syncedToDb": true,
      "syncedToVector": true,
      "errorMessage": null,
      "createdAt": "2024-01-21T10:00:00Z",
      "processedAt": "2024-01-21T10:00:05Z"
    }
  ],
  "stats": [
    { "type": "clients", "count": 15 },
    { "type": "meetings", "count": 8 }
  ]
}
```

---

#### 3.6.2 Get Sync Stats

**Endpoint:** `GET /api/notion/stats`

**Purpose:** Get overall Notion sync health

**Response:**
```json
{
  "success": true,
  "stats": {
    "total": 150,
    "successful": 145,
    "failed": 5,
    "pending": 0,
    "last24Hours": 25,
    "successRate": "96.67"
  },
  "byDatabase": [
    { "type": "clients", "count": 50 },
    { "type": "meetings", "count": 80 },
    { "type": "decisions", "count": 15 },
    { "type": "tasks", "count": 5 }
  ],
  "recentErrors": [
    {
      "id": "log-error-1",
      "databaseType": "meetings",
      "errorMessage": "Notion page archived",
      "createdAt": "2024-01-20T15:30:00Z"
    }
  ]
}
```

---

## 4. Error Handling

### Standard Error Response

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| `200` | Success | Request processed successfully |
| `201` | Created | Resource created successfully |
| `400` | Bad Request | Missing required fields |
| `404` | Not Found | Client/request not found |
| `500` | Internal Error | Server error, check logs |

### Common Errors

**1. Missing Required Fields**
```json
{
  "success": false,
  "error": "Missing required fields: title, description, clientName"
}
```

**2. Client Not Found**
```json
{
  "success": false,
  "error": "Client \"Unknown Corp\" not found"
}
```

**3. Invalid Query**
```json
{
  "success": false,
  "error": "query is required and must be a non-empty string"
}
```

**4. Server Error**
```json
{
  "success": false,
  "error": "An error occurred while processing the query. Please try again later."
}
```

---

## 5. Rate Limits

**Current:** No rate limits (internal use)

**Future:** 
- 100 requests/minute per user
- 1000 requests/hour per user

**Rate Limit Response:**
```json
{
  "success": false,
  "error": "Rate limit exceeded. Try again in 60 seconds.",
  "retryAfter": 60
}
```

---

## 6. Webhooks (for future)

**Not currently used by frontend**, but available for real-time updates:

### Available Webhooks

| Webhook | URL | Purpose |
|---------|-----|---------|
| Read.ai | `/read-ai/webhook` | Meeting transcripts |
| Linear | `/linear/webhook` | Issue updates |
| Pipedrive | `/pipedrive/webhook` | Deal/activity updates |
| GitHub | `/github/webhook` | PR/comment events |
| Notion | `/api/notion/webhook` | Page updates |

---

## 📦 Frontend Integration Examples

### React Query Setup

```typescript
import { useQuery, useMutation } from '@tanstack/react-query'

// Query API
export function useRAGQuery() {
  return useMutation({
    mutationFn: async ({ query, clientId, sessionId }) => {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, clientId, sessionId })
      })
      return res.json()
    }
  })
}

// List clients
export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const res = await fetch('/api/clients')
      return res.json()
    }
  })
}

// Get pulse
export function useGeneratePulse() {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/pulse/generate', { method: 'POST' })
      return res.json()
    }
  })
}
```

---

### Chat Component Example

```tsx
import { useState } from 'react'
import { useRAGQuery } from './api'

export function ChatInterface() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState(null)
  
  const { mutate: query, isLoading } = useRAGQuery()
  
  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: input }])
    
    // Query API
    query({
      query: input,
      sessionId
    }, {
      onSuccess: (data) => {
        setSessionId(data.data.sessionId)
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.data.answer,
          sources: data.data.sources
        }])
      }
    })
    
    setInput('')
  }
  
  return (
    <div className="chat-interface">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <div className="content">{msg.content}</div>
            {msg.sources && (
              <div className="sources">
                <strong>Sources:</strong>
                {msg.sources.map(s => (
                  <div key={s.id}>{s.title} ({s.type})</div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask anything..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Thinking...' : 'Send'}
        </button>
      </form>
    </div>
  )
}
```

---

## 🎯 Priority APIs for Web UI MVP

### Must-Have (Week 3)
1. ✅ **`POST /api/query`** - Core chat functionality
2. ✅ **`GET /api/clients`** - Client filter dropdown
3. ✅ **`POST /api/pulse/generate`** - Weekly summaries

### Nice-to-Have (Week 4)
4. ✅ **`GET /api/customer-requests`** - View pending requests
5. ✅ **`GET /api/notion/stats`** - System health dashboard

### Future Enhancements
6. ✅ Real-time updates via WebSocket
7. ✅ Authentication & user management
8. ✅ Advanced filters (date range, source type)
9. ✅ Export to PDF/CSV

---

## 📞 Support & Questions

**For API issues or questions:**
- Create ticket in Linear (tag: `API`, `Frontend`)
- Response SLA: ≤ 24h
- Weekly sync: Wednesday feedback, Friday demo

**API Stability:**
- No breaking changes without notice
- Backward compatible updates only
- Version headers for future breaking changes

vercel connection updated testing push
