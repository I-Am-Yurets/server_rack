/**
 * CpuDetailsPage.jsx — Детальна сторінка CPU
 * Props: state, addLog
 */

import { useState, useEffect, useRef } from 'react';

function randomInRange(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

export default function CpuDetailsPage({ state, addLog }) {
  const [cores, setCores] = useState(() =>
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      load: randomInRange(15, 85),
      temp: randomInRange(48, 72),
      freq: +(3.2 + Math.random() * 0.8).toFixed(2),
    }))
  );

  // Ref щоб логувати перевищення порогу лише один раз поспіль
  const overTempLogged = useRef(false);

  // useEffect з cleanup — оновлення ядер синхронно з інтервалом датчиків
  useEffect(() => {
    if (!state.isMonitoring) return;

    addLog('INFO', 'CPU Details page opened — core monitoring active');

    const timer = setInterval(() => {
      setCores(prev => prev.map(core => ({
        ...core,
        load: randomInRange(15, 90),
        temp: randomInRange(45, 78),
        freq: +(3.1 + Math.random() * 0.9).toFixed(2),
      })));
    }, state.sensorInterval);

    return () => {
      clearInterval(timer); // cleanup
      addLog('INFO', 'CPU Details page closed — core monitoring stopped');
    };
  // addLog свідомо не в залежностях — стабільний колбек із useCallback
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isMonitoring, state.sensorInterval]);

  // Логуємо критичну температуру при першому перевищенні
  useEffect(() => {
    const maxTemp = Math.max(...cores.map(c => c.temp));
    if (maxTemp >= state.maxTemp * 0.9 && !overTempLogged.current) {
      addLog('ERROR', `CPU core overtemp: peak ${maxTemp}°C — threshold ${state.maxTemp}°C`);
      overTempLogged.current = true;
    } else if (maxTemp < state.maxTemp * 0.8) {
      overTempLogged.current = false;
    }
  }, [cores, state.maxTemp, addLog]);

  const avgLoad = Math.round(cores.reduce((s, c) => s + c.load, 0) / cores.length);
  const maxTemp = Math.max(...cores.map(c => c.temp));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold">CPU — Детальна інформація</h2>
        <p className="text-sm text-ch-400 mt-1">Intel Xeon E-2378 · 8 ядер / 16 потоків · TDP 65W</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Avg Load',   value: `${avgLoad}%`,  icon: 'fa-microchip' },
          { label: 'Max Temp',   value: `${maxTemp}°C`, icon: 'fa-temperature-half', warn: maxTemp > state.maxTemp * 0.85 },
          { label: 'Base Clock', value: '3.2 GHz',      icon: 'fa-bolt' },
          { label: 'Cache L3',   value: '16 MB',        icon: 'fa-layer-group' },
        ].map(({ label, value, icon, warn }) => (
          <div key={label} className={`bg-white dark:bg-ch-700 border rounded-xl p-5 hover:border-brand-primary transition-all ${
            warn ? 'border-status-error shadow-[0_0_12px_rgba(255,57,57,0.2)]' : 'border-gray-200 dark:border-ch-600'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-ch-400 uppercase tracking-wider">{label}</span>
              <i className={`fa-solid ${icon} ${warn ? 'text-status-error' : 'text-brand-primary'} opacity-70`}></i>
            </div>
            <div className={`text-2xl font-bold font-mono ${warn ? 'text-status-error' : 'text-brand-primary'}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-ch-700 border border-gray-200 dark:border-ch-600 rounded-xl p-6">
        <h3 className="text-xs uppercase tracking-wider text-ch-400 font-semibold mb-6">
          <i className="fa-solid fa-microchip mr-2"></i>Навантаження по ядрах
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cores.map(core => {
            const loadColor = core.load > 80 ? '#ff3939' : core.load > 60 ? '#ffa500' : '#39ff14';
            return (
              <div key={core.id} className="flex flex-col gap-3 bg-gray-50 dark:bg-ch-600 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-ch-400 font-semibold">Core {core.id}</span>
                  <span className="text-xs font-mono" style={{ color: loadColor }}>{core.load}%</span>
                </div>
                <div className="h-24 bg-ch-700 rounded-lg overflow-hidden flex flex-col-reverse">
                  <div
                    className="rounded-lg transition-all duration-700"
                    style={{
                      height: `${core.load}%`,
                      backgroundColor: loadColor,
                      boxShadow: `0 0 8px ${loadColor}55`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs font-mono text-ch-400">
                  <span>{core.temp}°C</span>
                  <span>{core.freq}GHz</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white dark:bg-ch-700 border border-gray-200 dark:border-ch-600 rounded-xl p-6">
        <h3 className="text-xs uppercase tracking-wider text-ch-400 font-semibold mb-4">
          <i className="fa-solid fa-circle-info mr-2"></i>Специфікація процесора
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          {[
            ['Модель',      'Intel Xeon E-2378'],
            ['Архітектура', 'Rocket Lake'],
            ['Ядра/Потоки', '8C / 16T'],
            ['Base clock',  '3.20 GHz'],
            ['Boost clock', '5.10 GHz'],
            ['TDP',         '65 W'],
            ['Cache L1',    '512 KB'],
            ['Cache L2',    '4 MB'],
            ['Cache L3',    '16 MB'],
            ['Socket',      'LGA1200'],
            ['Тех. процес', '10 nm'],
            ["Пам'ять",     'DDR4 ECC'],
          ].map(([k, v]) => (
            <div key={k} className="flex flex-col gap-1">
              <span className="text-xs text-ch-400">{k}</span>
              <span className="font-mono text-brand-primary font-semibold">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
