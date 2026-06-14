'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Logo } from '../brand/LogoMark'
import { Search, Bell, Sun, Moon, X, Menu } from 'lucide-react'

interface TopNavProps {
  userName?: string
  avatarUrl?: string
  onMenuToggle?: () => void
}

export default function TopNav({
  userName = 'Parth Patel',
  avatarUrl,
  onMenuToggle,
}: TopNavProps) {
  const [theme, setTheme]         = useState<'light' | 'dark'>('dark')
  const [searchFocused, setSearchFocused] = useState(false)
  const [searchQuery, setSearchQuery]     = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null
    if (saved) {
      setTheme(saved)
      document.documentElement.classList.toggle('light', saved === 'light')
    }
  }, [])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('theme', next)
    document.documentElement.classList.toggle('light', next === 'light')
  }

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <header
      className="h-[52px] px-4 lg:px-5 flex items-center justify-between z-30 w-full shrink-0"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        boxShadow: '0 1px 0 var(--hairline)',
      }}
    >
      {/* ── Left ── */}
      <div className="flex items-center gap-3 flex-1">
        {/* Mobile hamburger */}
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="lg:hidden h-8 w-8 flex items-center justify-center rounded-xl transition-colors"
            style={{ color: 'var(--stone)' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--on-surface)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--stone)')}
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}

        {/* Mobile logo */}
        <div className="lg:hidden">
          <Logo size={22} showTagline={false} />
        </div>

        {/* Desktop search */}
        <div className="hidden lg:flex items-center relative max-w-[260px] w-full">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none transition-colors"
            style={{ color: searchFocused ? 'var(--on-surface-variant)' : 'var(--stone)' }}
          />
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search…"
            className="input-5bloc pl-9 pr-8 h-[34px] text-[12.5px]"
            style={{ background: 'var(--surface-container-low)', borderRadius: '10px', padding: '0 8px 0 34px' }}
          />
          {searchQuery && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 flex items-center justify-center rounded-full transition-opacity hover:opacity-70"
              style={{ background: 'var(--stone)', color: 'var(--surface)' }}
              onClick={() => { setSearchQuery(''); searchRef.current?.focus() }}
            >
              <X className="h-2.5 w-2.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Right ── */}
      <div className="flex items-center gap-1">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          className="h-8 w-8 flex items-center justify-center rounded-xl transition-all"
          style={{ color: 'var(--stone)' }}
          onMouseEnter={(e) => {
            const t = e.currentTarget as HTMLElement
            t.style.color = 'var(--on-surface)'
            t.style.background = 'var(--overlay-hover)'
          }}
          onMouseLeave={(e) => {
            const t = e.currentTarget as HTMLElement
            t.style.color = 'var(--stone)'
            t.style.background = 'transparent'
          }}
        >
          {theme === 'dark'
            ? <Sun className="h-3.5 w-3.5" />
            : <Moon className="h-3.5 w-3.5" />
          }
        </button>

        {/* Notifications */}
        <button
          className="h-8 w-8 flex items-center justify-center rounded-xl relative transition-all"
          style={{ color: 'var(--stone)' }}
          onMouseEnter={(e) => {
            const t = e.currentTarget as HTMLElement
            t.style.color = 'var(--on-surface)'
            t.style.background = 'var(--overlay-hover)'
          }}
          onMouseLeave={(e) => {
            const t = e.currentTarget as HTMLElement
            t.style.color = 'var(--stone)'
            t.style.background = 'transparent'
          }}
        >
          <Bell className="h-3.5 w-3.5" />
          {/* Notification dot */}
          <span
            className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full pulse-dot"
            style={{ background: 'var(--error)' }}
          />
        </button>

        {/* Divider */}
        <div
          className="h-5 mx-1"
          style={{ width: '1px', background: 'var(--hairline-strong)' }}
          aria-hidden
        />

        {/* User avatar */}
        <Link
          href="/settings"
          className="flex items-center gap-2 px-2 py-1 rounded-xl transition-all"
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--overlay-hover)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
        >
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[12px] font-semibold leading-tight" style={{ color: 'var(--on-surface)' }}>
              {userName.split(' ')[0]}
            </span>
            <span className="font-mono text-[9.5px] uppercase tracking-wider" style={{ color: 'var(--stone)' }}>
              Architect
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
              className="w-7 h-7 flex items-center justify-center text-[10px] font-bold rounded-full shrink-0"
              style={{
                background: 'rgba(245,166,35,0.15)',
                color: 'var(--amber)',
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
