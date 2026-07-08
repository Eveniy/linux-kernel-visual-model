# syntax=docker/dockerfile:1

# ── Стадия сборки: собираем статический бандл Vite ──────────────────────
FROM node:20-alpine AS build
WORKDIR /app

# Сначала манифест — чтобы слой с зависимостями кэшировался отдельно.
COPY package.json ./
RUN npm install

# Затем исходники и сборка (tsc --noEmit && vite build).
COPY . .
RUN npm run build

# ── Стадия рантайма: раздаём статику через nginx ────────────────────────
FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
