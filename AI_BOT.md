# CityAssist AI Bot — How It Works

## Overview

CityAssist is a multi-tenant civic AI chatbot that helps city residents get answers about city services, departments, permits, utilities, and more. It combines an AI-powered chat widget with an admin dashboard for managing conversations, departments, and settings.

---

## AI System

### Model & Provider

- **Provider**: [Groq](https://groq.com/)
- **Model**: `llama-3.3-70b-versatile`
- **Temperature**: `0.3` (conservative, factual responses)
- **Max Tokens**: `1024`
- **Response Format**: Enforced JSON (`response_format: { type: "json_object" }`)

### API Endpoint

All AI interactions go through a single Next.js API route:

```
POST /api/chat
```

**Request body:**

```json
{
  "messages": [
    { "role": "user", "content": "How do I get a building permit?" }
  ]
}
```

The full conversation history is sent with each request so the AI maintains context across the session.

**Source file:** `src/app/api/chat/route.ts`

### System Prompt

The AI is instructed to act as **CityAssist**, a civic government chatbot. It returns structured JSON with the following fields:

| Field              | Description                                                                 |
| ------------------ | --------------------------------------------------------------------------- |
| `message`          | The friendly response text shown to the user                                |
| `intent`           | One of: `information_request`, `process_guidance`, `complaint_report`, `emergency`, `out_of_scope` |
| `department`       | Routed department: Public Works, Building Services, Parks & Recreation, Code Enforcement, Utilities, or City Clerk |
| `confidence`       | A score from `0` to `1` indicating how confident the AI is in its answer    |
| `resolved`         | `true` only when the question is fully answered with no follow-up needed    |
| `needs_escalation` | `true` when the issue requires human intervention                           |

### Escalation Rules

The AI automatically escalates a conversation when:

- The resident files a **complaint** or reports an **emergency**
- The AI's confidence score is **below 0.78**
- The resident explicitly **asks to speak with a person**

### Message Flow

```
User types message
       |
       v
ChatWidget component stores message locally
       |
       v
POST /api/chat (with full conversation history)
       |
       v
Groq API processes with system prompt
       |
       v
Structured JSON response returned
       |
       v
Response parsed, displayed in widget
       |
       v
Conversation status auto-updated
(escalated if needs_escalation=true, resolved if resolved=true)
```

---

## Routing

### Framework

The app uses **Next.js 14 App Router** with file-system-based routing.

### Multi-Tenant URL Structure

All dashboard routes are scoped by a dynamic `[tenant_slug]` parameter:

```
/                                                → Landing page (sign in / sign up)
/dashboard/[tenant_slug]/conversations           → Conversation inbox
/dashboard/[tenant_slug]/departments             → Department configuration
/dashboard/[tenant_slug]/knowledge-base          → Documents and FAQs
/dashboard/[tenant_slug]/settings                → Widget branding and config
/dashboard/[tenant_slug]/analytics               → Metrics and dashboards
```

### Authentication & Middleware

Authentication is handled by **Clerk** with multi-tenant (organization) support.

**Middleware** (`src/middleware.ts`) runs on every `/dashboard/*` request and:

1. Checks if the user is signed in — redirects to sign-in if not
2. Extracts the `tenant_slug` from the URL
3. Validates the user belongs to that organization
4. Redirects to the correct org dashboard if there's a mismatch

### Navigation

The dashboard layout (`src/app/dashboard/[tenant_slug]/layout.tsx`) renders a **sidebar** with five navigation items:

- Knowledge Base
- Departments
- Conversations
- Analytics
- Settings

Navigation links are dynamically generated using the current tenant slug. An `OrganizationSwitcher` component allows users who belong to multiple organizations to switch between them.

### Landing Page Logic

The root page (`src/app/page.tsx`) handles three states:

| State                          | Behavior                                              |
| ------------------------------ | ----------------------------------------------------- |
| Not signed in                  | Shows sign-in and sign-up buttons                     |
| Signed in with an active org   | Auto-redirects to `/dashboard/{orgSlug}/conversations` |
| Signed in but no org assigned  | Shows a "waiting for access" message                  |

---

## Chat Widget

The chat widget (`src/components/ChatWidget.tsx`) is an embeddable floating component that:

- Appears as a button in the bottom corner of the page (position configurable)
- Opens a chat window (380px wide, up to 520px tall by default)
- Displays a configurable welcome message and branding
- Sends messages to `/api/chat` with the full conversation history
- Auto-creates a conversation record on the first message
- Updates conversation status based on AI response flags

Admins can customize the widget via the Settings page:

- City name, primary color, logo URL
- Welcome message
- Position (bottom-left or bottom-right)
- Auto-open behavior
- Show/hide department badge on responses

An embed code snippet is provided in settings for adding the widget to external websites.

---

## Key Files

| File                                          | Purpose                          |
| --------------------------------------------- | -------------------------------- |
| `src/app/api/chat/route.ts`                   | AI chat endpoint (Groq integration) |
| `src/app/api/upload/route.ts`                 | File upload endpoint             |
| `src/components/ChatWidget.tsx`               | Chat widget UI and logic         |
| `src/middleware.ts`                            | Auth guard and tenant routing    |
| `src/app/dashboard/[tenant_slug]/layout.tsx`  | Dashboard layout and navigation  |
| `src/app/page.tsx`                            | Landing page and auth flow       |
| `src/lib/conversation-store.tsx`              | Conversation state (localStorage) |
| `src/lib/settings-store.tsx`                  | Widget settings state            |
| `src/lib/department-store.tsx`                | Department configuration state   |
| `src/lib/types.ts`                            | TypeScript interfaces            |

---

## Data Storage

All application data is stored **client-side in localStorage**, scoped by tenant slug for multi-tenancy. There is no backend database. State is managed through React Context providers:

- `ConversationProvider` — conversations and messages
- `SettingsProvider` — widget customization
- `DepartmentProvider` — department configurations
- `MacroProvider` — response templates

---

## Tech Stack

| Layer      | Technology                       |
| ---------- | -------------------------------- |
| Framework  | Next.js 14.2 (App Router)       |
| Language   | TypeScript                       |
| UI Library | Chakra UI 2.8                    |
| Auth       | Clerk (multi-tenant)             |
| AI         | Groq SDK → Llama 3.3 70B        |
| Storage    | localStorage (client-side)       |
