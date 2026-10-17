# Estudo dos sistemas de marketing/conversão — lucassemim.adv.br (site principal, Criminal)
### Objetivo: identificar o que vale a pena portar/adaptar para civel.lucassemim.adv.br

Arquivos analisados (conteúdo real, linha a linha):
- `index.html` (homepage do site principal)
- `style.css` (raiz)
- `truth-shield.js`
- `js/header-elite.js` (contém também `HeroCinematic`, embutido no mesmo arquivo)
- `js/footer-seo.js`
- `js/return-lead.js`
- `js/selo-qualidade.js`
- `js/smart-cta.js`

**Achado preliminar importante**: `style.css` (paleta azul-marinho `#0B132B` + dourado-sutil `#B59A5F`, tipografia Playfair Display + Inter, seções tipo `.bloco-autoridade`, `.card-triagem`, `.rodape`) **não está referenciado em nenhum `<link>` do `index.html`** — é CSS legado, órfão, de uma versão anterior do site. O design real e ativo da homepage vive inteiramente em CSS inline crítico dentro do `<head>` do `index.html` e nos estilos injetados via JS pelos módulos (`header-elite.js`, `footer-seo.js`, `smart-cta.js` etc.), todos já usando **fundo `#050505`, dourado `#d4af37`, Teko + Lato** — ou seja, o sistema visual "dossiê/elite" que hoje já existe no `civel.lucassemim.adv.br` **é, na prática, o mesmo DNA visual do site criminal ativo**, não o do `style.css` morto. Isso muda a recomendação do item 6 (ver seção final).

---

## 1. `truth-shield.js` — Auto-linkagem de fontes oficiais + selo de vigência

### O que faz
Roda em páginas de artigo (`document.querySelector('.article-content')` — só executa se esse container existir na página, então hoje atua em `noticias.html`/posts, não na home). Três mecanismos:

1. **Auto-linker de termos jurídicos → fonte oficial.** Um dicionário fixo `fontesOficiais` mapeia termos (`"CPP"`, `"Código Penal"`, `"Lei de Drogas"`, `"STF"`, `"STJ"`, `"CNJ"`, `"OAB"` etc.) para URLs do Planalto/STF/STJ/CNJ/OAB. Ele varre o `innerHTML` do artigo com regex (`\bTERMO\b`, evitando já ter link) e substitui a **primeira ocorrência** de cada termo por um `<a>` com `target="_blank"`, `class="official-source-link"` e `title="Fonte Oficial Verificada: TERMO"`.
```js
const regex = new RegExp(`\\b${termo}\\b(?!([^<]+)?>)`, 'i');
if (!html.includes(`href="${link}"`)) {
    html = html.replace(regex, `<a href="${link}" target="_blank" class="official-source-link" ...>${termo}</a>`);
}
```
2. **Selo de integridade no rodapé do artigo**: injeta um bloco "CONTEÚDO JURÍDICO VERIFICADO — Em conformidade com a Legislação Federal, STF e CNJ" com ícone de escudo dourado, logo antes do copyright.
3. **Alerta de vigência**: lê `meta[itemprop="datePublished"]`, calcula a diferença em anos até hoje; se > 1,5 ano, injeta uma barra fixa no rodapé da tela ("ATENÇÃO: publicado há mais de 1 ano... CONSULTE O PLANTÃO") com link de WhatsApp.

### De onde vem o dado
Tudo é **estático e genérico** — não há nenhum dado de cliente/processo real. O dicionário de fontes é hardcoded no JS; a data vem de metatag do próprio artigo (conteúdo editorial, não caso). **Portanto o mecanismo inteiro já é 100% seguro para reaproveitar sem qualquer ajuste de sigilo** — ele nunca tocou em dado de cliente, é puramente sobre a legislação citada no texto editorial.

