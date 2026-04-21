/**
 * SettingsPage.jsx — Повна сторінка налаштувань
 * Форма для зміни параметрів системи (дублює функціональність модалки,
 * але у повноекранному форматі з більшим числом опцій).
 */

import { useState } from 'react';

export default function SettingsPage({ state, onSave, addLog }) {
  const [form, setForm] = useState({
    systemName: state.systemName,
    maxTemp:    state.maxTemp,
    interval:   state.sensorInterval / 1000,
    timezone:   'Europe/Kyiv',
    retention:  '30',
    sshPort:    '22',
    notifyEmail: 'admin@datacenter.ua',
    alertThreshold: '85',
  });
  const [saved, setSaved] = useState(false);

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = e => {
    e.preventDefault(); // preventDefault — без перезавантаження
    onSave({ systemName: form.systemName, maxTemp: Number(form.maxTemp), interval: Number(form.interval) });
    addLog('OK', `Settings page saved: "${form.systemName}" | MaxTemp: ${form.maxTemp}°C | Interval: ${form.interval}s`);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const Field = ({ label, name, type = 'text', min, max, step, hint, options }) => (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-ch-400 uppercase tracking-wider">{label}</label>
      {options ? (
        <select
          name={name}
          value={form[name]}
          onChange={handleChange}
          className="bg-gray-50 dark:bg-ch-600 border border-gray-300 dark:border-ch-500 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand-primary transition-colors"
        >
          {options.map(o => <option key={o} value={o} className="text-gray-900 bg-white dark:text-white dark:bg-ch-600">{o}</option>)}
        </select>
      ) : (
        <input
          name={name} type={type} min={min} max={max} step={step}
          value={form[name]}
          onChange={handleChange}
          className="bg-gray-50 dark:bg-ch-600 border border-gray-300 dark:border-ch-500 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand-primary transition-colors"
        />
      )}
      {hint && <p className="text-xs text-ch-500">{hint}</p>}
    </div>
  );

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold">Налаштування системи</h2>
        <p className="text-sm text-ch-400 mt-1">Конфігурація ServerRack Monitor</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">

        {/* Загальні */}
        <section className="bg-white dark:bg-ch-700 border border-gray-200 dark:border-ch-600 rounded-xl p-6 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-brand-primary uppercase tracking-wider">
            <i className="fa-solid fa-sliders mr-2"></i>Загальні
          </h3>
          <Field label="Назва системи"     name="systemName" hint="Відображається в заголовку дашборду" />
          <Field label="Часовий пояс"      name="timezone"   options={['Europe/Kyiv', 'UTC', 'Europe/London', 'America/New_York']} />
          <Field label="Зберігати логи (днів)" name="retention" type="number" min="1" max="365" hint="Максимальна глибина зберігання журналу подій" />
        </section>

        {/* Моніторинг */}
        <section className="bg-white dark:bg-ch-700 border border-gray-200 dark:border-ch-600 rounded-xl p-6 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-brand-primary uppercase tracking-wider">
            <i className="fa-solid fa-gauge-high mr-2"></i>Моніторинг
          </h3>
          <Field label="Макс. температура CPU (°C)" name="maxTemp"  type="number" min="50" max="100" hint="При перевищенні — червоний алерт" />
          <Field label="Поріг CPU для алертів (%)"  name="alertThreshold" type="number" min="50" max="100" />
          <Field label="Інтервал оновлення (сек)"   name="interval" type="number" min="1" max="60" step="0.5" hint="Частота опитування датчиків" />
        </section>

        {/* Мережа */}
        <section className="bg-white dark:bg-ch-700 border border-gray-200 dark:border-ch-600 rounded-xl p-6 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-brand-primary uppercase tracking-wider">
            <i className="fa-solid fa-network-wired mr-2"></i>Мережа & Сповіщення
          </h3>
          <Field label="SSH порт"         name="sshPort"     type="number" min="1" max="65535" />
          <Field label="Email для алертів" name="notifyEmail" type="email" />
        </section>

        {/* Кнопки */}
        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 py-3 bg-brand-primary text-ch-800 rounded-xl font-bold text-sm hover:opacity-90 transition-all"
          >
            <i className="fa-solid fa-floppy-disk mr-2"></i>Зберегти налаштування
          </button>
          <button
            type="button"
            onClick={() => setForm({ systemName: state.systemName, maxTemp: state.maxTemp, interval: state.sensorInterval / 1000, timezone: 'Europe/Kyiv', retention: '30', sshPort: '22', notifyEmail: 'admin@datacenter.ua', alertThreshold: '85' })}
            className="px-6 py-3 border border-ch-600 rounded-xl text-sm hover:border-brand-primary hover:text-brand-primary transition-all text-ch-400"
          >
            Скинути
          </button>
        </div>

        {/* Feedback */}
        {saved && (
          <div className="bg-brand-primary/10 border border-brand-primary rounded-xl px-6 py-3 text-brand-primary text-sm font-semibold flex items-center gap-2">
            <i className="fa-solid fa-circle-check"></i> Settings applied successfully!
          </div>
        )}
      </form>
    </div>
  );
}
