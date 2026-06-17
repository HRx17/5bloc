'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface StatCardBase {
  label: string
  value: string | number
  icon: string
  color: string
  active?: boolean
}

type StatCardProps = StatCardBase & (
  | { variant: 'display' }
  | { variant: 'link'; href: string }
  | { variant: 'filter'; onClick: () => void }
)

/** Overview stat — flat display, link, or filter button */
export function StatCard(props: StatCardProps) {
  const { label, value, icon, color, active } = props

  const inner = (
    <div
      className={[
        'stat-card',
        props.variant === 'display' ? 'stat-card-display' : 'stat-card-interactive',
        props.variant === 'link' ? 'stat-card-link' : '',
        active ? 'stat-card-active' : '',
      ].filter(Boolean).join(' ')}
      style={{ '--stat-accent': color } as React.CSSProperties}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className="material-icons-outlined text-[14px] stat-card-icon"
          style={{ color }}
        >
          {icon}
        </span>
        <span className="text-[10px] font-normal uppercase tracking-wide" style={{ color: 'var(--stone)', letterSpacing: '0.04em' }}>
          {label}
        </span>
        {props.variant === 'link' && (
          <span className="material-icons-outlined text-[11px] ml-auto opacity-30" style={{ color: 'var(--stone)' }}>
            arrow_forward
          </span>
        )}
      </div>
      <p className="font-display leading-none tabular-nums" style={{ color: 'var(--on-surface)', fontSize: '1.375rem', fontWeight: 500 }}>
        {value}
      </p>
    </div>
  )

  if (props.variant === 'link') {
    return (
      <Link href={props.href} className="block">
        <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
          {inner}
        </motion.div>
      </Link>
    )
  }

  if (props.variant === 'filter') {
    return (
      <motion.button
        type="button"
        onClick={props.onClick}
        whileHover={{ y: -1 }}
        transition={{ duration: 0.15 }}
        className="w-full text-left"
      >
        {inner}
      </motion.button>
    )
  }

  return inner
}
