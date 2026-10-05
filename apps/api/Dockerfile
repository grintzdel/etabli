# syntax=docker/dockerfile:1

FROM node:24-alpine AS base
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && pnpm config set store-dir /pnpm/store
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/
COPY apps/mobile/package.json apps/mobile/
COPY packages/contract/package.json packages/contract/
COPY packages/api-client/package.json packages/api-client/
COPY packages/ui/package.json packages/ui/

FROM base AS deps
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter @etabli/api...

FROM deps AS dev
COPY tsconfig.json tsconfig.base.json tsconfig.app-base.json tsconfig.pkg-base.json tsconfig.root.json ./
COPY packages/contract ./packages/contract
RUN pnpm --filter @etabli/contract run build
WORKDIR /app/apps/api
EXPOSE 3001
CMD ["sh", "-c", "pnpm --filter @etabli/contract exec tsdown --watch --no-clean & pnpm exec tsx src/infrastructure/database/migrate.ts && pnpm exec tsx src/infrastructure/database/seed.cli.ts && exec pnpm exec nest start --watch"]

FROM deps AS builder
COPY tsconfig.json tsconfig.base.json tsconfig.app-base.json tsconfig.pkg-base.json tsconfig.root.json ./
COPY packages/contract ./packages/contract
COPY apps/api ./apps/api
RUN pnpm --filter @etabli/contract run build && pnpm --filter @etabli/api run build

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --prod --filter @etabli/api...

FROM node:24-alpine AS runner
# The bundled package managers carry most of the base image's CVEs and nothing runs them here
RUN rm -rf /usr/local/lib/node_modules /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack /opt/yarn* /usr/local/bin/yarn /usr/local/bin/yarnpkg
WORKDIR /app
ENV NODE_ENV=production
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=prod-deps --chown=node:node /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder --chown=node:node /app/packages/contract/dist ./packages/contract/dist
COPY --chown=node:node packages/contract/package.json ./packages/contract/
COPY --from=builder --chown=node:node /app/apps/api/dist ./apps/api/dist
COPY --chown=node:node apps/api/package.json ./apps/api/
USER node
WORKDIR /app/apps/api
EXPOSE 3001
CMD ["node", "dist/main.js"]
