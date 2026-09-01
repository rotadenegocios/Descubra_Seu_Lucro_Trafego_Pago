// GERADO POR _shared/sync-tracking.mjs - NAO EDITE AQUI
import { track } from './client.js'

const SCROLL_STEPS = [25, 50, 75, 90, 100]

let initialized = false
let sectionObserver = null
let heroObserver = null
let pendingHero = null
let measureScroll = () => {}

const state = {
  startedAt: Date.now(),
  engagedMs: 0,
  lastVisibleAt: Date.now(),
  maxScroll: 0,
  reachedSteps: new Set(),
  sectionsViewed: new Set(),
  lastSection: '',
  lastCtaSource: '',
  form: null,
  leadSubmitted: false,
  exited: false,
}

function sectionIdOf(element) {
  const match = Array.from(element.classList).find(
    (name) => name.endsWith('-section') && name !== 'sales-section',
  )
  return match ? match.replace(/-section$/, '') : ''
}

function scrollPercent() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight
  if (scrollable <= 0) return 100
  return Math.min(100, Math.round((window.scrollY / scrollable) * 100))
}

function engagedMs() {
  const visibleNow = document.visibilityState === 'visible' ? Date.now() - state.lastVisibleAt : 0
  return state.engagedMs + visibleNow
}

function watchScroll() {
  let ticking = false

  function measure() {
    ticking = false
    const percent = scrollPercent()
    state.maxScroll = Math.max(state.maxScroll, percent)

    SCROLL_STEPS.forEach((step) => {
      if (percent >= step && !state.reachedSteps.has(step)) {
        state.reachedSteps.add(step)
        track('scroll_depth', {
          percent_scrolled: step,
          time_to_reach_ms: Date.now() - state.startedAt,
        })
      }
    })
  }

  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return
      ticking = true
      window.requestAnimationFrame(measure)
    },
    { passive: true },
  )

  measureScroll = measure
  measure()
}

// Observa as secoes ja presentes e as que chegam depois: numa SPA a pagina
// seguinte so entra no DOM apos a navegacao.
function observeSectionsIn(root) {
  if (!sectionObserver || root?.nodeType !== 1) return

  if (root.matches?.('[class*="-section"]')) sectionObserver.observe(root)
  root.querySelectorAll?.('[class*="-section"]').forEach((section) => sectionObserver.observe(section))
}

function watchSections() {
  if (!('IntersectionObserver' in window)) return

  const enteredAt = new Map()
  const timers = new Map()

  sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const sectionId = sectionIdOf(entry.target)
        if (!sectionId) return

        if (entry.isIntersecting) {
          enteredAt.set(sectionId, Date.now())
          timers.set(
            sectionId,
            window.setTimeout(() => {
              if (state.sectionsViewed.has(sectionId)) return
              state.sectionsViewed.add(sectionId)
              state.lastSection = sectionId
              track('section_view', {
                section_id: sectionId,
                section_index: state.sectionsViewed.size,
                time_to_view_ms: Date.now() - state.startedAt,
              })
            }, 1000),
          )
          return
        }

        window.clearTimeout(timers.get(sectionId))

        const start = enteredAt.get(sectionId)
        if (!start || !state.sectionsViewed.has(sectionId)) return

        enteredAt.delete(sectionId)
        state.lastSection = sectionId
        track('section_exit', { section_id: sectionId, dwell_ms: Date.now() - start })
      })
    },
    { threshold: 0.5 },
  )

  observeSectionsIn(document.body)
}

function observeHeroIn(root) {
  if (!pendingHero || !heroObserver || root?.nodeType !== 1) return

  const hero = root.matches?.('.sales-hero') ? root : root.querySelector?.('.sales-hero')
  if (hero) heroObserver.observe(hero)
}

// Rearmavel: cada pagina do funil tem o seu proprio view_item.
function watchHero(itemId, itemName) {
  if (!('IntersectionObserver' in window)) return

  heroObserver?.disconnect()
  pendingHero = { itemId, itemName }

  heroObserver = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting) || !pendingHero) return

      const { itemId: id, itemName: name } = pendingHero
      pendingHero = null
      heroObserver.disconnect()

      track(
        'view_item',
        { item_id: id, item_name: name },
        { metaParams: { content_ids: [id], content_name: name, content_type: 'product' } },
      )
    },
    { threshold: 0.4 },
  )

  observeHeroIn(document.body)
}

// Uma unica escuta do DOM alimenta secoes e hero que chegam depois.
function watchDom() {
  if (!('MutationObserver' in window)) return

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        observeSectionsIn(node)
        observeHeroIn(node)
      })
    })
  })

  observer.observe(document.body, { childList: true, subtree: true })
}

