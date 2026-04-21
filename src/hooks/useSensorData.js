/**
 * useSensorData.js — Лабораторна робота №4
 * Кастомний хук для імітації даних датчиків серверної стійки.
 *
 * ── Complex State ────────────────────────────────────────────────────────────
 * Увесь стан системи описується ОДНИМ об'єктом через useReducer.
 * Замість багатьох окремих useState використовується єдиний редюсер з
 * чіткими типами дій (actions), що відповідає вимозі "Complex State".
 *
 * localStorage-ключі:
 *   'srm-settings'   — { systemName, maxTemp, sensorInterval }
 *   'srm-sensors'    — поточні значення датчиків (відновлюються після reload)
 *   'srm-logs'       — масив рядків логів (до 200 записів)
 *
 * Синхронізація між вкладками: через window 'storage' event.
 */

import { useReducer, useEffect, useCallback, useRef } from 'react';

/* ── Утиліти ──────────────────────────────────────────────────────────── */

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

/* ── Дефолтні значення ────────────────────────────────────────────────── */

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

/* ── localStorage helpers ─────────────────────────────────────────────── */

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

/* ── Початковий стан (єдиний об'єкт) ─────────────────────────────────── */

function buildInitialState() {
  const settings = loadSettings();
  const sensors  = loadSensors();

  // Генеруємо початкову історію графіка
  const now = new Date();
  const chartHistory = Array.from({ length: 20 }, (_, i) => ({
    time: new Date(now - (19 - i) * 3000)
      .toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    cpu: randomInRange(20, 90),
    ram: randomInRange(50, 95),
    net: randomInRange(1.2, 3.8, 0.1),
  }));

  // Весь стан системи — один об'єкт
  return {
    // ── Дані датчиків (оновлюються таймером) ──
    sensors: { ...sensors },

    // ── Налаштування системи (зберігаються в localStorage) ──
    settings: { ...settings },

    // ── Логи консолі ──
    logs: loadLogs(),

    // ── Дані для графіка ──
    chartHistory,
  };
}

/* ════════════════════════════════════════════════════════════════════════
   REDUCER — єдина точка мутації стану
   ════════════════════════════════════════════════════════════════════════ */

