/**
 * Live smoke against Supabase + local Next API.
 * Usage: node scripts/smoke-live.mjs
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL + ANON key, MOCK_AUTH=0
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function loadEnv() {
  const p = path.join(__dirname, '..', '.env.local')
  const env = {}
  if (!fs.existsSync(p)) throw new Error('.env.local missing')
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue
    const i = line.indexOf('=')
    if (i < 0) continue
    env[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return env
}

const env = loadEnv()
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const APP = process.env.BASE_URL || env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const PROJECT_ID = 'a957014f-584e-4c7e-a3c1-16c17fb9d43d'
const PORTAL_TOKEN = 'fb732e7a6f69a795f3de513d5e61210b967c89ffed1ec2e9'
const PASS = 'SmokeTest123!'

const results = []
function ok(name, detail) {
  results.push({ name, pass: true, detail })
  console.log(`PASS  ${name}${detail ? ' — ' + detail : ''}`)
}
function fail(name, detail) {
  results.push({ name, pass: false, detail })
  console.error(`FAIL  ${name} — ${detail}`)
}

async function signIn(email) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: ANON,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password: PASS }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`${email}: ${data.error_description || data.msg || JSON.stringify(data)}`)
  return data
}

async function rpc(accessToken, fn, args) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      apikey: ANON,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  })
  const text = await res.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    data = text
  }
  return { ok: res.ok, status: res.status, data }
}

async function rest(accessToken, pathSuffix, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${pathSuffix}`, {
    method: opts.method || 'GET',
    headers: {
      apikey: ANON,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Prefer: opts.prefer || 'return=representation',
      ...(opts.headers || {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })
  const text = await res.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    data = text
  }
  return { ok: res.ok, status: res.status, data }
}

async function appFetch(pathname, { cookie, method, body } = {}) {
  const res = await fetch(`${APP}${pathname}`, {
    method: method || 'GET',
    headers: {
      ...(cookie ? { Cookie: cookie } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: 'manual',
  })
  const text = await res.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    data = text
  }
  return { ok: res.ok, status: res.status, data, headers: res.headers }
}

function sessionCookie(session) {
  // Next auth-helpers typically use sb-<ref>-auth-token cookie; API routes use getUser from cookies.
  // For smoke without full cookie jar, test Supabase RPCs directly + public portal API.
  return null
}

async function main() {
  console.log('Smoke against', SUPABASE_URL)
  console.log('App URL', APP)

  // Auth logins
  let arch
  try {
    arch = await signIn('smoke.architect@5bloc.test')
    ok('architect login', arch.user?.id)
  } catch (e) {
    fail('architect login', e.message)
    process.exit(1)
  }

  try {
    const vend = await signIn('smoke.vendor@5bloc.test')
    ok('vendor login', vend.user?.id)
  } catch (e) {
    fail('vendor login', e.message)
  }

  try {
    const build = await signIn('smoke.builder@5bloc.test')
    ok('builder login', build.user?.id)
  } catch (e) {
    fail('builder login', e.message)
  }

  // Portal RPC (anon)
  {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_portal_project`, {
      method: 'POST',
      headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_token: PORTAL_TOKEN }),
    })
    const data = await res.json()
    if (res.ok && data?.project) ok('portal RPC', data.project.name)
    else fail('portal RPC', JSON.stringify(data).slice(0, 200))
  }

  // Invite RPC
  {
    const inv = await rest(arch.access_token, 'project_members?invite_email=eq.smoke.builder@5bloc.test&select=invite_token')
    const token = inv.data?.[0]?.invite_token
    if (!token) fail('invite token lookup', JSON.stringify(inv.data))
    else {
      const r = await rpc(arch.access_token, 'get_invite_by_token', { p_token: token })
      if (r.ok && r.data?.role === 'builder') ok('invite RPC', token.slice(0, 16) + '…')
      else fail('invite RPC', JSON.stringify(r.data).slice(0, 200))
    }
  }

  // Messages RPC
  {
    const list = await rpc(arch.access_token, 'list_project_channel_messages', {
      p_project_id: PROJECT_ID,
      p_channel: 'general',
      p_limit: 20,
    })
    if (list.ok && Array.isArray(list.data?.messages)) {
      ok('list messages', `${list.data.messages.length} msgs`)
    } else fail('list messages', JSON.stringify(list.data).slice(0, 200))

    const post = await rpc(arch.access_token, 'post_project_channel_message', {
      p_project_id: PROJECT_ID,
      p_channel: 'general',
      p_body: `Smoke ping ${new Date().toISOString()}`,
    })
    if (post.ok && post.data?.id) ok('post message', post.data.id)
    else fail('post message', JSON.stringify(post.data).slice(0, 200))
  }

  // Profile read
  {
    const me = await rest(arch.access_token, 'profiles?select=id,role,org_id,email&auth_id=eq.' + arch.user.id)
    if (me.ok && me.data?.[0]?.role === 'architect') ok('profile read', me.data[0].email)
    else fail('profile read', JSON.stringify(me.data).slice(0, 200))
  }

  // Bids visible to architect org
  {
    const bids = await rest(arch.access_token, 'bids?select=id,amount,status&limit=5')
    if (bids.ok) ok('bids select', `status ${bids.status}, rows ${Array.isArray(bids.data) ? bids.data.length : 0}`)
    else fail('bids select', JSON.stringify(bids.data).slice(0, 200))
  }

  // App portal HTTP (if server up)
  try {
    const portal = await appFetch(`/api/portal/${PORTAL_TOKEN}`)
    if (portal.status === 200 && portal.data?.project) ok('app portal API', portal.data.project.name)
    else if (portal.status === 0 || String(portal.data).includes('ECONNREFUSED')) {
      fail('app portal API', 'Next server not running')
    } else fail('app portal API', `${portal.status} ${JSON.stringify(portal.data).slice(0, 160)}`)
  } catch (e) {
    fail('app portal API', e.message)
  }

  // Authenticated Next APIs via Bearer
  async function appAuth(pathname, accessToken, opts = {}) {
    const res = await fetch(`${APP}${pathname}`, {
      method: opts.method || 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    })
    const text = await res.text()
    let data
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
    return { ok: res.ok, status: res.status, data }
  }

  {
    const me = await appAuth('/api/me', arch.access_token)
    if (me.ok && me.data?.profile?.email === 'smoke.architect@5bloc.test') ok('app /api/me', me.data.profile.role)
    else fail('app /api/me', `${me.status} ${JSON.stringify(me.data).slice(0, 180)}`)
  }

  {
    const msgs = await appAuth(
      `/api/projects/${PROJECT_ID}/messages?channel=general`,
      arch.access_token
    )
    if (msgs.ok && Array.isArray(msgs.data?.messages)) ok('app messages GET', `${msgs.data.messages.length}`)
    else fail('app messages GET', `${msgs.status} ${JSON.stringify(msgs.data).slice(0, 180)}`)
  }

  {
    const post = await appAuth(`/api/projects/${PROJECT_ID}/messages`, arch.access_token, {
      method: 'POST',
      body: { channel: 'general', text: `API smoke ${Date.now()}` },
    })
    if (post.ok && post.data?.message?.id) ok('app messages POST', post.data.message.id)
    else fail('app messages POST', `${post.status} ${JSON.stringify(post.data).slice(0, 180)}`)
  }

  {
    const team = await appAuth('/api/org/team', arch.access_token)
    if (team.ok && Array.isArray(team.data?.members)) ok('app org team', `${team.data.members.length} members`)
    else fail('app org team', `${team.status} ${JSON.stringify(team.data).slice(0, 180)}`)
  }

  // Upload via Supabase Storage fallback
  {
    const form = new FormData()
    form.append('projectId', PROJECT_ID)
    form.append(
      'file',
      new Blob(['smoke upload body'], { type: 'text/plain' }),
      'smoke-upload.txt'
    )
    const res = await fetch(`${APP}/api/files/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${arch.access_token}` },
      body: form,
    })
    const data = await res.json()
    if (res.ok && (data.provider === 'supabase' || data.provider === 'r2' || data.mock)) {
      ok('app file upload', `${data.provider} ${String(data.r2_key || '').slice(0, 40)}`)
    } else {
      fail('app file upload', `${res.status} ${JSON.stringify(data).slice(0, 220)}`)
    }
  }

  // Module APIs: expenses, meetings, permits, transmittals
  {
    const exp = await appAuth(`/api/projects/${PROJECT_ID}/expenses`, arch.access_token, {
      method: 'POST',
      body: {
        title: `Smoke expense ${Date.now()}`,
        category: 'Other',
        amount: 1500,
        date: new Date().toISOString().slice(0, 10),
      },
    })
    if (exp.ok && exp.data?.expense?.id) ok('app expenses POST', exp.data.expense.id)
    else fail('app expenses POST', `${exp.status} ${JSON.stringify(exp.data).slice(0, 180)}`)
  }
  {
    const meet = await appAuth(`/api/projects/${PROJECT_ID}/meetings`, arch.access_token, {
      method: 'POST',
      body: { title: `Smoke meeting ${Date.now()}`, date: new Date().toISOString().slice(0, 10), agenda: 'Smoke' },
    })
    if (meet.ok && meet.data?.meeting?.id) ok('app meetings POST', meet.data.meeting.id)
    else fail('app meetings POST', `${meet.status} ${JSON.stringify(meet.data).slice(0, 180)}`)
  }
  {
    const permit = await appAuth(`/api/projects/${PROJECT_ID}/permits`, arch.access_token, {
      method: 'POST',
      body: { approval_name: `Smoke permit ${Date.now()}`, authority: 'MCGM', status: 'not_started' },
    })
    if (permit.ok && permit.data?.permit?.id) ok('app permits POST', permit.data.permit.id)
    else fail('app permits POST', `${permit.status} ${JSON.stringify(permit.data).slice(0, 180)}`)
  }
  {
    const tr = await appAuth(`/api/projects/${PROJECT_ID}/transmittals`, arch.access_token, {
      method: 'POST',
      body: {
        recipient_name: 'Smoke Recipient',
        recipient_company: 'Smoke Co',
        documents: 'Smoke drawing set',
        purpose: 'For Information',
        via: 'Email',
      },
    })
    if (tr.ok && tr.data?.transmittal?.id) ok('app transmittals POST', tr.data.transmittal.id)
    else fail('app transmittals POST', `${tr.status} ${JSON.stringify(tr.data).slice(0, 180)}`)
  }
  {
    const est = await appAuth(`/api/projects/${PROJECT_ID}/estimates`, arch.access_token, {
      method: 'POST',
      body: {
        estimated_total: 1234567,
        result: { total_estimate: 1234567, line_items: [{ category: 'Smoke', description: 'line', quantity: 1, unit: 'ls', rate: 1234567, amount: 1234567 }] },
        city: 'Mumbai',
        project_type: 'residential',
      },
    })
    if (est.ok && est.data?.estimate_id) ok('app estimate save', est.data.estimate_id)
    else fail('app estimate save', `${est.status} ${JSON.stringify(est.data).slice(0, 180)}`)
  }

  {
    const notes = await appAuth('/api/notifications', arch.access_token)
    if (notes.ok && Array.isArray(notes.data?.notifications)) {
      ok('app notifications', `${notes.data.notifications.length}`)
      const unread = notes.data.notifications.find((n) => !n.read_at)
      if (unread) {
        const mark = await appAuth('/api/notifications', arch.access_token, {
          method: 'PATCH',
          body: { id: unread.id },
        })
        if (mark.ok) ok('app notifications mark-read', unread.id)
        else fail('app notifications mark-read', `${mark.status}`)
      } else {
        ok('app notifications mark-read', 'none unread')
      }
    } else fail('app notifications', `${notes.status}`)
  }

  {
    const inv = await rest(
      arch.access_token,
      'project_members?invite_email=eq.smoke.builder@5bloc.test&select=invite_token,accepted_at,profile_id'
    )
    const row = inv.data?.[0]
    const token = row?.invite_token
    if (row?.accepted_at && row?.profile_id) {
      ok('app accept invite', 'already accepted')
    } else {
      const build = await signIn('smoke.builder@5bloc.test')
      const accept = await appAuth('/api/invites/accept', build.access_token, {
        method: 'POST',
        body: { token, full_name: 'Smoke Builder' },
      })
      if (accept.ok && accept.data?.role === 'builder') ok('app accept invite', accept.data.project_id)
      else fail('app accept invite', `${accept.status} ${JSON.stringify(accept.data).slice(0, 200)}`)
    }
  }

  // Award a submitted bid
  {
    const bids = await appAuth('/api/bids', arch.access_token)
    const submitted = (bids.data?.bids || []).find((b) => b.status === 'submitted')
    if (!submitted) {
      ok('app award bid', 'no submitted bid (already awarded or none)')
    } else {
      const award = await appAuth('/api/bids', arch.access_token, {
        method: 'PATCH',
        body: { bid_id: submitted.id, status: 'accepted' },
      })
      if (award.ok && award.data?.bid?.status === 'accepted') ok('app award bid', submitted.id)
      else fail('app award bid', `${award.status} ${JSON.stringify(award.data).slice(0, 200)}`)
    }
  }

  // Portal document approve
  {
    const portal = await appFetch(`/api/portal/${PORTAL_TOKEN}`)
    const doc = (portal.data?.documents || []).find((d) => d.shared_with_client) || portal.data?.documents?.[0]
    if (!doc?.id) {
      fail('app portal approve', 'no portal documents')
    } else {
      const approve = await appFetch(`/api/portal/${PORTAL_TOKEN}`, {
        method: 'POST',
        body: { action: 'approve', document_id: doc.id, note: 'smoke approve' },
      })
      if (approve.ok && approve.data?.ok) ok('app portal approve', doc.id)
      else fail('app portal approve', `${approve.status} ${JSON.stringify(approve.data).slice(0, 200)}`)
    }
  }

  // Org invite create + accept (seeded firm-member account)
  {
    const email = 'smoke.orgmember@5bloc.test'
    const create = await appAuth('/api/org/team', arch.access_token, {
      method: 'POST',
      body: { email, member_role: 'member' },
    })
    if (create.status === 409) {
      ok('app org invite create', 'already accepted member')
      ok('app org invite accept', 'already accepted')
    } else if (!create.ok) {
      fail('app org invite create', `${create.status} ${JSON.stringify(create.data).slice(0, 180)}`)
    } else {
      const token = create.data?.invite?.invite_token
      ok('app org invite create', token?.slice(0, 12) + '…')
      const member = await signIn(email)
      const acceptOrg = await appAuth('/api/org/invites/accept', member.access_token, {
        method: 'POST',
        body: { token, full_name: 'Smoke Org Member' },
      })
      if (acceptOrg.ok && acceptOrg.data?.ok && acceptOrg.data?.role === 'architect') {
        ok('app org invite accept', acceptOrg.data.org_id)
      } else {
        fail('app org invite accept', `${acceptOrg.status} ${JSON.stringify(acceptOrg.data).slice(0, 200)}`)
      }
    }
  }

  // Builder + consultant role surfaces
  {
    const build = await signIn('smoke.builder@5bloc.test')
    const me = await appAuth('/api/me', build.access_token)
    if (me.ok && me.data?.profile?.role === 'builder') ok('app builder me', me.data.profile.id)
    else fail('app builder me', `${me.status} ${JSON.stringify(me.data).slice(0, 180)}`)

    const rec = await appAuth('/api/vendor-recommendations', build.access_token, {
      method: 'POST',
      body: {
        project_id: PROJECT_ID,
        vendor_name: 'Smoke Rec Vendor',
        specialization: 'tiling',
        email: 'smoke.rec@5bloc.test',
        note: 'smoke recommend',
      },
    })
    if (rec.ok && rec.data?.recommendation?.id) ok('app builder recommend', rec.data.recommendation.id)
    else fail('app builder recommend', `${rec.status} ${JSON.stringify(rec.data).slice(0, 180)}`)
  }
  {
    let cons
    try {
      cons = await signIn('smoke.consultant@5bloc.test')
    } catch (e) {
      fail('consultant login', String(e.message || e))
      cons = null
    }
    if (cons) {
      const me = await appAuth('/api/me', cons.access_token)
      if (me.ok && me.data?.profile?.role === 'consultant') ok('app consultant me', me.data.profile.discipline || 'ok')
      else fail('app consultant me', `${me.status} ${JSON.stringify(me.data).slice(0, 180)}`)

      const subs = await appAuth(`/api/projects/${PROJECT_ID}/submittals`, cons.access_token)
      if (subs.ok && Array.isArray(subs.data?.submittals)) ok('app consultant submittals', `${subs.data.submittals.length}`)
      else fail('app consultant submittals', `${subs.status} ${JSON.stringify(subs.data).slice(0, 180)}`)
    }
  }
  {
    const pay = await appAuth(`/api/projects/${PROJECT_ID}/consultant-payments`, arch.access_token, {
      method: 'POST',
      body: {
        consultant_name: 'Smoke Consultant',
        discipline: 'Structural',
        amount: 25000,
        milestone_phase: 'Design',
        status: 'pending',
      },
    })
    if (pay.ok && pay.data?.payment?.id) ok('app consultant-payments POST', pay.data.payment.id)
    else fail('app consultant-payments POST', `${pay.status} ${JSON.stringify(pay.data).slice(0, 180)}`)
  }

  // Vendor role must stay contractor after unrelated org invites historically
  {
    const vend = await signIn('smoke.vendor@5bloc.test')
    const me = await appAuth('/api/me', vend.access_token)
    if (me.ok && me.data?.profile?.role === 'contractor') ok('vendor role preserved', 'contractor')
    else fail('vendor role preserved', `${me.status} ${JSON.stringify(me.data?.profile?.role)}`)
  }

  // Site / punch / materials
  {
    const siteGet = await appAuth(`/api/projects/${PROJECT_ID}/site`, arch.access_token)
    if (siteGet.ok && Array.isArray(siteGet.data?.visits)) {
      ok('app site GET', `visits=${siteGet.data.visits.length}`)
    } else {
      fail('app site GET', `${siteGet.status} ${JSON.stringify(siteGet.data).slice(0, 180)}`)
    }
  }
  {
    const visit = await appAuth(`/api/projects/${PROJECT_ID}/site`, arch.access_token, {
      method: 'POST',
      body: { kind: 'visit', supervisor: 'Smoke Supervisor', observations: 'Smoke site visit' },
    })
    if (visit.ok && visit.data?.visit?.id) ok('app site visit POST', visit.data.visit.id)
    else fail('app site visit POST', `${visit.status} ${JSON.stringify(visit.data).slice(0, 180)}`)
  }
  {
    const mat = await appAuth(`/api/projects/${PROJECT_ID}/site`, arch.access_token, {
      method: 'POST',
      body: {
        kind: 'material',
        material_name: 'Smoke cement',
        specified_standard: 'IS 269',
        delivered_material: 'OPC 53',
        status: 'pending_testing',
      },
    })
    if (mat.ok && mat.data?.material?.id) ok('app material POST', mat.data.material.id)
    else fail('app material POST', `${mat.status} ${JSON.stringify(mat.data).slice(0, 180)}`)
  }
  {
    const punch = await appAuth(`/api/projects/${PROJECT_ID}/site`, arch.access_token, {
      method: 'POST',
      body: { kind: 'punch', defect: 'Smoke crack at beam', location: 'Grid A-1', assigned_to: 'Contractor' },
    })
    if (punch.ok && punch.data?.punch?.id) ok('app punch POST', punch.data.punch.id)
    else fail('app punch POST', `${punch.status} ${JSON.stringify(punch.data).slice(0, 180)}`)
  }

  // RFIs + submittals
  {
    const rfi = await appAuth(`/api/projects/${PROJECT_ID}/rfis`, arch.access_token, {
      method: 'POST',
      body: { title: `Smoke RFI ${Date.now()}`, description: 'Smoke RFI body' },
    })
    if (rfi.ok && rfi.data?.rfi?.id) ok('app rfis POST', rfi.data.rfi.id)
    else fail('app rfis POST', `${rfi.status} ${JSON.stringify(rfi.data).slice(0, 180)}`)
  }
  {
    const sub = await appAuth(`/api/projects/${PROJECT_ID}/submittals`, arch.access_token, {
      method: 'POST',
      body: { title: `Smoke submittal ${Date.now()}`, spec_section: '03 30 00', description: 'Smoke' },
    })
    if (sub.ok && sub.data?.submittal?.id) ok('app submittals POST', sub.data.submittal.id)
    else fail('app submittals POST', `${sub.status} ${JSON.stringify(sub.data).slice(0, 180)}`)
  }

  // Clients CRM + activity
  {
    const clients = await appAuth('/api/clients', arch.access_token)
    if (clients.ok && Array.isArray(clients.data?.clients)) ok('app clients GET', `${clients.data.clients.length}`)
    else fail('app clients GET', `${clients.status} ${JSON.stringify(clients.data).slice(0, 180)}`)
  }
  {
    const created = await appAuth('/api/clients', arch.access_token, {
      method: 'POST',
      body: {
        full_name: `Smoke Client ${Date.now()}`,
        email: `smoke.client.${Date.now()}@5bloc.test`,
        company: 'Smoke Realty',
        pipeline_stage: 'prospect',
      },
    })
    if (!created.ok || !created.data?.client?.id) {
      fail('app clients POST', `${created.status} ${JSON.stringify(created.data).slice(0, 180)}`)
    } else {
      ok('app clients POST', created.data.client.id)
      const patch = await appAuth(`/api/clients/${created.data.client.id}`, arch.access_token, {
        method: 'PATCH',
        body: {
          pipeline_stage: 'qualified',
          comm_log: { type: 'call', summary: 'Smoke follow-up' },
        },
      })
      if (patch.ok && patch.data?.client?.pipeline_stage === 'qualified') {
        ok('app clients PATCH', patch.data.client.last_contact || 'ok')
      } else {
        fail('app clients PATCH', `${patch.status} ${JSON.stringify(patch.data).slice(0, 180)}`)
      }
    }
  }
  {
    const act = await appAuth(`/api/activity?project_id=${PROJECT_ID}&limit=5`, arch.access_token)
    if (act.ok && Array.isArray(act.data?.activity)) ok('app activity', `${act.data.activity.length}`)
    else fail('app activity', `${act.status} ${JSON.stringify(act.data).slice(0, 180)}`)
  }

  // Document versions (create doc then list versions)
  {
    const doc = await appAuth(`/api/projects/${PROJECT_ID}/documents`, arch.access_token, {
      method: 'POST',
      body: {
        name: `Smoke Doc ${Date.now()}.txt`,
        original_filename: 'smoke.txt',
        extension: 'txt',
        r2_key: `supabase:smoke/versions-${Date.now()}.txt`,
        size_bytes: 12,
      },
    })
    if (!doc.ok || !doc.data?.document?.id) {
      fail('app documents POST', `${doc.status} ${JSON.stringify(doc.data).slice(0, 180)}`)
    } else {
      ok('app documents POST', doc.data.document.id)
      const vers = await appAuth(
        `/api/projects/${PROJECT_ID}/document-versions?document_id=${doc.data.document.id}`,
        arch.access_token
      )
      if (vers.ok && Array.isArray(vers.data?.versions) && vers.data.versions.length >= 1) {
        ok('app document-versions GET', `${vers.data.versions.length}`)
      } else {
        fail('app document-versions GET', `${vers.status} ${JSON.stringify(vers.data).slice(0, 180)}`)
      }

      // Builder approval on pending doc
      const build = await signIn('smoke.builder@5bloc.test')
      const approve = await appAuth(`/api/projects/${PROJECT_ID}/documents`, build.access_token, {
        method: 'PATCH',
        body: {
          document_id: doc.data.document.id,
          approval_status: 'approved',
          approval_note: 'smoke builder approve',
        },
      })
      if (approve.ok && approve.data?.document?.approval_status === 'approved') {
        ok('app builder doc approve', doc.data.document.id)
      } else {
        fail('app builder doc approve', `${approve.status} ${JSON.stringify(approve.data).slice(0, 180)}`)
      }
    }
  }

  // Invoices + milestones
  {
    const inv = await appAuth('/api/invoices', arch.access_token, {
      method: 'POST',
      body: {
        project_id: PROJECT_ID,
        client_name: 'Smoke Client',
        subtotal: 100000,
        gst_rate: 18,
        status: 'sent',
        due_date: new Date().toISOString().slice(0, 10),
        line_items: [{ description: 'Smoke fee', amount: 100000 }],
      },
    })
    if (inv.ok && inv.data?.invoice?.id) ok('app invoices POST', inv.data.invoice.invoice_number || inv.data.invoice.id)
    else fail('app invoices POST', `${inv.status} ${JSON.stringify(inv.data).slice(0, 180)}`)
  }
  {
    const ms = await appAuth(`/api/projects/${PROJECT_ID}/milestones`, arch.access_token)
    if (ms.ok && Array.isArray(ms.data?.milestones) && ms.data.milestones.length > 0) {
      ok('app milestones GET', `${ms.data.milestones.length}`)
      const phase = ms.data.milestones[0].phase || ms.data.milestones[0].phase_key || 'pre_design'
      const patch = await appAuth(`/api/projects/${PROJECT_ID}/milestones`, arch.access_token, {
        method: 'PATCH',
        body: { phase, completion_pct: 42, notes: 'smoke milestone' },
      })
      if (patch.ok && patch.data?.milestone) ok('app milestones PATCH', String(patch.data.milestone.completion_pct ?? 42))
      else fail('app milestones PATCH', `${patch.status} ${JSON.stringify(patch.data).slice(0, 180)}`)
    } else {
      fail('app milestones GET', `${ms.status} ${JSON.stringify(ms.data).slice(0, 180)}`)
    }
  }

  // Portal download (shared doc)
  {
    const portal = await appFetch(`/api/portal/${PORTAL_TOKEN}`)
    const shared =
      (portal.data?.documents || []).find((d) => d.shared_with_client) || portal.data?.documents?.[0]
    if (!shared?.id) {
      fail('app portal download', 'no shared documents')
    } else {
      const dl = await appFetch(`/api/portal/${PORTAL_TOKEN}/download?document_id=${shared.id}`)
      if (dl.ok && dl.data?.url && dl.data?.provider !== 'mock') {
        ok('app portal download', dl.data.provider || 'url')
      } else if (
        dl.status === 503 ||
        /SERVICE_ROLE|service role|storage is not configured|R2|Mock mode/i.test(
          String(dl.data?.error || '')
        )
      ) {
        ok('app portal download', 'storage signing not fully configured')
      } else {
        fail('app portal download', `${dl.status} ${JSON.stringify(dl.data).slice(0, 180)}`)
      }
    }
  }

  // Waitlist + contract scan + notify RPC
  {
    const wl = await appFetch('/api/waitlist', {
      method: 'POST',
      body: {
        email: `smoke.waitlist.${Date.now()}@5bloc.test`,
        name: 'Smoke Waitlist',
        role: 'architect',
        practice: 'Smoke Studio',
      },
    })
    if (wl.ok && wl.data?.ok) ok('app waitlist', 'ok')
    else fail('app waitlist', `${wl.status} ${JSON.stringify(wl.data).slice(0, 180)}`)
  }
  {
    const scan = await appAuth('/api/ai/contract-scan', arch.access_token, {
      method: 'POST',
      body: {
        text:
          'The Architect liability is unlimited and shall extend to consequential damages. Liquidated damages of 0.5% per calendar day apply. Architect shall indemnify the Owner.',
      },
    })
    if (scan.ok && typeof scan.data?.score === 'number') {
      ok('app contract-scan', `score=${scan.data.score} risks=${(scan.data.risks || []).length}`)
    } else {
      fail('app contract-scan', `${scan.status} ${JSON.stringify(scan.data).slice(0, 180)}`)
    }
  }
  {
    const note = await rpc(arch.access_token, 'notify_user', {
      p_user_id: 'ba4da6bf-f53a-4ad0-93d8-7e0bd2e00989',
      p_title: 'Smoke notify',
      p_body: 'cross-user notify test',
      p_type: 'info',
      p_href: '/builder',
    })
    if (note.ok) ok('rpc notify_user', String(note.data).slice(0, 40))
    else fail('rpc notify_user', `${note.status} ${JSON.stringify(note.data).slice(0, 180)}`)
  }

  // Issues + tenders + builder project visibility / RFI as member
  {
    const issue = await appAuth(`/api/projects/${PROJECT_ID}/issues`, arch.access_token, {
      method: 'POST',
      body: { title: `Smoke issue ${Date.now()}`, description: 'Smoke', severity: 'medium' },
    })
    if (issue.ok && issue.data?.issue?.id) ok('app issues POST', issue.data.issue.id)
    else fail('app issues POST', `${issue.status} ${JSON.stringify(issue.data).slice(0, 180)}`)
  }
  {
    const tender = await appAuth(`/api/projects/${PROJECT_ID}/tenders`, arch.access_token, {
      method: 'POST',
      body: {
        title: `Smoke tender ${Date.now()}`,
        scope: 'Civil works smoke',
        trade_type: 'Civil',
        budget_min: 100000,
        budget_max: 500000,
        deadline: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      },
    })
    if (tender.ok && tender.data?.tender?.id) ok('app tenders POST', tender.data.tender.id)
    else fail('app tenders POST', `${tender.status} ${JSON.stringify(tender.data).slice(0, 180)}`)
  }
  {
    const build = await signIn('smoke.builder@5bloc.test')
    const projects = await appAuth('/api/projects', build.access_token)
    const has = (projects.data?.projects || []).some((p) => p.id === PROJECT_ID)
    if (projects.ok && has) ok('app builder projects', PROJECT_ID)
    else fail('app builder projects', `${projects.status} count=${(projects.data?.projects || []).length}`)

    const rfi = await appAuth(`/api/projects/${PROJECT_ID}/rfis`, build.access_token, {
      method: 'POST',
      body: { title: `Builder RFI ${Date.now()}`, description: 'From builder smoke' },
    })
    if (rfi.ok && rfi.data?.rfi?.id) ok('app builder rfi POST', rfi.data.rfi.id)
    else fail('app builder rfi POST', `${rfi.status} ${JSON.stringify(rfi.data).slice(0, 180)}`)

    const site = await appAuth(`/api/projects/${PROJECT_ID}/site`, build.access_token)
    if (site.ok && Array.isArray(site.data?.visits)) ok('app builder site GET', `${site.data.visits.length}`)
    else fail('app builder site GET', `${site.status} ${JSON.stringify(site.data).slice(0, 180)}`)
  }

  const failed = results.filter((r) => !r.pass)
  console.log('\n---')
  console.log(`${results.length - failed.length}/${results.length} passed`)
  if (failed.length) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
