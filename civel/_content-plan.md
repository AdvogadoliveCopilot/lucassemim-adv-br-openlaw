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
- [x] 2026-09-19 — guia-cancelamento-plano-saude-inadimplencia.html — "Operadora quer cancelar meu plano por inadimplência: existe defesa?"

### Seguros e indenização → seguros-indenizacao.html
- [x] 2026-09-23 — guia-seguradora-negou-sinistro-4-passos.html — "Seguradora negou meu sinistro: 4 passos antes de desistir"
- [x] 2026-09-24 — guia-seguro-dpvat-acidente-transito.html — "Seguro DPVAT: o que saber sobre indenização por acidente de trânsito" (base: DPVAT sem cobrança de prêmio desde 2021, Consórcio DPVAT extinto em 11/2020, Caixa administrou saldo remanescente até se esgotar em 12/2023; tentativa de substituição pelo SPVAT via LC 207/2024 [16/05/2024], revogada pela LC 211/2024 [31/12/2024] antes de entrar em pleno vigor; prescrição de 3 anos conforme Súmula 405 do STJ — hedge: hoje não há seguro obrigatório de trânsito vigente no Brasil, cada caso exige análise individual)

### Golpe do Pix → golpe-pix-civel.html
- [x] 2026-09-12 — guia-golpe-pix-primeiras-horas.html — "Caí no golpe do Pix: o que fazer nas primeiras 2 horas"

### Bets/apostas → bets-civel.html
- [x] 2026-09-25 — guia-site-apostas-ilegal-reaver-dinheiro.html — "Perdi dinheiro em site de apostas irregular: existe caminho jurídico?" (base: Lei 14.790/2023 + Portaria SPA/MF 827/2024 — autorização obrigatória da SPA/MF desde 01/01/2025, domínio ".bet.br", lista oficial de transparência do Ministério da Fazenda; Portaria SPA/MF 2.750/2026 [16/09/2026] amplia monitoramento de Pix contra operadores ilegais; hedge forte: NÃO há jurisprudência consolidada do STJ sobre devolução de valores perdidos em site ilegal — tese se apoia em doutrina [art. 166 e 814 CC, enriquecimento sem causa], sem garantia de resultado)
- [x] 2026-09-22 — guia-ludopatia-devolucao-apostas.html — "Diagnosticado com ludopatia: existe direito a reaver valores apostados em casas de apostas?" (base: TJDFT, 3ª Turma Cível, processo 0707743-74.2025.8.07.0001, 12/06/2026 — anulação de apostas e devolução de R$ 180.963,12 com base na Lei 14.790/2023 e na Portaria SPA/MF 1.231/2024, sobre jogo responsável)
- [x] 2026-09-26 — guia-mp-proibe-bets-prazo-saque-saldo.html — Tema evoluído por notícia de última hora: em vez de "MJ vai atrás de bets ilegais", a MP 1.394/2026 (publicada 25/09/2026) proibiu TODAS as bets no Brasil (inclusive as autorizadas pela SPA/MF) e abriu cronograma de saque/devolução de saldo — "MP proíbe as bets no Brasil: prazo até 5 de outubro para sacar seu saldo" (base: MP 1.394/2026 — bloqueio imediato de novos depósitos, saque voluntário até 23h59 de 05/10/2026, saída do ar em 06/10, operadoras informam saldos aos bancos em 07-08/10, devolução automática pelos bancos em 09-14/10, Caixa Econômica Federal atua em casos de impedimento a partir de 14/10; não atinge loterias tradicionais; MP tem força de lei mas depende de aprovação do Congresso em até 120 dias; hedge forte sobre eventual não devolução)

### Erro médico → erro-medico.html
- [x] 2026-09-28 — guia-como-identificar-erro-medico.html — "Como identificar se houve erro médico (e não apenas um resultado ruim)" (base: medicina como obrigação de meio; responsabilidade subjetiva do médico e objetiva do hospital, art. 14, §4º, CDC; direito do paciente a cópia integral do prontuário, decorrente do Código de Ética Médica — Resolução CFM nº 2.217/2018; hedge: erro médico depende de culpa comprovada, cada caso exige perícia técnica, sem garantia de resultado)
- [x] 2026-09-28 — guia-valor-indenizacao-erro-medico.html — "Quanto vale uma indenização por erro médico? Não existe tabela fixa — entenda os critérios" (base: art. 944 CC — indenização medida pela extensão do dano; art. 949 CC — danos materiais em lesão à saúde; art. 950 CC — pensão por redução da capacidade de trabalho; Súmula 387 do STJ — cumulação de dano estético e dano moral; método bifásico do STJ para fixação do dano moral; hedge forte: não existe tabela oficial nem valor mínimo garantido, cada caso exige análise individual e perícia técnica, sem garantia de resultado, conforme Provimento 205/2021 OAB)

### Acidentes de trânsito → acidentes-transito.html
- [x] 2026-09-17 — guia-provas-acidente-transito.html — "Sofri um acidente de trânsito: 5 provas que você precisa guardar"

### Contratos e negócios → contratos-negocios.html
- [x] 2026-09-29 — guia-contrato-verbal-validade-juridica.html — "Contrato verbal tem validade jurídica? O que diz a lei"

