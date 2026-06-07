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
 const [folders, setFolders] = useState<string[]>(['general', 'drawings', 'contracts', 'permits', 'reports'])
 const [uploadQueue, setUploadQueue] = useState<{ name: string; progress: number; id: string }[]>([])
 const [viewingDoc, setViewingDoc] = useState<DocumentItem | null>(null)
 const [loading, setLoading] = useState(true)

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
 default: return 'insert_drive_file'
 }
 }

 const formatSize = (bytes: number) => {
 if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`
 return `${(bytes / 1024).toFixed(0)} KB`
 }

 const filteredDocs = selectedFolder === 'all' 
 ? documents 
 : documents.filter(d => d.folder === selectedFolder)

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
 
 <div>
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
 <div className="flex-grow flex items-center justify-center p-8 bg-navy/20 relative">
 {viewingDoc.extension === 'pdf' ? (
 /* Mock PDF preview container */
 <div className="w-full h-full border bg-navy/70 rounded-md flex flex-col items-center justify-center text-center p-6 text-stone">
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
 ) : (
 /* CAD DWG/DXF files details fallback */
 <div className="text-center p-8 max-w-sm">
 <div className="w-16 h-16 rounded-md bg-amber/10 border text-amber flex items-center justify-center mx-auto mb-4">
 <span className="material-icons-outlined text-[32px]">architecture</span>
 </div>
 <h4 className="text-sm font-semibold text-white">AutoCAD Drawing File (.DWG)</h4>
 <p className="text-xs text-stone mt-1.5 leading-relaxed">
 DWG rendering uses the OpenDesign Web SDK. Native desktop users can sync this directly to their local filesystem for quick launching.
 </p>
 <div className="mt-5 flex gap-3 justify-center">
 <button 
 onClick={() => alert(`Simulating file open in local CAD editor (R2 signed download validation)`)}
 className="btn-primary text-xs py-2 px-4"
 >
 Open in CAD Editor
 </button>
 <a 
 href={`https://dummyimage.com/600x400/0c1220/f5a623.png&text=Download_${viewingDoc.name}`}
 download
 className="btn-secondary text-xs py-2 px-4"
 >
 Download Raw
 </a>
 </div>
 </div>
 )}
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
 </div>
 )
}
