# syntax=docker/dockerfile:1
#
# Requer o SAP NW RFC SDK para LINUX x64 (nao o Windows), presente em:
#   ./nwrfc750P_18-70002726/nwrfcsdk
# (pasta com bin/, include/, lib/*.so, obtida no SAP Support Portal - "SAP NW RFC SDK", plataforma Linux on x86_64)
# node-rfc precisa de glibc, por isso as imagens abaixo sao "bookworm" (Debian) e nao alpine/musl.

ARG NODE_VERSION=20-bookworm-slim

FROM node:${NODE_VERSION} AS base
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# --- builder: compila o TypeScript (nest build) ---
FROM base AS builder
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY nwrfc750P_18-70002726/nwrfcsdk /opt/sapnwrfc
ENV SAPNWRFC_HOME=/opt/sapnwrfc
ENV LD_LIBRARY_PATH=/opt/sapnwrfc/lib
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- prod-deps: node_modules so de producao (node-rfc compilado aqui) ---
FROM base AS prod-deps
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY nwrfc750P_18-70002726/nwrfcsdk /opt/sapnwrfc
ENV SAPNWRFC_HOME=/opt/sapnwrfc
ENV LD_LIBRARY_PATH=/opt/sapnwrfc/lib
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# --- runtime: imagem final, sem toolchain de build ---
FROM base AS runtime
ENV NODE_ENV=production
ENV LD_LIBRARY_PATH=/opt/sapnwrfc/lib
WORKDIR /app
COPY --chown=node:node --from=prod-deps /opt/sapnwrfc/lib /opt/sapnwrfc/lib
COPY --chown=node:node --from=prod-deps /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node package.json ./
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
