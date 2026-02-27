# CityAssist

AI-powered civic chatbot platform that helps city governments manage resident conversations, route inquiries to the right departments, and track everything through an admin dashboard.

## What It Does

CityAssist gives each city (or organization) their own isolated workspace where they can:

- **Talk to residents** via an AI chatbot that understands city services, permits, utilities, and departments
- **Route conversations** to the correct department automatically (or manually reassign them)
- **Track every conversation** in a Zendesk-style ticket system with status management (New, Open, Escalated, Resolved)
- **Upload knowledge base documents** (PDFs, text files) and add FAQs so the AI gives accurate, city-specific answers
- **View analytics** — resolution rates, escalation rates, department breakdowns, intent distribution, and more
- **Customize the chatbot** — branding, colors, welcome message, logo, and widget behavior
- **Manage team members** — admins invite members to their organization via Clerk

## How It Works (Architecture)

### The Big Picture

```
Resident types a question
        |
        v
   Chat Widget (floating button, bottom-right of every page)
        |
        v
   /api/chat  -->  Groq AI (Llama 3.3-70b model)
        |
        |  Returns: answer + intent + department + confidence
        v
   Conversation Store (saved per-tenant in browser storage)
        |
        v
   Shows up in: Conversations page, Analytics, Ticket Detail
```

When a resident asks a question, the AI reads the conversation history, classifies the **intent** (info request, complaint, emergency, etc.), identifies the **department** it belongs to, and responds. If it detects an emergency, it auto-escalates the ticket.

Admins see everything in real-time across the dashboard.

### Multi-Tenancy (How Data is Isolated)

Every organization (city) gets its own isolated data. This is handled by **Clerk** for authentication and **URL-based tenant slugs** for data separation.

- URL pattern: `/dashboard/{org-slug}/conversations`
- Data stored in browser as: `cityassist_conversations_{org-slug}`, `cityassist_departments_{org-slug}`, `cityassist_settings_{org-slug}`
- Middleware ensures users can only access their own organization's dashboard
- If a user tries to access another org's URL, they get redirected to their own

### Authentication Flow

1. **Not signed in** — sees a landing page with Sign In / Create Organization buttons
2. **Signed in, no org** — sees a "Waiting for access" screen (admin needs to invite them)
3. **Signed in, has org** — auto-redirected to `/dashboard/{slug}/conversations`
4. **Invited user** — once they accept, the app auto-selects their org and redirects to the dashboard

Roles:
- **Admin** — can invite members, manage org settings, full access
- **Member** — access to dashboard, conversations, knowledge base

## Dashboard Pages

### Conversations (Main Page)

The primary workspace. Three-panel layout:

| Left Sidebar | Center | Right (on click) |
|---|---|---|
| Status filters (All, New, Open, Escalated, Resolved) | Ticket table with thin Zendesk-style rows | Full conversation thread + metadata sidebar |
| Department filters (from configured departments + Unassigned) | Columns: Status, Subject, Requester, Intent, Department, Time | Dropdowns to change status and reassign department |
| Counts per filter | Dynamic pagination that fills the viewport | Timestamps, message count, conversation ID |

### Departments

Configure your city's departments:
- Add departments with name, contact email, and phone
- Add **routing keywords** — the AI uses these to route conversations to the right department
- Toggle escalation on/off per department
- These departments appear in: Conversations sidebar filters, Ticket detail dropdown, Knowledge Base filter, Analytics breakdown

### Knowledge Base

Two ways to feed the AI information:
1. **Document Upload** — drag & drop PDFs or text files, assigned to a department. Gets ingested for AI to reference.
2. **Manual FAQs** — add question/answer pairs per department for common inquiries.

Department dropdowns here pull from the departments you configured (not hardcoded).

### Analytics

All metrics are **live** — they calculate from actual conversation data:

- **Stat Cards**: Total conversations, resolution rate (%), escalation rate (%), average messages per conversation
- **Department Breakdown**: Bar chart showing how many conversations each department handles
- **Intent Breakdown**: Distribution of intent types (info requests, complaints, emergencies, etc.)
- **Recent Questions**: Latest 10 conversations with status badges
- **Escalated Tickets**: Conversations flagged for human attention

