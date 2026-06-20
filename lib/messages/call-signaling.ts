export type CallSignalType = 'invite' | 'accept' | 'decline' | 'leave' | 'offer' | 'answer' | 'ice' | 'join'

export interface CallSignal {
  type: CallSignalType
  callId: string
  conversationId: string
  from: string
  fromName?: string
  to?: string
  sdp?: RTCSessionDescriptionInit
  candidate?: RTCIceCandidateInit
}

export function inboxChannel(profileId: string): string {
  return `calls:${profileId}`
}

export function sessionChannel(callId: string): string {
  return `call-session:${callId}`
}
