FROM node:22-slim AS builder

WORKDIR /app

ENV CI=true

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --config.ignore-scripts=false

COPY . .

RUN pnpm build



FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/assets ./assets

EXPOSE 3000

CMD ["node", "dist/server.js"]