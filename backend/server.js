import http from 'node:http'

const port = Number(process.env.PORT) || 3000
const host = process.env.HOST || '0.0.0.0'
const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
)
const limits = new Map()
const maxBodyBytes = 1024 * 1024

function send(response, status, payload) {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff'
  })
  response.end(JSON.stringify(payload))
}

function cors(request, response) {
  const origin = request.headers.origin
  if (origin && allowedOrigins.has(origin)) {
    response.setHeader('access-control-allow-origin', origin)
    response.setHeader('vary', 'Origin')
  }
  response.setHeader('access-control-allow-methods', 'GET,POST,PUT,OPTIONS')
  response.setHeader('access-control-allow-headers', 'authorization,content-type')
}

async function readBody(request) {
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > maxBodyBytes) throw Object.assign(new Error('Request is too large.'), { status: 413 })
    chunks.push(chunk)
  }
  if (!size) return {}
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw Object.assign(new Error('Request body must be valid JSON.'), { status: 400 })
  }
}

function configured() {
  return Boolean(
    process.env.SUPABASE_URL &&
      process.env.SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

function supabaseUrl(path) {
  return `${process.env.SUPABASE_URL.replace(/\/$/, '')}${path}`
}

async function supabaseRequest(path, options = {}) {
  const response = await fetch(supabaseUrl(path), {
    ...options,
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'content-type': 'application/json',
      ...(options.headers || {})
    },
    signal: AbortSignal.timeout(12000)
  })
  const text = await response.text()
  if (!response.ok) throw new Error(`Database request failed (${response.status}).`)
  return text ? JSON.parse(text) : null
}

async function authenticate(request) {
  const token = request.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) return null
  const response = await fetch(supabaseUrl('/auth/v1/user'), {
    headers: {
      apikey: process.env.SUPABASE_ANON_KEY,
      authorization: `Bearer ${token}`
    },
    signal: AbortSignal.timeout(8000)
  })
  if (!response.ok) return null
  const user = await response.json()
  return typeof user.id === 'string' ? user : null
}

function allowRequests(userId, key, maximum, windowMs = 60_000) {
  const now = Date.now()
  const id = `${userId}:${key}`
  const record = limits.get(id)
  if (!record || now - record.startedAt >= windowMs) {
    limits.set(id, { startedAt: now, count: 1 })
    return true
  }
  record.count += 1
  return record.count <= maximum
}

function requireAiConfiguration() {
  if (!process.env.HRX_AI_URL) {
    const error = new Error('HRX AI is not connected to a hosted model yet.')
    error.status = 503
    throw error
  }
}

