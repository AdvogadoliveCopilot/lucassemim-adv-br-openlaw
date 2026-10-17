# Relatório — Atualização nº 14 do software jurídico do Dr. Lucas Semim

**Finalizada em nome de Jesus · 15/10/2026**
Preparado pelo Claude · formato Método Live: o quê / onde / como reverter / o que falta

> **Status: no ar e conferido.** 172 arquivos enviados (0 falhas) e baixados de volta do servidor. Os 172 estão idênticos ao que foi enviado (SHA-256 e tamanho) e os outros 109 arquivos das mesmas pastas continuam idênticos ao backup de antes do envio. Falta o seu teste no celular 4G (seção 6) e as decisões da seção 7.

As pastas de trabalho levam "20261016" no nome porque a nuvem usa horário UTC. A data pública do software e a do seu PC é **15/10/2026**.

---

## 1. O que foi ao ar

| Lote | Conteúdo | Arquivos |
|---|---|---|
| 1 · base | `transparencia-ia.html` (nova), `politica-privacidade.html`, `portal-investidor.html`, `projeto-anjo.html`, `css/header-lux.css` (atalho), `js/header-elite.js` (cabeçalho V5), `js/logo-elite.js` (atalho), `js/footer-seo.js`, `legal-tech/calculadora-prescricao.html`, `defesa-criminal/audiencia-de-custodia-prazos-direitos-liberdade-provisoria-bh.html` | 10 |
| 2 · conteúdo | 129 notícias (cabeçalho único) + 32 páginas de `o-que-fazer-agora/` (conserto do agendamento; inclui a página nova do acordo de não persecução penal) | 161 |
| 3 · sw.js | service worker `v14`, enviado por último (~22h33 de 15/10) | 1 |

**Número e frase que você pediu.** O rodapé mostra "Software jurídico · Atualização nº 14 · 15/10/2026 · finalizada em nome de Jesus" (vem do `js/footer-seo.js`), e a mesma informação está no registro de versão da página de transparência.

**Site conduzido por agentes de IA, todos listados.** A página nova `/transparencia-ia.html` explica ao público, em linguagem simples, quem são os agentes e o que cada um faz e não faz: Claude no chat do site e na manutenção/SEO; Gemini (Google) na triagem da Central do Caso e nos 5 agentes de rotina de conteúdo (Pesquisador, Redator, SEO, Rascunho, Monitor); GLM 5.3 (Z.ai) via CodeGPT; Google Antigravity; OmniRoute (gateway local); Google Search Console (medição, não é IA). A página também diz que nenhum agente dá parecer, promete resultado, protocola peça ou publica sozinho, e que a responsabilidade é do advogado (OAB/MG 222.539). O rodapé ganhou o link "Transparência de IA". A Política de Privacidade passou a citar o Gemini.

**Limite a saber.** O rodapé dinâmico (com a linha da atualização e o link de transparência) aparece em 123 das 263 páginas: home e páginas raiz (11 de 18), as 19 de `advogado-criminalista/`, 46 de 47 de defesa criminal, as 32 de o-que-fazer-agora e 14 notícias. As outras 128 notícias e as 4 páginas de `legal-tech/` têm rodapé estático e **não mostram** a linha nem o link (ver P2 na seção 8).

**Não mexi (de propósito):** `.htaccess`, `robots.txt`, `llms.txt`, `sitemap*.xml`, `emergencia.html`, `politica-de-privacidade.html` (página morta), núcleo cível, painéis do portal, nada foi apagado do servidor.

---

## 2. O trabalho do outro agente: mantido, corrigido ou deixado de fora

| O que ele fez | Decisão | Por quê |
|---|---|---|
| 122 notícias trocaram `logo-elite.js` por `header-elite.js?v=20261015` | **Mantido como estava** | Resolve a marca errada ("SEMIM & ASSOCIADOS"), o menu duplicado e o botão do menu fora da tela no celular. |
| 7 notícias órfãs, calculadora de prescrição, audiência de custódia BH, portal-investidor e projeto-anjo ganharam o script do cabeçalho | **Mantido** | Uma linha de script em páginas que estavam sem menu. |
| `emergencia.html` e `politica-de-privacidade.html` ganharam a mesma linha | **Revertido (ficam como estavam)** | `emergencia.html` já tem cabeçalho próprio: ficaria duplo. `politica-de-privacidade.html` é página morta: o `.htaccess` manda o visitante para `politica-privacidade.html`. |
| `civel/painel-processo.html` | **Fora do pacote** | O núcleo cível tem identidade própria ("Advocacia Patrimonial"). Unificar é decisão sua. |
| `js/header-elite.js` (V4 + `removeLegacyNav`) e `css/header-lux.css` (encaixe no notebook) | **Substituídos pelo V5** | O V5 é um cabeçalho único (seção 4). O Lux virou um atalho de 548 bytes porque `index.html` e `o-que-fazer-agora/` ainda o chamam (evita erro 404). |
| Conserto do Cal.com nas 32 páginas de `o-que-fazer-agora/` | **Corrigido** | Pelo código, a versão dele protegia só o `Cal("init")`: o `Cal("ui")` ainda rodava antes de o script (que carrega com `defer`) existir, então o erro "Cal is not defined" voltaria. Agora a configuração roda depois do carregamento da página e só se o Cal existe. |
| Documentos de orientação (.md) | **Lidos como informação** | Nada foi executado além do que você pediu no chat. |

