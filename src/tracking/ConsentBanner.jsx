// GERADO POR _shared/sync-tracking.mjs - NAO EDITE AQUI
import React, { useEffect, useState } from 'react'
import { config } from './config.js'
import { hasDecision, setConsent } from './consent.js'
import { isOptedOut } from './optout.js'
import { PrivacyNotice } from './PrivacyNotice.jsx'
import './ConsentBanner.css'

export function ConsentBanner({ contactEmail = '' }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isNoticeOpen, setIsNoticeOpen] = useState(false)

  useEffect(() => {
    if (config.enabled && !hasDecision() && !isOptedOut()) setIsVisible(true)
  }, [])

  function decide(accepted) {
    setConsent({ analytics: accepted, ads: accepted })
    setIsVisible(false)
  }

  return (
    <>
      {isVisible && (
        <div className="consent-banner" role="dialog" aria-live="polite" aria-label="Aviso de medição">
          <div className="consent-banner__text">
            <strong>Aceita medir sua visita com a Meta e o Google?</strong>
            <p>
              Se recusar, seguimos com uma medição própria e anônima da navegação, sem enviar nada
              para a Meta.{' '}
              <button type="button" onClick={() => setIsNoticeOpen(true)}>
                Ver o que é medido
              </button>
            </p>
          </div>
          <div className="consent-banner__actions">
            <button type="button" className="consent-banner__deny" onClick={() => decide(false)}>
              Recusar
            </button>
            <button type="button" className="consent-banner__accept" onClick={() => decide(true)}>
              Aceitar
            </button>
          </div>
        </div>
      )}

      <PrivacyNotice
        isOpen={isNoticeOpen}
        onClose={() => setIsNoticeOpen(false)}
        contactEmail={contactEmail}
      />
    </>
  )
}
