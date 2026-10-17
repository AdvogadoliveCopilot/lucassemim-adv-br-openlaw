# Estudo de Conteúdo — civel.lucassemim.adv.br
Estudo página a página do conteúdo já publicado, para priorizar reescrita e otimização on-page.
Data do estudo: 2026-09-10. Fonte: HTML estático salvo em `/mnt/user-data/uploads/civel/*.html` + JS de suporte em `codeleicivel/`.

---

## 0. Como o site funciona por baixo (contexto necessário para entender as fichas)

- **Header, footer, menu e SEO são injetados via JavaScript** (`codeleicivel/civel-core.js` carrega em cadeia `structure.js`, `civel-seo.js`, `civel-geo.js` etc.). Isso significa que:
  - O **menu principal (desktop e mobile) e o footer são os mesmos em TODAS as páginas**, definidos uma única vez em `structure.js` (objeto `links{}`).
  - `civel-seo.js` mantém um objeto `PAGES{}` com title/description/services/FAQ/breadcrumb **por página**, e injeta dinamicamente: `<meta description>`, Open Graph, `canonical`, e 4 blocos de JSON-LD (`LegalService`, `FAQPage`, `BreadcrumbList`/`WebPage speakable`, `Attorney`).
  - **Bug real encontrado:** a função `engineMeta()` só sobrescreve o `<title>` estático se ele **não contiver "Lucas Semim"** (`if (pg.title && !document.title.includes('Lucas Semim'))`). Como **todo** `<title>` estático já contém "Lucas Semim", o título melhor/mais otimizado que existe no `PAGES{}` **nunca é aplicado** — o site roda sempre com os títulos estáticos (mais fracos, sem "BH" e sem long-tail) enquanto o Open Graph e o `og:title` usam o título bom. Resultado prático: o que aparece na aba do navegador e no SERP do Google é o título estático mais fraco; o que aparece ao compartilhar num link (WhatsApp/Facebook) é o título bom. Isso é uma inconsistência que vale corrigir com 1 linha de código.
  - **FAQPage schema é só JSON-LD, nunca visível na página** (exceto na home, que tem um acordeão de verdade). Ou seja, 7 das 10 páginas de serviço injetam `FAQPage` com perguntas que **não aparecem em lugar nenhum do HTML visível** — isso é risco de rich snippet não ser exibido/validado pelo Google (a diretriz do Google para `FAQPage` pede conteúdo correspondente visível na página) e é conteúdo "morto" que poderia estar convertendo visitantes se fosse um acordeão real.
  - Páginas com `faq: []` (schema de FAQ vazio, ou seja **nenhum FAQ schema é gerado**): `contratos-negocios.html`, `sabara-civel.html`, `belohorizonte-civel.html`.

- **BUG CRÍTICO SITE-WIDE — número de WhatsApp quebrado em 9 de 15 páginas.** Existem dois números diferentes usados nos links `wa.me`:
  - Correto (12 dígitos, funciona): `5531983944973` → usado só em `index.html` e `sabara-civel.html` (9 ocorrências).
  - **Malformado** (com um "0" extra, formato inválido para o wa.me): `55031983944973` → usado em `acidentes-transito.html`, `bancario-juros.html`, `blindagem-patrimonial.html`, `contratos-negocios.html`, `erro-medico.html`, `execucao-cobranca.html`, `familia-sucessoes.html`, `seguros-indenizacao.html` e também `painel-cliente.html` (21 ocorrências no total).
  - Isso provavelmente faz o WhatsApp abrir com erro de "número inválido" ou não abrir a conversa corretamente para quem clica no CTA principal em **8 das 10 páginas de serviço**. É a correção de maior impacto e mais barata de todo o site: um find-and-replace de `55031983944973` → `5531983944973` em 8 arquivos.

- **Schema com dados de placeholder não preenchidos**: `belohorizonte-civel.html` tem no `LegalService` estático: `"streetAddress": "Endereço do Escritório em BH"` (texto literal de placeholder, nunca preenchido) e `"sameAs": ["https://www.instagram.com/seuperfil", "https://www.linkedin.com/in/seuperfil"]` (também placeholder). Isso é dado estruturado quebrado indexável pelo Google, e cria inconsistência de NAP (Nome/Endereço/Telefone) com o endereço real usado em `index.html` (Rua Coronel Abílio Pereira, 337, BH, CEP 31050-120). Há ainda um terceiro handle de Instagram diferente em `sabara-civel.html` (`lucassemim.adv`) — três handles de rede social diferentes espalhados pelo site confundem a entidade nos olhos do Google.

- **HTML inválido**: `blindagem-patrimonial.html` tem 3 `<div class="civel-slide">` soltos **depois** da tag `</html>` de fechamento (resíduo de um carrossel de imagens que foi removido do body mas não do arquivo). Não quebra a renderização, mas é lixo de código, aumenta o peso do arquivo e pode confundir validadores/crawlers.

---

## 1. Fichas por página

### 1.1 `index.html` (Home)

