#!/bin/bash
set -euo pipefail

REGION="ap-northeast-1"
ACCOUNT_ID="141166306676"
ECR_REPO="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/komorebi"
APP_URL="${APP_URL:-https://your-app-url}"

echo "=== こもれび デプロイ ==="

# 1. ECR ログイン
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com

# 2. Docker ビルド (ARM64 for Fargate Graviton)
echo "Building Docker image..."
docker buildx build --platform linux/arm64 \
  --build-arg NEXT_PUBLIC_APP_URL=${APP_URL} \
  -t ${ECR_REPO}:latest \
  --push .

# 3. ECS サービス更新 (新イメージでタスク再起動)
echo "Updating ECS service..."
aws ecs update-service \
  --cluster komorebi \
  --service $(aws ecs list-services --cluster komorebi --query 'serviceArns[0]' --output text | xargs basename) \
  --force-new-deployment \
  --region $REGION

echo "=== デプロイ完了 ==="
echo "URL: ${APP_URL}"
