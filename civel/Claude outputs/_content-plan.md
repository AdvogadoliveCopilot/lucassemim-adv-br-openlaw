# Plano de conteúdo — pasta de guias (civel.lucassemim.adv.br)

Backlog de artigos curtos/captadores ("guia-*.html"), cada um linkando para a página de
serviço completa correspondente. Mantido pela rotina diária agendada no Claude
("Guia diário civel — conteúdo captador"). Regras fixas:

- Arquivos ficam no ROOT de `civel/` (não em subpasta `/guias/`), com nome
  `guia-<slug>.html` — NÃO usar subpasta `/guias/` porque `structure.js` (menu/footer)
  usa links relativos fixos tipo `href="index.html"` sem prefixo de caminho; uma página
  dentro de uma subpasta quebraria a navegação do menu inteiro do site. Isso pode ser
  corrigido no futuro (deixar `structure.js` calcular o caminho-base como o
  `civel-core.js` já faz), mas é uma mudança em arquivo compartilhado por TODAS as
  páginas do site e exige teste cuidadoso antes — não fazer isso na rotina automática
  diária sem que o Dr. Lucas peça explicitamente.
- Cada guia usa o mesmo design system das páginas de serviço (tokens `:root`, fontes,
  `.btn-ouro`/`.btn-prata`, `.sinais-grid`/`.sinal-card`, `.accordion`, `.cta-final`),
  mas em formato mais curto/enxuto (sem formulário de diagnóstico completo — CTA direto
  para WhatsApp e para a página de serviço completa).
- `class="artigo-conteudo"` no `<main>` + `<div id="indice-magico-container"></div>`
  logo após o hero, igual às páginas de serviço (ativa o `civel-toc.js`).
- Schema: `Article` (não `NewsArticle` — reservado a publishers elegíveis ao Google
  News) + `FAQPage` (2-4 perguntas) + `BreadcrumbList` (Início → página de serviço →
  artigo).
- Compliance: Provimento 205/2021 da OAB — sem promessa de resultado, sem comparação
  com outros advogados, sem sensacionalismo, sempre com hedge quando citar
  jurisprudência/estatística. Tom educativo, nunca "notícia" factual/alarmista.
- Toda vez que um guia for publicado: (1) marcar status abaixo como `publicado` com a
  data, (2) adicionar entrada no `sitemap.xml` (changefreq monthly, priority 0.55–0.65),
  (3) rodar a validação estrutural completa (tags balanceadas, JSON-LD válido, FAQPage x
  accordion em sincronia, sem id duplicado, sem `href="#"`) antes de comitar, (4)
  verificação byte-a-byte após `device_commit_files` (re-stage + comparação), (5)
  entregar o arquivo ao Dr. Lucas via SendUserFile com um resumo curto (sem pedir
  aprovação antes de publicar — fluxo é direto, conforme decisão de 11/09/2026).
- Se o backlog abaixo se esgotar, pesquisar e propor 5 novos temas (ligados a alguma das
  páginas de serviço já existentes) antes de continuar a rotina.

## Backlog por página de serviço

### Cartão RMC/RCC no INSS → rmc-consignado-civel.html
- [x] 2026-09-11 — guia-sinais-cartao-rmc-inss.html — "5 sinais de desconto irregular de cartão RMC/RCC no extrato do INSS"
- [x] 2026-09-12 — guia-cartao-rmc-nao-contratei-48-horas.html — "Aposentado descobriu cartão RMC que nunca contratou: o que fazer nas próximas 48 horas"

### Superendividamento → superendividamento-civel.html
- [x] 2026-09-12 — guia-sinais-superendividamento.html — "5 sinais de que você está superendividado sem perceber"
- [x] 2026-09-17 — guia-audiencia-conciliacao-dividas.html — "Como funciona a audiência de conciliação de dívidas: o que esperar no dia"

### Usucapião → usucapiao-civel.html
- [x] 2026-09-12 — guia-morar-sem-escritura-usucapiao.html — "Meu nome não está na escritura, mas moro no imóvel há anos: e agora?"
- [x] 2026-09-18 — guia-documentos-usucapiao.html — "Checklist rápido: 6 documentos para começar seu pedido de usucapião"

### Reajuste de plano de saúde → reajuste-plano-saude-civel.html
- [x] 2026-09-12 — guia-reajuste-plano-saude-faixa-etaria-abusivo.html — "Reajuste do plano de saúde por faixa etária: quando pode ser abusivo?"
- [ ] "Operadora quer cancelar meu plano por inadimplência: existe defesa?"

### Seguros e indenização → seguros-indenizacao.html
- [ ] "Seguradora negou meu sinistro: 4 passos antes de desistir"
- [ ] "Seguro DPVAT: o que saber sobre indenização por acidente de trânsito"

### Golpe do Pix → golpe-pix-civel.html
- [x] 2026-09-12 — guia-golpe-pix-primeiras-horas.html — "Caí no golpe do Pix: o que fazer nas primeiras 2 horas"

### Bets/apostas → bets-civel.html
- [ ] "Perdi dinheiro em site de apostas irregular: existe caminho jurídico?"

### Erro médico → erro-medico.html
- [ ] "Como identificar se houve erro médico (e não apenas um resultado ruim)"

### Acidentes de trânsito → acidentes-transito.html
- [x] 2026-09-17 — guia-provas-acidente-transito.html — "Sofri um acidente de trânsito: 5 provas que você precisa guardar"

### Contratos e negócios → contratos-negocios.html
- [ ] "Contrato verbal tem validade jurídica? O que diz a lei"

### Família e sucessões → familia-sucessoes.html
- [ ] "Inventário extrajudicial: quando é possível fazer sem ir à Justiça"

### Blindagem patrimonial → blindagem-patrimonial.html
- [ ] "Holding familiar: para quem realmente vale a pena"

### Execução e cobrança → execucao-cobranca.html
- [ ] "Devedor sumiu e não paga: como funciona a busca de bens na Justiça"

### Bancário e juros → bancario-juros.html
- [ ] "Juros abusivos no empréstimo bancário: como identificar"

## Log de publicação

| Data | Arquivo | Página de serviço vinculada |
|---|---|---|
| 2026-09-11 | guia-sinais-cartao-rmc-inss.html | rmc-consignado-civel.html |
| 2026-09-12 | guia-cartao-rmc-nao-contratei-48-horas.html | rmc-consignado-civel.html |
| 2026-09-12 | guia-sinais-superendividamento.html | superendividamento-civel.html |
| 2026-09-12 | guia-morar-sem-escritura-usucapiao.html | usucapiao-civel.html |
| 2026-09-12 | guia-golpe-pix-primeiras-horas.html | golpe-pix-civel.html |
| 2026-09-12 | guia-reajuste-plano-saude-faixa-etaria-abusivo.html | reajuste-plano-saude-civel.html |
| 2026-09-17 | guia-provas-acidente-transito.html | acidentes-transito.html |
| 2026-09-17 | guia-audiencia-conciliacao-dividas.html | superendividamento-civel.html |
| 2026-09-18 | guia-documentos-usucapiao.html | usucapiao-civel.html |
