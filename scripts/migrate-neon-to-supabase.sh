#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# migrate-neon-to-supabase.sh
# Exports all data from Neon and imports into Supabase.
#
# Usage:
#   chmod +x scripts/migrate-neon-to-supabase.sh
#   NEON_URL="postgresql://user:pass@neon-host/dbname?sslmode=require" \
#   SUPABASE_URL="postgresql://postgres.xxx:pass@aws-0-region.pooler.supabase.com:6543/postgres" \
#   bash scripts/migrate-neon-to-supabase.sh
#
# Prerequisites: psql, pg_dump, pg_restore (install via: brew install postgresql)
# ──────────────────────────────────────────────────────────────

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [[ -z "${NEON_URL:-}" || -z "${SUPABASE_URL:-}" ]]; then
  echo -e "${RED}Error: Set both NEON_URL and SUPABASE_URL env vars.${NC}"
  echo ""
  echo "Example:"
  echo '  NEON_URL="postgresql://user:pass@host/db?sslmode=require" \'
  echo '  SUPABASE_URL="postgresql://postgres.xxx:pass@host:6543/postgres" \'
  echo '  bash scripts/migrate-neon-to-supabase.sh'
  exit 1
fi

DUMP_FILE="neon_dump_$(date +%Y%m%d_%H%M%S).sql"

echo -e "${YELLOW}Step 1: Exporting data from Neon...${NC}"
pg_dump "$NEON_URL" \
  --no-owner \
  --no-privileges \
  --no-comments \
  --if-exists \
  --clean \
  --format=plain \
  --file="$DUMP_FILE"

echo -e "${GREEN}✓ Exported to $DUMP_FILE ($(du -h "$DUMP_FILE" | cut -f1))${NC}"

echo -e "${YELLOW}Step 2: Importing into Supabase...${NC}"
psql "$SUPABASE_URL" -f "$DUMP_FILE" 2>&1 | tail -5

echo -e "${GREEN}✓ Import complete!${NC}"

echo -e "${YELLOW}Step 3: Verifying tables...${NC}"
psql "$SUPABASE_URL" -c "
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
"

echo -e "${GREEN}✓ Migration complete! Update your Vercel DATABASE_URL to SUPABASE_URL.${NC}"
echo -e "${YELLOW}Cleanup: rm $DUMP_FILE${NC}"
