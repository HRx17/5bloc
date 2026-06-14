import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/get-user'
import { uploadToR2 } from '@/lib/files/r2-client'

const ALLOWED_TYPES: Record<string, string> = {
  'application/pdf':                                               'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':       'xlsx',
  'application/msword':                                            'docx',
  'application/vnd.ms-excel':                                      'xlsx',
  'image/jpeg':  'image',
  'image/png':   'image',
  'image/webp':  'image',
  'image/gif':   'image',
  // DWG files are sent as application/octet-stream
  'application/octet-stream': 'dwg',
  'application/acad':         'dwg',
}

const MAX_SIZE_MB = 50

export async function POST(req: NextRequest) {
  try {
    const { user, orgId, supabase } = await getAuthUser()

    const formData = await req.formData()
    const file      = formData.get('file') as File | null
    const projectId = formData.get('projectId') as string | null
    const phase     = (formData.get('phase') as string) || 'General'

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const sizeMB = file.size / (1024 * 1024)
    if (sizeMB > MAX_SIZE_MB) {
      return NextResponse.json({ error: `File too large (max ${MAX_SIZE_MB} MB)` }, { status: 413 })
    }

    const fileType = ALLOWED_TYPES[file.type] || 'pdf'
    const safeBase = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\s+/g, '_')
    const r2Key    = `${user.id}/${projectId || 'general'}/${Date.now()}_${safeBase}`

    const bytes  = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const { key } = await uploadToR2(r2Key, buffer, file.type || 'application/octet-stream')

    // Record in Supabase documents table (only columns that exist in schema)
    const { data: doc, error: dbError } = await supabase
      .from('documents')
      .insert({
        org_id:            orgId ?? user.id,
        project_id:        projectId || null,
        original_filename: file.name,
        storage_path:      key,
        file_type:         fileType,
        file_size:         file.size,
        phase,
        uploaded_by:       user.id,
        status:            'pending',
      })
      .select()
      .single()

    if (dbError) {
      console.error('DB insert error after R2 upload:', dbError)
      return NextResponse.json({
        success: true,
        warning: 'File uploaded to storage but database record failed.',
        key,
      })
    }

    return NextResponse.json({ success: true, document: doc })
  } catch (e: any) {
    console.error('File upload error:', e)
    if (e.message === 'R2 not configured') {
      return NextResponse.json({ error: 'File storage not configured. Add Cloudflare R2 credentials.' }, { status: 503 })
    }
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 })
  }
}
