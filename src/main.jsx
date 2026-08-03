import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PaidTrafficProfitPage } from './PaidTrafficProfitPage.jsx'
import './styles/global.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PaidTrafficProfitPage />
  </StrictMode>,
)
