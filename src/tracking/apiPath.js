// GERADO POR _shared/sync-tracking.mjs - NAO EDITE AQUI
// O BIO serve as paginas sob um prefixo (/dsl-tf01, /kpc-tf01). As rotas de API
// precisam do mesmo prefixo para nao cair no rewrite de SPA do dominio raiz.
const PREFIX_PATTERN = /^\/[a-z]{2,5}-tf\d{2}(?=\/|$)/

export function resolveApiPath(path) {
  if (typeof window === 'undefined') return path

  const prefix = window.location.pathname.match(PREFIX_PATTERN)
  return prefix ? `${prefix[0]}${path}` : path
}
