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
npx nodemon index.js &
BACKEND_PID=$!

# Start frontend with Vite (hot reload built-in)
cd "$PROJECT_DIR/client"
npx vite --port ${FRONTEND_PORT:-3000} --host &
FRONTEND_PID=$!

echo -e "${GREEN}  ✓ Both servers started with hot reload!${NC}"
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
