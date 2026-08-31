// GERADO POR _shared/sync-tracking.mjs - NAO EDITE AQUI
import { geoFromHeaders, parseUserAgent, pseudonymize, referrerDomain } from './visitor.js'

const RETENTION_MONTHS = 12
const PURGE_CHANCE = 0.01
const PARAM_LIMIT = 20

// Nunca gravadas no log: sao dados pessoais e so existem no caminho da Meta.
const BLOCKED_PARAMS = ['email', 'phone', 'name', 'em', 'ph', 'fbp', 'fbc', 'user_data']

let tableInitialization

// Sem TRACKING_DATABASE_NAME o log cai no banco padrao da conexao (neondb),
// compartilhado pelos sites: a coluna site_id separa a origem.
function getDatabaseUrl() {
  const databaseUrl =
    process.env.TRACKING_DATABASE_URL ||
    process.env.LEADS_DATABASE_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING

  if (!databaseUrl || process.env.TRACKING_DATABASE_URL || process.env.LEADS_DATABASE_URL) {
    return databaseUrl
  }

  const databaseName = process.env.TRACKING_DATABASE_NAME || process.env.LEADS_DATABASE_NAME
  if (!databaseName) return databaseUrl

  const url = new URL(databaseUrl)
  url.pathname = `/${databaseName}`
  return url.toString()
}

async function ensureTable(sql) {
  if (!tableInitialization) {
    tableInitialization = sql`
      CREATE TABLE IF NOT EXISTS tracking_events (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        event_name VARCHAR(60) NOT NULL,
        event_id VARCHAR(64) NOT NULL,
        site_id VARCHAR(60) NOT NULL,
        variante VARCHAR(60),
        session_id VARCHAR(64),
        visitor_id VARCHAR(64),
        page_path VARCHAR(300),
        referrer_domain VARCHAR(120),
        device VARCHAR(20),
        os VARCHAR(40),
        browser VARCHAR(40),
        country VARCHAR(8),
        region VARCHAR(80),
        city VARCHAR(80),
        consent_ads BOOLEAN,
        consent_analytics BOOLEAN,
        params JSONB NOT NULL DEFAULT '{}'::jsonb,
        occurred_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `
      .then(() =>
        Promise.all([
          sql`CREATE INDEX IF NOT EXISTS tracking_events_site_time ON tracking_events (site_id, occurred_at DESC)`,
          sql`CREATE INDEX IF NOT EXISTS tracking_events_session ON tracking_events (session_id)`,
          sql`CREATE UNIQUE INDEX IF NOT EXISTS tracking_events_unique ON tracking_events (event_id)`,
        ]),
      )
      .catch((error) => {
        tableInitialization = undefined
        throw error
      })
  }

  await tableInitialization
}

function cleanParams(params) {
  if (!params || typeof params !== 'object' || Array.isArray(params)) return {}

  return Object.fromEntries(
    Object.entries(params)
      .filter(([key, value]) => {
        if (BLOCKED_PARAMS.includes(key.toLowerCase())) return false
        return ['string', 'number', 'boolean'].includes(typeof value)
      })
      .slice(0, PARAM_LIMIT)
      .map(([key, value]) => [
        key.slice(0, 40),
        typeof value === 'string' ? value.slice(0, 250) : value,
      ]),
  )
}

async function purgeOldRows(sql) {
  if (Math.random() > PURGE_CHANCE) return

  await sql`
    DELETE FROM tracking_events
    WHERE created_at < NOW() - (${RETENTION_MONTHS} || ' months')::interval
  `.catch(() => {
    // Expurgo e melhor esforco: nao pode derrubar a gravacao.
  })
}

export async function logEvents({ events, headers, salt }) {
  if (process.env.TRACKING_LOG_ENABLED !== 'true') return { skipped: 'log_desligado' }

  const databaseUrl = getDatabaseUrl()
  if (!databaseUrl) return { skipped: 'sem_banco' }
  if (!events.length) return { skipped: 'lote_vazio' }

  // Import tardio: com o log desligado o driver nem e carregado.
  const { neon } = await import('@neondatabase/serverless')
  const sql = neon(databaseUrl)
  await ensureTable(sql)

  const { device, os, browser } = parseUserAgent(headers['user-agent'] || '')
  const geo = geoFromHeaders(headers)

  for (const event of events) {
    const params = cleanParams(event.params)

    await sql`
      INSERT INTO tracking_events (
        event_name, event_id, site_id, variante, session_id, visitor_id,
        page_path, referrer_domain, device, os, browser,
        country, region, city, consent_ads, consent_analytics, params, occurred_at
      ) VALUES (
        ${String(event.event_name).slice(0, 60)},
        ${String(event.event_id).slice(0, 64)},
        ${String(event.site_id || '').slice(0, 60)},
        ${String(event.variante || '').slice(0, 60)},
        ${pseudonymize(event.session_id, salt)},
        ${pseudonymize(event.visitor_id, salt)},
        ${String(event.page_path || '').slice(0, 300)},
        ${referrerDomain(event.referrer)},
        ${device}, ${os}, ${browser},
        ${geo.country}, ${geo.region}, ${geo.city},
        ${Boolean(event.consent?.ads)},
        ${Boolean(event.consent?.analytics)},
        ${JSON.stringify(params)}::jsonb,
        to_timestamp(${Number(event.event_time) || Math.floor(Date.now() / 1000)})
      )
      ON CONFLICT (event_id) DO NOTHING
    `
  }

  await purgeOldRows(sql)
  return { ok: true, count: events.length }
}
