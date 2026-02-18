'use client'

import React, { useState } from 'react'

/* ---------- Sidebar ---------- */
interface SidebarProps {
  children: React.ReactNode
  className?: string
  defaultCollapsed?: boolean
}

export function Sidebar({ children, className = '', defaultCollapsed = false }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)

  return (
    <aside
      className={`flex flex-col border-r border-gray-200 bg-white transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-64'
      } ${className}`}
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="p-3 text-gray-500 hover:text-gray-700 self-end"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? '→' : '←'}
      </button>
      <nav className="flex-1 overflow-y-auto px-2 py-2">{children}</nav>
    </aside>
  )
}

/* ---------- SidebarSection ---------- */
interface SidebarSectionProps {
  title?: string
  children: React.ReactNode
}

export function SidebarSection({ title, children }: SidebarSectionProps) {
  return (
    <div className="mb-4">
      {title && (
        <h3 className="px-3 mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
          {title}
        </h3>
      )}
      <ul className="space-y-0.5">{children}</ul>
    </div>
  )
}

/* ---------- SidebarItem ---------- */
interface SidebarItemProps {
  href?: string
  icon?: React.ReactNode
  active?: boolean
  children: React.ReactNode
  onClick?: () => void
}

export function SidebarItem({ href, icon, active = false, children, onClick }: SidebarItemProps) {
  const classes = `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    active
      ? 'bg-blue-50 text-blue-700'
      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
  }`

  if (href) {
    return (
      <li>
        <a href={href} className={classes}>
          {icon && <span className="shrink-0 w-5 h-5">{icon}</span>}
          <span className="truncate">{children}</span>
        </a>
      </li>
    )
  }

  return (
    <li>
      <button onClick={onClick} className={`${classes} w-full text-left`}>
        {icon && <span className="shrink-0 w-5 h-5">{icon}</span>}
        <span className="truncate">{children}</span>
      </button>
    </li>
  )
}
