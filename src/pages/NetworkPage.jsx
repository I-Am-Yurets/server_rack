/**
 * NetworkPage.jsx — Сторінка мережевого моніторингу
 * Props: state, addLog
 */

import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PORTS = [
  { id: 1, name: 'eth0', server: 'web-prod-01',    speed: '1 Gbps',  status: 'up',   rx: '1.2', tx: '0.8', vlan: 10 },
  { id: 2, name: 'eth0', server: 'db-master-01',   speed: '1 Gbps',  status: 'up',   rx: '0.6', tx: '2.1', vlan: 20 },
  { id: 3, name: 'eth0', server: 'db-replica-01',  speed: '1 Gbps',  status: 'up',   rx: '0.4', tx: '1.8', vlan: 20 },
  { id: 4, name: 'eth0', server: 'backup-srv-01',  speed: '1 Gbps',  status: 'up',   rx: '3.1', tx: '0.2', vlan: 30 },
  { id: 5, name: 'eth0', server: 'api-gateway-01', speed: '10 Gbps', status: 'up',   rx: '4.8', tx: '3.2', vlan: 10 },
  { id: 6, name: 'eth0', server: 'monitor-01',     speed: '1 Gbps',  status: 'down', rx: '0',   tx: '0',   vlan: 40 },
  { id: 7, name: 'uplink-1', server: 'ISP Primary',speed: '10 Gbps', status: 'up',   rx: '9.2', tx: '6.4', vlan: 1  },
  { id: 8, name: 'uplink-2', server: 'ISP Backup', speed: '10 Gbps', status: 'up',   rx: '0.3', tx: '0.1', vlan: 1  },
];

const NET_HISTORY = Array.from({ length: 20 }, (_, i) => ({
  t:  `${String(10 + i).padStart(2, '0')}:00`,
  rx: +(8 + Math.sin(i / 3) * 3 + Math.random()).toFixed(1),
  tx: +(5 + Math.cos(i / 3) * 2 + Math.random()).toFixed(1),
}));

const TOOLTIP_STYLE = {
  contentStyle: { background: '#2d2d2d', border: '1px solid #3a3a3a', borderRadius: 8, color: '#fff', fontSize: 12 },
};

export default function NetworkPage({ state, addLog }) {
  const [selectedPort, setSelectedPort] = useState(null);

  const handlePortClick = (port) => {
    const isSelected = selectedPort === port.id;
    setSelectedPort(isSelected ? null : port.id);
    if (!isSelected) {
      addLog(
        port.status === 'up' ? 'INFO' : 'WARN',
        `Network port selected: #${String(port.id).padStart(2,'0')} ${port.name} — ${port.server} [${port.status.toUpperCase()}] VLAN ${port.vlan}`
      );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold">Мережевий моніторинг</h2>
        <p className="text-sm text-ch-400 mt-1">Стан інтерфейсів та трафік комутатора</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Download', value: `${state.networkDown.toFixed(1)} GB/s`, icon: 'fa-arrow-down' },
          { label: 'Upload',   value: `${state.networkUp.toFixed(1)} GB/s`,   icon: 'fa-arrow-up' },
          { label: 'Latency',  value: `${state.networkLatency} ms`,           icon: 'fa-stopwatch' },
          { label: 'Активних', value: `${PORTS.filter(p => p.status === 'up').length} / ${PORTS.length}`, icon: 'fa-plug' },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-white dark:bg-ch-700 border border-gray-200 dark:border-ch-600 rounded-xl p-5 hover:border-brand-primary transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-ch-400 uppercase tracking-wider">{label}</span>
              <i className={`fa-solid ${icon} text-brand-primary opacity-60`}></i>
            </div>
            <div className="text-2xl font-bold font-mono text-brand-primary">{value}</div>
          </div>
        ))}
      </div>

      {/* Графік трафіку */}
      <div className="bg-white dark:bg-ch-700 border border-gray-200 dark:border-ch-600 rounded-xl p-6">
        <h3 className="text-xs uppercase tracking-wider text-ch-400 font-semibold mb-4">
          <i className="fa-solid fa-chart-area mr-2"></i>Трафік uplink (GB/s)
        </h3>
        <div style={{ height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={NET_HISTORY}>
              <defs>
                <linearGradient id="rxG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#39ff14" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#39ff14" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="txG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#60a5fa" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
              <XAxis dataKey="t" tick={{ fill: '#6a6a6a', fontSize: 10 }} tickLine={false} />
              <YAxis tick={{ fill: '#6a6a6a', fontSize: 10 }} tickLine={false} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="rx" name="Download" stroke="#39ff14" fill="url(#rxG)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="tx" name="Upload"   stroke="#60a5fa" fill="url(#txG)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Таблиця портів */}
      <div className="bg-white dark:bg-ch-700 border border-gray-200 dark:border-ch-600 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-ch-600">
          <span className="text-xs uppercase tracking-wider text-ch-400 font-semibold">
            <i className="fa-solid fa-network-wired mr-2"></i>Стан портів комутатора
          </span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase text-ch-400 border-b border-ch-600">
              <th className="text-left px-6 py-3 font-semibold">Порт</th>
              <th className="text-left px-6 py-3 font-semibold">Пристрій</th>
              <th className="text-left px-6 py-3 font-semibold">Швидкість</th>
              <th className="text-left px-6 py-3 font-semibold">VLAN</th>
              <th className="text-left px-6 py-3 font-semibold">RX</th>
              <th className="text-left px-6 py-3 font-semibold">TX</th>
              <th className="text-left px-6 py-3 font-semibold">Статус</th>
            </tr>
          </thead>
          <tbody>
            {PORTS.map(port => (
              <tr
                key={port.id}
                onClick={() => handlePortClick(port)}
                className={`border-b border-ch-600 last:border-0 cursor-pointer transition-colors ${
                  selectedPort === port.id
                    ? 'bg-brand-primary/5'
                    : 'hover:bg-ch-600'
                }`}
              >
                <td className="px-6 py-3 font-mono text-xs text-ch-400">
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                    port.status === 'up' ? 'bg-brand-primary' : 'bg-status-error'
                  }`}></span>
                  {`#${String(port.id).padStart(2,'0')} ${port.name}`}
                </td>
                <td className="px-6 py-3 font-semibold text-gray-900 dark:text-white">{port.server}</td>
                <td className="px-6 py-3 font-mono text-xs text-ch-400">{port.speed}</td>
                <td className="px-6 py-3">
                  <span className="bg-brand-primary/10 text-brand-primary border border-brand-primary/30 text-xs px-2 py-0.5 rounded font-mono">
                    {port.vlan}
                  </span>
                </td>
                <td className="px-6 py-3 font-mono text-xs text-brand-primary">{port.rx} GB/s</td>
                <td className="px-6 py-3 font-mono text-xs text-blue-400">{port.tx} GB/s</td>
                <td className="px-6 py-3">
                  <span className={`text-xs font-semibold ${
                    port.status === 'up' ? 'text-brand-primary' : 'text-status-error'
                  }`}>
                    {port.status === 'up' ? 'UP' : 'DOWN'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
