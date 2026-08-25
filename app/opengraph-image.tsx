import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = '5Bloc — AEC project coordination for architect-led teams'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#0C1220',
          padding: '72px 80px',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ width: 72, height: 14, background: '#F5A623', borderRadius: 4 }} />
            <div style={{ width: 56, height: 14, background: '#F5A623', opacity: 0.7, borderRadius: 4 }} />
            <div style={{ width: 40, height: 14, background: '#F5A623', opacity: 0.4, borderRadius: 4 }} />
          </div>
          <div style={{ fontSize: 72, fontWeight: 700, color: '#F7F5F0', letterSpacing: '-0.04em' }}>5BLOC</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 36, fontWeight: 600, color: '#F7F5F0', lineHeight: 1.2, maxWidth: 900 }}>
            AEC project coordination for architect-led teams
          </div>
          <div style={{ fontSize: 22, color: '#9E9687' }}>
            Drawings, RFIs, client approvals — one workspace, no app to install.
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
