'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'

interface Message {
  id: string
  sender: string
  role: string
  text: string
  timestamp: string
  channel: string
  attachment?: { name: string; type: string }
}

export default function ProjectMessages() {
  const params = useParams()
  const projectId = params.id as string
  const chatEndRef = useRef<HTMLDivElement>(null)

  const [channels, setChannels] = useState<string[]>(['general', 'structural', 'mep', 'interior-finishes'])
  const [activeChannel, setActiveChannel] = useState('general')
  const [messages, setMessages] = useState<Message[]>([])
  const [textInput, setTextInput] = useState('')
  const [userName] = useState('Parth Patel')
  const [userRole] = useState('Architect')

  useEffect(() => {
    // Mock load message database seeds
    setMessages([
      { id: '1', sender: 'Amit Sharma', role: 'Contractor', text: 'Has the local site plan v3 been stamped by structural engineer yet? We need to lay out the column rebars today.', timestamp: '09:12 AM', channel: 'general' },
      { id: '2', sender: 'Aritro Roy', role: 'Structural', text: 'Yes, column rebar spacing is signed off. Refer to sheet S-201 revision 2 in Document Vault.', timestamp: '09:20 AM', channel: 'general', attachment: { name: 'site_layout_v3.dwg', type: 'dwg' } },
      { id: '3', sender: 'Parth Patel', role: 'Architect', text: 'Make sure the concrete grade complies with the M30 spec. The builder will inspect the cube tests on Friday.', timestamp: '10:05 AM', channel: 'general' },
      { id: '4', sender: 'Aritro Roy', role: 'Structural', text: 'I updated the beam calculation loads for the lobby cantilever span. Spacing reduced to 150mm c/c.', timestamp: 'Yesterday', channel: 'structural' },
      { id: '5', sender: 'Rohan Deshmukh', role: 'MEP Consultant', text: 'Lobby AC duct needs 400mm clear space. Cantilever beam depth forces duct below 2.4m ceiling level. Review RFI #2.', timestamp: 'Yesterday', channel: 'mep' }
    ])
  }, [projectId])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeChannel])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!textInput.trim()) return

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      sender: userName,
      role: userRole,
      text: textInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      channel: activeChannel
    }

    setMessages(prev => [...prev, newMessage])
    setTextInput('')
  }

  const filtered = messages.filter(m => m.channel === activeChannel)

  return (
    <div className="card-5bloc flex flex-col lg:flex-row gap-0 h-[600px] p-0 overflow-hidden font-body select-none">
      {/* Channels list sidebar */}
      <div className="w-full lg:w-56 shrink-0 bg-navy border-r border-navy-lt/60 flex flex-col">
        <div className="px-5 py-4 border-b border-navy-lt/50 flex items-center justify-between">
          <span className="text-xs font-bold font-mono text-amber uppercase tracking-wider">CHANNELS</span>
          <span className="material-icons-outlined text-[16px] text-stone">chat</span>
        </div>
        <nav className="flex-grow overflow-y-auto p-2 space-y-0.5">
          {channels.map(ch => {
            const active = activeChannel === ch
            const lastMsg = messages.filter(m => m.channel === ch).pop()
            return (
              <button
                key={ch}
                onClick={() => setActiveChannel(ch)}
                className={`w-full text-left px-3 py-2.5 text-xs font-semibold rounded-md transition ${
                  active ? 'bg-amber text-navy font-bold' : 'text-stone hover:text-white hover:bg-navy-lt/50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-mono">#</span>
                  <span className="capitalize">{ch.replace('-', ' ')}</span>
                </div>
                {lastMsg && (
                  <p className={`text-[10px] truncate mt-0.5 font-normal ${active ? 'text-navy/70' : 'text-stone/75'}`}>
                    {lastMsg.sender}: {lastMsg.text}
                  </p>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Main chat viewport */}
      <div className="flex-1 flex flex-col justify-between bg-navy-mid/10">
        {/* Chat window header */}
        <div className="px-6 py-4 bg-navy border-b border-navy-lt/50 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-sm font-semibold text-white capitalize flex items-center gap-1">
              <span className="font-mono text-stone">#</span> {activeChannel.replace('-', ' ')}
            </h3>
            <p className="text-[10px] text-stone mt-0.5">Formal cross-discipline project coordination record.</p>
          </div>
        </div>

        {/* Chat Feed */}
        <div className="flex-grow overflow-y-auto p-6 space-y-4">
          {filtered.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-stone text-xs">
              <span className="material-icons-outlined text-[36px] text-stone/20 mb-2">forum</span>
              <p>No messages in #{activeChannel}. Say hi to start the conversation!</p>
            </div>
          ) : (
            filtered.map(m => {
              const isMe = m.sender === userName
              return (
                <div key={m.id} className={`flex items-start gap-3 max-w-2xl ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                  <div className="w-8 h-8 rounded-full bg-navy border flex items-center justify-center font-bold text-[10px] text-amber uppercase shrink-0">
                    {m.sender.slice(0, 2)}
                  </div>
                  <div className="space-y-1">
                    <div className={`flex items-center gap-2 text-[10px] font-mono ${isMe ? 'justify-end' : ''}`}>
                      <span className="font-semibold text-white">{m.sender}</span>
                      <span className="text-stone">({m.role})</span>
                      <span className="text-stone/60">{m.timestamp}</span>
                    </div>

                    <div className={`p-3 text-xs leading-relaxed ${
                      isMe ? 'bg-amber text-navy font-medium' : 'bg-navy border text-white'
                    }`} style={{ borderRadius: '0px' }}>
                      <p>{m.text}</p>
                      
                      {m.attachment && (
                        <div className={`mt-2.5 p-2 rounded flex items-center justify-between text-[10px] border ${
                          isMe ? 'bg-navy/15 border-navy/20' : 'bg-navy border-navy-lt/60'
                        }`}>
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="material-icons-outlined text-[14px]">attachment</span>
                            <span className="font-mono truncate">{m.attachment.name}</span>
                          </div>
                          <span className="font-mono uppercase shrink-0 ml-3 text-[9px]">{m.attachment.type}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input box */}
        <div className="p-4 bg-navy border-t border-navy-lt/50 shrink-0">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              placeholder={`Send message to #${activeChannel}...`}
              className="input-5bloc flex-grow py-2.5 text-xs focus:ring-1 focus:ring-amber"
            />
            <button type="submit" className="btn-primary py-2 px-5 text-xs">
              <span className="material-icons-outlined text-[15px]">send</span>
              SEND
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
