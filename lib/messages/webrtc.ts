export const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
]

export function shouldInitiateOffer(localId: string, remoteId: string): boolean {
  return localId.localeCompare(remoteId) < 0
}

export async function getLocalAudioStream(): Promise<MediaStream> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    throw new Error('Microphone is not available in this browser')
  }
  return navigator.mediaDevices.getUserMedia({ audio: true, video: false })
}

export function createPeerConnection(onIce: (candidate: RTCIceCandidateInit) => void): RTCPeerConnection {
  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
  pc.onicecandidate = (event) => {
    if (event.candidate) onIce(event.candidate.toJSON())
  }
  return pc
}

export function attachLocalTracks(pc: RTCPeerConnection, stream: MediaStream): void {
  for (const track of stream.getTracks()) {
    pc.addTrack(track, stream)
  }
}