1. **Title/description**: `Advogado Indenização em Belo Horizonte | Lucas Semim — Dano Moral, Acidente e Seguro` / description cita acidente, morte, apólice negada, dano moral, "análise gratuita e sigilosa". Muito persuasivo e bem alinhado à intenção de busca ampla ("advogado indenização BH"). Nota: o título tem ~74 caracteres, um pouco acima do ideal de 60 (risco de truncar no SERP).
2. **Headings**: 1 H1 ("VOCÊ TEM DIREITO À INDENIZAÇÃO"), 6 H2 (seções: Casos, Frentes em Alta 2026, Como Funciona, Depoimentos, FAQ, Dossiê), 19 H3 (títulos de cada card). Estrutura lógica, sem duplicidade.
3. **Profundidade**: A página mais completa do site. Tem 6 cards de "casos que atendemos" + 6 mini-cards de áreas + **6 cards novos de "Frentes em Alta 2026"** (Bets, Golpe do Pix, RMC/Consignado, Usucapião, Reajuste Plano de Saúde, Superendividamento) com CTAs de WhatsApp pré-preenchidos e específicos por tema, citando fatos concretos e atuais (TNU/Pix nov-2025, teto ANS 5,11% para 2026, Lei 14.181/2021). É a única página com FAQ **visível** (acordeão Bootstrap com 7 perguntas) e com JSON-LD **estático** (LegalService + FAQPage + BreadcrumbList) — os 3 únicos schemas hard-coded no HTML do site inteiro.
4. **Prova social**: 3 depoimentos com nome abreviado + cidade + 5 estrelas; stats bar (+500 casos, "R$MM" em indenizações — **valor não preenchido, literalmente o texto "R$MM"**, 8+ anos, 100% sigilo). É a única página do site com qualquer depoimento.
5. **CTAs**: Muito fortes — botão hero duplo (âncora para formulário + WhatsApp com mensagem pré-formatada), 6 CTAs de WhatsApp específicos por tema nos cards novos, botão flutuante de WhatsApp fixo, formulário completo de captação com select de 12 tipos de caso. Nenhuma outra página do site tem esse nível de CTA.
6. **Links internos**: Linka para as 10 páginas de conteúdo (todas). É praticamente o único hub do site — sem ela, `acidentes-transito.html` ficaria inacessível pelo menu.
7. **Schema.org**: Estático (LegalService, FAQPage, BreadcrumbList) — os únicos 3 blocos JSON-LD escritos direto no HTML de todo o site. Reforçado também pelos schemas dinâmicos do `civel-seo.js` (duplica LegalService — risco de schema duplicado/conflitante para o Googlebot, ver seção 3).
8. **Nota: 9/10.** É a página mais forte do site, modelo a replicar. Perde ponto por: título levemente longo, "R$MM" não preenchido, e schema LegalService duplicado (estático + dinâmico) com endereço podendo divergir sutilmente entre os dois blocos.

---

### 1.2 `acidentes-transito.html`

1. **Title/description**: `Acidentes de Trânsito: Indenização e Defesa | Dr. Lucas Semim` / "Especialista em Acidentes de Trânsito. Danos Morais, Materiais, Estéticos e Lucros Cessantes. Não aceite acordos injustos da seguradora." Bom gancho ("não aceite acordos injustos"), mas o title não usa "Belo Horizonte" nem "advogado" — para a busca real ("advogado acidente de trânsito BH/Sabará") é mais fraco que o title dinâmico que o próprio site já escreveu e nunca aplica (`Advogado Acidente de Trânsito BH | Indenização Morte e Lesão | Lucas Semim`, ver bug na seção 0).
2. **Headings**: 1 H1 ("ACIDENTE DE TRÂNSITO"), 2 H2 ("RELATÓRIO DE SINISTRO", "O QUE VOCÊ PODE RECEBER?"), 5 H3 (os 4 cards de dano + nada mais). Estrutura ok mas rasa — só 2 H2 para um tema de altíssimo volume de busca.
3. **Profundidade**: Superficial para o potencial do tema. O corpo visível é essencialmente: hero + formulário "relatório de sinistro" (coleta dados e manda por WhatsApp) + 4 cards curtos (Dano Material, Dano Moral & Estético citando Súmula 387 STJ, Lucros Cessantes, DPVAT). **Não menciona o prazo prescricional de 3 anos no texto visível** (só existe no FAQ invisível/JSON-LD da home), não tem exemplos de valores de indenização, não cita mais nenhuma jurisprudência além de 1 súmula, não fala de Sabará/Fórum local. Um leigo pesquisando "quanto vale indenização acidente de carro BH" não encontra resposta concreta aqui.
4. **Prova social**: Nenhuma. Zero depoimentos, zero números.
5. **CTAs**: Header com botão "PLANTÃO INDENIZATÓRIO" (WhatsApp — **número quebrado**, ver bug seção 0), formulário completo que monta uma mensagem estruturada de WhatsApp (bom UX), e um card lateral "ACIDENTE GRAVE?" que **redireciona para fora do domínio cível**, para `lucassemim.adv.br/emergencia.html` (núcleo criminal) — foge do funil de indenização civil.
6. **Links internos**: Recebe link só de `index.html` (card "Morte em Acidente" e "Acidente de Trânsito"). **Não está no menu principal nem no footer** — é a única página de serviço do site totalmente ausente do menu global injetado por `structure.js`. Só é alcançável por busca direta ou pelo card da home. Ela mesma só linka de volta para `index.html`.
7. **Schema.org**: Só dinâmico via `civel-seo.js` (LegalService + FAQPage com 2 perguntas + Attorney + WebPage/speakable). **Sem `<link rel="canonical">` estático** (é setado via JS). FAQ do schema não tem correspondência visível na página.
8. **Nota: 4/10.** Tema de altíssima intenção comercial ("acidente de carro", "atropelamento", provavelmente o maior volume de busca do nicho) tratado como página secundária: órfã do menu, rasa em conteúdo, sem prova social, sem prazo prescricional visível, e com o CTA principal (WhatsApp) provavelmente quebrado. Forte candidata a reescrita prioritária.

