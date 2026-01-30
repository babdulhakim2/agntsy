# Agentsy — Technical Architecture
*January 2026*

---

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER LAYER                                │
│                                                                  │
│   📱 WhatsApp ──┐                                               │
│   💬 iMessage ──┼──► API Gateway (Auth + Routing)               │
│   🌐 Web App  ──┘         │                                     │
│                            ▼                                     │
│              ┌─────────────────────────┐                        │
│              │   Agentsy Core Engine    │                        │
│              │   (Orchestrator)         │                        │
│              └────────┬────────────────┘                        │
│                       │                                          │
│         ┌─────────────┼─────────────┐                           │
│         ▼             ▼             ▼                            │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐                      │
│   │ Workspace│ │  Agent   │ │  Tool    │                      │
│   │ Manager  │ │  Runtime │ │  Layer   │                      │
│   └──────────┘ └──────────┘ └──────────┘                      │
│         │             │             │                            │
│    File System    LLM APIs     Browser, Email,                  │
│    + Storage      + Memory     Code Exec, etc.                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. API Gateway
- **Purpose:** Single entry point for all user communication
- **Tech:** Node.js (Fastify or Express) or Go
- **Responsibilities:**
  - Authenticate users (phone number = identity)
  - Route messages from WhatsApp/iMessage/Web to correct user workspace
  - Rate limiting, usage metering
  - WebSocket connections for web app real-time updates

### 2. User Management & Auth
- **Identity:** Phone number (primary), email (optional)
- **Auth flow:**
  - WhatsApp/iMessage: Verified by platform (phone number is auth)
  - Web: Magic link via SMS or WhatsApp OTP
- **Database:** PostgreSQL with row-level security
  - `users` table: id, phone, email, plan, created_at
  - `workspaces` table: id, user_id, storage_used, status
  - `usage` table: id, user_id, messages, tokens, date

### 3. Workspace Manager
- **Per-user isolated environment:**
  - Sandboxed file system (S3 prefix per user OR local volume mounts)
  - System-managed email via agentmail.to
  - Persistent memory store (vector DB or SQLite per user)
  - Session history
- **Storage tiers:**
  - Free: 100MB
  - Creator: 5GB
  - Pro: 25GB
- **Implementation options:**
  - **Option A (Simpler):** Shared process, per-user directories + DB isolation
  - **Option B (Stronger isolation):** Docker container per user (Firecracker microVMs for production)

