/**
 * script.js — Лабораторна робота №3
 * Тема: Програмування інтерфейсу за допомогою JavaScript
 * Варіант 2: Моніторинг серверної стійки
 *
 * Структура файлу:
 *  1. systemState       — об'єкт стану системи (модель даних)
 *  2. Sensor functions  — імітація датчиків (setInterval)
 *  3. DOM update funcs  — оновлення UI
 *  4. Event handlers    — обробники кнопок і форми
 *  5. Console module    — консоль логів (унікальний компонент)
 *  6. Settings modal    — форма налаштувань
 *  7. Chart.js module   — живий лінійний графік CPU/RAM/Network
 *  8. Cross-tab sync    — синхронізація стану між вкладками
 *  9. Init              — ініціалізація після DOMContentLoaded
 */

'use strict';

/* ═══════════════════════════════════════════════
   1. МОДЕЛЬ СТАНУ СИСТЕМИ
   Всі поточні дані системи зберігаються в одному
   об'єкті — розділення «моделі» від «відображення»
   ═══════════════════════════════════════════════ */
const systemState = {
    // Назва системи (змінюється через форму налаштувань)
    systemName:      'Rack-01 • Дата-центр UA-1',
    // Поточна температура CPU (°C)
    cpuTemp:         62,
    // Поточне завантаження CPU (%)
    cpuLoad:         45,
    // Кількість активних SSH-сесій
    sshCount:        3,
    // RAM: використано / всього (GB)
    ramUsed:         11.5,
    ramTotal:        16,
    // Мережа (GB/s)
    networkDown:     2.4,
    networkUp:       1.8,
    networkLatency:  12,
    // Uptime (%)
    uptime:          99.8,
    // Чи активний моніторинг
    isMonitoring:    true,
    // Максимальна допустима температура (°C) — змінюється з форми
    maxTemp:         85,
    // Інтервал оновлення датчиків (мс) — змінюється з форми
    sensorInterval:  3000,
    // Посилання на активний setInterval (для перезапуску)
    sensorTimer:     null,
    // Журнал подій
    eventLog:        [],
};

/* ═══════════════════════════════════════════════
   2. ДОПОМІЖНІ ФУНКЦІЇ ГЕНЕРАЦІЇ ДАНИХ
   ═══════════════════════════════════════════════ */

/**
 * Генерує випадкове число у діапазоні [min, max]
 * з кроком step (за замовчуванням 1)
 * @param {number} min
 * @param {number} max
 * @param {number} step
 * @returns {number}
 */
function randomInRange(min, max, step = 1) {
    const steps = Math.floor((max - min) / step);
    return +(min + Math.floor(Math.random() * (steps + 1)) * step).toFixed(1);
}

/**
 * Розраховує stroke-dashoffset для SVG-кола gauge
 * circumference = 2 * π * r = 527.8 при r=84
 * @param {number} value — поточне значення
 * @param {number} max   — максимальне значення
 * @returns {number}
 */
function calcGaugeOffset(value, max) {
    const CIRCUMFERENCE = 527.8;
    const percent = Math.min(value / max, 1);
    return CIRCUMFERENCE * (1 - percent);
}

/* ═══════════════════════════════════════════════
   3. ФУНКЦІЇ ОНОВЛЕННЯ UI (DOM)
   ═══════════════════════════════════════════════ */

/**
 * Оновлює заголовок дашборду (назва системи)
 * Застосовується після збереження форми налаштувань
 */
function updateSystemName() {
    const el = document.querySelector('#system-name');
    if (el) el.textContent = systemState.systemName;
}

/**
 * Оновлює SVG Gauge-індикатор температури CPU
 * та числове значення поруч
 */
