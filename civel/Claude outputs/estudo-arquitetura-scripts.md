# Auditoria de Arquitetura JS — civel.lucassemim.adv.br
### `codeleicivel/*.js` — leitura linha a linha do código real (34 arquivos + sitemap)

Data da análise: 2026-09-10
Fonte: `/mnt/user-data/uploads/civel/codeleicivel/*.js` e `civel_sitemap.xml`

---

## 0. Achado estrutural mais importante: `civel-core.js` NÃO garante ordem de execução

`civel-core.js` cria as 30 tags `<script>` dinamicamente via `document.createElement('script')` + `appendChild`, define `script.defer = true`, mas **nunca define `script.async = false`**.

Isso é relevante porque:

- O atributo `defer` só tem efeito especial em scripts inseridos pelo parser HTML. Em scripts criados via JS (`createElement`), o navegador trata-os como `async` por padrão — ou seja, **cada módulo executa assim que termina de baixar, na ordem de chegada da rede, não na ordem do array `modules`**. O comentário "4. EXECUÇÃO EM CADEIA OTIMIZADA" no arquivo é enganoso: não há cadeia real, é um `Promise.all` que dispara todos os `<script>` praticamente ao mesmo tempo.
- Consequência prática: **não há garantia de que `structure.js` (que injeta o header/footer) rode antes de `civel-geo.js`, `civel-prefetch.js`, `civel-time-aware.js`** (que dependem de elementos do menu/header já existirem no DOM). Em conexões lentas ou com cache parcial, esses módulos podem simplesmente não encontrar `.nav-platinum`, `.geo-cidade` etc. e desistir silenciosamente (a maioria tem `if (!el) return;`, então falha "de forma limpa", mas o efeito visual/funcional some sem erro visível).
- Da mesma forma, `civel-forms.js` e `civel-diagnostico.js` chamam `window.gerarDossiePDF` e `window.enviarHubspot` só se essas funções já existirem no momento do clique — o que funciona porque o clique só ocorre depois de todos os módulos carregarem (dá tempo). Isso é só "sorte de timing", não é uma dependência declarada.

**Bug agravante — `DOMContentLoaded` disparado tarde demais:** como os módulos chegam de forma assíncrona/atrasada em relação ao parsing do documento, é muito provável que o evento `DOMContentLoaded` do documento **já tenha disparado** antes que a maioria dos 30 arquivos termine de carregar e registre seu próprio listener `document.addEventListener("DOMContentLoaded", fn)`. Um listener registrado depois que o evento já ocorreu **nunca é chamado** — é comportamento padrão do DOM, não uma suposição.

Apenas **2 dos 30 módulos** se protegem contra isso, checando `document.readyState` antes de decidir entre "escutar o evento" ou "rodar imediatamente":
- `civel-seo.js` (linha ~608): `if (document.readyState === 'loading') { addEventListener(...) } else { init() }`
- `structure.js` (linha ~309): mesmo padrão para `injectLayout()`

Todos os outros ~26 módulos (`civel-geo.js`, `civel-lgpd.js`, `civel-forms.js`, `civel-form-intelligence.js`, `social-proof.js`, `civel-interacao.js`, `civel-quantum.js`, `civel-financas.js`, `civel-diagnostico.js`, `civel-search.js`, `civel-prefetch.js`, `civel-time-aware.js`, `civel-toc.js`, `civel-related.js`, `civel-meeting-logic.js`, `pwa-install.js`, `civel-read-ai.js`, `platinum-core.js`, `platinum-ui.js`, `civel-slider.js`, `civel-particles.js`, e o próprio `civel-core.js` no bloco que injeta o loader do HubSpot) usam o padrão inseguro. Isso inclui o **próprio bloco que injeta o script do widget de chat do HubSpot** dentro de `civel-core.js`:

```js
window.addEventListener('DOMContentLoaded', () => { ... injeta hs-script-loader ... });
```

Se esse listener perder o evento, **o widget de chat do HubSpot nunca é inserido na página**, e `civel-chat-opt.js` (que só reage a `window.hsConversationsOnReady`) fica com seu array de callback nunca disparado — chat de vendas silenciosamente ausente.

> Este é o achado de maior impacto potencial do estudo porque é sistêmico (afeta ~26 arquivos) e explicaria sintomas "intermitentes" já relatados informalmente (menu, geo, chat, prova social às vezes não aparecem) sem nenhum erro no console. **Recomendação de verificação:** abrir o site com o DevTools, throttle de rede em "Fast 3G", e checar no console se `console.log` de cada módulo aparece nas primeiras cargas — ou simplesmente trocar todos os `document.addEventListener("DOMContentLoaded", fn)` pelo padrão seguro usado em `civel-seo.js`/`structure.js`. É uma correção barata e de altíssimo retorno.

---

## 1. `civel-core.js` — o orquestrador

