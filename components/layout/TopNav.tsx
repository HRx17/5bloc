'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Logo } from '../brand/LogoMark'
import { Search, Bell, Sun, Moon, X, Menu, MessageSquare } from 'lucide-react'
import { useMessages } from '@/components/messages/MessagesProvider'
import { relativeTime, initialsOf } from '@/lib/data/messages'

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
  const [notifOpen, setNotifOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { unreadCount, notifications, markNotificationsSeen } = useMessages()

  const openNotifs = () => {
    setNotifOpen((v) => {
      const next = !v
      if (next) markNotificationsSeen()
      return next
    })
  }

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
        <div className="relative">
          <button
            onClick={openNotifs}
            aria-label="Notifications"
            className="h-8 w-8 flex items-center justify-center rounded-xl relative transition-all"
            style={{ color: notifOpen ? 'var(--on-surface)' : 'var(--stone)', background: notifOpen ? 'var(--overlay-hover)' : 'transparent' }}
            onMouseEnter={(e) => {
              const t = e.currentTarget as HTMLElement
              t.style.color = 'var(--on-surface)'
              t.style.background = 'var(--overlay-hover)'
            }}
            onMouseLeave={(e) => {
              const t = e.currentTarget as HTMLElement
              if (notifOpen) return
              t.style.color = 'var(--stone)'
              t.style.background = 'transparent'
            }}
          >
            <Bell className="h-3.5 w-3.5" />
            {unreadCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-1 flex items-center justify-center rounded-full font-mono text-[9px] font-bold"
                style={{ background: 'var(--error)', color: '#fff' }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <div
                className="absolute right-0 mt-2 w-[320px] rounded-2xl overflow-hidden z-50"
                style={{
                  background: 'var(--surface-container-high)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.45), inset 0 0 0 1px var(--hairline)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                <div className="flex items-center justify-between px-4 py-3" style={{ boxShadow: '0 1px 0 var(--hairline)' }}>
                  <span className="text-[13px] font-semibold" style={{ color: 'var(--on-surface)' }}>Messages</span>
                  {unreadCount > 0 && (
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(245,166,35,0.14)', color: 'var(--amber)' }}>
                      {unreadCount} unread
                    </span>
                  )}
                </div>

                <div className="max-h-[320px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <MessageSquare className="h-6 w-6 mx-auto mb-2" style={{ color: 'var(--stone)', opacity: 0.5 }} />
                      <p className="text-[12px]" style={{ color: 'var(--stone)' }}>No new messages</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => {
                          setNotifOpen(false)
                          router.push(`/messages?c=${n.conversationId}`)
                        }}
                        className="flex items-start gap-3 w-full px-4 py-3 text-left transition-colors"
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--overlay-hover)')}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                      >
                        <div
                          className="w-8 h-8 flex items-center justify-center text-[10px] font-bold rounded-full shrink-0"
                          style={{ background: 'rgba(245,166,35,0.14)', color: 'var(--amber)' }}
                        >
                          {initialsOf(n.senderName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[12.5px] font-semibold truncate" style={{ color: 'var(--on-surface)' }}>{n.senderName}</span>
                            <span className="text-[10px] shrink-0" style={{ color: 'var(--stone)' }}>{relativeTime(n.at)}</span>
                          </div>
                          <p className="text-[12px] truncate" style={{ color: 'var(--on-surface-variant)' }}>{n.body}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                <Link
                  href="/messages"
                  onClick={() => setNotifOpen(false)}
                  className="block px-4 py-3 text-center text-[12px] font-semibold transition-colors"
                  style={{ color: 'var(--amber)', boxShadow: '0 -1px 0 var(--hairline)' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--overlay-hover)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                >
                  Open Messages
                </Link>
              </div>
            </>
          )}
        </div>

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
