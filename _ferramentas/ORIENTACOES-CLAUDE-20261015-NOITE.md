# ORIENTAÇÕES PARA O CLAUDE — FINALIZAÇÃO DA VERSÃO ATUAL DO SOFTWARE JURÍDICO
## Escrito em 15/10/2026, fim da noite, pelo agente da madrugada. Leia antes de qualquer ação.

---

## ══ 1. ESTADO GERAL DO PROJETO NESTE MOMENTO ══

### No servidor (Locaweb) — tudo no ar e conferido
- `.htaccess` (17.525 bytes), `js/ls-api-config.js`, `portal/painel-cliente.html` (visual "aplicativo" V3) — subidos e conferidos byte a byte na sessão anterior.
- ⚠️ **Pendente do chefe:** teste no celular 4G do `.htaccess` (home, `/o-que-fazer-agora/`, página inexistente). Se der Erro 500, reenviar `_ferramentas/backups/servidor-antes-portal-app-20261015/.htaccess`.
- ⚠️ **Pendente do chefe:** criar "Acesso de teste" na Central (aba Acessos) e testar login em `/portal/painel-cliente.html`.

### No Google (Apps Script) — instalado e testado
- Projeto "Portal do Cliente – Lucas Semim" com as duas implantações ativas. Detalhes completos em `_ferramentas/portal-v3-projeto-novo-20261015/ESTADO-INSTALACAO-20261015.md`.
- Lembrar: ao mudar o `.gs`, reimplantar **as DUAS** implantações como "Nova versão".
- Trocar `PC3_PEPPER` antes do primeiro cliente real (opcional, ver doc acima).

### No PC (esta madrugada) — header unificado, PRONTO MAS NÃO SUBIDO
- Leia `_ferramentas/passagem-turno-header-seo-20261015.md` — relatório completo com tabela de mudanças, testes e reversão.

---

## ══ 2. RESUMO DO QUE EU FIZ NESTA MADRUGADA (header) ══

**Problema:** 4 sistemas de header no site (elite / logo-elite nas notícias / structure.js no cível / ~14 páginas sem menu). Menu duplicado nas notícias, marca errada ("SEMIM & ASSOCIADOS" em vez de "LUCAS SEMIM"), botão saindo da tela no celular, menu espremido no notebook.

**Solução aplicada (só no PC):**
1. `js/header-elite.js`: ganhou `removeLegacyNav()` (apaga nav estática antiga das notícias — fim do menu duplicado), `ensureFonts()` (garante Teko/Lato/Playfair), marca compacta no celular com ellipsis no título (fim do toggle fora da tela em 390px).
2. `css/header-lux.css`: bloco de encaixe em notebook refeito (992–1129px esconde telefone desktop; 992–1299px menu compacto; 1300–1479px respiro normal).
3. **122 páginas de `news/`**: `logo-elite.js` → `header-elite.js?v=20261015` (troca automática, encoding preservado). A marca agora é "LUCAS SEMIM", o menu é completo e os eventos do GA continuam com os mesmos nomes (`tel_header`, `whatsapp_header`, `area_cliente_header`).
4. **14 páginas sem menu** receberam o script: 7 notícias órfãs + `legal-tech/calculadora-prescricao.html` + `defesa-criminal/audiencia-de-custodia-…bh.html` + `politica-de-privacidade.html` + `portal-investidor.html` + `projeto-anjo.html` + `emergencia.html` + `civel/painel-processo.html`.
5. `o-que-fazer-agora/*.html`: Cal.com embed corrigido (`defer` + `typeof Cal !== 'undefined'`) — era o erro JS que impedia o header de aparecer lá.

**O que NÃO mexi (de propósito):**
- `civel/codeleicivel/structure.js` — o núcleo cível tem identidade própria ("Advocacia Patrimonial") e sistema próprio de menu com submenus. É intencional. NÃO unificar sem decisão do chefe.
- As 3 páginas antigas do `/portal/` no servidor com WhatsApp antigo — pendente de decisão.
- Nada foi enviado ao servidor.

**Testes feitos (Puppeteer, evidências em `_ferramentas/header-unificado-20261015/shots/`):**
- 1440/1200/390px × 8 páginas de tipos diferentes: header presente, visível, 0 navs duplicadas, toggle dentro da tela, gaveta mobile abre, ticker de emergência funciona.
- O `o-que-fazer-agora` falha em localhost por usar URLs absolutas do domínio — teste com interceptação de requests (`teste-oqfa.js`) confirma que no domínio real funciona.

**Reversão:** `_ferramentas/backups/header-unificado-antes-20261015/` (js/, css/, paginas/). Para reverter as notícias: trocar de volta `header-elite.js?v=20261015` → `logo-elite.js?v=20261009`.

---

## ══ 3. AUDITORIA DE SEO — ACHADOS REAIS (medidos, não inventados) ══

### 3.1 CEP divergente — O PROBLEMA MAIS GRAVE (SEO local / NAP)
O mesmo endereço (Rua Cel. Abílio Pereira, 337 – Sabará/MG) aparece com **5 CEPs diferentes**:

| CEP | Onde aparece | Quantidade |
|---|---|---|
| `34505-020` | notícias + o-que-fazer-agora | ~51 páginas |
| `34505-000` | cível | 9 páginas |
| `34505-030` | sobre-mim + o-que-fazer-agora | 7 páginas |
| `34575-020` | index.html, footer-seo.js, ai-neural-seo.js, vcard-smart.js | pontual |
| `34505-460` | google-ai-brain.js, llms.txt | pontual |

