# Orientações para o Claude Code — Redesign do Portal do Cliente + Integração Drive (14/10/2026, 2ª edição)
**Material de apoio ao Claude Code · Origem: feedback do Dr. Lucas ("design do portal do cliente está muito simples — quero um software jurídico de ponta, ligado à pasta do cliente no Google Drive, e pastas do projeto mais bem organizadas para integração"). Nada foi implantado ainda; valide no código real antes de afirmar que funciona.**

## 1. Contexto e estado verificado
- O Dr. Lucas avaliou o design atual de `portal/painel-cliente.html` como "muito simples"; quer nível de software jurídico de ponta (referência de nível: MyLocus, Legal One, Advance da SoftSite/Prodam — sem copiar identidade visual de ninguém).
- O painel de gestão (Dr. Lucas) tem identidade visual própria (dourado + escuro, Playfair Display + Lato + Fira Code) — **é o padrão visual da casa**; o portal do cliente deve convergir para ele, com tipografia e componentes compartilhados.
- O backend rascunho (`PortalV2.gs`) já cria pasta por caso no Drive (`portalV2_pasta_caso_`), mas **nada é devolvido ao front** — o portal do cliente hoje não mostra nada de Drive.
- Painéis antigos existentes: `civel/painel-processo.html`, `civel/painel-cliente.html` — serão desativados depois do portal novo no ar (item 2.7 das orientações de 13/10).
- Arquivos do projeto: `js/header-elite.js`, `css/` (identidade do site), `js/ls-api-config.js` (config única), `_ferramentas/contrato-api-paineis.md` (contrato de API, criado 14/10).

## 2. Redesign do portal do cliente (design "software jurídico de ponta")
### 2.1 Direção visual — convergir com o painel de gestão
- Adotar a mesma paleta e tipografia do painel de gestão (`painel-gestao-admin.html`): fundo escuro `#08090a`, cartões `#111214`, dourado `#d4af37`, bordas `#2a2b2f`, Playfair Display (títulos) + Lato (corpo) + Fira Code (números CNJ/datas).
- Diferença proposital do site de marketing: portal = **área de trabalho**, não landing page. Menos hero/banner, mais densidade de informação, menos animações, mais foco em leitura e ação.
- Sem dependência dos bundles de marketing do site público (`header-elite.js` é opcional — só o menu/header visual mínimo). O portal deve funcionar sozinho (autocontido, como o painel de gestão).
- **Modo claro/escuro com toggle** (o site principal tem dark mode via `header-elite.js`; o portal deve ter o seu próprio, autocontido, com preferência em `localStorage`).
- Acessibilidade: contraste AA nos dois modos, foco visível (`:focus-visible`), alvo de toque ≥ 44px no mobile.

### 2.2 Layout — shell de aplicativo (não página solta)
- **Shell de aplicativo** com: sidebar de navegação (Início, Meu Processo, Documentos, Pedidos, Notificações) + topo com nome do cliente, badge do caso, sino de notificações (com contador de não lidas) e botão sair.
- **Dashboard "Início"**: cartões de resumo (próximo prazo com contagem de dias, pendências do cliente, último movimento, status geral) + linha do tempo vertical (últimos eventos) + acesso rápido (enviar documento, abrir pedido).
- **"Meu Processo"**: ficha completa — número CNJ em fonte mono, vara/juízo, fase (com barra de progresso visual: inicial → instrução → sentença → recurso), parte contrária, valor da causa, resumo do Dr. Lucas, próximo passo, e a linha do tempo completa de movimentações (data + tipo + descrição).
- **"Documentos"**: biblioteca com filtro por tipo (contrato, procuração, declaração, enviados por você, recibos) + área de upload (drag & drop com barra de progresso e lista de arquivos com status).
- **"Pedidos"**: formulário simples (tipo + mensagem) + lista com status (NOVO/EM ANDAMENTO/RESPONDIDO) e resposta do escritório.
- **"Notificações"**: sino no topo + painel; cada item tem data, tipo e texto curto.
- Mobile: sidebar colapsa para barra inferior (bottom nav) com 4–5 ícones (padrão de app de banco) + botão flutuante de ação principal ("Enviar documento" / "Abrir pedido").
- Desktop ≥ 1200px: usar a largura toda (o Dr. Lucas pediu "mais amplo"): sidebar fixa ~240px + conteúdo fluido até ~1280px, grid de 2 colunas no dashboard.

