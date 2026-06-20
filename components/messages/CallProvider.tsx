'use client'

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { supabaseClient } from '@/lib/supabase/client'
import { getMyProfile } from '@/lib/data/messages'
import { hasSupabaseEnv } from '@/lib/data/client-data'
import { useToast } from '@/components/ui/Toast'
import {
  attachLocalTracks,
  getLocalAudioStream,
  shouldInitiateOffer,
} from '@/lib/messages/webrtc'
import { createConfiguredPeerConnection, fetchIceServers } from '@/lib/messages/webrtc-client'
import {
  type CallSignal,
  inboxChannel,
  sessionChannel,
} from '@/lib/messages/call-signaling'

export type CallState = 'idle' | 'outgoing' | 'incoming' | 'connecting' | 'active'

export interface CallParticipant {
  profileId: string
  name: string
  stream?: MediaStream
}

interface MemberLike {
  id: string
  full_name: string | null
  email: string | null
}

interface CallContextValue {
  callState: CallState
  conversationId: string | null
  participants: CallParticipant[]
  localMuted: boolean
  incomingFrom: { profileId: string; name: string; conversationId: string; callId: string } | null
  startCall: (conversationId: string, members: MemberLike[], myId: string) => Promise<void>
  acceptCall: () => Promise<void>
  declineCall: () => void
  endCall: () => void
  toggleMute: () => void
}

const CallContext = createContext<CallContextValue>({
  callState: 'idle',
  conversationId: null,
  participants: [],
  localMuted: false,
  incomingFrom: null,
  startCall: async () => {},
  acceptCall: async () => {},
  declineCall: () => {},
  endCall: () => {},
  toggleMute: () => {},
})

export function useCall() {
  return useContext(CallContext)
}

function displayName(m: MemberLike): string {
  return m.full_name || m.email || 'User'
}

