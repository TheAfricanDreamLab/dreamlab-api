# syntax=docker/dockerfile:1.7
# One image per service: docker build --build-arg APP=iam -t dreamlab-iam .
# The catalog adds video tools (its video worker runs from the same image):
#   docker build --build-arg APP=catalog --target catalog -t dreamlab-catalog .
# Node 24.22.1: the October 2026 security release (Brotli RCE, TLS hostname bypasses).
ARG NODE_VERSION=24.22.1-alpine

FROM node:${NODE_VERSION} AS base
RUN apk add --no-cache git && corepack enable
WORKDIR /app

FROM base AS build
ARG APP
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile
COPY . .
RUN pnpm exec nest build ${APP} && pnpm prune --prod

FROM node:${NODE_VERSION} AS runtime-base
ARG APP
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/package.json ./
COPY --from=build --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/dist/apps/${APP} ./dist
EXPOSE 3000 3001
CMD ["node", "dist/main.js"]

# Speech recognition for automatic captions (CAT-6): whisper.cpp built for this image's libc, with
# the instruction sets every Dream Lab VM has (AVX2), not the build machine's. The model is pinned.
FROM node:${NODE_VERSION} AS whisper
ARG WHISPER_VERSION=v1.8.7
RUN apk add --no-cache build-base cmake git
RUN git clone --depth 1 --branch ${WHISPER_VERSION} https://github.com/ggml-org/whisper.cpp /src \
  && cmake -S /src -B /build -DCMAKE_BUILD_TYPE=Release -DBUILD_SHARED_LIBS=OFF -DWHISPER_BUILD_TESTS=OFF -DWHISPER_BUILD_SERVER=OFF \
       -DGGML_NATIVE=OFF -DGGML_AVX=ON -DGGML_AVX2=ON -DGGML_FMA=ON -DGGML_F16C=ON \
  && cmake --build /build --config Release -j"$(nproc)" --target whisper-cli \
  && mkdir -p /out && cp /build/bin/whisper-cli /out/
ARG WHISPER_MODEL_SHA256=60ed5bc3dd14eea856493d334349b405782ddcaf0028d4b5df4088345fba2efe
RUN wget -q -O /out/ggml-base.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin   && echo "${WHISPER_MODEL_SHA256}  /out/ggml-base.bin" | sha256sum -c -

# The catalog: the API and, with CATALOG_ROLE=video-worker, the video worker (ffmpeg and whisper.cpp).
FROM runtime-base AS catalog
RUN apk add --no-cache ffmpeg libstdc++ libgomp && mkdir -p /work && chown app:app /work
COPY --from=whisper /out/whisper-cli /usr/local/bin/whisper-cli
COPY --from=whisper /out/ggml-base.bin /opt/whisper/ggml-base.bin
USER app

# Every other service (the default target).
FROM runtime-base AS runtime
USER app