### 2.3 Componentes e microdetalhes de ponta
- **Skeleton loading** (placeholders animados enquanto carrega) — nunca página vazia em branco.
- **Toast de feedback** (sucesso/erro, canto inferior) em vez de mensagens estáticas.
- **Empty states ilustrados** com chamada para ação ("Nenhum pedido ainda — envie o primeiro").
- Badge de status com cor semântica (NOVO=dourado, EM ANDAMENTO=azul, RESPONDIDO=verde).
- Animações discretas (150–200ms, transform/opacity apenas — nada pesado).
- Formatação de datas em pt-BR e CNJ mascarado (0000000-00.0000.0.00.0000) com Fira Code.

### 2.4 Técnica
- Um único arquivo autocontido (`portal/painel-cliente.html`) — sem build, sem dependências além de Google Fonts (mesmo modelo do painel de gestão). Se ficar > 2000 linhas, extrair para `portal/portal-styles.css` e `portal/portal-app.js` (mesma pasta, referências relativas).
- Continuar: DOM API sem `innerHTML` com dados do servidor, `AbortController` 40 s, corpo POST texto simples, modo `#demo` atualizado para o novo layout, token em `sessionStorage`.
- Versões `?v=20261014` em todos os recursos locais.
- Manter `noindex, nofollow` e fora do sitemap.

## 3. Ligação com a pasta do cliente no Google Drive (nova funcionalidade central)
**Meta: o cliente vê e baixa os documentos do SEU caso direto da pasta dele no Drive — sem o Dr. Lucas ter que enviar por WhatsApp.**

### 3.1 Arquitetura
- Pasta raiz do Drive do escritório → subpasta por caso (já existe no rascunho: `portalV2_pasta_caso_` cria/acha pasta com nome do ID do caso, ex. `CASO-2026-0007`).
- Dentro da pasta do caso, subpastas fixas (padrão de software jurídico):
  - `01_Contratos` · `02_Procuracoes` · `03_Declaracoes` · `04_Peticoes` · `05_Decisoes` · `06_Enviados_pelo_cliente` · `07_Recibos` · `08_Administrativo`
- Upload do cliente → **sempre** para `06_Enviados_pelo_cliente` (regra do servidor, o front não escolhe pasta).
- Ver só o que é do seu caso, ver só as pastas do padrão acima (nada de pastas administrativas do escritório).

### Drive → API → front: 3 ações novas no PortalV2 (contrato em `_ferram.../contrato-api-paineels.md` — atualizar nome se houve typo)
- `portal_docs` (nova): devolve `{ pastas: [{id, nome, arquivos:[{id, nome, tamanho, atualizadoEm, urlVisualizar, urlDownload}] }], total, quota }`. Uso: token → sessão → vínculo → idCaso → pasta → listar subpastas+arquivos. Cada arquivo devolve `urlVisualizar` (para abrir no Drive, `https://drive.google.com/file/d/<id>/view`) e `urlDownload` (`.../uc?export=download&id=<id>`) — **nunca devolver o ID da pasta raiz nem de pastas administrativas**.
- `portal_doc_link` (nova): devolve URL fresca de um arquivo (validando vínculo caso→arquivo está na pasta do caso). Uso: cliente clicou num documento do painel → abre em nova aba.
- `portal_upload` (existente, ajustar): após gravar o arquivo, registrar na aba `PORTAL_DOCS` (idCaso, nome, tamanho, quem, quando, pasta Drive real) para auditoria e para o front listar sem consultar o Drive duas vezes.

