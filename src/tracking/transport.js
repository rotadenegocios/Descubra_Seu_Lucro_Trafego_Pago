// GERADO POR _shared/sync-tracking.mjs - NAO EDITE AQUI
import { resolveApiPath } from './apiPath.js'
import { debugLog } from './config.js'

const MAX_BODY_BYTES = 16000

export function sendToServer(payload) {
  const body = JSON.stringify(payload)

  if (body.length > MAX_BODY_BYTES) {
    debugLog('payload acima do limite, descartado', payload.event_name)
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