---

### 1.3 `bancario-juros.html`

1. **Title/description**: `Direito Bancário: Juros, Fraudes e Blindagem | Lucas Semim Advocacia` / "Especialista em Direito Bancário. Ação Revisional de Juros, Defesa em Busca e Apreensão, Cancelamento de RMC e Ressarcimento de Golpes (Pix/Empréstimos)." Descritivo e cobre bem os 3 subtemas da página, mas sem geolocalização (BH/Sabará) nem gatilho emocional direto.
2. **Headings**: 1 H1 ("O BANCO NÃO PODE TUDO."), 2 H2 ("Áreas de Atuação Estratégica", "Auditoria Financeira Rápida"), 3 H3 (Revisional de Veículos, RMC, Golpes Digitais). Estrutura curta.
3. **Profundidade**: Boa especificidade jurídica pontual — cita Súmula 479 STJ (responsabilidade do banco por falha de segurança), menciona "Protocolo de 5 dias" para defesa em busca e apreensão, explica RMC como "empréstimo infinito"/cartão de crédito disfarçado com devolução em dobro. Tem uma **calculadora interativa** de "auditoria financeira" (simula juros abusivos a partir de valor financiado/parcelas) — recurso de engajamento único, bom diferencial. Mas o texto total é curto (234 linhas, o 2º menor arquivo do site) e não aprofunda em exemplos de decisões, valores médios de indenização ou prazos.
4. **Prova social**: Nenhuma.
5. **CTAs**: 3 links de WhatsApp (**número quebrado**, bug seção 0), um deles ("CANCELAR CARTÃO RMC →") é um link morto `href="#"` que não faz nada.
6. **Links internos**: **Zero links de saída** para outras páginas de conteúdo do site (nem para `execucao-cobranca.html`, nem para `blindagem-patrimonial.html`, que seriam cross-sells óbvios). Recebe 1 link de entrada, de `familia-sucessoes.html`.
7. **Schema.org**: Só dinâmico (LegalService + FAQPage com **apenas 1 pergunta** + Attorney). FAQ mínimo.
8. **Nota: 5/10.** Boa ideia de calculadora e boas citações pontuais, mas é uma página-beco-sem-saída (zero links de saída), com FAQ raso (1 pergunta) e CTA quebrado. Tema (juros abusivos, golpe do Pix, RMC) tem alta procura e merece muito mais profundidade — especialmente porque a home já promete conteúdo de "Golpe do Pix" e "RMC/Consignado" que deveria aprofundar aqui e não aprofunda.

---

### 1.4 `belohorizonte-civel.html`

1. **Title/description**: `Advogado Responsabilidade Civil BH | Indenizações e Danos Morais` / "Especialistas em Responsabilidade Civil em Belo Horizonte. Transformamos prejuízo em indenização: Chuvas, Erro Médico, Contratos e Consumidor. Fórum Lafayette e Raja." Bom uso de "BH" e de referências locais (nomes de fóruns), mas o assunto é quase idêntico ao da home ("responsabilidade civil"/"indenização") — risco de **canibalização** entre esta página e `index.html`.
2. **Headings**: 1 H1 ("ESPECIALISTAS EM RESPONSABILIDADE CIVIL"), 4 H2, 3 H3. Estrutura ok.
3. **Profundidade**: Mistura de conteúdo genérico de responsabilidade civil (danos morais/materiais/lucros cessantes/planos de saúde, vícios construtivos, acidentes/erro médico) com bons sinais locais **só no schema**, não no texto: o JSON-LD tem uma lista de **28 bairros de BH** em `areaServed` (Savassi, Lourdes, Buritis, Pampulha, Barreiro etc.) que **não aparece em lugar nenhum do texto visível da página** — é keyword/schema stuffing sem conteúdo correspondente. O texto visível menciona só "Fórum Lafayette", "Raja Gabaglia", "TJMG" e "Av. do Contorno". Tem um gimmick visual de "Modo Tempestade" (chuva/relâmpago animados, ligado a um botão flutuante) — criativo mas não agrega SEO/conteúdo, e tematicamente teria mais lógica em `sabara-civel.html`, que já fala de enchentes do Rio das Velhas.
4. **Prova social**: Nenhuma.
5. **CTAs**: **Zero links diretos de WhatsApp** — o único caminho de conversão é um formulário de diagnóstico com seletor de área (`#diagnostico`) que depende de JS (`processarDiagnosticoCivel()`) para eventualmente abrir o WhatsApp. É a única página do site sem nenhum `href="wa.me/..."` visível no HTML.
6. **Links internos**: **Zero links de saída e zero links de entrada** de outras páginas de conteúdo (só é alcançável pelo menu global "REGIÕES ▾ → Belo Horizonte" e pelo mini-card da home). Não linka para `erro-medico.html`, `acidentes-transito.html` nem `bancario-juros.html`, mesmo mencionando esses temas no texto.
7. **Schema.org**: **Estático** LegalService no `<head>` — mas com **dados de placeholder não preenchidos**: `"streetAddress": "Endereço do Escritório em BH"` (texto literal), `"sameAs": ["https://www.instagram.com/seuperfil", "https://www.linkedin.com/in/seuperfil"]` (placeholder). Isso é um schema quebrado, indexável, e inconsistente com o endereço real usado na home.
8. **Nota: 3/10.** Maior problema do site em termos de dado estruturado quebrado (placeholder indexado), conteúdo que canibaliza a home sem trazer profundidade extra, zero CTA de WhatsApp direto, zero prova social e zero links internos de saída. Forte candidata a reescrita prioritária — ou fusão de conceito com `sabara-civel.html` (que mostra como fazer conteúdo hiperlocal bem-feito).

