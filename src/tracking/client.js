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
import { isOptedOut, onOptOutChange } from './optout.js'
import { flushEvents, installFlushHooks, sendToServer } from './transport.js'

const metaQueue = []
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

// Log first-party: base legal de legitimo interesse, sem terceiros e sem
// dado pessoal identificavel. Roda para quem nao decidiu e para quem recusou.
function sendToOwnLog(entry) {
  const base = getContext()

  sendToServer(
    {
      channel: 'log',
      event_name: entry.name,
      event_id: entry.event_id,
      event_time: Math.floor(entry.ts / 1000),
      page_path: window.location.pathname,
      referrer: document.referrer,
      site_id: base.site_id,
      variante: base.variante,
      session_id: base.session_id,
      visitor_id: base.user_id,
      consent: consentPayload(),
      params: entry.params,
    },
    { immediate: entry.urgent },
  )
}

function sendToMeta(entry) {
  const metaName = META_EVENTS[entry.name]
  if (!metaName) return

  if (window.fbq) {
    const method = metaName === 'CTAClick' ? 'trackCustom' : 'track'
    window.fbq(method, metaName, entry.metaParams, { eventID: entry.event_id })
  }

  const { fbp, fbc } = getMetaIdentifiers(getContext().search)

  sendToServer(
    {
      channel: 'meta',
      event_name: entry.name,
      event_id: entry.event_id,
      event_time: Math.floor(entry.ts / 1000),
      event_source_url: window.location.href,
      site_id: config.siteId,
      user_id: getContext().user_id,
      consent: consentPayload(),
      params: entry.params,
      user_data: { fbp, fbc, ...(entry.userData || {}) },
    },
    { immediate: true },
  )
}

export function track(name, params = {}, options = {}) {
  if (!config.enabled || isOptedOut()) return

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
      urgent: Boolean(options.urgent) || Boolean(META_EVENTS[name]),
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

    sendToOwnLog(entry)

    // Modo avancado: o gtag ja roda com consentimento negado, sem cookie.
    if (config.consentMode === 'advanced') sendToGa4(entry)
    else if (consent.analytics) sendToGa4(entry)

    if (consent.ads) sendToMeta(entry)
    else if (!hasDecision() && META_EVENTS[name]) metaQueue.push(entry)

    debugLog(entry.name, entry.params)
  } catch (error) {
    debugLog('falha ao registrar evento', name, error)
  }
}

function flushMetaQueue(consent) {
  const pending = metaQueue.splice(0, metaQueue.length)
  if (!consent.ads) return

  pending.forEach((entry) => {
    if (config.consentMode === 'basic' && consent.analytics) sendToGa4(entry)
    sendToMeta(entry)
  })
}

function applyDecision(consent) {
  updateConsentSignals(consent)

  if (consent.analytics || config.consentMode === 'advanced') loadGa4()
  if (consent.ads) loadPixel({ external_id: getContext().user_id })

  flushMetaQueue(consent)
}

export function startTracking() {
  if (started || !config.enabled || isOptedOut()) return
  started = true

  applyConsentDefaults()
  if (config.consentMode === 'advanced') loadGa4()
  installFlushHooks()

  const consent = getConsent()
  if (consent.decided) applyDecision(consent)

  onConsentChange(applyDecision)
  onOptOutChange((active) => {
    if (!active) return
    metaQueue.length = 0
    updateConsentSignals({ analytics: false, ads: false })
    flushEvents()
  })
}
