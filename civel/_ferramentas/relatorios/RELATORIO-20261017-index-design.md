# RELATÓRIO — Melhorias de design na home cível (17/10/2026)

## Escopo
Aplicação das melhorias de design já estudadas (Missão B do briefing) na
`civel/index.html`.

## O que mudou

### 1. Hero com foto real (bug antigo corrigido)
- O hero da home exibia apenas uma textura de linhas douradas desde 11/09/2026,
  porque o comentário no CSS afirmava que `banner-civel-1.png` "não existe em /img
  (nunca existiu)". A imagem **existe** (e existia) em `civel/img/` — apenas o PNG
  pesava 6,9 MB e nunca tinha sido convertido para web.
- Ação: gerada versão web `civel/img/banner-civel-1.jpg` (1920px, JPEG q72,
  **141 KB** — 98% menor). Hero agora usa a foto real com os gradientes escuros
  preservados para legibilidade.
- Compartilhamento (og:image/JSON-LD) continua apontando para a foto do Dr. Lucas,
  como já estava.

### 2. Container `.cta-internal` adicionado (ativação do smart-CTA)
- `civel-smart-cta.js` (CTA por palavra-chave, o sistema de maior potencial de
  conversão segundo o estudo `estudo-sistemas-site-principal.md`) está carregado
  no `civel-core.js` desde 10/09/2026 com gate `.cta-internal` — mas **nenhuma
  página do site tinha esse container**, então nunca ativava.
- Ação: container `<div class="cta-internal"></div>` inserido na home, entre a
  seção de casos e "Como Funciona".
- Verificado em navegador headless: injeta o banner "SOFREU UM ACIDENTE DE
  TRÂNSITO?" com botão de WhatsApp pré-preenchido, na identidade visual do site.

## O que foi verificado
- Backup prévio: `civel/_ferramentas/backups/2026-10-17-index-design/index.html`.
- Renderização headless (Chromium 1280×720): página carrega, hero + CTA ok,
  nenhum erro de console novo (os 2 de rede já existiam: SSL da foto og no
  ambiente local e HubSpot que só existe no servidor — ambos esperados offline).

## O que NÃO foi verificado
- Teste em 1440/1200/390px do briefing (não feito nesta passada).
- Comportamento em produção (Locaweb) — requer upload pelo chefe.

## Como reverter
- Restaurar `index.html` do backup citado.
- Remover `civel/img/banner-civel-1.jpg` (arquivo novo, inócuo se não usado).