### Settings

Controls the chatbot widget behavior and appearance:

- **Branding**: City name, primary color (color picker), welcome message, logo URL
- **Widget Config**: Auto-open toggle, show department badges toggle
- **Embed Code**: Copy-paste script snippet for embedding the chatbot on any website
- **API Key**: View/copy authentication key

Changes here immediately affect the chat widget — change the color and the chat bubble, header, and send button update in real-time.

## Chat Widget

The floating chat button appears on **every dashboard page** (bottom-right corner). It's the same widget that would be embedded on a city's public website.

What it does:
- Opens a chat window with the AI
- Uses the branding from Settings (color, name, logo, welcome message)
- Shows department badges on responses (if enabled)
- Creates a new conversation in the ticket system for every chat session
- Auto-resolves conversations when the AI fully answers the question

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| UI | Chakra UI |
| Auth | Clerk (organizations, roles, invites) |
| AI | Groq SDK with Llama 3.3-70b |
| State | React Context + localStorage (per-tenant) |
| Middleware | Next.js middleware for route protection |

## Project Structure

```
src/
  app/
    page.tsx                              # Landing page + auth routing
    layout.tsx                            # Root layout (Clerk + theme)
    api/
      chat/route.ts                       # AI chat endpoint (Groq)
      upload/route.ts                     # Document upload endpoint
    dashboard/[tenant_slug]/
      layout.tsx                          # Dashboard shell (sidebar + providers)
      conversations/page.tsx              # Ticket management
      departments/page.tsx                # Department configuration
      knowledge-base/page.tsx             # Document + FAQ management
      analytics/page.tsx                  # Metrics dashboard
      settings/page.tsx                   # Widget branding + config

  components/
    ChatWidget.tsx                        # Floating chat interface
    TicketTable.tsx                       # Paginated conversation table
    TicketDetailPanel.tsx                 # Conversation detail view
    TicketSidebar.tsx                     # Status + department filters
    ConversationThread.tsx                # Message thread renderer
    ConversationList.tsx                  # Searchable conversation list

  lib/
    types.ts                              # Shared TypeScript types
    conversation-store.tsx                # Conversation state management
    department-store.tsx                  # Department state management
    settings-store.tsx                    # Widget settings state management
    providers.tsx                         # Chakra theme + context setup
    use-role.ts                           # Admin role detection hook

  middleware.ts                           # Auth + tenant route protection
```

## Shared State Stores

The app uses three context-based stores, all following the same pattern:

| Store | localStorage Key | What It Manages |
|---|---|---|
| `useConversations()` | `cityassist_conversations_{slug}` | All conversations, messages, status updates |
| `useDepartments()` | `cityassist_departments_{slug}` | Department configs, keywords, contact info |
| `useSettings()` | `cityassist_settings_{slug}` | Widget branding, colors, behavior toggles |

Each store loads data when the tenant slug is set, auto-saves on every change, and scopes all data to the current organization.

## AI Intent Classification

The chatbot classifies every message into one of five intents:

| Intent | What It Means | Example |
|---|---|---|
| `information_request` | Resident wants to know something | "What are the library hours?" |
| `process_guidance` | Resident needs help with a process | "How do I apply for a building permit?" |
| `complaint_report` | Resident is reporting an issue | "There's a pothole on Main Street" |
| `emergency` | Urgent issue (auto-escalates) | "There's a gas leak at 5th and Oak" |
| `out_of_scope` | Not related to city services | "What's the weather tomorrow?" |

## Getting Started

### Prerequisites
- Node.js 18+
- A [Clerk](https://clerk.com) account (for authentication)
- A [Groq](https://groq.com) API key (for AI)

### Environment Variables

Create a `.env.local` file:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
GROQ_API_KEY=gsk_...
```

### Run It

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — sign in, create an organization, and you're in the dashboard.
