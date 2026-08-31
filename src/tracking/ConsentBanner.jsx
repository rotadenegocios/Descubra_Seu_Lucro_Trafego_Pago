// GERADO POR _shared/sync-tracking.mjs - NAO EDITE AQUI
import React, { useEffect, useState } from 'react'
import { config } from './config.js'
import { hasDecision, setConsent } from './consent.js'
import './ConsentBanner.css'

export function ConsentBanner({ privacyUrl = '' }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (config.enabled && !hasDecision()) setIsVisible(true)
  }, [])

  if (!isVisible) return null

  function decide(accepted) {
    setConsent({ analytics: accepted, ads: accepted })
    setIsVisible(false)
  }

  return (
    <div className="consent-banner" role="dialog" aria-live="polite" aria-label="Aviso de cookies">
      <div className="consent-banner__text">
        <strong>Usamos cookies para entender sua navegação.</strong>
        <p>
          Medimos como esta página é usada para melhorá-la e para medir nossos anúncios. Você decide.
          {privacyUrl && (
            <>
              {' '}
              <a href={privacyUrl} target="_blank" rel="noreferrer">
                Política de privacidade
              </a>
            </>
          )}
        </p>
      </div>
      <div className="consent-banner__actions">
        <button type="button" className="consent-banner__deny" onClick={() => decide(false)}>
          Só necessários
        </button>
        <button type="button" className="consent-banner__accept" onClick={() => decide(true)}>
          Aceitar
        </button>
      </div>
    </div>
  )
}
