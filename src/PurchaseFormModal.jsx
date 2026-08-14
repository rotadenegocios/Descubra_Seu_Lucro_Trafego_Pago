import React, { useEffect, useRef, useState } from 'react'
import './styles/purchase-form-modal.css'

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
}

function cleanName(value) {
  return value.trim().replace(/\s+/g, ' ')
}

function phoneDigits(value) {
  const digits = value.replace(/\D/g, '')
  return digits.startsWith('55') && digits.length >= 12 ? digits.slice(2) : digits
}

function normalizePhone(value) {
  return `+55${phoneDigits(value)}`
}

function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 13)
  const hasCountryCode = digits.startsWith('55') && digits.length >= 12
  const local = hasCountryCode ? digits.slice(2) : digits.slice(0, 11)
  const prefix = hasCountryCode ? '+55 ' : ''

  if (!local) return prefix
  if (local.length <= 2) return `${prefix}(${local}`

  const ddd = local.slice(0, 2)
  const number = local.slice(2)
  const firstBlockLength = number.length > 8 ? 5 : 4
  const firstBlock = number.slice(0, firstBlockLength)
  const secondBlock = number.slice(firstBlockLength, firstBlockLength + 4)

  return `${prefix}(${ddd}) ${firstBlock}${secondBlock ? `-${secondBlock}` : ''}`
}

function validate(values) {
  const errors = {}
  const name = cleanName(values.name)
  const email = values.email.trim()
  const phone = phoneDigits(values.phone)

  if (name.length < 2) {
    errors.name = 'Informe seu nome completo.'
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Informe um e-mail válido.'
  }

  if (!/^\d{10,11}$/.test(phone)) {
    errors.phone = 'Informe um telefone com DDD.'
  }

  return errors
}

function getUtmParameters() {
  const utm = {}
  const search = new URLSearchParams(window.location.search)

  search.forEach((value, key) => {
    if (key.toLowerCase().startsWith('utm_')) {
      utm[key.toLowerCase()] = value
    }
  })

  return utm
}

function isCheckoutUrlReady(url) {
  return /^https?:\/\//i.test(url || '')
}

