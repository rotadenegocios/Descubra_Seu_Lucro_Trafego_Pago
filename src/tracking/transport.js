// GERADO POR _shared/sync-tracking.mjs - NAO EDITE AQUI
import { resolveApiPath } from './apiPath.js'
import { debugLog } from './config.js'

const MAX_BODY_BYTES = 16000
const MAX_BATCH = 12
const FLUSH_DELAY_MS = 4000

let buffer = []
let timer = null

function post(events) {
  const body = JSON.stringify({ events })

  if (body.length > MAX_BODY_BYTES) {
    // Corta pela metade em vez de descartar o lote inteiro.
    if (events.length > 1) {
      const middle = Math.ceil(events.length / 2)
      post(events.slice(0, middle))
      post(events.slice(middle))
      return
    }

    debugLog('evento acima do limite, descartado', events[0]?.event_name)
    return
  }

  const url = resolveApiPath('/api/track')

  // sendBeacon sobrevive ao unload e ao redirect para o checkout.
  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'text/plain;charset=UTF-8' })
    if (navigator.sendBeacon(url, blob)) return
  }

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body,
    keepalive: true,
  }).catch(() => {
    // Falha de rede no rastreio nunca escala para a pagina.
  })
}

export function flushEvents() {
  if (timer) {
    window.clearTimeout(timer)
    timer = null
  }

  if (!buffer.length) return

  const events = buffer
  buffer = []
  post(events)
}

// Agrupa eventos para nao gerar uma invocacao serverless por rolagem.
export function sendToServer(payload, { immediate = false } = {}) {
  buffer.push(payload)

  if (immediate || buffer.length >= MAX_BATCH) {
    flushEvents()
    return
  }

  if (timer) return
  timer = window.setTimeout(flushEvents, FLUSH_DELAY_MS)
}

export function installFlushHooks() {
  window.addEventListener('pagehide', flushEvents)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushEvents()
  })
}
