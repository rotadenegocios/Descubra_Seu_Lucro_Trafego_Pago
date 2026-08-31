// GERADO POR _shared/sync-tracking.mjs - NAO EDITE AQUI
import { config, debugLog } from './config.js'

let gtagLoaded = false
let pixelLoaded = false

function injectScript(src) {
  const script = document.createElement('script')
  script.async = true
  script.src = src
  document.head.appendChild(script)
}

export function gtag() {
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push(arguments)
}

// Consent Mode v2. Precisa rodar antes do gtag.js para valer no primeiro hit.
// A medicao e presumida, entao o padrao ja entra concedido; a oposicao do
// visitante rebaixa tudo para denied em seguida.
export function applyConsentDefaults(granted = true) {
  const value = granted ? 'granted' : 'denied'

  gtag('consent', 'default', {
    ad_storage: value,
    ad_user_data: value,
    ad_personalization: value,
    analytics_storage: value,
    functionality_storage: 'granted',
    security_storage: 'granted',
  })
}

export function updateConsentSignals({ analytics, ads }) {
  gtag('consent', 'update', {
    ad_storage: ads ? 'granted' : 'denied',
    ad_user_data: ads ? 'granted' : 'denied',
    ad_personalization: ads ? 'granted' : 'denied',
    analytics_storage: analytics ? 'granted' : 'denied',
  })
}

export function loadGa4() {
  if (gtagLoaded || !config.ga4Id) return

  gtagLoaded = true
  injectScript(`https://www.googletagmanager.com/gtag/js?id=${config.ga4Id}`)
  gtag('js', new Date())
  gtag('config', config.ga4Id, {
    send_page_view: false,
    debug_mode: config.debug,
  })
  debugLog('gtag carregado', config.ga4Id)
}

// Mesmo snippet base da Meta, injetado so depois do aceite.
export function loadPixel(advancedMatching) {
  if (pixelLoaded || !config.pixelIds.length) return

  pixelLoaded = true

  /* eslint-disable */
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
    }
    if (!f._fbq) f._fbq = n
    n.push = n
    n.loaded = !0
    n.version = '2.0'
    n.queue = []
    t = b.createElement(e)
    t.async = !0
    t.src = v
    s = b.getElementsByTagName(e)[0]
    s.parentNode.insertBefore(t, s)
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js')
  /* eslint-enable */

  // Cada pixel inicializado recebe todo fbq('track'), sem chamada extra.
  config.pixelIds.forEach((pixelId) => window.fbq('init', pixelId, advancedMatching || {}))
  debugLog('pixel carregado', config.pixelIds.join(', '))
}

export function isPixelLoaded() {
  return pixelLoaded
}