### Recomendação para o cível
Portar como está, trocando apenas o dicionário de termos/links:
```js
const fontesOficiais = {
    "Código Civil": "https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm",
    "CC/2002": "https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm",
    "Código de Processo Civil": "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm",
    "CPC": "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm",
    "Código de Defesa do Consumidor": "https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm",
    "CDC": "https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm",
    "Lei do Inquilinato": "https://www.planalto.gov.br/ccivil_03/leis/l8245.htm",
    "Lei de Alimentos": "https://www.planalto.gov.br/ccivil_03/leis/l5478.htm",
    "Estatuto da Criança e do Adolescente": "https://www.planalto.gov.br/ccivil_03/leis/l8069.htm",
    "ECA": "https://www.planalto.gov.br/ccivil_03/leis/l8069.htm",
    "STJ": "https://www.stj.jus.br/",
    "TJMG": "https://www.tjmg.jus.br/",
    "CNJ": "https://www.cnj.jus.br/",
    "OAB": "https://www.oab.org.br/"
};
```
Trocar o texto do selo para "CONTEÚDO JURÍDICO VERIFICADO — Em conformidade com o Código Civil, CPC e jurisprudência do STJ/TJMG" e o link do alerta de vigência para o WhatsApp do cível. Nenhum dado de caso é necessário — o próprio mecanismo já opera sobre citações de lei, nunca sobre fatos de cliente. Prioridade: **alta** — reforça autoridade/EEAT em artigos de divórcio, inventário, usucapião etc., que são exatamente o tipo de conteúdo que precisa de credibilidade jurídica para SEO.

---

## 2. `selo-qualidade.js` — Selo de auditoria + canal de denúncia/correção (V3)

### O que faz
É um módulo autocontido (`window.SeloQualidade`), injetado ao final de `.article-content`, que:
1. Constrói uma caixa visual "Compromisso com a Verdade Jurídica" com ícone de balança, texto fixo (genérico, sobre rigor técnico e súmulas STF/STJ) e um botão "REPORTAR IMPRECISÃO OU ERRO".
2. O botão abre um `<dialog>` nativo (modal acessível, com `showModal()`, trap de foco por Tab, fechamento por Esc/clique fora/backdrop) chamado "CANAL DE QUALIDADE".
3. O modal tem 3 campos: Nome (opcional), tipo de problema (`<select>` com 5 opções: erro de lei, texto impreciso, sugestão, link quebrado, outro) e uma textarea obrigatória de detalhes.
4. Ao enviar, monta uma mensagem formatada e **abre o WhatsApp** (não envia a nenhum backend/formulário — é só um deep-link `wa.me`):
```js
const texto = `*🔍 CANAL DE AUDITORIA — LUCASSEMIM.ADV.BR*\n\n` +
    `*Artigo:* ${artigo}\n*URL:* ${link}\n\n` +
    `*Leitor:* ${nome || 'Anônimo'}\n*Classificação:* ${tipo}\n*Descrição:* ${msg}\n\n` +
    `_Aguardando análise técnica da equipe._`;
```
5. Dispara eventos GA4 (`report_modal_open`, `report_sent`, `selo_view`).

### Vale a pena ter equivalente no cível?
Sim, com ressalva de enquadramento. O mecanismo não expõe nenhum dado de cliente — é puramente editorial (correção de artigos de blog/conteúdo). Ele cumpre duas funções de marketing:
- **Sinal de confiança/E-E-A-T** (Google valoriza conteúdo "auditável" e corrigível — combate percepção de "fake news jurídico", que é ainda mais relevante em cível porque o público busca muito "modelo de petição" e conteúdo picotado de baixa qualidade).
- **Canal de baixo atrito para transformar leitor em lead**: mesmo quem só quer "corrigir um erro" acaba entrando em contato direto por WhatsApp — é geração de lead disfarçada de canal de qualidade.

### Recomendação para o cível
Portar o componente inteiro (é framework-agnostic, sem dependência de dado sensível), trocando:
- Texto do selo: "Compromisso com a Precisão Jurídica" / "elaborado com rigor técnico, fundamentado no Código Civil, CPC e jurisprudência atualizada do STJ e TJMG".
- Prefixo da mensagem WhatsApp: `*🔍 CANAL DE AUDITORIA — CIVEL.LUCASSEMIM.ADV.BR*`.
- Visual: já é dourado/preto (`#d4af37`, `#111112`, `#050505`) — bate 100% com a paleta do cível, não precisa mudar cor, só pode trocar `Teko` por combinação Teko+Fira Code se quiser reforçar o tom "dossiê" (ex.: usar Fira Code no rótulo `CANAL DE QUALIDADE` como se fosse um "ID de protocolo").
Prioridade: **média** — bom para SEO/autoridade de conteúdo, mas não é o maior driver de conversão direto (é um canal de nicho, para quem já está lendo profundamente).

---

## 3. `smart-cta.js` — CTA dinâmico por correspondência de palavra-chave (não é scroll/tempo)

