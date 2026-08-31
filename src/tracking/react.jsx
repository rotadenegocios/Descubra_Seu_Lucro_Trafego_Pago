// GERADO POR _shared/sync-tracking.mjs - NAO EDITE AQUI
import React, { createContext, useContext, useEffect, useRef } from 'react'
import { initBehavior } from './behavior.js'
import { getContext, startTracking, track } from './client.js'
import { config, debugLog } from './config.js'
import { initVideo } from './video.js'

const TrackingContext = createContext({ track })

export function TrackingProvider({ children, itemId = '', itemName = '' }) {
  const initialized = useRef(false)

  useEffect(() => {
    // StrictMode executa efeitos duas vezes em desenvolvimento.
    if (initialized.current || !config.enabled) return
    initialized.current = true

    try {
      startTracking()

      const context = getContext()
      track('page_view', {
        page_path: window.location.pathname,
        page_location: window.location.href,
        referrer: document.referrer,
      })
      track('variant_assigned', {
        variante: context.variante,
        variant_origin: context.variant_origin,
      })

      initBehavior({ itemId: itemId || config.siteId, itemName })
      initVideo()
    } catch (error) {
      debugLog('falha ao iniciar o rastreio', error)
    }
  }, [itemId, itemName])

  return <TrackingContext.Provider value={{ track }}>{children}</TrackingContext.Provider>
}

export function useTracking() {
  return useContext(TrackingContext)
}
