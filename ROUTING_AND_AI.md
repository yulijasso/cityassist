# How Routing and the AI Chatbot Work

## Table of Contents

- [Routing](#routing)
  - [Framework](#framework)
  - [URL Structure](#url-structure)
  - [Middleware — Authentication and Tenant Validation](#middleware--authentication-and-tenant-validation)
  - [Landing Page Logic](#landing-page-logic)
  - [Dashboard Navigation](#dashboard-navigation)
- [AI Chatbot](#ai-chatbot)
  - [What Powers the AI](#what-powers-the-ai)
  - [How a Message Gets Processed](#how-a-message-gets-processed)
  - [The System Prompt](#the-system-prompt)
  - [Structured JSON Response](#structured-json-response)
  - [Intent Classification](#intent-classification)
  - [Department Routing](#department-routing)
  - [Escalation Logic](#escalation-logic)
  - [Conversation Status Updates](#conversation-status-updates)
  - [Error Handling](#error-handling)

---

## Routing

### Framework

CityAssist uses the **Next.js 14 App Router**, which maps the file system directly to URL routes. Each folder under `src/app/` becomes a route segment, and `page.tsx` files inside those folders define the page content.

### URL Structure

The app is multi-tenant — every city organization gets its own isolated space under a unique slug:

```
/                                              Landing page
/dashboard/[tenant_slug]/conversations         Conversation inbox
/dashboard/[tenant_slug]/departments           Department management
/dashboard/[tenant_slug]/knowledge-base        Documents and FAQs
/dashboard/[tenant_slug]/analytics             Usage metrics
/dashboard/[tenant_slug]/settings              Widget branding and config
```

The `[tenant_slug]` is a **dynamic route parameter** — it could be `city-of-austin`, `springfield-gov`, etc. Next.js captures this value and makes it available via `useParams()`.

### Middleware — Authentication and Tenant Validation

**File:** `src/middleware.ts`

Every request to `/dashboard/*` passes through Clerk middleware before reaching the page. The middleware does three things:

1. **Checks authentication** — If the user is not signed in, they are redirected to the landing page (`/`).

2. **Extracts the tenant slug** — The slug is pulled from the URL path (the segment after `/dashboard/`).

3. **Validates org membership** — If the signed-in user's active organization slug does not match the URL slug, they are redirected to the correct URL. This prevents users from accessing another organization's dashboard by manually changing the URL.

```
Request: /dashboard/city-of-austin/conversations
                          ^
                    tenant_slug extracted

User's org slug: "springfield-gov"  (mismatch!)
  → Redirect to: /dashboard/springfield-gov/conversations
```

The middleware matcher is configured to run on all routes except static assets (`_next`, images, fonts, etc.).

### Landing Page Logic

**File:** `src/app/page.tsx`

The root page (`/`) handles three distinct states:

| User State                        | What Happens                                                       |
| --------------------------------- | ------------------------------------------------------------------ |
| Not signed in                     | Shows Sign In and Create Organization buttons (Clerk modals)       |
| Signed in, has an active org      | Auto-redirects to `/dashboard/{orgSlug}/conversations`             |
| Signed in, no org assigned yet    | Shows a "Waiting for access" screen with a spinner                 |

When a signed-in user has no active org but has memberships available, the app auto-selects their first organization and redirects them.

### Dashboard Navigation

**File:** `src/app/dashboard/[tenant_slug]/layout.tsx`

The dashboard layout wraps all dashboard pages with:

- A **sidebar** (240px, dark gray) containing five navigation links
- An **OrganizationSwitcher** from Clerk for switching between orgs
- A **UserButton** for profile and sign-out
- **Role display** showing "Admin" or "Member" based on the user's Clerk org role

Navigation links are built dynamically using the current tenant slug:

```
basePath = /dashboard/{slug}

Knowledge Base  → /dashboard/{slug}/knowledge-base
Departments     → /dashboard/{slug}/departments
Conversations   → /dashboard/{slug}/conversations
Analytics       → /dashboard/{slug}/analytics
Settings        → /dashboard/{slug}/settings
```

Active link highlighting is determined by checking if the current pathname starts with the link's full path.

The layout also includes a client-side redirect: if `orgSlug` changes (e.g., user switches orgs), the URL is updated to match.

---

## AI Chatbot

### What Powers the AI

- **Provider:** Groq (cloud inference API)
- **Model:** `llama-3.3-70b-versatile` (Meta's Llama 3.3, 70 billion parameters)
- **Temperature:** `0.3` — low temperature for consistent, factual answers
- **Max tokens:** `1024` — limits response length
- **Response format:** `json_object` — Groq enforces valid JSON output

**File:** `src/app/api/chat/route.ts`

### How a Message Gets Processed

Here is the full lifecycle of a single user message:

```
1. User types a message in the ChatWidget
                    |
2. Message is added to local state (localMessages)
                    |
3. If this is the first message, a new Conversation
   record is created in localStorage
                    |
4. Full conversation history is sent as:
   POST /api/chat
   Body: { messages: [{ role: "user", content: "..." }, ...] }
                    |
5. The API route prepends the system prompt and
   forwards everything to the Groq API
                    |
6. Groq returns structured JSON with:
   message, intent, department, confidence,
   resolved, needs_escalation
                    |
7. The JSON is parsed and validated on the server
                    |
8. Response is sent back to the ChatWidget
                    |
9. The assistant message is displayed in the chat
   and saved to the conversation in localStorage
                    |
10. Conversation status is automatically updated:
    - needs_escalation=true → status set to "escalated"
    - resolved=true → status set to "resolved"
```

The full conversation history is sent with every request. This means the AI has context of the entire session and can reference earlier messages.

### The System Prompt

The system prompt defines CityAssist's personality and behavior. It instructs the AI to:

- Act as a **civic government chatbot** that helps with city services
- Always respond in **strict JSON format**
- Be **helpful, concise, and professional**
- Provide **step-by-step guidance** for process questions
- Show **empathy** for complaints and route them appropriately
- Direct **emergencies** to 911 immediately
- Politely decline **out-of-scope** questions
- Always route to the **most appropriate department**

### Structured JSON Response

Every AI response contains exactly these fields:

```json
{
  "message": "Here's how to apply for a building permit...",
  "intent": "process_guidance",
  "department": "Building Services",
  "confidence": 0.92,
  "resolved": true,
  "needs_escalation": false
}
```

| Field              | Type    | Purpose                                                    |
| ------------------ | ------- | ---------------------------------------------------------- |
| `message`          | string  | The text shown to the user in the chat                     |
| `intent`           | string  | Classifies what kind of request this is                    |
| `department`       | string  | Which city department should handle this                   |
| `confidence`       | number  | 0 to 1 — how sure the AI is about its answer              |
| `resolved`         | boolean | `true` only if the question is fully answered              |
| `needs_escalation` | boolean | `true` when a human needs to get involved                  |

If the JSON parsing fails (malformed response from the model), the server falls back to safe defaults: the raw text as the message, `information_request` intent, and a confidence of `0.5`.

### Intent Classification

The AI classifies every message into one of five intents:

| Intent               | Example                                        | Behavior                          |
| -------------------- | ---------------------------------------------- | --------------------------------- |
| `information_request`| "What are park hours?"                         | Provide factual answer            |
| `process_guidance`   | "How do I get a building permit?"              | Step-by-step instructions         |
| `complaint_report`   | "There's a pothole on Main Street"             | Acknowledge + escalate            |
| `emergency`          | "There's a gas leak on my street"              | Direct to 911 + escalate          |
| `out_of_scope`       | "What's the weather tomorrow?"                 | Politely decline                  |

### Department Routing

Based on the content of the question, the AI routes to one of six departments:

| Department             | Handles                                            |
| ---------------------- | -------------------------------------------------- |
| Public Works           | Roads, infrastructure, trash, street maintenance   |
| Building Services      | Permits, inspections, zoning, construction          |
| Parks & Recreation     | Parks, trails, recreation programs, facilities      |
| Code Enforcement       | Property violations, noise complaints, ordinances   |
| Utilities              | Water, sewer, electric, billing                     |
| City Clerk             | Records, licenses, elections, general inquiries      |

If the question doesn't clearly map to a department, the AI returns `null`.

### Escalation Logic

The AI sets `needs_escalation: true` when:

1. The issue is a **complaint** that needs human follow-up
2. It's an **emergency** (always escalated)
3. The AI's **confidence is below 0.78** — it's not sure enough
4. The resident **asks to speak with a person**
5. The issue requires **human-only actions** (scheduling, approvals, exceptions)

When `needs_escalation` is true, the conversation status is automatically set to `"escalated"` in the admin dashboard, where a human agent can pick it up.

### Conversation Status Updates

The ChatWidget automatically updates conversation status based on the AI response:

```
needs_escalation = true  →  status becomes "escalated"
resolved = true          →  status becomes "resolved"
neither                  →  status stays as-is ("new" or "open")
```

These statuses are visible in the admin Conversations page, where staff can filter, assign, and manage tickets.

### Error Handling

Two levels of error handling protect the user experience:

**Server-side** (`/api/chat`):
- If the Groq API call fails, a 500 error is returned with details
- If the JSON response can't be parsed, fallback values are used

**Client-side** (ChatWidget):
- If the fetch to `/api/chat` fails for any reason (network error, server error), a friendly error message is shown: *"Sorry, I'm having trouble connecting. Please try again."*
- The error message is saved to the conversation so it appears in the admin dashboard

---

## How They Connect

The routing system and AI chatbot work together to create a complete platform:

1. **Clerk authentication** gates access to the dashboard
2. **Tenant slug routing** isolates each city's data
3. **The ChatWidget** lives inside the dashboard layout — available on every page
4. **The AI endpoint** (`/api/chat`) processes messages and returns structured data
5. **Conversations created by the chatbot** appear in the admin Conversations page
6. **Department routing from the AI** maps conversations to the departments configured in the admin
7. **Escalation flags from the AI** surface urgent tickets for human agents to handle
