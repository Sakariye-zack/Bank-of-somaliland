FROM node:20-alpine AS builder
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
WORKDIR /app
COPY package*.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/public/package.json ./apps/public/
COPY apps/admin/package.json ./apps/admin/
COPY packages/shared-types/package.json ./packages/shared-types/
RUN npm ci
COPY . .
RUN npm run build -w apps/admin

FROM caddy:2-alpine
COPY --from=builder /app/apps/admin/dist /usr/share/caddy
COPY apps/admin/Caddyfile /etc/caddy/Caddyfile
