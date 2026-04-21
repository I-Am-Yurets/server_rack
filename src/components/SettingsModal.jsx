/**
 * SettingsModal.jsx — Лабораторна робота №4
 * Модальне вікно налаштувань системи.
 *
 * Виправлений баг: useEffect залежав від [isOpen, currentSettings].
 * currentSettings — це частина state з useSensorData, який оновлюється
 * кожні N секунд разом із даними датчиків. Кожен тік таймера породжував
 * новий об'єкт state → React бачив нове посилання → скидав форму.
 *
 * Рішення: залежність лише від [isOpen]. Значення знімаються один раз
 * через settingsSnapshot.current у момент відкриття модалки.
 */

import { useState, useEffect, useRef } from 'react';

export default function SettingsModal({ isOpen, onClose, currentSettings, onSave }) {
  const [form, setForm] = useState({ systemName: '', maxTemp: 85, interval: 3 });
  const [feedback, setFeedback] = useState('');
  const [success, setSuccess]   = useState(false);

  // Ref зберігає snapshot налаштувань у момент відкриття —
  // щоб не тримати currentSettings у залежностях useEffect
  const settingsSnapshot = useRef(currentSettings);

  useEffect(() => {
    if (isOpen) {
      // Знімаємо snapshot ОДИН РАЗ при відкритті модалки
      settingsSnapshot.current = currentSettings;
      setForm({
        systemName: currentSettings.systemName,
        maxTemp:    currentSettings.maxTemp,
        interval:   currentSettings.sensorInterval / 1000,
      });
      setFeedback('');
      setSuccess(false);
    }
  // currentSettings свідомо відсутній у залежностях:
  // нам потрібне значення лише в момент isOpen=true, а не при кожному
  // оновленні датчиків (яке відбувається кожні sensorInterval мс).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Обробник submit — event.preventDefault() зупиняє перезавантаження сторінки
  const handleSubmit = (e) => {
    e.preventDefault();

    // Валідація (Boundary Testing)
    const maxTemp  = Number(form.maxTemp);
    const interval = Number(form.interval);

    if (!form.systemName.trim()) {
      setFeedback('❌ Назва системи не може бути порожньою');
      setSuccess(false);
      return;
    }
    if (isNaN(maxTemp) || maxTemp < 50 || maxTemp > 100) {
      setFeedback('❌ Макс. температура має бути від 50 до 100°C');
      setSuccess(false);
      return;
    }
    if (isNaN(interval) || interval < 1 || interval > 60) {
      setFeedback('❌ Інтервал має бути від 1 до 60 секунд');
      setSuccess(false);
      return;
    }

    onSave({ systemName: form.systemName.trim(), maxTemp, interval });
    setFeedback('✅ Settings applied successfully!');
    setSuccess(true);
    setTimeout(() => onClose(), 1200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className={`bg-white dark:bg-ch-700 border rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl transition-all duration-300 ${
        success
          ? 'border-brand-primary shadow-neon-md'
          : 'border-gray-200 dark:border-ch-600'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            <i className="fa-solid fa-gear mr-2 text-brand-primary"></i>Налаштування системи
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-xl px-2"
          >✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Назва системи */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-500 dark:text-ch-400 uppercase tracking-wider">
              Назва системи
            </label>
            <input
              name="systemName"
              type="text"
              value={form.systemName}
              onChange={handleChange}
              placeholder="Rack-01 • Дата-центр UA-1"
              className="bg-gray-50 dark:bg-ch-600 border border-gray-300 dark:border-ch-500 rounded-lg px-4 py-2.5
                text-sm text-gray-900 dark:text-white placeholder-gray-400
                focus:outline-none focus:border-brand-primary transition-colors"
            />
          </div>

          {/* Макс температура */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-500 dark:text-ch-400 uppercase tracking-wider">
              Макс. температура CPU (°C)
            </label>
            <div className="flex items-center gap-3">
              <input
                name="maxTemp"
                type="number"
                min="50" max="100"
                value={form.maxTemp}
                onChange={handleChange}
                data-unit="Celsius"
                className="bg-gray-50 dark:bg-ch-600 border border-gray-300 dark:border-ch-500 rounded-lg px-4 py-2.5
                  text-sm font-mono text-gray-900 dark:text-white w-28
                  focus:outline-none focus:border-brand-primary transition-colors"
              />
              <span className="text-sm text-gray-500 dark:text-ch-400">°C (50–100)</span>
            </div>
          </div>

          {/* Інтервал оновлення */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-gray-500 dark:text-ch-400 uppercase tracking-wider">
              Інтервал оновлення (сек)
            </label>
            <div className="flex items-center gap-3">
              <input
                name="interval"
                type="number"
                min="1" max="60" step="0.5"
                value={form.interval}
                onChange={handleChange}
                className="bg-gray-50 dark:bg-ch-600 border border-gray-300 dark:border-ch-500 rounded-lg px-4 py-2.5
                  text-sm font-mono text-gray-900 dark:text-white w-28
                  focus:outline-none focus:border-brand-primary transition-colors"
              />
              <span className="text-sm text-gray-500 dark:text-ch-400">с (1–60)</span>
            </div>
          </div>

          {/* Зворотний зв'язок */}
          <p className={`text-xs min-h-[1rem] ${success ? 'text-brand-primary' : 'text-status-error'}`}>
            {feedback}
          </p>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 dark:border-ch-500 rounded-xl text-sm
                hover:border-brand-primary hover:text-brand-primary transition-all text-gray-700 dark:text-white"
            >
              Скасувати
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-brand-primary text-ch-800 rounded-xl text-sm font-bold hover:opacity-90 transition-all"
            >
              Зберегти
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