export function CallProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast()
  const [callState, setCallState] = useState<CallState>('idle')
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [participants, setParticipants] = useState<CallParticipant[]>([])
  const [localMuted, setLocalMuted] = useState(false)
  const [incomingFrom, setIncomingFrom] = useState<{
    profileId: string
    name: string
    conversationId: string
    callId: string
  } | null>(null)

  const myIdRef = useRef<string | null>(null)
  const callIdRef = useRef<string | null>(null)
  const conversationIdRef = useRef<string | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map())
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map())
  const inboxChannelRef = useRef<ReturnType<typeof supabaseClient.channel> | null>(null)
  const sessionChannelRef = useRef<ReturnType<typeof supabaseClient.channel> | null>(null)
  const joinedPeersRef = useRef<Set<string>>(new Set())
  const iceServersRef = useRef<RTCIceServer[]>([])

  const updateParticipantStream = useCallback((profileId: string, stream: MediaStream) => {
    remoteStreamsRef.current.set(profileId, stream)
    setParticipants((prev) =>
      prev.map((p) => (p.profileId === profileId ? { ...p, stream } : p)),
    )
  }, [])

  const removeParticipant = useCallback((profileId: string) => {
    joinedPeersRef.current.delete(profileId)
    remoteStreamsRef.current.delete(profileId)
    const pc = peersRef.current.get(profileId)
    if (pc) {
      pc.close()
      peersRef.current.delete(profileId)
    }
    setParticipants((prev) => prev.filter((p) => p.profileId !== profileId))
  }, [])

  const sendSessionSignal = useCallback((signal: CallSignal) => {
    sessionChannelRef.current?.send({ type: 'broadcast', event: 'signal', payload: signal })
  }, [])

  const connectToPeer = useCallback(
    async (peerId: string, peerName?: string) => {
      const myId = myIdRef.current
      const callId = callIdRef.current
      const convId = conversationIdRef.current
      if (!myId || !callId || !convId || peerId === myId) return
      if (peersRef.current.has(peerId)) return

      setParticipants((prev) => {
        if (prev.some((p) => p.profileId === peerId)) return prev
        return [...prev, { profileId: peerId, name: peerName || 'Participant', stream: remoteStreamsRef.current.get(peerId) }]
      })

      const pc = createConfiguredPeerConnection(iceServersRef.current, (candidate) => {
        sendSessionSignal({
          type: 'ice',
          callId,
          conversationId: convId,
          from: myId,
          to: peerId,
          candidate,
        })
      })

      pc.ontrack = (event) => {
        const stream = event.streams[0]
        if (stream) updateParticipantStream(peerId, stream)
      }

      peersRef.current.set(peerId, pc)

      const local = localStreamRef.current
      if (local) attachLocalTracks(pc, local)

      if (shouldInitiateOffer(myId, peerId)) {
        try {
          const offer = await pc.createOffer()
          await pc.setLocalDescription(offer)
          sendSessionSignal({
            type: 'offer',
            callId,
            conversationId: convId,
            from: myId,
            to: peerId,
            sdp: offer,
          })
        } catch {
          toast('Could not connect audio to participant', 'error')
        }
      }
    },
    [sendSessionSignal, toast, updateParticipantStream],
  )

  const handleSessionSignal = useCallback(
    async (signal: CallSignal) => {
      const myId = myIdRef.current
      if (!myId || signal.callId !== callIdRef.current) return
      if (signal.to && signal.to !== myId) return
      if (signal.from === myId) return

      const peerId = signal.from

      switch (signal.type) {
        case 'join':
        case 'accept':
          joinedPeersRef.current.add(peerId)
          setCallState((s) => (s === 'outgoing' || s === 'connecting' ? 'active' : s))
          await connectToPeer(peerId, signal.fromName)
          break
        case 'offer': {
          await connectToPeer(peerId, signal.fromName)
          const pc = peersRef.current.get(peerId)
          if (!pc || !signal.sdp) return
          await pc.setRemoteDescription(signal.sdp)
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          sendSessionSignal({
            type: 'answer',
            callId: signal.callId,
            conversationId: signal.conversationId,
            from: myId,
            to: peerId,
            sdp: answer,
          })
          setCallState('active')
          break
        }
        case 'answer': {
          const pc = peersRef.current.get(peerId)
          if (pc && signal.sdp) await pc.setRemoteDescription(signal.sdp)
          setCallState('active')
          break
        }
        case 'ice': {
          const pc = peersRef.current.get(peerId)
          if (pc && signal.candidate) {
            try {
              await pc.addIceCandidate(signal.candidate)
            } catch {
              /* ignore stale candidates */
            }
          }
          break
        }
        case 'leave':
          removeParticipant(peerId)
          break
        default:
          break
      }
    },
    [connectToPeer, removeParticipant, sendSessionSignal],
  )

  const cleanupCall = useCallback(() => {
    const myId = myIdRef.current
    const callId = callIdRef.current
    const convId = conversationIdRef.current

    if (callId && convId && myId && sessionChannelRef.current) {
      sessionChannelRef.current.send({
        type: 'broadcast',
        event: 'signal',
        payload: {
          type: 'leave',
          callId,
          conversationId: convId,
          from: myId,
        } satisfies CallSignal,
      })
    }

    for (const pc of peersRef.current.values()) pc.close()
    peersRef.current.clear()
    joinedPeersRef.current.clear()
    remoteStreamsRef.current.clear()

    if (localStreamRef.current) {
      for (const track of localStreamRef.current.getTracks()) track.stop()
      localStreamRef.current = null
    }

    if (sessionChannelRef.current) {
      supabaseClient.removeChannel(sessionChannelRef.current)
      sessionChannelRef.current = null
    }

    callIdRef.current = null
    conversationIdRef.current = null
    setConversationId(null)
    setParticipants([])
    setIncomingFrom(null)
    setLocalMuted(false)
    setCallState('idle')
  }, [])

  const joinSession = useCallback(
    async (callId: string, convId: string) => {
      if (sessionChannelRef.current) {
        supabaseClient.removeChannel(sessionChannelRef.current)
      }

      try {
        const { data: { session } } = await supabaseClient.auth.getSession()
        if (session?.access_token) supabaseClient.realtime.setAuth(session.access_token)
      } catch {
        /* ignore */
      }

      const channel = supabaseClient
        .channel(sessionChannel(callId), { config: { broadcast: { self: false } } })
        .on('broadcast', { event: 'signal' }, ({ payload }) => {
          void handleSessionSignal(payload as CallSignal)
        })
        .subscribe()

      sessionChannelRef.current = channel
      callIdRef.current = callId
      conversationIdRef.current = convId
      setConversationId(convId)
    },
    [handleSessionSignal],
  )

  const endCall = useCallback(() => {
    cleanupCall()
  }, [cleanupCall])

  const startCall = useCallback(
    async (convId: string, members: MemberLike[], myId: string) => {
      if (callState !== 'idle') {
        toast('Already in a call', 'info')
        return
      }

      const others = members.filter((m) => m.id !== myId)
      if (others.length === 0) {
        toast('Add someone to start a call', 'info')
        return
      }

      try {
        const stream = await getLocalAudioStream()
        localStreamRef.current = stream
      } catch {
        toast('Microphone access is required for calls', 'error')
        return
      }

      iceServersRef.current = await fetchIceServers()

      const callId = crypto.randomUUID()
      myIdRef.current = myId
      setCallState('outgoing')
      setParticipants([{ profileId: myId, name: 'You' }])

      await joinSession(callId, convId)

      const myName = members.find((m) => m.id === myId)
      const invite: CallSignal = {
        type: 'invite',
        callId,
        conversationId: convId,
        from: myId,
        fromName: myName ? displayName(myName) : 'Someone',
      }

      await Promise.all(
        others.map(
          (member) =>
            new Promise<void>((resolve) => {
              const ch = supabaseClient.channel(inboxChannel(member.id))
              ch.subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                  ch.send({
                    type: 'broadcast',
                    event: 'signal',
                    payload: { ...invite, to: member.id },
                  })
                  setTimeout(() => {
                    supabaseClient.removeChannel(ch)
                    resolve()
                  }, 400)
                }
              })
            }),
        ),
      )

      sendSessionSignal({ ...invite, type: 'join', fromName: invite.fromName })
      toast(others.length === 1 ? 'Calling…' : 'Starting group call…', 'info')

      setTimeout(() => {
        if (callIdRef.current === callId && joinedPeersRef.current.size === 0) {
          toast('No one answered', 'info')
          cleanupCall()
        }
      }, 45000)
    },
    [callState, cleanupCall, joinSession, sendSessionSignal, toast],
  )

  const acceptCall = useCallback(async () => {
    const incoming = incomingFrom
    if (!incoming || !myIdRef.current) return

    try {
      const stream = await getLocalAudioStream()
      localStreamRef.current = stream
    } catch {
      toast('Microphone access is required for calls', 'error')
      return
    }

    setIncomingFrom(null)
    setCallState('connecting')
    setParticipants([{ profileId: myIdRef.current, name: 'You' }])

    await joinSession(incoming.callId, incoming.conversationId)

    sendSessionSignal({
      type: 'join',
      callId: incoming.callId,
      conversationId: incoming.conversationId,
      from: myIdRef.current,
    })
    sendSessionSignal({
      type: 'accept',
      callId: incoming.callId,
      conversationId: incoming.conversationId,
      from: myIdRef.current,
    })

    await connectToPeer(incoming.profileId, incoming.name)
    setCallState('active')
  }, [incomingFrom, joinSession, sendSessionSignal, connectToPeer, toast])

  const declineCall = useCallback(() => {
    const incoming = incomingFrom
    const myId = myIdRef.current
    if (incoming && myId) {
      const ch = supabaseClient.channel(inboxChannel(incoming.profileId))
      ch.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          ch.send({
            type: 'broadcast',
            event: 'signal',
            payload: {
              type: 'decline',
              callId: incoming.callId,
              conversationId: incoming.conversationId,
              from: myId,
              to: incoming.profileId,
            } satisfies CallSignal,
          })
          setTimeout(() => supabaseClient.removeChannel(ch), 400)
        }
      })
    }
    setIncomingFrom(null)
    setCallState('idle')
  }, [incomingFrom])

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current
    if (!stream) return
    const next = !localMuted
    for (const track of stream.getAudioTracks()) track.enabled = !next
    setLocalMuted(next)
  }, [localMuted])

  useEffect(() => {
    if (!hasSupabaseEnv()) return
    let cancelled = false

    ;(async () => {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession()
        if (session?.access_token) supabaseClient.realtime.setAuth(session.access_token)
      } catch {
        /* ignore */
      }

      iceServersRef.current = await fetchIceServers()

      const me = await getMyProfile()
      if (cancelled || !me) return
      myIdRef.current = me.id

      const inbox = supabaseClient
        .channel(inboxChannel(me.id), { config: { broadcast: { self: false } } })
        .on('broadcast', { event: 'signal' }, ({ payload }) => {
          const signal = payload as CallSignal
          if (signal.to && signal.to !== me.id) return

          if (signal.type === 'invite') {
            if (callIdRef.current) return
            setIncomingFrom({
              profileId: signal.from,
              name: signal.fromName || 'Someone',
              conversationId: signal.conversationId,
              callId: signal.callId,
            })
            setCallState('incoming')
          } else if (signal.type === 'decline') {
            if (callIdRef.current === signal.callId) {
              toast('Call declined', 'info')
              cleanupCall()
            }
          }
        })
        .subscribe()

      inboxChannelRef.current = inbox
    })()

    return () => {
      cancelled = true
      cleanupCall()
      if (inboxChannelRef.current) {
        supabaseClient.removeChannel(inboxChannelRef.current)
        inboxChannelRef.current = null
      }
    }
  }, [cleanupCall, toast])

  useEffect(() => {
    for (const p of participants) {
      if (p.stream && p.profileId !== myIdRef.current) {
        /* streams attached via hidden audio elements in CallOverlay */
      }
    }
  }, [participants])

  return (
    <CallContext.Provider
      value={{
        callState,
        conversationId,
        participants,
        localMuted,
        incomingFrom,
        startCall,
        acceptCall,
        declineCall,
        endCall,
        toggleMute,
      }}
    >
      {children}
    </CallContext.Provider>
  )
}