- IIFE que monta uma lista mestra de 28 arquivos (`modules[]`) e os injeta com cache-busting (`?v=5.2`), com retry de 3 tentativas por script e fallback silencioso (`resolve()` mesmo em falha — o site nunca trava, mas falhas ficam mascaradas).
- **Módulos existentes na pasta que NUNCA são carregados pelo core** (não estão no array `modules`):
  - `civel-meeting.js`
  - `civel-painel-auth.js`
  - `civel-process-db.js`
  - `civel-pje-engine.js`
  - `civel-faq.js`
  - `sw.js`
  
  Isso é esperado para os 5 primeiros (fazem parte da "Área VIP" — painel do cliente / sala de reunião — que presumivelmente inclui esses scripts manualmente, fora do orquestrador, provavelmente por *precisarem* de ordem garantida: `civel-process-db.js` define `PJE_DB` no escopo global e `civel-pje-engine.js` lê `PJE_DB[userID]` diretamente — se fossem carregados pelo loader assíncrono do core, a ordem não seria garantida e o painel quebraria). Isso é uma inconsistência arquitetural real: a infraestrutura de cache-busting/retry do core não cobre os scripts do portal do cliente.
- **Bug de dead code confirmado:** `service-worker.js` está listado dentro de `modules[]` e é carregado como **script de página normal** (`<script src="...service-worker.js">`). Mas `service-worker.js` foi escrito para rodar no escopo `self` de um Service Worker (`self.addEventListener('install', ...)`), não no escopo `window`. Ao ser injetado como script comum, o código roda no contexto da página: `self` é apenas um alias de `window`, então ele apenas registra listeners para eventos (`install`, `activate`, `fetch`) que **nunca disparam nesse contexto**. Isso é uma requisição de rede e execução de script 100% inúteis em toda página do site — baixo impacto de performance, mas é claramente um resíduo de copy-paste (a real ativação do Service Worker é feita corretamente em outro lugar, por `pwa-install.js`, via `navigator.serviceWorker.register('./service-worker.js')`).

---

## 2. `civel-seo.js` — motor de SEO (o mais crítico para o negócio)

Arquivo robusto (33 KB), bem mais maduro que os demais. 9 "engines" internas: meta/title, `LegalService` Schema, `FAQPage` Schema, `BreadcrumbList`, GEO/AI (Speakable + Attorney schema), resource hints, Core Web Vitals, sinais de Search Console, e um "CTR booster" (log de diagnóstico).

**Como decide canonical/OG/schema:** usa um objeto `PAGES` chaveado por *pathname exato* (`/`, `/blindagem-patrimonial.html`, etc.). `getPage()` normaliza `/index.html` → `/` e cai no fallback `PAGES['/']` se a página atual não estiver mapeada. O canonical é montado dinamicamente a partir de `window.location.pathname` (correto, por página), mas title/description/OG/FAQ/Breadcrumb vêm do mapa estático — **se a página não estiver no mapa, ela recebe título, descrição, FAQ e breadcrumb idênticos aos da home**, o que é conteúdo duplicado do ponto de vista do Google.

**Bug real e verificável — título nunca é corrigido quando devia:**
```js
if (pg.title && !document.title.includes('Lucas Semim')) {
    document.title = pg.title;
}
```
A condição verifica o `document.title` **que já veio do HTML estático**, não o que será aplicado. Como praticamente todo `<title>` estático do site provavelmente já contém "Lucas Semim" (é o nome do escritório), essa condição normalmente é `false`, e o engine de SEO **nunca sobrescreve o título da página** — ele só age quando o HTML estático esqueceu de incluir "Lucas Semim" no título, o que é o cenário raro, não o comum. Ou seja, o "CTR Booster"/engine de título dinâmico do arquivo provavelmente está inoperante na maior parte das páginas, silenciosamente. Vale conferir com "view-source" se os `<title>` reais batem com os do mapa `PAGES` ou com o HTML estático.

**Schema duplicado/conflitante com `platinum-core.js` (achado novo, não documentado antes):**
`civel-seo.js` injeta um JSON-LD `LegalService` completo (nome "Semim & Associados — Advocacia Cível", `priceRange: "$$$"`, endereço real em Rua Coronel Abílio Pereira, `areaServed`: BH/Sabará/Contagem/Nova Lima/Betim). **Mas `platinum-core.js` roda depois (ou em paralelo, dado o problema de ordem da seção 0) e injeta um SEGUNDO bloco `LegalService`** com dados diferentes: nome "Lucas Semim Advocacia Patrimonial", `priceRange: "$$$$"`, sem endereço detalhado, `serviceArea` = país inteiro (Brasil), e `makesOffer` com serviços diferentes (Holding, Blindagem, Bancário). Duas entidades `LegalService` conflitantes na mesma página é um problema real de SEO técnico: o Google pode escolher qualquer um dos dois blocos, ignorar ambos por inconsistência, ou (pior) misturar sinais de negócio incoerentes (dois "priceRange" e duas áreas de atuação diferentes para a mesma entidade). Isso nunca tinha sido documentado antes — é um bug de duplicação entre dois arquivos que não têm consciência um do outro.

