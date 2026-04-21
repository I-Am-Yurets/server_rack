/**
 * ServersPage.jsx — Сторінка керування серверами
 * Props: state, addLog — колбек для запису подій до консолі дашборду
 */

import { useState } from 'react';

const SERVERS = [
  { id: 1, name: 'web-prod-01',    ip: '192.168.1.101', status: 'online',  cpu: 34, ram: 62, uptime: '47d 12h', role: 'Web Server',   os: 'Ubuntu 22.04' },
  { id: 2, name: 'db-master-01',   ip: '192.168.1.102', status: 'online',  cpu: 51, ram: 78, uptime: '47d 12h', role: 'Database',      os: 'Debian 12' },
  { id: 3, name: 'db-replica-01',  ip: '192.168.1.103', status: 'online',  cpu: 22, ram: 45, uptime: '12d 3h',  role: 'DB Replica',    os: 'Debian 12' },
  { id: 4, name: 'backup-srv-01',  ip: '192.168.1.104', status: 'warning', cpu: 87, ram: 91, uptime: '47d 12h', role: 'Backup Server', os: 'Ubuntu 22.04' },
  { id: 5, name: 'api-gateway-01', ip: '192.168.1.105', status: 'online',  cpu: 29, ram: 41, uptime: '47d 12h', role: 'API Gateway',   os: 'Alpine 3.19' },
  { id: 6, name: 'monitor-01',     ip: '192.168.1.106', status: 'offline', cpu: 0,  ram: 0,  uptime: '—',       role: 'Monitoring',    os: 'Ubuntu 22.04' },
];

const STATUS_CONFIG = {
  online:  { dot: 'bg-status-ok',      text: 'text-brand-primary',  label: 'Online' },
  warning: { dot: 'bg-status-warning', text: 'text-status-warning', label: 'High Load' },
  offline: { dot: 'bg-status-error',   text: 'text-status-error',   label: 'Offline' },
};

function CpuBar({ value, status }) {
  const color = status === 'offline' ? 'bg-ch-500'
    : value > 80 ? 'bg-status-error'
    : value > 60 ? 'bg-status-warning'
    : 'bg-brand-primary';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-ch-600 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-mono w-8 text-right">
        {status === 'offline' ? '—' : `${value}%`}
      </span>
    </div>
  );
}

export default function ServersPage({ state, addLog }) {
  const [selected, setSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState('Всі');

  const handleSelectServer = (srv) => {
    const isSelected = selected === srv.id;
    setSelected(isSelected ? null : srv.id);
    if (!isSelected) {
      addLog('INFO', `Server details opened: ${srv.name} (${srv.ip}) — ${STATUS_CONFIG[srv.status].label}`);
    }
  };

  const handleFilterChange = (f) => {
    setStatusFilter(f);
    addLog('INFO', `Servers filter changed: ${f}`);
  };

  const filtered = SERVERS.filter(s =>
    statusFilter === 'Всі'    ? true :
    statusFilter === 'Online'  ? s.status === 'online' :
    statusFilter === 'Warning' ? s.status === 'warning' :
    statusFilter === 'Offline' ? s.status === 'offline' : true
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Керування серверами</h2>
          <p className="text-sm text-gray-500 dark:text-ch-400 mt-1">
            6 серверів у стійці · 4 Online · 1 Warning · 1 Offline
          </p>
        </div>
        <div className="flex gap-2">
          {['Всі', 'Online', 'Warning', 'Offline'].map(f => (
            <button
              key={f}
              onClick={() => handleFilterChange(f)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                statusFilter === f
                  ? 'bg-brand-primary text-ch-800 border-brand-primary font-semibold'
                  : 'border-ch-600 text-ch-400 hover:border-brand-primary hover:text-brand-primary'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-ch-700 border border-gray-200 dark:border-ch-600 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-ch-600 text-xs uppercase text-gray-500 dark:text-ch-400">
              <th className="text-left px-6 py-4 font-semibold tracking-wider">Сервер</th>
              <th className="text-left px-6 py-4 font-semibold tracking-wider">Роль</th>
              <th className="text-left px-6 py-4 font-semibold tracking-wider">Статус</th>
              <th className="text-left px-6 py-4 font-semibold tracking-wider w-40">CPU</th>
              <th className="text-left px-6 py-4 font-semibold tracking-wider w-40">RAM</th>
              <th className="text-left px-6 py-4 font-semibold tracking-wider">Uptime</th>
              <th className="text-left px-6 py-4 font-semibold tracking-wider">OS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(srv => {
              const cfg = STATUS_CONFIG[srv.status];
              const isSelected = selected === srv.id;
              return (
                <tr
                  key={srv.id}
                  onClick={() => handleSelectServer(srv)}
                  className={`border-b border-gray-100 dark:border-ch-600 last:border-0 cursor-pointer transition-all
                    ${isSelected
                      ? 'bg-brand-primary/5 border-l-2 border-l-brand-primary'
                      : 'hover:bg-gray-50 dark:hover:bg-ch-600'}`}
                >
                  <td className="px-6 py-4">
                    <div className="font-semibold font-mono text-gray-900 dark:text-white">{srv.name}</div>
                    <div className="text-xs text-ch-400 font-mono">{srv.ip}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-ch-400">{srv.role}</td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-2 font-semibold ${cfg.text}`}>
                      <span className={`w-2 h-2 rounded-full ${cfg.dot} ${srv.status === 'online' ? 'animate-pulse' : ''}`}></span>
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-6 py-4"><CpuBar value={srv.cpu} status={srv.status} /></td>
                  <td className="px-6 py-4"><CpuBar value={srv.ram} status={srv.status} /></td>
                  <td className="px-6 py-4 font-mono text-xs text-ch-400">{srv.uptime}</td>
                  <td className="px-6 py-4 text-xs text-ch-400">{srv.os}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Детальна панель (умовний рендеринг) */}
      {selected && (() => {
        const srv = SERVERS.find(s => s.id === selected);
        const cfg = STATUS_CONFIG[srv.status];
        return (
          <div className="bg-white dark:bg-ch-700 border border-brand-primary/40 rounded-xl p-6 shadow-neon-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg font-mono">{srv.name}</h3>
              <button
                onClick={() => { setSelected(null); addLog('INFO', `Server details closed: ${srv.name}`); }}
                className="text-ch-400 hover:text-white transition-colors"
              >✕</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {[
                ['IP-адреса',  srv.ip],
                ['Роль',       srv.role],
                ['ОС',         srv.os],
                ['Uptime',     srv.uptime],
                ['CPU',        srv.status === 'offline' ? '—' : `${srv.cpu}%`],
                ['RAM',        srv.status === 'offline' ? '—' : `${srv.ram}%`],
                ['Статус',     cfg.label],
                ['SSH порт',   '22'],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col gap-1">
                  <span className="text-xs text-ch-400 uppercase tracking-wider">{label}</span>
                  <span className="font-mono text-brand-primary font-semibold">{value}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
