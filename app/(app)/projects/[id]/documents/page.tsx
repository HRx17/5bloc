'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { tusUpload } from '@/lib/files/tus-client'
import { writeLocalFile, readLocalFile } from '@/lib/files/file-manager'

interface DocumentItem {
 id: string
 name: string
 original_filename: string
 extension: string
 size_bytes: number
 version: number
 phase: string
 folder: string
 status: string
 approval_status: 'pending' | 'approved' | 'rejected' | 'revision_requested'
 uploaded_by: string
 created_at: string
 shared_with_client: boolean
}

export default function DocumentVault() {
 const params = useParams()
 const projectId = params.id as string
 const fileInputRef = useRef<HTMLInputElement>(null)

 const [documents, setDocuments] = useState<DocumentItem[]>([])
 const [selectedFolder, setSelectedFolder] = useState<string>('all')
 const [folders, setFolders] = useState<string[]>(['general', 'drawings', 'contracts', 'permits', 'reports', 'Google Drive'])
 const [uploadQueue, setUploadQueue] = useState<{ name: string; progress: number; id: string }[]>([])
 const [viewingDoc, setViewingDoc] = useState<DocumentItem | null>(null)
 const [loading, setLoading] = useState(true)

 // Google Docs and AutoCAD/Fusion 360 viewer state variables
 const [googleDocsList, setGoogleDocsList] = useState<{ id: string; title: string; url: string; lastUpdated: string; type: 'doc' | 'sheet' }[]>([
   { id: 'gdoc-1', title: 'Lotus Residences - Site Bye-Law Analysis', url: 'https://docs.google.com/document/d/1t8Z...', lastUpdated: '2026-05-20', type: 'doc' },
   { id: 'gdoc-2', title: 'Karnataka Fire NOC Compliance Checklist', url: 'https://docs.google.com/document/d/2y4U...', lastUpdated: '2026-05-25', type: 'doc' },
   { id: 'gdoc-3', title: 'Vendor Rate Comparison sheet (Granite / Vitrified)', url: 'https://docs.google.com/spreadsheets/d/3o9P...', lastUpdated: '2026-06-01', type: 'sheet' }
 ])
 const [newGDocTitle, setNewGDocTitle] = useState('')
 const [newGDocType, setNewGDocType] = useState<'doc' | 'sheet'>('doc')
 const [showLinkGDocModal, setShowLinkGDocModal] = useState(false)
 const [cadViewMode, setCadViewMode] = useState<'2d' | '3d'>('2d')
 const [visibleLayers, setVisibleLayers] = useState({ walls: true, columns: true, dimensions: true, ducts: false })
 const [clashStatus, setClashStatus] = useState<'idle' | 'running' | 'done'>('idle')

 useEffect(() => {
 // Mock load documents
 const timer = setTimeout(() => {
 setDocuments([
 {
 id: 'doc-1',
 name: 'Site Layout Plan',
 original_filename: 'site_layout_v3.dwg',
 extension: 'dwg',
 size_bytes: 48200000, // 46 MB
 version: 3,
 phase: 'schematic_design',
 folder: 'drawings',
 status: 'active',
 approval_status: 'approved',
 uploaded_by: 'Parth Patel',
 created_at: '2026-04-12',
 shared_with_client: true,
 },
 {
 id: 'doc-2',
 name: 'Fire Department NOC approval',
 original_filename: 'fire_noc_clearance.pdf',
 extension: 'pdf',
 size_bytes: 2400000, // 2.3 MB
 version: 1,
 phase: 'permits',
 folder: 'permits',
 status: 'active',
 approval_status: 'approved',
 uploaded_by: 'Aritro Roy',
 created_at: '2026-05-18',
 shared_with_client: true,
 },
 {
 id: 'doc-3',
 name: 'RCC Beam Detailing',
 original_filename: 'rcc_beams_design.dwg',
 extension: 'dwg',
 size_bytes: 104000000, // 99 MB
 version: 1,
 phase: 'construction_docs',
 folder: 'drawings',
 status: 'active',
 approval_status: 'pending',
 uploaded_by: 'Amit Sharma',
 created_at: '2026-06-02',
 shared_with_client: false,
 },
 {
 id: 'doc-4',
 name: 'Client Agreement contract',
 original_filename: 'agreement_stamped.pdf',
 extension: 'pdf',
 size_bytes: 8400000, // 8 MB
 version: 2,
 phase: 'pre_design',
 folder: 'contracts',
 status: 'active',
 approval_status: 'approved',
 uploaded_by: 'Parth Patel',
 created_at: '2026-02-14',
 shared_with_client: false,
 }
 ])
 setLoading(false)
 }, 450)
 return () => clearTimeout(timer)
 }, [projectId])

 const handleUploadClick = () => {
 fileInputRef.current?.click()
 }

 const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const files = e.target.files
 if (!files || files.length === 0) return

 const selectedFile = files[0]
 const uploadId = `up-${Date.now()}`
 
 // Add to progress queue UI
 setUploadQueue(prev => [...prev, { name: selectedFile.name, progress: 0, id: uploadId }])

 try {
 const ext = selectedFile.name.split('.').pop() || 'dat'
 const nameWithoutExt = selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.')) || selectedFile.name
 
 // 1. Chunker reads file & saves in OPFS first (Offline local-first strategy)
 const buffer = await selectedFile.arrayBuffer()
 const cacheKey = `${nameWithoutExt}_v1`
 await writeLocalFile(projectId, cacheKey, buffer)
 console.log('Saved file in local OPFS:', cacheKey)

 // 2. Resumable background upload with TUS client
 const tusUrl = await tusUpload(
 selectedFile,
 { projectId, filename: selectedFile.name, fileType: selectedFile.type },
 (progress) => {
 setUploadQueue(prev => 
 prev.map(item => item.id === uploadId ? { ...item, progress } : item)
 )
 }
 )
 console.log('TUS upload completed. Server url:', tusUrl)

 // 3. Append to files document database lists
 const newDoc: DocumentItem = {
 id: `doc-${Date.now()}`,
 name: nameWithoutExt,
 original_filename: selectedFile.name,
 extension: ext,
 size_bytes: selectedFile.size,
 version: 1,
 phase: 'construction_docs',
 folder: selectedFolder === 'all' ? 'general' : selectedFolder,
 status: 'active',
 approval_status: 'pending',
 uploaded_by: 'Parth Patel',
 created_at: new Date().toISOString().split('T')[0],
 shared_with_client: false
 }

 setDocuments(prev => [newDoc, ...prev])

 // Auto check complete task in localStorage
 const savedChecklist = localStorage.getItem('onboarding_checklist_v1')
 if (savedChecklist) {
 const parsed = JSON.parse(savedChecklist)
 parsed.document = true
 localStorage.setItem('onboarding_checklist_v1', JSON.stringify(parsed))
 }

 } catch (err) {
 console.error('File upload failed:', err)
 alert(`File upload failed for ${selectedFile.name}`)
 } finally {
 // Clear from queue
 setTimeout(() => {
 setUploadQueue(prev => prev.filter(item => item.id !== uploadId))
 }, 1000)
 }
 }

 const handleToggleShare = (docId: string) => {
 setDocuments(prev => 
 prev.map(d => d.id === docId ? { ...d, shared_with_client: !d.shared_with_client } : d)
 )
 }

 const handleApprovalUpdate = (docId: string, status: DocumentItem['approval_status']) => {
 setDocuments(prev => 
 prev.map(d => d.id === docId ? { ...d, approval_status: status } : d)
 )
 }

  const getDocTypeIcon = (ext: string) => {
    switch (ext.toLowerCase()) {
      case 'pdf': return 'picture_as_pdf'
      case 'dwg':
      case 'dxf': return 'architecture'
      case 'rvt': return 'foundation'
      case 'jpg':
      case 'png': return 'image'
      case 'gdoc': return 'description'
      case 'gsheet': return 'table_chart'
      default: return 'insert_drive_file'
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return 'Cloud Link'
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`
    return `${(bytes / 1024).toFixed(0)} KB`
  }

  const allDocs = [
    ...documents,
    ...googleDocsList.map(g => ({
      id: g.id,
      name: g.title,
      original_filename: g.url,
      extension: g.type === 'doc' ? 'gdoc' : 'gsheet',
      size_bytes: 0,
      version: 1,
      phase: 'coordination',
      folder: 'Google Drive',
      status: 'active',
      approval_status: 'approved' as const,
      uploaded_by: 'Workspace Sync',
      created_at: g.lastUpdated,
      shared_with_client: true
    }))
  ]

  const filteredDocs = selectedFolder === 'all' 
    ? allDocs 
    : allDocs.filter(d => d.folder === selectedFolder)

 return (
 <div className="space-y-6 font-body select-none relative h-full">
 {/* Dynamic Floating Upload Progress queue */}
 {uploadQueue.length > 0 && (
 <div className="fixed bottom-6 left-6 z-50 w-72 bg-navy-mid border rounded-lg shadow-none p-4 space-y-3">
 <div className="flex items-center justify-between text-xs border-b pb-2">
 <span className="font-semibold text-white tracking-wider">Background Uploading...</span>
 <span className="material-icons-outlined text-amber text-[16px] animate-spin">sync</span>
 </div>
 {uploadQueue.map(item => (
 <div key={item.id} className="space-y-1 text-xs">
 <div className="flex justify-between text-stone truncate max-w-[240px]">
 <span className="truncate">{item.name}</span>
 <span className="font-mono">{item.progress}%</span>
 </div>
 <div className="w-full bg-navy h-1.5 rounded-full overflow-hidden border ">
 <div className="bg-amber h-full rounded-full transition-all duration-300" style={{ width: `${item.progress}%` }} />
 </div>
 </div>
 ))}
 </div>
 )}

 {/* Main Layout containing folder column and document lists */}
 <div className="flex flex-col md:flex-row gap-6 items-start h-full">
 {/* Left collapsible folders lists */}
 <div className="card-5bloc w-full md:w-56 shrink-0 py-4 px-3 space-y-4">
 <div className="flex items-center justify-between px-2 pb-2 border-b ">
 <span className="text-xs font-semibold text-amber font-body">Folders</span>
 <span className="material-icons-outlined text-[16px] text-stone">create_new_folder</span>
 </div>
 <nav className="space-y-1">
 <button
 onClick={() => setSelectedFolder('all')}
 className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-md transition ${
 selectedFolder === 'all' ? 'bg-amber text-navy font-bold' : 'text-stone hover:text-white hover:bg-navy-lt'
 }`}
 >
 <span className="flex items-center gap-2">
 <span className="material-icons-outlined text-[16px]">folder_open</span>
 <span>All Documents</span>
 </span>
 <span className="font-mono text-[10px]">{documents.length}</span>
 </button>
 
 {folders.map(folder => {
 const count = documents.filter(d => d.folder === folder).length
 return (
 <button
 key={folder}
 onClick={() => setSelectedFolder(folder)}
 className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-md transition capitalize ${
 selectedFolder === folder ? 'bg-amber text-navy font-bold' : 'text-stone hover:text-white hover:bg-navy-lt'
 }`}
 >
 <span className="flex items-center gap-2">
 <span className="material-icons-outlined text-[16px]">folder</span>
 <span>{folder}</span>
 </span>
 <span className="font-mono text-[10px]">{count}</span>
 </button>
 )
 })}
 </nav>
 </div>

 {/* Right side Document data display table */}
 <div className="card-5bloc flex-1 w-full overflow-hidden flex flex-col justify-between min-h-[400px]">
 {/* Action header */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b ">
 <div>
 <h3 className="text-sm font-semibold text-white capitalize">
 {selectedFolder === 'all' ? 'All Files' : `${selectedFolder} folder`}
 </h3>
 <p className="text-[11px] text-stone mt-0.5">Double click rows to inspect layout drawings.</p>
 </div>
 
  <div className="flex flex-wrap gap-2">
  <button 
    onClick={() => setShowLinkGDocModal(true)} 
    className="btn-secondary py-2 text-xs flex items-center gap-1.5 hover:text-amber animate-fade-in"
  >
    <span className="material-icons-outlined text-[16px] text-amber">link</span>
    Link Google Doc / Sheet
  </button>
  <button onClick={handleUploadClick} className="btn-primary py-2 text-xs">
  <span className="material-icons-outlined text-[16px]">upload_file</span>
  Upload Document
  </button>
 <input
 type="file"
 ref={fileInputRef}
 onChange={handleFileChange}
 accept=".pdf,.dwg,.dxf,.rvt,.jpg,.png,.zip"
 className="hidden"
 />
 </div>
 </div>

 {/* Files List Table */}
 {loading ? (
 <div className="p-8 flex items-center justify-center text-stone animate-pulse h-48">
 <span>Loading document directory...</span>
 </div>
 ) : filteredDocs.length === 0 ? (
 <div className="py-16 flex flex-col items-center justify-center text-center text-stone flex-1">
 <span className="material-icons-outlined text-[48px] text-stone/30 mb-3">folder_open</span>
 <h4 className="text-sm font-bold text-white">Folder is empty</h4>
 <p className="text-xs max-w-xs mt-1">Upload CAD sheets or regulatory documents to get started.</p>
 </div>
 ) : (
 <div className="overflow-x-auto flex-1 mt-4">
 <table className="w-full text-left text-xs ">
 <thead>
 <tr className="text-stone border-b font-body text-[10px] tracking-wider font-semibold">
 <th className="pb-3 pl-2">Type</th>
 <th className="pb-3">Name</th>
 <th className="pb-3">Uploaded By</th>
 <th className="pb-3">Date</th>
 <th className="pb-3">Size</th>
 <th className="pb-3">Approval</th>
 <th className="pb-3 pr-2 text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-navy-lt/40">
 {filteredDocs.map((doc) => (
 <tr 
 key={doc.id}
 className="hover:bg-navy-lt/20 cursor-pointer transition-colors group"
 onDoubleClick={() => setViewingDoc(doc)}
 >
 {/* Extension Icon */}
 <td className="py-3.5 pl-2">
 <div className="w-8 h-8 rounded-md bg-navy flex items-center justify-center border text-amber shrink-0">
 <span className="material-icons-outlined text-[18px]">
 {getDocTypeIcon(doc.extension)}
 </span>
 </div>
 </td>

 {/* File Name + Version badge */}
 <td className="py-3.5 font-medium pr-4">
 <div className="flex items-center gap-2">
 <span className="text-white hover:text-amber transition-colors line-clamp-1">{doc.name}</span>
 <span className="bg-navy border text-stone text-[9px] font-mono px-1 rounded-md">
 v{doc.version}
 </span>
 </div>
 <span className="text-[10px] text-stone font-mono block truncate max-w-[180px]">{doc.original_filename}</span>
 </td>

 {/* Uploader */}
 <td className="py-3.5 text-stone truncate max-w-[120px]">{doc.uploaded_by}</td>

 {/* Upload Date */}
 <td className="py-3.5 font-mono text-[10px] text-stone">{doc.created_at}</td>

 {/* Bytes size */}
 <td className="py-3.5 font-mono text-[10px] text-stone">{formatSize(doc.size_bytes)}</td>

 {/* Approval Status Badge */}
 <td className="py-3.5">
 <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
 doc.approval_status === 'approved' 
 ? 'bg-success/15 text-success ' 
 : doc.approval_status === 'rejected'
 ? 'bg-error/15 text-error '
 : 'bg-stone/15 text-stone '
 }`}>
 {doc.approval_status.replace(/_/g, ' ').toUpperCase()}
 </span>
 </td>

 {/* Action Triggers */}
 <td className="py-3.5 pr-2 text-right">
 <div className="flex items-center justify-end gap-2.5">
 {/* Portal visibility sync badge */}
 <button
 onClick={() => handleToggleShare(doc.id)}
 className={`p-1 rounded-md hover:bg-navy-lt transition ${
 doc.shared_with_client ? 'text-success' : 'text-stone hover:text-white'
 }`}
 title={doc.shared_with_client ? 'Visible in Client Portal' : 'Private to team'}
 >
 <span className="material-icons-outlined text-[16px]">
 {doc.shared_with_client ? 'visibility' : 'visibility_off'}
 </span>
 </button>

 {/* Quick Approval Check */}
 {doc.approval_status === 'pending' && (
 <button
 onClick={() => handleApprovalUpdate(doc.id, 'approved')}
 className="p-1 rounded-md hover:bg-navy-lt text-stone hover:text-success transition"
 title="Approve Document"
 >
 <span className="material-icons-outlined text-[16px]">check_circle</span>
 </button>
 )}

 <button 
 onClick={() => setViewingDoc(doc)}
 className="p-1 rounded-md hover:bg-navy-lt text-stone hover:text-white transition"
 title="Inspect File"
 >
 <span className="material-icons-outlined text-[16px]">open_in_new</span>
 </button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>
 </div>

 {/* File Lightbox Viewer Overlay */}
 {viewingDoc && (
 <div className="fixed inset-0 bg-navy/95 backdrop-blur-md flex items-center justify-center z-50 p-6">
 <div className="w-full max-w-4xl h-[85vh] bg-navy-mid border rounded-lg overflow-hidden flex flex-col justify-between shadow-none relative">
 {/* Overlay Header details */}
 <div className="px-6 py-4 bg-navy border-b flex items-center justify-between">
 <div className="flex items-center gap-2.5">
 <span className="material-icons-outlined text-amber text-[20px]">
 {getDocTypeIcon(viewingDoc.extension)}
 </span>
 <div>
 <h3 className="text-sm font-semibold text-white">{viewingDoc.name}</h3>
 <p className="text-[10px] text-stone font-body">Filename: {viewingDoc.original_filename} (Version {viewingDoc.version})</p>
 </div>
 </div>
 <button 
 onClick={() => setViewingDoc(null)}
 className="text-stone hover:text-white transition p-1 hover:bg-navy-lt rounded-md"
 >
 <span className="material-icons-outlined text-[20px]">close</span>
 </button>
 </div>

{/* Viewer body area */}
  <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
    {/* Left column: main viewer */}
    <div className="flex-1 flex items-center justify-center p-8 bg-navy/20 relative overflow-y-auto">
      {viewingDoc.extension === 'pdf' ? (
        /* Mock PDF preview container */
        <div className="w-full h-full min-h-[300px] border bg-navy/70 rounded-md flex flex-col items-center justify-center text-center p-6 text-stone">
          <span className="material-icons-outlined text-[48px] text-amber mb-2">picture_as_pdf</span>
          <span className="text-xs font-semibold text-white">Integrated PDF Canvas Viewer (pdfjs-dist)</span>
          <span className="text-[10px] mt-1">Simulated display buffer. Actual files downloaded securely.</span>
          <button className="btn-secondary py-1 px-4 mt-4 text-xs">Page 1 of 4</button>
        </div>
      ) : viewingDoc.extension === 'jpg' || viewingDoc.extension === 'png' ? (
        /* Image preview container */
        <div className="max-w-full max-h-full overflow-hidden rounded-md border relative bg-navy/70 flex items-center justify-center">
          <img 
            src={`https://dummyimage.com/800x600/0c1220/f5a623.png&text=${encodeURIComponent(viewingDoc.name)}`} 
            alt={viewingDoc.name}
            className="max-w-full max-h-[50vh] object-contain"
          />
        </div>
      ) : viewingDoc.extension === 'gdoc' || viewingDoc.extension === 'gsheet' ? (
        /* Google Workspace Document / Sheet Sync Viewer */
        <div className="w-full h-full flex flex-col bg-white border text-stone relative overflow-hidden rounded-md">
          <div className="bg-[#4285F4]/10 px-4 py-2 border-b flex items-center justify-between text-[#4285F4] text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="material-icons-outlined text-[16px]">cloud_queue</span>
              <span>Google Docs Workspace Synced</span>
            </div>
            <span className="text-[10px] bg-[#4285F4]/15 px-2 py-0.5 rounded">AUTO-SYNC ACTIVE</span>
          </div>

          <div className="flex-1 overflow-y-auto bg-stone-100 p-6 flex justify-center">
            <div className="w-full max-w-2xl bg-white shadow-sm border p-8 text-[#1a1714] min-h-[400px]">
              {viewingDoc.extension === 'gdoc' ? (
                <div className="space-y-4 text-xs leading-relaxed">
                  <h1 className="text-lg font-bold border-b pb-2 text-stone-800">{viewingDoc.name}</h1>
                  <p className="font-semibold text-stone-700">1. Ground Setbacks & Boundary Clearances:</p>
                  <ul className="list-disc pl-5 space-y-1.5 text-stone-600">
                    <li><strong>Front setbacks:</strong> 6.0 meters clear from local municipal road boundary.</li>
                    <li><strong>Left & Right side set-back limits:</strong> 3.0 meters clear on all floor slabs.</li>
                    <li><strong>Rear building boundary set-back:</strong> 4.5 meters minimum to satisfy sewage lines.</li>
                  </ul>
                  <p className="font-semibold text-stone-700">2. BBMP Floor Area Ratio (FAR):</p>
                  <p className="text-stone-600">
                    The maximum allowable FAR for this Bangalore structural layout is 2.25 based on the 12.0-meter access road width. The current architectural draft details a layout totaling 2.21 FAR, which fully complies with zoning rules.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <h1 className="text-base font-bold text-stone-850 pb-1">{viewingDoc.name}</h1>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px] border">
                      <thead>
                        <tr className="bg-[#f5f2ee] border-b text-stone-700 font-bold">
                          <th className="p-2">Material Description</th>
                          <th className="p-2 text-right">Vendor A (Braj Build, Pune)</th>
                          <th className="p-2 text-right">Vendor B (Jaipur Stone, RJ)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-stone-600">
                        <tr>
                          <td className="p-2 font-medium">Granite slabs (60mm thick floor grade)</td>
                          <td className="p-2 text-right text-success font-semibold">₹320/sqft</td>
                          <td className="p-2 text-right">₹345/sqft</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-medium">Vitrified floor tiling (600mm x 600mm)</td>
                          <td className="p-2 text-right">₹54/sqft</td>
                          <td className="p-2 text-right text-success font-semibold">₹48/sqft</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-medium">Cladding Sandstone blocks</td>
                          <td className="p-2 text-right">₹180/sqft</td>
                          <td className="p-2 text-right text-success font-semibold">₹165/sqft</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#FAFAF8] border-t px-4 py-3 flex justify-between items-center gap-3">
            <div className="flex gap-2">
              <button 
                onClick={() => alert('AI analyzed document content and verified bye-law compliance.')}
                className="btn-ghost-amber py-1 px-3 text-[11px] flex items-center gap-1.5"
              >
                <span className="material-icons-outlined text-[14px]">auto_awesome</span>
                AI Verify Bye-Laws
              </button>
              {viewingDoc.extension === 'gsheet' && (
                <button 
                  onClick={() => alert('Successfully synced tile rates to the Project BOQ!')}
                  className="btn-primary py-1 px-3 text-[11px] flex items-center gap-1.5"
                >
                  <span className="material-icons-outlined text-[14px]">sync</span>
                  Sync Rates to BOQ
                </button>
              )}
            </div>
            <button 
              onClick={() => alert('Drafted collaboration reply to contractor in Gmail.')}
              className="btn-secondary py-1 px-3 text-[11px] flex items-center gap-1.5"
            >
              <span className="material-icons-outlined text-[14px] text-amber">mail</span>
              Draft Email Report
            </button>
          </div>
        </div>
      ) : (
        /* AutoCAD + Fusion 360 Interactive Engine */
        <div className="w-full h-full flex flex-col bg-navy border rounded-md overflow-hidden text-xs">
          {/* CAD Control Header */}
          <div className="bg-navy-mid border-b p-2 flex flex-wrap justify-between items-center gap-2">
            <div className="flex bg-navy border rounded overflow-hidden">
              <button 
                onClick={() => setCadViewMode('2d')}
                className={`px-3 py-1 font-mono text-[10px] ${cadViewMode === '2d' ? 'bg-amber text-navy font-bold' : 'text-stone hover:text-white'}`}
              >
                2D AutoCAD Sheet
              </button>
              <button 
                onClick={() => setCadViewMode('3d')}
                className={`px-3 py-1 font-mono text-[10px] ${cadViewMode === '3d' ? 'bg-amber text-navy font-bold' : 'text-stone hover:text-white'}`}
              >
                Autodesk Fusion 3D BIM
              </button>
            </div>

            <div className="flex items-center gap-2.5">
              <button 
                onClick={() => {
                  setClashStatus('running');
                  setTimeout(() => {
                    setClashStatus('done');
                    alert('Clash detection complete! Found 1 critical clash: 400mm MEP duct intersects Cantilever framing beam S-202 on Grid C4.');
                  }, 1200);
                }}
                disabled={clashStatus === 'running'}
                className="btn-secondary py-1.5 text-[10px] flex items-center gap-1.5 hover:text-amber"
              >
                <span className="material-icons-outlined text-[14px] text-amber">auto_awesome</span>
                {clashStatus === 'running' ? 'Running Clashes...' : clashStatus === 'done' ? 'Clash Found (Grid C4)' : 'Autodesk Clash Detection'}
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Viewport Area */}
            <div className="flex-1 bg-black blueprint-grid relative flex items-center justify-center p-6 h-64 lg:h-auto min-h-[300px]">
              {cadViewMode === '2d' ? (
                /* Interactive AutoCAD Blueprint SVG */
                <div className="w-full h-full max-h-[40vh] relative">
                  <svg viewBox="0 0 400 300" className="w-full h-full text-blue-lt">
                    {/* Walls Layer */}
                    {visibleLayers.walls && (
                      <g stroke="currentColor" strokeWidth="2" fill="none">
                        <rect x="40" y="40" width="320" height="220" />
                        <line x1="40" y1="130" x2="360" y2="130" />
                        <line x1="200" y1="40" x2="200" y2="260" />
                        <line x1="40" y1="200" x2="200" y2="200" />
                        <line x1="280" y1="130" x2="280" y2="260" />
                      </g>
                    )}
                    {/* Columns Layer */}
                    {visibleLayers.columns && (
                      <g fill="currentColor">
                        <rect x="37" y="37" width="6" height="6" />
                        <rect x="197" y="37" width="6" height="6" />
                        <rect x="357" y="37" width="6" height="6" />
                        <rect x="37" y="127" width="6" height="6" fill="#F5A623" />
                        <rect x="197" y="127" width="6" height="6" />
                        <rect x="357" y="127" width="6" height="6" />
                        <rect x="37" y="257" width="6" height="6" />
                        <rect x="197" y="257" width="6" height="6" />
                        <rect x="357" y="257" width="6" height="6" />
                      </g>
                    )}
                    {/* Dimensions Layer */}
                    {visibleLayers.dimensions && (
                      <g fill="#9f8e7a" className="font-mono" fontSize="7" stroke="none">
                        <text x="48" y="60">ROOM 01 · 24.3 m²</text>
                        <text x="208" y="60">OFFICE · 12.1 m²</text>
                        <text x="48" y="150">LOBBY · 18.7 m²</text>
                        <text x="208" y="150">TOILET</text>
                        <text x="208" y="220">ROOM 02 · 16.4 m²</text>
                        {/* Dimensional Lines */}
                        <path d="M 40 30 L 360 30" stroke="#9f8e7a" strokeWidth="0.5" />
                        <text x="180" y="26">36.0m</text>
                      </g>
                    )}
                    {/* AC Ducts Layer (Fusion 360 Clash) */}
                    {visibleLayers.ducts && (
                      <g stroke="#ffb4ab" strokeWidth="4" fill="none">
                        <path d="M 20 120 L 380 120" strokeDasharray="4" />
                        {/* Clash Marker */}
                        {clashStatus === 'done' && (
                          <g>
                            <circle cx="200" cy="120" r="12" stroke="#ffb4ab" fill="rgba(255,180,171,0.2)" className="animate-pulse" />
                            <text x="165" y="105" fill="#ffb4ab" fontSize="8" className="font-mono font-bold" stroke="none">CLASH: beam vs duct</text>
                          </g>
                        )}
                      </g>
                    )}
                  </svg>
                </div>
              ) : (
                /* Interactive 3D Model Spin Simulation */
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-48 h-48 border border-dashed border-amber/30 rounded-full flex items-center justify-center relative animate-[spin_12s_linear_infinite]">
                    {/* 3D Wireframe Box */}
                    <div className="absolute w-24 h-24 border-2 border-amber/40 transform rotate-45 flex items-center justify-center">
                      <div className="w-12 h-12 border-2 border-blue/40 transform -rotate-45" />
                    </div>
                    {/* BIM Nodes */}
                    <span className="w-2.5 h-2.5 rounded-full bg-success absolute top-0" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber absolute bottom-0" />
                    <span className="w-2.5 h-2.5 rounded-full bg-blue absolute left-0" />
                    <span className="w-2.5 h-2.5 rounded-full bg-error absolute right-0" />
                  </div>
                  <span className="text-[10px] font-mono text-stone mt-4">Autodesk Fusion 360 WebGL Engine Connected</span>
                  <span className="text-[9px] text-amber">Drag mouse to orbit BIM model (simulated)</span>
                </div>
              )}
            </div>

            {/* Layer Control Panel */}
            <div className="w-full lg:w-48 bg-navy border-t lg:border-t-0 lg:border-l p-4 space-y-4">
              <span className="text-[10px] font-bold font-mono text-stone uppercase tracking-wider block">AutoCAD Layers</span>
              <div className="space-y-3">
                {[
                  { key: 'walls', label: '0_Walls', color: '#7ab8ff' },
                  { key: 'columns', label: 'S_Columns', color: '#ffc880' },
                  { key: 'dimensions', label: 'A_Dimensions', color: '#9f8e7a' },
                  { key: 'ducts', label: 'M_MEP_Ducts', color: '#ffb4ab' }
                ].map(lay => (
                  <label key={lay.key} className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={(visibleLayers as any)[lay.key]}
                      onChange={() => setVisibleLayers(prev => ({ ...prev, [lay.key]: !(prev as any)[lay.key] }))}
                      className="rounded bg-navy border text-amber focus:ring-amber focus:ring-0"
                    />
                    <span className="font-mono text-[10px] flex items-center gap-1" style={{ color: lay.color }}>
                      <span className="material-icons-outlined text-[12px]">layers</span>
                      {lay.label}
                    </span>
                  </label>
                ))}
              </div>

              {clashStatus === 'done' && (
                <div className="p-2 bg-error/10 border border-error/30 space-y-2 mt-4">
                  <div className="flex items-center gap-1 text-error font-semibold text-[10px]">
                    <span className="material-icons-outlined text-[13px]">warning</span>
                    Clash Detected
                  </div>
                  <p className="text-[9px] text-stone leading-relaxed">
                    AC Duct conflicts with Cantilever beam spacing by 120mm.
                  </p>
                  <div className="flex flex-col gap-1.5">
                    <button 
                      onClick={() => alert('Created RFI #043 and mapped to structural team.')}
                      className="w-full btn-primary py-1 text-[9px] font-bold"
                    >
                      Convert to RFI
                    </button>
                    <button 
                      onClick={() => alert('Prefilled WhatsApp link generated: "Clash alert on Grid C4..."')}
                      className="w-full btn-secondary py-1 text-[9px] font-bold flex items-center justify-center gap-1"
                    >
                      <span className="material-icons-outlined text-[11px] text-[#25D366]">chat</span>
                      WhatsApp Site
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Right column: Version History & PDF Tools panels */}
    <div className="w-full md:w-80 shrink-0 border-t md:border-t-0 md:border-l bg-navy p-5 space-y-6 overflow-y-auto">
      {/* Version History section */}
      <div className="space-y-3">
        <div className="border-b pb-2 flex items-center justify-between">
          <span className="text-[10px] font-bold font-mono text-amber uppercase tracking-wider">Version History</span>
          <span className="material-icons-outlined text-stone text-[15px]">history</span>
        </div>
        <div className="space-y-3">
          {[
            { ver: viewingDoc.version, date: viewingDoc.created_at, author: viewingDoc.uploaded_by, active: true },
            { ver: Math.max(1, viewingDoc.version - 1), date: '2026-05-10', author: 'Amit Sharma', active: false },
            { ver: Math.max(1, viewingDoc.version - 2), date: '2026-04-12', author: 'Parth Patel', active: false }
          ].slice(0, viewingDoc.version).map((v, i) => (
            <div key={i} className={`p-3 border text-xs space-y-1.5 ${v.active ? 'bg-amber/5 border-amber/35' : 'bg-navy/40 border-navy-lt/50'}`}>
              <div className="flex justify-between items-center font-mono">
                <span className={`font-bold ${v.active ? 'text-amber' : 'text-white'}`}>Version {v.ver}.0</span>
                {v.active ? (
                  <span className="text-[9px] bg-amber/15 text-amber px-1.5 py-0.5 rounded font-bold uppercase">Active</span>
                ) : (
                  <button 
                    onClick={() => alert(`Restoring file to version ${v.ver}.0 (simulated)`)}
                    className="text-[9px] text-blue font-bold uppercase hover:underline"
                  >
                    Restore
                  </button>
                )}
              </div>
              <div className="flex justify-between text-[10px] text-stone">
                <span>Uploaded: {v.date}</span>
                <span>By: {v.author}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PDF & Markup tools section */}
      <div className="space-y-3 pt-2">
        <div className="border-b pb-2 flex items-center justify-between">
          <span className="text-[10px] font-bold font-mono text-blue uppercase tracking-wider">PDF & Drawing Tools</span>
          <span className="material-icons-outlined text-stone text-[15px]">construction</span>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <button 
            onClick={() => alert('Launching PDF split tool')}
            className="btn-secondary w-full py-1.5 text-xs text-left px-3 flex items-center gap-2"
          >
            <span className="material-icons-outlined text-[15px] text-stone">call_split</span>
            Split PDF Pages
          </button>
          <button 
            onClick={() => alert('Select drawing sheet to merge...')}
            className="btn-secondary w-full py-1.5 text-xs text-left px-3 flex items-center gap-2"
          >
            <span className="material-icons-outlined text-[15px] text-stone">merge_type</span>
            Merge Sheets
          </button>
          <button 
            onClick={() => alert('Activating markup overlay layers')}
            className="btn-secondary w-full py-1.5 text-xs text-left px-3 flex items-center gap-2"
          >
            <span className="material-icons-outlined text-[15px] text-stone">draw</span>
            Add Markup Layer
          </button>
          <button 
            onClick={() => alert('Exporting file to editable Word format (.docx)')}
            className="btn-secondary w-full py-1.5 text-xs text-left px-3 flex items-center gap-2"
          >
            <span className="material-icons-outlined text-[15px] text-stone">description</span>
            Export to Word (.docx)
          </button>
        </div>
      </div>
    </div>
  </div>

 {/* Viewer footer audit logs */}
 <div className="px-6 py-3 bg-navy border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[10px] text-stone font-mono">
 <span>Uploaded: {viewingDoc.created_at} by {viewingDoc.uploaded_by}</span>
 <div className="flex gap-4">
 <span>Size: {formatSize(viewingDoc.size_bytes)}</span>
 <span className="capitalize">Status: {viewingDoc.approval_status}</span>
 </div>
 </div>
  </div>
  </div>
  )}

  {showLinkGDocModal && (
    <div className="fixed inset-0 bg-navy/85 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="card-5bloc w-full max-w-md space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-navy-lt/50">
          <h3 className="text-sm font-semibold text-amber flex items-center gap-1.5">
            <span className="material-icons-outlined text-[18px]">cloud_queue</span>
            Link Google Workspace Document
          </h3>
          <button 
            onClick={() => setShowLinkGDocModal(false)}
            className="text-stone hover:text-white transition p-1"
          >
            <span className="material-icons-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-stone text-[10px] uppercase font-semibold tracking-wider mb-1.5">Document Title</label>
            <input 
              type="text"
              placeholder="e.g. Lotus Residences Structural Brief"
              value={newGDocTitle}
              onChange={(e) => setNewGDocTitle(e.target.value)}
              className="input-5bloc py-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-stone text-[10px] uppercase font-semibold tracking-wider mb-1.5">Document Type</label>
            <select 
              value={newGDocType}
              onChange={(e) => setNewGDocType(e.target.value as any)}
              className="w-full bg-navy text-white border text-xs px-3 py-2 outline-none focus:ring-1 focus:ring-amber"
            >
              <option value="doc">Google Doc (Text)</option>
              <option value="sheet">Google Sheet (Spreadsheet)</option>
            </select>
          </div>

          <div className="p-3 bg-navy border text-[11px] text-stone leading-relaxed">
            <span className="font-semibold text-amber block mb-1">Google Docs Integration Active</span>
            Linking this document maps it to your project coordination vault automatically. All updates in Google Docs will sync in real time.
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-2">
          <button 
            onClick={() => setShowLinkGDocModal(false)}
            className="btn-secondary py-1.5 px-4 text-xs font-semibold"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              if (!newGDocTitle.trim()) return;
              const newGDoc = {
                id: `gdoc-${Date.now()}`,
                title: newGDocTitle.trim(),
                url: `https://docs.google.com/document/d/mock-${Date.now()}`,
                lastUpdated: new Date().toISOString().split('T')[0],
                type: newGDocType
              };
              setGoogleDocsList(prev => [...prev, newGDoc]);
              setNewGDocTitle('');
              setShowLinkGDocModal(false);
              alert('Successfully authenticated with Google OAuth & linked document!');
            }}
            className="btn-primary py-1.5 px-4 text-xs font-semibold"
          >
            Link Workspace File
          </button>
        </div>
      </div>
    </div>
  )}
  </div>
  )
}
