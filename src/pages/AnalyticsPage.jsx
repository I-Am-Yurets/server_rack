/**
 * AnalyticsPage.jsx — Сторінка аналітики
 * Відображає зведену статистику та графіки продуктивності.
 */

import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Генеруємо псевдо-статичні дані за добу
const HOURLY = Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2, '0')}:00`,
  cpu:  Math.round(20 + Math.sin(i / 3) * 25 + Math.random() * 15),
  ram:  Math.round(55 + Math.sin(i / 4 + 1) * 20 + Math.random() * 10),
  net:  +(1 + Math.random() * 2.5).toFixed(1),
}));

const TOOLTIP_STYLE = {
  contentStyle: { background: '#2d2d2d', border: '1px solid #3a3a3a', borderRadius: 8, color: '#fff', fontSize: 12 },
  labelStyle: { color: '#6a6a6a' },
};

const STATS = [
  { label: 'Середнє CPU',    value: '47%',     delta: '+3%',   up: true },
  { label: 'Пікове CPU',     value: '89%',     delta: '-5%',   up: false },
  { label: 'Середній RAM',   value: '68%',     delta: '+2%',   up: true },
  { label: 'Avg Latency',    value: '18 ms',   delta: '-4ms',  up: false },
  { label: 'Uptime (30d)',   value: '99.8%',   delta: '+0.1%', up: false },
  { label: 'Трафік (добу)',  value: '142 GB',  delta: '+12%',  up: true },
];

export default function AnalyticsPage({ chartHistory }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold">Аналітика продуктивності</h2>
        <p className="text-sm text-gray-500 dark:text-ch-400 mt-1">Статистика за останні 24 години</p>
      </div>

      {/* Зведена статистика */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {STATS.map(({ label, value, delta, up }) => (
          <div key={label} className="bg-white dark:bg-ch-700 border border-gray-200 dark:border-ch-600 rounded-xl p-4 hover:border-brand-primary transition-all">
            <div className="text-xs text-ch-400 mb-2 uppercase tracking-wider">{label}</div>
            <div className="text-xl font-bold font-mono text-brand-primary">{value}</div>
            <div className={`text-xs mt-1 font-mono ${up ? 'text-status-warning' : 'text-brand-primary'}`}>{delta} від норми</div>
          </div>
        ))}
      </div>

      {/* Area Chart — CPU за добу */}
      <div className="bg-white dark:bg-ch-700 border border-gray-200 dark:border-ch-600 rounded-xl p-6">
        <h3 className="text-xs uppercase tracking-wider text-ch-400 font-semibold mb-4">
          <i className="fa-solid fa-chart-area mr-2"></i>CPU навантаження за 24 год
        </h3>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={HOURLY}>
              <defs>
                <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#39ff14" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#39ff14" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
              <XAxis dataKey="hour" tick={{ fill: '#6a6a6a', fontSize: 10 }} tickLine={false} interval={3} />
              <YAxis tick={{ fill: '#6a6a6a', fontSize: 10 }} tickLine={false} domain={[0, 100]} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="cpu" name="CPU %" stroke="#39ff14" fill="url(#cpuGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart — мережевий трафік */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-ch-700 border border-gray-200 dark:border-ch-600 rounded-xl p-6">
          <h3 className="text-xs uppercase tracking-wider text-ch-400 font-semibold mb-4">
            <i className="fa-solid fa-chart-bar mr-2"></i>Мережевий трафік (GB/s)
          </h3>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={HOURLY.filter((_, i) => i % 2 === 0)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
                <XAxis dataKey="hour" tick={{ fill: '#6a6a6a', fontSize: 10 }} tickLine={false} interval={2} />
                <YAxis tick={{ fill: '#6a6a6a', fontSize: 10 }} tickLine={false} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="net" name="GB/s" fill="#39ff14" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live feed (поточні дані) */}
        <div className="bg-white dark:bg-ch-700 border border-gray-200 dark:border-ch-600 rounded-xl p-6">
          <h3 className="text-xs uppercase tracking-wider text-ch-400 font-semibold mb-4">
            <i className="fa-solid fa-chart-line mr-2"></i>RAM за останні хвилини (Live)
          </h3>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
                <XAxis dataKey="time" tick={{ fill: '#6a6a6a', fontSize: 10 }} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: '#6a6a6a', fontSize: 10 }} tickLine={false} domain={[0, 100]} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="ram" name="RAM %" stroke="#60a5fa" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
