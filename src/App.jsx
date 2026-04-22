/**
 * App.jsx — Лабораторна робота №4
 * Варіант 2: Моніторинг серверної стійки (Charcoal & Neon Green)
 *
 * ── Complex State ────────────────────────────────────────────────────────────
 * UI-стан компонента описується ОДНИМ об'єктом через useReducer:
 *   { sidebarOpen, settingsOpen, activeSection, theme }
 * Замість чотирьох окремих useState використовується єдиний редюсер.
 *
 * ── DOM-виняток ──────────────────────────────────────────────────────────────
 * document.documentElement.classList.toggle('dark') — єдиний необхідний виняток:
 * Tailwind v3 dark mode потребує наявності класу 'dark' на <html>.
 * Це стандартний підхід, описаний в офіційній документації Tailwind.
 * Альтернативи (CSS variables) потребують рефакторингу всієї дизайн-системи.
 */

import { useReducer, useEffect } from 'react';
import { useSensorData } from './hooks/useSensorData';

import Sidebar       from './components/Sidebar';
import Header        from './components/Header';
import SensorCard    from './components/SensorCard';
import CpuGauge      from './components/CpuGauge';
import MetricsPanel  from './components/MetricsPanel';
import LiveChart     from './components/LiveChart';
import SystemConsole from './components/SystemConsole';
import SettingsModal from './components/SettingsModal';

import ServersPage    from './pages/ServersPage';
import AnalyticsPage  from './pages/AnalyticsPage';
import AlertsPage     from './pages/AlertsPage';
import NetworkPage    from './pages/NetworkPage';
import CpuDetailsPage from './pages/CpuDetailsPage';
import SettingsPage   from './pages/SettingsPage';

/* ── Назви вкладок для логування ── */
const SECTION_LABELS = {
  dashboard: 'Dashboard',
  servers:   'Servers',
  analytics: 'Analytics',
  alerts:    'Alerts',
  network:   'Network',
  cpu:       'CPU Details',
  settings:  'Settings',
};

/* ════════════════════════════════════════════════════════════════════════
   UI REDUCER — керує станом інтерфейсу одним об'єктом
   ════════════════════════════════════════════════════════════════════════ */

const UI_INITIAL_STATE = {
  sidebarOpen:   false,
  settingsOpen:  false,
  activeSection: 'dashboard',
  theme:         localStorage.getItem('srm-theme') || 'dark',
};

function uiReducer(state, action) {
  switch (action.type) {
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case 'CLOSE_SIDEBAR':
      return { ...state, sidebarOpen: false };
    case 'OPEN_SETTINGS':
      return { ...state, settingsOpen: true };
    case 'CLOSE_SETTINGS':
      return { ...state, settingsOpen: false };
    case 'NAVIGATE':
      return { ...state, activeSection: action.payload, sidebarOpen: false };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    default:
      return state;
  }
}

/* ── Головна сторінка Dashboard ── */
function DashboardPage({ state, logs, chartHistory, clearLogs, onNavigate, addLog }) {
  const cpuWarning = state.cpuLoad > 80;

  return (
    <>
      <section className="bg-yellow-50 dark:bg-yellow-500/10 border-l-4 border-yellow-400 dark:border-yellow-500 rounded-lg px-6 py-4 mb-8 text-sm">
        ⚠️ <strong className="text-yellow-700 dark:text-yellow-400">backup-srv-01</strong>
        <span className="text-gray-600 dark:text-gray-300"> має підвищене навантаження CPU (87%).</span>
        <button
          onClick={() => onNavigate('servers')}
          className="text-green-700 dark:text-brand-primary underline ml-2 font-semibold"
        >
          Переглянути деталі →
        </button>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6">
        <SensorCard label="Uptime"       value={`${state.uptime.toFixed(1)}%`}    icon="fa-arrow-trend-up" color="text-brand-primary"                                      subtext="За останні 30 днів"   onClick={() => onNavigate('analytics')} />
        <SensorCard label="SSH Sessions" value={state.sshCount}                    icon="fa-terminal"       color="text-brand-primary"                                      subtext={`● ${state.sshCount} активних`} onClick={() => onNavigate('servers')} />
        <SensorCard label="Net Download" value={state.networkDown.toFixed(1)} unit="GB/s" icon="fa-network-wired" color="text-brand-primary"                              subtext="Пропускна здатність"  onClick={() => onNavigate('network')} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-6">
        <CpuGauge temp={state.cpuTemp} maxTemp={state.maxTemp} />
        <div className="lg:col-span-2">
          <MetricsPanel state={state} />
        </div>
      </section>

      <LiveChart data={chartHistory} isMonitoring={state.isMonitoring} />
      <SystemConsole logs={logs} onClear={clearLogs} />
    </>
  );
}

