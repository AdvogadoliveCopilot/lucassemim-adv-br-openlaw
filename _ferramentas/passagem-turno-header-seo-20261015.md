# Passagem de turno — trabalho do header + auditoria de SEO — 15/10/2026 (noite)

**Feito por:** agente auxiliar (substituindo o Claude durante a madrugada).
**Regra mantida:** NADA foi enviado ao servidor. Todo o trabalho abaixo está **só no PC**, com backup para reversão.

---

## 1. O que foi feito (header unificado)

### Diagnóstico (conferido no código real)
O site tinha **4 sistemas de header**:
1. `js/header-elite.js` (HeaderElite V4) — ~120 páginas (raiz, defesa-criminal, advogado-criminalista etc.) + `css/header-lux.css` por cima (home e /o-que-fazer-agora).
2. `js/logo-elite.js` — ~121 páginas de `news/`: marca errada ("SEMIM & ASSOCIADOS"), só 2 links, nav Bootstrap estática duplicada.
3. `civel/codeleicivel/structure.js` (via civel-core) — páginas cíveis, com header próprio do núcleo cível (intencional, não mexi).
4. Páginas sem menu nenhum (calculadora, custódia, política, portal-investidor, projeto-anjo, emergencia, painel-processo e 7 notícias órfãs).

### Mudanças aplicadas (no PC)
| Arquivo | Mudança |
|---|---|
| `js/header-elite.js` | (a) `removeLegacyNav()`: apaga a nav estática antiga das notícias antes de injetar (fim do menu duplicado); (b) `ensureFonts()`: carrega Teko/Lato/Playfair se a página não tiver; (c) marca compacta no celular + `.he-title` com ellipsis + `.he-brand` com `max-width` — corrige o botão do menu saindo da tela em 390px nas notícias. |
| `css/header-lux.css` | Bloco "encaixe em notebook" refeito: 992–1129px esconde o telefone desktop; 992–1299px menu compacto; 1300–1479px telefone volta com respiro normal. Fim do menu espremido encostando no logo. |
| 122 páginas de `news/` | `logo-elite.js` trocado por `header-elite.js?v=20261015` (marca "LUCAS SEMIM", menu completo, eventos GA preservados). |
| 14 páginas sem menu | Receberam `<script src="../js/header-elite.js?v=20261015">` antes de `</head>`: 7 notícias órfãs, calculadora-prescricao, audiencia-de-custodia, politica-de-privacidade, portal-investidor, projeto-anjo, emergencia, civel/painel-processo. |
| `o-que-fazer-agora/*.html` | Cal.com embed protegido contra `Cal is not defined` (`defer` + `typeof Cal !== 'undefined'`), que era o erro que impedia o header de aparecer lá. |

### Testes (Puppeteer, screenshots em `_ferramentas/header-unificado-20261015/shots/`)
- 1440/1200/390px × 8 páginas (news migrada, news padrão, home Lux, calculadora, custódia, política, portal-investidor, o-que-fazer): header presente, visível, **0 navs duplicadas**, toggle do menu **dentro da tela**, gaveta mobile abre em todas.
- `o-que-fazer-agora` testado com interceptação de domínio (no localhost ele falhava por URLs absolutas — no servidor real funciona): header OK, ticker de emergência OK.
- Zero erro de JS novo introduzido.

### Reversão
- Backups em `_ferramentas/backups/header-unificado-antes-20261015/` (`js/`, `css/`, `paginas/`).
- Para reverter as notícias: trocar de volta `header-elite.js?v=20261015` → `logo-elite.js?v=20261009` (busca e troca simples).

---

## 2. Auditoria de SEO — achados reais (NADA corrigido ainda; precisa do seu OK)

1. **CEP divergente (o mais grave para SEO local/NAP):**
   - `34505-020` — **51 páginas** (notícias, o-que-fazer-agora)
   - `34505-000` — 9 páginas (cível)
   - `34505-030` — 7 páginas (sobre-mim, o-que-fazer-agora)
   - `34575-020` — só `index.html` + `footer-seo.js`, `ai-neural-seo.js`, `vcard-smart.js`
   - `34505-460` — só `google-ai-brain.js` + `llms.txt`
   - Mesma rua (Cel. Abílio Pereira, 337 – Sabará), **5 CEPs diferentes**. Fontes públicas não fecharam o único CEP correto (viaCEP fora do ar durante a sessão); **precisa confirmar com os Correios qual é o oficial** antes de unificar. Sugestão: conferir no site dos Correios e padronizar tudo num único valor.
2. **FAQ sem texto visível:** páginas de `o-que-fazer-agora` têm schema `FAQPage` mas o FAQ visível vem do `faq-brain.js` (JS). O Google hoje lê JS, mas é fragilidade — se quiser blindar contra o Provimento 205/Google, vale renderizar o texto no HTML.
3. **Schemas com nomes de empresa divergentes** (6 variantes encontradas): "Semim & Associados Advocacia", "Lucas Semim Advocacia" etc. no `publisher`/`Organization`. Padronizar um único nome.
4. **Sitemaps:** `sitemap-news.xml` redundante e fora do `robots.txt`; `lastmod` defasados. As 3 notícias "-1" duplicadas têm canonical OK (baixa prioridade).
5. **Search Console:** cadastrar `sitemap.xml` + `sitemap-urgencia.xml` e pedir indexação de `/`, `/advogado-criminalista/`, `/o-que-fazer-agora/` e do guia da revista pessoal (pendente da passagem anterior).

---

## 3. O que falta / sugestão de ordem quando o Claude acordar

1. **Seu OK** no relatório acima → subir: `js/header-elite.js`, `css/header-lux.css`, as 122 notícias, as 14 páginas com header novo e o `o-que-fazer-agora` (com backup no servidor antes, como sempre).
2. Confirmar o CEP oficial nos Correios e unificar (um lote de busca-e-troca por diretório, com backup).
3. Padronizar o nome da empresa nos schemas.
4. Continuar o resto da passagem anterior (contrato API V3, Acesso de teste, Search Console).

## 4. Estado do ambiente
- Servidor local de teste (porta 8137) pode ser fechado; nada dele afeta o site.
- Nenhum arquivo do servidor foi tocado nesta sessão. Nenhum upload foi feito.
- Estrutura de teste em `_ferramentas/header-unificado-20261015/` (scripts de teste + screenshots).
