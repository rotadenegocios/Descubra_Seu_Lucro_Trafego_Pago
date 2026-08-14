import React, { useEffect, useRef, useState } from 'react'
import { PurchaseFormModal } from './PurchaseFormModal.jsx'
import { businessInfo, getProfitPageVariant } from './profitPage.jsx'
import './styles/product-page.css'

function CTA({ page, source, onPurchase, className = '' }) {
  const content = (
    <>
      <span>{page.cta}</span>
      <span aria-hidden="true">→</span>
    </>
  )

  if (page.purchaseFlow === 'direct') {
    return (
      <a
        className={`sales-cta ${className}`}
        href={page.checkoutUrl}
        data-cta-source={source}
      >
        {content}
      </a>
    )
  }

  return (
    <button
      type="button"
      className={`sales-cta ${className}`}
      onClick={(event) => onPurchase(source, event.currentTarget)}
      data-cta-source={source}
    >
      {content}
    </button>
  )
}

function FeatureIcon({ name }) {
  const icons = {
    validator: <><circle cx="12" cy="12" r="8.5" /><path d="m8.5 12 2.2 2.2 4.8-5" /></>,
    calculator: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 7h8M8 11h2m4 0h2M8 15h2m4 0h2M8 18h2m4 0h2" /></>,
    tax: <><path d="M6 3h9l3 3v15H6z" /><path d="M14 3v4h4M9 11h6M9 15h6M9 18h4" /></>,
    play: <><circle cx="12" cy="12" r="9" /><path d="m10 8 6 4-6 4z" /></>,
    gift: <><path d="M4 10h16v10H4zM3 7h18v3H3zM12 7v13" /><path d="M12 7c-3.5 0-5-1-5-2.5S9.7 2 12 7Zm0 0c3.5 0 5-1 5-2.5S14.3 2 12 7Z" /></>,
    infinity: <path d="M8.1 8.2c2.2 0 5.6 7.6 8.1 7.6a3.8 3.8 0 0 0 0-7.6c-2.5 0-5.9 7.6-8.1 7.6a3.8 3.8 0 1 1 0-7.6Z" />,
    services: <><path d="M4 20h16M7 16V8m5 8V4m5 12v-6" /><path d="m5 6 3-3 3 2 4-3 4 2" /></>,
    discount: <><path d="m4 12 8-8 8 8-8 8Z" /><circle cx="9" cy="9" r="1" /><circle cx="15" cy="15" r="1" /><path d="m15.5 8.5-7 7" /></>,
    guide: <><path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H12v18H7.5A3.5 3.5 0 0 0 4 23Z" /><path d="M20 5.5A3.5 3.5 0 0 0 16.5 2H12v18h4.5A3.5 3.5 0 0 1 20 23Z" /></>,
  }

  if (!icons[name]) return <span aria-hidden="true">{name}</span>

  return (
    <svg className="feature-icon" viewBox="0 0 24 24" aria-hidden="true">
      {icons[name]}
    </svg>
  )
}

function StatusMark({ negative = false }) {
  return (
    <span className={`status-mark ${negative ? 'status-mark--negative' : 'status-mark--positive'}`} aria-hidden="true">
      <svg viewBox="0 0 16 16">
        {negative ? <path d="m4 4 8 8m0-8-8 8" /> : <path d="m2.8 8.2 3.1 3.1 7.3-7.1" />}
      </svg>
    </span>
  )
}

