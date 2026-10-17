# Conferência dos agentes — 15/10/2026

Base: a conversa com o outro agente que você colou (noite de 14/10), os relatórios citados nela, a passagem de turno que ele deixou (`_ferramentas/passagem-turno-para-claude-20261015.md`, lida por inteiro) e o Portal V3 que eu já tinha testado.

**Atualização de 15/10, tarde:** o link com o seu computador voltou e eu li os arquivos do PC (a página nova do cliente, a config, os backups, o `.htaccess`). O outro agente **não enviou nada ao servidor** (conferido na tela do FileZilla dele). Tudo o que subiu hoje à tarde fui eu, com o seu OK: ver "Situação em 15/10, 16h" mais abaixo.

## Resumo
1. O outro agente fez um rascunho de backend do portal (`PortalV2.gs`), trocou o painel de gestão para falar por POST, reescreveu a página do cliente com visual de aplicativo e deixou relatórios (portal e SEO).
2. O visual novo do cliente vale aproveitar. O `PortalV2.gs` não funcionaria no Apps Script e foi substituído pelo V3.
3. A mudança no `painel-gestao-admin.html` não deve subir: depende de um roteador ao vivo que ninguém conferiu.
4. As rotinas diárias de guias (criminal e cível) estão pausadas pelo sistema porque o computador estava ausente; a criminal ainda falhou em 13/10 por limite de uso. Não há sinal de que tenham mexido no site depois do pacote de 12/10.
5. Para o "painel pede senha e não sei": a Central de Comandos nova entra pela sua conta Google, sem senha. A senha do painel antigo existe só como hash dentro do Google e não dá para recuperar.
6. Sua ideia de instalar tudo num **script novo, com planilha nova e pasta nova no Drive** foi adotada: é o caminho recomendado (`INSTALAR_PROJETO_NOVO.md`). O "Advogado Live" não é tocado, a volta atrás é trivial e o Drive nasce organizado (pasta por caso, arquivo morto, cópia semanal da planilha), sem apagar nada. O custo é uma URL a mais e um ajuste de uma linha na página do cliente (já pronto em `site-modo-novo/`). O guia antigo continua valendo como modo B.

## Veredito por item
| Item | O que o agente fez | Veredito |
|---|---|---|
| `_ferramentas/portal-v2-rascunho/PortalV2.gs` | Rascunho do backend do portal (login, painel, pedido, upload) | **Descartar.** Substituído por `32_Portal_Cliente_V3.gs`. Não colar no Apps Script |
| `painel-gestao-admin.html` | Login, listar, buscar e sair passaram de GET para POST; erros como texto; URL lida do `ls-api-config.js`; sem backup | **Não subir.** Voltar ao original (cópia de 12/10 em `_restaurar/`) |
| `js/ls-api-config.js` | Incluiu `apiUrlAdmin` (mesmo endereço) | Inofensivo (conferido no arquivo). Ficou junto com a linha `apiUrlPortal`: versão de 15/10 no ar, 1.606 bytes |
| `portal/painel-cliente.html` (novo, cerca de 1.940 linhas, 60.008 bytes) | Menu lateral, 5 telas, claro/escuro, biblioteca de documentos, modo `#demo` | **Visual aproveitado e ajustado ao V3** (feito em 15/10, lista abaixo). A versão original de 14/10 NÃO sobe: fica guardada em `_ferramentas/backups/arvore-pc-antes-sincronia-20261015/` |
| `portal/_temp-antigo.html` | Sobra de um "renomear" feito para gravar a página nova (é a página antiga, 40.265 bytes, idêntica à que estava no ar até hoje) | Ainda no PC, **fora do servidor**. Mover para `_ferramentas/` quando puder (sem apagar) |
| `_ferramentas/portal-v2-rascunho/backup-painel-cliente-20261014.html` | Cópia da página antiga | Manter |
| `_ferramentas/orientacoes-*.md`, `relatorio-*.md`, `contrato-api-paineis.md` | Orientações e relatórios | Úteis como contexto; 5 pontos errados ou arriscados (abaixo) |
| OmniRoute e SEO (fim da noite) | Só leitura: confirmou o OmniRoute no ar (HTTP 200) e inventariou os scripts de SEO. Nenhum código alterado | OK |

