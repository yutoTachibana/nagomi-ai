#!/bin/sh
set -e

# 1. DB 初期化（テーブル作成）
node scripts/init-db.js

# 2. S3 からリストア（存在する場合のみ）
if litestream restore -if-replica-exists /app/data/komorebi.db; then
  echo "Restored database from S3"
else
  echo "No replica found, using fresh database"
fi

# 3. Litestream でレプリケーションしながら Next.js を起動
exec litestream replicate -exec "./node_modules/.bin/next start"
