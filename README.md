# SAAS-Bot

A production-grade multi-tenant embeddable AI chatbot platform. Install a smart bot on any website with a single script tag. Bots answer strictly from your approved content using Anthropic's Claude API.

---

## Features

- **One-line embed** — drop a `<script>` tag on any website and the bot appears instantly
- **Grounded answers** — every reply comes from your approved knowledge base; the bot never invents facts
- **Streaming responses** — token-by-token output for fast perceived performance
- **Multi-tenant** — each organisation has fully isolated workspaces, bots, and knowledge
- **RAG pipeline** — text/FAQ/PDF/website content is chunked, embedded, and retrieved per-query
- **Role-based access** — owner, admin, editor, viewer each see and can do exactly what their role allows
- **Team management** — invite members, assign roles, remove access instantly
- **Lead capture** — visitors who can't be answered are offered a contact form
- **Real-time conversations** — admin inbox auto-refreshes; open conversations poll for new messages
- **Analytics** — conversations, messages, unanswered rate, leads, and usage by day
- **Domain allowlist** — widget requests blocked if the embedding domain isn't whitelisted
- **Anthropic-first** — uses Claude for generation; model names are configurable env vars

---

## Table of Contents

- [How It Works](#how-it-works)
- [Architecture](#architecture)
- [Role Permissions](#role-permissions)
- [Local Development Setup](#local-development-setup)
- [Using the Admin Dashboard](#using-the-admin-dashboard)
- [Embedding the Widget](#embedding-the-widget)
- [API Reference](#api-reference)
- [VPS Deployment (DigitalOcean)](#vps-deployment-digitalocean)
- [Environment Variables](#environment-variables)

---

## How It Works

```
Visitor types a question
        ↓
Widget sends message to API
        ↓
API retrieves relevant chunks from your knowledge base (ChromaDB)
        ↓
API builds a prompt: system instructions + retrieved context + conversation history
        ↓
Anthropic Claude generates a grounded answer (streaming)
        ↓
Answer streams back token-by-token to the visitor
        ↓
Conversation + usage stored in MySQL
```

**Key principle:** The bot only answers from content you have approved and uploaded. It will never hallucinate beyond what is in your knowledge base. If the answer is not found, it says so and offers to capture the visitor's contact details.

---

## Architecture

```
Browser (visitor)
  └── widget.js (IIFE, Shadow DOM)
        └── POST /api/v1/widget/chat  ──► FastAPI (Python)
                                              ├── RAG retrieval (ChromaDB + MySQL)
                                              ├── Anthropic API (streaming)
                                              └── MySQL (conversations, leads, analytics)

Browser (admin)
  └── admin-web (React SPA, port 3000)
        └── /api/v1/*  ──► FastAPI (Python)
```

| Layer | Technology |
|---|---|
| Backend API | Python 3.11, FastAPI, SQLAlchemy, Alembic |
| LLM | Anthropic Claude (claude-sonnet-4-6 default) |
| Database | MySQL 8.0 |
| Vector store | ChromaDB (file-based, no separate server needed) |
| Embeddings | Anthropic voyage-3 / sentence-transformers (local fallback) |
| Admin UI | React 18, Bootstrap 5, TanStack Query, Zustand |
| Widget | React 18, Vite IIFE build, Shadow DOM |

---

## Role Permissions

Every team member is assigned one of four roles. Permissions are enforced on both the frontend (UI elements hidden/disabled) and the backend (HTTP 403 returned for unauthorised calls).

| Action | Owner | Admin | Editor | Viewer |
|---|:---:|:---:|:---:|:---:|
| View dashboard, analytics, conversations, leads | ✓ | ✓ | ✓ | ✓ |
| Change conversation / lead status | ✓ | ✓ | ✓ | — |
| Create / edit bots and knowledge sources | ✓ | ✓ | ✓ | — |
| Delete bots, manage allowed domains | ✓ | ✓ | — | — |
| Invite / remove team members, change roles | ✓ | ✓ | — | — |
| Access billing and plan settings | ✓ | ✓ | — | — |

---

## Local Development Setup

### Prerequisites

- Python 3.11 (not 3.12/3.13 — pre-built wheels required)
- Node.js 20+
- MySQL 8.0+
- An Anthropic API key

### Step 1 — Clone and enter the project

```bash
git clone https://github.com/DoughlasMuthoni/SAAS-Bot.git
cd SAAS-Bot/chatbot-platform
```

### Step 2 — Backend setup

```bash
cd services/api

# Create virtual environment with Python 3.11
py -3.11 -m venv .venv

# Activate (Windows)
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Step 3 — Configure environment

```bash
# Copy example env
cp ../../.env.example .env

# Edit .env — minimum required:
# MYSQL_PASSWORD=your_mysql_password
# ANTHROPIC_API_KEY=sk-ant-...
# JWT_SECRET=any-long-random-string
# SESSION_SECRET=another-long-random-string
```

### Step 4 — Create database and run migrations

```sql
-- In MySQL:
CREATE DATABASE chatbot_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

```bash
alembic upgrade head
```

### Step 5 — Seed demo data

```bash
python ../../infra/scripts/seed_demo.py
```

Output will show:
```
Admin email:    admin@demo.com
Admin password: demo1234
Bot public key: <your-key>
```

### Step 6 — Start the API

```bash
uvicorn app.main:app --reload
# API runs at http://localhost:8000
# OpenAPI docs at http://localhost:8000/docs
```

### Step 7 — Start the admin dashboard

```bash
# New terminal, from monorepo root
cd apps/admin-web
npm install
npm run dev
# Admin runs at http://localhost:3000
```

### Step 8 — Build and serve the widget

```bash
# New terminal
cd apps/embed-widget
npm install
npm run build
cp dist/widget.js ../../services/api/app/static/widget.js
```

### Step 9 — Start the demo site

```bash
# New terminal
cd apps/demo-site
npm install
npm run dev
# Demo runs at http://localhost:3002
```

---

## Using the Admin Dashboard

Navigate to `http://localhost:3000` and log in.

### 1. Create a Bot

Go to **Bots → New Bot** and fill in:

| Field | Description |
|---|---|
| Name | Display name shown in the chat panel header |
| Brand color | Hex color for the launcher bubble and UI accents |
| Welcome message | First message the visitor sees |
| Fallback email | Shown to visitors when the bot can't answer |
| Position | `bottom-right` or `bottom-left` |

After saving, go to the **Install** tab to get your embed code.

### 2. Add Knowledge Sources

Go to **Knowledge Sources** and add content your bot will answer from.

**Text** — paste any text content (product descriptions, policies, guides).

**FAQ** — enter question/answer pairs. Each pair becomes one chunk — most reliable for precise answers.

**File upload** — upload PDF, DOCX, or TXT files. Text is extracted, chunked, and indexed automatically.

After adding a source, it enters `pending` status, processes in the background, then becomes `indexed`. The bot can only answer from `indexed` sources.

### 3. Configure Allowed Domains

Go to **Bots → your bot → Domains** and add every domain where the widget will be embedded (e.g. `example.com`). The API rejects session requests from unlisted domains — this prevents unauthorized use of your bot key.

### 4. Manage Your Team

Go to **Team** to invite colleagues and assign roles.

- Click **Invite member**, enter their name, email, role, and a temporary password
- They can log in immediately and access features allowed by their role
- Owners and admins can change any member's role or remove them at any time
- Viewers see everything but cannot make changes

### 5. Monitor Conversations

Go to **Conversations** to see every chat session. The list refreshes automatically every 10 seconds. Click a conversation to see the full message thread in chronological order, including which knowledge chunks were used for each answer. Active conversations auto-refresh every 5 seconds while open.

Change a conversation's status (Active / Resolved / Unresolved / Lead) directly from the detail view — the change reflects instantly in the list without a page reload.

### 6. Leads

When a visitor asks something the bot can't answer, the bot offers to capture their contact details. Go to **Leads** to view, update status, export as CSV, and navigate to the originating conversation.

### 7. Analytics

Go to **Analytics** for an overview of:
- Total conversations and messages
- Unanswered question rate
- Leads captured
- Usage by day

---

## Embedding the Widget

Add one script tag to any HTML page — before `</body>`:

```html
<script src="https://api.douglasgithuicreatives.tech/static/widget.js" data-bot="YOUR_BOT_PUBLIC_KEY"></script>
```

Replace:
- `api.douglasgithuicreatives.tech` — domain where your API is hosted
- `YOUR_BOT_PUBLIC_KEY` — found in Admin → Bots → Install tab

**Works on:** plain HTML, WordPress (add to footer via theme editor or plugin), PHP sites, React/Vue/Angular SPAs, Laravel Blade templates.

The widget uses Shadow DOM — its styles are fully isolated from your site's CSS. It will never conflict with your existing design.

### Widget options

| Attribute | Description | Default |
|---|---|---|
| `data-bot` | Bot public key (required) | — |
| `data-api-url` | Override API URL | auto-detected from script src |

---

## API Reference

All admin endpoints require `Authorization: Bearer <token>` header (JWT from login).

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/auth/login` | Login, returns access + refresh tokens |
| POST | `/api/v1/auth/logout` | Invalidate refresh token |
| GET | `/api/v1/auth/me` | Get current user |

### Bots
| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/bots` | List bots for workspace |
| POST | `/api/v1/bots` | Create bot (admin+) |
| GET | `/api/v1/bots/{id}` | Get bot |
| PUT | `/api/v1/bots/{id}` | Update bot (editor+) |
| DELETE | `/api/v1/bots/{id}` | Delete bot (admin+) |

### Knowledge Sources
| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/sources` | List sources |
| POST | `/api/v1/sources/text` | Add text source (editor+) |
| POST | `/api/v1/sources/faq` | Add FAQ source (editor+) |
| POST | `/api/v1/sources/upload` | Upload file (editor+) |
| POST | `/api/v1/sources/{id}/reindex` | Re-process a source (editor+) |
| POST | `/api/v1/sources/{id}/toggle` | Enable/disable a source (editor+) |

### Conversations
| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/conversations` | List conversations |
| GET | `/api/v1/conversations/{id}` | Get conversation with messages |
| PATCH | `/api/v1/conversations/{id}/status` | Update status (editor+) |

### Leads
| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/leads` | List leads |
| PATCH | `/api/v1/leads/{id}/status` | Update lead status (editor+) |

### Team
| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/team` | List team members |
| POST | `/api/v1/team/invite` | Invite a member (admin+) |
| PUT | `/api/v1/team/{id}/role` | Change member role (admin+) |
| DELETE | `/api/v1/team/{id}` | Remove member (admin+) |

### Widget (public, no auth)
| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/widget/config/{key}` | Get bot config for widget |
| POST | `/api/v1/widget/session` | Create visitor session |
| POST | `/api/v1/widget/chat` | Send message, returns SSE stream |
| POST | `/api/v1/widget/lead` | Submit lead capture form |

Full interactive docs at `http://localhost:8000/docs`.

---

## VPS Deployment (DigitalOcean)

This guide deploys the platform to a DigitalOcean Droplet behind Cloudflare using the following URL structure:

| URL | Purpose |
|---|---|
| `douglasgithuicreatives.tech` | Landing / marketing page |
| `app.douglasgithuicreatives.tech` | Admin dashboard |
| `api.douglasgithuicreatives.tech` | Backend API + widget.js |

**Widget embed script (give this to your clients):**
```html
<script src="https://api.douglasgithuicreatives.tech/static/widget.js" data-bot="BOT_PUBLIC_KEY"></script>
```

---

### Infrastructure overview

| Service | Spec | Cost |
|---|---|---|
| DigitalOcean Droplet | Ubuntu 22.04, 2 GB RAM, 1 vCPU | $12/mo |
| MySQL | Self-hosted on the same Droplet | $0 |
| Cloudflare | Free tier — CDN, SSL, DDoS protection | $0 |
| Domain | douglasgithuicreatives.tech via Hostinger | ~$10/yr |

---

### Part 1 — Domain and Cloudflare setup

#### 1.1 — Add domain to Cloudflare

1. Create a free account at [cloudflare.com](https://cloudflare.com)
2. Click **Add a site** → enter `douglasgithuicreatives.tech`
3. Choose the **Free plan**
4. Cloudflare shows you 2 nameservers (e.g. `aria.ns.cloudflare.com`, `bob.ns.cloudflare.com`)

#### 1.2 — Update nameservers at Hostinger

1. Log in to Hostinger → **Domains** → `douglasgithuicreatives.tech`
2. Go to **DNS / Nameservers** → change to Cloudflare's nameservers
3. Save — propagation takes 1–24 hours

#### 1.3 — Add DNS records in Cloudflare

Once your domain is active in Cloudflare, add these A records (replace `YOUR_DROPLET_IP` after creating the Droplet):

```
Type  Name   Value             Proxy
A     @      YOUR_DROPLET_IP   Proxied (orange cloud ON)
A     app    YOUR_DROPLET_IP   Proxied (orange cloud ON)
A     api    YOUR_DROPLET_IP   Proxied (orange cloud ON)
```

#### 1.4 — Configure Cloudflare SSL

In Cloudflare → **SSL/TLS** → set mode to **Full (strict)**.

---

### Part 2 — Droplet setup

#### 2.1 — Create the Droplet

1. In DigitalOcean → **Create Droplet**
2. Choose: **Ubuntu 22.04**, **Basic**, **Regular SSD**, **2 GB / 1 vCPU** ($12/mo)
3. Add your SSH key (recommended) or use a root password
4. Create — note the Droplet IP address

#### 2.2 — Initial server setup

SSH into the Droplet:

```bash
ssh root@YOUR_DROPLET_IP
```

Run the initial setup:

```bash
apt update && apt upgrade -y
apt install -y python3.11 python3.11-venv python3-pip nginx mysql-server git curl ufw
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
mysql_secure_installation
```

#### 2.3 — Create a deploy user

```bash
adduser deploy
usermod -aG sudo deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
```

#### 2.4 — Create the MySQL database

```bash
mysql -u root -p
```

```sql
CREATE DATABASE chatbot_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'chatbot'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON chatbot_platform.* TO 'chatbot'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

### Part 3 — Deploy the application

#### 3.1 — Clone from GitHub

```bash
su - deploy
git clone https://github.com/DoughlasMuthoni/SAAS-Bot.git /home/deploy/chatbot-platform
cd /home/deploy/chatbot-platform/chatbot-platform/services/api
```

#### 3.2 — Set up Python environment

```bash
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

#### 3.3 — Configure environment

```bash
cp ../../.env.example .env
nano .env
```

Set these values:

```env
APP_ENV=production
APP_URL=https://api.douglasgithuicreatives.tech
ADMIN_WEB_URL=https://app.douglasgithuicreatives.tech

MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DATABASE=chatbot_platform
MYSQL_USER=chatbot
MYSQL_PASSWORD=STRONG_PASSWORD_HERE

ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL_MAIN=claude-sonnet-4-6
ANTHROPIC_MODEL_ADVANCED=claude-opus-4-8
ANTHROPIC_MODEL_FAST=claude-haiku-4-5-20251001

JWT_SECRET=GENERATE_64_RANDOM_CHARS
SESSION_SECRET=GENERATE_ANOTHER_64_RANDOM_CHARS

UPLOAD_DIR=/home/deploy/chatbot-platform/uploads
CHROMA_PERSIST_DIR=/home/deploy/chatbot-platform/chroma_data
MAX_UPLOAD_MB=20

RATE_LIMIT_PER_MINUTE=30
ALLOWED_CORS_ORIGINS=https://app.douglasgithuicreatives.tech,https://douglasgithuicreatives.tech

LOG_LEVEL=INFO
```

Generate secure secrets:

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
# Run twice — one for JWT_SECRET, one for SESSION_SECRET
```

#### 3.4 — Run database migrations

```bash
alembic upgrade head
```

#### 3.5 — Seed the first admin user

```bash
python ../../infra/scripts/seed_demo.py
```

---

### Part 4 — Build the frontend

On your **local machine**:

```bash
# Set production API URL
echo "VITE_API_URL=https://api.douglasgithuicreatives.tech" > apps/admin-web/.env.production

# Build admin dashboard
cd apps/admin-web && npm install && npm run build

# Build widget
cd ../embed-widget && npm install && npm run build
cp dist/widget.js ../../services/api/app/static/widget.js
```

Upload builds to server:

```bash
scp -r apps/admin-web/dist/ deploy@YOUR_DROPLET_IP:/home/deploy/chatbot-platform/admin-dist/
scp services/api/app/static/widget.js deploy@YOUR_DROPLET_IP:/home/deploy/chatbot-platform/chatbot-platform/services/api/app/static/
```

---

### Part 5 — Configure systemd service

```bash
sudo nano /etc/systemd/system/chatbot-api.service
```

```ini
[Unit]
Description=Chatbot Platform API
After=network.target mysql.service

[Service]
User=deploy
Group=deploy
WorkingDirectory=/home/deploy/chatbot-platform/chatbot-platform/services/api
Environment="PATH=/home/deploy/chatbot-platform/chatbot-platform/services/api/.venv/bin"
EnvironmentFile=/home/deploy/chatbot-platform/chatbot-platform/services/api/.env
ExecStart=/home/deploy/chatbot-platform/chatbot-platform/services/api/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 2
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable chatbot-api
sudo systemctl start chatbot-api
sudo systemctl status chatbot-api
```

---

### Part 6 — Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/chatbot
```

```nginx
server {
    listen 80;
    server_name api.douglasgithuicreatives.tech;
    client_max_body_size 25M;

    location /static/ {
        alias /home/deploy/chatbot-platform/chatbot-platform/services/api/app/static/;
        expires 1d;
        add_header Cache-Control "public";
    }

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300s;
        chunked_transfer_encoding on;
    }
}

server {
    listen 80;
    server_name app.douglasgithuicreatives.tech;
    root /home/deploy/chatbot-platform/admin-dist;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }
}

server {
    listen 80;
    server_name douglasgithuicreatives.tech www.douglasgithuicreatives.tech;
    root /home/deploy/chatbot-platform/admin-dist;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/chatbot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

> **Note:** Cloudflare handles SSL. Nginx listens on port 80 only — Cloudflare encrypts the visitor connection. Set Cloudflare SSL to **Full (strict)** and enable **Always Use HTTPS**.

---

### Part 7 — Verify deployment

```bash
curl https://api.douglasgithuicreatives.tech/docs
sudo journalctl -u chatbot-api --since "5 minutes ago"
```

1. Visit `https://api.douglasgithuicreatives.tech/docs` — OpenAPI docs
2. Visit `https://app.douglasgithuicreatives.tech` — admin login page
3. Log in, create a bot, add a knowledge source
4. Copy the embed script and paste it on any website

---

### Redeployment (after code changes)

```bash
# Pull latest code on server
cd /home/deploy/chatbot-platform && git pull

# Rebuild frontend locally and re-upload (see Part 4)

# Restart API
sudo systemctl restart chatbot-api

# Run any new migrations
cd chatbot-platform/services/api
source .venv/bin/activate
alembic upgrade head
```

Or use the deploy script:

```bash
./infra/scripts/deploy.sh              # full deploy
./infra/scripts/deploy.sh --backend-only
./infra/scripts/deploy.sh --frontend-only
./infra/scripts/deploy.sh --migrate
```

---

### Useful server commands

```bash
sudo journalctl -u chatbot-api -f        # live API logs
sudo systemctl restart chatbot-api       # restart API
sudo nginx -t && sudo systemctl reload nginx
```

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `APP_ENV` | `development` or `production` | `development` |
| `APP_URL` | Public URL of the API | `http://localhost:8000` |
| `ANTHROPIC_API_KEY` | Anthropic API key | — |
| `ANTHROPIC_MODEL_MAIN` | Default chat model | `claude-sonnet-4-6` |
| `ANTHROPIC_MODEL_ADVANCED` | Advanced model for admin tools | `claude-opus-4-8` |
| `ANTHROPIC_MODEL_FAST` | Fast model for classification | `claude-haiku-4-5-20251001` |
| `MYSQL_HOST` | MySQL host | `127.0.0.1` |
| `MYSQL_PORT` | MySQL port | `3306` |
| `MYSQL_DATABASE` | Database name | `chatbot_platform` |
| `MYSQL_USER` | Database user | `root` |
| `MYSQL_PASSWORD` | Database password | — |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | — |
| `SESSION_SECRET` | Widget session JWT secret (min 32 chars) | — |
| `EMBEDDING_PROVIDER` | `anthropic` or `local` | `anthropic` |
| `CHROMA_PERSIST_DIR` | ChromaDB persistence path | `./chroma_data` |
| `UPLOAD_DIR` | File upload storage path | `./uploads` |
| `MAX_UPLOAD_MB` | Max upload size in MB | `20` |
| `RATE_LIMIT_PER_MINUTE` | Widget chat rate limit per IP | `30` |
| `ALLOWED_CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:3000,...` |
| `LOG_LEVEL` | `DEBUG`, `INFO`, `WARNING`, `ERROR` | `INFO` |
