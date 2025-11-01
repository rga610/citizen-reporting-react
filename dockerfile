# Optional single-service image (serves API and built web from /web/dist)
FROM node:22-alpine
WORKDIR /app
COPY api ./api
COPY web ./web
WORKDIR /app/api
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate \
 && pnpm install --frozen-lockfile \
 && npx prisma generate
WORKDIR /app/web
RUN pnpm install --frozen-lockfile && pnpm run build
WORKDIR /app/api
ENV NODE_ENV=production
CMD sh -c "pnpm prisma migrate deploy && pnpm build && node dist/server.js"