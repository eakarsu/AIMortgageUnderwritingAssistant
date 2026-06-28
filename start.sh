#!/bin/bash

echo "=========================================="
echo "  🏦 AI Mortgage Underwriting Assistant"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"
LOG_DIR="$PROJECT_DIR/logs"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"

mkdir -p "$LOG_DIR"
: > "$BACKEND_LOG"
: > "$FRONTEND_LOG"

wait_for_url() {
  local name="$1"
  local url="$2"
  local log_file="$3"
  local attempts="${4:-60}"

  echo -e "${YELLOW}  Waiting for ${name}: ${url}${NC}"
  for i in $(seq 1 "$attempts"); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      echo -e "${GREEN}  ✓ ${name} is ready${NC}"
      return 0
    fi
    sleep 0.5
  done

  echo -e "${RED}  ✗ ${name} did not become ready at ${url}${NC}"
  echo -e "${YELLOW}  Last ${name} log lines:${NC}"
  tail -80 "$log_file" 2>/dev/null || true
  return 1
}

# Step 1: Kill processes on ports 3000 and 3001
echo -e "${YELLOW}[1/6] Cleaning up ports 3000 and 3001...${NC}"
for port in 3000 3001; do
  pids=$(lsof -ti :$port 2>/dev/null)
  if [ -n "$pids" ]; then
    echo "  Killing processes on port $port: $pids"
    echo "$pids" | xargs kill -9 2>/dev/null
  fi
done
echo -e "${GREEN}  ✓ Ports cleaned${NC}"

# Step 2: Check PostgreSQL
echo -e "${YELLOW}[2/6] Checking PostgreSQL...${NC}"
if ! command -v psql &> /dev/null; then
  echo -e "${RED}  ✗ PostgreSQL not found. Please install PostgreSQL.${NC}"
  exit 1
fi

# Try to connect
if ! pg_isready -h localhost -p 5432 &> /dev/null; then
  echo -e "${YELLOW}  Starting PostgreSQL...${NC}"
  if command -v brew &> /dev/null; then
    brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null
  fi
  sleep 2
fi

# Load env
set -a
source "$PROJECT_DIR/.env"
set +a

# Create database if not exists
echo -e "${YELLOW}[3/6] Setting up database...${NC}"
psql -h ${DB_HOST:-localhost} -U ${DB_USER:-postgres} -tc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME:-mortgage_underwriting}'" 2>/dev/null | grep -q 1 || \
  createdb -h ${DB_HOST:-localhost} -U ${DB_USER:-postgres} "${DB_NAME:-mortgage_underwriting}" 2>/dev/null
echo -e "${GREEN}  ✓ Database ready${NC}"

# Step 3: Install dependencies
echo -e "${YELLOW}[4/6] Installing dependencies...${NC}"
cd "$PROJECT_DIR/server"
if [ ! -d "node_modules" ]; then
  npm install --silent
fi
cd "$PROJECT_DIR/client"
if [ ! -d "node_modules" ]; then
  npm install --silent
fi
echo -e "${GREEN}  ✓ Dependencies installed${NC}"

# Step 4: Seed database
echo -e "${YELLOW}[5/6] Seeding database...${NC}"
cd "$PROJECT_DIR/server"
node seed.js
echo -e "${GREEN}  ✓ Database seeded${NC}"

# Step 5: Start servers with hot reload
echo -e "${YELLOW}[6/6] Starting servers with hot reload...${NC}"
echo ""
echo -e "${BLUE}=========================================="
echo -e "  Backend:  http://localhost:${BACKEND_PORT:-3001}"
echo -e "  Frontend: http://localhost:${FRONTEND_PORT:-3000}"
echo -e "==========================================${NC}"
echo ""

# Start backend with nodemon (hot reload)
cd "$PROJECT_DIR/server"
(npx nodemon index.js 2>&1 | tee "$BACKEND_LOG") &
BACKEND_PID=$!

if ! wait_for_url "backend" "http://localhost:${BACKEND_PORT:-3001}/api/health" "$BACKEND_LOG"; then
  kill $BACKEND_PID 2>/dev/null
  exit 1
fi

# Start frontend with Vite (hot reload built-in)
cd "$PROJECT_DIR/client"
(npx vite --port ${FRONTEND_PORT:-3000} --host 2>&1 | tee "$FRONTEND_LOG") &
FRONTEND_PID=$!

if ! wait_for_url "frontend" "http://localhost:${FRONTEND_PORT:-3000}" "$FRONTEND_LOG"; then
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  exit 1
fi

echo -e "${GREEN}  ✓ Both servers started with hot reload!${NC}"
echo -e "${BLUE}  Backend log:  logs/backend.log${NC}"
echo -e "${BLUE}  Frontend log: logs/frontend.log${NC}"
echo -e "${YELLOW}  Press Ctrl+C to stop all servers${NC}"
echo ""

# Cleanup on exit
cleanup() {
  echo ""
  echo -e "${YELLOW}Shutting down servers...${NC}"
  kill $BACKEND_PID 2>/dev/null
  kill $FRONTEND_PID 2>/dev/null
  for port in 3000 3001; do
    pids=$(lsof -ti :$port 2>/dev/null)
    if [ -n "$pids" ]; then
      echo "$pids" | xargs kill -9 2>/dev/null
    fi
  done
  echo -e "${GREEN}All servers stopped.${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for both processes
wait
