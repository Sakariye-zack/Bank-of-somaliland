FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/public/package.json ./apps/public/
COPY apps/admin/package.json ./apps/admin/
COPY packages/shared-types/package.json ./packages/shared-types/
RUN npm ci
COPY . .
RUN npm run build -w apps/api

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api ./apps/api
COPY --from=builder /app/packages/shared-types ./packages/shared-types
CMD ["npm", "run", "start", "-w", "apps/api"]