function updateCpuGauge() {
    const arc  = document.querySelector('#gauge-arc');
    const num  = document.querySelector('#gauge-value');
    const warn = document.querySelector('#gauge-warning');

    if (!arc || !num) return;

    // Розраховуємо відступ дуги
    const offset = calcGaugeOffset(systemState.cpuTemp, 100);
    arc.style.strokeDashoffset = offset;

    // Оновлюємо колір залежно від порогу
    let color = '#39ff14'; // green
    if (systemState.cpuTemp >= systemState.maxTemp * 0.9) color = '#ef4444';      // red
    else if (systemState.cpuTemp >= systemState.maxTemp * 0.7) color = '#facc15'; // yellow

    arc.style.stroke = color;
    num.textContent  = systemState.cpuTemp;
    
    // Синхронізуємо колір числа
    num.className = 'text-4xl font-bold font-mono';
    num.style.color = color;

    // Показуємо / приховуємо попередження
    const isHot = systemState.cpuTemp >= systemState.maxTemp * 0.9;
    if (warn) warn.classList.toggle('hidden', !isHot);

    // Оновлюємо мітку порогу
    const maxLabel = document.querySelector('#gauge-max-label');
    if (maxLabel) maxLabel.textContent = systemState.maxTemp;
}

/**
 * Оновлює картку CPU Avg (KPI)
 */
function updateCpuLoad() {
    const el = document.querySelector('#cpu-avg-value');
    if (el) el.textContent = systemState.cpuLoad + '%';
}

/**
 * Оновлює картку кількості SSH-з'єднань (KPI)
 */
function updateSshCount() {
    const el    = document.querySelector('#ssh-count-value');
    const badge = document.querySelector('#ssh-badge');
    if (el)    el.textContent    = systemState.sshCount;
    if (badge) badge.textContent = `● ${systemState.sshCount} активних`;
}

/**
 * Оновлює мережеві KPI: Download, Upload, Latency
 */
function updateNetwork() {
    // KPI mini-card (header row)
    const dlSmall = document.querySelector('#net-download');
    if (dlSmall) dlSmall.textContent = systemState.networkDown.toFixed(1) + ' GB/s';

    // Мережевий віджет (великі значення)
    const dlLg  = document.querySelector('#net-download-lg');
    const ulLg  = document.querySelector('#net-upload');
    const latLg = document.querySelector('#net-latency');

    // Зберігаємо вкладений <span> з одиницями виміру якщо він є
    function setValueKeepUnit(el, value, unit) {
        if (!el) return;
        el.innerHTML = `${value} <span class="text-sm">${unit}</span>`;
    }

    setValueKeepUnit(dlLg,  systemState.networkDown.toFixed(1), 'GB/s');
    setValueKeepUnit(ulLg,  systemState.networkUp.toFixed(1),   'GB/s');
    setValueKeepUnit(latLg, systemState.networkLatency,          'ms');
}

/**
 * Оновлює прогрес-бари RAM / Disk / Swap
 */
function updateMetrics() {
    const ramVal  = document.querySelector('#ram-value');
    const ramBar  = document.querySelector('#ram-bar');
    const ramPct  = Math.round((systemState.ramUsed / systemState.ramTotal) * 100);

    if (ramVal) ramVal.textContent = `${systemState.ramUsed.toFixed(1)} / ${systemState.ramTotal} GB`;
    if (ramBar) ramBar.value = ramPct;
}

/**
 * Оновлює Uptime KPI
 */
function updateUptime() {
    const el = document.querySelector('#uptime-value');
    if (el) el.textContent = systemState.uptime.toFixed(1) + '%';
}

/**
 * Головна функція оновлення всього UI
 * Викликається з setInterval кожні sensorInterval мс
 */
function updateAllSensors() {
    if (!systemState.isMonitoring) return;

    // Генеруємо нові значення в реалістичних діапазонах
    const prevTemp = systemState.cpuTemp;
    systemState.cpuTemp       = randomInRange(48, 78);
    systemState.cpuLoad       = randomInRange(20, 90);
    systemState.sshCount      = randomInRange(1, 6);
    systemState.networkDown   = randomInRange(1.2, 3.8, 0.1);
    systemState.networkUp     = randomInRange(0.8, 2.4, 0.1);
    systemState.networkLatency = randomInRange(8, 35);
    systemState.ramUsed       = randomInRange(8.0, 15.2, 0.1);

    // Оновлюємо DOM
    updateCpuGauge();
    updateCpuLoad();
    updateSshCount();
    updateNetwork();
    updateMetrics();
    updateUptime();

    // Якщо температура перетнула поріг — логуємо подію
    if (systemState.cpuTemp >= systemState.maxTemp * 0.9 && prevTemp < systemState.maxTemp * 0.9) {
        addConsoleLog('WARN', `CPU temperature critical: ${systemState.cpuTemp}°C (threshold: ${systemState.maxTemp}°C)`);
    }

    // Оновлюємо Chart.js live-графік новою точкою
    pushChartPoint();

    // Транслюємо стан іншим відкритим вкладкам через localStorage
    broadcastState();
}

