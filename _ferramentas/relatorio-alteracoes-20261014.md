# Relatório de alterações aplicadas em 14/10/2026 — para o Claude Code confirmar
**Autor da sessão: agente auxiliar. Todas as alterações seguem `_ferramentas/orientacoes-claude-code-paineis-20261014.md`. Tudo em cópia local do repositório; NADA foi enviado ao servidor, ao Apps Script online ou à planilha. Por favor, confirme item a item no código antes de prosseguir.**

## Arquivo 1 — `_ferramentas/portal-v2-rascunho/PortalV2.gs` (rascunho de estudo, não implantado)
| # | Alteração | Onde | Orientação |
|---|---|---|---|
| 1.1 | `portalV2_pedido` agora lê `p.mensagem` (com alias `p.descricao` legado) — contrato do front `portal/painel-cliente.html` era `mensagem` | função pedido | Seção 1.1 |
| 1.2 | `portalV2_upload` agora lê `p.data` (com alias `p.base64` legado) — front envia `data` | função upload | Seção 1.2 |
| 1.3 | Nova `portalV2_resolver_caso_(email, idCaso)`: deriva o caso único do vínculo quando o front não envia `idCaso` (opção "a"); com 2+ casos sem `idCaso` → negado como ambíguo. Usada em pedido e upload | novas funções | Seção 1.3 |
| 1.4 | `portal_painel` enriquecido: devolve também `cliente`, `processo`, `resumo`, `proximoPasso`, `movimentacoes`, `diligencias`, `documentos`, `pedidos` (exatamente os blocos que o front consome em `desenhar()`). Fontes novas: abas `PORTAL_CASOS`, `PORTAL_EVENTOS` (opcional), `PORTAL_DOCS` (opcional) — todas ausentes → campos vazios, nunca erro. + nova `portalV2_pedidos_do_caso_` | função painel + 4 funções novas | Seção 1.4 |
| 1.5 | Nova `portalV2_erro_sessao_()`: toda falha de sessão em painel/pedido/upload devolve `expirou:true` (o front testa essa flag) | topo do módulo | Seção 1.5 |
| 1.6 | `PV_MAX_ARQUIVO` 8 MB → **6 MB** (alinhado ao front) e mensagem ajustada | constante | Seção 1.6 |
| 1.7 | Login e sessão devolvem o NOME real (coluna nova NOME em `PORTAL_USUARIOS`; fallback e-mail). `portalV2_criar_usuario_` ganhou parâmetro `nome`; aba de usuários agora com 5 colunas | login/painel/criar_usuario | Seção 1.7 |
| 2.5 | **Hash de token na planilha:** aba `PORTAL_SESSOES` grava `TOKEN_HASH` (SHA-256 base64 do token) em vez do token puro. Login grava hash; `portalV2_sessao_valida_`, `portalV2_logout` e revogação comparam hash a hash. Nova `portalV2_hash_token_()` | sessões | Seção 2.5 |
| 2.8 | Nova `portalV2_revogar_todas_sessoes_(email)` — revoga todas as sessões ativas (uso após troca de senha/suspensão, padrão OWASP) | funções novas | Seção 2.8 |
| 2.9 | Novo teste `portalV2_testarIdor()` — cliente B tenta pedido e upload no caso do cliente A → esperado negar. E novo `portalV2_testarPainel()` (cria `PORTAL_CASOS` fictícia e confere o enriquecimento). Testes de upload atualizados para o campo `data` | testes | Seção 2.9 |
| — | Coluna `RESPONDIDO_EM` renomeada para `RESPOSTA` em `PORTAL_PEDIDOS` (o que o front exibe como "Resposta do escritório" é o texto da resposta) | lembrar_abas | coerência com 1.4 |

⚠️ **Pendência consciente (não feita por decisão, ver seção 2.6 das orientações):** `usuarioId` (uuid) como chave primária — exige migrar 4 abas; deixei para decisão do Dr. Lucas, e-mail continua a chave. **Confirme que não implementou sem perceber.**

## Arquivo 2 — `painel-gestao-admin.html` (painel do Dr. Lucas)
| # | Alteração | Orientação |
|---|---|---|
| 3.1 | **Login por POST no corpo** (`apiAdmin({acao:"loginAdmin", senha})`) — senha nunca mais em URL. Também `listarProcessosAdmin` e `buscarProcessoAdmin` migrados de GET para POST (token no corpo). Salvar já era POST, agora usa o utilitário | Seção 3.1 |
| 3.1 | Novo utilitário `apiAdmin(payload)`: POST sempre + `AbortController` com timeout de 40 s + mensagens de erro de rede padronizadas (padrão do `call()` do portal do cliente) | Seção 4.1 |
| 3.3 | Logout chama `logoutAdmin` no servidor (best effort) antes de limpar o estado local | Seção 3.3 |
| 3.4 | Mensagem de erro do servidor em `carregarProcessos` agora via `textContent`/DOM API (anti-XSS); as de modal já eram `textContent` | Seção 3.4 |
| 3.5 | Detecção de sessão expirada agora pela flag `data.expirou` (sem regex na mensagem) em listar/buscar/salvar | Seção 3.5 |
| 3.6 | `ADMIN_API_URL` lê `window.LS_CONFIG.apiUrlAdmin` (fallback hardcoded transitório mantido) | Seção 3.6 |

## Arquivo 3 — `js/ls-api-config.js`
- Adicionado `apiUrlAdmin` (mesma implantação hoje, separável amanhã) e `versao` → `2026-10-14`. **Atenção: se subir este arquivo ao servidor, lembrar do carimbo `?v=` nas páginas que o chamam** (orientação 4.3).

## Arquivo 4 — `_ferramentas/contrato-api-paineis.md` (novo)
- Contrato único de API dos dois painéis: rotas, campos enviados/devolvidos, flags (`expirou`, `duplicado`), regras de segurança, abas do portal e bateria de testes. É a referência para resolver exatamente os conflitos da seção 1 das orientações.

## NÃO feito (deliberado)
- Nada em `portal/painel-cliente.html` (front do cliente já estava conforme; `idCaso` só depois do backend no ar — opção "b" futura).
- Nada no backend real `25_Painel_Admin.gs` online (a migration POST/token/limite de tentativas lá é o passo 2 da ordem de trabalho — precisa do código `.gs` real, que não está no repositório local; só o front foi ajustado para já falar POST).
- Sem CSP/Referrer-Policy no `.htaccess` (toque no arquivo crítico do site — decidir junto com a subida pendente do pacote de 12/10).
- Sem segundo fator, sem paginação, sem ordenação por prazo no admin (itens 3.2 e 3.7 — após as correções de segurança serem confirmadas).
- `usuarioId` (ver pendência acima).

## Checklist de confirmação que peço ao Claude
1. Ler `PortalV2.gs` conferindo os 11 itens da tabela 1 (especialmente hash de token: login grava hash e todas as buscas comparam hash).
2. Ler `painel-gestao-admin.html` conferindo que **não existe mais nenhum `fetch` com token/senha em URL** (grep por `?acao=` deve dar zero).
3. Conferir `ls-api-config.js` (`apiUrlAdmin`) e a consistência com o painel admin.
4. Validar o contrato `_ferramentas/contrato-api-paineis.md` contra o front (`portal/painel-cliente.html` linhas ~440–620) — qualquer divergência, corrigir o contrato primeiro.
5. Depois de confirmar: passo 2 da ordem de trabalho (backend `25_Painel_Admin.gs` — POST, token de 32 bytes, limite de tentativas, flag `expirou`, ação `logoutAdmin`).
