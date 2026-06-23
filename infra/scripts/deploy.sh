#!/usr/bin/env bash
# deploy.sh — Deploy chatbot-platform to DigitalOcean Droplet
#
# Usage:
#   ./infra/scripts/deploy.sh                  # full deploy (frontend + backend)
#   ./infra/scripts/deploy.sh --frontend-only  # rebuild & upload frontend only
#   ./infra/scripts/deploy.sh --backend-only   # upload backend + restart API only
#   ./infra/scripts/deploy.sh --migrate        # run DB migrations on server
#
# Run from the chatbot-platform/ root directory.

set -euo pipefail

# ─── Configuration ────────────────────────────────────────────────────────────
DEPLOY_USER="deploy"
DEPLOY_HOST="YOUR_DROPLET_IP"          # Replace with your Droplet IP
REMOTE_DIR="/home/deploy/chatbot-platform"
API_SERVICE="chatbot-api"
WORKER_SERVICE="chatbot-worker"
VITE_API_URL="https://api.douglasgithuicreatives.tech"
# ──────────────────────────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }
step()    { echo -e "\n${BOLD}▶ $*${NC}"; }

SSH="ssh ${DEPLOY_USER}@${DEPLOY_HOST}"
SCP="scp"

# ─── Argument parsing ─────────────────────────────────────────────────────────
DO_FRONTEND=true
DO_BACKEND=true
DO_MIGRATE=false

DO_INSTALL_INFRA=false

for arg in "$@"; do
  case $arg in
    --frontend-only)  DO_BACKEND=false ;;
    --backend-only)   DO_FRONTEND=false ;;
    --migrate)        DO_MIGRATE=true; DO_FRONTEND=false; DO_BACKEND=false ;;
    --install-infra)  DO_INSTALL_INFRA=true; DO_FRONTEND=false; DO_BACKEND=false ;;
    --help|-h)
      echo "Usage: $0 [--frontend-only|--backend-only|--migrate|--install-infra]"
      echo ""
      echo "  (no args)        Full deploy: build frontend + upload backend + restart services"
      echo "  --frontend-only  Rebuild and upload admin UI and widget only"
      echo "  --backend-only   Upload Python source + restart API (no frontend rebuild)"
      echo "  --migrate        Run alembic upgrade head on the server only"
      echo "  --install-infra  Copy Nginx config + systemd units to server and enable them"
      exit 0
      ;;
    *) error "Unknown argument: $arg" ;;
  esac
done

# ─── Preflight checks ─────────────────────────────────────────────────────────
step "Preflight checks"

[[ -f "services/api/requirements.txt" ]] || error "Run this script from the chatbot-platform/ root directory."

if [[ "$DEPLOY_HOST" == "YOUR_DROPLET_IP" ]]; then
  error "Set DEPLOY_HOST in this script to your Droplet IP before running."
fi

command -v ssh  >/dev/null || error "ssh not found"
command -v scp  >/dev/null || error "scp not found"
command -v npm  >/dev/null || error "npm not found"

info "Target: ${DEPLOY_USER}@${DEPLOY_HOST}"
info "Remote: ${REMOTE_DIR}"

# Test SSH connection
$SSH "echo 'SSH OK'" >/dev/null 2>&1 || error "Cannot SSH to ${DEPLOY_HOST}. Check your key/IP."
success "SSH connection verified"

# ─── Build frontend ───────────────────────────────────────────────────────────
if $DO_FRONTEND; then
  step "Building widget"
  (
    cd apps/embed-widget
    npm install --silent
    npm run build
  )
  cp apps/embed-widget/dist/widget.js services/api/app/static/widget.js
  success "widget.js built → services/api/app/static/widget.js"

  step "Building admin dashboard"
  (
    cd apps/admin-web
    echo "VITE_API_URL=${VITE_API_URL}" > .env.production
    npm install --silent
    npm run build
  )
  success "Admin dashboard built → apps/admin-web/dist/"
fi

# ─── Upload frontend ──────────────────────────────────────────────────────────
if $DO_FRONTEND; then
  step "Uploading admin dashboard"
  $SSH "mkdir -p ${REMOTE_DIR}/admin-dist"
  $SCP -r apps/admin-web/dist/. "${DEPLOY_USER}@${DEPLOY_HOST}:${REMOTE_DIR}/admin-dist/"
  success "Admin dashboard uploaded"

  step "Uploading widget.js"
  $SCP services/api/app/static/widget.js \
    "${DEPLOY_USER}@${DEPLOY_HOST}:${REMOTE_DIR}/services/api/app/static/widget.js"
  success "widget.js uploaded"
fi

