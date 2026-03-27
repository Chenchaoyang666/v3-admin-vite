FROM node:22-bookworm-slim

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

COPY . .

ENV NODE_ENV=production
ENV VITE_PUBLIC_PATH=/
ENV PORT=7860
ENV DATA_DIR=/data

RUN pnpm build:space

EXPOSE 7860

CMD ["node", "backend/myInfo-server.js"]
