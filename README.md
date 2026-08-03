# Descubra Seu Lucro — página de tráfego pago

Projeto React/Vite independente. A pasta pode ser movida para outro repositório sem levar arquivos do site original.

## Executar localmente

```bash
npm install
npm run dev
```

Para gerar os arquivos de produção:

```bash
npm run build
```

## Publicar na Vercel

1. Use esta pasta como a raiz do novo projeto.
2. Configure `DATABASE_URL` com a conexão do Neon. A API direciona essa conexão ao banco exclusivo `leads_descubra_seu_lucro`. Como alternativa, configure `LEADS_WEBHOOK_URL` e, se necessário, `LEADS_WEBHOOK_TOKEN`.
3. Publique como um projeto Vite. A função `api/leads.js` será implantada junto com o site.

O formulário envia os leads para `/api/leads` e, após o registro, redireciona para o checkout configurado. Este endpoint aceita somente o produto `descubra-seu-lucro`; os registros ficam isolados dos leads das outras páginas.

## Arquivos principais

- `src/PaidTrafficProfitPage.jsx`: componente completo da página.
- `src/profitPage.jsx`: textos, valores, links e dados comerciais.
- `src/PurchaseFormModal.jsx`: formulário pré-checkout.
- `src/styles/`: todos os estilos usados pela página.
- `src/assets/` e `public/videos/`: imagens e vídeo locais.
- `api/leads.js`: gravação de leads no Neon ou envio ao webhook.

## Importar o componente

Em outro aplicativo React, mova esta pasta e importe:

```jsx
import { PaidTrafficProfitPage } from './src/PaidTrafficProfitPage.jsx'

export default function App() {
  return <PaidTrafficProfitPage />
}
```

O componente importa automaticamente sua configuração, estilos, imagens e formulário. Para o envio de leads funcionar, mantenha também `api/leads.js` na raiz do projeto de destino e copie `public/videos/descubra-seu-lucro.mp4`.