/* ═══════════════════════════════════════════════
   4. ОБРОБНИКИ ПОДІЙ — КНОПКИ КЕРУВАННЯ
   ═══════════════════════════════════════════════ */

/**
 * Перемикає стан моніторингу (пауза / активний)
 * Змінює колір та текст кнопки — зворотний зв'язок для користувача
 */
function toggleMonitoring() {
    systemState.isMonitoring = !systemState.isMonitoring;

    const btn = document.querySelector('#btn-monitoring');
    if (!btn) return;

    if (systemState.isMonitoring) {
        btn.textContent = '⏸ Пауза';
        btn.className   = btn.className.replace('bg-gray-200 dark:bg-ch-600 text-gray-600 dark:text-ch-400',
                                                'bg-[#39ff14] text-ch-800');
        addConsoleLog('OK', 'Monitoring resumed by operator');
    } else {
        btn.textContent = '▶ Відновити';
        btn.className   = btn.className.replace('bg-[#39ff14] text-ch-800',
                                                'bg-gray-200 dark:bg-ch-600 text-gray-600 dark:text-ch-400');
        addConsoleLog('WARN', 'Monitoring paused by operator');
    }

    // Оновлюємо badge «● Live / ■ Paused» на графіку
    const badge = document.getElementById('chart-live-badge');
    if (badge) {
        badge.textContent = systemState.isMonitoring ? '● Live' : '■ Paused';
        badge.className   = systemState.isMonitoring
            ? 'text-xs text-green-600 dark:text-neon animate-pulse-slow font-mono font-semibold'
            : 'text-xs text-gray-400 font-mono font-semibold';
    }

    // Надсилаємо команду іншим вкладкам (cross-tab sync)
    localStorage.setItem('srm-monitoring-cmd', JSON.stringify({
        isMonitoring: systemState.isMonitoring,
        ts: Date.now(),
    }));
}

/**
 * Перезапускає таймер датчиків з новим інтервалом
 * @param {number} intervalMs
 */
function restartSensorTimer(intervalMs) {
    if (systemState.sensorTimer) clearInterval(systemState.sensorTimer);
    systemState.sensorInterval = intervalMs;
    systemState.sensorTimer    = setInterval(updateAllSensors, intervalMs);
}

/* ═══════════════════════════════════════════════
   5. КОНСОЛЬ ЛОГІВ — УНІКАЛЬНИЙ КОМПОНЕНТ
   Розширення існуючої консолі: фільтрація,
   Export, пошук, підсвічування рівнів
   ═══════════════════════════════════════════════ */

const LOG_LEVELS = {
    INFO:  'text-blue-400',
    OK:    'text-neon',
    WARN:  'text-yellow-400',
    ERROR: 'text-red-400',
};

// Активний фільтр рівня ('ALL' або назва рівня)
let activeLogFilter = 'ALL';

// Максимальна кількість логів (щоб не роздувати localStorage)
const MAX_LOGS = 10000;

/**
 * Додає новий рядок до консолі логів
 * @param {'INFO'|'OK'|'WARN'|'ERROR'} level
 * @param {string} message
 * @param {boolean} [save=true] - чи зберігати в localStorage
 * @param {string} [timeStr] - примусовий час (для відновлення)
 */
