#!/bin/sh
set -e

# Bring the schema up to date before serving traffic. Kysely records applied
# migrations in kysely_migration, so this is a no-op once the database is current
# and stays correct when a container restarts.
#
# Set RUN_MIGRATIONS=false to skip — e.g. when several instances start at once and
# migrations are run from a single place instead.
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "[entrypoint] running database migrations"
  MIGRATE_NON_INTERACTIVE=true node /app/dist-migrate/migrator.js
  echo "[entrypoint] migrations up to date"
else
  echo "[entrypoint] RUN_MIGRATIONS=false, skipping migrations"
fi

exec node /app/server.js