### 3.2 Segurança (crítico — transferência de documentos é o coração do sistema)
- **IDOR é o risco nº 1**: antes de devolver qualquer arquivo/pasta, conferir que a pasta pertence ao caso vinculado ao token. Teste `portalV2_testarIdor()` estendido: cliente B pede documento do caso A → negado. É o teste mais importante do sistema.
- **Sem WebContent/ACL aberta**: os arquivos continuam privados no Drive (compartilhamento restrito ao domínio/contas do escritório); o acesso do cliente é mediado pelo backend (valida sessão+vínculo) e usa links temporários do Drive (ex.: `webViewLink` já visível só para quem tem permissão — para cliente externo, usar `setSharing` com **link de visualização expiring** (`setSharing(..., DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW)` **com data de expiração** via Advanced Drive Service `files.update` com `sharedCapsule`/expiração do Drive Enterprise/Workspace: se a conta não tiver expiração de compartilhamento, NÃO usar links abertos — usar a opção B abaixo).
- **Opção B (recomendada para conta gratuita)**: cliente visualiza/baixa via backend — `DriveApp` não dá streaming, mas o backend pode devolver base64 do arquivo (≤ 6 MB) em `portal_doc_download` com o mesmo rigor de vínculo. Para PDFs > 6 MB, devolver `webViewLink` com permissão ANYONE_WITH_LINK restrita por tempo via rotina de gatilho (revogar compartilhamento em 30 min — gatilho que roda a cada 5 min varrendo `PORTAL_LINKS_TEMP`).
`PORTAL_LINKS_TEMP` (nova aba): FILE_ID, TOKEN_HASH, CRIADO_EM, EXPIRA_EM, REVOGADO. Revogar em lote por gatilho de 5 min.
- **Upload já coberto**: tipo (PDF/JPG/PNG por magic number), ≤ 6 MB, pasta fixa do cliente, auditoria sem conteúdo.
- Auditoria: registrar cada visualização/download (ator, ação, recurso=hash do file id, resultado). NUNCA logar token, senha ou conteúdo.

## 4. Reorganização de pastas do projeto (para melhorar a integração)
Problema hoje: arquivos de estudo/rascunho misturados com arquivos "vivos" do site; 847 arquivos na raiz com pastas temáticas. Proposta de organização — **a aplicar com backup e sem quebrar referências**:

```
lucassemim.adv.br/
├── portal/                  ← frontend do portal do cliente (vivo)
├── painel-gestao-admin.html ← painel do Dr. Lucas (vivo, raiz ok)
├── js/ css/ img/ news/      ← site público (vivo, não mexer sem backup)
├── apps-script/             ← código .gs do Apps Script (vivo) — hoje tem só 4 arquivos
│   ├── 23_API_Central_Caso.gs
│   ├── 25_Painel_Admin.gs            ← TRAZER do Google (hoje só existe no editor online)
__  __  __  __  __  `25_P __ admin.gs  existe localmente? verificar no Apps Script online antes de afirmar
│   ├── 28_Escudo_Seguranca.gs        ← TRAZER do Google
│   ├── 30_Portal_Cliente_V2.gs       ← substituído pelo PortalV2.gs revisado
│   └── 31_Planilha_Audory_V2.gs      ← TRAZER do Google
│   ┐ ...  
├── _ferramentas/            ← tudo que é apoio, estudo, rascunho, relatório, backup
│   ├── portal-v2-rascunho/  ← rascunho backend (estudo)
│   ├── contratos/           ← contrato de API e documentos de definição
│   ├── backups/             ← backups datados
```

## 5. Ordem de trabalho para o Claude Code
1. Redesign do front (seção 2): primeiro o shell (sidebar + topo + dark/light + demo) — o Dr. Lucas aprova o visual antes de conectar dados.
Aprovação do Dr. Lucas: visual aprovado → depois conectar os dados (backend `portal_painel` enriquecido já entrega quase tudo).
2. Ações Drive (seção 3): implementar `portal_docs`, `portal_doc_link`, ajustar `portal_upload` (registro em PORTAL_DOCS) no rascunho `PortalV2.gs` + estender `portalV2_testarIdor()` com teste de docs.
3. Reorganização de pastas (seção 4) — só depois do portal no ar, com backup, e sem quebrar referências (grep de todos os href/src antes de mover qualquer arquivo vivo do site).
4. Front "Documentos" (seção 2.2) já preparado para consumir `portal_docs` (skeleton + empty state), mesmo que a ação ainda não exista no backend (mostra empty state educado "Biblioteca em implantação").
5. Reportar ao Dr. Lucas com screenshot ou descrição das 5 telas (Início, Meu Processo, Documentos, Pedidos, Notificações) para aprovação antes de conectar o backend real.
6. Depois de tudo no ar: desativar painéis antigos (item 2.7 de 13/10) e consolidar `ls-api-config.js` + contrato de API (item 4.2 de 14/1) — único contrato de referência.
