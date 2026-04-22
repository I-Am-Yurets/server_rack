# ── Backend Dockerfile — Лабораторна робота №5 ─────────────────────────────
# Node.js 20 Alpine — мінімальний образ для продакшену
FROM node:20-alpine

# Встановлюємо робочу директорію всередині контейнера
WORKDIR /app

# Копіюємо файли залежностей окремо (для кешування шарів Docker)
COPY package*.json ./

# Встановлюємо тільки production-залежності
RUN npm install --omit=dev

# Копіюємо решту вихідного коду
COPY . .

# Відкриваємо порт 3000 для REST API
EXPOSE 3000

# Health-check: перевіряє доступність /api/health кожні 30 секунд
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

# Запуск сервера
CMD ["node", "server.js"]