A cópia exata de como o PC estava com as versões dele (40 arquivos) ficou guardada em `_ferramentas\backups\pc-agente-header-v4-20261015\`.

---

## 3. As alegações de SEO do outro agente, conferidas no código

Medi tudo no pacote final (265 páginas HTML do site público, 293 URLs de sitemap).

| # | Alegação | Veredito | O que medi | O que fazer |
|---|---|---|---|---|
| 3.1 | O mesmo endereço aparece com 5 CEPs diferentes | **Confirmado** (4 no site; o 5º está no cível, fora do pacote) | `34505-020` em 50 arquivos (27 o-que-fazer-agora, 18 notícias, 4 defesa-criminal, 1 presídios); `34505-030` em 6; `34575-020` em 4 (`index.html`, `footer-seo.js`, `ai-neural-seo.js`, `vcard-smart.js`); `34505-460` em 3 (`llms.txt`, `google-ai-brain.js` e mais um). `34505-000` (cível, 9 páginas) não dá para medir aqui. | **Não unifiquei.** Não consegui confirmar o CEP oficial: nas listas de ruas de Sabará que consultei (letras A e C e bairro Centro) a "Rua Coronel Abílio Pereira" não aparece. Você confirma pelo Google Maps ou pelos Correios com o nº 337 e eu troco tudo em um lote, com backup. |
| 3.2 | O nome da empresa nos schemas tem 6 variantes | **Confirmado, e é maior** | 11 variantes de nome em 239 das 265 páginas (JSON-LD). Principais: "Semim & Associados Advocacia" (152 páginas), "Dr. Lucas Semim - Advocacia Criminal" (51), "Advogado Lucas Semim Consultoria Jurídica" (32), "Lucas Semim Advocacia" (24), "Lucas Semim — Advocacia Criminal" (5), mais 6 variantes isoladas (ex.: "Advogado Live Semim & Associados", "Lucas Semim Advogados"). O número "326 arquivos" do agente não bate com as páginas HTML. | Padronizar **um** nome (sugestão: "Lucas Semim Advocacia Criminal"). Atenção: "& Associados" sugere sociedade de advogados; confira se existe sociedade registrada com esse nome na OAB/MG antes de manter. Decisão sua. |
| 3.3 | O FAQ de `o-que-fazer-agora` só aparece via JavaScript (`faq-brain.js`) | **Não confirmado como descrito** | Nas 31 páginas de `o-que-fazer-agora` com FAQPage, as perguntas estão no HTML estático (31 de 31) e nenhuma carrega o `faq-brain.js`. O padrão "FAQ só via JS" existe em **outras** páginas: 20 notícias (JSON-LD estático + acordeão montado pelo `faq-brain.js`) e 8 páginas de `defesa-criminal` com FAQ parcialmente visível. Total: 28 das 95 páginas com FAQPage. | Baixa urgência (o Google renderiza JS e o conteúdo é o mesmo). Quando for blindar, comece pelas 8 de defesa criminal. |
| 3.4a | `sitemap-news.xml` fora do `robots.txt` | **Confirmado** | O `robots.txt` lista `sitemap.xml`, `sitemap-noticias.xml`, `sitemap-urgencia.xml` e `sitemap-presidios.xml`. | Decidir: listar no robots ou eliminar o arquivo (eu não apago arquivo do servidor). |
| 3.4b | `sitemap-news.xml` é redundante | **Parcial** | As 47 URLs dele estão todas em `sitemap-noticias.xml` (139 URLs). No `sitemap.xml` principal há 0 notícias. É formato Google News e não tem `lastmod`. | Mesma decisão acima. |
| 3.4c | `lastmod` defasados | **Confirmado** | `sitemap.xml`: 47 de 74 URLs com `lastmod` 21/04/2026. `sitemap-noticias.xml`: datas de jan a set. `sitemap-urgencia.xml` está em dia (12 a 15/10). | Atualizar só as páginas cujo **conteúdo** mudou (trocar cabeçalho não conta; o Google ignora `lastmod` inflado). |
| 3.4d | 3 notícias "-1" duplicadas com canonical correto | **Confirmado** | As 3 apontam o canonical para a versão sem "-1" e nenhuma está em sitemap. | Nada a fazer agora. |
| 3.5 | `robots.txt`, `llms.txt` e sitemaps sem URL morta | **Confirmado** | 0 URLs sem arquivo nos 5 sitemaps (293 URLs). | — |
| novo | Achado meu: a página nova de transparência não está em nenhum sitemap nem no `llms.txt` | **Novo** | `transparencia-ia.html` ausente de `sitemap*.xml` e `llms.txt`. | Incluir (P1, seção 8). |

Outros achados da rodada de testes, **anteriores a esta atualização** (comparados com o estado de antes, nenhum foi causado por ela): breadcrumb duplicado em 19 notícias; erro de JavaScript (SyntaxError) em 22 páginas; rolagem lateral em `noticias`, `calculadora`, `convite` e `oitiva`; erro `feather` em `plantao-flagrante`; `presidio-sao-joaquim-de-bicas-1` demora a carregar; 1 página com recuo exagerado (132/172 px) no corpo.

---

## 4. Cabeçalho V5

**O quê.** Um único cabeçalho para o site inteiro, no lugar dos quatro sistemas que existiam. HTML semântico (`<header id="site-header">`, `<nav>`, listas e links reais), submenus "Defesa Criminal" e "Comarcas" com links para os guias e as 17 páginas de cidade, gaveta no celular (fecha com ESC, foco preso, trava a rolagem), ícones SVG embutidos (não depende mais do Font Awesome), botão "Plantão 24h" em destaque, telefone e Área do Cliente mantidos. Altura fixa de 78 px (desktop) e 66 px (celular). Respeita "reduzir movimento". Os eventos do GA4 mantêm os nomes (`tel_header`, `whatsapp_header`, `tel_header_mobile`, `area_cliente_header`), então os relatórios não quebram. O menu antigo da página só é removido **depois** de o novo estar montado; se algo falhar, o menu antigo continua.

**Onde.** `js/header-elite.js` (56.968 bytes) é o cabeçalho. `js/logo-elite.js` (1.463 bytes) virou atalho que carrega o V5. `css/header-lux.css` (548 bytes) virou stub. 129 notícias apontam para `header-elite.js?v=20261015`.

**Como reverter.** No FileZilla, abra no lado esquerdo `C:\Users\adm\Desktop\lucassemim.adv.br\_ferramentas\backups\servidor-antes-atualizacao-14-20261016\` e no direito `/public_html`. Selecione o arquivo, botão direito, **Upload**, **Substituir**. Para o cabeçalho voltar ao que era: `js/header-elite.js`, `js/logo-elite.js`, `css/header-lux.css`. Para uma página só, a mesma pasta tem a versão anterior dela. Envie o `sw.js` do backup por último. Nunca use sincronização. Arquivos que são novos e não têm versão anterior: `transparencia-ia.html` e `o-que-fazer-agora/acordo-nao-persecucao-penal-o-que-fazer.html` (para tirar do ar, é preciso apagar no servidor, e isso eu não faço sem você pedir).

**O que falta.** Teste real no celular (seção 6). Cabeçalho do núcleo cível (outro padrão, decisão sua). Os achados "anteriores a esta atualização" da seção 3.

---

## 5. Verificação depois do envio

1. **Backup antes:** 279 arquivos do servidor baixados para `_ferramentas\backups\servidor-antes-atualizacao-14-20261016\` (é o seu ponto de retorno).
2. **Envio:** 172 arquivos pelo FileZilla, na ordem base, conteúdo, `sw.js`. "Transferências bem sucedidas (172)", nenhuma falha.
3. **Volta:** baixei de novo 281 arquivos do servidor (172 enviados + 109 vizinhos) para `_ferramentas\verificacao-pos-upload-14-20261016\`.
4. **Resultado:** 172 de 172 idênticos ao manifesto (`manifesto-sha256.csv`: hash e tamanho); 109 de 109 vizinhos idênticos ao backup; 0 divergências, 0 ausentes, nenhuma conversão de quebra de linha.

**Não conferido ao vivo.** A checagem pública (home, notícia, o-que-fazer-agora) não foi feita daqui: o IP do seu PC está atrás da "Verificação de segurança" (CAPTCHA) da Locaweb, que só você resolve, e a leitura pública pela nuvem pede aprovação da sua parte para cada link. Por isso o checklist abaixo é pelo seu celular em 4G.

---

## 6. Checklist de teste no celular (4G), uns 5 minutos

1. **Home** (`lucassemim.adv.br`): cabeçalho novo, menu com "Defesa Criminal" e "Comarcas", botão "Plantão 24h". No fim da página: a linha "Atualização nº 14 · 15/10/2026 · finalizada em nome de Jesus" e o link "Transparência de IA".
2. **Menu no celular:** a gaveta abre e fecha; telefone e WhatsApp abrem.
3. **Uma notícia** (ex.: `/news/stf-maconha-40g-usuario-traficante.html`): um menu só, marca "LUCAS SEMIM" (não "SEMIM & ASSOCIADOS"), botão do menu visível dentro da tela.
4. **`/o-que-fazer-agora/`** e uma página de urgência (ex.: `/o-que-fazer-agora/acabei-de-ser-preso-em-flagrante.html`): cabeçalho aparece e o agendamento (Cal.com) não trava a página.
5. **Página nova:** `/o-que-fazer-agora/acordo-nao-persecucao-penal-o-que-fazer.html`.
6. **Calculadora:** `/legal-tech/calculadora-prescricao.html` agora tem o cabeçalho e continua calculando.
7. **Transparência:** `/transparencia-ia.html`. Leia o texto inteiro (ver seção 7).
8. **Política de privacidade:** `/politica-privacidade.html`. Leia o parágrafo sobre o Gemini.
9. **Emergência:** `/emergencia.html` igual a antes (um cabeçalho só).
10. **`.htaccess` (pendente desde 15/10):** home, `/o-que-fazer-agora/` e uma página inexistente (deve abrir a página 404 do site, nunca "Erro 500").

Se algo estiver estranho, me mande a página e um print: eu reverto só aquele arquivo. Se a tela parecer antiga, recarregue duas vezes ou abra em aba anônima (o service worker troca para a `v14` sozinho).

---

## 7. Decisões e pendências suas (eu não faço sozinho)

1. **CEP oficial** do nº 337 e **nome padrão da empresa** nos schemas (seção 3.1 e 3.2).
2. **Revisar textos públicos que falam por você:** `/transparencia-ia.html` (lista de ferramentas, "GLM 5.3" via CodeGPT, frases de supervisão como "nada vai ao ar sem revisão e ordem do advogado") e o parágrafo do Gemini em `/politica-privacidade.html`. Confirme que descrevem a realidade do escritório.
3. **Search Console:** enviar `sitemap.xml` e `sitemap-urgencia.xml` (os outros dois já estão no `robots.txt`) e pedir indexação de `/transparencia-ia.html`, `/`, `/advogado-criminalista/` e `/o-que-fazer-agora/`.
4. **CAPTCHA da Locaweb** para o IP do seu PC: só você resolve. Provavelmente é a causa do falso alerta "cível offline" (não verificado).
5. **Portal:** criar o "Acesso de teste" em Central, aba Acessos, e testar o login em `/portal/painel-cliente.html`; trocar o `PC3_PEPPER` antes do primeiro cliente real.
6. **Segurança do FTP:** migrar para FTPS e trocar a senha quando puder.
7. **OmniRoute** (`localhost:20128`): o painel pede o seu login e eu não digito senha; há um aviso de versão do Node.js. **CodeGPT:** não estava logado, não usei.
8. **Núcleo cível:** manter o cabeçalho próprio ou unificar?
9. As 3 páginas antigas de `/portal/` no servidor com WhatsApp antigo: nunca apago, você decide.

---

## 8. Próximos passos recomendados

**P1 (rápidos, alto impacto)**
- Incluir `/transparencia-ia.html` no `sitemap.xml` e no `llms.txt` (um upload pequeno, com backup antes).
- Search Console (item 3 acima).
- Com o CEP confirmado: troca em um lote nos ~63 arquivos (50 + 6 + 4 + 3), com backup e conferência por hash.

**P2**
- Padronizar o nome da empresa nos schemas das 239 páginas (depois da sua decisão).
- Levar a linha da atualização e o link "Transparência de IA" para as 128 notícias de rodapé estático e para `legal-tech/`.
- FAQ no HTML estático nas 8 páginas de defesa criminal; avaliar as 20 notícias.
- Corrigir o breadcrumb duplicado das 19 notícias.
- `lastmod` real, só para páginas com mudança de conteúdo.

**P3**
- Decidir o destino do `sitemap-news.xml`.
- Erros de JavaScript (22 páginas) e rolagem lateral (4 páginas).
- Peso das imagens.

---

*Arquivos desta atualização no seu PC (`C:\Users\adm\Desktop\lucassemim.adv.br\_ferramentas\`): `relatorio-atualizacao-14-20261016.md` (este), `upload-atualizacao-14-20261016\` (o que foi enviado + `manifesto-sha256.csv`), `verificacao-pos-upload-14-20261016\` (cópia baixada do servidor), `backups\servidor-antes-atualizacao-14-20261016\` (ponto de retorno), `backups\pc-agente-header-v4-20261015\` (versões do outro agente).*