# ─── Upload backend ───────────────────────────────────────────────────────────
if $DO_BACKEND; then
  step "Uploading backend"

  # Sync Python source (exclude venv, cache, uploads, chroma data)
  rsync -az --delete \
    --exclude='.venv' \
    --exclude='__pycache__' \
    --exclude='*.pyc' \
    --exclude='*.pyo' \
    --exclude='.env' \
    --exclude='uploads/' \
    --exclude='chroma_data/' \
    --exclude='alembic/versions/*.pyc' \
    services/api/ \
    "${DEPLOY_USER}@${DEPLOY_HOST}:${REMOTE_DIR}/services/api/"
  success "Backend source uploaded"

  step "Installing Python dependencies on server"
  $SSH "
    cd ${REMOTE_DIR}/services/api
    source .venv/bin/activate
    pip install -r requirements.txt --quiet
  "
  success "Dependencies installed"
fi

# ─── Run migrations ───────────────────────────────────────────────────────────
if $DO_BACKEND || $DO_MIGRATE; then
  step "Running database migrations"
  $SSH "
    cd ${REMOTE_DIR}/services/api
    source .venv/bin/activate
    alembic upgrade head
  "
  success "Migrations applied"
fi

# ─── Install infra (Nginx + systemd) — first-time setup only ─────────────────
if $DO_INSTALL_INFRA; then
  step "Installing Nginx config"
  $SCP infra/nginx/chatbot.conf "${DEPLOY_USER}@${DEPLOY_HOST}:/tmp/chatbot.conf"
  $SSH "
    sudo cp /tmp/chatbot.conf /etc/nginx/sites-available/chatbot
    sudo ln -sf /etc/nginx/sites-available/chatbot /etc/nginx/sites-enabled/chatbot
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo nginx -t
    sudo systemctl reload nginx
  "
  success "Nginx config installed and reloaded"

  step "Installing systemd service units"
  $SCP infra/systemd/chatbot-api.service    "${DEPLOY_USER}@${DEPLOY_HOST}:/tmp/chatbot-api.service"
  $SCP infra/systemd/chatbot-worker.service "${DEPLOY_USER}@${DEPLOY_HOST}:/tmp/chatbot-worker.service"
  $SSH "
    sudo cp /tmp/chatbot-api.service    /etc/systemd/system/chatbot-api.service
    sudo cp /tmp/chatbot-worker.service /etc/systemd/system/chatbot-worker.service
    sudo systemctl daemon-reload
    sudo systemctl enable chatbot-api chatbot-worker
    sudo systemctl start  chatbot-api chatbot-worker
  "
  success "systemd services installed and started"

  echo ""
  echo -e "${GREEN}${BOLD}✓ Infra install complete${NC}"
  echo "  Check status : ssh ${DEPLOY_USER}@${DEPLOY_HOST} 'sudo systemctl status chatbot-api chatbot-worker'"
  echo "  API logs     : ssh ${DEPLOY_USER}@${DEPLOY_HOST} 'sudo journalctl -u chatbot-api -f'"
  echo ""
  exit 0
fi

# ─── Restart API service ──────────────────────────────────────────────────────
if $DO_BACKEND; then
  step "Restarting API and worker services"
  $SSH "sudo systemctl restart ${API_SERVICE} ${WORKER_SERVICE}"

  # Wait then verify both are running
  sleep 3
  API_STATUS=$($SSH "sudo systemctl is-active ${API_SERVICE}" 2>/dev/null || echo "unknown")
  WORKER_STATUS=$($SSH "sudo systemctl is-active ${WORKER_SERVICE}" 2>/dev/null || echo "unknown")

  if [[ "$API_STATUS" == "active" ]]; then
    success "API service is running"
  else
    error "API service failed to start. Run: ssh ${DEPLOY_USER}@${DEPLOY_HOST} 'sudo journalctl -u ${API_SERVICE} -n 50'"
  fi

  if [[ "$WORKER_STATUS" == "active" ]]; then
    success "Worker service is running"
  else
    warn "Worker service may not be running (status: ${WORKER_STATUS}). Run: ssh ${DEPLOY_USER}@${DEPLOY_HOST} 'sudo journalctl -u ${WORKER_SERVICE} -n 20'"
  fi
fi

# ─── Reload Nginx ─────────────────────────────────────────────────────────────
if $DO_FRONTEND; then
  step "Reloading Nginx"
  $SSH "sudo nginx -t && sudo systemctl reload nginx"
  success "Nginx reloaded"
fi

# ─── Done ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}✓ Deploy complete${NC}"
echo ""
echo "  Admin panel : https://app.douglasgithuicreatives.tech"
echo "  API docs    : https://api.douglasgithuicreatives.tech/docs"
echo "  Widget URL  : https://api.douglasgithuicreatives.tech/static/widget.js"
echo ""
echo "  Logs        : ssh ${DEPLOY_USER}@${DEPLOY_HOST} 'sudo journalctl -u ${API_SERVICE} -f'"
echo ""
