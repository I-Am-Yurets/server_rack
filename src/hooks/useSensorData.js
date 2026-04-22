/**
 * useSensorData.js — Лабораторна робота №5 (оновлено)
 * Кастомний хук для отримання даних датчиків з Node.js сервера через fetch.
 *
 * ── Зміни відносно Лаб. №4 ───────────────────────────────────────────────
 * • Дані тепер РЕАЛЬНО приходять з сервера (GET /api/status)
 * • Локальний TICK-таймер замінено на polling-запити до бекенду
 * • Збереження налаштувань надсилає POST /api/settings на сервер
 * • При відсутності сервера — показується індикатор "Connection Lost"
 *
 * ── localStorage-ключі збережено для fallback та синхронізації між вкладками ──
 *   'srm-settings'   — { systemName, maxTemp, sensorInterval }
 *   'srm-sensors'    — поточні значення датчиків
 *   'srm-logs'       — масив рядків логів (до 200 записів)
 */

import { useReducer, useEffect, useCallback, useRef } from 'react';

/* ── Базова URL адреса API (з .env або дефолт) ─────────────────────────── */
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/* ── Утиліти генерації (fallback при відсутності сервера) ──────────────── */

function randomInRange(min, max, step = 1) {
  const steps = Math.floor((max - min) / step);
  return +(min + Math.floor(Math.random() * (steps + 1)) * step).toFixed(1);
}

const STORAGE_KEYS = {
  settings: 'srm-settings',
  sensors:  'srm-sensors',
  logs:     'srm-logs',
};

const MAX_LOGS = 200;

/* ── Дефолтні значення ─────────────────────────────────────────────────── */

const DEFAULT_SETTINGS = {
  systemName:     'Rack-01 • Дата-центр UA-1',
  maxTemp:        85,
  sensorInterval: 3000,
};

const DEFAULT_SENSORS = {
  cpuTemp:        62,
  cpuLoad:        45,
  sshCount:       3,
  ramUsed:        11.5,
  ramTotal:       16,
  diskUsed:       245,
  diskTotal:      500,
  swapUsed:       1.2,
  swapTotal:      8,
  networkDown:    2.4,
  networkUp:      1.8,
  networkLatency: 12,
  uptime:         99.8,
  isMonitoring:   true,
};

const BOOT_LOGS = [
  { time: '14:23:47', level: 'OK',    message: 'SSH daemon started on port 22' },
  { time: '14:24:12', level: 'INFO',  message: 'New connection from 192.168.1.105 accepted' },
  { time: '14:25:03', level: 'WARN',  message: 'CPU temperature reached 65°C on core 2' },
  { time: '14:29:12', level: 'ERROR', message: 'Failed to connect to backup-srv-01: timeout' },
  { time: '14:29:18', level: 'OK',    message: 'Connection restored to backup-srv-01' },
];

/* ── localStorage helpers ──────────────────────────────────────────────── */

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    if (!raw) return DEFAULT_SETTINGS;
    const s = JSON.parse(raw);
    return {
      systemName:     s.systemName     || DEFAULT_SETTINGS.systemName,
      maxTemp:        Number(s.maxTemp) || DEFAULT_SETTINGS.maxTemp,
      sensorInterval: Number(s.sensorInterval) || DEFAULT_SETTINGS.sensorInterval,
    };
  } catch (_) { return DEFAULT_SETTINGS; }
}

function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify({
      systemName:     settings.systemName,
      maxTemp:        settings.maxTemp,
      sensorInterval: settings.sensorInterval,
    }));
  } catch (_) {}
}

