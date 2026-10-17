# Orientações do Agente Auxiliar — construção do software jurídico (Etapa A → C)
**13/10/2026 · Material de apoio ao Claude Code. Superficial por desenho: pontos-chave já conferidos no código local; nada implantado; nenhuma credencial ou dado real transcrita.**

## 1. Onde a construção está (mapa consolidado)
- **Front-end pronto e testado:** `portal/painel-cliente.html` é o portal do cliente em desenvolvimento (login, resumo, movimentações, documentos, pedidos, upload, modo `#demo`). Contrato de API: ações `portal_login`, `portal_painel`, `portal_logout`, `portal_pedido`, `portal_upload` via POST em `window.LS_CONFIG.apiUrl`.
- **Backend ausente:** nenhuma função `.gs` do repositório atende a essas ações. O `apps-script/30_Portal_Cliente_V2.gs` local é esqueleto incompatível (CPF + token de 5 caracteres, `doGet` próprio, ID placeholder). **Esta é a principal peça faltante.**
- **Produtor de triagem funcionando (local):** `23_API_Central_Caso.gs` grava `TRIAGEM_SITE` (23 colunas) e despacha por e-mail/Agenda/Drive. É o melhor modelo de referência para o backend do portal (escapagem, limites, protocolo, tratamento de erro).
- **Painéis antigos a desativar:** `painel-cliente.html` da raiz (login em JS público, `codelei/clientes-vip.js` com padrões de CPF) já coberto por redirect 301 no `.htaccess`; `civel/Claude outputs/painel-cliente.html` é cópia velha com telefone antigo; `templates/menu.html` ainda referencia o painel antigo.
- **Risco já confirmado por leitura:** senha vai em parâmetro de URL no `painel-gestao-admin.html` (`loginAdmin`) e no `civel-painel-auth.js` (`loginCliente`).
- **Planilha:** estrutura ainda desconhecida (401 sem login). Script de inventário somente leitura pronto em `_ferramentas/inventario-abas/InventarioAbas.gs`, aguardando execução pelo Dr. Lucas.

## 2. Direção de construção recomendada (ordem de prioridade)
1. **Backend do portal primeiro.** Escrever funções `.gs` novas com nomes exclusivos (ex.: `portalV2_*`) que implementem exatamente as 5 ações que o front já envia — sem mudar o front-end ainda. Roteamento por `acao` em um único `doPost` central, delegando para módulos; nunca criar um segundo `doGet/doPost` solto (colide com `13_API_Site` e com o esqueleto `30_`).
2. **Autenticação mínima aceitável:** e-mail + senha com hash (salt por usuário) em aba protegida; token de sessão com 32+ bytes aleatórios (`Utilities.getUuid()` não basta — usar `getRandomBytes` → base64), validade curta (ex.: 8–12 h), revogável por logout e por troca de senha. Mensagem de erro idêntica para “e-mail inexistente” e “senha errada”. Limite de tentativas por e-mail + IP via `CacheService` (padrão já usado em `23_API_Central_Caso.gs`).
3. **Autorização por vínculo:** aba de vínculos (cliente ↔ processo) é a fonte de verdade. Toda leitura/gravação parte do token para achar o cliente e depois verifica se o processo pertence a ele. Nada de confiar em `caseId` vindo do browser.
4. **Upload:** limitar tipo (PDF/JPG/PNG), tamanho (≤ 8 MB coerente com o front), escanear por `DriveApp` e salvar em pasta privada por caso, **nunca** em pasta compartilhada por link. Registrar hash + quem enviou + quando em aba de auditoria sem conteúdo.
5. **Pedidos:** protocolo com carimbo de data + aleatório (padrão `LS-...`), idempotência por hash do corpo (mesmo pedido repetido não duplica), status fechado (`NOVO`, `EM_ANDAMENTO`, `RESPONDIDO`) validado no servidor.
6. **Planilha:** não consolidar/ocultar nada ainda. O backend novo deve **adicionar** abas próprias com nomes claros (`PORTAL_SESSOES`, `PORTAL_PEDIDOS`, `PORTAL_AUDITORIA`) em vez de reutilizar abas de triagem. Migração/limpeza só depois do inventário online.
7. **Front-end:** só depois do backend testado, migrar painéis antigos: remover `painel-cliente.html` da raiz (redirect já no ar), atualizar `templates/menu.html` ou descartar o template, resolver `codelei/vip-logic.js` usado por `legal-tech/convite.html` (ou o convite valida no backend, ou o arquivo fica até lá — nunca excluir antes de checar esse dependente).

## 3. Padrões de código para o Claude Code adotar (derivados do que funciona)
- **Da Central do Caso (bom):** `ccS()` para trim, `ccEsc()` para escapar HTML em e-mails/Doc, protocolo determinístico, limite de taxa por chave de cache, `try` envolvendo todo o despacho com fallback (lead nunca se perde), modo teste com dados fictícios.
- **Corrigir do que existe (ruim):** senha em URL → mover para corpo do POST; `no-cors` no `return-lead.js` → usar POST legível para poder reportar erro; backup agendado que chama `getUi()` → trocar por `DriveApp.makeCopy` sem interface; token curto → token longo.
- **Convenções do projeto:** português nos comentários, nomes de função com prefixo do módulo, sem segredo no código (usar `PropertiesService`), UTF-8, CRLF preservado em arquivos do site (Apps Script usa LF, ok), validação com dados fictícios antes de qualquer dado real.

## 4. Bateria de testes mínima antes de dizer “pronto”
1. Login correto / senha errada / e-mail inexistente (mesma mensagem) / 6 tentativas seguidas (bloqueio).
2. Cliente A tenta acessar processo do cliente B → negado ( teste o mais importante do sistema ).
3. Token expirado e revogado → tela de sessão encerrada, sem dados em cache.
4. Upload: tipo inválido, arquivo maior, nome com símbolos, 13 arquivos (front limita 12 — conferir server-side também).
5. Pedido duplicado → mesmo protocolo, não duplicado na aba.
6. `#demo` → zero chamadas de rede (checar aba Network), nenhum dado gravado.
7. Auditoria: nenhum conteúdo de cliente, senha ou token nas linhas gravadas.
8. Queda do Apps Script no meio de um upload → mensagem clara, sem arquivo órfão.

## 5. Decisões que continuam bloqueadas no Dr. Lucas
- Segundo fator: qual (TOTP por app autenticador é o mais simples e gratuito em Apps Script via código de 6 dígitos por e-mail como alternativa leve).
- Equipe: quantos usuários internos e o que cada um vê (muda o modelo de permissões).
- Retenção: quanto tempo guardar sessões, pedidos e uploads.
- Consolidar os 3 backends ou mantê-los separados (recomendação: consolidar o do portal novo no projeto “Api site”, deixando Anjo e cível por conta própria até decisão).
- Executar o inventário da planilha e responder às 5 perguntas do documento da Etapa A.

**Limite:** nada aqui foi implementado, testado contra o Google ou publicado. Este documento orienta; o Claude Code valida cada ponto no código real antes de afirmar que funciona.