function addConsoleLog(level, message, save = true, timeStr = null) {
    const now   = timeStr || new Date().toTimeString().split(' ')[0];
    const entry = { time: now, level, message };

    if (save) {
        systemState.eventLog.push(entry);
        if (systemState.eventLog.length > MAX_LOGS) {
            systemState.eventLog.shift();
        }
        try {
            localStorage.setItem('srm-event-log', JSON.stringify(systemState.eventLog));
        } catch (_) {}
    }

    const logEl = document.querySelector('#console-log');
    if (!logEl) return;

    // Видаляємо старий курсор
    logEl.querySelectorAll('.console-cursor').forEach(c => c.remove());

    // Перевіряємо, чи треба відображати цей запис (фільтр)
    const show = activeLogFilter === 'ALL' || activeLogFilter === level;

    const line = document.createElement('div');
    line.className    = `flex gap-4 py-0.5 log-line log-${level}` + (show ? '' : ' hidden');
    line.dataset.level = level;
    line.innerHTML    = `<span class="text-gray-500 min-w-[60px] font-mono">${now}</span>`
                      + `<span class="${LOG_LEVELS[level]} min-w-[60px] font-mono font-semibold">[${level}]</span>`
                      + `<span class="text-gray-400">${message}`
                      + `<span class="console-cursor inline-block w-1.5 h-3 bg-[#39ff14] animate-blink align-middle ml-1"></span>`
                      + `</span>`;

    logEl.appendChild(line);

    // Авто-прокрутка до останнього рядка
    logEl.scrollTop = logEl.scrollHeight;

    // Обмеження відображення
    const allLines = logEl.querySelectorAll('.log-line');
    if (allLines.length > MAX_LOGS) allLines[0].remove();
}

/**
 * Встановлює фільтр консолі за рівнем
 * @param {string} level — 'ALL' | 'INFO' | 'OK' | 'WARN' | 'ERROR'
 */
function setConsoleFilter(level) {
    activeLogFilter = level;

    // Оновлюємо стилі кнопок фільтра
    document.querySelectorAll('.console-filter-btn').forEach(btn => {
        const isActive = btn.dataset.level === level;
        btn.className = isActive
            ? 'console-filter-btn px-2 py-1 rounded text-xs font-semibold bg-[#39ff14] text-ch-800 transition-all'
            : 'console-filter-btn px-2 py-1 rounded text-xs font-semibold bg-gray-800 dark:bg-ch-700 border border-gray-600 dark:border-ch-600 text-gray-300 dark:text-white hover:border-neon hover:text-neon transition-all';
    });

    // Показуємо / приховуємо рядки за рівнем
    document.querySelectorAll('#console-log .log-line').forEach(line => {
        const show = level === 'ALL' || line.dataset.level === level;
        line.classList.toggle('hidden', !show);
    });
}

/**
 * Очищає консоль логів
 */
function clearConsole() {
    const logEl = document.querySelector('#console-log');
    if (logEl) logEl.innerHTML = '';
    systemState.eventLog = [];
    addConsoleLog('INFO', 'Console cleared by operator');
}

/**
 * Експортує журнал подій у текстовий файл і завантажує
 */
