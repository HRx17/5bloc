import { ICE_SERVERS as DEFAULT_ICE_SERVERS } from '@/lib/messages/webrtc'

let cachedIceServers: RTCIceServer[] | null = null
let cacheExpiry = 0

export async function fetchIceServers(): Promise<RTCIceServer[]> {
  if (typeof window === 'undefined') return DEFAULT_ICE_SERVERS

  const now = Date.now()
  if (cachedIceServers && cacheExpiry > now) return cachedIceServers

  try {
    const res = await fetch('/api/messages/calls/ice')
    if (res.ok) {
      const json = await res.json()
      if (Array.isArray(json.iceServers) && json.iceServers.length > 0) {
        cachedIceServers = json.iceServers as RTCIceServer[]
        cacheExpiry = now + 5 * 60 * 1000
        return cachedIceServers
      }
    }
  } catch {
    /* use defaults */
  }

  return DEFAULT_ICE_SERVERS
}

export function createConfiguredPeerConnection(
  iceServers: RTCIceServer[],
  onIce: (candidate: RTCIceCandidateInit) => void,
): RTCPeerConnection {
  const pc = new RTCPeerConnection({ iceServers })
  pc.onicecandidate = (event) => {
    if (event.candidate) onIce(event.candidate.toJSON())
  }
  return pc
}
