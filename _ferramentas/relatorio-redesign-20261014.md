# Relatório para o Claude Code — Redesign do Portal do Cliente aplicado (14/10/2026, noite)
**Autor: agente auxiliar. Baseado em `_ferramentas/orientacoes-claude-code-redesign-drive-20261014.md`. Tudo LOCAL; nada enviado ao servidor/Apps Script/Drive. Confirme item a item e complete as pendências do backend.**

## Arquivo 1 — `portal/painel-cliente.html` (REESCRITO — redesign completo)
Backup do V1 salvo em `_ferramentas/portal-v2-rascunho/backup-painel-cliente-20261014.html` (669 linhas). Novo arquivo: ~1.940 linhas, autocontido, um único `<script>`, validado (1 html/body/script cada, 60 KB).

### O que o front novo tem (confira visualmente com `#demo`)
1. **Shell de aplicativo**: sidebar fixa 238px (Início, Meu Processo, Documentos, Pedidos, Notificações) + rodapé com avatar/inicial/nome do cliente + sair. Topo sticky com título da vista, badge do CNJ (Fira Code) e botões: tema, notificações (com ponto vermelho de não lidas), sair.
2. **5 telas** (`vInicio`, `vProcesso`, `vDocumentos`, `vPedidos`, `vNotificacoes`) com navegação por `data-vista`/`data-ir`, animação `surge` 180ms.
3. **Início**: 4 cartões de estatística (Próximo prazo destacado em dourado, Pendências suas, Último movimento, Status geral) + linha do tempo dos 3 últimos movimentos + acesso rápido (enviar documento / abrir pedido / ver processo).
4. **Meu Processo**: ficha completa (7 campos, CNJ em mono) + barra de progresso de fases (Inicial→Instrução→Sentença→Recurso, com check nas concluídas) + linha do tempo completa.
5. **Documentos**: dropzone drag & drop (clique, teclado Enter/Espaço, drop) + fila de upload com status por arquivo ("Enviando…/Enviado ✓/erro com motivo") + biblioteca `portal_docs` agrupada por subpasta do Drive + botão "Abrir" por arquivo (chama `portal_doc_link`).
6. **Pedidos**: formulário (tipo com valores curtos `duvida|documento|audiencia|visita|outro` + mensagem) + lista com pill de status colorido e resposta do escritório.
7. **Notificações**: lista com badge de não lidas na sidebar e ponto no sino do topo.
8. **Login**: card escuro/dourado com olho de senha, mensagem de erro centralizada, caixa de "modo demo" visível quando `#demo`, e link de rodapé.
9. **Tema claro/escuro próprio** (toggle no sidebar), preferência em `localStorage` (`ls_portal_tema`), toda a paleta por CSS variables com override `html[data-tema="claro"]`.
10. **Mobile ≤960px**: sidebar some → bottom-nav de 5 ícones (alvo ≥48px) + FAB dourado de enviar documento; grids de 4→2 colunas; conteúdo com padding-bottom para a barra.
11. **Técnica preservada do V1**: POST sempre no corpo, token só em `sessionStorage` (`ls_pt`), timeout 40 s (`AbortController`), `escapar()` (textContent) em TODO dado do servidor antes de compor HTML, modo `#demo` com 450ms de latência simulada e zero rede, retomada de sessão pelo `sessionStorage`.
12. Segurança: `robots noindex/nofollow` mantido; sem dependência de `header-elite.js`/bundles de marketing (autocontido).

### Divergências V1→V2 no CONTRATO (resolvidas no front; backend precisa acompanhar)
- `movimentacoes[]` agora usa `{data, titulo, texto}` (V1 usava `{data, evento}`).
- `resumo` agora espera objeto `{proximoPrazo:{data,descricao}, pendencias}` (V1 string).
- `pedidos[].tipo` usa valores curtos.
- `notificacoes[]` é campo novo.
- **Tudo detalhado no final de `_ferramentas/contrato-api-paineis.md` (seção adicionada hoje)** — o backend do rascunho `PortalV2.gs` precisa ser ajustado para ESTE formato (ou decidir o contrário e atualizar o contrato; escolher UM).

## Arquivo 2 — `_ferramentas/contrato-api-paineis.md` (atualizado)
Seção nova com: `portal_docs`, `portal_doc_link`, ajustes do `portal_upload` (o front V2 envia **dataURL completo** — backend precisa dar strip do prefixo `data:...;base64,`), formato completo esperado de `portal_painel` pelo front V2, e as 4 divergências listadas acima para você resolver.

## O QUE FALTA (sua lista de trabalho ao acordar, em ordem)
1. **Backend — alinhar `PortalV2.gs` ao contrato V2** (item acima): formato de `portal_painel` (resumo objeto, titulo/texto, notificacoes), strip do dataURL no upload, e as 3 ações de Drive (`portal_docs`, `portal_doc_link` + registro em `PORTAL_DOCS`) conforme seção 3 das orientações de redesign (incl. IDOR e `PORTAL_LINKS_TEMP` com gatilho de revogação).
2. **Backend — `25_Painel_Admin.gs` real**: conferir que atende POST (o painel admin já fala POST desde a manhã), `logoutAdmin`, flag `expirou`, limite de tentativas. O código `.gs` real não está no repositório — trazer do editor online para `apps-script/`.
3. **Validar o front em navegador** (`portal/painel-cliente.html#demo`): conferir as 5 telas, tema claro/escuro, upload demo, biblioteca demo, mobile (bottom nav + FAB). Qualquer ajuste visual, o Dr. Lucas aprova primeiro (item 5 das orientações).
4. **Datas/hora**: `proximoPrazo` do demo usa `dd/MM/yyyy` textual; se o backend for enviar ISO, o front precisa de parser — hoje ele mostra o texto como vier (decidir formato no contrato).
5. **Desativar o `_temp-antigo.html`** na raiz de `portal/` após sua validação (é o V1 renomeado; o backup canônico está em `_ferramentas/portal-v2-rascunho/`).
6. Depois disso: reorganização de pastas (seção 4 das orientações) e desativação dos painéis antigos civel/.

## NÃO feito (deliberado)
- Nada no backend (Google/Drive/planilha) — inclusive `portal_docs`/`portal_doc_link` ainda não existem no `.gs`.
- Nada do painel admin alterado hoje (já corrigido de manhã: POST, logout server-side, XSS, expirou).
- Sem CSP no `.htaccess` (aguardando subida do pacote de 12/10).