**Riscos de performance nesse arquivo:**
- `engineSearchConsole()` roda `document.querySelectorAll('a[href]').forEach(...)` em **toda página**, a cada carregamento — para sites com muitos links (rodapé, menu, "artigos relacionados") não é caro, mas roda de novo sempre que outro módulo re-renderiza o DOM (ex.: `civel-related.js` injeta cards *depois* que `civel-seo.js` já rodou, então links dentro dos "artigos relacionados" nunca recebem o tratamento de `rel="noopener noreferrer"`/aria-label — silenciosamente incompleto).
- Contém dados de Search Console **hardcoded no código-fonte** (`clicks: 6, impressions: 250` etc., linha ~567) — são apenas logs de diagnóstico no console do navegador, mas ficam permanentemente desatualizados (referem-se ao período "24/03–23/06/2026") e não representam risco funcional, só ruído/confusão para quem inspecionar o código depois.

---

## 3. Funil de captação de lead: `civel-forms.js` + `civel-hubspot.js` + `civel-form-intelligence.js`

**Pergunta do usuário: o formulário de lead está de fato funcionando?**
Resposta curta: **parcialmente, e de forma frágil — sem confirmação real de entrega, e com um passo (WhatsApp) que provavelmente falha silenciosamente na maioria dos navegadores modernos.**

### `civel-hubspot.js`
Faz um `POST` real para a API pública do HubSpot Forms:
```
https://api.hsforms.com/submissions/v3/integration/submit/50778347/d50607f1-1308-4356-bfc7-8a50c1e39061
```
O `PORTAL_ID` (`50778347`) é o mesmo usado no loader do widget de chat em `civel-core.js` (`js-na1.hs-scripts.com/50778347.js`) — portal consistente, não é um endpoint inventado. O `FORM_ID` é um GUID específico que **não dá para validar sem acesso à conta HubSpot** — se esse formulário tiver sido apagado/recriado no painel HubSpot em algum momento, o endpoint retorna erro e a função só faz `console.warn`/`console.error`; **não há fallback, não há retry, e o usuário nunca vê que o envio falhou.**

### `civel-forms.js` — o problema estrutural
`submitCadastro()` dispara três ações em paralelo (HubSpot, geração de PDF, WhatsApp) **sem aguardar nenhuma delas**:
```js
setTimeout(() => {
    if (window.enviarHubspot) window.enviarHubspot(dados);   // fire-and-forget, sem await
    if (window.gerarDossiePDF) window.gerarDossiePDF({...});
    ... monta texto do whatsapp ...
    document.getElementById('form-cadastro').style.display = 'none';
    document.getElementById('final-screen').style.display = 'block';  // sucesso É MOSTRADO SEMPRE
    setTimeout(() => {
        window.open(`https://wa.me/...`, '_blank');
        window.location.href = 'sala-reuniao.html';
    }, 2000);
}, 1500);
```
- A tela de "sucesso" aparece **independentemente do resultado real do `fetch` para o HubSpot** — não há `.then()`/`await` ligando o sucesso visual ao sucesso da API. Se o CRM falhar, o usuário nunca saberá e o escritório perde o lead sem qualquer registro (a não ser que o WhatsApp funcione — ver abaixo).
- **`window.open(...)` chamado dentro de `setTimeout` aninhado (1500ms + 2000ms depois do clique original)** é um padrão clássico que a maioria dos bloqueadores de pop-up modernos (Chrome, Safari, Firefox, e principalmente navegadores mobile) trata como pop-up não solicitado, porque não está mais na cadeia síncrona do gesto do usuário (clique no botão). Ou seja, é bem provável que, na prática, essa janela do WhatsApp **seja bloqueada silenciosamente em boa parte dos acessos**, especialmente em mobile — que é o principal canal desse tipo de site. Isso reduz a rede de segurança do fluxo (mesmo se o HubSpot falhar, o WhatsApp "deveria" avisar o escritório, mas pode nem abrir).
- Logo depois, `window.location.href = 'sala-reuniao.html'` navega a aba embora — mesmo que o `window.open` do WhatsApp tenha sido bloqueado, o usuário é redirecionado e perde o contexto.
- **Validação de CNPJ é falsa:** `validarDocumento()` só confere se tem 14 dígitos (`if (val.length === 14) return true;` — comentário no próprio código admite: "Validação Básica por tamanho para simplificar"). Qualquer sequência de 14 dígitos passa, inclusive `00000000000000`. CPF, ao menos, usa o algoritmo real do módulo 11.
- **Duas camadas de máscara conflitantes no mesmo campo:** `civel-forms.js.setupMasks()` adiciona um listener `input` direto no `#cad-tel`/`#cad-doc`, e **`civel-form-intelligence.js` também adiciona, via delegação em `document.body`, um listener `input` que casa por `id.includes('tel')`/`id.includes('doc')` — os MESMOS campos**. As duas funções de máscara de telefone usam regex ligeiramente diferentes. Resultado: a cada tecla digitada em `#cad-tel` ou `#cad-doc`, **dois formatadores reescrevem `el.value` em sequência**, o que é redundante (custo de CPU desprezível, mas correto seria eliminar um dos dois) e é uma fonte plausível de bugs de cursor/posição do caractere em alguns navegadores, já que cada handler reseta `value` do zero.

