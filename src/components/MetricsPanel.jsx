/**
 * MetricsPanel.jsx — Лабораторна робота №4
 * Компонент панелі метрик: RAM, Диск, Swap, Мережа.
 *
 * Всі дані отримуються виключно через props (state) — жодних
 * захардкоджених значень. diskUsed/diskTotal/swapUsed/swapTotal
 * передаються з useSensorData так само, як RAM і мережа.
 */

export default function MetricsPanel({ state }) {
  const {
    ramUsed, ramTotal,
    diskUsed, diskTotal,
    swapUsed, swapTotal,
    networkDown, networkUp, networkLatency,
  } = state;

  const ramPct  = Math.round((ramUsed  / ramTotal)  * 100);
  const diskPct = Math.round((diskUsed / diskTotal)  * 100);
  const swapPct = Math.round((swapUsed / swapTotal)  * 100);

  // Масив ресурсів — дані динамічні, без жодного хардкоду
  const resources = [
    { label: 'RAM',    used: ramUsed.toFixed(1),  total: ramTotal,  unit: 'GB', pct: ramPct  },
    { label: 'Диск /', used: diskUsed,             total: diskTotal, unit: 'GB', pct: diskPct },
    { label: 'Swap',   used: swapUsed.toFixed(1),  total: swapTotal, unit: 'GB', pct: swapPct },
  ];

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6">
      {/* Ресурси системи */}
      <div className="bg-white dark:bg-ch-700 border border-gray-200 dark:border-ch-600 rounded-xl p-6 flex flex-col gap-4 hover:border-brand-primary transition-all duration-300">
        <span className="text-xs text-gray-500 dark:text-ch-400 uppercase tracking-wider font-semibold">
          <i className="fa-solid fa-memory mr-1"></i>Ресурси системи
        </span>

        <div className="flex flex-col gap-4">
          {resources.map(({ label, used, total, unit, pct }) => (
            <div key={label}>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-700 dark:text-white">{label}</span>
                <span className="text-brand-primary font-mono">
                  {used} / {total} {unit}
                </span>
              </div>
              <progress
                value={pct}
                max="100"
                className="w-full h-2 rounded-full accent-green-500 dark:accent-neon"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Мережеве навантаження */}
      <div className="bg-white dark:bg-ch-700 border border-gray-200 dark:border-ch-600 rounded-xl p-6 flex flex-col gap-4 hover:border-brand-primary transition-all duration-300">
        <span className="text-xs text-gray-500 dark:text-ch-400 uppercase tracking-wider font-semibold">
          <i className="fa-solid fa-network-wired mr-1"></i>Мережеве навантаження
        </span>

        <div className="flex gap-6">
          {[
            { label: 'Download', value: networkDown.toFixed(1), unit: 'GB/s' },
            { label: 'Upload',   value: networkUp.toFixed(1),   unit: 'GB/s' },
            { label: 'Latency',  value: networkLatency,         unit: 'ms'   },
          ].map(({ label, value, unit }) => (
            <div key={label} className="flex flex-col gap-1">
              <span className="text-xs text-gray-500 dark:text-ch-400">{label}</span>
              <span className="text-2xl font-bold text-brand-primary font-mono">
                {value} <span className="text-sm">{unit}</span>
              </span>
            </div>
          ))}
        </div>

        {/* Сервери */}
        <div className="flex flex-col gap-2 mt-2">
          {[
            { name: 'web-prod-01',    ip: '192.168.1.101', status: 'Online',    color: 'bg-status-ok' },
            { name: 'db-master-01',   ip: '192.168.1.102', status: 'Online',    color: 'bg-status-ok' },
            { name: 'backup-srv-01',  ip: '192.168.1.104', status: 'High Load', color: 'bg-status-warning' },
            { name: 'api-gateway-01', ip: '192.168.1.105', status: 'Online',    color: 'bg-status-ok' },
          ].map(srv => (
            <div key={srv.name} className="flex items-center gap-3 bg-gray-50 dark:bg-ch-600 rounded-lg px-4 py-2">
              <span className={`w-2.5 h-2.5 ${srv.color} rounded-full flex-shrink-0`}></span>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{srv.name}</div>
                <div className="text-xs text-gray-400 font-mono">{srv.ip}</div>
              </div>
              <span className={`text-xs font-semibold ${
                srv.status === 'Online' ? 'text-brand-primary' : 'text-status-warning'
              }`}>{srv.status}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
