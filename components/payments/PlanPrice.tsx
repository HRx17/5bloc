'use client'

import { isTestPeriod } from '@/lib/payments/gates'

export function PlanPrice({ price, size = 'lg' }: { price: string; size?: 'lg' | 'sm' }) {
  const test = isTestPeriod()
  if (!test || price === '₹0' || price === '$0') {
    return size === 'lg' ? (
      <h2 className="text-2xl font-bold text-white mt-2">{price}</h2>
    ) : (
      <span>{price}</span>
    )
  }
  if (size === 'sm') {
    return (
      <span>
        <span className="line-through opacity-50">{price}</span>
        {' '}
        <span className="font-semibold" style={{ color: 'var(--amber)' }}>
          Free for test period
        </span>
      </span>
    )
  }
  return (
    <div className="mt-2">
      <h2 className="text-2xl font-bold text-white">
        <span className="line-through opacity-50">{price}</span>
      </h2>
      <p className="text-[11px] font-semibold mt-1" style={{ color: 'var(--amber)' }}>
        Free for test period
      </p>
    </div>
  )
}