/* ── Кореневий компонент App ── */
export default function App() {
  // Єдиний useReducer для всього UI-стану — Complex State
  const [ui, dispatchUi] = useReducer(uiReducer, UI_INITIAL_STATE);

  const { state, logs, chartHistory, addLog, toggleMonitoring, applySettings, clearLogs } = useSensorData();

  // DOM-виняток: Tailwind dark mode потребує класу 'dark' на <html>
  // (єдиний необхідний прямий доступ до DOM у всьому проекті)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', ui.theme === 'dark');
    localStorage.setItem('srm-theme', ui.theme);
  }, [ui.theme]);

  const handleNavigate = (section) => {
    if (section !== ui.activeSection) {
      addLog('INFO', `Navigation: ${SECTION_LABELS[ui.activeSection] ?? ui.activeSection} → ${SECTION_LABELS[section] ?? section}`);
    }
    dispatchUi({ type: 'NAVIGATE', payload: section });
  };

  const renderPage = () => {
    switch (ui.activeSection) {
      case 'servers':
        return <ServersPage state={state} addLog={addLog} />;
      case 'analytics':
        return <AnalyticsPage chartHistory={chartHistory} addLog={addLog} />;
      case 'alerts':
        return <AlertsPage addLog={addLog} />;
      case 'network':
        return <NetworkPage state={state} addLog={addLog} />;
      case 'cpu':
        return <CpuDetailsPage state={state} addLog={addLog} />;
      case 'settings':
        return <SettingsPage state={state} onSave={applySettings} addLog={addLog} />;
      default:
        return (
          <DashboardPage
            state={state}
            logs={logs}
            chartHistory={chartHistory}
            clearLogs={clearLogs}
            onNavigate={handleNavigate}
            addLog={addLog}
          />
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-surface-base text-gray-900 dark:text-white transition-colors duration-300">

      <Sidebar
        isOpen={ui.sidebarOpen}
        onClose={() => dispatchUi({ type: 'CLOSE_SIDEBAR' })}
        theme={ui.theme}
        onThemeChange={(t) => dispatchUi({ type: 'SET_THEME', payload: t })}
        activeSection={ui.activeSection}
        onNavigate={handleNavigate}
      />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto min-w-0">
        <Header
          systemName={state.systemName}
          isMonitoring={state.isMonitoring}
          serverOnline={state.serverOnline}
          onToggleMonitoring={toggleMonitoring}
          onOpenSettings={() => dispatchUi({ type: 'OPEN_SETTINGS' })}
          onToggleSidebar={() => dispatchUi({ type: 'TOGGLE_SIDEBAR' })}
        />

        {renderPage()}
      </main>

      <SettingsModal
        isOpen={ui.settingsOpen}
        onClose={() => dispatchUi({ type: 'CLOSE_SETTINGS' })}
        currentSettings={state}
        onSave={(s) => { applySettings(s); dispatchUi({ type: 'CLOSE_SETTINGS' }); }}
      />
    </div>
  );
}
