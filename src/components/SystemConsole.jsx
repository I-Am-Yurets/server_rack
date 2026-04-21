/**
 * SystemConsole.jsx — Лабораторна робота №4
 * Унікальний компонент — консоль системних логів.
 * Використовує фільтрацію за рівнем та умовний рендеринг.
 * Props: logs, onClear
 */

import { useState, useEffect, useRef } from 'react';

const LEVEL_STYLES = {
  OK:    'text-brand-primary',
  INFO:  'text-blue-400',
  WARN:  'text-yellow-400',
  ERROR: 'text-red-400',
};

export default function SystemConsole({ logs, onClear }) {
  const [filter, setFilter] = useState('ALL');
  const logRef = useRef(null);

  // Авто-прокрутка при появі нових логів
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  const filtered = filter === 'ALL' ? logs : logs.filter(l => l.level === filter);

  const handleExport = () => {
    const text = logs.map(e => `[${e.time}] [${e.level}] ${e.message}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    // DOM-виняток: програмне завантаження файлу через <a> — єдиний
    // стандартний спосіб ініціювати download у браузері без серверного запиту.
    // React не надає API для цього, тому пряме звернення до DOM виправдане.
    const a = document.createElement('a');
    a.href = url;
    a.download = `server-log-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url); // звільняємо пам'ять після завантаження
  };

  return (
    <section className="bg-gray-900 dark:bg-black border border-green-500/40 dark:border-brand-primary/50 rounded-xl p-6 shadow-[0_0_30px_rgba(57,255,20,0.08)]">
      <header className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-700 dark:border-ch-600 mb-4">
        <div className="flex items-center gap-3">
          <span className="text-xs text-brand-primary uppercase tracking-wider font-semibold font-mono">
            <i className="fa-solid fa-terminal mr-1"></i>System Console
          </span>
          <span className="text-xs text-brand-primary animate-pulse-slow font-mono">● Live Feed</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Кнопки фільтрів — data-level зчитується через замикання */}
          {['ALL', 'INFO', 'OK', 'WARN', 'ERROR'].map(level => (
            <button
              key={level}
              onClick={() => setFilter(level)}
              className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
                filter === level
                  ? 'bg-brand-primary text-ch-800'
                  : `bg-gray-800 border border-gray-600 hover:border-brand-primary ${
                      level === 'INFO' ? 'text-blue-400' :
                      level === 'OK' ? 'text-brand-primary' :
                      level === 'WARN' ? 'text-yellow-400' :
                      level === 'ERROR' ? 'text-red-400' : 'text-gray-300'
                    }`
              }`}
            >
              {level}
            </button>
          ))}

          <button
            onClick={onClear}
            className="px-3 py-1.5 bg-gray-800 border border-gray-600 rounded text-xs text-gray-300 hover:border-brand-primary hover:text-brand-primary transition-all"
          >
            Clear
          </button>
          <button
            onClick={handleExport}
            className="px-3 py-1.5 bg-gray-800 border border-gray-600 rounded text-xs text-gray-300 hover:border-brand-primary hover:text-brand-primary transition-all"
          >
            <i className="fa-solid fa-download mr-1"></i>Export
          </button>
        </div>
      </header>

      {/* Лог-рядки */}
      <div
        ref={logRef}
        className="h-64 overflow-y-auto font-mono text-xs flex flex-col gap-0.5"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#4a4a4a transparent' }}
      >
        {filtered.length === 0 ? (
          <div className="text-gray-600 py-4 text-center">— Логів немає —</div>
        ) : (
          filtered.map((log, i) => (
            <div key={i} className="flex gap-4 py-0.5">
              <span className="text-gray-500 min-w-[60px] font-mono">{log.time}</span>
              <span className={`${LEVEL_STYLES[log.level]} min-w-[60px] font-mono font-semibold`}>[{log.level}]</span>
              <span className="text-gray-400">
                {log.message}
                {/* Курсор блимає лише на останньому рядку */}
                {i === filtered.length - 1 && (
                  <span className="inline-block w-1.5 h-3 bg-brand-primary animate-blink align-middle ml-1"></span>
                )}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
