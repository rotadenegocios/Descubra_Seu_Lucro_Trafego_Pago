// GERADO POR _shared/sync-tracking.mjs - NAO EDITE AQUI
import { track } from './client.js'

const PROGRESS_STEPS = [25, 50, 75]
const PLAYER_ORIGINS = ['https://player.scaleup.com.br', 'https://video.smartplayer.ai']

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

      track('video_complete', {
        video_id: videoLabel(video),
        video_duration_ms: Math.round((video.duration || 0) * 1000),
      })
    },
    true,
  )
}

// Player em iframe cross-origin: so da para ouvir o que ele decidir emitir.
function watchEmbeddedPlayer() {
  let started = false

  window.addEventListener('message', (event) => {
    if (!PLAYER_ORIGINS.includes(event.origin)) return

    const raw = typeof event.data === 'string' ? event.data : JSON.stringify(event.data || '')
    const lowered = raw.toLowerCase()

    if (!started && /"?(play|playing|start)"?/.test(lowered)) {
      started = true
      track('video_start', { video_provider: 'embed', video_id: 'principal' })
      return
    }

    if (/"?(ended|complete|finish)"?/.test(lowered)) {
      track('video_complete', { video_id: 'principal', video_duration_ms: 0 })
    }
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
