# Optional single-service image (serves API and built web from /web/dist)
FROM node:22-alpine
WORKDIR /app
COPY api ./api
COPY web ./web
WORKDIR /app/api
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate \
 && pnpm install --frozen-lockfile \
 && pnpm run generate \
 && pnpm run build
WORKDIR /app/api
ENV NODE_ENV=production
CMD sh -c "pnpm run migrate:deploy && pnpm run start"