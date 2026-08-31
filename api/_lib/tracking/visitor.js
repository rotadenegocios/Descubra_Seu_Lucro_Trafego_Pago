// GERADO POR _shared/sync-tracking.mjs - NAO EDITE AQUI
import { createHash } from 'node:crypto'

// Sinais grosseiros de propósito: quanto menos granular, menor a chance de
// o conjunto virar impressão digital do visitante.
export function parseUserAgent(userAgent = '') {
  const ua = userAgent.toLowerCase()

  const device = /ipad|tablet/.test(ua)
    ? 'tablet'
    : /mobi|android|iphone/.test(ua)
      ? 'mobile'
      : 'desktop'

  const os = /iphone|ipad|ios/.test(ua)
    ? 'iOS'
    : /android/.test(ua)
      ? 'Android'
      : /windows/.test(ua)
        ? 'Windows'
        : /mac os/.test(ua)
          ? 'macOS'
          : /linux/.test(ua)
            ? 'Linux'
            : 'outro'

  const browser = /edg\//.test(ua)
    ? 'Edge'
    : /opr\/|opera/.test(ua)
      ? 'Opera'
      : /chrome|crios/.test(ua)
        ? 'Chrome'
        : /firefox|fxios/.test(ua)
          ? 'Firefox'
          : /safari/.test(ua)
            ? 'Safari'
            : 'outro'

  return { device, os, browser }
}

// Geolocalizacao vem dos cabecalhos da borda da Vercel. O IP cru nunca e
// gravado: so cidade, regiao e pais.
export function geoFromHeaders(headers = {}) {
  const decode = (value) => {
    if (!value) return ''
    try {
      return decodeURIComponent(value).slice(0, 80)
    } catch {
      return String(value).slice(0, 80)
    }
  }

  return {
    country: (headers['x-vercel-ip-country'] || '').slice(0, 8),
    region: decode(headers['x-vercel-ip-country-region']),
    city: decode(headers['x-vercel-ip-city']),
  }
}

export function pseudonymize(value, salt) {
  if (!value) return ''
  return createHash('sha256').update(`${salt}:${value}`).digest('hex').slice(0, 32)
}

export function referrerDomain(referrer = '') {
  try {
    return new URL(referrer).hostname.slice(0, 120)
  } catch {
    return ''
  }
}
