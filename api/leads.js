import { neon } from '@neondatabase/serverless'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_PATTERN = /^\+55\d{10,11}$/
const PRODUCT_ID = 'descubra-seu-lucro'
const DEFAULT_DATABASE_NAME = 'leads_descubra_seu_lucro'
let tableInitialization

function parseBody(body) {
  if (typeof body === 'string') return JSON.parse(body)
  if (body && typeof body === 'object') return body
  return {}
}

function cleanText(value, maximumLength) {
  return typeof value === 'string' ? value.trim().slice(0, maximumLength) : ''
}

function cleanUtm(utm) {
  if (!utm || typeof utm !== 'object' || Array.isArray(utm)) return {}

  return Object.fromEntries(
    Object.entries(utm)
      .filter(([key, value]) => key.toLowerCase().startsWith('utm_') && typeof value === 'string')
      .slice(0, 12)
      .map(([key, value]) => [key.toLowerCase().slice(0, 50), value.trim().slice(0, 250)]),
  )
}

function respond(response, status, body) {
  response.setHeader('Cache-Control', 'no-store')
  return response.status(status).json(body)
}

function getDatabaseUrl() {
  const databaseUrl =
    process.env.LEADS_DATABASE_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING

  if (!databaseUrl || process.env.LEADS_DATABASE_URL) return databaseUrl

  const url = new URL(databaseUrl)
  url.pathname = `/${process.env.LEADS_DATABASE_NAME || DEFAULT_DATABASE_NAME}`
  return url.toString()
}

async function saveToNeon(payload, databaseUrl) {
  const sql = neon(databaseUrl)

  if (!tableInitialization) {
    tableInitialization = sql`
      CREATE TABLE IF NOT EXISTS purchase_leads (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        email VARCHAR(254) NOT NULL,
        phone VARCHAR(16) NOT NULL,
        product_id VARCHAR(80) NOT NULL CHECK (product_id = 'descubra-seu-lucro'),
        product_name VARCHAR(120),
        page_url TEXT,
        cta_source VARCHAR(50),
        utm JSONB NOT NULL DEFAULT '{}'::jsonb,
        submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `.catch((error) => {
      tableInitialization = undefined
      throw error
    })
  }

  await tableInitialization
  const utm = JSON.stringify(payload.utm)

  await sql`
    INSERT INTO purchase_leads (
      name,
      email,
      phone,
      product_id,
      product_name,
      page_url,
      cta_source,
      utm,
      submitted_at
    ) VALUES (
      ${payload.name},
      ${payload.email},
      ${payload.phone},
      ${payload.productId},
      ${payload.productName},
      ${payload.pageUrl},
      ${payload.ctaSource},
      ${utm}::jsonb,
      ${payload.submittedAt}
    )
  `
}

async function sendToWebhook(payload) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)

  try {
    const webhookResponse = await fetch(process.env.LEADS_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.LEADS_WEBHOOK_TOKEN
          ? { Authorization: `Bearer ${process.env.LEADS_WEBHOOK_TOKEN}` }
          : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    if (!webhookResponse.ok) throw new Error('Webhook rejected the lead')
  } finally {
    clearTimeout(timeout)
  }
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return respond(response, 405, { error: 'Método não permitido.' })
  }

  let body

  try {
    body = parseBody(request.body)
  } catch {
    return respond(response, 400, { error: 'Dados inválidos.' })
  }

  const name = cleanText(body.name, 120).replace(/\s+/g, ' ')
  const email = cleanText(body.email, 254).toLowerCase()
  const phone = cleanText(body.phone, 16)
  const productId = cleanText(body.productId, 80)

  if (
    name.length < 2 ||
    !EMAIL_PATTERN.test(email) ||
    !PHONE_PATTERN.test(phone) ||
    productId !== PRODUCT_ID
  ) {
    return respond(response, 400, { error: 'Confira os dados informados.' })
  }

  const databaseUrl = getDatabaseUrl()

  if (!databaseUrl && !process.env.LEADS_WEBHOOK_URL) {
    return respond(response, 503, { error: 'O registro de dados está temporariamente indisponível.' })
  }

  const payload = {
    name,
    email,
    phone,
    productId,
    productName: cleanText(body.productName, 120),
    pageUrl: cleanText(body.pageUrl, 1200),
    ctaSource: cleanText(body.ctaSource, 50),
    utm: cleanUtm(body.utm),
    submittedAt: new Date().toISOString(),
  }

  try {
    if (databaseUrl) await saveToNeon(payload, databaseUrl)
    else await sendToWebhook(payload)

    return respond(response, 201, { ok: true })
  } catch {
    return respond(response, 502, { error: 'Não foi possível registrar os dados.' })
  }
}
