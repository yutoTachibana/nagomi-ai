#!/bin/sh
set -e

# 1. S3 からリストア (DB ファイルが存在しないときだけ)
#    init-db.js より先に走らせないと、空ファイルが既に存在することになり
#    litestream restore がスキップされ、毎デプロイでデータが失われる.
if [ ! -f /app/data/komorebi.db ]; then
  litestream restore -if-replica-exists /app/data/komorebi.db
  if [ -f /app/data/komorebi.db ]; then
    echo "Restored database from S3"
  else
    echo "No replica found, starting fresh database"
  fi
fi

# 2. スキーマ適用 (CREATE TABLE IF NOT EXISTS なので冪等)
node scripts/init-db.js

# 3. Litestream でレプリケーションしながら Next.js を起動
exec litestream replicate -exec "./node_modules/.bin/next start"