### Verificação de saúde do lead: o que efetivamente funciona
- **PDF (`civel-pdf.js`)**: gera localmente no navegador via jsPDF (CDN), não depende de nenhum servidor — deve funcionar de forma confiável sempre que o CDN do jsPDF responder.
- **HubSpot**: endpoint real e plausível, mas sem confirmação nem fallback — não dá para afirmar que "funciona", apenas que "está configurado para tentar funcionar".
- **WhatsApp**: mecanismo de rede de segurança do negócio, mas o padrão de `window.open` assíncrono dentro de `setTimeout` é um risco concreto de bloqueio por pop-up blocker.

**Recomendação priorizada:** ligar o feedback visual ao resultado real do `fetch` do HubSpot (`.then()/.catch()`), abrir a janela do WhatsApp **de forma síncrona** (idealmente diretamente no clique, ou usando link `<a target="_blank">` real em vez de `window.open` atrasado), e — mais importante — gravar o lead em algo além do HubSpot/WhatsApp (mesmo um `console.log` de erro não é auditável depois; um endpoint de log mínimo, ou reenvio local em `localStorage` com retry, evitaria perda silenciosa de leads).

---

## 4. `social-proof.js` — prova social é 100% falsa/estática, não dinâmica

Confirmado lendo o código: é uma lista fixa de 6 eventos hardcoded no array `eventos[]` ("agendou uma consultoria", "está lendo sobre Juros Abusivos" etc.), sorteado aleatoriamente (`Math.floor(Math.random() * eventos.length)`) e exibido uma única vez, 8 segundos após o carregamento da página. A única parte "dinâmica" é a substituição do texto `cidadeVisitante` por `sessionStorage.getItem('user_city')` (herdado de `civel-geo.js`, que usa a API `ipapi.co` para geolocalizar por IP). Não há contagem real de visitantes, não há timestamp real, não há qualquer dado de atividade real do site. É puro gatilho de FOMO fabricado — visitante recorrente vê a mesma coisa. Sem risco técnico (dispara só uma vez, não gera loop), mas é um risco de reputação/compliance se alguém notar a repetição do mesmo "Fulano de Contagem agendou uma consultoria há 15 min" toda vez que visitar.

---

## 5. Área "VIP" (portal do cliente): risco de confidencialidade real — o achado mais grave do estudo

Três arquivos, **fora do orquestrador `civel-core.js`**, contêm dados reais de clientes **em texto puro dentro de JavaScript client-side**, ou seja, visível para qualquer pessoa que abra o arquivo `.js` diretamente (não requer login nem exploração — é o próprio arquivo estático servido pelo site):

### `civel-meeting-logic.js` — `CLIENTES_DB`
Nomes completos, números de telefone (usados como "senha" de acesso), **números de processo judicial reais**, partes do processo (ex.: "Renzho vs. Pay2M LTDA"), status/estratégia do caso (ex.: "URGENTE - DEFESA ESTRATÉGICA"), e link direto do Google Meet da reunião de cada cliente. 7 clientes reais + 1 admin, todos expostos.

### `civel-painel-auth.js` — `USERS_DB`
CPF + **senha em texto puro** para "login" do portal do cliente, incluindo a conta admin do próprio Dr. Lucas: `"000.000.000-00": { pass: "admin", ... }`. A "autenticação" é inteiramente client-side (compara strings no navegador) — não existe backend real validando login.

### `civel-process-db.js` — `PJE_DB`
Número de processo, vara, juiz, valor da causa, nome das partes e histórico de movimentações processuais de cada cliente, também em texto puro.

**Por que isso é grave:** esses três arquivos formam, juntos, um "painel do cliente" cuja segurança inteira é teatro — a suposta autenticação (loading de 1,5s, mensagens de "verificando credenciais") não protege nada, porque **os dados que ela deveria proteger já estão publicamente acessíveis no próprio arquivo JS antes mesmo do login**. Qualquer pessoa (inclusive a parte contrária num processo, ou um concorrente) pode abrir `civel-painel-auth.js`/`civel-process-db.js`/`civel-meeting-logic.js` direto pela URL e ver nomes, telefones, números de processo e estratégia de defesa de todos os clientes listados, sem autenticação nenhuma. Isso é potencialmente uma violação de sigilo profissional (Estatuto da OAB) e da LGPD (dados pessoais e processuais expostos publicamente), e é o tipo de achado que devia ser corrigido antes de qualquer outra prioridade deste levantamento — mover esses dados para um backend real com autenticação de verdade, ou no mínimo tirá-los do bundle público enquanto uma solução adequada não é implementada.

### Bug confirmado (não apenas risco) — o portal do cliente está quebrado como está
`civel-pje-engine.js` lê `sessionStorage.getItem('civel_user_id')` para saber quem logou. Só que **`civel-painel-auth.js` nunca grava esse valor** — a função `iniciarSessao()` só manipula `display`/`innerText` de elementos do DOM, não chama `sessionStorage.setItem('civel_user_id', ...)` em lugar nenhum. O próprio comentário dentro de `civel-pje-engine.js` diz *"No civel-painel-auth.js, adicionei a linha para salvar no sessionStorage"* — mas essa linha **não existe** no arquivo real. Resultado: mesmo que o cliente "faça login" com sucesso, ao navegar para a página que usa `civel-pje-engine.js` ele cairá no `if (!userID) { alert("Sessão expirada..."); window.location.href = 'painel-cliente.html'; }` — ou seja, **o rastreamento de processo do portal do cliente está com um elo faltando e não funciona como concebido**, independentemente do problema de segurança acima.