### O que realmente faz (mecanismo exato)
Ao contrário do que o nome sugere, **não muda o texto por tempo de página ou posição de scroll** — a lógica é **matching de keywords do conteúdo da página contra um banco de "casos de uso"**, escolhendo o card de CTA mais relevante para inserir dentro de um container fixo `.cta-internal` (presumivelmente colocado manualmente no meio de artigos).

Passo a passo:
1. **Constrói um "contexto textual da página"** concatenando: `pathname`, `document.title`, meta keywords, meta description, `<h1>`, e os primeiros 4 `<h2>` de `article/.artigo-conteudo/.post-content/main` — tudo em minúsculas e sem acentos (`normalize('NFD')`).
2. **Banco de 16 "casos"** (`config.db`), cada um com: lista de `match` (palavras-chave), título, descrição, texto do botão, classe de estilo (`btn-cta-red` para urgência/vermelho vs `btn-cta-elite` dourado), ícone FontAwesome e mensagem pronta de WhatsApp. Exemplos: "flagrante/preso/delegacia" → CTA vermelho urgente; "habeas corpus/hc/liminar" → CTA vermelho; "tráfico/drogas/porte" → CTA dourado; "sabara/contagem/betim/..." → CTA geo-segmentado.
3. **Scoring**: para cada item do banco, soma pontos por cada keyword presente no contexto — o peso de cada keyword é proporcional ao seu tamanho (`Math.max(1, Math.floor(kwNorm.length/4))`), ou seja, termos mais longos/específicos pesam mais que termos curtos genéricos:
```js
scoreMatch(item, ctx) {
    return item.match.reduce((score, kw) => {
        const kwNorm = kw.normalize('NFD').replace(/[̀-ͯ]/g, '');
        if (!ctx.includes(kwNorm)) return score;
        return score + Math.max(1, Math.floor(kwNorm.length / 4));
    }, 0);
}
```
4. Escolhe o item com maior score (`findBestMatch`); se nenhum item pontuar, cai no `default` (CTA genérico "PRECISA DE DEFESA ESTRATÉGICA?").
5. Renderiza o banner (título + descrição + botão) dentro do `.cta-internal`, com **reveal via `IntersectionObserver`** (fade+translateY ao entrar na viewport — aqui sim há lógica de "aparecer só quando visível", mas é reveal visual, não troca de conteúdo) e **injeta UTM da URL na mensagem de WhatsApp** (`utm_campaign` vira "_(Origem: campanha)_" no texto).
6. Eventos GA4: `smart_cta_shown` (quando entra na viewport) e `smart_cta_click`.

### Recomendação para o cível
Este é o **sistema de maior potencial de conversão** para portar, porque ele conecta intenção de busca → CTA hiper-específico → WhatsApp pré-preenchido, sem precisar de nenhum dado de cliente (o banco é só taxonomia de temas jurídicos genéricos). Adaptar o `config.db` para temas cíveis, por exemplo:

```js
db: [
  { match: ['divorcio','separacao','partilha de bens','guarda'],
    title: 'DIVÓRCIO OU GUARDA EM ANDAMENTO?',
    desc: 'Partilha de bens, pensão e guarda podem ser resolvidos com estratégia. Fale com o setor Cível de Semim & Associados.',
    btnText: 'FALAR SOBRE MEU DIVÓRCIO', btnClass: 'btn-cta-elite', icon: 'fas fa-people-arrows',
    msg: 'Preciso de orientação sobre divórcio/guarda/partilha de bens.' },
  { match: ['inventario','partilha','heranca','testamento'],
    title: 'INVENTÁRIO OU HERANÇA TRAVADA?',
    desc: 'Inventário extrajudicial ou judicial — evite anos de disputa entre herdeiros.',
    btnText: 'RESOLVER INVENTÁRIO', btnClass: 'btn-cta-elite', icon: 'fas fa-scroll',
    msg: 'Preciso de ajuda com inventário / partilha de herança.' },
  { match: ['despejo','inquilino','aluguel atrasado','locacao'],
    title: 'AÇÃO DE DESPEJO OU ALUGUEL ATRASADO?',
    desc: 'Prazos em ação de despejo correm rápido — regularize agora.',
    btnText: 'AÇÃO URGENTE DE DESPEJO', btnClass: 'btn-cta-red', icon: 'fas fa-house-circle-exclamation',
    msg: 'Preciso de ajuda urgente com despejo/aluguel atrasado.' },
  { match: ['negativado','nome sujo','indenizacao','dano moral','consumidor'],
    title: 'NOME NEGATIVADO INDEVIDAMENTE?',
    desc: 'Cobrança indevida ou negativação sem justa causa gera direito a indenização.',
    btnText: 'ANALISAR MEU CASO', btnClass: 'btn-cta-elite', icon: 'fas fa-file-invoice-dollar',
    msg: 'Fui negativado indevidamente / quero indenização por dano moral.' },
  // ... plano de saúde, usucapião, contratos, indenização por acidente etc.
],
default: { title: 'PRECISA DE ORIENTAÇÃO CÍVEL?', ... }
```
Manter exatamente a mesma engenharia (scoring por tamanho de keyword, container `.cta-internal`, IntersectionObserver reveal, UTM pass-through). É reaproveitável 1:1, só trocando dados — **zero risco de sigilo**, pois o banco é sobre categorias de direito, não sobre casos reais.