### Família e sucessões → familia-sucessoes.html
- [x] 2026-10-02 — guia-inventario-extrajudicial-sem-justica.html — "Inventário extrajudicial: quando é possível fazer sem ir à Justiça" (base: CPC art. 610, §§1º e 2º — exige consenso total, capacidade e advogado; Resolução CNJ 571/2024, que alterou a Resolução CNJ 35/2007 — abriu hipóteses excepcionais de via extrajudicial com testamento [autorização judicial prévia] e com herdeiro incapaz [quinhão em partes ideais + manifestação do MP]; hedge: exceções restritas, cada caso exige análise individual)
- [x] 2026-10-03 — guia-itcmd-inventario-extrajudicial-cnj-695.html — "Inventário sem pagar o ITCMD antes? O que muda (e o que ainda não muda) com a Resolução CNJ 695/2026" (base: Resolução CNJ 695, de 26/08/2026, altera art. 15 da Resolução CNJ 35/2007 — dispensa comprovação de recolhimento prévio do ITCMD para lavrar a escritura, MAS hedge obrigatório: há "antinomia normativa" com leis estaduais que ainda exigem o pagamento prévio [ex: SP, Lei 10.705/2000, art. 25; SC, Lei 13.136/2004, art. 12; DF, Decreto 34.982/2013] e a aplicação prática está inconsistente entre estados em out/2026 — MG não mencionado nominalmente nas fontes pesquisadas, hedge reforçado nesse ponto; não afirmar que "está liberado" em todo o Brasil)

### Blindagem patrimonial → blindagem-patrimonial.html
- [x] 2026-10-09 — guia-holding-familiar-vale-a-pena.html — "Holding familiar: para quem realmente vale a pena"

### Execução e cobrança → execucao-cobranca.html
- [x] 2026-10-12 — guia-devedor-sumiu-busca-de-bens.html — "Devedor sumiu e não paga: como funciona a busca de bens na Justiça" (base: SISBAJUD art. 854 CPC, RENAJUD, INFOJUD, CNIB — Provimento CNJ 39/2014, suspensão da execução sem bens art. 921 CPC; medidas atípicas art. 139, IV CPC — STJ, REsp 1.788.950/MT [apreensão de passaporte/suspensão de CNH, requisitos: indícios de patrimônio oculto, subsidiariedade, fundamentação e proporcionalidade]; hedge forte: medida subsidiária e não automática, sem garantia de resultado)

### Bancário e juros → bancario-juros.html
- [x] 2026-10-16 — guia-como-identificar-juros-abusivos.html — "Juros abusivos no empréstimo bancário: como identificar" (base: Súmula 596-STF — Lei da Usura/Decreto 22.626/1933 não se aplica a instituições do SFN; Súmula 539-STJ — capitalização de juros com periodicidade inferior à anual permitida desde 31/03/2000 se expressamente pactuada; Súmula 541-STJ — previsão de taxa anual > duodécuplo da mensal autoriza cobrança da taxa efetiva anual; Súmula 565-STJ — TAC/TEC válidas só em contratos anteriores a 30/04/2008 [Resolução CMN 3.518/2007]; Resolução CMN 4.881/2020 [em vigor desde 01/02/2021, sucedeu a Resolução CMN 3.517/2007] — exige divulgação do CET antes da contratação; hedge: não há teto fixo de juros, abusividade depende de comparação com taxa média do Bacen e análise individual do contrato)
- [x] 2026-09-22 — guia-juros-abusivos-taxa-bacen.html — "Juros do empréstimo parecem abusivos? Como a taxa média do Bacen pode reduzir sua dívida" (base: entendimento do STJ noticiado em 27/07/2026 — reconhecida a abusividade, o juiz pode limitar a taxa à média de mercado divulgada pelo Bacen na data da contratação, em vez de simplesmente anular os juros; hedge: cada contrato exige análise técnica individual, não é automático)

### Banco Master → banco-master-civel.html
- [x] 2026-10-17 — guia-fgc-250-mil-cdb-banco-master.html — "FGC só cobre até R$ 250 mil: o que fazer com o restante do seu CDB no Banco Master"
- [ ] "Comprei CDB do Banco Master pela XP, BTG ou Nubank: 5 sinais de que a corretora não te alertou do risco"
- [ ] "Golpe na fila do FGC: como identificar quem está se passando pelo Fundo ou pela corretora"
- [ ] "Minha empresa tem conta no Banco Master bloqueada: primeiros passos antes de procurar um advogado"

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
| 2026-09-19 | guia-cancelamento-plano-saude-inadimplencia.html | reajuste-plano-saude-civel.html |
| 2026-09-22 | guia-ludopatia-devolucao-apostas.html | bets-civel.html |
| 2026-09-22 | guia-juros-abusivos-taxa-bacen.html | bancario-juros.html |
| 2026-09-23 | guia-seguradora-negou-sinistro-4-passos.html | seguros-indenizacao.html |
| 2026-09-24 | guia-seguro-dpvat-acidente-transito.html | seguros-indenizacao.html |
| 2026-09-25 | guia-site-apostas-ilegal-reaver-dinheiro.html | bets-civel.html |
| 2026-09-26 | guia-mp-proibe-bets-prazo-saque-saldo.html | bets-civel.html |
| 2026-09-28 | guia-como-identificar-erro-medico.html | erro-medico.html |
| 2026-09-28 | guia-valor-indenizacao-erro-medico.html | erro-medico.html |
| 2026-09-29 | guia-contrato-verbal-validade-juridica.html | contratos-negocios.html |
| 2026-10-02 | guia-inventario-extrajudicial-sem-justica.html | familia-sucessoes.html |
| 2026-10-03 | guia-itcmd-inventario-extrajudicial-cnj-695.html | familia-sucessoes.html |
| 2026-10-09 | guia-holding-familiar-vale-a-pena.html | blindagem-patrimonial.html |
| 2026-10-12 | guia-devedor-sumiu-busca-de-bens.html | execucao-cobranca.html |
| 2026-10-16 | guia-como-identificar-juros-abusivos.html | bancario-juros.html |
| 2026-10-17 | guia-fgc-250-mil-cdb-banco-master.html | banco-master-civel.html |