## Por que descartar o PortalV2.gs
- `Utilities.getRandomBytes` não existe no Apps Script: login, protocolo de pedido e criação de usuário dariam erro.
- `PBKDF2_WITH_HMAC_SHA_1` também não existe (o Apps Script só calcula MD5, SHA-1, SHA-256, SHA-384 e SHA-512).
- A conferência de tipo de arquivo compara bytes sem tratar o sinal (o Apps Script devolve bytes negativos): todo JPG e PNG seria recusado.
- O controle de pedido repetido guarda o hash para sempre: a mesma mensagem nunca poderia ser enviada de novo.
- Texto do cliente entra na planilha sem neutralizar `=`, `+`, `-`, `@` (injeção de fórmula).
- As datas do processo e dos andamentos são lidas com `String()`: célula de data apareceria para o cliente como o texto longo do JavaScript ("Thu Oct 02 2026 …"). O tipo da diligência é lido de uma 7ª coluna que a aba não tem. Não existe `portal_docs`. O usuário é criado por função no editor com a senha digitada no código.

## Painel de gestão antigo
O original manda senha e token na URL (GET), o que é uma fraqueza real. A correção do agente vai na direção certa, mas só funciona se o `doPost` ao vivo reconhecer `loginAdmin`, `listarProcessosAdmin`, `buscarProcessoAdmin` e `logoutAdmin`. Esse roteador não está na sua pasta (o `25_Painel_Admin.gs` só existe no editor do Google) e ninguém o conferiu. Se ele não reconhecer essas ações, a senha digitada pode ser tratada como um envio de formulário comum e até ser gravada na planilha; como eu não vi o roteador, não dá para afirmar nem descartar. Por isso: não subir, voltar ao original e tratar a Central nova como o painel do advogado. Não rode o trecho de "redefinir senha do painel" sugerido na conversa (o próprio agente marcou como não conferido). A cópia em `_restaurar/` é a versão de 12/10 (sha256 `31757c5c…2880b`), igual, no texto, ao original que o agente mostrou antes de editar.

## Página nova do cliente: ajustes para ligar no V3 (FEITOS em 15/10)
Resultado: `portal/painel-cliente.html` com 77.351 bytes, no ar desde 15/10 (tarde). 27 de 27 passos no navegador contra o simulador do V3, em dois modos; prints em `subida-portal-app-20261015/prints/`. Contrato fechado em `contrato-portal-v3-20261015.md`. A lista abaixo é o que foi pedido e já foi atendido.
1. **Baixar arquivo.** O contrato do agente usa `portal_doc_link` (link temporário do Drive). O V3 não gera link público: usa `portal_doc_baixar`, que devolve o arquivo no corpo da resposta (a página monta o arquivo e baixa).
2. **Enviar arquivo.** O V3 aceita base64 puro e também `data:…;base64,…` (ajuste feito hoje e testado).
3. **Biblioteca (`portal_docs`).** O formato do V3 já bate com o do agente: `pastas[{id, nome, arquivos[{id, nome, tamanho, atualizadoEm, tipo}]}]`, com `tamanho` já em texto ("220 KB").
4. **Campos para conferir no arquivo:** `cliente.email`; `titulo` e `evento` nas movimentações (o V3 manda as duas chaves); o card "Prazo" (o V3 não manda prazo fatal: derivar da próxima diligência ou tirar o card).
5. **Nome na tela.** "Semim & Associados" no título: padronizar para "Lucas Semim Advocacia Criminal", que é o nome do site. Se existe sociedade registrada na OAB com outro nome, me diga.
6. O arquivo foi escrito em partes, com erros de digitação corrigidos por busca (por exemplo um `all-min.css` no lugar de `all.min.css`). Validar o HTML, rodar teste ponta a ponta contra o simulador do V3, tirar prints (desktop e celular) e só então você aprova o visual. Antes disso, nada de dados reais.

Para ver o visual novo agora, sem servidor: abra `portal\painel-cliente.html` no navegador, acrescente `#demo` ao endereço, entre com qualquer e-mail e senha (dados fictícios, nenhuma chamada de rede).

## Pontos errados ou arriscados nas orientações do outro agente
1. **Links temporários públicos do Drive** (`portal_doc_link` + aba `PORTAL_LINKS_TEMP` revogada por gatilho a cada 5 minutos): documento de processo criminal ficaria acessível a "qualquer pessoa com o link" durante esse intervalo. O V3 entrega sem link público.
2. **Redefinir `ADMIN_PANEL_HASH` com SHA-256 simples:** formato chutado; o real está no `25_Painel_Admin.gs`. Não rodar.
3. **"Regenerar o sitemap ao fim de cada publicação" e "criar o `llms.txt`":** já existem. O `agente_publicador.py` já acrescenta a URL no `sitemap.xml` e, com o FTP configurado, sobe os dois arquivos; o `llms.txt` está na raiz desde o Lote E. Falta só `lastmod` real e conferir o `sitemap-noticias.xml`.
4. **Criar usuário pelo editor com a senha escrita no código:** a senha fica no histórico do editor. O V3 gera a senha, mostra uma vez e não guarda em claro.
5. **2FA por e-mail para o painel de senha:** desnecessário na Central, que usa a sua conta Google (com a verificação em duas etapas dela).

