# Optional single-service image (serves API and built web from /web/dist)
FROM node:22-alpine
WORKDIR /app
# Explicitly copy migrations to ensure they're included
COPY api ./api
COPY web ./web
WORKDIR /app/api
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate \
 && pnpm install --frozen-lockfile \
 && npx prisma generate --schema=prisma/schema.prisma \
 && pnpm run build
WORKDIR /app/api
ENV NODE_ENV=production
# Debug: List migrations and verify files exist before running migrate deploy
CMD sh -c "echo 'Checking migrations...' && find prisma/migrations -type f && echo 'Running migrations...' && pnpm run migrate:deploy && pnpm run start"