---

### 1.5 `blindagem-patrimonial.html`

1. **Title/description**: `Blindagem Patrimonial & Holding | Dr. Lucas Semim` / "Proteja seu legado. Planejamento Sucessório, Holding Familiar e Blindagem de Bens. Simule a economia tributária em comparação ao Inventário." Bom gancho ("simule a economia") alinhado com a ferramenta da página.
2. **Headings**: 1 H1 ("PROTEJA O QUE VOCÊ CONSTRUIU"), 2 H2 (Simulador, Arquitetura da Blindagem), 5 H3 (4 cards de estrutura + nada mais). Estrutura ok.
3. **Profundidade**: Conteúdo de qualidade razoável — explica a lógica da holding (isolar PF de risco, sucessão em vida com usufruto, tributação ~11% em aluguéis/venda vs. inventário), e tem uma **calculadora simuladora** (patrimônio → custo estimado de inventário ~20% vs. holding ~6%, com economia total calculada) — recurso de engajamento forte e único. Falta, porém, qualquer citação de lei/jurisprudência (nenhuma referência a ITCMD por estado, nenhum art. do Código Civil sobre doação com reserva de usufruto).
4. **Prova social**: Nenhuma.
5. **CTAs**: 2 links de WhatsApp (**número quebrado**, bug seção 0), um vinculado ao resultado da simulação (bom gatilho, pede reunião logo após o usuário ver a "economia").
6. **Links internos**: **Zero links de saída** — mesmo sendo o tema mais citado como cross-sell por outras páginas (`familia-sucessoes.html` e `contratos-negocios.html` linkam PARA cá), esta página não linka de volta para nenhuma delas.
7. **Schema.org**: Só dinâmico (LegalService + FAQPage com 2 perguntas + Attorney). Sem canonical estático.
8. **Nota: 6/10.** Boa ferramenta interativa e boa lógica de conversão, mas sem prova social, sem jurisprudência citada, e com **HTML inválido** — sobra de código morto (3 `<div class="civel-slide">` de um carrossel abandonado, jogados depois da tag `</html>`) que precisa ser removido.

---

### 1.6 `cadastro-cliente.html`, `painel-cliente.html`, `painel-processo.html`, `sala-reuniao.html`

Fora do escopo de análise de conteúdo/SEO (área logada/formulário de onboarding), mas 2 observações rápidas relevantes ao SEO técnico do site como um todo:
- `painel-cliente.html` e `sala-reuniao.html` têm `<meta name="robots" content="noindex, nofollow">` (correto).
- `cadastro-cliente.html` e `painel-processo.html` **não têm** essa tag — ambas são páginas transacionais/internas que idealmente deveriam ser `noindex` também, para não desperdiçar crawl budget nem aparecer em resultados de busca.

---

### 1.7 `contratos-negocios.html`