---

## 4. `return-lead.js` — Widget de retorno/reengajamento de visitante recorrente (ReturnLead V3)

### Como funciona (mecanismo completo)
Usa **`localStorage`** (chave `semim_rv_v1`) para rastrear visitas — não é cookie, não é popup de saída (exit-intent). Fluxo:

1. **Detecção de recorrência**: a cada carregamento de página, lê o registro salvo (`count`, `firstVisit`, `lastVisit`, `showCount`, `converted`, `lastShown`). Se não existir, cria com `count:1` e não mostra nada (é a 1ª visita). Se existir, incrementa `count` e verifica `count >= minVisitsToShow` (2) → `isReturning = true`.
2. **Regras de exibição** (`shouldShow`): só mostra se `isReturning`, não `converted` ainda, `showCount < hideAfterShown` (3 — não satura o mesmo visitante) e se passaram `minDaysBetweenShows` (7 dias) desde a última exibição.
3. **Dois gatilhos de exibição**, o que disparar primeiro:
   - Tempo na página: `setTimeout(6000ms)`.
   - Scroll: quando o usuário passa de 45% da altura da página (`scrollTriggerPct`).
4. **Widget flutuante** (canto inferior esquerdo, fixed, `backdrop-filter: blur`, visual idêntico ao restante do site — dourado/preto), com um **mini-funil conversacional de 4 passos** (não é formulário estático):
   - Passo 1: "Já teve atendimento com o Dr. Lucas?" (Sim / Estou pensando / Ainda não).
   - Passo 2: pergunta ramificada conforme resposta do passo 1 (ex.: se "sim" → avaliação do atendimento; se "pensando"/"não" → qual a situação atual, com opções específicas do domínio criminal).
   - Passo 3: captura nome + telefone (com máscara de telefone no input), botão "Analisar meu caso".
   - Passo 4: mostra uma **resposta gerada por IA** (chama `POST /api/claude-chat.php` com um system prompt que instrui a IA a gerar 2-3 frases reconhecendo a situação do usuário e empurrando para o WhatsApp) e um botão final de WhatsApp com a mensagem + resposta da IA já embutida.
5. **Persistência dupla do lead**: além do WhatsApp, envia os dados para um **Google Apps Script** (`googleScriptUrl`, `fetch` com `mode:'no-cors'`) — ou seja, cria uma planilha/CRM leve de todos os leads capturados pelo widget, mesmo que a pessoa não clique no botão final do WhatsApp (o envio ao Sheet acontece assim que o passo 3 é enviado).
6. Marca `converted:true` no localStorage quando o usuário clica no botão final do WhatsApp, para não mais incomodá-lo.
7. Eventos GA4 (`rl_widget_shown`, `rl_step1_answered`, `rl_lead_generated`, `rl_whatsapp_click`, etc.).

### Isso reduziria abandono no formulário do cível?
Sim, e é provavelmente o sistema de **maior ROI potencial** para portar, porque resolve exatamente o problema de "visitante que saiu sem converter": ele reaparece na 2ª visita, oferece um micro-compromisso (3 cliques, não um formulário longo) e só pede nome+telefone no fim, depois de já ter engajado — isso reduz fricção de formulário longo, que é a maior causa de abandono. A resposta gerada por IA aumenta a percepção de personalização/atendimento imediato antes mesmo de falar com humano.