## O que o V3 já entrega (testado em simulador e, desde 15/10, no Google real)
- API do portal (`portal_login`, `portal_painel`, `portal_pedido`, `portal_upload`, `portal_docs`, `portal_doc_baixar`, `portal_logout`) e a Central de Comandos do Dr. Lucas Semim (casos, andamentos, diligências, documentos ligados à pasta do cliente no Drive, acessos, pedidos, registro), mais usuário de teste.
- Testes: 81 do backend, 85 defeitos plantados de propósito (todos detectados) e, no navegador, 21 passos da Central no modo antigo e 14 no modo projeto novo (desktop e celular, sem erro de console).
- **Google real, 15/10/2026:** `portal3Instalar`, `portal3Testes` e `portal3Diagnostico` rodaram no projeto novo e passaram ("Todos os testes do Portal V3 passaram e os dados temporários foram apagados"). As duas implantações foram publicadas; a API pública respondeu `{"ok":true,"servico":"portal-cliente"}` sem login, recusou login falso e ação desconhecida, e as cinco telas da Central (Hoje, Casos, Pedidos, Acessos, Registro) abriram com a conta do advogado.
- **O teste real achou um defeito que o simulador não pegava:** no Google de verdade, um texto que começa com `=` vira fórmula mesmo em célula formatada como texto, e um apóstrofo inicial é consumido. Corrigido com `pc3Esc_` (grava um apóstrofo na frente de texto que começa com `=`, `+`, `-`, `@`, `'`, tab ou CR). O simulador passou a reproduzir o comportamento, o autoteste confere dez textos difíceis e há 4 defeitos plantados novos. Arquivo corrigido: `32_Portal_Cliente_V3.gs`, sha256 `ee802175…713f0`.
- A página do cliente **no ar desde 15/10 (tarde)** é a versão "aplicativo" (visual do redesign de 14/10 ajustado ao V3, com biblioteca de documentos): 27 de 27 passos no navegador contra o simulador do V3, em dois modos (`_testes/test/e2e_cliente_app.js`). A página simples de 12/10 (17 de 17 passos) e a cópia `site-modo-novo/portal/painel-cliente.html` ficam só como reserva: sobe UMA ou OUTRA, nunca as duas.
- Organização automática do Drive (projeto novo): pasta por caso com 8 subpastas, arquivo morto ao encerrar, rotina diária, cópia semanal da planilha, "Organizar arquivos soltos" com prévia, "Adotar pasta" e travas contra ligar a pasta errada. Nada é apagado.
- Como instalar: `INSTALAR_PROJETO_NOVO.md` (recomendado, uns 15 minutos) ou `INSTALAR_PORTAL_V3.md` (modo B, dentro do projeto antigo).

## Situação em 15/10, 16h (o que mudou desde o meio-dia)
**Feito:**
1. Página nova do cliente ajustada ao V3 e testada (27/27, dois modos). Contrato único: `contrato-portal-v3-20261015.md`.
2. Backups tirados do servidor ANTES de mexer (hash conferido): `_ferramentas/backups/servidor-antes-portal-app-20261015/` (config de 930 bytes e página antiga de 40.265 bytes). O backup que o outro agente deixou em `servidor-antes-portal-novo-20261015/` tem o `ls-api-config.js` **vazio (0 byte)**: não use.
3. No servidor: `js/ls-api-config.js` (1.606 bytes) e `portal/painel-cliente.html` (77.351 bytes) enviados e **conferidos byte a byte** (SHA-256 igual ao do pacote).
4. Pasta do site no PC alinhada com o que está no ar (a página de 14/10 foi guardada em `backups/arvore-pc-antes-sincronia-20261015/`).
5. **16h25 — `.htaccess` (grupo 5, o último do pacote de 12/10) no servidor**, com o seu OK ("mande o restante dos arquivos"): antes, baixei o do ar (17.226 bytes, SHA-256 `dc60746b…fe87`, igual ao backup de hoje cedo, ou seja, ninguém mexeu nele desde 08/10) para `backups/servidor-antes-portal-app-20261015/`; subi o novo (17.525 bytes, SHA-256 `55ce9656…bbe02`) e baixei de volta: **byte a byte igual**. A diferença é só uma regra (301 de `…/subpasta/politica-privacidade.html` para `/politica-privacidade.html`); antes eu comparei o `.htaccess` antigo e o novo num Apache local de teste com 4 endereços diferentes e só os esperados mudaram. Com isso os 109 arquivos do pacote estão no servidor.

