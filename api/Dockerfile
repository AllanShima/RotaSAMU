# ---- Base ----
FROM node:22-alpine AS base
RUN npm install -g npm@11
RUN apk add --no-cache openssl
WORKDIR /usr/src/app
COPY package*.json ./
COPY prisma ./prisma/

# ---- Build ----
FROM base AS build
RUN npm ci
RUN npx prisma generate
COPY . .
# RUN npm run build   # descomente se usar TS

# ---- Dependencies de produção ----
FROM base AS deps
RUN npm ci --omit=dev
# gera o client usando o CLI do estágio build e copia o resultado
COPY --from=build /usr/src/app/node_modules/.prisma ./node_modules/.prisma

# ---- Production ----
FROM node:22-alpine AS production
RUN npm install -g npm@11
RUN apk add --no-cache openssl
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
EXPOSE 3001
USER node
CMD ["node", "src/server.js"]
