// GERADO POR _shared/sync-tracking.mjs - NAO EDITE AQUI
import React, { useEffect, useState } from 'react'
import { isOptedOut, setOptOut } from './optout.js'
import './PrivacyNotice.css'

export function PrivacyNotice({ isOpen, onClose, contactEmail = '' }) {
  const [optedOut, setOptedOutState] = useState(false)

  useEffect(() => {
    if (isOpen) setOptedOutState(isOptedOut())
  }, [isOpen])

  if (!isOpen) return null

  function toggleOptOut() {
    const next = !optedOut
    setOptOut(next)
    setOptedOutState(next)
  }

  function handleBackdrop(event) {
    if (event.target === event.currentTarget) onClose()
  }

  return (
    <div className="privacy-notice" onMouseDown={handleBackdrop}>
      <div className="privacy-notice__dialog" role="dialog" aria-modal="true" aria-labelledby="privacy-notice-title">
        <button type="button" className="privacy-notice__close" onClick={onClose} aria-label="Fechar">
          <span aria-hidden="true">×</span>
        </button>

        <h2 id="privacy-notice-title">Como medimos esta página</h2>

        <section>
          <h3>Medição própria, sem cookies de terceiros</h3>
          <p>
            Registramos como esta página é usada: seções vistas, rolagem, vídeo, cliques nos botões,
            início e abandono do formulário, além de cidade aproximada, tipo de dispositivo e horário
            do acesso. Esse registro fica no nosso próprio servidor e não é compartilhado com
            ninguém.
          </p>
          <p>
            Usamos um identificador aleatório no seu navegador para não contar a mesma visita duas
            vezes. Ele não carrega seu nome, e-mail ou telefone, e não segue você em outros sites.
            A base legal é o legítimo interesse (art. 7, IX da LGPD) e os registros são apagados
            após 12 meses.
          </p>
        </section>

        <section>
          <h3>Meta e Google, só com o seu aceite</h3>
          <p>
            O Pixel da Meta e a API de Conversões só funcionam se você aceitar. Sem aceite, nada é
            enviado para a Meta. O Google Analytics recebe uma medição anônima, sem cookie e sem
            identificador, usada apenas para estimar totais.
          </p>
          <p>
            Se você preencher o formulário de compra e tiver aceitado, seu e-mail e telefone são
            enviados à Meta apenas de forma criptografada, para medir o resultado do anúncio. Seu
            nome nunca é enviado.
          </p>
        </section>

        <section>
          <h3>Não quero ser medido</h3>
          <p>
            Você pode se opor a qualquer momento, inclusive à medição própria. Ao ativar a opção
            abaixo, apagamos os identificadores deste navegador e paramos todo o registro.
          </p>
          <button
            type="button"
            className={`privacy-notice__optout${optedOut ? ' is-active' : ''}`}
            onClick={toggleOptOut}
          >
            {optedOut ? 'Medição desativada neste navegador — reativar' : 'Desativar a medição neste navegador'}
          </button>
        </section>

        {contactEmail && (
          <p className="privacy-notice__contact">
            Dúvidas ou pedidos sobre seus dados: <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
          </p>
        )}
      </div>
    </div>
  )
}