**Falta:**
1. **Você, agora:** abrir o site **no celular com 4G** (home, `/o-que-fazer-agora/`, uma página que não existe) e me dizer se carrega. Se aparecer "Erro 500", reenviar `backups/servidor-antes-portal-app-20261015/.htaccess` (17.226 bytes; 1 minuto). Eu não consigo conferir daqui: a Locaweb mostra a verificação de segurança para o IP 186.232.95.221.
2. **Você:** Central → Acessos → **Acesso de teste** (o e-mail e a senha aparecem uma vez só) e entrar sozinho na página do cliente. Eu nunca digito nem guardo essa senha.
3. (Ainda aberto, só se quiser) resolver a verificação de segurança da Locaweb para o seu IP, para eu conferir o site completo daqui.
4. Teste no celular (Safari ou Chrome): entrar, trocar de tela, baixar um documento, enviar um pedido. Safari/iPhone e Firefox não foram testados por mim.
5. Depois de validado: mover `portal/_temp-antigo.html`, restaurar o `painel-gestao-admin.html` original (com o seu OK), Search Console (`sitemap.xml` e `sitemap-urgencia.xml`), trocar o `PC3_PEPPER` **antes** do primeiro cliente real.

## Ainda não conferido
- **Site no ar:** conferência pública (home, `/advogado-criminalista/`, `/o-que-fazer-agora/`, 404, sitemaps, site cível, `#demo` do portal) pendente da verificação de segurança da Locaweb. A conferência byte a byte dos 2 arquivos de hoje foi feita pelo FTP, sem depender do site.
- **PC × servidor, pasta por pasta (feito às 16h35 no FileZilla, comparando tamanho de arquivo, não SHA-256):** idênticos em `advogado-criminalista`, `css`, `js`, `news`, `defesa-criminal`, `legal-tech`, `presidios`, `codelei`, `clientes` e nos arquivos principais da raiz (`index.html`, `404.html`, `sw.js`, `sitemap.xml`, `.htaccess` etc.). Diferenças que sobraram, **nenhuma enviada por mim**:
  - *Conteúdo novo só no PC (criado hoje às 11h34–11h35, provavelmente pela rotina diária de conteúdo), não está no ar:* guia `o-que-fazer-agora/acordo-nao-persecucao-penal-o-que-fazer.html` (ANPP, 53.492 bytes), `o-que-fazer-agora/index.html` (hub com o link novo, 43.837 × 43.110 bytes) e `sitemap-urgencia.xml` (9.858 × 9.556 bytes, +1 URL). Os três só fazem sentido juntos. Conferi só o básico do guia (título, descrição, canonical, WhatsApp (31) 98942-0094, aviso da OAB, nenhuma promessa de resultado); o mérito jurídico ninguém revisou, e esperam o OK do Dr. Lucas.
  - *Site cível:* `civel/guia-devedor-sumiu-busca-de-bens.html`, `civel/guia-holding-familiar-vale-a-pena.html`, e `civel/sitemap.xml` / `civel/robots.txt` mais novos no PC (9.235 × 8.554 e 862 × 836 bytes). Também aguardam revisão.
  - `painel-gestao-admin.html` (PC: 18.864 bytes do outro agente, 14/10; servidor: 16.544 bytes de 12/09): de propósito, **não** sobe sem o seu OK.
  - Diferenças antigas e pequenas, provavelmente só quebra de linha: `politica-de-privacidade.html` (4.986 × 4.909), `api/.claude-config.php` e `api/.htaccess`; `sitemap-news.xml` (26.027 × 24.719, o do servidor é de maio) e `video/escritorioonline.mp4` (versões diferentes do vídeo). Não mexi.
  - Só no servidor (o PC não tem): `portal/cadastro-cliente.html`, `portal/painel-cliente.BACKUP-20261003.html`, `portal/template-cliente.html` (páginas antigas, com `noindex`, que trazem um número de WhatsApp diferente do atual, (31) 98394-4973, e não chamam nenhum script; vale o Dr. Lucas decidir se tira do ar); e muitos arquivos em `img/` (199 no servidor × 37 no PC, 615 MB × 107 MB) e `dados/` (35 PDFs no servidor, 2 no PC). O PC **não** é uma cópia completa do servidor: não use "sincronizar" nem "apagar o que não existe no PC".
  - Só no PC e que nunca devem subir: `_ferramentas/`, `agentes/`, `apps-script/`, `.vscode/`, `templates/`, `CLAUDE.md`, `CLAUDE_HANDOVER.md`, `portal/_temp-antigo.html`, `civel/Claude outputs/`, `civel/Advogado Live.json`.
- Não lidos por mim: `relatorio-alteracoes*`, `orientacoes-paineis*`, `orientacoes-seo-omniroute*`, pastas `agentes/` e `inventario-abas/`, e a saída da rotina cível de 13/10.
- O visual no Safari/iPhone e no Firefox (só Chromium testado).
