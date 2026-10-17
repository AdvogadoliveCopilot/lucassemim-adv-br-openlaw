# Orientações para o Claude Code — Próxima etapa: SEO do site + OmniRoute (14/10/2026, noite)
**Material de apoio ao Claude Code · Origem: pedido do Dr. Lucas ("ligar os agentes OmniRoute (localhost:20128) e ajustar as aplicações de SEO do site; buscar todos os scripts SEO; orientar a próxima etapa antes do Claude acordar"). Tudo verificado por leitura direta dos arquivos. Nada implantado no site ou no OmniRoute além do relatado.**

## 0. Estado verificado por leitura direta (14/10/2026)
- **OmniRoute local no ar**: `http://localhost:20128/home` respondeu HTTP 200 (painel Next.js). É o gateway que os agentes Python usam para publicar (handover de 05–06/10).
- **Pipeline de agentes** (`agentes/`): `pipeline.py` orquestra `agente_pesquisador → agente_redator → agente_seo → agente_publicador`, com `compliance.py` (ética OAB) e `motor_retroalimentacao.py` (aprendizado com artigos publicados). O `agente_seo.py` já faz checagem determinística (title 30–70, meta 70–160, 1 H1, ≥3 H2, canonical, OG tags, ≥2 links internos, ≥500 palavras — meta do site 600, palavra-chave no título/início) e pede nota/melhorias à IA aplicando só o seguro (meta description).
- **Scripts SEO do site (JS client-side, o que roda no navegador do visitante):**
  - `js/ai-neural-seo.js` (AiNeuralSeo V4) — GEO/Local SEO, schemas JSON-LD (LegalService+LocalBusiness, Person, WebSite, Speakable, EntitySummary, Urgency), `detectPageContext()` com 25+ contextos (flagrante, habeas, tráfico, audiência, tornozeleira, saidinha, preventiva, canivete, fato atípico, Maria da Penha, calculadora/prescrição, fraudes pix, progressão/SEEU + 10 cidades). **Lote E (09/10) já removeu FAQ/HowTo/blocos ocultos não visíveis e superlativos (Provimento 205/2021 OAB).**
  - `js/footer-seo.js` (FooterElite V4) — rodapé com 10 cidades + hub regional, 6 serviços, sistemas (radar de notícias, calculadora, portal), redes sociais e trust badges.
  - Outros em `js/`: bundle de SEO marketing do site público (header-elite.js injeta parte) — Claude: fazer inventário completo com grep `schema|ld\+json|og:|twitter:` antes de mexer.
- **Arquivos raiz**: `robots.txt` V8 (out/2026) — grupos unificados Googlebot/Bing/GPTBot/ClaudeBot/PerplexityBot etc., com áreas restritas protegidas; `sitemap.xml` presente; 64 arquivos xml/txt na raiz (Claude: conferir sitemaps por tema/cidade e datar).
- **Painéis do portal** (`portal/painel-cliente.html`, `painel-gestao-admin.html`): têm `noindex, nofollow` — correto, não são para SEO.

## 1. O que ligar no OmniRoute agora (para os agentes rodarem)
1. Confirmar combos no painel `localhost:20128/home`: os combos "auto/smart" que o `agente_seo.py` usa devem estar ativos com chave Gemini gratuita (handover 05–06/10). Se o painel pedir, rodar `agentes/configurar_omniroute_combos.py`.
2. Teste de fumaça do pipeline SEM publicar: rodar `agente_pesquisador` + `agente_redator` + `agente_seo` em modo revisão (o `agente_seo` grava `output_seo.json` sem publicar; quem publica é o `agente_publicador`). Conferir que o 429 com backoff (10–50s) está funcionando nos 3 agentes.
3. **Publicar 1 artigo piloto** por um tema novo (sugestões com demanda criminal real: "flagrante por tráfico: o que fazer nas primeiras 24 horas", "reunião familiar no SEEU: como funciona", "jus puniendi vs jus accusationis: linguagem simples"). Só depois escalar o ritmo.

## 2. Melhorias de SEO — site público (prioridade por impacto)
### 2.1 Sitemap e descoberta (impacto alto, esforço baixo)
1. **Auditar `sitemap.xml`**: conferir que TODAS as páginas de cidade (`advogado-criminalista/*.html`), defesa criminal e notícias estão lá, com `<lastmod>` real (não a data de geração) e sem 404/redirect. Sitemaps segmentados (um por tipo) + índice sitemap se passar de ~200 URLs.
2. **Regenerar sitemap após cada publicação do agente**: o `agente_publicador` publica, mas nada garante que o sitemap inclui o artigo novo. Adicionar no final do pipeline uma etapa que baixa `sitemap.xml` do FTP, insere a URL com lastmod de hoje e devolve. Sem isso o artigo novo pode demorar semanas para ser descoberto.
3. **`llms.txt`** (o V4 injeta hint de LLM; o arquivo raiz deve existir e listar as páginas-pilar em markdown) — Claude: verificar se já existe na raiz e criar/atualizar com as 6 páginas-pilar de defesa criminal + páginas de cidades.
4. **Página "regiões atendidas"** (`advogado-criminalista/` hub): conferir que ela existe, lista todas as 10 cidades com textos únicos e está no sitemap — é o núcleo do Local SEO.