### Recomendação para o cível
Portar a arquitetura inteira (localStorage, timers, mini-funil de 4 passos, dual-write WhatsApp+Sheets), trocando apenas o **conteúdo das perguntas** para os temas cíveis e (essencial) o **system prompt da IA**:
```js
const systemPrompt = `Você é o assistente do setor Cível de Semim & Associados — advocacia cível em Sabará/BH.
Com base no contexto do visitante recorrente, gere UMA orientação jurídica objetiva de 2-3 frases que:
- Reconheça a situação específica do usuário (ex.: divórcio, inventário, cobrança indevida, locação)
- Explique por que agir logo evita perda de prazo/direito
- Sugira dar continuidade com o setor Cível pelo WhatsApp
Nunca dê conselho definitivo — sempre indique análise completa com o advogado. Máximo 60 palavras.`;
```
E as opções do Passo 2 (situação atual) por algo como: "Divórcio/guarda", "Inventário/herança", "Cobrança indevida/nome sujo", "Contrato/locação", "Quero tirar uma dúvida". Trocar `storageKey` (ex. `semim_civel_rv_v1`, para não colidir com o storage do site criminal caso o usuário navegue entre os dois — são domínios/subdomínios diferentes então o localStorage já é isolado por origem, mas é boa prática nomear diferente para debug). Reaproveitar o endpoint `/api/claude-chat.php` e criar uma aba separada na planilha Google (ou nova Sheet) para não misturar leads criminal/cível. **Nenhum dado de caso real é necessário para portar — o mecanismo é sobre o comportamento do visitante, não sobre conteúdo de processo.**

---

## 5. `header-elite.js` e `footer-seo.js` — Estrutura de menu/rodapé e SEO injetado

### `header-elite.js` (+ `HeroCinematic`, embutido no mesmo arquivo)
- Header fixo (`position: fixed`), com efeito glassmorphism que ativa (`blur(12px)` + fundo `rgba(5,5,5,0.88)`) só depois de `scrollThreshold: 50px` de scroll — via `requestAnimationFrame` para performance.
- Marca (ícone de balança com glow pulsante via `animation: heBalancaGlow 4s`), nome "SEMIM & ASSOCIADOS" + subtítulo "Advocacia Criminal · OAB/MG 222.539".
- **Badge contextual dinâmico** na navbar: detecta o path da página (`detectContext()`) e injeta badge diferente — `UNIDADE NEWS` (vermelho) se path contém `/noticias`, `PLANTÃO ATIVO` (laranja) se contém `/emergencia`/`/flagrante`/`/preso`. Isso é um sinalizador visual de "seção" sem precisar de config manual por página.
- 4 links de nav fixos (Início, Notícias, Serviços, Advogado) com detecção de link ativo (`aria-current="page"`) por matching de path.
- Botão de plantão (CTA vermelho pulsante — `animation: hePlantaoPulse`) sempre visível, WhatsApp direto.
- Menu mobile acessível: hamburger nativo (sem lib), `aria-expanded`, fecha ao clicar fora ou Esc, fecha ao clicar em link.
- `HeroCinematic` (mesmo arquivo): slideshow de 4 imagens de fundo do hero, com Ken Burns (`scale 1→1.12` em 12s), lazy-load da próxima imagem, pausa via `IntersectionObserver` (fora da viewport) e no hover do mouse — poupa CPU/rede.

### `footer-seo.js`
- Rodapé inteiro construído via DOM API (sem `innerHTML`), com 4 colunas: Identidade (logo+tagline+endereço+telefone+badge OAB), **"Jurisdição Tática"** (grid de 10 cidades atendidas — Sabará, BH, Contagem, Betim, Nova Lima, Santa Luzia, Vespasiano, Esmeraldas, Igarapé, Brumadinho — cada uma linkando para uma landing page de cidade, ótimo para SEO local), **"Blindagem Tática"** (6 links para páginas de serviço/pilares de conteúdo — Audiência de Custódia, Júri, Execução Penal, HC, Nulidades, Drogas) e **"Sistemas"** (links para Radar de Notícias, Calculadora Penal, Sistema Anjo/portal investidor — produtos internos do site) + redes sociais.
- Faixa de CTA no topo do rodapé ("Preso? Em Flagrante?...") com botão WhatsApp + botão "Agendar Consulta" (Cal.com).
- Faixa de "trust" (3 itens: Registro OAB/MG, Sabará & Comarca BH/MG, Plantão 24h·7 dias).
- **Injeta Schema.org `LegalService`** completo no `<head>` (endereço, geo, telefone, `openingHours`) com um `window._schemaRegistry` (Set) que evita duplicar o schema se o footer for injetado mais de uma vez — bom detalhe de robustez.
- Reveal via `IntersectionObserver` ao rolar até o rodapé.
- **Nota**: o `index.html` já injeta seu próprio JSON-LD `LegalService` + `WebSite` inline no `<head>` (visto nas linhas 161-203) — ou seja, há **dois pontos de schema** (inline no HTML e injetado pelo footer-seo.js), o que é redundante mas o `_schemaRegistry` evita duplicação real no DOM final.

