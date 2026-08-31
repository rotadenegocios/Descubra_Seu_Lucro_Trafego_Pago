// GERADO POR _shared/sync-tracking.mjs - NAO EDITE AQUI
import { logEvents } from './logStore.js'
import { metaEventName, sendMetaEvent } from './meta.js'

const MAX_BODY_BYTES = 20000
const MAX_EVENTS = 40
const RATE_LIMIT = 60
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

// Uma requisicao agora carrega um lote, entao o limite conta lotes por minuto.
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

  let payload

  try {
    const raw = typeof request.body === 'string' ? request.body : JSON.stringify(request.body || '')
    if (raw.length > MAX_BODY_BYTES) return done(response)
    payload = parseBody(request.body)
  } catch {
    return done(response)
  }

  const incoming = Array.isArray(payload?.events) ? payload.events : [payload]
  const events = incoming
    .filter((event) => event?.event_name && event.event_id)
    .slice(0, MAX_EVENTS)

  if (!events.length) return done(response)

  const salt = process.env.TRACKING_SALT || ''

  // Log proprio: base legal de legitimo interesse, sem terceiros. Nao depende
  // do aceite, mas o cliente ja nao envia nada de quem exerceu oposicao.
  const logTask = logEvents({
    events: events.filter((event) => event.channel !== 'meta'),
    headers: request.headers,
    salt,
  }).catch(() => undefined)

  // Meta: so com consentimento explicito, revalidado aqui.
  const metaTasks = events
    .filter(
      (event) =>
        event.channel === 'meta' && event.consent?.ads === true && metaEventName(event.event_name),
    )
    .map((event) =>
      sendMetaEvent({
        event,
        clientIp: ip,
        userAgent: request.headers['user-agent'] || '',
      }).catch(() => undefined),
    )

  try {
    await Promise.all([logTask, ...metaTasks])
  } catch {
    // Falha de envio nunca vira erro para a pagina.
  }

  return done(response)
}
