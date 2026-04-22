/**
 * Header.jsx — Лабораторна робота №4
 * Компонент верхньої панелі дашборду.
 * Отримує дані через props (односпрямований потік даних).
 */

import { useState, useEffect } from 'react';

export default function Header({ systemName, isMonitoring, serverOnline, onToggleMonitoring, onOpenSettings, onToggleSidebar }) {
  const [clock, setClock] = useState('');

  // Годинник — побічний ефект, тому в useEffect
  useEffect(() => {
    const update = () => setClock(new Date().toLocaleTimeString('uk-UA'));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer); // cleanup
  }, []);

  return (
    <header className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200 dark:border-ch-600">
      <div className="flex items-center gap-4">
        <button
          className="lg:hidden p-2 rounded-lg bg-white dark:bg-ch-700 border border-gray-200 dark:border-ch-600"
          onClick={onToggleSidebar}
        >☰</button>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Моніторинг стійки</h1>
          {/* system-name: оновлюється через props після зміни у формі налаштувань */}
          <p className="text-sm text-gray-500 dark:text-ch-400 mt-1 transition-all duration-300">{systemName}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Індикатор з'єднання з сервером — Лаб. №5 */}
        <div className={`hidden sm:flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full border transition-all duration-500 ${
          serverOnline === true
            ? 'bg-neon/10 border-neon/40 text-green-700 dark:text-neon'
            : serverOnline === false
              ? 'bg-red-500/10 border-red-500/40 text-red-600 dark:text-red-400'
              : 'bg-gray-100 dark:bg-ch-700 border-gray-300 dark:border-ch-600 text-gray-400 dark:text-ch-400'
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            serverOnline === true
              ? 'bg-brand-primary animate-pulse-slow'
              : serverOnline === false
                ? 'bg-red-500'
                : 'bg-gray-400 animate-pulse'
          }`} />
          {serverOnline === true
            ? 'Сервер Online'
            : serverOnline === false
              ? '⚡ Connection Lost'
              : 'Connecting...'}
        </div>

        {/* Кнопка toggle моніторингу — змінює стан isMonitoring через колбек */}
        <button
          onClick={onToggleMonitoring}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            isMonitoring
              ? 'bg-brand-primary text-ch-800 hover:opacity-90'
              : 'bg-gray-200 dark:bg-ch-600 text-gray-600 dark:text-ch-400 hover:border-brand-primary'
          }`}
        >
          {isMonitoring ? '⏸ Пауза' : '▶ Відновити'}
        </button>

        <button
          onClick={onOpenSettings}
          className="px-4 py-2 bg-white dark:bg-ch-700 border border-gray-200 dark:border-ch-600 rounded-lg text-xs font-semibold hover:border-brand-primary hover:text-brand-primary transition-all"
        >
          <i className="fa-solid fa-sliders mr-1"></i>Налаштування
        </button>

        <time className="text-xs text-gray-400 dark:text-ch-400 font-mono hidden md:block">{clock}</time>
      </div>
    </header>
  );
}