function exportConsole() {
    if (!systemState.eventLog.length) {
        addConsoleLog('WARN', 'Nothing to export — log is empty');
        return;
    }
    const text = systemState.eventLog
        .map(e => `[${e.time}] [${e.level}] ${e.message}`)
        .join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `server-log-${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addConsoleLog('OK', `Log exported: ${systemState.eventLog.length} entries`);
}

/* ═══════════════════════════════════════════════
   6. МОДАЛЬНЕ ВІКНО НАЛАШТУВАНЬ
   Форма зі збереженням через localStorage,
   валідацією діапазонів, миттєвим застосуванням
   ═══════════════════════════════════════════════ */

/**
 * Відкриває модальне вікно налаштувань
 * і заповнює поля поточними значеннями з systemState
 */
function openSettingsModal() {
    const modal = document.querySelector('#settings-modal');
    if (!modal) return;

    // Заповнюємо поточними значеннями
    document.querySelector('#setting-system-name').value  = systemState.systemName;
    document.querySelector('#setting-max-temp').value     = systemState.maxTemp;
    document.querySelector('#setting-interval').value     = systemState.sensorInterval / 1000;

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    // Скидаємо зелену рамку успіху якщо була
    const form = document.querySelector('#settings-form');
    if (form) form.classList.remove('ring-2', 'ring-neon', 'ring-green-400');
}

/**
 * Закриває модальне вікно налаштувань
 */
function closeSettingsModal() {
    const modal = document.querySelector('#settings-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

/**
 * Обробник submit форми налаштувань
 * Валідує дані, застосовує до systemState, зберігає в localStorage
 * @param {Event} event
 */
function handleSettingsSubmit(event) {
    // Зупиняємо перезавантаження сторінки
    event.preventDefault();

    const data = new FormData(event.target);

    // ── Зчитуємо значення
    const newName     = data.get('systemName').trim();
    const newMaxTemp  = parseInt(data.get('maxTemp'), 10);
    const newInterval = parseFloat(data.get('interval'));

    // ── Валідація діапазонів (Boundary Testing)
    if (!newName) {
        showSettingsError('Назва системи не може бути порожньою');
        return;
    }
    if (isNaN(newMaxTemp) || newMaxTemp < 50 || newMaxTemp > 100) {
        showSettingsError('Макс. температура: від 50°C до 100°C');
        return;
    }
    if (isNaN(newInterval) || newInterval < 1 || newInterval > 60) {
        showSettingsError('Інтервал оновлення: від 1 до 60 секунд');
        return;
    }

    // ── Застосовуємо до системного стану
    systemState.systemName = newName;
    systemState.maxTemp    = newMaxTemp;

    // Оновлюємо UI миттєво
    updateSystemName();
    updateCpuGauge();   // Gauge перерахується з новим порогом

    // Перезапускаємо таймер з новим інтервалом (у мс)
    restartSensorTimer(Math.round(newInterval * 1000));

    // ── Зберігаємо у localStorage (додаткове завдання)
    localStorage.setItem('srm-settings', JSON.stringify({
        systemName: systemState.systemName,
        maxTemp:    systemState.maxTemp,
        interval:   newInterval,
    }));

    // ── Візуальний зворотний зв'язок: зелена рамка + повідомлення
    const form = document.querySelector('#settings-form');
    if (form) {
        form.classList.add('ring-2', 'ring-[#39ff14]');
        setTimeout(() => form.classList.remove('ring-2', 'ring-[#39ff14]'), 2000);
    }
    showSettingsSuccess(`Налаштування збережено: ${newName} | ${newMaxTemp}°C | ${newInterval}с`);

    // Логуємо застосування налаштувань
    addConsoleLog('OK', `Settings applied — name: "${newName}", maxTemp: ${newMaxTemp}°C, interval: ${newInterval}s`);

    setTimeout(closeSettingsModal, 1200);
}

/**
 * Показує повідомлення про помилку у формі
 * @param {string} msg
 */
function showSettingsError(msg) {
    const el = document.querySelector('#settings-feedback');
    if (!el) return;
    el.textContent  = '⚠ ' + msg;
    el.className    = 'text-xs text-red-400 mt-2 min-h-[1rem]';
}

/**
 * Показує повідомлення про успіх у формі
 * @param {string} msg
 */
function showSettingsSuccess(msg) {
    const el = document.querySelector('#settings-feedback');
    if (!el) return;
    el.textContent  = '✓ ' + msg;
    el.className    = 'text-xs text-neon mt-2 min-h-[1rem]';
}

/**
 * Завантажує збережені налаштування з localStorage
 * (виконується при старті — Додаткове завдання 1)
 */
function loadSavedSettings() {
    try {
        const saved = localStorage.getItem('srm-settings');
        if (!saved) return;
        const s = JSON.parse(saved);
        if (s.systemName) systemState.systemName = s.systemName;
        if (s.maxTemp && s.maxTemp >= 50 && s.maxTemp <= 100) systemState.maxTemp = s.maxTemp;
        if (s.interval && s.interval >= 1 && s.interval <= 60) {
            systemState.sensorInterval = Math.round(s.interval * 1000);
        }
        updateSystemName();
    } catch (e) {
        console.warn('Could not load saved settings:', e);
    }
}

/* ═══════════════════════════════════════════════
   7. CHART.JS — ЖИВИЙ ЛІНІЙНИЙ ГРАФІК
   30-точковий rolling window: CPU%, RAM%, Network GB/s
   Підтримує toggle кнопки для вмикання/вимикання датасетів
   ═══════════════════════════════════════════════ */

const CHART_MAX_POINTS = 30;

/** Посилання на Chart.js екземпляр (null якщо canvas відсутній) */
let liveChart = null;

/**
 * Ініціалізує Chart.js на canvas #live-chart
 * Викликається один раз з DOMContentLoaded
 */
function initLiveChart() {
    const canvas = document.getElementById('live-chart');
    if (!canvas || typeof Chart === 'undefined') return;

    const isDark = document.documentElement.classList.contains('dark');
    const gridColor  = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
    const tickColor  = isDark ? '#6a6a6a' : '#9ca3af';

    liveChart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: Array(CHART_MAX_POINTS).fill(''),
            datasets: [
                {
                    label: 'CPU %',
                    data: Array(CHART_MAX_POINTS).fill(null),
                    borderColor: '#39ff14',
                    backgroundColor: 'rgba(57,255,20,0.08)',
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    pointHoverBackgroundColor: '#39ff14',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'yPct',
                },
                {
                    label: 'RAM %',
                    data: Array(CHART_MAX_POINTS).fill(null),
                    borderColor: '#60a5fa',
                    backgroundColor: 'rgba(96,165,250,0.07)',
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    pointHoverBackgroundColor: '#60a5fa',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'yPct',
                },
                {
                    label: 'Network GB/s',
                    data: Array(CHART_MAX_POINTS).fill(null),
                    borderColor: '#fb923c',
                    backgroundColor: 'rgba(251,146,60,0.07)',
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    pointHoverBackgroundColor: '#fb923c',
                    tension: 0.4,
                    fill: false,
                    yAxisID: 'yNet',
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 400, easing: 'easeInOutQuart' },
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    align: 'end',
                    labels: {
                        color: tickColor,
                        boxWidth: 12,
                        boxHeight: 2,
                        font: { family: 'JetBrains Mono, monospace', size: 10 },
                        padding: 12,
                        usePointStyle: true,
                        pointStyle: 'line',
                    },
                },
                tooltip: {
                    backgroundColor: isDark ? '#1a1a1a' : '#fff',
                    borderColor:     isDark ? '#3a3a3a' : '#e5e7eb',
                    borderWidth: 1,
                    titleColor:  isDark ? '#39ff14' : '#166534',
                    bodyColor:   isDark ? '#d1d5db' : '#374151',
                    titleFont:   { family: 'JetBrains Mono, monospace', size: 11 },
                    bodyFont:    { family: 'JetBrains Mono, monospace', size: 11 },
                    padding: 10,
                    callbacks: {
                        label: (ctx) => {
                            const v = ctx.parsed.y;
                            if (v === null) return '';
                            if (ctx.datasetIndex === 2) return ` Network: ${v.toFixed(1)} GB/s`;
                            return ` ${ctx.dataset.label}: ${v}%`;
                        },
                    },
                },
            },
            scales: {
                x: {
                    grid:   { color: gridColor, drawBorder: false },
                    ticks:  { display: false },
                    border: { display: false },
                },
                yPct: {
                    type: 'linear',
                    position: 'left',
                    min: 0, max: 100,
                    grid:   { color: gridColor, drawBorder: false },
                    ticks:  { color: tickColor, font: { family: 'JetBrains Mono, monospace', size: 10 }, callback: v => v + '%', maxTicksLimit: 5 },
                    border: { display: false },
                },
                yNet: {
                    type: 'linear',
                    position: 'right',
                    min: 0, max: 5,
                    grid:   { drawOnChartArea: false },
                    ticks:  { color: '#fb923c', font: { family: 'JetBrains Mono, monospace', size: 10 }, callback: v => v + ' GB/s', maxTicksLimit: 5 },
                    border: { display: false },
                },
            },
        },
    });
}

/**
 * Додає нову точку даних до live-графіка (rolling window)
 * Викликається з updateAllSensors()
 */
function pushChartPoint() {
    if (!liveChart) return;

    const now = new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const ramPct = Math.round((systemState.ramUsed / systemState.ramTotal) * 100);

    const { labels, datasets } = liveChart.data;

    // Зсуваємо данні вліво (rolling)
    labels.push(now);           if (labels.length   > CHART_MAX_POINTS) labels.shift();
    datasets[0].data.push(systemState.cpuLoad);          if (datasets[0].data.length > CHART_MAX_POINTS) datasets[0].data.shift();
    datasets[1].data.push(ramPct);                       if (datasets[1].data.length > CHART_MAX_POINTS) datasets[1].data.shift();
    datasets[2].data.push(+systemState.networkDown.toFixed(1)); if (datasets[2].data.length > CHART_MAX_POINTS) datasets[2].data.shift();

    liveChart.update('none'); // 'none' — без анімації для плавності
}

/**
 * Перемикає видимість датасету на графіку
 * при кліку на кнопки CPU / RAM / Network
 * @param {number} dsIndex — індекс датасету
 * @param {HTMLElement} btn
 */
function toggleChartDataset(dsIndex, btn) {
    if (!liveChart) return;
    const ds      = liveChart.data.datasets[dsIndex];
    const hidden  = liveChart.isDatasetVisible(dsIndex);
    liveChart.setDatasetVisibility(dsIndex, !hidden);
    liveChart.update();

    // Стилі кнопки: увімкнено → залита, вимкнено → прозора
    const colors = ['#39ff14', '#60a5fa', '#fb923c'];
    const c = colors[dsIndex];
    if (hidden) {
        // датасет тепер прихований — знебарвлюємо кнопку
        btn.style.background = 'transparent';
        btn.style.opacity    = '0.4';
    } else {
        btn.style.background = c;
        btn.style.color      = '#1a1a1a';
        btn.style.opacity    = '1';
    }
}

/* ═══════════════════════════════════════════════
   8. CROSS-TAB SYNC
   Транслює стан моніторингу в localStorage;
   інші вкладки отримують оновлення через storage event
   ═══════════════════════════════════════════════ */

/**
 * Зберігає поточний стан в localStorage
 * (зчитується іншими вкладками через storage event)
 */
function broadcastState() {
    localStorage.setItem('srm-live-state', JSON.stringify({
        isMonitoring:   systemState.isMonitoring,
        cpuLoad:        systemState.cpuLoad,
        cpuTemp:        systemState.cpuTemp,
        networkDown:    systemState.networkDown,
        networkUp:      systemState.networkUp,
        networkLatency: systemState.networkLatency,
        ramUsed:        systemState.ramUsed,
        ramTotal:       systemState.ramTotal,
        uptime:         systemState.uptime,
        sshCount:       systemState.sshCount,
        ts:             Date.now(),
    }));
}

/* ═══════════════════════════════════════════════
   9. ІНІЦІАЛІЗАЦІЯ
   Виконується після повного завантаження DOM
   ═══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

    // Завантажуємо збережені налаштування
    loadSavedSettings();
    
    // Завантажуємо збережені логи з localStorage
    try {
        const rawLogs = localStorage.getItem('srm-event-log');
        if (rawLogs) {
            const logs = JSON.parse(rawLogs);
            if (Array.isArray(logs) && logs.length > 0) {
                systemState.eventLog = logs;
                const logEl = document.querySelector('#console-log');
                if (logEl) {
                    logEl.innerHTML = '';
                    logs.forEach(log => {
                        addConsoleLog(log.level, log.message, false, log.time);
                    });
                }
            }
        }
    } catch (_) {}

    // Відновлюємо поточні значення сенсорів (якщо сторінка була оновлена)
    try {
        const raw = localStorage.getItem('srm-live-state');
        if (raw) {
            const s = JSON.parse(raw);
            if (s.cpuLoad) systemState.cpuLoad = s.cpuLoad;
            if (s.cpuTemp) systemState.cpuTemp = s.cpuTemp;
            if (s.networkDown) systemState.networkDown = s.networkDown;
            if (s.networkUp) systemState.networkUp = s.networkUp;
            if (s.networkLatency) systemState.networkLatency = s.networkLatency;
            if (s.ramUsed) systemState.ramUsed = s.ramUsed;
            if (s.uptime) systemState.uptime = s.uptime;
            if (s.sshCount) systemState.sshCount = s.sshCount;
            // Відновлюємо UI кнопки, якщо моніторинг ставили на паузу
            if (s.hasOwnProperty('isMonitoring') && !s.isMonitoring) {
                systemState.isMonitoring = true; // Для коректного toggle
                toggleMonitoring();
            }
        }
    } catch(_) {}

    // Ініціалізуємо Chart.js
    initLiveChart();

    // Перший рендер всіх показників
    updateAllSensors();

    // Запускаємо циклічне оновлення датчиків
    systemState.sensorTimer = setInterval(updateAllSensors, systemState.sensorInterval);

    // ── Кнопки toggle датасетів графіка
    document.querySelectorAll('.chart-ds-btn').forEach(btn => {
        const dsIdx = parseInt(btn.dataset.ds, 10);
        btn.addEventListener('click', () => toggleChartDataset(dsIdx, btn));
    });

    // ── Cross-tab: слухаємо зміни теми/стану з інших вкладок
    window.addEventListener('storage', (e) => {
        // Тема вже обробляється в inline-скрипті HTML,
        // тут реагуємо на зміну стану моніторингу з іншої вкладки
        if (e.key === 'srm-monitoring-cmd') {
            const cmd = JSON.parse(e.newValue || '{}');
            // Якщо команда «пауза» прийшла з іншої вкладки і стан відрізняється
            if (typeof cmd.isMonitoring === 'boolean' && cmd.isMonitoring !== systemState.isMonitoring) {
                toggleMonitoring();
            }
        }
        if (e.key === 'srm-settings') {
            loadSavedSettings();      // Завантажить нові налаштування в systemState та оновить заголовок
            updateCpuGauge();         // Перерахує кольори/поріг
            restartSensorTimer(systemState.sensorInterval); // Перезапустить інтервал
            
            try {
                const s = JSON.parse(e.newValue);
                addConsoleLog('OK', `System configuration updated via Settings page. Name: "${s.systemName}", MaxTemp: ${s.maxTemp}°C`);
            } catch (_) {}
        }
    });

    // ── Кнопка моніторингу (пауза/старт)
    const btnMonitor = document.querySelector('#btn-monitoring');
    if (btnMonitor) btnMonitor.addEventListener('click', toggleMonitoring);

    // ── Кнопка відкриття налаштувань
    const btnSettings = document.querySelector('#btn-open-settings');
    if (btnSettings) btnSettings.addEventListener('click', openSettingsModal);

    // ── Закриття модального вікна
    const btnClose = document.querySelector('#btn-close-modal');
    if (btnClose) btnClose.addEventListener('click', closeSettingsModal);

    // Закриття кліком на оверлей модалки
    const modal = document.querySelector('#settings-modal');
    if (modal) modal.addEventListener('click', e => {
        if (e.target === modal) closeSettingsModal();
    });

    // ── Форма налаштувань
    const form = document.querySelector('#settings-form');
    if (form) form.addEventListener('submit', handleSettingsSubmit);

    // ── Кнопки фільтра консолі
    document.querySelectorAll('.console-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => setConsoleFilter(btn.dataset.level));
    });

    // ── Кнопка Export консолі (замінюємо inline onclick)
    const btnExport = document.querySelector('#btn-console-export');
    if (btnExport) btnExport.addEventListener('click', exportConsole);

    // ── Кнопка Clear консолі
    const btnClear = document.querySelector('#btn-console-clear');
    if (btnClear) btnClear.addEventListener('click', clearConsole);

    // Стартовий запис у консолі
    addConsoleLog('OK',   'System monitoring initialized');
    addConsoleLog('INFO', `Sensor interval: ${systemState.sensorInterval / 1000}s`);
    addConsoleLog('INFO', `Temp threshold: ${systemState.maxTemp}°C`);
    addConsoleLog('INFO', 'Chart.js live chart active — CPU / RAM / Network');
});
