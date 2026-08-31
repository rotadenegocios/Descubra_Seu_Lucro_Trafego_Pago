// GERADO POR _shared/sync-tracking.mjs - NAO EDITE AQUI
import React, { useEffect, useState } from 'react'
import { config } from './config.js'
import { PrivacyNotice } from './PrivacyNotice.jsx'
import './PrivacyBar.css'

const SEEN_KEY = 'rn_privacy_seen'
const VISIBLE_MS = 12000

function wasSeen() {
  try {
    return localStorage.getItem(SEEN_KEY) === String(config.consentVersion)
  } catch {
    return false
  }
}

function markSeen() {
  try {
    localStorage.setItem(SEEN_KEY, String(config.consentVersion))
  } catch {
    // Sem storage a faixa reaparece na proxima visita. Aceitavel.
  }
}

export function PrivacyBar({ contactEmail = '' }) {
  const [isBarVisible, setIsBarVisible] = useState(false)
  const [isNoticeOpen, setIsNoticeOpen] = useState(false)

  useEffect(() => {
    if (!config.enabled || wasSeen()) return undefined

    setIsBarVisible(true)
    const timer = window.setTimeout(() => {
      setIsBarVisible(false)
      markSeen()
    }, VISIBLE_MS)

    return () => window.clearTimeout(timer)
  }, [])

  if (!config.enabled) return null

  function dismiss() {
    setIsBarVisible(false)
    markSeen()
  }

  function openNotice() {
    setIsNoticeOpen(true)
    dismiss()
  }

  return (
    <>
      {isBarVisible && (
        <div className="privacy-bar" role="note">
          <p>
            Medimos a navegação desta página para melhorá-la e para medir nossos anúncios.{' '}
            <button type="button" onClick={openNotice}>
              Saiba mais ou desative
            </button>
          </p>
          <button type="button" className="privacy-bar__dismiss" onClick={dismiss} aria-label="Fechar aviso">
            <span aria-hidden="true">×</span>
          </button>
        </div>
      )}

      {!isBarVisible && (
        <button type="button" className="privacy-bar__pill" onClick={() => setIsNoticeOpen(true)}>
          Privacidade
        </button>
      )}

      <PrivacyNotice
        isOpen={isNoticeOpen}
        onClose={() => setIsNoticeOpen(false)}
        contactEmail={contactEmail}
      />
    </>
  )
}