### O que o cível não tem hoje (a checar/confirmar no próprio subdomínio, mas com alta probabilidade dado que não foi mencionado)
1. **Coluna "Jurisdição Tática" com grid de cidades** — replicável 1:1 como "Áreas de Atuação" ou "Comarcas Atendidas" linkando para páginas locais (ex.: `sabara.html`, `belohorizonte.html`) focadas em cível — forte alavanca de SEO local, hoje provavelmente ausente ou menos explorada no cível.
2. **Badge contextual no header por seção** (`detectContext`) — fácil de portar trocando `noticias`/`emergencia` por `familia`/`urgencia-prazo` etc.
3. **Schema `LegalService` injetado via JS com dedupe** — garante que toda página do cível tenha o schema correto mesmo sem repetir manualmente em cada HTML.
4. **HeroCinematic com Ken Burns + pause on scroll-out/hover** — se o cível usa hero estático, portar dá ganho de percepção de produção sem custo de performance (por causa do `IntersectionObserver`).

### Recomendação
Portar o header e footer **como componentes**, adaptando: `navLinks` (trocar para páginas do cível), `sistemas` (trocar "Calculadora Penal" por algo cível, ex. "Calculadora de Pensão/Simulador de Partilha" se existir), `servicos` (pilares cível: Divórcio, Inventário, Cobrança, Contratos, Consumidor), `trust` (trocar "Plantão 24h" por algo compatível com cível, ex. "Atendimento em até 24h úteis" — cível não costuma ter urgência de plantão 24h real, então **não copiar literalmente a mensagem de urgência criminal**, adaptar ao tom real do serviço). Manter a estrutura JSON-LD `LegalService`, ajustando `priceRange`/descrição para "Advocacia Cível".

---

## 6. Comparação de paleta/tipografia/tom — site principal vs. civel.lucassemim.adv.br

| Aspecto | `style.css` (raiz, **órfão/não usado**) | Sistema real ativo do site principal (`index.html` + JS) | civel.lucassemim.adv.br (conforme briefing) |
|---|---|---|---|
| Fundo | Branco-névoa `#F8F9FA` | **Preto `#050505`** | **Preto `#050505`** |
| Cor de destaque | Azul-marinho `#0B132B` + dourado-sutil `#B59A5F` | **Dourado `#d4af37`** | **Dourado `#D4AF37`** |
| Secundária | Cinza técnico `#6B7280` | Prata/cinza claro `#e0e0e0`/`#aaa` | **Prata `#C8C8C8`** |
| Título | Playfair Display (serif) | **Teko** (condensada, uppercase) | **Teko** |
| Corpo | Inter | **Lato** | **Lato** |
| Monoespaçada/"dossiê" | — (inexistente) | — (inexistente) | **Fira Code** |
| Tom de voz | Institucional/corporativo tradicional | **"Plantão", urgência, tático** ("Blindagem Tática", "Jurisdição Tática", "AUDITORIA GRATUITA", "PLANTÃO ATIVO AGORA") | "Dossiê/sistema" (`// PROTOCOLO DE ATENDIMENTO`) |

### Conclusão
O `style.css` órfão é **irrelevante** para a decisão de unificação — é código morto de uma versão anterior do site, não representa a identidade visual real hoje em produção. O que de fato está ativo no site principal (CSS crítico inline do `index.html` + estilos injetados por `header-elite.js`, `footer-seo.js`, `smart-cta.js`, `selo-qualidade.js`, `truth-shield.js`) **já usa exatamente a base do cível**: fundo `#050505`, dourado `#d4af37`, Teko + Lato, cards com `border-left` dourado, `box-shadow` escuro, glassmorphism no header. A prata `#C8C8C8` e a Fira Code do cível são refinamentos que o criminal não tem (o criminal usa tom mais "urgência tática/vermelho" — `#8b0000`, pulsos vermelhos — coerente com plantão 24h penal, que não faz sentido replicar 1:1 no cível).

