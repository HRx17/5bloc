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
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className="material-icons-outlined text-[15px] stat-card-icon"
          style={{ color }}
        >
          {icon}
        </span>
        <span className="text-[11px] font-medium" style={{ color: 'var(--stone)' }}>
          {label}
        </span>
        {props.variant === 'link' && (
          <span className="material-icons-outlined text-[13px] ml-auto opacity-40" style={{ color: 'var(--stone)' }}>
            arrow_forward
          </span>
        )}
      </div>
      <p className="font-display font-bold text-[22px] leading-none tabular-nums" style={{ color: 'var(--on-surface)' }}>
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