### Colisão de classe CSS entre módulos não relacionados
`civel-faq.js` liga um listener de clique genérico em `.faq-item, .check-item` para alternar `.active` (efeito sanfona). `civel-meeting.js` usa a mesma classe `.check-item` para os checkboxes de "Estou em ambiente com privacidade" / "Tenho os documentos em mãos" da sala de reunião. Se ambos os scripts estiverem ativos na mesma página, um clique no checkbox da sala de reunião também dispara a lógica de sanfona do FAQ (fechando outros `.check-item`), interferindo no fluxo de validação de `civel-meeting.js`. Como esses dois arquivos não estão no loader central (seção 1), o risco só se materializa se ambos forem incluídos manualmente na mesma página — mas é um nome de classe genérico demais reaproveitado sem coordenação entre os dois módulos.

---

## 6. Service Workers duplicados e possivelmente quebrado

Existem **dois arquivos de Service Worker diferentes**, com nomes de cache e listas de assets diferentes:
- `service-worker.js` (`CACHE_NAME = 'civel-app-v5-elite'`) — este é o único **efetivamente registrado**, via `pwa-install.js` → `navigator.serviceWorker.register('./service-worker.js')`.
- `sw.js` (`CACHE_NAME = 'civel-platinum-v2'`) — **não há, em nenhum dos 34 arquivos analisados, uma chamada `.register('sw.js')` ou similar.** É código órfão — ou pertence a uma versão anterior da arquitetura, ou é usado por alguma página HTML não incluída nesta amostra.
- Mesmo se fosse registrado, `sw.js` provavelmente falharia na instalação: sua lista `ASSETS_TO_CACHE` usa caminhos relativos como `'./index.html'` e `'../mapa.css'`, presumindo que o arquivo resida na raiz do site — mas ele está fisicamente em `codeleicivel/`. Se registrado a partir dessa pasta, o escopo padrão do Service Worker seria `codeleicivel/`, e `cache.addAll([...])` falha inteiramente (rejeita a promise) se qualquer um dos recursos listados não puder ser buscado/cacheado a partir dali — o que é bem provável dado os caminhos.

**Recomendação:** apagar `sw.js` (ou confirmar se alguma página legada ainda o referencia) para eliminar confusão de manutenção futura.

---

## 7. Demais módulos — o que fazem de fato, dependências e riscos de performance