1. **Title/description**: `Contratos & Negócios: Blindagem Empresarial | Dr. Lucas Semim` / "Assessoria Jurídica para Empresas. Elaboração e revisão de contratos, acordo de sócios e prevenção de litígios. Blinde seu negócio." Claro e direcionado a B2B.
2. **Headings**: 1 H1 ("A BLINDAGEM DO SEU NEGÓCIO"), 2 H2 (Auditoria de Risco, O Que Nós Fazemos), 6 H3. Estrutura ok.
3. **Profundidade**: Conteúdo B2B razoável — checklist interativo de "riscos contratuais" (6 itens: inadimplência, trabalhista, sócios, fornecedor, LGPD, contrato verbal) que monta uma mensagem de WhatsApp personalizada (boa UX de qualificação de lead). 4 cards de serviço (revisão de contratos, acordo de sócios, recuperação de crédito, compliance/LGPD). Não cita nenhuma lei/jurisprudência específica (nem o próprio CDC, LGPD por número de artigo, etc.), é mais institucional que educativo.
4. **Prova social**: Nenhuma.
5. **CTAs**: 2 CTAs de WhatsApp — um deles no botão principal (formulário de auditoria de risco), outro no card "Sócios em Conflito?". 2 links "AUDITAR CONTRATO →" e "ESTRUTURAR SOCIEDADE →" são **`href="#"` mortos**.
6. **Links internos**: Linka para `blindagem-patrimonial.html` e `execucao-cobranca.html` — a página com **mais links de saída relevantes** do site (empatada com `familia-sucessoes.html`).
7. **Schema.org**: Só dinâmico. **`faq: []` no PAGES{} — nenhum FAQPage schema é gerado para esta página.** É uma das 3 páginas sem FAQ schema.
8. **Nota: 6/10.** Boa arquitetura de cross-sell (é a página mais bem linkada para fora), boa ferramenta de qualificação, mas rasa em conteúdo jurídico de verdade (sem citação legal alguma) e sem FAQ. Tem canonical estático (correto).

---

### 1.8 `erro-medico.html`

1. **Title/description**: `Erro Médico e Hospitalar | Indenização e Justiça | Dr. Lucas Semim` / "Especialista em Erro Médico e Odontológico. Indenização por danos estéticos, cirurgia plástica, negligência hospitalar e obstétrica." Cobre bem os subtemas (plástica, obstétrica, odontológica, hospitalar).
2. **Headings**: 1 H1 ("QUANDO A CURA VIRA DANO"), 2 H2 (Relatório de Negligência, Onde Houve a Falha?), 6 H3. Estrutura ok.
3. **Profundidade**: O melhor ponto de conteúdo jurídico "fino" do site: explica corretamente a distinção entre **obrigação de meio vs. obrigação de resultado** na cirurgia plástica (tecnicamente correto e é exatamente o tipo de nuance que convence um leigo de que o advogado entende do assunto), cobre 4 tipos de erro (hospitalar, obstétrico, odontológico, plano de saúde negando tratamento). Boa especificidade temática, mas sem citar nenhuma súmula/artigo de lei no texto visível (só no FAQ invisível do schema, que cita art. 14 CDC).
4. **Prova social**: Nenhuma.
5. **CTAs**: 2 WhatsApp (**número quebrado**, bug seção 0). **3 dos 4 links de card são mortos** (`href="#"`): "ACISAR HOSPITAL →" (**erro de digitação** — deveria ser "ACIONAR"), "BUSCAR JUSTIÇA →", "INDENIZAÇÃO DENTÁRIA →". Só "OBTER LIMINAR →" também é `#`. Ou seja, **todos os 4 CTAs secundários da página são não-funcionais**.
6. **Links internos**: **Zero links de saída** para outras páginas (nem para `seguros-indenizacao.html`, que seria natural pelo tema "plano de saúde negando tratamento").
7. **Schema.org**: Só dinâmico (LegalService + FAQPage com 2 perguntas + Attorney). Canonical via JS.
8. **Nota: 5/10.** Melhor conteúdo jurídico "de nicho" do site (distinção meio x resultado), mas prejudicado por 4 CTAs quebrados/mortos (incluindo um com erro de digitação visível), zero links de saída e zero prova social. Fácil de subir de nota: só corrigir os 4 `href="#"` já resolveria boa parte do problema.

---

### 1.9 `execucao-cobranca.html`

1. **Title/description**: `Execução e Cobrança: Recuperação de Crédito | Dr. Lucas Semim` / "Advocacia especializada em Execução de Títulos e Cobrança. Localização de bens, bloqueio de contas e uso do sistema SNIPER para recuperar seu dinheiro." Bom gancho técnico ("sistema SNIPER").
2. **Headings**: 1 H1 ("O DEVEDOR ESCONDE. NÓS ENCONTRAMOS."), 2 H2 (calculadora, arsenal de busca), 5 H3 (4 ferramentas). Estrutura ok.
3. **Profundidade**: Conteúdo tecnicamente diferenciado — cita corretamente **SISBAJUD** (bloqueio de contas), **RENAJUD** (bloqueio de veículos), **INFOJUD/SREI** (declarações de renda e registro de imóveis) e menciona a ferramenta interna "SNIPER" (rastreamento de vínculos societários/laranjas). Isso é um diferencial real de credibilidade técnica que praticamente nenhum concorrente publica de forma tão clara. Tem calculadora de atualização de dívida (IGPM + 1% a.m. + multa). Falta, no entanto, qualquer menção a prazos (prescrição de título executivo) ou custas processuais.
4. **Prova social**: Nenhuma.
5. **CTAs**: 2 WhatsApp (**número quebrado**, bug seção 0), um deles vinculado ao resultado da calculadora (bom gatilho, mesma lógica de `blindagem-patrimonial.html`).
6. **Links internos**: **Zero links de saída.** Recebe entrada de `contratos-negocios.html` (âncora "EXECUTAR DÍVIDA →").
7. **Schema.org**: Só dinâmico (LegalService + FAQPage com 2 perguntas + Attorney). **Sem canonical estático** — nenhum `<link rel="canonical">` no HTML (setado só via JS).
8. **Nota: 7/10.** Uma das páginas de melhor conteúdo técnico/diferenciado do site (nomes reais de sistemas de busca de bens), boa calculadora, mas sem prova social e sem nenhum link de saída — fica isolada na malha de conteúdo apesar de ser um ótimo cross-sell natural para `bancario-juros.html` e `contratos-negocios.html`.

