/**
 * ============================================================
 * APEX AI — Sidebar Navigation
 * /src/layouts/Sidebar.jsx
 * ============================================================
 */

import { useLocation, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import Icon from '@components/ui/Icon'
import StatusDot from '@components/ui/StatusDot'
import { useAppStore, selectors } from '@core/storage'
import { NAV_ITEMS, NAV_GROUPS } from '@config/routes'
import APP_CONFIG from '@config/app'

// ─── Logo ─────────────────────────────────────────────────────
function ApexLogo({ collapsed }) {
  return (
    <div className={clsx(
      'flex items-center gap-3 px-4 py-4 border-b border-slate-800/60',
      collapsed && 'justify-center px-0'
    )}>
      {/* Hex icon */}
      <div className="relative flex-shrink-0">
        <div className="w-8 h-8 bg-cyan-500/10 border border-cyan-500/30 rounded flex items-center justify-center">
          <span className="font-display font-bold text-cyan-400 text-xs tracking-wider">4P</span>
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
      </div>
      {!collapsed && (
        <div className="min-w-0">
          <div className="font-display font-bold text-white text-sm leading-tight truncate">
            Apex AI
          </div>
          <div className="text-slate-500 text-2xs tracking-widest uppercase truncate">
            Fleet Control OS
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Nav Group Label ──────────────────────────────────────────
function NavGroupLabel({ label, collapsed }) {
  if (collapsed || !label) return null
  return (
    <div className="px-3 pt-4 pb-1">
      <span className="text-2xs font-semibold tracking-widest uppercase text-slate-600">
        {label}
      </span>
    </div>
  )
}

// ─── Nav Item ─────────────────────────────────────────────────
function NavItem({ item, active, collapsed, onClick }) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={clsx(
        'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 cursor-pointer group relative',
        collapsed ? 'justify-center px-0 mx-0' : '',
        active
          ? 'text-white bg-slate-800/80'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
      )}
    >
      {/* Active indicator */}
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-cyan-400 rounded-r shadow-[0_0_8px_rgba(0,212,255,0.8)]" />
      )}

      {/* Icon */}
      <Icon
        name={item.icon}
        size={16}
        className={clsx(
          'flex-shrink-0 transition-colors',
          active ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
        )}
      />

      {/* Label */}
      {!collapsed && (
        <span className="truncate">{item.label}</span>
      )}

      {/* Highlight dot */}
      {item.highlight && !collapsed && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(0,212,255,0.8)] flex-shrink-0" />
      )}

      {/* Badge */}
      {item.badge && !collapsed && (
        <span className="ml-auto bg-red-500 text-white text-2xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
          {item.badge}
        </span>
      )}
    </button>
  )
}

// ─── Sidebar Footer ───────────────────────────────────────────
function SidebarFooter({ collapsed }) {
  return (
    <div className={clsx(
      'px-3 py-3 border-t border-slate-800/60',
      collapsed && 'flex flex-col items-center gap-2'
    )}>
      {!collapsed ? (
        <div className="flex items-center gap-2">
          <StatusDot status="online" />
          <span className="text-xs text-slate-500">Systems Nominal</span>
          <span className="ml-auto text-2xs text-slate-700 font-mono">v1.0.0</span>
        </div>
      ) : (
        <StatusDot status="online" />
      )}
    </div>
  )
}

// ─── Sidebar Root ─────────────────────────────────────────────
export default function Sidebar() {
  const location  = useLocation()
  const navigate  = useNavigate()
  const collapsed = useAppStore(s => !s.sidebarExpanded)

  // Group nav items by group
  const groupOrder = Object.entries(NAV_GROUPS)
    .sort(([,a],[,b]) => a.order - b.order)
    .map(([key]) => key)

  const grouped = groupOrder.reduce((acc, group) => {
    const items = NAV_ITEMS.filter(i => i.group === group)
    if (items.length) acc[group] = items
    return acc
  }, {})

  return (
    <aside
      className={clsx(
        'flex flex-col h-full bg-[#090e1c] border-r border-slate-800/60',
        'transition-all duration-300 ease-in-out flex-shrink-0',
        collapsed ? 'w-14' : 'w-64'
      )}
    >
      {/* Logo */}
      <ApexLogo collapsed={collapsed} />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none px-2 py-2">
        {groupOrder.map(group => {
          const items = grouped[group]
          if (!items) return null
          return (
            <div key={group}>
              <NavGroupLabel
                label={NAV_GROUPS[group].label}
                collapsed={collapsed}
              />
              <div className="space-y-0.5">
                {items.map(item => (
                  <NavItem
                    key={item.id}
                    item={item}
                    active={location.pathname === item.route || location.pathname.startsWith(item.route + '/')}
                    collapsed={collapsed}
                    onClick={() => navigate(item.route)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <SidebarFooter collapsed={collapsed} />
    </aside>
  )
}