| Arquivo | O que faz de verdade | SEO/Schema? | Depende de outro rodar antes? | Bug / risco |
|---|---|---|---|---|
| `structure.js` | Injeta header/footer/menu via `innerHTML`, define `window.toggleMobileMenu`. Usa `readyState` guard (seguro). | Não | É pré-requisito de quase tudo que busca `.nav-platinum`, `.link-platinum` etc. — mas não há garantia real de ordem (seção 0). | Nenhum bug óbvio no próprio arquivo. |
| `platinum-ui.js` | Efeito "tilt 3D" em cards no `mousemove`, header que encolhe no scroll, e um modal de busca "Spotlight" (Ctrl+K). | Não | — | **Colide com `civel-search.js`** (ver abaixo). |
| `civel-search.js` | Outro modal de busca "Spotlight" completo, com sua própria base de páginas e **também escuta `Ctrl+K`**. | Não | — | **Bug de duplicidade confirmado:** dois módulos diferentes (`platinum-ui.js` e `civel-search.js`) criam dois overlays de busca distintos (`#platinum-search-overlay` e `#neural-search-overlay`), com listas de páginas ligeiramente diferentes, e **ambos escutam o mesmo atalho `Ctrl+K`/`Cmd+K`**. Se os dois carregarem na mesma página (o que acontece, já que ambos estão no `modules[]` do core), apertar Ctrl+K abre **os dois modais simultaneamente** (o de maior z-index, `civel-search.js` com `z-index:15000`, fica visualmente por cima do `platinum-ui.js`, `z-index:9999`), e o botão flutuante "⌘" de `platinum-ui.js` continua na tela mesmo com o outro sistema de busca ativo. Isso é claramente duas gerações do mesmo recurso que nunca foram consolidadas — recomenda-se remover um dos dois. |
| `civel-slider.js` | Troca de slides via `setInterval` a cada 6s. Simples, sem bug. | Não | — | Nenhum. |
| `civel-particles.js` | Canvas de partículas com `requestAnimationFrame` infinito, `O(n²)` para desenhar conexões entre partículas (até 90 no desktop). Roda em **toda página**, não só na home. | Não | — | **Risco de performance real:** o loop de animação nunca para (não pausa quando a aba fica oculta via `visibilitychange`, não respeita `prefers-reduced-motion`), e o `O(n²)` de conexões (até ~4000 comparações de distância por frame com 90 partículas) roda para sempre em segundo plano em qualquer página do site, inclusive páginas de formulário/leitura onde o usuário está digitando. Em aparelhos mais fracos isso pode competir por CPU/bateria com o resto da página. |
| `civel-geo.js` | Geolocaliza por IP via `fetch('https://ipapi.co/json/')` (free tier, 1000/dia), grava `sessionStorage.user_city`, atualiza `.geo-cidade` e `#hero-title-geo`. | Indiretamente (não SEO técnico, mas personalização) | Precisa que `structure.js`/HTML já tenham os elementos `.geo-cidade` no DOM. | **Dependência de terceiro externo (ipapi.co) sem fallback de erro visível** — se a API mudar de free tier/limite ou ficar fora do ar, cai no catch silencioso (mantém texto padrão) — comportamento correto, mas é um ponto único de falha externo não monitorado. |
| `civel-lgpd.js` | Banner de "cookies" **cosmético**: só grava `localStorage.lgpd_civel_consent` se o usuário clicar em aceitar; o texto do banner não menciona cookies específicos nem opt-out granular — é texto genérico ("criptografia e cookies estritamente necessários"). Não bloqueia HubSpot, GA, ipapi.co etc. antes do consentimento. | Não | — | Não é bug técnico, mas é discutível como *compliance real* de LGPD (consentimento não bloqueia nenhum rastreamento de fato, ele já roda antes independente do clique). |
| `platinum-core.js` | Favicon dinâmico, "tab recovery" (troca título quando aba perde foco), **schema `LegalService` duplicado** (ver seção 3), proteção de copy/paste com assinatura. | **Sim — duplica/conflita com `civel-seo.js`** | — | Ver seção 3 (schema duplicado é o achado principal aqui). |
| `civel-quantum.js` | Barra de progresso de leitura dourada, "tab recovery" com favicon piscando (**segunda implementação de tab-recovery**, redundante com `platinum-core.js`), proteção de copy/paste (**terceira implementação de assinatura em cópia, redundante com `platinum-core.js`**). | Não | — | **Redundância confirmada:** tanto `platinum-core.js` quanto `civel-quantum.js` implementam separadamente (a) troca de título/favicon quando a aba perde foco e (b) injeção de assinatura ao copiar texto selecionado. Ambos os listeners `visibilitychange` e `copy` ficam ativos ao mesmo tempo — não quebra nada visualmente grave, mas double-listener em `document.addEventListener('copy', ...)` significa que o texto copiado pode receber a assinatura **duas vezes concatenada**, dependendo da ordem de execução dos dois handlers (cada um faz `e.preventDefault()` + `setData` de novo). Vale testar copiar um parágrafo grande do site e ver se a assinatura aparece duplicada no clipboard. |
| `civel-financas.js` | 3 calculadoras (Holding, juros abusivos, atualização de dívida) — só matemática client-side, sem chamada de rede. Taxas "de mercado" (20%/6%/35%/0,5%/1%/10%) são estimativas fixas hardcoded, não vêm de nenhuma fonte dinâmica. | Não | — | Nenhum bug técnico; risco é de precisão/atualização das taxas ao longo do tempo (conteúdo, não código). |
| `civel-diagnostico.js` | Wizard de triagem por área (família/bancário/etc.), monta mensagem de WhatsApp e opcionalmente chama `civel-pdf.js`. Comentário no código já avisa: `// Simplificado para evitar erro se campo não existir` (áreas "imobiliário"/"empresarial" não coletam detalhe real). | Não | Depende de `window.gerarDossiePDF` já existir (checado com `if`). | Mesmo padrão de `window.open` dentro de `setTimeout` de 2s — mesmo risco de bloqueio por pop-up já descrito na seção 3. |
| `civel-prefetch.js` | Pré-carrega (`<link rel=prefetch>`) páginas internas no `mouseenter`/`touchstart` de cada `<a>` do documento. | Não | Roda `querySelectorAll('a')` **uma única vez**, no `DOMContentLoaded` — **links injetados depois** (menu de `structure.js`, cards de `civel-related.js`, resultados de busca de `civel-search.js`/`platinum-ui.js`) nunca recebem o listener de prefetch, porque a lista de links é capturada antes desses módulos rodarem. | Combinado com o problema da seção 0, é bem provável que boa parte dos links do **menu principal** não tenham prefetch ativado, silenciosamente. |
| `civel-time-aware.js` | Badge "Online agora"/"Plantão" baseado na hora local do navegador do visitante (não do fuso do escritório — se o visitante estiver em outro fuso, a badge reflete a hora dele, não a de BH). | Não | Espera 1s (`setTimeout`) por `.nav-platinum` existir — mitiga parcialmente o problema de ordem, mas com número mágico fixo (1000ms) em vez de evento real. | Uso de `new Date().getHours()` sem fixar timezone é um bug sutil de lógica (mostra "aberto agora" errado para visitante em outro fuso horário). |
| `pwa-install.js` | Registra `service-worker.js`, captura `beforeinstallprompt`, mostra botão flutuante "Baixar App". | Não | — | Nenhum bug técnico relevante. |
| `civel-mobile-optimizer.js` | IIFE (roda imediatamente, sem esperar DOM), só ativa em `innerWidth <= 768`; injeta CSS de leitura para mobile, reduz opacidade do canvas de partículas. | Não | Roda antes de `civel-particles.js` criar o canvas na maioria das vezes (por não esperar DOMContentLoaded) — `document.getElementById('quantum-canvas')` provavelmente retorna `null` na primeira execução, então o ajuste de opacidade do canvas **nunca é aplicado** de fato (é um `if (canvas) {...}` que provavelmente falha silenciosamente). | Botão de WhatsApp flutuante está **comentado no código** (dead code proposital, não ativo). |
| `civel-interacao.js` + `civel-chat-opt.js` | Ambos escutam `mouseleave` com `e.clientY < 0` (exit intent) **de forma independente**: um mostra um modal próprio, o outro abre o widget de chat do HubSpot. | Não | `civel-chat-opt.js` depende de `window.HubSpotConversations` existir (via `hsConversationsOnReady`, mecanismo correto do HubSpot, não sofre do problema da seção 0). | **Duplo gatilho de exit-intent:** ao mover o mouse para fora do topo da janela, o visitante pode ver o modal de `civel-interacao.js` E o chat do HubSpot abrindo ao mesmo tempo — experiência agressiva/confusa, não coordenada entre os dois módulos. |
| `civel-related.js` | Embaralha (`sort(() => 0.5 - Math.random())` — técnica estatisticamente enviesada, mas inofensiva aqui) 3 de 6 artigos relacionados hardcoded, filtrando a página atual pelo nome do arquivo. | Não | — | Nenhum bug funcional grave. |
| `civel-toc.js` | Gera índice automático a partir de `h2`/`h3` dentro de `.artigo-conteudo`/`.artigo-familia`. | Não | — | Nenhum bug. |
| `civel-faq.js` | Accordion genérico para `.faq-item`/`.check-item`. | Não | — | Ver colisão de classe com `civel-meeting.js` (seção 5). |
| `civel-read-ai.js` | Abre link de agendamento (Read.ai) em pop-up, e mantém um `MutationObserver` **permanente e nunca desconectado** observando `document.body` inteiro (`subtree: true`) em busca de `#process-dashboard`. | Não | — | `MutationObserver` de escopo total do `<body>`, ativo para sempre em toda página do site (mesmo páginas que nunca terão `#process-dashboard`), é overhead desnecessário — deveria ao menos chamar `observer.disconnect()` depois de encontrar o alvo uma vez, ou nem rodar fora da página do painel. |
| `civel-pdf.js` | Gera PDF via jsPDF (CDN), sem dependência de servidor. | Não | Carrega jsPDF sob demanda; se `window.gerarDossiePDF` for chamado antes do CDN responder, mostra alerta pedindo para tentar de novo em 3s (sem retry automático). | Nenhum bug grave; UX manual de retry é frágil mas não quebra. |
| `civel-meeting-logic.js` / `civel-meeting.js` | Ver seção 5 (dados de clientes expostos). | Não | — | Ver seção 5. |
| `civel-painel-auth.js` / `civel-process-db.js` / `civel-pje-engine.js` | Ver seção 5. | Não | `civel-pje-engine.js` depende de `civel-process-db.js` (variável global `PJE_DB`) e de `sessionStorage` gravado por `civel-painel-auth.js` — **elo quebrado, ver seção 5**. | Ver seção 5 (bug crítico + risco de confidencialidade). |

