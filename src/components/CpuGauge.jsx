/**
 * CpuGauge.jsx — Лабораторна робота №4
 * SVG Gauge-індикатор температури CPU — унікальний компонент варіанту 2.
 * Умовний рендеринг кольорів залежно від температури.
 */

export default function CpuGauge({ temp, maxTemp }) {
  const CIRCUMFERENCE = 527.8;

  // Розрахунок відступу дуги
  const offset = CIRCUMFERENCE * (1 - Math.min(temp / 100, 1));

  // Умовний рендеринг кольору за порогом (JSX з тернарним оператором)
  let color = '#39ff14';
  if (temp >= maxTemp * 0.9) color = '#ef4444';
  else if (temp >= maxTemp * 0.7) color = '#facc15';

  const isHot = temp >= maxTemp * 0.9;

  return (
    <div className="bg-white dark:bg-ch-700 border border-gray-200 dark:border-ch-600 rounded-xl p-6 flex flex-col items-center gap-4 hover:border-brand-primary transition-all duration-300">
      <div className="flex items-center justify-between w-full">
        <span className="text-xs text-gray-500 dark:text-ch-400 uppercase tracking-wider font-semibold">
          <i className="fa-solid fa-temperature-half mr-1"></i>Температура CPU
        </span>
        {/* Умовний рендеринг попередження */}
        {isHot && (
          <span className="text-xs text-status-error font-semibold animate-pulse-slow">
            <i className="fa-solid fa-triangle-exclamation mr-1"></i>CRITICAL
          </span>
        )}
      </div>

      {/* SVG Gauge */}
      <div className="relative">
        <svg width="200" height="200" viewBox="0 0 200 200" className="-rotate-90">
          {/* Фонове коло */}
          <circle
            cx="100" cy="100" r="84"
            fill="none"
            stroke="#3a3a3a"
            strokeWidth="12"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset="0"
            strokeLinecap="round"
          />
          {/* Активна дуга */}
          <circle
            cx="100" cy="100" r="84"
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.8s ease, stroke 0.5s ease',
              filter: `drop-shadow(0 0 8px ${color}55)`,
            }}
          />
        </svg>

        {/* Числове значення в центрі */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-4xl font-bold font-mono transition-all duration-500"
            style={{ color }}
          >
            {temp}
          </span>
          <span className="text-xs text-gray-500 dark:text-ch-400 mt-1">°C</span>
        </div>
      </div>

      {/* Мітка порогу */}
      <div className="text-xs text-gray-400 dark:text-ch-400 font-mono">
        Поріг: <span className="text-status-warning">{maxTemp}°C</span>
      </div>
    </div>
  );
}
