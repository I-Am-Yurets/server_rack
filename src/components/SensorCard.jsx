/**
 * SensorCard.jsx — Лабораторна робота №4
 * Універсальний компонент картки для відображення метрики.
 * Дані передаються виключно через props — жодних жорстко вписаних значень.
 *
 * Props:
 *  label    — назва метрики
 *  value    — поточне значення
 *  unit     — одиниця виміру
 *  icon     — клас FontAwesome
 *  color    — tailwind-клас кольору значення (text-*)
 *  subtext  — додатковий рядок під значенням
 *  href     — опціональне посилання при кліку
 *  warning  — якщо true — обводимо картку червоним
 */

export default function SensorCard({ label, value, unit, icon, color = 'text-brand-primary', subtext, onClick, warning = false }) {
  const base = `bg-white dark:bg-ch-700 border rounded-xl p-5 flex flex-col gap-3
    hover:-translate-y-1 transition-all duration-300 group cursor-pointer
    ${warning ? 'border-status-error shadow-[0_0_12px_rgba(255,57,57,0.25)]' : 'border-gray-200 dark:border-ch-600 hover:border-brand-primary'}`;

  return (
    <div className={base} onClick={onClick}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 dark:text-ch-400 uppercase tracking-wider font-semibold">{label}</span>
        <i className={`fa-solid ${icon} opacity-40 group-hover:opacity-100 transition-opacity ${color}`}></i>
      </div>

      {/* Умовний рендеринг: значення — велике, виділене */}
      <div className={`text-3xl font-bold font-mono ${color} transition-all duration-500`}>
        {value}
        {unit && <span className="text-base font-normal ml-1">{unit}</span>}
      </div>

      {subtext && (
        <div className="text-xs text-gray-500 dark:text-ch-400">{subtext}</div>
      )}
    </div>
  );
}
