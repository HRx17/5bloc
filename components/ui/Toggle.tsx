'use client'

interface ToggleProps {
  on: boolean
  onChange: (next: boolean) => void
  label?: string
  disabled?: boolean
  size?: 'sm' | 'md'
}

export function Toggle({ on, onChange, label, disabled, size = 'md' }: ToggleProps) {
  const trackW = size === 'sm' ? 'w-8'  : 'w-9'
  const trackH = size === 'sm' ? 'h-4'  : 'h-5'
  const thumbS = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'
  const thumbT = size === 'sm' ? (on ? 'translate-x-4' : 'translate-x-0.5') : (on ? 'translate-x-[18px]' : 'translate-x-0.5')

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!on)}
      className={`relative inline-flex items-center shrink-0 rounded-full cursor-pointer transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-amber-400 ${trackW} ${trackH} ${
        on
          ? 'bg-(--success)'
          : 'bg-(--surface-container-high)'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      style={{
        boxShadow: on ? 'none' : 'inset 0 0 0 1.5px rgba(255,255,255,0.10)',
      }}
    >
      <span
        className={`absolute rounded-full bg-white pointer-events-none transition-transform duration-200 shadow-sm ${thumbS} ${thumbT}`}
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
      />
    </button>
  )
}
