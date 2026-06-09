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
  attachment?: { name: string; type: string; url?: string }
}

interface EmailThread {
  id: string
  subject: string
  from: string
  date: string
  snippet: string
  body: string
  linkedRfiId?: string
  attachment?: { name: string; type: string }
}

export default function ProjectMessages() {
  const params = useParams()
  const projectId = params.id as string
  const chatEndRef = useRef<HTMLDivElement>(null)

  const [channels, setChannels] = useState<string[]>([
    'general',
    'structural',
    'mep',
    'interior-finishes',
    'gmail-sync',
    'whatsapp-logs'
  ])
  const [activeChannel, setActiveChannel] = useState('general')
  const [messages, setMessages] = useState<Message[]>([])
  const [textInput, setTextInput] = useState('')
  const [userName] = useState('Parth Patel')
  const [userRole] = useState('Architect')

  // Third-party sync data sets
  const [gmailThreads, setGmailThreads] = useState<EmailThread[]>([
    {
      id: 'em-1',
      subject: 'RE: Pink Sandstone Dispatch from Jaipur Quarry',
      from: 'Rajesh Sharma (Jaipur Stones Ltd.)',
      date: 'Today, 10:45 AM',
      snippet: 'Hi Parth, the quarry has loaded 400 sqft of pink sandstone blocks for delivery to Wadhwa Plaza site. Freight details are inside.',
      body: 'Dear Parth,\n\nWe have dispatched the sandstone consignment. The transport truck (RJ-14-GB-9922) should reach your site in Mumbai by Thursday morning. Please ensure the labor is ready for unloading.\n\nWarm regards,\nRajesh.',
      attachment: { name: 'consignment_invoice.pdf', type: 'pdf' }
    },
    {
      id: 'em-2',
      subject: 'BBMP Zoning Approval & Clearance setbacks',
      from: 'Sunil K. (Municipal Consultant)',
      date: 'Yesterday, 04:12 PM',
      snippet: 'Setback validation check matches requirements. Stamped municipal report attached.',
      body: 'Parth,\n\nI reviewed the BBMP zoning clearance files. The setbacks (6.0m front, 3.0m side) match the plans. Please verify this matches sheet A-04 before we file final NOC on Monday.',
      attachment: { name: 'municipal_zoning_clearance.pdf', type: 'pdf' }
    },
    {
      id: 'em-3',
      subject: 'Concrete cube test results - 28 Days strength',
      from: 'Dr. Ramesh Rao (V.J.T.I. Lab)',
      date: '5 Jun, 11:30 AM',
      snippet: 'M30 concrete grade has achieved target strength. Full report in sheet.',
      body: 'Dear Sir,\n\nThe 28-day compression cube tests for concrete cast on 5th May have completed. Average strength is 34.2 N/mm², which complies with Indian Standard IS 456 specifications.'
    }
  ])

  useEffect(() => {
    // Mock load message database seeds
    setMessages([
      { id: '1', sender: 'Amit Sharma', role: 'Contractor', text: 'Has the local site plan v3 been stamped by structural engineer yet? We need to lay out the column rebars today.', timestamp: '09:12 AM', channel: 'general' },
      { id: '2', sender: 'Aritro Roy', role: 'Structural', text: 'Yes, column rebar spacing is signed off. Refer to sheet S-201 revision 2 in Document Vault.', timestamp: '09:20 AM', channel: 'general', attachment: { name: 'site_layout_v3.dwg', type: 'dwg' } },
      { id: '3', sender: 'Parth Patel', role: 'Architect', text: 'Make sure the concrete grade complies with the M30 spec. The builder will inspect the cube tests on Friday.', timestamp: '10:05 AM', channel: 'general' },
      { id: '4', sender: 'Aritro Roy', role: 'Structural', text: 'I updated the beam calculation loads for the lobby cantilever span. Spacing reduced to 150mm c/c.', timestamp: 'Yesterday', channel: 'structural' },
      { id: '5', sender: 'Rohan Deshmukh', role: 'MEP Consultant', text: 'Lobby AC duct needs 400mm clear space. Cantilever beam depth forces duct below 2.4m ceiling level. Review RFI #2.', timestamp: 'Yesterday', channel: 'mep' },
      
      // WhatsApp logs mock seeds
      { id: 'wa-1', sender: 'Ramesh Foreman', role: 'Site Supervisor', text: 'Sir, cement delivery from UltraTech arrived. 120 bags unloaded.', timestamp: 'Today, 08:30 AM', channel: 'whatsapp-logs' },
      { id: 'wa-2', sender: 'Ramesh Foreman', role: 'Site Supervisor', text: 'Column reinforcement check completed on Grid C4. Rebars placed. Spacing photo attached.', timestamp: 'Today, 11:15 AM', channel: 'whatsapp-logs', attachment: { name: 'column_spacing_site.jpg', type: 'jpg', url: 'https://dummyimage.com/300x200/0c1220/f5a623.png&text=Site_Spacing_Photo' } },
      { id: 'wa-3', sender: 'Amit Sharma', role: 'Contractor', text: 'Parth, plumbing pipe layout has a clash with column beam. Ramesh is sending sketch.', timestamp: 'Today, 11:42 AM', channel: 'whatsapp-logs' }
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

    // If WhatsApp channel, trigger a simulated automatic response from foreman after a brief timeout
    if (activeChannel === 'whatsapp-logs') {
      setTimeout(() => {
        const foremanMsg: Message = {
          id: `msg-foreman-${Date.now()}`,
          sender: 'Ramesh Foreman',
          role: 'Site Supervisor',
          text: 'Got it, sir. Will update site log and coordinate with structural drawings.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          channel: 'whatsapp-logs'
        }
        setMessages(prev => [...prev, foremanMsg])
      }, 1000)
    }
  }

  const handleImportToRfi = (email: EmailThread) => {
    alert(`Successfully synced Gmail thread "${email.subject}"! Created new Draft RFI in RFIs register.`)
  }

  const handleConvertPhotoToIssue = (msgText: string, filename: string) => {
    alert(`logged photo "${filename}" into Issue Tracker! Created high-priority punchlist issue: "${msgText.split('.')[0]}".`)
  }

  const shareToWhatsApp = () => {
    const mobile = '9876543210'
    const text = `Please review active drawing sheet A-04 Ground Floor Plan version v12.0 on 5Bloc at https://5bloc.app/d/lotus-A-04`
    const link = `https://api.whatsapp.com/send?phone=91${mobile}&text=${encodeURIComponent(text)}`
    window.open(link, '_blank')
  }

  const filtered = messages.filter(m => m.channel === activeChannel)

  return (
    <div className="card-5bloc flex flex-col lg:flex-row gap-0 h-[620px] p-0 overflow-hidden font-body select-none">
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
            
            // Format labels for synced channels
            let icon = 'hash'
            let colorClass = ''
            if (ch === 'gmail-sync') {
              icon = 'mail'
              colorClass = active ? 'text-navy' : 'text-red-400'
            } else if (ch === 'whatsapp-logs') {
              icon = 'chat'
              colorClass = active ? 'text-navy' : 'text-green-400'
            }

            return (
              <button
                key={ch}
                onClick={() => setActiveChannel(ch)}
                className={`w-full text-left px-3 py-2.5 text-xs font-semibold rounded-md transition ${
                  active ? 'bg-amber text-navy font-bold' : 'text-stone hover:text-white hover:bg-navy-lt/50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {ch === 'gmail-sync' || ch === 'whatsapp-logs' ? (
                    <span className={`material-icons-outlined text-[15px] ${colorClass}`}>{icon}</span>
                  ) : (
                    <span className="font-mono">#</span>
                  )}
                  <span className="capitalize">{ch.replace('-', ' ')}</span>
                </div>
                {ch !== 'gmail-sync' && lastMsg && (
                  <p className={`text-[10px] truncate mt-0.5 font-normal ${active ? 'text-navy/70' : 'text-stone/75'}`}>
                    {lastMsg.sender}: {lastMsg.text}
                  </p>
                )}
                {ch === 'gmail-sync' && (
                  <p className={`text-[10px] truncate mt-0.5 font-normal ${active ? 'text-navy/70' : 'text-stone/75'}`}>
                    Inbox: {gmailThreads.length} Synced Threads
                  </p>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Main chat viewport */}
      <div className="flex-grow flex flex-col justify-between bg-navy-mid/10 overflow-hidden">
        {/* Chat window header */}
        <div className="px-6 py-4 bg-navy border-b border-navy-lt/50 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-sm font-semibold text-white capitalize flex items-center gap-1.5">
              {activeChannel === 'gmail-sync' ? (
                <>
                  <span className="material-icons-outlined text-[16px] text-red-400">mail</span>
                  Gmail Inbox Sync
                </>
              ) : activeChannel === 'whatsapp-logs' ? (
                <>
                  <span className="material-icons-outlined text-[16px] text-green-400">chat</span>
                  WhatsApp Site Logs
                </>
              ) : (
                <>
                  <span className="font-mono text-stone">#</span> 
                  {activeChannel.replace('-', ' ')}
                </>
              )}
            </h3>
            <p className="text-[10px] text-stone mt-0.5">
              {activeChannel === 'gmail-sync' 
                ? 'Official email correspondences synced from connected Google account.'
                : activeChannel === 'whatsapp-logs'
                ? 'Webhook sync capturing messages and photos shared on site WhatsApp groups.'
                : 'Formal cross-discipline project coordination record.'}
            </p>
          </div>

          {activeChannel !== 'gmail-sync' && activeChannel !== 'whatsapp-logs' && (
            <button 
              onClick={shareToWhatsApp}
              className="btn-secondary py-1.5 px-3 text-[10px] flex items-center gap-1.5 hover:text-amber"
              title="Share project link to vendor"
            >
              <span className="material-icons-outlined text-[14px] text-green-400">chat</span>
              WhatsApp Invite
            </button>
          )}
        </div>

        {/* Dynamic Channel content feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeChannel === 'gmail-sync' ? (
            /* Gmail threads listing container */
            <div className="space-y-4">
              {gmailThreads.map(email => (
                <div key={email.id} className="p-4 bg-navy border border-navy-lt/60 rounded-md space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{email.subject}</span>
                        <span className="text-[9px] bg-red-400/10 text-red-400 border border-red-400/20 px-1.5 py-0.5 rounded font-mono">GMAIL</span>
                      </div>
                      <span className="text-[10px] text-stone mt-0.5 block">From: <strong className="text-amber">{email.from}</strong> · {email.date}</span>
                    </div>
                    <button 
                      onClick={() => handleImportToRfi(email)}
                      className="btn-ghost-amber text-[10px] py-1 px-2.5 flex items-center gap-1"
                    >
                      <span className="material-icons-outlined text-[13px]">call_missed_outgoing</span>
                      Import to RFI
                    </button>
                  </div>

                  <p className="text-xs text-stone-300 leading-relaxed font-body whitespace-pre-line">{email.body}</p>

                  {email.attachment && (
                    <div className="p-2 bg-navy-mid border border-navy-lt/50 rounded flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span className="material-icons-outlined text-[14px] text-stone">attachment</span>
                        <span className="font-mono text-stone-300">{email.attachment.name}</span>
                      </div>
                      <button 
                        onClick={() => alert(`Importing ${email.attachment?.name} to drawings folder...`)}
                        className="text-[9px] text-blue font-bold hover:underline"
                      >
                        SYNC TO VAULT
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : activeChannel === 'whatsapp-logs' ? (
            /* WhatsApp messages listing container */
            <div className="space-y-4">
              <div className="bg-green-400/5 border border-green-400/20 p-3 text-[11px] text-stone leading-relaxed flex items-center gap-2.5">
                <span className="material-icons-outlined text-[16px] text-green-400">sync</span>
                <div>
                  <span className="font-semibold text-white">WhatsApp Webhook Sync Active</span>
                  <p className="text-[10px] text-stone mt-0.5">Capturing site updates from Ramesh Foreman (+91 98765 43210).</p>
                </div>
              </div>
              
              {filtered.map(m => {
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
                          <div className="mt-3 space-y-2">
                            <div className="max-w-xs overflow-hidden rounded border border-navy-lt/60">
                              <img src={m.attachment.url} alt="site spacing check" className="w-full h-auto object-cover" />
                            </div>
                            <div className="flex justify-between items-center bg-navy-mid border p-2 rounded text-[10px]">
                              <span className="font-mono truncate">{m.attachment.name}</span>
                              <button 
                                onClick={() => handleConvertPhotoToIssue(m.text, m.attachment!.name)}
                                className="btn-ghost-amber text-[9px] py-0.5 px-2 flex items-center gap-1"
                              >
                                <span className="material-icons-outlined text-[12px]">bug_report</span>
                                Log Snag
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={chatEndRef} />
            </div>
          ) : (
            /* Normal channel chat */
            <>
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
            </>
          )}
        </div>

        {/* Input box */}
        <div className="p-4 bg-navy border-t border-navy-lt/50 shrink-0">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              placeholder={
                activeChannel === 'gmail-sync'
                  ? 'Email thread replies can be drafted using the "Draft Email Report" action button...'
                  : activeChannel === 'whatsapp-logs'
                  ? 'Send a WhatsApp message directly to Ramesh Foreman...'
                  : `Send message to #${activeChannel}...`
              }
              disabled={activeChannel === 'gmail-sync'}
              className="input-5bloc flex-grow py-2.5 text-xs focus:ring-1 focus:ring-amber disabled:opacity-50"
            />
            <button 
              type="submit" 
              disabled={activeChannel === 'gmail-sync'}
              className="btn-primary py-2 px-5 text-xs shrink-0"
            >
              <span className="material-icons-outlined text-[15px]">send</span>
              {activeChannel === 'whatsapp-logs' ? 'WHATSAPP' : 'SEND'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
