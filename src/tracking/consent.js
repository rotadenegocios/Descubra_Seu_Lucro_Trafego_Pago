// GERADO POR _shared/sync-tracking.mjs - NAO EDITE AQUI
import { config } from './config.js'

const STORAGE_KEY = 'rn_consent'
const listeners = new Set()

let state = null

function read() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (!stored || stored.version !== config.consentVersion) return null
    return stored
  } catch {
    return null
  }
}

export function getConsent() {
  if (state === null) state = read()
  return state || { version: config.consentVersion, analytics: false, ads: false, decided: false }
}

export function hasDecision() {
  return Boolean(getConsent().decided)
}

export function setConsent({ analytics, ads }) {
  state = {
    version: config.consentVersion,
    analytics: Boolean(analytics),
    ads: Boolean(ads),
    decided: true,
    ts: Date.now(),
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Modo privado sem storage: a decisao vale para esta pagina.
  }

  listeners.forEach((listener) => listener(state))
  return state
}

export function onConsentChange(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function consentPayload() {
  const consent = getConsent()
  return { analytics: consent.analytics, ads: consent.ads }
}
