#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
API_DIR="$ROOT/services/api"

echo "==> Setting up Chatbot Platform development environment"

# Copy env file
if [ ! -f "$ROOT/.env" ]; then
  cp "$ROOT/.env.example" "$ROOT/.env"
  echo "  Created .env — fill in your credentials before running the API"
fi

# Python virtual environment
cd "$API_DIR"
if [ ! -d ".venv" ]; then
  python3.11 -m venv .venv
  echo "  Created Python venv"
fi
source .venv/bin/activate
pip install --quiet --upgrade pip
pip install --quiet -r requirements-dev.txt
echo "  Python deps installed"

# Create upload and chroma dirs
mkdir -p "$API_DIR/uploads" "$API_DIR/chroma_data" "$API_DIR/app/static"

# Run migrations
echo "  Running Alembic migrations..."
alembic upgrade head

# Seed demo data
echo "  Seeding demo data..."
python "$ROOT/infra/scripts/seed_demo.py" || echo "  (seed failed — check DB credentials)"

deactivate

# Node deps
cd "$ROOT"
npm install
echo "  Node deps installed"

echo ""
echo "==> Setup complete!"
echo ""
echo "Start the API:         cd services/api && source .venv/bin/activate && uvicorn app.main:app --reload"
echo "Start admin dashboard: npm run dev:admin"
echo "Start widget watch:    npm run dev:widget"
echo "Start demo site:       npm run dev:demo"
