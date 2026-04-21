/**
 * LiveChart.jsx — Лабораторна робота №4
 * Живий лінійний графік CPU / RAM / Network.
 * Використовує бібліотеку recharts для відображення даних.
 * Props: data (масив точок), isMonitoring
 */

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const DATASETS = [
  { key: 'cpu', label: 'CPU',     color: '#39ff14' },
  { key: 'ram', label: 'RAM',     color: '#60a5fa' },
  { key: 'net', label: 'Network', color: '#fb923c' },
];

export default function LiveChart({ data, isMonitoring }) {
  // Стан видимості кожного датасету
  const [visible, setVisible] = useState({ cpu: true, ram: true, net: true });

  const toggleDataset = (key) => {
    setVisible(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <section className="bg-white dark:bg-ch-700 border border-gray-200 dark:border-ch-600 rounded-xl p-6 mb-6 hover:border-brand-primary transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 dark:text-ch-400 uppercase tracking-wider font-semibold">
            <i className="fa-solid fa-chart-line mr-1"></i>Live Monitor — CPU / RAM / Network
          </span>
          <span className={`text-xs font-mono font-semibold ${isMonitoring ? 'text-brand-primary animate-pulse-slow' : 'text-gray-400'}`}>
            {isMonitoring ? '● Live' : '■ Paused'}
          </span>
        </div>

        {/* Кнопки toggle датасетів */}
        <div className="flex items-center gap-2">
          {DATASETS.map(ds => (
            <button
              key={ds.key}
              onClick={() => toggleDataset(ds.key)}
              className="px-2.5 py-1 rounded-full text-xs font-semibold border transition-all"
              style={{
                borderColor: ds.color,
                color: visible[ds.key] ? '#1a1a1a' : ds.color,
                backgroundColor: visible[ds.key] ? ds.color : 'transparent',
                opacity: visible[ds.key] ? 1 : 0.5,
              }}
            >
              {ds.label}
            </button>
          ))}
        </div>
      </div>

      {/* Графік */}
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
            <XAxis
              dataKey="time"
              tick={{ fill: '#6a6a6a', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#6a6a6a', fontSize: 10 }}
              tickLine={false}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{ background: '#2d2d2d', border: '1px solid #3a3a3a', borderRadius: 8, color: '#fff', fontSize: 12 }}
              labelStyle={{ color: '#6a6a6a' }}
            />
            {DATASETS.map(ds => (
              visible[ds.key] && (
                <Line
                  key={ds.key}
                  type="monotone"
                  dataKey={ds.key}
                  name={ds.label}
                  stroke={ds.color}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              )
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
