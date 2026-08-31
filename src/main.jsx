import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PaidTrafficProfitPage } from './PaidTrafficProfitPage.jsx'
import { PrivacyBar, TrackingProvider } from './tracking/index.js'
import './styles/global.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TrackingProvider itemName="Método Descubra Seu Lucro">
      <PaidTrafficProfitPage />
      <PrivacyBar />
    </TrackingProvider>
  </StrictMode>,
)
