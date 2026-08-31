// GERADO POR _shared/sync-tracking.mjs - NAO EDITE AQUI
const env = import.meta.env || {}

function flag(value, fallback = false) {
  if (value === undefined || value === '') return fallback
  return String(value).toLowerCase() === 'true'
}

export const config = Object.freeze({
  enabled: flag(env.VITE_TRACKING_ENABLED, false),
  siteId: env.VITE_SITE_ID || 'desconhecido',
  ga4Id: env.VITE_GA4_MEASUREMENT_ID || '',
  pixelId: env.VITE_META_PIXEL_ID || '',
  consentMode: env.VITE_CONSENT_MODE === 'basic' ? 'basic' : 'advanced',
  debug: flag(env.VITE_TRACKING_DEBUG, false),
  consentVersion: 1,
  sessionTimeoutMs: 30 * 60 * 1000,
  identityMaxAgeDays: 365,
})

export function debugLog(...args) {
  if (config.debug) console.info('[tracking]', ...args)
}