---

### 1.10 `familia-sucessoes.html`

1. **Title/description**: `Família & Sucessões: Blindagem de Legado | Dr. Lucas Semim` / "Advocacia especializada em Divórcios de Alto Patrimônio, Guarda Compartilhada e Inventários. Discrição absoluta e estratégia para proteger seu legado." Bom posicionamento de "alto padrão"/discrição, mas foge um pouco do público leigo em dor real (mais voltado a divórcio de patrimônio alto do que ao caso comum de um usuário buscando "advogado guarda dos filhos Sabará").
2. **Headings**: 1 H1 ("DIREITO DE FAMÍLIA ESTRATÉGICO"), 3 H2 (numerados: 1. Divórcio de Alto Patrimônio, 2. Guarda e Convivência, 3. Inventário), 6 H3. Boa estrutura de artigo (title numerado ajuda escaneabilidade).
3. **Profundidade**: Texto corrido mais "de artigo" que as outras páginas (bom para SEO de conteúdo), cobre divórcio de alto patrimônio (com CTA de "varredura patrimonial" contra ocultação de bens — gancho forte), guarda compartilhada/pensão, pacto antinupcial, testamento, inventário (menciona que pode levar "10 anos e consumir até 40% dos bens" e sugerir extrajudicial/holding). É uma das páginas mais bem escritas em prosa, mas ainda sem nenhuma citação de lei/artigo visível (o prazo de 60 dias do art. 611 CPC só existe no FAQ invisível do schema).
4. **Prova social**: Nenhuma.
5. **CTAs**: 2 WhatsApp (**número quebrado**, bug seção 0) — um vinculado à "auditoria patrimonial" (bom gatilho de urgência/suspeita), outro de agendamento sigiloso.
6. **Links internos**: Linka para `bancario-juros.html` (pouco natural, "Direito Bancário" nos "Links Úteis") e `blindagem-patrimonial.html` (natural, holding). Curiosamente tem também um link `../index.html` rotulado **"Voltar ao Criminal"** — resquício de copy do site-mãe criminal, deveria dizer algo cível.
7. **Schema.org**: Só dinâmico (LegalService + FAQPage com 2 perguntas + Attorney). Canonical estático presente (correto).
8. **Nota: 6/10.** Melhor prosa/copy do site depois da home, mas sem prova social, sem citação legal visível, e com um resíduo de copy errado ("Voltar ao Criminal" para um link que vai para a home cível).

---

### 1.11 `sabara-civel.html`

1. **Title/description**: `Advogado Cível em Sabará | Indenizações, Mineração e Contratos` / "Advocacia Cível em Sabará/MG. Especialista em Indenização contra Mineradoras (Rachaduras/Poeira), Enchentes e Contratos Empresariais. Atuação no Fórum Melo Viana." **O melhor par title/description do site depois da home** — extremamente específico e local (mineração, enchentes, fórum nomeado), exatamente o tipo de busca que um morador de Sabará/Ravena faria.
2. **Headings**: **2 H1** (bug de duplicidade — ver item 2 abaixo), 3 H2, 6 H3.
3. **Profundidade**: A página com o conteúdo **mais hiperlocal e diferenciado** do site. Tem um switch único "👤 Para Você / 🏭 Para Empresas" que troca o conteúdo da página (hero, cards de serviço) entre pessoa física e empresa — recurso de UX que nenhuma outra página tem. Cobre danos estruturais por mineração (rachaduras, poeira, explosão de detonação) em bairros nomeados (Ravena, General Carneiro, Cuiabá, Nações Unidas), enchentes do Rio das Velhas e responsabilidade da COPASA, usucapião no Centro Histórico/Roça Grande, e para empresas: gestão contratual com mineradoras, recuperação de crédito B2B. Cita o **Fórum Melo Viana** e diferencia Varas Cíveis de Juizados Especiais. É conteúdo que nenhum concorrente genérico replicaria — altíssima relevância para "advogado Sabará".
4. **Prova social**: Nenhuma (mesma lacuna do resto do site).
5. **CTAs**: Só 1 link de WhatsApp direto no corpo (mas correto — número certo), mais um formulário de diagnóstico (`#diagnostico`) com 4 áreas selecionáveis, iguais ao de `belohorizonte-civel.html`.
6. **Links internos**: **Zero links de saída** para outras páginas de conteúdo, e **zero links de entrada** de outras páginas de conteúdo (só é alcançável pelo menu "REGIÕES ▾" e pelo mini-card da home).
7. **Schema.org**: **Estático** LegalService no `<head>`, com endereço real preenchido (R. Comendador Vianna, 214 - Centro, Sabará, CEP 34505-000) e `knowsAbout` bem específico (ex.: "Ação de Indenização por Rachaduras", "Danos causados por explosão de mineradora", "Regularização Fundiária Urbana (REURB)"). É o schema mais bem escrito do site, mas ainda assim `faq: []` no `PAGES{}` — **nenhum FAQPage schema gerado**, apesar de o conteúdo da página ter material de sobra para gerar 4-5 perguntas hiperlocais (ex.: "Posso processar mineradora por rachadura em Ravena?").
8. **Nota: 8/10.** Conteúdo mais forte e diferenciado do site depois da home — mas com 2 bugs técnicos fáceis de corrigir (H1 duplicado, FAQ schema vazio) e zero prova social/links de saída. É o **modelo a replicar** para as outras páginas locais e temáticas.