function BonusTabs({ title, tabs }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeTab = tabs[activeIndex]

  return (
    <div className="bonus-showcase" id="bonus">
      <div className="bonus-showcase__heading">
        <span>Bônus exclusivos</span>
        <h3>{title}</h3>
      </div>
      <div className="bonus-tabs" role="tablist" aria-label="Bônus do Kit Preço Certo">
        {tabs.map((tab, index) => (
          <button
            type="button"
            role="tab"
            aria-selected={activeIndex === index}
            aria-controls={`bonus-panel-${index}`}
            className={activeIndex === index ? 'is-active' : ''}
            onClick={() => setActiveIndex(index)}
            key={tab.title}
          >
            <FeatureIcon name={tab.icon} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
      <article className="bonus-panel" id={`bonus-panel-${activeIndex}`} role="tabpanel">
        <div className="bonus-panel__icon"><FeatureIcon name={activeTab.icon} /></div>
        <div className="bonus-panel__copy">
          <span>{activeTab.title}</span>
          <h4>{activeTab.headline}</h4>
          <p>{activeTab.text}</p>
          <ul>{activeTab.benefits.map((benefit) => <li key={benefit}><StatusMark />{benefit}</li>)}</ul>
        </div>
        <strong className="bonus-panel__value">{activeTab.value}</strong>
      </article>
    </div>
  )
}

function MiniDashboard({ type }) {
  if (type === 'pricing') {
    return (
      <div className="mini-sheet mini-sheet--pricing" aria-hidden="true">
        <div><span>Custo unitário</span><strong>R$ 15,80</strong></div>
        <div><span>Margem desejada</span><strong>40%</strong></div>
        <p>Preço sugerido</p><b>R$ 26,33</b>
      </div>
    )
  }

  return (
    <div className={`mini-sheet mini-sheet--${type}`} aria-hidden="true">
      <div className="mini-sheet__stats">
        <span><small>Faturamento</small><b>R$ 125.380</b></span>
        <span><small>Lucro líquido</small><b>R$ 31.543</b></span>
        <span><small>Margem</small><b>25,1%</b></span>
      </div>
      <div className="mini-sheet__chart">
        {[38, 55, 44, 72, 64, 88].map((height, index) => (
          <i key={index} style={{ height: `${height}%` }} />
        ))}
      </div>
      <div className="mini-sheet__rows"><i /><i /><i /><i /></div>
    </div>
  )
}

function VideoFrame({ page }) {
  if (page.videoSrc) {
    return (
      <div className="video-frame video-frame--player" aria-label={`Vídeo: ${page.videoTitle}`}>
        <video controls preload="metadata" playsInline>
          <source src={page.videoSrc} type="video/mp4" />
          Seu navegador não consegue reproduzir este vídeo.
        </video>
      </div>
    )
  }

  if (page.productImage) {
    const srcSet = page.productImageSources
      ?.map(([src, width]) => `${src} ${width}w`)
      .join(', ')

    return (
      <div className="video-frame video-frame--image">
        <img
          src={page.productImage}
          srcSet={srcSet}
          sizes="(max-width: 37.5rem) calc(100vw - 1.5rem), (max-width: 62rem) calc(100vw - 2rem), 60rem"
          width={page.productImageWidth}
          height={page.productImageHeight}
          alt="Planilhas do Kit Preço Certo em diferentes dispositivos"
          decoding="async"
          fetchPriority="high"
        />
      </div>
    )
  }

  return (
    <div className="video-frame" aria-label={`Vídeo: ${page.videoTitle}`}>
      <div className="video-frame__copy">
        <span>{page.videoLabel}</span>
        <strong>{page.videoTitle}</strong>
      </div>
      <img className="video-frame__mentor" src={page.mentorImage} alt="Gesieudo Nicácio" />
      <button type="button" className="video-frame__play" aria-label="Vídeo em breve" title="Vídeo em breve">
        <span aria-hidden="true">▶</span>
      </button>
      <div className="video-frame__controls" aria-hidden="true">
        <span>▶</span><i /><small>00:00</small><span>⚙</span><span>⛶</span>
      </div>
    </div>
  )
}

function TestimonialVideos({ videos }) {
  if (!videos?.length) return null

  return (
    <div className="testimonial-videos" aria-label="Depoimentos de empresários">
      {videos.map((video) => (
        <div className="testimonial-video" key={video.id}>
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.id}?rel=0`}
            title={video.title}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      ))}
    </div>
  )
}

export function PaidTrafficProfitPage() {
  const page = getProfitPageVariant()
  const usesPurchaseForm = page.purchaseFlow === 'form'
  const [isPurchaseFormOpen, setIsPurchaseFormOpen] = useState(false)
  const [ctaSource, setCtaSource] = useState('')
  const purchaseTriggerRef = useRef(null)

  useEffect(() => {
    document.title = `${page.title} | Rota de Negócios`
  }, [page.title])

  function openPurchaseForm(source, trigger) {
    if (!usesPurchaseForm) return

    purchaseTriggerRef.current = trigger
    setCtaSource(source)
    setIsPurchaseFormOpen(true)
  }

  if (page.layout === 'video-only') {
    return (
      <div className={`sales-page sales-page--${page.theme} sales-page--variant-${page.variant} sales-page--layout-video-only`}>
        <main className="sales-hero sales-hero--video-only">
          <div className="sales-container">
            <VideoFrame page={page} />
            <CTA page={page} source="hero" onPurchase={openPurchaseForm} className="sales-cta--hero" />
          </div>
        </main>

        {usesPurchaseForm && (
          <PurchaseFormModal
            isOpen={isPurchaseFormOpen}
            onClose={() => setIsPurchaseFormOpen(false)}
            page={page}
            ctaSource={ctaSource}
            returnFocusRef={purchaseTriggerRef}
          />
        )}
      </div>
    )
  }

  return (
    <div className={`sales-page sales-page--${page.theme} sales-page--variant-${page.variant || 'default'}${page.layout ? ` sales-page--layout-${page.layout}` : ''}${page.isPreview ? ' sales-page--preview' : ''}`}>
      <header className="sales-hero">
        <p className="sales-mobile-banner">Exclusivo para empresários</p>
        <div className="sales-container">
          <a className="sales-logo" href="/" aria-label="Rota de Negócios">
            <img src={page.brandLogo} alt="Rota de Negócios" />
          </a>
          <p className="sales-eyebrow">{page.eyebrow}</p>
          <h1>{page.headline}</h1>
          <p className="sales-hero__lead">{page.subheadline}</p>
          {page.heroPromises && <ul className="hero-promises">{page.heroPromises.map((item) => <li key={item}><StatusMark />{item}</li>)}</ul>}
          {page.scarcity && <p className="sales-scarcity">🔥 {page.scarcity}</p>}
          <p className="sales-mobile-prompt">Assista o vídeo até o final</p>
          <VideoFrame page={page} />
          <CTA page={page} source="hero" onPurchase={openPurchaseForm} className="sales-cta--hero" />
          <ul className="trust-row" aria-label="Benefícios da compra">
            {page.trust.map((item, index) => <li key={item}><span>{['⚡', '♢', '▣'][index]}</span>{item}</li>)}
          </ul>
        </div>
      </header>

      <main id="conteudo" className="sales-content">
        <section className="problem-section sales-section">
          <div className="sales-container">
            <div className="section-heading"><span>Diagnóstico</span><h2>{page.problemsTitle}</h2></div>
            <div className="problem-grid">
              {page.problems.map(([icon, title, text]) => (
                <article key={title}><i>{icon}</i><h3>{title}</h3><p>{text}</p></article>
              ))}
            </div>
            {page.stats && <div className="sales-stats">{page.stats.map(([number, label]) => <article key={number}><strong>{number}</strong><span>{label}</span></article>)}</div>}
            {page.alert && <div className="sales-alert"><span>!</span><strong>{page.alert}</strong></div>}
          </div>
        </section>

        {page.transformations && <section className="transform-section sales-section"><div className="sales-container"><div className="section-heading"><span>O que muda na prática</span><h2>Clareza para decidir e crescer</h2></div><div className="transform-grid">{page.transformations.map(([title, text]) => <article key={title}><StatusMark /><div><h3>{title}</h3><p>{text}</p></div></article>)}</div></div></section>}

        <section className="solution-section sales-section">
          <div className="sales-container solution-layout">
            <div>
              <p className="section-kicker">{page.solutionKicker}</p>
              <h2>{page.solutionTitle}</h2>
              <p>{page.solutionText}</p>
            </div>
            {page.highlightTitle ? (
              <aside className="profit-highlight"><span>◇</span><div><strong>{page.highlightTitle}</strong><p>{page.highlightText}</p></div></aside>
            ) : (
              <div className="solution-checks"><span><StatusMark />Simples</span><span><StatusMark />Prático</span><span><StatusMark />Completo</span></div>
            )}
          </div>
        </section>

        <section className="authority-section sales-section">
          <div className="sales-container longform-layout">
            <div className="section-heading section-heading--left"><span>Experiência real</span><h2>{page.authority.title}</h2></div>
            <div className="longform-copy">
              {page.authority.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              <CTA page={page} source="authority" onPurchase={openPurchaseForm} />
            </div>
          </div>
        </section>

        <section className="steps-section sales-section">
          <div className="sales-container">
            <div className="section-heading"><span>Como funciona</span><h2>{page.stepsTitle}</h2></div>
            <div className="steps-grid">
              {page.steps.map((step) => (
                <article className="step-card" key={step.number}>
                  <div className="step-card__number">{step.number}</div>
                  {step.image ? (
                    <div className="step-card__media"><img src={step.image} alt={step.imageAlt || ''} loading="lazy" decoding="async" /></div>
                  ) : (
                    <MiniDashboard type={step.visual} />
                  )}
                  <div className="step-card__copy"><h3>{step.title}</h3><p>{step.text}</p></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="proof-section sales-section">
          <div className="sales-container proof-section__content">
            <div className="proof-card"><strong>{page.socialProof.number}</strong><p>{page.socialProof.text}</p></div>
            <TestimonialVideos videos={page.testimonials} />
          </div>
        </section>

        <section className="receives-section sales-section">
          <div className="sales-container">
            <div className="section-heading"><span>O que você recebe</span><h2>{page.receivesTitle}</h2></div>
            <div className="receives-grid">
              {page.receives.map(([icon, title, text]) => (
                <article key={title}><i><FeatureIcon name={icon} /></i><div><h3>{title}</h3><p>{text}</p></div></article>
              ))}
            </div>
            {page.bonusTabs && <BonusTabs title={page.bonusTabsTitle} tabs={page.bonusTabs} />}
            {page.detailsGroups && <details className="included-details"><summary>{page.detailsTitle}<span>+</span></summary><div className="included-groups">{page.detailsGroups.map(([title, items]) => <article key={title}><h3>{title}</h3><ul>{items.map((item) => <li key={item}><StatusMark />{item}</li>)}</ul></article>)}</div></details>}
          </div>
        </section>

        <section className="audience-section sales-section">
          <div className="sales-container">
            <div className="section-heading"><span>Antes de entrar</span><h2>Este produto é para você?</h2></div>
            <div className="audience-grid">
              <article className="audience-card--yes"><h3>É para quem...</h3><ul>{page.audience.yes.map((item) => <li key={item}><StatusMark />{item}</li>)}</ul></article>
              <article className="audience-card--no"><h3>Não é para quem...</h3><ul>{page.audience.no.map((item) => <li key={item}><StatusMark negative />{item}</li>)}</ul></article>
            </div>
          </div>
        </section>

        <section className="mentor-section">
          <div className="sales-container mentor-layout">
            <div className="mentor-photo"><img src={page.mentorSectionImage || page.mentorImage} alt="Gesieudo Nicácio" loading="lazy" decoding="async" /></div>
            <div><p className="section-kicker">Seu mentor</p><h2>Gesieudo Nicácio</h2><p>Empresário há mais de 15 anos e especialista em gestão estratégica. Ajuda donos de negócio a organizarem os números e tomarem decisões que geram lucro de verdade.</p>{page.mentorCredentials && <ul className="mentor-credentials">{page.mentorCredentials.map((item) => <li key={item}><StatusMark />{item}</li>)}</ul>}{page.whatsapp && <a className="mentor-whatsapp" href={page.whatsapp} target="_blank" rel="noreferrer">Falar com a equipe no WhatsApp →</a>}</div>
          </div>
        </section>

        <section className="offer-section sales-section" id="oferta">
          <div className="sales-container">
            <div className="offer-card">
              <div className="offer-card__intro"><small>Oferta especial</small><h2>{page.title}</h2><ul>{page.offerItems.map((item) => <li key={item}><StatusMark />{item}</li>)}</ul></div>
              <div className="offer-card__price">{page.totalValue && <del>Valor total {page.totalValue}</del>}<span>Por apenas</span><strong>{page.price}</strong><small>{page.installment || page.priceNote}</small>{page.installment && <small>{page.priceNote}</small>}</div>
              <CTA page={page} source="offer" onPurchase={openPurchaseForm} />
            </div>
            <div className="guarantee"><span>7</span><div><h2>Garantia de 7 dias</h2><p>Teste o produto por sete dias. Se não fizer sentido para o seu negócio, solicite o reembolso dentro desse período.</p></div></div>
          </div>
        </section>

        <section className="faq-section sales-section">
          <div className="sales-container sales-container--narrow">
            <div className="section-heading"><span>Ficou com dúvida?</span><h2>Perguntas frequentes</h2></div>
            <div className="faq-list">
              {page.faq.map(([question, answer]) => <details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}
            </div>
          </div>
        </section>
      </main>

      {page.showFloatingBuyBar !== false && <div className="mobile-buy-bar"><div><small>Acesso completo</small><strong>{page.price}</strong></div><CTA page={page} source="mobile" onPurchase={openPurchaseForm} /></div>}

      <footer className="sales-footer">
        <div className="sales-container">
          <img src={page.brandLogo} alt="Rota de Negócios" loading="lazy" decoding="async" />
          <div className="sales-footer__business-info">
            <div className="sales-footer__detail"><span>CNPJ</span><span>{businessInfo.cnpj}</span></div>
            <div className="sales-footer__detail"><span>CEP</span><span>{businessInfo.postalCode}</span></div>
            <div className="sales-footer__detail"><span>Rua</span><span>{businessInfo.street}</span></div>
            <div className="sales-footer__detail"><span>Cidade</span><span>{businessInfo.city}</span></div>
          </div>
        </div>
      </footer>

      {usesPurchaseForm && (
        <PurchaseFormModal
          isOpen={isPurchaseFormOpen}
          onClose={() => setIsPurchaseFormOpen(false)}
          page={page}
          ctaSource={ctaSource}
          returnFocusRef={purchaseTriggerRef}
        />
      )}
    </div>
  )
}