function loadSensors() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.sensors);
    if (!raw) return DEFAULT_SENSORS;
    const s = JSON.parse(raw);
    return {
      cpuTemp:        Number(s.cpuTemp)        || DEFAULT_SENSORS.cpuTemp,
      cpuLoad:        Number(s.cpuLoad)        || DEFAULT_SENSORS.cpuLoad,
      sshCount:       Number(s.sshCount)       || DEFAULT_SENSORS.sshCount,
      ramUsed:        Number(s.ramUsed)        || DEFAULT_SENSORS.ramUsed,
      ramTotal:       Number(s.ramTotal)       || DEFAULT_SENSORS.ramTotal,
      diskUsed:       Number(s.diskUsed)       || DEFAULT_SENSORS.diskUsed,
      diskTotal:      Number(s.diskTotal)      || DEFAULT_SENSORS.diskTotal,
      swapUsed:       Number(s.swapUsed)       || DEFAULT_SENSORS.swapUsed,
      swapTotal:      Number(s.swapTotal)      || DEFAULT_SENSORS.swapTotal,
      networkDown:    Number(s.networkDown)    || DEFAULT_SENSORS.networkDown,
      networkUp:      Number(s.networkUp)      || DEFAULT_SENSORS.networkUp,
      networkLatency: Number(s.networkLatency) || DEFAULT_SENSORS.networkLatency,
      uptime:         Number(s.uptime)         || DEFAULT_SENSORS.uptime,
      isMonitoring:   s.isMonitoring ?? DEFAULT_SENSORS.isMonitoring,
    };
  } catch (_) { return DEFAULT_SENSORS; }
}

function saveSensors(sensors) {
  try {
    localStorage.setItem(STORAGE_KEYS.sensors, JSON.stringify(sensors));
  } catch (_) {}
}

function loadLogs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.logs);
    if (!raw) return BOOT_LOGS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : BOOT_LOGS;
  } catch (_) { return BOOT_LOGS; }
}

function saveLogs(logs) {
  try {
    const toSave = logs.length > MAX_LOGS ? logs.slice(-MAX_LOGS) : logs;
    localStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(toSave));
  } catch (_) {}
}

/* ── Початковий стан ───────────────────────────────────────────────────── */

function buildInitialState() {
  const settings = loadSettings();
  const sensors  = loadSensors();

  const now = new Date();
  const chartHistory = Array.from({ length: 20 }, (_, i) => ({
    time: new Date(now - (19 - i) * 3000)
        .toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    cpu: randomInRange(20, 90),
    ram: randomInRange(50, 95),
    net: randomInRange(1.2, 3.8, 0.1),
  }));

  return {
    sensors:      { ...sensors },
    settings:     { ...settings },
    logs:         loadLogs(),
    chartHistory,
    serverOnline: null,   // null = ще не перевіряли; true/false = результат
  };
}

/* ════════════════════════════════════════════════════════════════════════
   REDUCER
   ════════════════════════════════════════════════════════════════════════ */