---

### 1.12 `seguros-indenizacao.html`

1. **Title/description**: `Seguro Negado? Recupere sua Indenização | Dr. Lucas Semim` / "Advogado especialista em Seguros. Ação contra seguradora por negativa de pagamento. Veículo, Vida, Residencial e Empresarial. Revertemos a negativa." Excelente formato de pergunta direta ("Seguro Negado?") — bate exatamente com o que alguém digitaria no Google depois de receber uma carta de recusa.
2. **Headings**: 1 H1 ("A SEGURADORA NEGOU?"), 3 H2 (Reverter a Negativa, Onde Atuamos, Desculpas Comuns das Seguradoras), 3 H3. Estrutura clara e temática.
3. **Profundidade**: A página com **mais citações jurídicas específicas visíveis no corpo do texto** do site inteiro: cita a **Súmula 609 STJ** (seguradora não pode negar por doença preexistente sem exame prévio) diretamente sob o formulário, e a **Súmula 616 STJ** (não pode cancelar por atraso sem notificação prévia) na seção final "Desculpas Comuns", com uma segunda linha rebatendo a desculpa "doença preexistente" também com base em exame prévio não solicitado. Esse formato de "desculpa da seguradora → por que não vale" é muito eficaz para o público leigo, porque valida a frustração da pessoa com uma resposta técnica concreta.
4. **Prova social**: Nenhuma.
5. **CTAs**: 4 links de WhatsApp (**número quebrado**, bug seção 0) — um por tipo de seguro (auto, vida, empresarial) mais o botão principal do formulário. Densidade de CTA boa.
6. **Links internos**: **Zero links de saída e zero de entrada** de outras páginas de conteúdo (só menu + mini-card da home via card "Apólice de Seguro Negada").
7. **Schema.org**: Só dinâmico (LegalService + FAQPage com **apenas 1 pergunta** + Attorney). Canonical estático presente (correto).
8. **Nota: 7/10.** Melhor uso de jurisprudência real e visível do site fora da home (2 súmulas STJ citadas no corpo do texto, não só no schema invisível), bom copy de gatilho ("A Seguradora Negou?"), mas FAQ schema raso (1 pergunta só) e isolada na malha de links internos.

---

## 2. Ranking consolidado

### As 3 páginas mais fracas (candidatas prioritárias à reescrita)

| # | Página | Nota | Por quê é prioridade |
|---|---|---|---|
| 1 | **`belohorizonte-civel.html`** | 3/10 | Schema `LegalService` estático com **dados de placeholder indexados** (endereço literal "Endereço do Escritório em BH", redes sociais "seuperfil"), conteúdo que **canibaliza a home** sem aprofundar nada, zero CTA de WhatsApp direto no HTML, zero prova social, zero links de saída/entrada — apesar de ser a página teoricamente responsável por capturar todo o volume de busca genérico "advogado cível Belo Horizonte". |
| 2 | **`acidentes-transito.html`** | 4/10 | Provavelmente o **maior volume de busca comercial do nicho** ("advogado acidente de trânsito", "indenização atropelamento") tratado como página secundária: **ausente do menu principal e do footer** (órfã de navegação), conteúdo raso (sem prazo prescricional visível, sem valores de referência, 1 súmula só), CTA lateral que foge do domínio cível para o site criminal, e CTA principal de WhatsApp provavelmente quebrado (número malformado). |
| 3 | **`bancario-juros.html`** | 5/10 (empate técnico com `erro-medico.html`, desempate pelo tema ter maior potencial de volume — Pix/RMC são das 6 novas frentes de conteúdo da home) | Zero links de saída (página-beco-sem-saída), FAQ schema com **1 pergunta só**, 1 CTA morto (`href="#"`), e é justamente a página que deveria aprofundar "Golpe do Pix" e "RMC/Consignado" — temas que a home já promete com força mas que aqui recebem tratamento raso, quase superficial. |

*(Nota: `erro-medico.html` também ficou com 5/10 e tem um problema muito concreto e fácil de citar ao cliente — 4 CTAs secundários mortos, incluindo um com erro de digitação ("ACISAR" em vez de "ACIONAR") — mas seu conteúdo textual de base (distinção obrigação de meio x resultado) é mais forte que o de `bancario-juros.html`, por isso ficou em 4º lugar na fila de prioridade, não em 3º.)*