**Recomendação de unificação**: sim, vale — mas não porque estão divergentes (eles já convergem na base), e sim para **elevar o cível ao mesmo nível de acabamento/engenharia** que o criminal já tem (componentização em JS, acessibilidade — trap focus, `aria-*`, `prefers-reduced-motion` —, performance — lazy load, `IntersectionObserver`, preconnect/preload). O ajuste fino é de **tom**, não de cor: o cível deve manter o dourado/prata "dossiê/sistema" (mais frio, técnico, Fira Code) e evitar copiar o vermelho de urgência/plantão 24h do criminal, que soa artificial para inventário, divórcio ou cobrança — usar variações de urgência mais realistas (ex.: "prazo processual correndo" em vez de "cada minuto conta").

---

## Resumo executivo (para o usuário)

Analisei os 8 arquivos do site principal (`lucassemim.adv.br`, Criminal) linha a linha para identificar o que vale portar para `civel.lucassemim.adv.br`. Achado de bônus: o `style.css` da raiz é código morto — o design real do criminal já roda inteiramente em CSS injetado por JavaScript e já usa fundo preto `#050505` + dourado `#d4af37` + Teko/Lato, ou seja, a base visual do cível e do criminal **já convergem**; o que falta portar é a *engenharia por trás*, não a cor.

As três adaptações com maior potencial de conversão para o cível, em ordem de prioridade:

**1. `smart-cta.js` (CTA por palavra-chave).** É um sistema que lê o título, headings e metadados da página do artigo, compara contra um banco de ~16 "temas" (cada um com título, texto e botão de WhatsApp pré-preenchido específicos), pontua por relevância (termos mais longos pesam mais) e injeta o CTA mais certeiro automaticamente — sem exigir configuração manual por artigo. Para o cível, basta trocar o banco de temas criminais (flagrante, HC, tráfico) por temas cíveis (divórcio/guarda, inventário, despejo, negativação indevida, plano de saúde). É reaproveitamento de mecanismo puro, zero dado sensível, e ataca diretamente a conversão de tráfego de blog/SEO em lead qualificado — hoje provavelmente o maior gargalo do funil de conteúdo do cível.

**2. `return-lead.js` (widget de retorno via localStorage).** Detecta visitantes na 2ª visita ou mais (via `localStorage`, sem cookies), espera 6 segundos ou 45% de scroll, e abre um mini-funil conversacional de 4 passos (situação → dados → resposta gerada por IA → WhatsApp), gravando cada lead também numa planilha Google via webhook — mesmo que a pessoa não clique no botão final. Isso resolve diretamente o problema de abandono de formulário citado: em vez de pedir nome/telefone de cara, o visitante se compromete aos poucos e só depois informa contato, o que historicamente reduz fricção de forma significativa. Portar exige só trocar as perguntas e o prompt da IA para o vocabulário cível — a arquitetura é 100% reaproveitável.

**3. `header-elite.js` + `footer-seo.js` (estrutura + SEO técnico).** O rodapé do criminal tem uma coluna de 10 cidades atendidas linkando para landing pages locais ("Jurisdição Tática") e injeta automaticamente o Schema.org `LegalService` completo (endereço, geo, telefone, horário) com proteção contra duplicação — reforço forte de SEO local que, se ausente no cível, é fácil ganho. O header injeta badges contextuais conforme a seção da página e tem glassmorphism + acessibilidade de teclado já prontos. Portar aqui é principalmente ganho de SEO técnico e polimento, não de gatilho de conversão direto — por isso fica em terceiro, mas é base para os outros dois funcionarem bem.

Os módulos `truth-shield.js` e `selo-qualidade.js` também valem a pena (reforçam autoridade/E-E-A-T em artigos e nunca tocam em dado de cliente), mas têm impacto mais indireto (SEO de conteúdo) do que os três acima. Nenhuma das recomendações requer expor dado real de processo ou cliente — todos os mecanismos operam sobre taxonomia de temas jurídicos ou comportamento do visitante.
