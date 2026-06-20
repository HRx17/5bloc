'use client'

import { useEffect, useRef } from 'react'
import { useCall } from '@/components/messages/CallProvider'

function RemoteAudio({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLAudioElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.srcObject = stream
    void el.play().catch(() => {})
    return () => {
      el.srcObject = null
    }
  }, [stream])
  return <audio ref={ref} autoPlay playsInline className="hidden" />
}

export default function CallOverlay() {
  const {
    callState,
    participants,
    localMuted,
    incomingFrom,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
  } = useCall()

  if (callState === 'idle') return null

  const remoteParticipants = participants.filter((p) => p.name !== 'You' && p.stream)

  return (
    <>
      {remoteParticipants.map((p) => (
        <RemoteAudio key={p.profileId} stream={p.stream!} />
      ))}

      {callState === 'incoming' && incomingFrom && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ background: 'var(--scrim)', backdropFilter: 'blur(6px)' }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 text-center"
            style={{
              background: 'var(--surface-container)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.45), inset 0 0 0 1px var(--hairline)',
            }}
          >
            <div
              className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full"
              style={{ background: 'rgba(245,166,35,0.14)', color: 'var(--amber)' }}
            >
              <span className="material-icons-outlined text-[32px]">call</span>
            </div>
            <p className="text-[11px] font-mono uppercase tracking-wider mb-1" style={{ color: 'var(--stone)' }}>
              Incoming audio call
            </p>
            <p className="text-[18px] font-bold mb-6" style={{ color: 'var(--on-surface)' }}>
              {incomingFrom.name}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={declineCall}
                className="h-12 px-5 rounded-xl text-[13px] font-semibold"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
              >
                Decline
              </button>
              <button onClick={() => void acceptCall()} className="btn-primary h-12 px-5 text-[13px]">
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {(callState === 'outgoing' || callState === 'connecting' || callState === 'active') && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[55] w-[min(420px,calc(100vw-24px))] rounded-2xl px-4 py-3"
          style={{
            background: 'var(--surface-container)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.35), inset 0 0 0 1px var(--hairline)',
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 flex items-center justify-center rounded-full shrink-0"
              style={{ background: 'rgba(245,166,35,0.14)', color: 'var(--amber)' }}
            >
              <span className="material-icons-outlined text-[20px]">
                {callState === 'active' ? 'call' : 'ring_volume'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold truncate" style={{ color: 'var(--on-surface)' }}>
                {callState === 'outgoing'
                  ? 'Calling…'
                  : callState === 'connecting'
                    ? 'Connecting…'
                    : 'Live call'}
              </p>
              <p className="text-[11px] truncate" style={{ color: 'var(--stone)' }}>
                {participants.length <= 1
                  ? 'Waiting for others to join'
                  : `${participants.length} participant${participants.length === 1 ? '' : 's'}`}
                {participants.length > 1
                  ? ` · ${participants.filter((p) => p.name !== 'You').map((p) => p.name.split(' ')[0]).join(', ')}`
                  : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={toggleMute}
              className="h-10 w-10 flex items-center justify-center rounded-xl transition-colors"
              style={{
                background: localMuted ? 'rgba(239,68,68,0.15)' : 'var(--overlay-hover)',
                color: localMuted ? '#ef4444' : 'var(--on-surface-variant)',
              }}
              title={localMuted ? 'Unmute' : 'Mute'}
              aria-label={localMuted ? 'Unmute' : 'Mute'}
            >
              <span className="material-icons-outlined text-[18px]">
                {localMuted ? 'mic_off' : 'mic'}
              </span>
            </button>
            <button
              onClick={endCall}
              className="h-10 px-4 flex items-center gap-1.5 rounded-xl text-[12px] font-semibold"
              style={{ background: '#ef4444', color: '#fff' }}
            >
              <span className="material-icons-outlined text-[16px]">call_end</span>
              End
            </button>
          </div>
        </div>
      )}
    </>
  )
}