export function PurchaseFormModal({
  isOpen,
  onClose,
  page,
  ctaSource,
  returnFocusRef,
}) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const dialogRef = useRef(null)
  const firstInputRef = useRef(null)
  const submissionRef = useRef(false)

  useEffect(() => {
    if (!isOpen) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusFrame = window.requestAnimationFrame(() => firstInputRef.current?.focus())

    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.body.style.overflow = previousOverflow
      returnFocusRef.current?.focus()
    }
  }, [isOpen, returnFocusRef])

  if (!isOpen) return null

  const checkoutReady = isCheckoutUrlReady(page.checkoutUrl)

  function resetAndClose() {
    if (submissionRef.current) return

    setForm(EMPTY_FORM)
    setErrors({})
    setFormError('')
    onClose()
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) resetAndClose()
  }

  function handleDialogKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault()
      resetAndClose()
      return
    }

    if (event.key !== 'Tab') return

    const focusable = Array.from(
      dialogRef.current?.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      ) || [],
    )

    if (!focusable.length) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  function updateField(event) {
    const { name, value } = event.target
    const nextValue = name === 'phone' ? formatPhone(value) : value

    setForm((current) => ({ ...current, [name]: nextValue }))
    setErrors((current) => ({ ...current, [name]: undefined }))
    setFormError('')
  }

  function handleBlur(event) {
    const { name } = event.target
    const normalizedForm = name === 'name' ? { ...form, name: cleanName(form.name) } : form
    const nextErrors = validate(normalizedForm)

    if (name === 'name') setForm(normalizedForm)
    setErrors((current) => ({ ...current, [name]: nextErrors[name] }))
  }

  function goToCheckout() {
    if (!checkoutReady) return
    setForm(EMPTY_FORM)
    window.location.assign(page.checkoutUrl)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (submissionRef.current) return

    const normalizedForm = {
      name: cleanName(form.name),
      email: form.email.trim().toLowerCase(),
      phone: form.phone,
    }
    const nextErrors = validate(normalizedForm)

    setForm(normalizedForm)
    setErrors(nextErrors)
    setFormError('')

    if (Object.keys(nextErrors).length) {
      const firstInvalidField = Object.keys(nextErrors)[0]
      dialogRef.current?.querySelector(`[name="${firstInvalidField}"]`)?.focus()
      return
    }

    if (!checkoutReady) {
      setFormError('O checkout deste produto ainda não foi configurado.')
      return
    }

    submissionRef.current = true
    setIsSubmitting(true)

    try {
      const leadsEndpoint = window.location.pathname.startsWith('/dsl-tf01')
        ? '/dsl-tf01/api/leads'
        : '/api/leads'
      const response = await fetch(leadsEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: normalizedForm.name,
          email: normalizedForm.email,
          phone: normalizePhone(normalizedForm.phone),
          productId: page.slug,
          productName: page.title,
          pageUrl: window.location.href,
          ctaSource,
          utm: getUtmParameters(),
        }),
      })

      if (!response.ok) throw new Error('lead_request_failed')

      goToCheckout()
    } catch {
      setFormError('Não foi possível salvar seus dados agora. Tente novamente.')
    } finally {
      submissionRef.current = false
      setIsSubmitting(false)
    }
  }

  return (
    <div className="purchase-modal" onMouseDown={handleBackdropClick}>
      <div
        ref={dialogRef}
        className="purchase-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="purchase-modal-title"
        aria-describedby="purchase-modal-description"
        onKeyDown={handleDialogKeyDown}
      >
        <button
          type="button"
          className="purchase-modal__close"
          onClick={resetAndClose}
          disabled={isSubmitting}
          aria-label="Fechar formulário"
        >
          <span aria-hidden="true">×</span>
        </button>

        <div className="purchase-modal__heading">
          <span>Ambiente seguro</span>
          <h2 id="purchase-modal-title">Preencha seus dados para continuar</h2>
          <p id="purchase-modal-description">
            Você será direcionado para o ambiente seguro de pagamento.
          </p>
        </div>

        <form className="purchase-form" onSubmit={handleSubmit} noValidate>
          <div className="purchase-form__field">
            <label htmlFor="purchase-name">Nome completo</label>
            <input
              ref={firstInputRef}
              id="purchase-name"
              name="name"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={updateField}
              onBlur={handleBlur}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'purchase-name-error' : undefined}
              disabled={isSubmitting}
              required
            />
            {errors.name && <span id="purchase-name-error" className="purchase-form__error">{errors.name}</span>}
          </div>

          <div className="purchase-form__field">
            <label htmlFor="purchase-email">E-mail</label>
            <input
              id="purchase-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={form.email}
              onChange={updateField}
              onBlur={handleBlur}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'purchase-email-error' : undefined}
              disabled={isSubmitting}
              required
            />
            {errors.email && <span id="purchase-email-error" className="purchase-form__error">{errors.email}</span>}
          </div>

          <div className="purchase-form__field">
            <label htmlFor="purchase-phone">Telefone</label>
            <input
              id="purchase-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(00) 00000-0000"
              value={form.phone}
              onChange={updateField}
              onBlur={handleBlur}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? 'purchase-phone-error' : undefined}
              disabled={isSubmitting}
              required
            />
            {errors.phone && <span id="purchase-phone-error" className="purchase-form__error">{errors.phone}</span>}
          </div>

          {formError && (
            <p className="purchase-form__status" role="alert">
              {formError}
            </p>
          )}

          <button type="submit" className="purchase-form__submit" disabled={isSubmitting}>
            <span>{isSubmitting ? 'Enviando...' : 'Continuar para o pagamento'}</span>
            {!isSubmitting && <span aria-hidden="true">→</span>}
          </button>

          <p className="purchase-form__privacy">
            Seus dados serão usados somente para iniciar e dar suporte à sua compra.
          </p>
        </form>
      </div>
    </div>
  )
}
