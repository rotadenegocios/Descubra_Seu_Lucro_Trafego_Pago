// GERADO POR _shared/sync-tracking.mjs - NAO EDITE AQUI
import { config } from './config.js'
import { isOptedOut } from './optout.js'

const UID_COOKIE = 'rn_uid'
const FBC_COOKIE = 'rn_fbc'
const SESSION_KEY = 'rn_session'

export function uuid() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID()

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (window.crypto?.getRandomValues(new Uint8Array(1))[0] || Math.random() * 256) & 15
    const value = char === 'x' ? random : (random & 0x3) | 0x8
    return value.toString(16)
  })
}

function readCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : ''
}

function writeCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 86400000).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

function safeStorage(action, fallback) {
  try {
    return action()
  } catch {
    return fallback
  }
}

export function getUserId() {
  if (isOptedOut()) return ''

  let id = readCookie(UID_COOKIE)

  if (!id) {
    id = uuid()
    writeCookie(UID_COOKIE, id, config.identityMaxAgeDays)
  }

  return id
}

export function getSession() {
  const now = Date.now()
  const stored = safeStorage(() => JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'), null)
  const isAlive = stored && now - stored.lastSeen < config.sessionTimeoutMs
  const session = isAlive
    ? { id: stored.id, startedAt: stored.startedAt, lastSeen: now }
    : { id: uuid(), startedAt: now, lastSeen: now }

  safeStorage(() => localStorage.setItem(SESSION_KEY, JSON.stringify(session)))
  return session
}

export function getQueryParameters() {
  const search = new URLSearchParams(window.location.search)
  const utm = {}

  search.forEach((value, key) => {
    if (key.toLowerCase().startsWith('utm_')) utm[key.toLowerCase()] = value.slice(0, 250)
  })

  return { search, utm }
}

export function getVariant(search) {
  const explicit = search.get('variante')
  if (explicit) return { variante: explicit.slice(0, 60), variant_origin: 'query' }

  const fromUtm = search.get('utm_content')
  if (fromUtm) return { variante: fromUtm.slice(0, 60), variant_origin: 'utm' }

  return { variante: 'default', variant_origin: 'default' }
}

// _fbp e _fbc pertencem ao host que os criou. Sob o proxy do BIO o pixel nao
// consegue grava-los, entao o fbclid da URL vira um _fbc proprio.
export function getMetaIdentifiers(search) {
  const fbp = readCookie('_fbp')
  const cookieFbc = readCookie('_fbc')
  const fbclid = search.get('fbclid')

  if (cookieFbc) return { fbp, fbc: cookieFbc }

  const storedFbc = readCookie(FBC_COOKIE)
  if (storedFbc && !fbclid) return { fbp, fbc: storedFbc }

  if (!fbclid) return { fbp, fbc: '' }

  const fbc = `fb.1.${Date.now()}.${fbclid}`
  writeCookie(FBC_COOKIE, fbc, 90)
  return { fbp, fbc }
}

export function getClickIds(search) {
  return {
    gclid: search.get('gclid') || '',
    fbclid: search.get('fbclid') || '',
  }
}