### 4. Agent Runtime
- **Core:** LLM orchestration layer (similar to Clawdbot's architecture)
- **Per-user context:**
  - System prompt with user preferences, brand info, history
  - Persistent memory (key facts, preferences, project state)
  - Tool access permissions based on plan
- **LLM Provider:** OpenAI (GPT-4o) primary, Claude as fallback
- **Memory architecture:**
  ```
  User Memory
  ├── Profile (name, brand, audience, style)
  ├── Projects (active work, status, files)
  ├── Knowledge (learned facts, preferences)
  └── History (conversation summaries, decisions)
  ```

### 5. Tool Layer

#### 5a. Browser Engine
- **Tech:** Playwright (headless Chromium)
- **Per-user browser context** (cookies, sessions isolated)
- **Capabilities:**
  - Web research and scraping
  - Form filling, account interactions
  - Screenshot capture
  - Web app interaction on behalf of user
- **Pool management:** Browser pool with N instances, assigned on-demand
- **Provider option:** Browserbase.com (managed) or self-hosted

#### 5b. Email (agentmail.to)
- **Each user gets:** `{username}@agentmail.to`
- **Agent can:** Send, receive, read, organize email
- **Used for:** Service sign-ups, notifications, communication
- **User never shares personal email credentials**

#### 5c. Code Execution
- **Sandboxed runtime** (E2B.dev or custom Docker)
- **Languages:** Python, Node.js, Shell
- **Use cases:** Data analysis, file generation, automation scripts

#### 5d. File Management
- **Storage:** S3-compatible (MinIO self-hosted or AWS S3)
- **Per-user prefix:** `s3://agentsy-data/{user_id}/`
- **Agent can:** Create, read, organize, export files
- **Export:** User can download via web UI or agent sends via WhatsApp

#### 5e. Content Generation
- **Text:** Research reports, scripts, newsletters, social posts
- **Images:** DALL-E 3 / Stable Diffusion integration
- **Documents:** PDF generation, markdown → styled HTML

#### 5f. Web Presentation Layer
- **Dynamic URL generation** per user
- **Agent creates web pages/dashboards** the user can view
- **Examples:**
  - Research report → `agentsy.app/u/hakim/research-jan29`
  - Content calendar → `agentsy.app/u/hakim/calendar`
  - Project dashboard → `agentsy.app/u/hakim/projects`
- **Tech:** Static HTML generation served via CDN, or dynamic Next.js routes

---

## Communication Channels

### WhatsApp Business API
- **Provider:** Twilio or Meta Cloud API (direct)
- **Message types:** Text, images, documents, voice notes
- **Webhook:** Incoming messages → API Gateway → Agent Runtime
- **Outbound:** Agent responses → WhatsApp API → User
- **Cost:** ~$0.005-0.08 per message (varies by country)

### iMessage (via BlueBubbles or similar)
- **Requires:** Mac server running Messages.app
- **More complex setup** but zero friction for iPhone users
- **Alternative:** Fall back to SMS via Twilio

### Web App
- **Tech:** Next.js (React) + WebSocket for real-time
- **Features:**
  - Chat interface (primary)
  - File browser (view workspace files)
  - Dashboard (usage, projects, settings)
  - Generated content viewer
- **Auth:** Phone-based magic link

---

## Data Architecture

### PostgreSQL (Shared)
```sql
-- Core tables
users (id, phone, email, name, plan, created_at)
workspaces (id, user_id, storage_bytes, agent_config, status)
messages (id, workspace_id, role, content, tokens, created_at)
usage_daily (id, user_id, messages, tokens_in, tokens_out, date)
subscriptions (id, user_id, plan, stripe_id, status, current_period_end)

-- Row-level security: users can only access their own data
```

### Per-User Storage
```
/workspace/{user_id}/
├── memory/
│   ├── profile.json        # User/brand info
│   ├── knowledge.json      # Learned facts
│   └── projects/           # Project state files
├── files/
│   ├── documents/          # Created docs, reports
│   ├── images/             # Generated images
│   └── exports/            # Downloadable files
└── config/
    ├── preferences.json    # User preferences
    └── tools.json          # Tool access config
```

### Vector Database (Memory)
- **Option:** Pinecone, Qdrant, or pgvector extension in PostgreSQL
- **Purpose:** Semantic search over user's history, files, knowledge
- **Per-user namespace** for isolation

---

## Infrastructure

### MVP (Phase 1) — Single Server
```
1x VPS (8GB+ RAM)
├── Node.js API Gateway
├── Agent Runtime (shared process)
├── PostgreSQL
├── MinIO (S3-compatible storage)
├── Playwright browser pool (2-4 instances)
├── Caddy (reverse proxy + TLS)
└── Redis (sessions, rate limiting)
```
**Supports:** ~50-100 concurrent users
**Cost:** ~$50-100/mo (Hetzner or DigitalOcean)

### Scale (Phase 2) — Multi-Server
```
Load Balancer (Caddy/Nginx)
├── API Server 1..N (stateless)
├── Agent Workers 1..N (process message queue)
├── Browser Pool (Browserbase or dedicated)
├── PostgreSQL (managed - Neon/Supabase)
├── S3 (AWS or Cloudflare R2)
├── Redis Cluster (Upstash)
└── Queue (BullMQ on Redis)
```
**Supports:** 1,000-10,000+ users
**Cost:** $200-1,000/mo depending on usage

### Production (Phase 3) — Kubernetes
- Container orchestration for auto-scaling
- Per-user pod isolation (optional)
- Firecracker microVMs for security-critical workloads
- Multi-region deployment

---

## Security Model

1. **Tenant isolation:** All data is scoped by user_id. Row-level security in PostgreSQL. Separate S3 prefixes. No cross-user data access.
2. **No personal credentials:** Agent uses system-managed accounts (agentmail.to, etc.). User never shares passwords.
3. **Encryption:** TLS everywhere. Data at rest encrypted (S3 server-side encryption).
4. **Browser isolation:** Each user gets separate browser context. Cookies/sessions don't leak.
5. **Code sandbox:** All code execution in isolated containers with no network access by default.
6. **Audit log:** All agent actions logged for user review.

---

## Cost Model (Per User/Month)

| Component | Free | Creator ($29) | Pro ($49) |
|-----------|------|---------------|-----------|
| Messages | 50 | Unlimited | Unlimited |
| LLM Tokens | ~100K | ~2M | ~5M |
| Storage | 100MB | 5GB | 25GB |
| Browser | 10 sessions | 100 sessions | Unlimited |
| Image Gen | 0 | 20/mo | 100/mo |
| **Est. Cost** | **~$1** | **~$8-12** | **~$15-25** |
| **Margin** | Negative | **~60%** | **~50-70%** |

---

## Development Roadmap

### Week 1-2: MVP
- [ ] User registration (phone number)
- [ ] WhatsApp integration (Twilio)
- [ ] Basic agent runtime (single LLM, text I/O)
- [ ] Per-user workspace (filesystem)
- [ ] Persistent memory (simple JSON files)
- [ ] Landing page + waitlist ✅
- [ ] Web viewer for generated content

### Week 3-4: Core Features
- [ ] Browser integration (Playwright)
- [ ] agentmail.to integration
- [ ] File creation + export (send via WhatsApp)
- [ ] Web app (chat + file browser)
- [ ] Usage metering + limits

### Month 2: Polish + Launch
- [ ] Stripe billing
- [ ] Creator-specific tools (content calendar, research templates)
- [ ] Mobile-optimized web app
- [ ] Beta launch with 50 creators
- [ ] Product Hunt launch

### Month 3: Scale
- [ ] Multi-server architecture
- [ ] Advanced memory (vector search)
- [ ] Image generation
- [ ] Voice input/output
- [ ] API for developers
