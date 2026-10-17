# Orientações para o Claude Code — Painel do Cliente e Painel de Gestão (14/10/2026)
**Material de apoio ao Claude Code · Missão: aperfeiçoar os painéis com ênfase técnica. Nada aqui foi implantado ainda; valide cada ponto no código real antes de afirmar que funciona.**

## 0. Estado verificado por leitura direta (13–14/10)
- `portal/painel-cliente.html` (front do cliente): PRONTO e bem escrito — constrói DOM sem `innerHTML` (função `h()`), `AbortController` com timeout de 40 s, modo `#demo` sem rede, corpo POST em texto simples para evitar preflight CORS, upload com limite de 6 MB no front, token em `sessionStorage`.
- `painel-gestao-admin.html` (painel do Dr. Lucas): V1 funcional (Clientes+Processos) falando com `25_Painel_Admin.gs` — mas com falhas de segurança confirmadas (seção 3 abaixo).
- `_ferramentas/portal-v2-rascunho/PortalV2.gs` (391 linhas): rascunho de estudo do backend do portal, com PBKDF2, LockService, idempotência, magic number de upload e auditoria. **Nunca tem dados reais; precisa de integração + revisão.**

## 1. ⚠️ CONFLITOS DE CONTRATO entre front pronto e backend rascunho (resolver ANTES de colar o `.gs` no projeto online)
Estes são os achados mais importantes desta sessão. Se o Claude Code colar o rascunho sem corrigir, o portal quebra em produção:

1. **Campo do pedido:** o front envia `{ acao:'portal_pedido', token, tipo, mensagem }` (linha ~586 de `portal/painel-cliente.html`). O rascunho lê `p.descricao`. **Decidir um nome** (recomendo o backend aceitar `mensagem` e alias `descricao`) e documentar no contrato.
2. **Campo do upload:** o front envia o base64 em `data` (linha ~608); o rascunho lê `p.base64`. Mesma decisão: padronizar (aceitar ambos, preferir `data`).
3. **`idCaso` ausente no front:** o rascunho EXIGE `idCaso` em pedido e upload e nega tudo sem vínculo (correto para IDOR), mas o front **não envia `idCaso` em lugar nenhum**. O front hoje assume um único caso por cliente. Duas opções:
   - (a) backend deriva o caso único do vínculo quando o cliente tem exatamente 1 caso (compatível com o front atual); ou
   - (b) atualizar o front para enviar `idCaso` (só depois do backend no ar, item 2.7 das orientações de 13/10).
   - Recomendo (a) primeiro, com migração para (b) depois.
4. **Formato de resposta do `portal_painel`:** o rascunho devolve `{ sucesso, casos:[{id,papel}], nome }`; o front espera `{ cliente:{nome}, processo:{numero,classe,juizo,fase,atualizadoEm}, resumo, proximoPasso, movimentacoes[], diligencias[], documentos{contrato,procuracao,declaracao,enviados}, pedidos[] }`. O rascunho só lista vínculos — **falta o enriquecimento** (juntar dados do caso, movimentações, documentos, pedidos por idCaso em abas próprias). Isto é a maior peça de trabalho pendente do backend.
5. **Flag `expirou`:** o front trata `j.expirou` para forçar re-login; o rascunho só devolve `mensagem`. **Toda** falha de sessão no backend deve incluir `expirou: true`.
6. **Tamanho de upload:** front limita 6 MB, rascunho 8 MB. Alinhar (menor valor vence no servidor: 6 MB).
7. **`nome` da sessão:** o rascunho devolve `nome = email`; o front usa para "Olá, {primeiro nome}". Deve vir da aba de usuários (coluna nome) ou ser derivado do caso.

## 2. Técnicas para o backend do portal (rascunho → produção)
1. **Roteador central:** colar o módulo no projeto "Api site" existente e adicionar apenas os `case 'portal_*'` no `doPost` central — nunca criar segundo `doPost/doGet`. Manter `doGet` respondendo JSON de status (evita o bug "Script function not found" com HTTP 200).
2. **Resposta sempre JSON, mesmo em erro:** envolver tudo em `try/catch` e devolver `{ sucesso:false, mensagem }` — o front faz `r.json()` sem checar status.
3. **LockService só em escrita** e nunca em laço longo (padrão já correto no rascunho; manter). A renovação de sessão (linha ~324) usa `tryLock(10000)` e silencia falha — aceitável, mas documentar que inatividade pode não renovar sob disputa.
4. **Leitura de aba por `getDataRange().getValues()` varre tudo** — hoje ok (poucas linhas), mas quando `PORTAL_SESSOES` crescer, trocar varredura por índice em `PropertiesService`? **NÃO** (Properties não é para isso). Alternativa futura: mover sessões expiradas para aba de histórico por gatilho mensal, mantendo a aba ativa pequena.
5. **`sessao_valida_` compara token em texto puro na aba** — melhoria recomendada: guardar **hash SHA-256 do token** na aba (o token em si só vai ao cliente). Assim, quem tiver acesso à planilha não consegue se passar pelo cliente. Custo: computar o hash na entrada e comparar hash a hash.
6. **E-mail como chave de usuário é frágil** (troca de e-mail quebra histórico). Adicionar `usuarioId` (uuid) na aba `PORTAL_USUARIOS` e usar nas abas de sessão/vínculo/pedido/auditoria. E-mail vira apenas dado de login.
7. **Log de auditoria sem `appendRow` solto em escrita crítica:** no rascunho, `portalV2_auditar_` usa `appendRow` fora do lock — sob concorrência pode perder linha. Como auditoria não pode bloquear a operação, manter fora do lock é uma decisão consciente; registrar a decisão no comentário (já implícito). Alternativa: lock de 5 s só na auditoria.
8. **Validar `ativo` e revogação por troca de senha:** o rascunho tem coluna `ativo` mas nenhum fluxo de "trocar senha revoga todas as sessões" (OWASP exige). Criar `portalV2_trocar_senha` administrativo + rotina de revogação em lote.
9. **Testes antes de ligar o front:** os `portalV2_testar*` já existem e cobrem login/duplicidade/magic-number. Acrescentar teste do caso **(2) IDOR**: cliente B tenta pedido em caso do cliente A → negado. É o teste mais importante do sistema (Etapa A, item 4.2).