async function handle(request, response) {
  cors(request, response)
  if (request.method === 'OPTIONS') {
    response.writeHead(204)
    response.end()
    return
  }

  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`)
  if (request.method === 'GET' && url.pathname === '/health') {
    send(response, 200, {
      status: 'ok',
      databaseConfigured: configured(),
      aiConfigured: Boolean(process.env.HRX_AI_URL)
    })
    return
  }

  if (!configured()) {
    send(response, 503, { error: 'Backend setup is incomplete. Configure the Supabase environment.' })
    return
  }

  let user
  try {
    user = await authenticate(request)
  } catch {
    send(response, 503, { error: 'Could not verify the account. Try again shortly.' })
    return
  }
  if (!user) {
    send(response, 401, { error: 'Sign in to Hrishikesh to continue.' })
    return
  }

  try {
    if (url.pathname === '/api/profile' && request.method === 'GET') {
      const query = new URLSearchParams({ user_id: `eq.${user.id}`, select: 'data' })
      const rows = await supabaseRequest(`/rest/v1/browser_profiles?${query}`)
      send(response, 200, { profile: rows?.[0]?.data || null })
      return
    }

    if (url.pathname === '/api/profile' && request.method === 'PUT') {
      const body = await readBody(request)
      if (!body.profile || typeof body.profile !== 'object' || Array.isArray(body.profile)) {
        send(response, 400, { error: 'A profile object is required.' })
        return
      }
      const query = new URLSearchParams({ on_conflict: 'user_id' })
      await supabaseRequest(`/rest/v1/browser_profiles?${query}`, {
        method: 'POST',
        headers: { prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({ user_id: user.id, data: body.profile, updated_at: new Date().toISOString() })
      })
      send(response, 200, { ok: true })
      return
    }

    if (url.pathname === '/api/ai/chat' && request.method === 'POST') {
      if (!allowRequests(user.id, 'chat', 10)) {
        send(response, 429, { error: 'Too many messages. Please wait a minute and try again.' })
        return
      }
      requireAiConfiguration()
      const body = await readBody(request)
      const messages = Array.isArray(body.messages)
        ? body.messages
            .slice(-20)
            .filter((item) => ['user', 'assistant'].includes(item?.role) && typeof item.content === 'string')
            .map((item) => ({ role: item.role, content: item.content.slice(0, 5000) }))
        : []
      const latestQuestion = [...messages].reverse().find((item) => item.role === 'user')
      if (!latestQuestion) {
        send(response, 400, { error: 'Enter a message for HRX AI.' })
        return
      }
      const modelResponse = await fetch(process.env.HRX_AI_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(process.env.HRX_AI_API_KEY
            ? { authorization: `Bearer ${process.env.HRX_AI_API_KEY}` }
            : {})
        },
        body: JSON.stringify({ model: process.env.HRX_AI_MODEL || 'hrx-default', messages, stream: false }),
        signal: AbortSignal.timeout(120_000)
      })
      const modelData = await modelResponse.json().catch(() => ({}))
      if (!modelResponse.ok) {
        send(response, 502, { error: 'The configured AI service could not answer.' })
        return
      }
      const answer = modelData.choices?.[0]?.message?.content || modelData.message?.content || ''
      if (!answer) {
        send(response, 502, { error: 'The AI service returned an empty answer.' })
        return
      }
      const records = [
        { user_id: user.id, role: 'user', content: latestQuestion.content },
        { user_id: user.id, role: 'assistant', content: answer, model: modelData.model || process.env.HRX_AI_MODEL || 'hrx-default' }
      ]
      await supabaseRequest('/rest/v1/hrx_ai_messages', {
        method: 'POST',
        headers: { prefer: 'return=minimal' },
        body: JSON.stringify(records)
      })
      send(response, 200, { answer })
      return
    }

    if (url.pathname === '/api/support' && request.method === 'POST') {
      if (!allowRequests(user.id, 'support', 5)) {
        send(response, 429, { error: 'Please wait before sending another report.' })
        return
      }
      const body = await readBody(request)
      const title = typeof body.title === 'string' ? body.title.trim().slice(0, 120) : ''
      const message = typeof body.message === 'string' ? body.message.trim().slice(0, 5000) : ''
      if (!title || !message) {
        send(response, 400, { error: 'Add a short title and describe the problem.' })
        return
      }
      const rows = await supabaseRequest('/rest/v1/support_tickets', {
        method: 'POST',
        headers: { prefer: 'return=representation' },
        body: JSON.stringify({ user_id: user.id, email: user.email || null, title, message })
      })
      send(response, 201, { ok: true, ticketId: rows?.[0]?.id || null })
      return
    }

    if (url.pathname === '/api/support' && request.method === 'GET') {
      const admins = (process.env.SUPPORT_ADMIN_EMAILS || '')
        .split(',')
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean)
      if (!user.email || !admins.includes(user.email.toLowerCase())) {
        send(response, 403, { error: 'Admin access is required.' })
        return
      }
      const query = new URLSearchParams({ select: '*', order: 'created_at.desc', limit: '100' })
      const tickets = await supabaseRequest(`/rest/v1/support_tickets?${query}`)
      send(response, 200, { tickets })
      return
    }

    send(response, 404, { error: 'That backend route was not found.' })
  } catch (error) {
    const status = Number.isInteger(error.status) ? error.status : 503
    if (status >= 500) console.error(`[backend] ${url.pathname}: ${error.message}`)
    send(response, status, { error: status >= 500 ? 'The backend could not finish that request.' : error.message })
  }
}

http.createServer((request, response) => {
  void handle(request, response).catch((error) => {
    console.error(`[backend] request failed: ${error.message}`)
    if (!response.headersSent) send(response, 500, { error: 'Unexpected backend error.' })
    else response.end()
  })
}).listen(port, host, () => {
  console.log(`Hrishikesh API listening on ${host}:${port}`)
})