function watchClicks() {
  document.addEventListener(
    'click',
    (event) => {
      const cta = event.target.closest?.('[data-cta-source]')

      if (cta) {
        state.lastCtaSource = cta.dataset.ctaSource || ''
        track(
          'cta_click',
          {
            cta_source: state.lastCtaSource,
            cta_text: (cta.innerText || '').trim().slice(0, 80),
            scroll_at_click: scrollPercent(),
            time_to_click_ms: Date.now() - state.startedAt,
          },
          { metaParams: { cta_source: state.lastCtaSource } },
        )
        return
      }

      const tab = event.target.closest?.('[role="tab"]')
      if (tab) {
        track('tab_change', { tab_label: (tab.innerText || '').trim().slice(0, 60) })
        return
      }

      const link = event.target.closest?.('a[href]')
      if (!link) return

      let url
      try {
        url = new URL(link.href, window.location.href)
      } catch {
        return
      }

      if (url.hostname === window.location.hostname) return

      const isWhatsapp = /whatsapp\.com$/.test(url.hostname)
      track(isWhatsapp ? 'whatsapp_click' : 'outbound_click', {
        link_domain: url.hostname,
        link_url: url.href.slice(0, 400),
      })
    },
    true,
  )
}

function watchDetails() {
  document.addEventListener(
    'toggle',
    (event) => {
      const details = event.target
      if (details.tagName !== 'DETAILS' || !details.open) return

      track('faq_open', {
        question: (details.querySelector('summary')?.innerText || '').trim().slice(0, 120),
      })
    },
    true,
  )
}

function resetFormState() {
  state.form = { openedAt: Date.now(), fields: new Set(), focused: new Set(), lastField: '' }
  state.leadSubmitted = false
}

function watchForm() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType !== 1 || !node.classList?.contains('purchase-modal')) return
        resetFormState()
        track('form_open', { cta_source: state.lastCtaSource })
      })

      mutation.removedNodes.forEach((node) => {
        if (node.nodeType !== 1 || !node.classList?.contains('purchase-modal')) return
        if (!state.form || state.leadSubmitted) return

        track('form_abandon', {
          fields_filled: state.form.fields.size,
          last_field: state.form.lastField,
          time_in_form_ms: Date.now() - state.form.openedAt,
        })
        state.form = null
      })
    })
  })

  observer.observe(document.body, { childList: true, subtree: true })

  document.addEventListener(
    'focusin',
    (event) => {
      const field = event.target.closest?.('.purchase-form [name]')
      if (!field || !state.form) return

      const name = field.name
      state.form.lastField = name
      if (state.form.focused.has(name)) return

      state.form.focused.add(name)
      track('form_field_focus', { field: name })
    },
    true,
  )

  document.addEventListener(
    'input',
    (event) => {
      const field = event.target.closest?.('.purchase-form [name]')
      if (!field || !state.form) return

      state.form.lastField = field.name
      if (field.value.trim()) state.form.fields.add(field.name)
      else state.form.fields.delete(field.name)
    },
    true,
  )

  // O modal ja marca aria-invalid quando a validacao reprova o campo.
  const errorObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      const field = mutation.target
      if (field.getAttribute('aria-invalid') !== 'true' || !field.name) return

      const message = document.getElementById(field.getAttribute('aria-describedby') || '')
      track('form_field_error', {
        field: field.name,
        error: (message?.innerText || '').trim().slice(0, 120),
      })
    })
  })

  errorObserver.observe(document.body, {
    subtree: true,
    attributes: true,
    attributeFilter: ['aria-invalid'],
  })
}

export function reportExit(exitType) {
  if (state.exited) return
  state.exited = true

  track('page_exit', {
    exit_type: exitType,
    time_on_page_ms: Date.now() - state.startedAt,
    engaged_time_ms: engagedMs(),
    max_scroll: state.maxScroll,
    sections_viewed: state.sectionsViewed.size,
    last_section: state.lastSection,
  })
}

function watchExit() {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      state.engagedMs += Date.now() - state.lastVisibleAt
      reportExit('hidden')
      return
    }

    state.lastVisibleAt = Date.now()
    state.exited = false
  })

  window.addEventListener('pagehide', () => reportExit('pagehide'))
}

// Navegacao de SPA: a pagina seguinte recomeca a contagem sem recarregar.
export function resetForPage({ itemId, itemName }) {
  const now = Date.now()

  state.startedAt = now
  state.lastVisibleAt = now
  state.engagedMs = 0
  state.maxScroll = 0
  state.reachedSteps = new Set()
  state.sectionsViewed = new Set()
  state.lastSection = ''
  state.lastCtaSource = ''
  state.form = null
  state.leadSubmitted = false
  state.exited = false

  watchHero(itemId, itemName)
  observeSectionsIn(document.body)
  measureScroll()
}

export function markLeadSubmitted() {
  state.leadSubmitted = true
}

export function currentCtaSource() {
  return state.lastCtaSource
}

export function initBehavior({ itemId, itemName }) {
  // Os listeners sao globais: registrar duas vezes duplicaria todo evento.
  if (initialized) {
    resetForPage({ itemId, itemName })
    return
  }
  initialized = true

  watchScroll()
  watchSections()
  watchHero(itemId, itemName)
  watchDom()
  watchClicks()
  watchDetails()
  watchForm()
  watchExit()
}
