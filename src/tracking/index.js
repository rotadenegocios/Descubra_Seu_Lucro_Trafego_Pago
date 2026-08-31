// GERADO POR _shared/sync-tracking.mjs - NAO EDITE AQUI
import { currentCtaSource, markLeadSubmitted } from './behavior.js'
import { track } from './client.js'

export { track, getContext, startTracking } from './client.js'
export { TrackingProvider, useTracking } from './react.jsx'
export { PrivacyBar } from './PrivacyBar.jsx'
export { PrivacyNotice } from './PrivacyNotice.jsx'
export { getConsent, setConsent, hasDecision } from './consent.js'
export { isOptedOut, setOptOut } from './optout.js'
export { config } from './config.js'
export { resolveApiPath } from './apiPath.js'

// Chamado pelo modal quando o POST /api/leads responde 201.
export function trackLead({ itemId, itemName, ctaSource, email, phone }) {
  markLeadSubmitted()

  track(
    'generate_lead',
    { cta_source: ctaSource || currentCtaSource(), item_id: itemId, item_name: itemName },
    {
      metaParams: { content_ids: [itemId], content_name: itemName, content_type: 'product' },
      userData: { email, phone },
    },
  )
}

// Chamado imediatamente antes do redirecionamento para o checkout.
export function trackBeginCheckout({ itemId, itemName, checkoutUrl, ctaSource }) {
  let checkoutHost = ''

  try {
    checkoutHost = new URL(checkoutUrl).hostname
  } catch {
    checkoutHost = ''
  }

  track(
    'begin_checkout',
    {
      item_id: itemId,
      item_name: itemName,
      checkout_host: checkoutHost,
      cta_source: ctaSource || currentCtaSource(),
    },
    { metaParams: { content_ids: [itemId], content_name: itemName, content_type: 'product' } },
  )
}
