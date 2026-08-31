// GERADO POR _shared/sync-tracking.mjs - NAO EDITE AQUI
import { metaEventName, sendMetaEvent } from './meta.js'

const MAX_BODY_BYTES = 16000
const RATE_LIMIT = 120
const RATE_WINDOW_MS = 60000
const DEFAULT_ORIGIN_SUFFIXES = ['.vercel.app', 'gesieudo.com', 'localhost']

const rateBuckets = new Map()

function parseBody(body) {
  if (typeof body === 'string') return JSON.parse(body)
  if (body && typeof body === 'object') return body
  return {}
}

function clientIp(request) {
  const forwarded = request.headers['x-forwarded-for']
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim()
  return request.socket?.remoteAddress || ''
}

function originAllowed(request) {
  const origin = request.headers.origin
  if (!origin) return true

  const suffixes = (process.env.TRACKING_ALLOWED_ORIGINS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  const allowed = suffixes.length ? suffixes : DEFAULT_ORIGIN_SUFFIXES

  try {
    const hostname = new URL(origin).hostname
    return allowed.some((suffix) => hostname === suffix || hostname.endsWith(suffix))
  } catch {
    return false
  }
}

function withinRateLimit(ip) {
  const now = Date.now()
  const bucket = rateBuckets.get(ip)

  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    if (rateBuckets.size > 5000) rateBuckets.clear()
    return true
  }

  bucket.count += 1
  return bucket.count <= RATE_LIMIT
}

// Sempre responde 204: o navegador nao deve aprender nada sobre a rejeicao.
function done(response) {
  response.setHeader('Cache-Control', 'no-store')
  return response.status(204).end()
}

export async function handleTrack(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return response.status(405).end()
  }

  if (!originAllowed(request)) return done(response)

  const ip = clientIp(request)
  if (!withinRateLimit(ip)) return done(response)

  let event

  try {
    const raw = typeof request.body === 'string' ? request.body : JSON.stringify(request.body || '')
    if (raw.length > MAX_BODY_BYTES) return done(response)
    event = parseBody(request.body)
  } catch {
    return done(response)
  }

  if (!event?.event_name || !event.event_id) return done(response)
  if (!metaEventName(event.event_name)) return done(response)

  // O consentimento vem do cliente e e revalidado aqui: sem aceite, nada sai.
  if (event.consent?.ads !== true) return done(response)

  try {
    await sendMetaEvent({
      event,
      clientIp: ip,
      userAgent: request.headers['user-agent'] || '',
    })
  } catch {
    // Falha de envio nunca vira erro para a pagina.
  }

  return done(response)
}