### As 3 páginas mais fortes (modelo a replicar)

| # | Página | Nota | Por que é modelo |
|---|---|---|---|
| 1 | **`index.html`** (fora da comparação de "página de serviço", mas é o padrão-ouro do site) | 9/10 | Único FAQ visível + schema estático completo (LegalService/FAQPage/BreadcrumbList), prova social real (depoimentos), CTAs por tema (as 6 novas frentes), stats de autoridade. Deveria servir de gabarito estrutural para todas as páginas de serviço: toda página de serviço deveria ter seu próprio mini-acordeão de FAQ visível + 2-3 depoimentos específicos daquele tema. |
| 2 | **`sabara-civel.html`** | 8/10 | Conteúdo hiperlocal genuíno (mineração, enchentes, bairros nomeados, fórum local, switch pessoa/empresa) que nenhum concorrente replicaria facilmente — é exatamente o tipo de especificidade que convence o Google (E-E-A-T local) e convence o leigo em Sabará de que "esse advogado conhece a minha situação". Só precisa dos ajustes técnicos (H1 duplicado, FAQ schema vazio) e de prova social para chegar a 10. |
| 3 | **`seguros-indenizacao.html`** | 7/10 | Melhor uso de jurisprudência real e visível no corpo do texto (2 súmulas STJ citadas fora do schema), formato de "desculpa da seguradora → por que não vale" muito eficiente para o público leigo, bom volume de CTAs. |

*(`execucao-cobranca.html`, também 7/10, é o outro forte candidato a "modelo": a especificidade técnica das ferramentas de busca de bens (SISBAJUD/RENAJUD/SNIPER) é um diferencial de credibilidade que vale a pena replicar em outras páginas como prova de "como trabalhamos", mas perde para `seguros-indenizacao.html` por não ter absolutamente nenhum link interno de saída.)*

---

## 3. Achados técnicos transversais (afetam várias páginas / o site inteiro)

Resumo dos bugs e padrões que aparecem repetidos entre as fichas acima, para referência rápida de correção:

1. **Número de WhatsApp malformado em 9 arquivos / 21 ocorrências** (`55031983944973` em vez de `5531983944973`) — provável causa de falha ao abrir o CTA principal em 8 das 10 páginas de serviço. Correção: find-and-replace global. **Prioridade máxima.**
2. **`<title>` otimizado nunca aplicado** por causa da condição `!document.title.includes('Lucas Semim')` em `civel-seo.js` — o site roda com títulos mais fracos do que os que o próprio time já escreveu no `PAGES{}`. Correção: 1 linha de código (trocar a condição ou remover a checagem).
3. **FAQPage schema invisível** em 7 páginas de serviço — perguntas existem só em JSON-LD, sem acordeão correspondente no HTML visível. Reduz a chance de rich snippet e desperdiça conteúdo pronto que poderia estar convertendo visitantes.
4. **3 páginas sem nenhum FAQ schema** (`faq: []`): `contratos-negocios.html`, `sabara-civel.html`, `belohorizonte-civel.html`.
5. **Dados de placeholder indexados** em `belohorizonte-civel.html` (endereço e redes sociais fake) — risco de imagem profissional e inconsistência de NAP.
6. **Três handles de Instagram diferentes** usados entre `index.html` (@lucasrenansemim), `sabara-civel.html` (@lucassemim.adv) e `belohorizonte-civel.html` (placeholder @seuperfil) — confunde a resolução de entidade do Google.
7. **`acidentes-transito.html` ausente do menu principal/footer** (definidos em `structure.js`) — única página de serviço órfã da navegação global.
8. **Zero prova social fora da home** — nenhuma das 10 páginas de serviço/regionais tem depoimento, número de casos ganhos ou selo de confiança específico do tema.
9. **7 links mortos `href="#"`** espalhados em `bancario-juros.html`, `contratos-negocios.html` (×2) e `erro-medico.html` (×3, incluindo erro de digitação "ACISAR").
10. **HTML inválido** em `blindagem-patrimonial.html` (markup de carrossel morto depois da tag `</html>`).
11. **H1 duplicado** em `sabara-civel.html` (dois `<h1>` no DOM, um por modo pessoa/empresa, alternados só por CSS).
12. **Malha de links internos muito pobre**: fora da home, só `contratos-negocios.html` e `familia-sucessoes.html` linkam para outras páginas de serviço no corpo do texto. `bancario-juros.html`, `erro-medico.html`, `execucao-cobranca.html`, `belohorizonte-civel.html`, `sabara-civel.html` e `seguros-indenizacao.html` têm **zero links de saída** — cross-sells óbvios (ex.: erro médico ↔ plano de saúde/seguros; execução de dívida ↔ bancário) não existem.
13. **2 páginas transacionais sem `noindex`** (`cadastro-cliente.html`, `painel-processo.html`) enquanto as outras 2 do mesmo tipo têm.
