import React, { useState, useEffect } from 'react'
import Link from '@/compat/next-link'
import { Logo } from '../brand/LogoMark'

interface TopNavProps {
  userName?: string
  userRole?: string
  avatarUrl?: string
  onMenuToggle?: () => void
  rightSlot?: React.ReactNode
}

export default function TopNav({
  userName = 'User',
  userRole = 'architect',
  avatarUrl,
  onMenuToggle,
  rightSlot,
}: TopNavProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null
    const next = saved === 'dark' ? 'dark' : 'light'
    setTheme(next)
    document.documentElement.classList.toggle('dark', next === 'dark')
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('theme', next)
    document.documentElement.classList.toggle('dark', next === 'dark')
  }

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const roleLabel = userRole.charAt(0).toUpperCase() + userRole.slice(1)

  return (
    <header
      className="h-[56px] px-5 flex items-center justify-between z-30 w-full shrink-0 select-none"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        boxShadow: 'var(--shadow-2)',
      }}
    >
      <div className="flex items-center gap-3 flex-1">
        {onMenuToggle && (
          <button onClick={onMenuToggle} className="lg:hidden" style={{ color: 'var(--stone)' }}>
            <span className="material-icons-outlined text-[22px]">menu</span>
          </button>
        )}

        <div className="lg:hidden flex items-center">
          <Logo size={24} showTagline={false} />
        </div>

        <div className="hidden lg:flex items-center relative max-w-[280px] w-full">
          <span
            className="material-icons-outlined absolute left-2.5 text-[15px] pointer-events-none"
            style={{ color: 'var(--stone)' }}
          >
            search
          </span>
          <input
            type="text"
            placeholder="Search projects, contacts..."
            className="input-5bloc pl-9 text-[12.5px] py-2"
            style={{ background: 'var(--surface-container-low)' }}
          />
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          className="w-8 h-8 flex items-center justify-center"
          style={{ color: 'var(--stone)' }}
        >
          <span className="material-icons-outlined text-[18px]">
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
        </button>

        {rightSlot}

        <div
          className="h-5 mx-2"
          style={{ width: '1px', background: 'rgba(159,142,122,0.18)' }}
        />

        <Link href="/settings" className="flex items-center gap-2 group">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[11px] font-semibold leading-tight" style={{ color: 'var(--on-surface)' }}>
              {userName}
            </span>
            <span className="label-sm" style={{ color: 'var(--stone)' }}>
              {roleLabel}
            </span>
          </div>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={userName}
              className="w-7 h-7 object-cover rounded-full"
              style={{ boxShadow: 'var(--shadow-1)' }}
            />
          ) : (
            <div
              className="w-7 h-7 flex items-center justify-center text-[10px] font-bold rounded-full"
              style={{
                background: 'rgba(245,166,35,0.18)',
                color: 'var(--amber)',
                boxShadow: 'var(--shadow-amber)',
              }}
            >
              {initials}
            </div>
          )}
        </Link>
      </div>
    </header>
  )
}