## 3. Painel de Gestão (Dr. Lucas) — correções prioritárias confirmadas por leitura
Ordem por risco:

1. **Senha vai em parâmetro de URL (GET):** `fetch(ADMIN_API_URL + "?acao=loginAdmin&senha=" + ...)` (linha ~201). URL de GET fica em histórico, log do servidor e pode vazar por Referer. **Corrigir primeiro:** mover login para POST com corpo JSON (o painel já faz POST para `salvarProcessoAdmin` — mesmo padrão). Token em URL de GET (`listarProcessosAdmin&token=...`) tem o mesmo problema: mover tudo para POST.
2. **Senha única compartilhada:** um único `senha-admin` para acesso total (clientes + processos + prazos). Recomendação: replicar o modelo do portal V2 — usuários com PBKDF2, token de 32 bytes, limite de tentativas, e (decisão do Dr. Lucas pendente) segundo fator por e-mail (código de 6 dígitos com `MailApp`, válido 10 min, 3 tentativas).
3. **Logout apenas local:** `btn-sair-admin` só apaga `sessionStorage`. O token continua válido no servidor até expirar. Chamar `acao: 'logoutAdmin'` no backend (revogar linha de sessão, padrão `portalV2_logout`).
4. **XSS em mensagem do servidor:** `carregarProcessos` injeta `data.mensagem` via `innerHTML` (linha ~239). Hoje o backend é confiável, mas a técnica correta é `textContent` (o front do cliente já faz isso — copiar o padrão `say()` de lá).
5. **`tentarLoginSalvo()` não valida o token:** se o token do `sessionStorage` expirou, o painel abre e a primeira chamada falha — ok hoje porque `carregarProcessos` detecta "sessão expirada", mas o texto depende de regex no `mensagem`. Padronizar flag `expirou: true` no backend (mesma do portal) e checar a flag.
6. **URL da API duplicada:** `ADMIN_API_URL` hardcoded no HTML enquanto o resto do site usa `ls-api-config.js`. Migrar para `window.LS_CONFIG.apiUrlAdmin` (uma fonte de verdade, facilita trocar implantação).
7. **Melhorias de produtividade do painel (após segurança):**
   - Ordenar tabela por prazo fatal ascendente (prazos fatais no topo) e destacar prazos ≤ 7 dias em vermelho (hoje tudo fica verde `prazo-ok`).
   - Páginação ou busca server-side quando a base passar de ~200 linhas (hoje `listarProcessosAdmin` devolve tudo).
   - Badge "Acesso ao portal: ativo/inativo" por cliente (cruza com `PORTAL_USUARIOS` — o Dr. Luís vê quem tem acesso criado).
   - Botão "criar acesso do cliente" que chama `portalV2_criar_usuario_` com senha temporária enviada por WhatsApp/e-mail (fluxo administrativo já previsto no rascunho).

## 4. Técnicas gerais a aplicar nos dois painéis
1. **Um único utilitário de `fetch` com timeout, retry leve (1 tentativa extra em erro de rede) e normalização de erro** — copiar o `call()` do portal do cliente como referência; o painel admin ainda não tem timeout (fica preso se o Apps Script travar).
2. **Contrato de API documentado em um arquivo único** (`_ferramentas/contrato-api-paineis.md`): cada ação, campos enviados, campos devolvidos, flags (`expirou`, `duplicado`). Evita exatamente os conflitos da seção 1.
3. **Versionar o front com `?v=` igual ao resto do site** (as páginas do site usam carimbo; os painéis ainda não — lembrar ao subir mudanças de painel).
4. **CSP e headers:** no `.htaccess`, avaliar `Content-Security-Policy` restritiva para os painéis (self + fonts.googleapis/cdnjs + API do script.google.com) e `Referrer-Policy: no-referrer` — mitiga vazamento de token por Referer enquanto o item 3.1 não é corrigido.
5. **Nunca logar token/senha:** conferir que `Logger.log` e abas de auditoria não recebem token (rascunho já correto; manter).
6. **Testes com `#demo` em ambos:** o cliente já tem modo demo impecável; replicar no painel admin (dados fictícios, zero rede) para treinar sem tocar na planilha real.

## 5. Ordem de trabalho sugerida para amanhã
1. Corrigir seção 1 (contratos) no rascunho `PortalV2.gs` — especialmente `mensagem/data` e enriquecimento do `portal_painel` + flag `expirou`.
2. Corrigir seção 3.1 e 3.3 do painel admin (senha/token fora da URL + logout server-side).
3. Colar o módulo no roteador central, implantar em modo teste, rodar a bateria de testes de 13/10 (seção 4) + teste IDOR da seção 2.9.
4. Só depois: conectar o front, migrar painéis antigos e limpeza (item 2.7 das orientações de 13/10).
5. Melhorias de produtividade (seção 3.7) por último — valor para o escritório, sem risco.

**Bloqueados no Dr. Lucas (inalterados):** segundo fator, usuários internos, retenção, consolidação de backends, execução do inventário da planilha (`_ferramentas/inventario-abas/InventarioAbas.gs`).