function sensorReducer(state, action) {
  switch (action.type) {

      // ── Отримані дані з сервера (замінює локальний TICK) ──
    case 'SERVER_TICK': {
      if (!state.sensors.isMonitoring) return { ...state, serverOnline: true };

      const d = action.payload;
      const newSensors = {
        ...state.sensors,
        cpuTemp:        d.cpuTemp        ?? state.sensors.cpuTemp,
        cpuLoad:        d.cpuLoad        ?? state.sensors.cpuLoad,
        sshCount:       d.sshCount       ?? state.sensors.sshCount,
        networkDown:    d.networkDown    ?? state.sensors.networkDown,
        networkUp:      d.networkUp      ?? state.sensors.networkUp,
        networkLatency: d.networkLatency ?? state.sensors.networkLatency,
        ramUsed:        d.ramUsed        ?? state.sensors.ramUsed,
        ramTotal:       d.ramTotal       ?? state.sensors.ramTotal,
        diskUsed:       d.diskUsed       ?? state.sensors.diskUsed,
        diskTotal:      d.diskTotal      ?? state.sensors.diskTotal,
        swapUsed:       d.swapUsed       ?? state.sensors.swapUsed,
        uptime:         d.uptime         ?? state.sensors.uptime,
      };

      // Синхронізуємо налаштування з сервером (джерело істини)
      const newSettings = {
        ...state.settings,
        systemName:     d.systemName !== undefined ? d.systemName : state.settings.systemName,
        maxTemp:        d.maxTemp !== undefined ? d.maxTemp : state.settings.maxTemp,
        sensorInterval: d.interval ? d.interval * 1000 : state.settings.sensorInterval,
      };

      const now = new Date().toLocaleTimeString('uk-UA',
          { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const ramPct = Math.round((newSensors.ramUsed / newSensors.ramTotal) * 100);
      const newPoint = {
        time: now,
        cpu:  newSensors.cpuLoad,
        ram:  ramPct,
        net:  +newSensors.networkDown.toFixed(1),
      };
      const newHistory = [...state.chartHistory, newPoint];

      return {
        ...state,
        sensors:      newSensors,
        settings:     newSettings,
        chartHistory: newHistory.length > 30 ? newHistory.slice(-30) : newHistory,
        serverOnline: true,
      };
    }

      // ── Помилка з'єднання з сервером ──
    case 'SERVER_ERROR': {
      return { ...state, serverOnline: false };
    }

      // ── Синхронізація датчиків з іншої вкладки (localStorage) ──
    case 'SYNC_SENSORS': {
      return { ...state, sensors: { ...state.sensors, ...action.payload } };
    }

      // ── Синхронізація налаштувань з іншої вкладки ──
    case 'SYNC_SETTINGS': {
      return { ...state, settings: { ...state.settings, ...action.payload } };
    }

      // ── Пауза / відновлення моніторингу ──
    case 'TOGGLE_MONITORING': {
      return {
        ...state,
        sensors: { ...state.sensors, isMonitoring: !state.sensors.isMonitoring },
      };
    }

      // ── Збереження налаштувань ──
    case 'APPLY_SETTINGS': {
      const { systemName, maxTemp, interval } = action.payload;
      const newSettings = {
        systemName:     systemName ?? state.settings.systemName,
        maxTemp:        Number(maxTemp) || state.settings.maxTemp,
        sensorInterval: interval ? Number(interval) * 1000 : state.settings.sensorInterval,
      };
      return { ...state, settings: newSettings };
    }

      // ── Додавання запису до консолі ──
    case 'ADD_LOG': {
      const { level, message } = action.payload;
      const time = new Date().toTimeString().split(' ')[0];
      const newLogs = [...state.logs, { time, level, message }];
      return {
        ...state,
        logs: newLogs.length > MAX_LOGS ? newLogs.slice(-MAX_LOGS) : newLogs,
      };
    }

      // ── Очищення консолі ──
    case 'CLEAR_LOGS': {
      return { ...state, logs: [] };
    }

      // ── Синхронізація логів між вкладками ──
    case 'SYNC_LOGS': {
      return { ...state, logs: action.payload };
    }

    default:
      return state;
  }
}

/* ══════════════════════════════════════════════════════════════════════
   ГОЛОВНИЙ ХУК
   ══════════════════════════════════════════════════════════════════════ */

export function useSensorData() {

  const [appState, dispatch] = useReducer(sensorReducer, null, buildInitialState);

  const stateRef        = useRef(appState);
  stateRef.current      = appState;
  const pollTimerRef    = useRef(null);
  const wasOfflineRef   = useRef(false);

  /* ── Persist датчиків ── */
  useEffect(() => { saveSensors(appState.sensors); }, [appState.sensors]);

  /* ── Persist налаштувань ── */
  useEffect(() => { saveSettings(appState.settings); }, [appState.settings]);

  /* ── Persist логів ── */
  useEffect(() => { saveLogs(appState.logs); }, [appState.logs]);

  /* ── Синхронізація між вкладками ── */
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEYS.sensors && e.newValue) {
        try { dispatch({ type: 'SYNC_SENSORS', payload: JSON.parse(e.newValue) }); } catch (_) {}
      }
      if (e.key === STORAGE_KEYS.settings && e.newValue) {
        try { dispatch({ type: 'SYNC_SETTINGS', payload: JSON.parse(e.newValue) }); } catch (_) {}
      }
      if (e.key === STORAGE_KEYS.logs && e.newValue) {
        try {
          const logs = JSON.parse(e.newValue);
          if (Array.isArray(logs)) dispatch({ type: 'SYNC_LOGS', payload: logs });
        } catch (_) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  /* ══════════════════════════════════════════════════════════════════
     POLLING — замінює локальний TICK таймер
     Кожні sensorInterval мс робимо GET /api/status
     ══════════════════════════════════════════════════════════════════ */
  useEffect(() => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);

    const poll = async () => {
      // Не робимо запит якщо моніторинг на паузі
      if (!stateRef.current.sensors.isMonitoring) return;

      try {
        const res = await fetch(`${API_BASE}/api/status`, {
          signal: AbortSignal.timeout(5000),
          cache: 'no-store',
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        const data = json.data || json;

        dispatch({ type: 'SERVER_TICK', payload: data });

        // Якщо повернулись після розриву — логуємо відновлення
        if (wasOfflineRef.current) {
          wasOfflineRef.current = false;
          dispatch({ type: 'ADD_LOG', payload: {
              level: 'OK',
              message: `Connection restored to ${API_BASE}`,
            }});
        }

      } catch (err) {
        dispatch({ type: 'SERVER_ERROR' });

        // Логуємо "Connection Lost" тільки перший раз (не спамимо)
        if (!wasOfflineRef.current) {
          wasOfflineRef.current = true;
          dispatch({ type: 'ADD_LOG', payload: {
              level: 'ERROR',
              message: `Connection Lost: cannot reach ${API_BASE}/api/status — ${err.message}`,
            }});
        }
      }
    };

    // Перший запит одразу при монтуванні / зміні інтервалу
    poll();
    pollTimerRef.current = setInterval(poll, appState.settings.sensorInterval);

    return () => { if (pollTimerRef.current) clearInterval(pollTimerRef.current); };
  }, [appState.settings.sensorInterval, appState.sensors.isMonitoring]);

  /* ── Публічні методи ── */

  const addLog = useCallback((level, message) => {
    dispatch({ type: 'ADD_LOG', payload: { level, message } });
  }, []);

  const toggleMonitoring = useCallback(() => {
    dispatch({ type: 'TOGGLE_MONITORING' });
    setTimeout(() => {
      const isNowMonitoring = !stateRef.current.sensors.isMonitoring;
      dispatch({ type: 'ADD_LOG', payload: {
          level:   isNowMonitoring ? 'OK'   : 'WARN',
          message: isNowMonitoring ? 'Monitoring resumed by operator' : 'Monitoring paused by operator',
        }});
    }, 0);
  }, []);

  const applySettings = useCallback((newSettings) => {
    dispatch({ type: 'APPLY_SETTINGS', payload: newSettings });

    // Надсилаємо налаштування на сервер (POST /api/settings)
    fetch(`${API_BASE}/api/settings`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(newSettings),
    })
        .then(r => r.json())
        .then(json => {
          if (json.ok) {
            dispatch({ type: 'ADD_LOG', payload: {
                level:   'OK',
                message: `Settings saved to server: "${json.applied.systemName}" | MaxTemp: ${json.applied.maxTemp}°C`,
              }});
          }
        })
        .catch(() => {
          // Якщо сервер недоступний — зберігаємо тільки локально
          setTimeout(() => {
            const s = stateRef.current.settings;
            dispatch({ type: 'ADD_LOG', payload: {
                level:   'WARN',
                message: `Settings saved locally (server offline): "${s.systemName}" | MaxTemp: ${s.maxTemp}°C`,
              }});
          }, 0);
        });
  }, []);

  const clearLogs = useCallback(() => {
    dispatch({ type: 'CLEAR_LOGS' });
    setTimeout(
        () => dispatch({ type: 'ADD_LOG', payload: { level: 'INFO', message: 'Console cleared by operator' } }),
        0
    );
  }, []);

  // Плоский API для зворотної сумісності з компонентами
  return {
    state: {
      ...appState.sensors,
      ...appState.settings,
      serverOnline: appState.serverOnline,
    },
    logs:          appState.logs,
    chartHistory:  appState.chartHistory,
    addLog,
    toggleMonitoring,
    applySettings,
    clearLogs,
  };
}
