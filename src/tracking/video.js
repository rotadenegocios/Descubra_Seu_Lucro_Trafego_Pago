// GERADO POR _shared/sync-tracking.mjs - NAO EDITE AQUI
import { debugLog } from './config.js'
import { track } from './client.js'

const PROGRESS_STEPS = [25, 50, 75]
const PLAYER_ORIGINS = ['https://player.scaleup.com.br', 'https://video.smartplayer.ai']

const START_NAMES = ['play', 'playing', 'start', 'started', 'videoplay', 'onplay']
const END_NAMES = ['ended', 'complete', 'completed', 'finish', 'finished', 'onended']

const seen = new WeakMap()

function videoLabel(element) {
  return (
    element.getAttribute('data-video-id') ||
    element.closest('[aria-label]')?.getAttribute('aria-label')?.slice(0, 80) ||
    'principal'
  )
}

// Eventos de midia nao borbulham, mas capturam: nao e preciso tocar no componente.
function watchNativeVideo() {
  document.addEventListener(
    'play',
    (event) => {
      const video = event.target
      if (video.tagName !== 'VIDEO' || seen.has(video)) return

      seen.set(video, new Set())
      track('video_start', { video_provider: 'html5', video_id: videoLabel(video) })
    },
    true,
  )

  document.addEventListener(
    'timeupdate',
    (event) => {
      const video = event.target
      if (video.tagName !== 'VIDEO' || !video.duration) return

      const reached = seen.get(video)
      if (!reached) return

      const percent = Math.round((video.currentTime / video.duration) * 100)

      PROGRESS_STEPS.forEach((step) => {
        if (percent < step || reached.has(step)) return
        reached.add(step)
        track('video_progress', { video_percent: step, video_id: videoLabel(video) })
      })
    },
    true,
  )

  document.addEventListener(
    'ended',
    (event) => {
      const video = event.target
      if (video.tagName !== 'VIDEO') return

      const reached = seen.get(video)
      if (!reached || reached.has('ended')) return
      reached.add('ended')

      track('video_complete', {
        video_id: videoLabel(video),
        video_duration_ms: Math.round((video.duration || 0) * 1000),
      })
    },
    true,
  )
}

// O player em iframe nao documenta o protocolo. Em vez de procurar a palavra
// em qualquer lugar do texto, so aceitamos o nome exato em um campo conhecido.
function playerEventName(data) {
  let parsed = data

  if (typeof parsed === 'string') {
    const text = parsed.trim()

    try {
      parsed = JSON.parse(text)
    } catch {
      // Mensagem simples: so vale se a string inteira for o nome do evento.
      return text.toLowerCase()
    }
  }

  if (!parsed || typeof parsed !== 'object') return ''

  const field = ['event', 'type', 'name', 'action', 'message', 'state'].find(
    (key) => typeof parsed[key] === 'string',
  )

  return field ? parsed[field].trim().toLowerCase() : ''
}

function watchEmbeddedPlayer() {
  let started = false
  let completed = false

  window.addEventListener('message', (event) => {
    if (!PLAYER_ORIGINS.includes(event.origin)) return
    if (started && completed) return

    const name = playerEventName(event.data)
    if (!name) return

    if (!started && START_NAMES.includes(name)) {
      started = true
      track('video_start', { video_provider: 'embed', video_id: 'principal' })
      return
    }

    if (!completed && END_NAMES.includes(name)) {
      completed = true
      track('video_complete', { video_id: 'principal', video_duration_ms: 0 })
      return
    }

    debugLog('mensagem do player ignorada:', name)
  })

  // Fallback: perda de foco da janela com o ponteiro sobre o player indica play.
  let pointerOverPlayer = false

  document.addEventListener('mouseover', (event) => {
    pointerOverPlayer = Boolean(event.target.closest?.('.video-frame'))
  })

  window.addEventListener('blur', () => {
    if (started || !pointerOverPlayer) return
    started = true
    track('video_engaged', { signal: 'focus_loss' })
  })
}

export function initVideo() {
  watchNativeVideo()
  watchEmbeddedPlayer()
}
