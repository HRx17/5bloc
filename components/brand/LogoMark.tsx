import React from 'react'

export function LogoMark({ size = 40 }: { size?: number }) {
 const a = '#F5A623'
 return (
 <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className="shrink-0">
 {/* Grid dots */}
 {[10, 20, 30].flatMap(x => [10, 20, 30].map(y => (
 <circle key={`${x}-${y}`} cx={x} cy={y} r="1" fill={a} opacity="0.18" />
 )))}
 {/* Four stacked bars — decreasing width = tapering tower */}
 <rect x="6" y="6" width="28" height="6" rx="1.5" fill={a}/>
 <rect x="6" y="15" width="22" height="6" rx="1.5" fill={a} opacity="0.75"/>
 <rect x="6" y="24" width="16" height="6" rx="1.5" fill={a} opacity="0.5"/>
 <rect x="6" y="33" width="10" height="5" rx="1.5" fill={a} opacity="0.28"/>
 </svg>
 )
}

export function Logo({ size = 40, showTagline = false }: { size?: number; showTagline?: boolean }) {
 return (
 <div style={{ display: 'inline-flex', alignItems: 'center', gap: Math.round(size * 0.25) }}>
 <LogoMark size={size}/>
 <div style={{ lineHeight: 1 }}>
 <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: size * 0.55, letterSpacing: '0.04em', color: '#F7F5F0' }}>
 5BLOC
 </div>
 {showTagline && size >= 36 && (
 <div style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: size * 0.215, letterSpacing: '0.18em', color: '#F5A623', textTransform: 'uppercase', marginTop: 2 }}>
 Build Together
 </div>
 )}
 </div>
 </div>
 )
}