---

## 8. Comparação com `civel_sitemap.xml`

O sitemap lista **12 URLs**:
`/`, `belohorizonte-civel.html`, `sabara-civel.html`, `blindagem-patrimonial.html`, `execucao-cobranca.html`, `bancario-juros.html`, `contratos-negocios.html`, `familia-sucessoes.html`, `seguros-indenizacao.html`, `erro-medico.html`, `acidentes-transito.html`, `cadastro-cliente.html`.

Comparado ao mapa `PAGES` de `civel-seo.js` (11 entradas):

- **`cadastro-cliente.html` está no sitemap mas NÃO tem entrada no mapa `PAGES`.** É a página do formulário de captação de lead (a mais importante para conversão) e, por não estar mapeada, cai no fallback da home: título, descrição, Open Graph e FAQ/Breadcrumb schema **idênticos aos da página inicial**. Isso é conteúdo duplicado do ponto de vista de SEO técnico exatamente na página que mais precisaria de uma meta description orientada à conversão.
- **`acidentes-transito.html` está no sitemap e TEM entrada completa e bem escrita no mapa `PAGES`** (título, descrição, 2 FAQs) — mas, conforme já sabido pela auditoria anterior, essa página carrega `../codelei/elite.js` (script legado de outro site) em vez de `civel-core.js`. Isso significa que **todo o trabalho de SEO preparado especificamente para essa URL em `civel-seo.js` nunca é executado nela** — nem o schema `LegalService`/`FAQPage`/`Breadcrumb`, nem o canonical dinâmico, nem os resource hints, nem o form-intelligence/HubSpot do funil de lead. Como é uma página de alto valor comercial (acidente de trânsito costuma ser um dos termos mais buscados nesse nicho), este é provavelmente o gap de maior custo de oportunidade do site: a página mais "pronta" no código de SEO é a única que não roda esse código.
- `painel-cliente.html` e `sala-reuniao.html` são referenciadas no menu (`structure.js`) e na busca (`civel-search.js`), mas **não aparecem no sitemap nem no mapa `PAGES`** — correto do ponto de vista de não querer indexá-las, mas como são links internos normais (`<a href>`, sem `rel="nofollow"` nem meta `noindex` aplicada por nenhum script lido), nada impede tecnicamente que o Googlebot as rastreie e indexe por conta própria via crawl do menu. Se a intenção é mantê-las fora do índice, falta uma tag `noindex` explícita nessas páginas (não visível nos arquivos JS analisados — pode já existir no HTML estático, não verificado aqui).

