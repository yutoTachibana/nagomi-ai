# ============================================================
# こもれび Production Dockerfile (App Runner + Litestream)
# ============================================================

FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps
COPY . .

ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_FEATURE_E2E_ENCRYPTION=false
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_FEATURE_E2E_ENCRYPTION=${NEXT_PUBLIC_FEATURE_E2E_ENCRYPTION}
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build
RUN npm ci --legacy-peer-deps --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Litestream をインストール
RUN wget -q https://github.com/benbjohnson/litestream/releases/download/v0.3.13/litestream-v0.3.13-linux-amd64.tar.gz \
    && tar -xzf litestream-v0.3.13-linux-amd64.tar.gz -C /usr/local/bin/ \
    && rm litestream-v0.3.13-linux-amd64.tar.gz

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/package.json ./
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --chown=nextjs:nodejs litestream.yml /etc/litestream.yml

RUN mkdir -p /app/data && chown nextjs:nodejs /app/data
RUN chmod +x scripts/start.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_PATH=/app/data/komorebi.db

CMD ["sh", "scripts/start.sh"]
