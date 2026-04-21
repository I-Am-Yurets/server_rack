/**
 * AlertsPage.jsx — Сторінка сповіщень
 * Props: addLog — колбек для запису подій до консолі дашборду
 */

import { useState } from 'react';

const ALERTS = [
  { id: 1, level: 'ERROR', title: 'Критичне навантаження CPU',     server: 'backup-srv-01',  time: '10:18:44', message: 'CPU досяг 89%, порогове значення 85%',           active: true },
  { id: 2, level: 'WARN',  title: 'Високе використання RAM',       server: 'backup-srv-01',  time: '10:15:22', message: "RAM 91% — ризик нестачі пам'яті",                active: true },
  { id: 3, level: 'WARN',  title: 'Затримка мережі підвищена',     server: 'api-gateway-01', time: '09:52:10', message: 'Latency 45ms, норма <30ms',                       active: true },
  { id: 4, level: 'ERROR', title: 'Сервер недоступний',            server: 'monitor-01',     time: '08:30:00', message: 'Немає відповіді від monitor-01 протягом 5 хвилин', active: true },
  { id: 5, level: 'INFO',  title: 'Резервне копіювання завершено', server: 'backup-srv-01',  time: '04:00:12', message: 'Повний бекап успішно завершено (42 GB)',            active: false },
  { id: 6, level: 'OK',    title: 'Оновлення пакетів застосовано', server: 'web-prod-01',    time: '03:15:00', message: 'apt upgrade завершено, 12 пакетів оновлено',        active: false },
  { id: 7, level: 'WARN',  title: 'Диск заповнений на 80%',       server: 'db-master-01',   time: 'вчора',    message: '/var/lib/mysql: 400GB / 500GB',                    active: false },
];

const LEVEL_CONFIG = {
  ERROR: { bg: 'bg-status-error/10',   border: 'border-status-error',   badge: 'bg-status-error',   text: 'text-status-error',   icon: 'fa-circle-xmark' },
  WARN:  { bg: 'bg-status-warning/10', border: 'border-status-warning', badge: 'bg-status-warning', text: 'text-status-warning', icon: 'fa-triangle-exclamation' },
  INFO:  { bg: 'bg-blue-500/10',       border: 'border-blue-500',       badge: 'bg-blue-500',       text: 'text-blue-400',       icon: 'fa-circle-info' },
  OK:    { bg: 'bg-brand-primary/5',   border: 'border-brand-primary',  badge: 'bg-brand-primary',  text: 'text-brand-primary',  icon: 'fa-circle-check' },
};

export default function AlertsPage({ addLog }) {
  const [dismissed, setDismissed] = useState(new Set());
  const [filter, setFilter]       = useState('ALL');

  const handleFilterChange = (f) => {
    setFilter(f);
    addLog('INFO', `Alerts filter changed: ${f}`);
  };

  const handleDismiss = (alert) => {
    setDismissed(prev => new Set([...prev, alert.id]));
    addLog(
      alert.level === 'ERROR' ? 'WARN' : 'OK',
      `Alert dismissed: [${alert.level}] "${alert.title}" on ${alert.server}`
    );
  };

  const visible = ALERTS.filter(a =>
    !dismissed.has(a.id) &&
    (filter === 'ALL' || filter === a.level || (filter === 'ACTIVE' && a.active))
  );

  const activeCount = ALERTS.filter(a => a.active && !dismissed.has(a.id)).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-3">
            Сповіщення
            {activeCount > 0 && (
              <span className="bg-status-error text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
                {activeCount} активних
              </span>
            )}
          </h2>
          <p className="text-sm text-ch-400 mt-1">Моніторинг подій системи в реальному часі</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {['ALL', 'ACTIVE', 'ERROR', 'WARN', 'INFO', 'OK'].map(f => (
            <button
              key={f}
              onClick={() => handleFilterChange(f)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-all font-semibold ${
                filter === f
                  ? 'bg-brand-primary text-ch-800 border-brand-primary'
                  : 'border-ch-600 text-ch-400 hover:border-brand-primary hover:text-brand-primary'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {visible.length === 0 ? (
          <div className="text-center py-16 text-ch-400">
            <i className="fa-solid fa-bell-slash text-4xl mb-4 block opacity-30"></i>
            Немає сповіщень для відображення
          </div>
        ) : (
          visible.map(alert => {
            const cfg = LEVEL_CONFIG[alert.level];
            return (
              <div
                key={alert.id}
                className={`${cfg.bg} border ${cfg.border} rounded-xl px-6 py-4 flex items-start gap-4 transition-all hover:shadow-md`}
              >
                <i className={`fa-solid ${cfg.icon} ${cfg.text} text-lg mt-0.5 flex-shrink-0`}></i>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded text-white ${cfg.badge}`}>{alert.level}</span>
                    <span className="font-semibold text-sm text-gray-900 dark:text-white">{alert.title}</span>
                    {alert.active && (
                      <span className="text-xs text-ch-400 font-mono bg-ch-700 px-2 py-0.5 rounded">ACTIVE</span>
                    )}
                  </div>
                  <p className="text-sm text-ch-400 mb-1">{alert.message}</p>
                  <div className="flex gap-4 text-xs text-ch-500 font-mono">
                    <span><i className="fa-solid fa-server mr-1"></i>{alert.server}</span>
                    <span><i className="fa-regular fa-clock mr-1"></i>{alert.time}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDismiss(alert)}
                  className="text-ch-500 hover:text-white transition-colors flex-shrink-0 text-lg px-1"
                  title="Закрити"
                >✕</button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