**Ação necessária:** confirmar com os Correios (site oficial) qual é o CEP correto do nº 337 e unificar tudo. Os serviços de consulta (viaCEP etc.) estavam fora do ar durante esta madrugada; não concluí qual é o correto. **Não unifique na sorte** — um CEP errado multiplicado por 60 páginas é pior que a divergência.

### 3.2 Nome da empresa nos schemas — 6 variantes
Encontradas: "Semim & Associados Advocacia", "Lucas Semim Advocacia" e outras no `publisher`/`Organization` das notícias. Padronizar UM nome (sugestão: "Lucas Semim Advocacia Criminal" — igual ao header) e trocar nos 326 arquivos com cuidado (backup antes).

### 3.3 FAQ dependente de JavaScript
Páginas de `o-que-fazer-agora` têm schema `FAQPage` mas o texto visível das perguntas é injetado pelo `faq-brain.js`. O Google hoje renderiza JS, mas é fragilidade (Provimento 205 / sanidade do conteúdo). Vale renderizar o FAQ no HTML estático nas páginas de maior tráfego primeiro.

### 3.4 Sitemaps e robots
- `sitemap-news.xml` é redundante (as notícias já estão no sitemap principal) e não está no `robots.txt`. Decidir: ou cadastra no robots, ou elimina o arquivo.
- `lastmod` defasados em vários sitemaps — regenerar com as datas reais de edição.
- 3 notícias "-1" duplicadas têm canonical correto (baixa prioridade, não mexer agora).
- Search Console: cadastrar `sitemap.xml` + `sitemap-urgencia.xml` (pendente do chefe, já estava na lista anterior).

### 3.5 O que estava OK (não gastar tempo)
- `robots.txt`, `llms.txt` e os 5 sitemaps: nenhuma URL aponta para página inexistente.
- IDs do Wikidata das cidades: corretos nos scripts ativos.
- Breadcrumb: 3 pontos que injetam, mapeados (breadcrumb-elite.js + página + lucas-v2-article.css).

---

## ══ 4. ROTEIRO DE FINALIZAÇÃO (ordem sugerida, converse com o chefe) ══

1. **Pedir OK do chefe** para subir o pacote do header: `js/header-elite.js`, `css/header-lux.css`, 122 notícias, 14 páginas com header novo, `o-que-fazer-agora` (fix do Cal.com). Protocolo: backup do servidor antes (FileZilla, pasta `_ferramentas/backups/servidor-antes-header-unificado-20261015/`), subir, baixar de volta, conferir SHA-256.
2. **Subir com o chefe conferindo no celular (4G)**: home, uma notícia, uma página de urgência, uma página que antes não tinha menu (ex.: `/legal-tech/calculadora-prescricao.html`).
3. **CEP:** chefe confirma o oficial nos Correios → um lote de busca-e-troca por diretório (backup antes) → atualizar também `llms.txt`, `google-ai-brain.js`, `footer-seo.js`, `ai-neural-seo.js`, `vcard-smart.js`.
4. **Nome da empresa** nos schemas: padronizar (mesmo protocolo).
5. **FAQ estático** nas páginas de maior tráfego de `o-que-fazer-agora`.
6. **Sitemaps:** decidir destino do `sitemap-news.xml`, regenerar `lastmod`, cadastrar no Search Console (com o chefe).
7. **Continuar o portal V3:** Acesso de teste → login real → contrato API único → primeiro cliente real. (A lista completa está na passagem de turno da tarde.)

## ══ 5. REGRAS INEGOCIÁVEIS (repetindo da passagem anterior) ══
- Nada sobe ao servidor/Drive/planilha sem OK do chefe no chat.
- Toda subida: backup antes + conferência (SHA-256) depois.
- O PC não é cópia do servidor: `img/`, `dados/`, `portal/` têm arquivos só lá. **Nunca sincronizar.**
- Nunca apagar arquivo de cliente; `00_Roteador_PROJETO_NOVO.gs` nunca no projeto antigo.
- Senha do Acesso de teste: só o chefe cria e usa.
- Locaweb mostra CAPTCHA para o IP do chefe: conferência pública é pelo celular dele (4G).
- Eventos do GA do header: manter os nomes atuais (`tel_header`, `whatsapp_header`, `tel_header_mobile`, `area_cliente_header`) ou os relatórios quebram.

## ══ 6. ARQUIVOS ÚTEIS DESTA MADRUGADA ══
- `_ferramentas/passagem-turno-header-seo-20261015.md` — relatório detalhado do header (tabelas, testes, reversão).
- `_ferramentas/header-unificado-20261015/` — scripts de teste (`teste-header.js`, `teste-oqfa.js`, `injetar-header.ps1`) + screenshots em `shots/`.
- `_ferramentas/backups/header-unificado-antes-20261015/` — reversão.
- Servidor local de teste (porta 8137) foi fechado no fim da sessão; para reabrir: `npx http-server -p 8137 --silent` na raiz do projeto.

Boa sorte, Claude. O terreno do header está mapeado, testado e reversível. O que falta é decisão do chefe (OK de subida + CEP oficial + nome padrão da empresa) e execução com o protocolo de backup.