---

## 9. Lista consolidada de bugs/riscos confirmados por leitura direta do código (sem suposição)

1. **[CRÍTICO — confidencialidade]** `civel-meeting-logic.js`, `civel-painel-auth.js` e `civel-process-db.js` expõem em texto puro, sem autenticação real, nomes de clientes, telefones, números de processo, valores de causa, senhas e até a senha do admin — acessível a qualquer um que abra o arquivo `.js`.
2. **[CRÍTICO — funcional]** O login do portal do cliente (`civel-painel-auth.js`) nunca grava `sessionStorage.civel_user_id`, que `civel-pje-engine.js` exige — o rastreamento de processo do cliente está quebrado como está hoje.
3. **[ALTO — SEO]** Dois blocos `LegalService` JSON-LD conflitantes na mesma página (`civel-seo.js` vs. `platinum-core.js`), com `priceRange`, nome, endereço e área de atuação diferentes.
4. **[ALTO — arquitetura]** Falta de `script.async = false` em `civel-core.js` quebra a ordem de execução prometida pelo comentário do código, e a maioria dos módulos não se protege contra `DOMContentLoaded` já ter disparado — risco sistêmico de inicialização "intermitente" sem erros visíveis.
5. **[ALTO — lead capture]** `submitCadastro()` mostra tela de sucesso independentemente do resultado real do envio ao HubSpot, e usa `window.open` assíncrono dentro de `setTimeout`, sujeito a bloqueio por pop-up blocker — mesmo padrão em `civel-diagnostico.js`.
6. **[MÉDIO — SEO]** `cadastro-cliente.html` (página de conversão) e `acidentes-transito.html` (alto valor comercial, mas roda script legado) ficam fora do funcionamento pleno do motor de SEO, por razões diferentes.
7. **[MÉDIO — UX]** Dois sistemas de busca (`civel-search.js` e `platinum-ui.js`) competem pelo mesmo atalho `Ctrl+K` e abrem simultaneamente.
8. **[MÉDIO — UX]** Dois gatilhos independentes de exit-intent (`civel-interacao.js` modal + `civel-chat-opt.js` chat) disparam ao mesmo tempo no mesmo evento `mouseleave`.
9. **[MÉDIO — performance]** `civel-particles.js` roda um loop `O(n²)` de `requestAnimationFrame` infinito em toda página do site, sem pausar quando a aba está oculta e sem respeitar `prefers-reduced-motion`.
10. **[BAIXO — dead code]** `service-worker.js` é carregado como script de página comum dentro do `modules[]` do core, onde seu código é inerte (não é isso que registra o Service Worker de verdade).
11. **[BAIXO — dead code]** `sw.js` nunca é registrado em nenhum dos arquivos analisados, e provavelmente falharia na instalação por causa de caminhos relativos incompatíveis com sua localização em `codeleicivel/`.
12. **[BAIXO — redundância]** `platinum-core.js` e `civel-quantum.js` implementam separadamente e simultaneamente "tab recovery" e "assinatura ao copiar texto" — risco de assinatura duplicada no clipboard.
13. **[BAIXO — validação]** `validarDocumento()` em `civel-forms.js` aceita qualquer sequência de 14 dígitos como CNPJ válido (sem checar dígito verificador).
14. **[BAIXO]** `civel-time-aware.js` usa a hora local do navegador do visitante, não a do escritório, para decidir "Online agora" vs. "Plantão".
15. **[BAIXO]** `civel-prefetch.js` só captura links existentes no DOM no momento do `DOMContentLoaded` — links injetados depois (menu, relacionados, busca) não recebem prefetch.

---

## 10. Observações finais

- O código é consistentemente "vibe-coded" (comentários em primeira pessoa tipo "ADICIONE ESTA LINHA AQUI", números mágicos, funções duplicadas entre arquivos) — sinal de evolução rápida e incremental sem um processo de revisão que capturasse duplicações entre módulos escritos em momentos diferentes.
- Nenhum dos scripts foi minificado/bundlado — 30 requisições HTTP separadas por página é, por si só, uma explicação de performance melhor documentável via Lighthouse/WebPageTest do que apenas leitura de código, mas o padrão em si (scripts pequenos e numerosos, cada um com seu próprio `<style>` injetado via `innerHTML`) é uma causa estrutural de CSS/JS espalhado e difícil de auditar visualmente sem uma ferramenta como esta.
