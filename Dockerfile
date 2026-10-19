# syntax=docker/dockerfile:1.7
# One image per service: docker build --build-arg APP=iam -t dreamlab-iam .
ARG NODE_VERSION=22.20-alpine

FROM node:${NODE_VERSION} AS base
RUN apk add --no-cache git && corepack enable
WORKDIR /app

FROM base AS build
ARG APP
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile
COPY . .
RUN pnpm exec nest build ${APP} && pnpm prune --prod

FROM node:${NODE_VERSION} AS runtime
ARG APP
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/package.json ./
COPY --from=build --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/dist/apps/${APP} ./dist
USER app
EXPOSE 3000 3001
CMD ["node", "dist/main.js"]
