# ── Frontend Dockerfile (Multi-stage build) — Лабораторна робота №5 ──────────
# Багатоетапна збірка для мінімізації розміру фінального образу

# ── Етап 1: Build ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Приймаємо URL бекенду як Build Argument (для докера)
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL

# Копіюємо залежності та встановлюємо їх
COPY package*.json ./
RUN npm install

# Копіюємо вихідний код та збираємо production-bundle
COPY . .
RUN npm run build

# ── Етап 2: Serve ─────────────────────────────────────────────────────────────
FROM nginx:alpine

# Копіюємо зібраний bundle до nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Копіюємо кастомну конфігурацію nginx (для SPA routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Відкриваємо порт 80
EXPOSE 80

# Health-check для nginx
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:80 || exit 1

CMD ["nginx", "-g", "daemon off;"]
