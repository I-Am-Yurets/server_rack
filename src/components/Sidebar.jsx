/**
 * Sidebar.jsx — Лабораторна робота №4
 * Компонент бічної навігаційної панелі.
 * Props: isOpen, onClose, theme, onThemeChange
 */

export default function Sidebar({ isOpen, onClose, theme, onThemeChange, activeSection, onNavigate }) {
  const navItems = [
    { id: 'dashboard',  icon: 'fa-gauge-high',     label: 'Дашборд' },
    { id: 'servers',    icon: 'fa-server',          label: 'Сервери' },
    { id: 'analytics',  icon: 'fa-chart-line',      label: 'Аналітика' },
    { id: 'alerts',     icon: 'fa-bell',            label: 'Сповіщення', badge: 7 },
    { id: 'network',    icon: 'fa-network-wired',   label: 'Мережа' },
    { id: 'cpu',        icon: 'fa-microchip',       label: 'CPU Деталі' },
    { id: 'settings',   icon: 'fa-gear',            label: 'Налаштування' },
  ];

  return (
    <>
      {/* Мобільний оверлей */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`fixed lg:static top-0 left-0 h-full w-64 bg-white dark:bg-ch-700
        border-r border-gray-200 dark:border-ch-600 flex flex-col gap-6 p-6
        z-30 transition-transform duration-300 shadow-lg lg:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Логотип / Заголовок */}
        <div className="flex items-center gap-4 px-2">
          <div className="w-10 h-10 bg-brand-primary rounded-lg flex items-center justify-center font-bold text-ch-800 text-sm flex-shrink-0">
            SR
          </div>
          <div>
            <div className="font-bold text-gray-900 dark:text-white">ServerRack</div>
            <div className="text-xs text-gray-500 dark:text-ch-400">Monitor v4.0 React</div>
          </div>
        </div>

        {/* Навігація */}
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { onNavigate(item.id); onClose(); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm w-full text-left transition-all ${
                activeSection === item.id
                  ? 'bg-brand-primary text-ch-800 font-semibold'
                  : 'text-gray-600 dark:text-ch-400 hover:bg-gray-100 dark:hover:bg-ch-600 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <i className={`fa-solid ${item.icon} w-5 text-center`}></i>
              {item.label}
              {item.badge && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Перемикач теми */}
        <div className="bg-gray-100 dark:bg-ch-600 rounded-xl p-4 flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-ch-400 font-medium">🎨 Тема</span>
          <div className="flex bg-gray-200 dark:bg-ch-500 rounded-full p-1 gap-1">
            {['dark', 'light'].map(t => (
              <button
                key={t}
                onClick={() => onThemeChange(t)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  theme === t ? 'bg-brand-primary text-ch-800' : 'text-gray-500 dark:text-ch-400'
                }`}
              >
                {t === 'dark' ? '🌙' : '☀️'}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
