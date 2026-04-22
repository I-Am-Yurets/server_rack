/**
 * server.js — Лабораторна робота №5
 * Node.js + Express Backend для моніторингу серверної стійки.
 *
 * Ендпоінти:
 *   GET  /api/status   — повертає поточний стан всіх датчиків
 *   POST /api/settings — приймає налаштування від фронтенду та зберігає
 *
 * Кожні SENSOR_INTERVAL мс сервер автоматично оновлює симульовані дані датчиків.
 * CORS увімкнено для порту 5173 (Vite dev server) та порту 80 (Docker nginx).
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const SENSOR_INTERVAL = Number(process.env.SENSOR_INTERVAL) || 5000;

/* ── Middleware ──────────────────────────────────────────────────────────── */

app.use(cors({
  origin: [
    'http://localhost:5173',  // Vite dev server
    'http://localhost:80',    // nginx в Docker
    'http://localhost',       // nginx без порту
    'http://127.0.0.1:5173',
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

/* ── Утиліта генерації випадкового числа в діапазоні ────────────────────── */

function rand(min, max, decimals = 0) {
  const value = Math.random() * (max - min) + min;
  return +value.toFixed(decimals);
}

/* ── Стан системи (зберігається в пам'яті сервера) ─────────────────────── */

let systemState = {
  // Налаштовувані параметри
  systemName: process.env.SYSTEM_NAME || 'Rack-01 • Дата-центр UA-1',
  maxTemp: Number(process.env.MAX_TEMP) || 85,
  interval: SENSOR_INTERVAL / 1000,

  // Дані датчиків (оновлюються автоматично)
  cpuTemp: 62,
  cpuLoad: 45,
  sshCount: 3,
  ramUsed: 11.5,
  ramTotal: 16,
  diskUsed: 245,
  diskTotal: 500,
  swapUsed: 1.2,
  swapTotal: 8,
  networkDown: 2.4,
  networkUp: 1.8,
  networkLatency: 12,
  uptime: 99.8,
  isMonitoring: true,

  // Мета-інформація
  serverTime: new Date().toISOString(),
  tickCount: 0,
};

/* ── Функція симуляції датчиків (виконується кожні SENSOR_INTERVAL мс) ─── */

function simulateSensors() {
  systemState.cpuTemp = rand(48, 78);
  systemState.cpuLoad = rand(20, 90);
  systemState.sshCount = rand(1, 6);
  systemState.networkDown = rand(1.2, 3.8, 1);
  systemState.networkUp = rand(0.8, 2.4, 1);
  systemState.networkLatency = rand(8, 35);
  systemState.ramUsed = rand(8.0, 15.2, 1);
  systemState.diskUsed = rand(200, 420);
  systemState.swapUsed = rand(0.5, 4.0, 1);
  systemState.uptime = rand(99.0, 100.0, 1);
  systemState.serverTime = new Date().toISOString();
  systemState.tickCount++;

  console.log(
      `[${new Date().toLocaleTimeString('uk-UA')}] Tick #${systemState.tickCount} | ` +
      `CPU: ${systemState.cpuTemp}°C / ${systemState.cpuLoad}% | ` +
      `RAM: ${systemState.ramUsed}/${systemState.ramTotal} GB | ` +
      `Net↓: ${systemState.networkDown} GB/s`
  );
}

// Запускаємо симуляцію одразу і кожні SENSOR_INTERVAL мс
simulateSensors();
let sensorTimer = setInterval(simulateSensors, SENSOR_INTERVAL);

/* ══════════════════════════════════════════════════════════════════════════
   REST API ендпоінти
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * GET /api/status
 * Повертає поточний стан всіх датчиків та налаштувань системи.
 *
 * Відповідь: { ...systemState }
 */
app.get('/api/status', (req, res) => {
  // Забороняємо кешування, щоб фронтенд завжди отримував свіжі дані
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.json({
    ok: true,
    data: { ...systemState },
  });
});

/**
 * GET /api/settings
 * Повертає поточні налаштування системи.
 */
app.get('/api/settings', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({
    ok: true,
    data: {
      systemName: systemState.systemName,
      maxTemp:    systemState.maxTemp,
      interval:   systemState.interval,
    },
  });
});

/**
 * POST /api/settings
 * Приймає та зберігає налаштування системи.
 *
 * Тіло запиту: { systemName?, maxTemp?, interval? }
 * Відповідь:   { ok: true, applied: { systemName, maxTemp, interval } }
 */
app.post('/api/settings', (req, res) => {
  const { systemName, maxTemp, interval } = req.body;

  if (systemName !== undefined) systemState.systemName = String(systemName);
  if (maxTemp    !== undefined) systemState.maxTemp    = Number(maxTemp);

  if (interval !== undefined && Number(interval) > 0) {
    systemState.interval = Number(interval);
    // Перезапускаємо таймер симуляції з новим інтервалом
    clearInterval(sensorTimer);
    sensorTimer = setInterval(simulateSensors, systemState.interval * 1000);
  }

  console.log(
      `[${new Date().toLocaleTimeString('uk-UA')}] Settings updated:`,
      { systemName: systemState.systemName, maxTemp: systemState.maxTemp, interval: systemState.interval }
  );

  res.json({
    ok: true,
    applied: {
      systemName: systemState.systemName,
      maxTemp:    systemState.maxTemp,
      interval:   systemState.interval,
    },
  });
});

/**
 * GET /api/health
 * Health-check ендпоінт для Docker health checks.
 */
app.get('/api/health', (req, res) => {
  res.json({ ok: true, uptime: process.uptime(), timestamp: new Date().toISOString() });
});

/* ── 404 handler ─────────────────────────────────────────────────────────── */
app.use((req, res) => {
  res.status(404).json({ ok: false, error: `Route ${req.method} ${req.path} not found` });
});

/* ── Запуск сервера ──────────────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   Server Rack Backend — Лабораторна робота №5   ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  🟢 Server running at  http://localhost:${PORT}      ║`);
  console.log(`║  📡 GET  /api/status                             ║`);
  console.log(`║  ⚙️  POST /api/settings                          ║`);
  console.log(`║  ❤️  GET  /api/health                            ║`);
  console.log(`║  🔄 Sensor interval: ${SENSOR_INTERVAL}ms                    ║`);
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');
});
