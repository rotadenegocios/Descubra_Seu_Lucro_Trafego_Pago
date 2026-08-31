// GERADO POR _shared/sync-tracking.mjs - NAO EDITE AQUI
// Direito de oposicao (LGPD art. 18). Quem opta por sair nao e medido por
// nenhum canal, nem pelo log first-party que roda sob legitimo interesse.
const OPTOUT_COOKIE = 'rn_optout'
const listeners = new Set()

function readCookie(name) {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : ''
}

export function isOptedOut() {
  return readCookie(OPTOUT_COOKIE) === '1'
}

export function setOptOut(active) {
  const expires = new Date(Date.now() + 365 * 86400000).toUTCString()

  if (active) {
    document.cookie = `${OPTOUT_COOKIE}=1; expires=${expires}; path=/; SameSite=Lax`
    // Apaga os identificadores ja criados.
    document.cookie = 'rn_uid=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
    document.cookie = 'rn_fbc=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
    try {
      localStorage.removeItem('rn_session')
    } catch {
      // storage indisponivel: nada a limpar
    }
  } else {
    document.cookie = `${OPTOUT_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
  }

  listeners.forEach((listener) => listener(active))
}

export function onOptOutChange(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
