// GERADO POR _shared/sync-tracking.mjs - NAO EDITE AQUI
import { config, debugLog } from './config.js'
import { consentPayload, getConsent, hasDecision, onConsentChange } from './consent.js'
import { ALLOWED_EVENTS, META_EVENTS } from './events.js'
import {
  getClickIds,
  getMetaIdentifiers,
  getQueryParameters,
  getSession,
  getUserId,
  getVariant,
  uuid,
} from './identity.js'
import {
  applyConsentDefaults,
  gtag,
  loadGa4,
  loadPixel,
  updateConsentSignals,
} from './loaders.js'
import { sendToServer } from './transport.js'

const queue = []
const sentEventIds = new Set()

let context = null
let started = false

function buildContext() {
  const { search, utm } = getQueryParameters()
  const session = getSession()

  return {
    site_id: config.siteId,
    ...getVariant(search),
    ...utm,
    ...getClickIds(search),
    session_id: session.id,
    user_id: getUserId(),
    search,
  }
}

export function getContext() {
  if (!context) context = buildContext()
  return context
}

function sendToGa4(entry) {
  if (!window.dataLayer) return
  gtag('event', entry.name, entry.params)
}

function sendToMeta(entry) {
  const metaName = META_EVENTS[entry.name]
  if (!metaName) return

  if (window.fbq) {
    const method = metaName === 'CTAClick' ? 'trackCustom' : 'track'
    window.fbq(method, metaName, entry.metaParams, { eventID: entry.event_id })
  }

  const { fbp, fbc } = getMetaIdentifiers(getContext().search)

  sendToServer({
    event_name: entry.name,
    event_id: entry.event_id,
    event_time: Math.floor(entry.ts / 1000),
    event_source_url: window.location.href,
    site_id: config.siteId,
    user_id: getContext().user_id,
    consent: consentPayload(),
    params: entry.params,
    user_data: { fbp, fbc, ...(entry.userData || {}) },
  })
}

export function track(name, params = {}, options = {}) {
  if (!config.enabled) return

  try {
    if (!ALLOWED_EVENTS.includes(name)) {
      debugLog('evento fora da whitelist, ignorado:', name)
      return
    }

    const eventId = options.eventId || uuid()
    if (sentEventIds.has(eventId)) return
    sentEventIds.add(eventId)

    const base = getContext()
    const entry = {
      name,
      event_id: eventId,
      ts: Date.now(),
      params: {
        ...params,
        site_id: base.site_id,
        variante: base.variante,
        session_id: base.session_id,
      },
      metaParams: options.metaParams || {},
      userData: options.userData,
    }

    const consent = getConsent()

    // Modo avancado: o GA4 ja roda com consentimento negado (sem cookie).
    if (config.consentMode === 'advanced') sendToGa4(entry)
    else if (consent.analytics) sendToGa4(entry)

    if (consent.ads) sendToMeta(entry)
    else if (!hasDecision()) queue.push(entry)

    debugLog(entry.name, entry.params)
  } catch (error) {
    debugLog('falha ao registrar evento', name, error)
  }
}

function flushQueue(consent) {
  const pending = queue.splice(0, queue.length)

  pending.forEach((entry) => {
    if (config.consentMode === 'basic' && consent.analytics) sendToGa4(entry)
    if (consent.ads) sendToMeta(entry)
  })
}

function applyDecision(consent) {
  updateConsentSignals(consent)

  if (consent.analytics || config.consentMode === 'advanced') loadGa4()
  if (consent.ads) loadPixel({ external_id: getContext().user_id })

  flushQueue(consent)
}

export function startTracking() {
  if (started || !config.enabled) return
  started = true

  applyConsentDefaults()
  if (config.consentMode === 'advanced') loadGa4()

  const consent = getConsent()
  if (consent.decided) applyDecision(consent)

  onConsentChange(applyDecision)
}
