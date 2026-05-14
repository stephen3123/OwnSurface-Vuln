#!/bin/bash
set -e

DB_URL="${DATABASE_URL:-postgresql://xrayai:xrayai@localhost:5432/xrayai}"

echo "Running migrations against: $DB_URL"

# Create migration tracking table if it doesn't exist
psql "$DB_URL" -c "
CREATE TABLE IF NOT EXISTS _migrations (
    filename TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
" 2>/dev/null

applied=0
skipped=0

for migration in migrations/*.sql; do
    filename=$(basename "$migration")

    # Skip if already applied
    already=$(psql "$DB_URL" -tAc "SELECT 1 FROM _migrations WHERE filename = '$filename'" 2>/dev/null)
    if [ "$already" = "1" ]; then
        skipped=$((skipped + 1))
        continue
    fi

    echo "Applying $filename..."
    psql "$DB_URL" -f "$migration"

    # Record as applied
    psql "$DB_URL" -c "INSERT INTO _migrations (filename) VALUES ('$filename')" 2>/dev/null
    applied=$((applied + 1))
done

echo "Migrations complete: $applied applied, $skipped already applied."