function sensorReducer(state, action) {
  switch (action.type) {

    // Тік таймера — оновлення всіх датчиків
    case 'TICK': {
      if (!state.sensors.isMonitoring) return state;

      const newSensors = {
        ...state.sensors,
        cpuTemp:        randomInRange(48, 78),
        cpuLoad:        randomInRange(20, 90),
        sshCount:       randomInRange(1, 6),
        networkDown:    randomInRange(1.2, 3.8, 0.1),
        networkUp:      randomInRange(0.8, 2.4, 0.1),
        networkLatency: randomInRange(8, 35),
        ramUsed:        randomInRange(8.0, 15.2, 0.1),
        diskUsed:       randomInRange(200, 420, 1),
        swapUsed:       randomInRange(0.5, 4.0, 0.1),
      };

      const now = new Date().toLocaleTimeString('uk-UA',
        { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const ramPct = Math.round((state.sensors.ramUsed / state.sensors.ramTotal) * 100);
      const newPoint = { time: now, cpu: state.sensors.cpuLoad, ram: ramPct, net: +state.sensors.networkDown.toFixed(1) };
      const newHistory = [...state.chartHistory, newPoint];

      return {
        ...state,
        sensors:      newSensors,
        chartHistory: newHistory.length > 30 ? newHistory.slice(-30) : newHistory,
      };
    }

    // Синхронізація датчиків з іншої вкладки
    case 'SYNC_SENSORS': {
      return {
        ...state,
        sensors: { ...state.sensors, ...action.payload },
      };
    }

    // Синхронізація налаштувань з іншої вкладки
    case 'SYNC_SETTINGS': {
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };
    }

    // Пауза / відновлення моніторингу
    case 'TOGGLE_MONITORING': {
      return {
        ...state,
        sensors: { ...state.sensors, isMonitoring: !state.sensors.isMonitoring },
      };
    }

    // Збереження налаштувань
    case 'APPLY_SETTINGS': {
      const { systemName, maxTemp, interval } = action.payload;
      const newSettings = {
        systemName:     systemName ?? state.settings.systemName,
        maxTemp:        Number(maxTemp) || state.settings.maxTemp,
        sensorInterval: interval ? Number(interval) * 1000 : state.settings.sensorInterval,
      };
      return {
        ...state,
        settings: newSettings,
      };
    }

    // Додавання запису до консолі
    case 'ADD_LOG': {
      const { level, message } = action.payload;
      const time = new Date().toTimeString().split(' ')[0];
      const newLogs = [...state.logs, { time, level, message }];
      return {
        ...state,
        logs: newLogs.length > MAX_LOGS ? newLogs.slice(-MAX_LOGS) : newLogs,
      };
    }

    // Очищення консолі
    case 'CLEAR_LOGS': {
      return { ...state, logs: [] };
    }

    // Повне перезавантаження стану з localStorage (після storage event)
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

  // Єдиний useReducer замість багатьох useState — Complex State
  const [appState, dispatch] = useReducer(sensorReducer, null, buildInitialState);

  const timerRef  = useRef(null);
  const stateRef  = useRef(appState);
  stateRef.current = appState;

  /* ── Persist датчиків при кожній зміні ── */
  useEffect(() => {
    saveSensors(appState.sensors);
  }, [appState.sensors]);

  /* ── Persist налаштувань при кожній зміні ── */
  useEffect(() => {
    saveSettings(appState.settings);
  }, [appState.settings]);

  /* ── Persist логів при кожній зміні ── */
  useEffect(() => {
    saveLogs(appState.logs);
  }, [appState.logs]);

  /* ── Синхронізація між вкладками через storage event ── */
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEYS.sensors && e.newValue) {
        try {
          const sensors = JSON.parse(e.newValue);
          dispatch({ type: 'SYNC_SENSORS', payload: sensors });
        } catch (_) {}
      }
      if (e.key === STORAGE_KEYS.settings && e.newValue) {
        try {
          const settings = JSON.parse(e.newValue);
          dispatch({ type: 'SYNC_SETTINGS', payload: settings });
        } catch (_) {}
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

  /* ── Таймер датчиків ── */
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (appState.sensors.isMonitoring) {
      timerRef.current = setInterval(
        () => dispatch({ type: 'TICK' }),
        appState.settings.sensorInterval
      );
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [appState.sensors.isMonitoring, appState.settings.sensorInterval]);

  /* ── Публічні методи (useCallback для стабільних посилань) ── */

  const addLog = useCallback((level, message) => {
    dispatch({ type: 'ADD_LOG', payload: { level, message } });
  }, []);

  const toggleMonitoring = useCallback(() => {
    dispatch({ type: 'TOGGLE_MONITORING' });
    // Логуємо після dispatch через setTimeout щоб прочитати актуальний стан
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
    setTimeout(() => {
      const s = stateRef.current.settings;
      dispatch({ type: 'ADD_LOG', payload: {
        level:   'OK',
        message: `Settings saved: "${s.systemName}" | MaxTemp: ${s.maxTemp}°C | Interval: ${s.sensorInterval / 1000}s`,
      }});
    }, 0);
  }, []);

  const clearLogs = useCallback(() => {
    dispatch({ type: 'CLEAR_LOGS' });
    setTimeout(() => dispatch({ type: 'ADD_LOG', payload: { level: 'INFO', message: 'Console cleared by operator' } }), 0);
  }, []);

  // Повертаємо плоский API для зворотної сумісності з компонентами
  return {
    state: { ...appState.sensors, ...appState.settings },
    logs:          appState.logs,
    chartHistory:  appState.chartHistory,
    addLog,
    toggleMonitoring,
    applySettings,
    clearLogs,
  };
}