### 2.2 Schemas e dados estruturados (manter a conformidade do Lote E)
1. **NÃO reativar FAQPage/HowTo** sem conteúdo visível na página (o Lote E removeu por conformidade com o Provimento 205/2021 e diretrizes do Google). Se quiser FAQ com schema, o FAQ precisa estar RENDERIZADO na página — avaliar com o Dr. Lucas páginas que já têm FAQ visível e marcar só essas.
2. **BreadcrumbList está faltando** (não vi injeção nos scripts): páginas de cidade e defesa devem ter breadcrumb (Home → Defesa Criminal → Página) marcado com schema — melhora SERP e navegação. Implementar em `ai-neural-seo.js` com `safeInjectSchema` existente, APENAS se o breadcrumb visual existir na página.
3. **Person schema**: o V4 injeta Person do advogado — conferir `sameAs` com Instagram/LinkedIn/Jusbrasil do `footer-seo.js` (consistência de entidade entre os dois scripts).
4. **`dateModified` nos schemas dos artigos**: quando o agente atualiza um artigo, o schema LegalService/Article deve refletir a data real — hoje o agente não toca nos schemas das páginas existentes.
5. **Validar tudo com Rich Results Test / schema.org validator** depois de qualquer mudança — registrar resultado no relatório.

### 2.3 Conteúdo / E-E-A-T (o que diferencia advogado hoje)
1. **Autoria real nos artigos**: cada artigo do agente deve ter bloco de autoria (nome, OAB/MG 222.539, foto, link para página do Dr. Lucas) + schema `author` Person — Google pesa E-E-A-T forte em YMYL/advocacia.
2. **Revisar títulos**: padrão atual do redator gera títulos genéricos; orientar o agente redator a usar padrão "Tema + Benefício/Cidade" (ex.: "Tornozeleira eletrônica: quando é possível trocar por prisão domiciliar em MG") — testar 2–3 fórmulas e medir CTR no Search Console.
3. **Links internos automáticos no `agente_seo.py`**: a checagem exige ≥2 links internos, mas não sugere quais. Melhoria: o agente deve escolher 2–3 páginas-pilar do `footer-seo.js` (lista já existe: custódia, júri, execução penal, HC, nulidades, tráfico) e inserir links com âncora descritiva.
4. **Search Console**: verificar se propriedade está ativa, enviar sitemap e monitorar queries — sem isso não há como medir as melhorias. Pendência do Dr. Lucas (acesso).

### 2.4 Local SEO / GEO (diferencial do escritório)
1. **Consistência NAP** (nome, endereço, telefone) nos 3 lugares: `ai-neural-seo.js` (config.advogado), `footer-seo.js` (config) e Google Perfil da Empresa — telefone `+5531989420094` e endereço "R. Cel. Abílio Pereira, 337, Sabará/MG, CEP 34575-020". Qualquer divergência enfraquece o Local Pack.
2. **Páginas de cidade**: cada página de cidade deve ter conteúdo ÚNICO (referências a vara criminal local, comarcas vizinhas, marcos da cidade) — não "template com nome trocado". Se hoje são templates, priorizar reescrever Sabará e BH (maior volume).
3. **Wikidata/Geo**: os IDs de cidades do Wikidata foram corrigidos no Lote E — conferir os das 10 cidades e manter coordenadas consistentes nos schemas.

## 3. OmniRoute × SEO — integração recomendada
1. O `motor_retroalimentacao.py` já aprende com artigos publicados; estender para receber também **queries do Search Console** (CSV exportado) e priorizar temas com impressões altas + posição ruim (oportunidade imediata).
2. Criar no `agente_seo.py` uma checagem nova: **schema JSON-LD do artigo gerado** — o artigo precisa do mesmo padrão de schema das páginas do site (`LegalService` citation + `Article` com author Person). Hoje o agente confere JSON-LD mas não o autor.
3. **Ritmo de publicação**: definir com o Dr. Lucas (2–3 artigos/semana é saudável; mais que isso com uma IA gratuita pode degradar qualidade). O OmniRoute segue rodando com backoff anti-429.

## 4. Ordem de trabalho sugerida para o Claude (amanhã)
1. Confirmar OmniRoute ativo + 1 artigo piloto publicado via pipeline (com revisão do Dr. Lucas antes de sair).
2. Auditar sitemap.xml + llms.txt + robôs (2.1.1, 2.1.3) e corrigir.
3. Regenerar-sitemap-no-fim-do-pipeline (2.1.2) — pequena mudança no `agente_publicador`/`ftp_util`.
4. BreadcrumbList nas páginas com breadcrumb visual (2.2.2).
5. Bloco de autoria + author schema nos templates de artigo (2.3.1) — editar template do redator.
6. Links internos sugeridos pelo agente SEO (2.3.3).
7. Registrar tudo no relatório e validar schemas com Rich Results Test.

## 5. Bloqueados no Dr. Lucas
- Acesso/propriedade do Search Console para monitorar resultado.
- Definir FAQ visível nas páginas (para poder marcar com schema).
- Ritmo de publicação semanal.
- Atualizar Google Perfil da Empresa com NAP consistente.

**Limite**: nada aqui foi implantado no site ou no OmniRoute além do teste de conexão (HTTP 200 em localhost:20128). O Claude valida cada ponto no código real antes de afirmar que funciona.
