> **ATENÇÃO (15/10/2026, Claude): para o PORTAL DO CLIENTE (`portal_*`) este arquivo está SUPERADO.**
> A fonte de verdade agora é `contrato-portal-v3-20261015.md` (mesma pasta): é o que o backend instalado no Google (`32_Portal_Cliente_V3.gs`) devolve e o que a página no ar (`portal/painel-cliente.html`, 77.351 bytes) consome.
> Não vale mais aqui, para o portal do cliente: `PortalV2.gs` (descartado), resumo em objeto, `notificacoes[]`, `portal_doc_link`, tipos curtos de pedido, datas ISO, PORTAL_SESSOES. Vale o V3.
> As seções do **Painel de Gestão (`loginAdmin`…)** e da Central do Caso (`cc_*`) não foram alteradas por esta nota.
> Texto original de 14/10 mantido abaixo, sem mudanças.

---

# Contrato de API dos Painéis — lucassemim.adv.br
**Última atualização: 14/10/2026 · Fonte de verdade para front e backend. Qualquer mudança em rota/campo DEVE ser refletida aqui primeiro.**

## Rotas
| Frontend | Ações | Backend atual |
|---|---|---|
| `portal/painel-cliente.html` (cliente) | `portal_login`, `portal_painel`, `portal_logout`, `portal_pedido`, `portal_upload` | Módulo `PortalV2.gs` (rascunho em `_ferramentas/portal-v2-rascunho/`), a colar no `doPost` central do projeto "Api site" |
| `painel-gestao-admin.html` (Dr. Lucas) | `loginAdmin`, `logoutAdmin`, `listarProcessosAdmin`, `buscarProcessoAdmin`, `salvarProcessoAdmin` | `25_Painel_Admin.gs` |
| `diagnostico.html` / Central do Caso | `cc_*` (triagem) | `23_API_Central_Caso.gs` (não alterado por este contrato) |

`apiUrl` e `apiUrlAdmin` vêm de `js/ls-api-config.js` (`window.LS_CONFIG`). Nada hardcoded nos HTMLs.

## Regras gerais
1. **Tudo é POST com corpo JSON.** NUNCA senha/token em parâmetro de URL (vazam em histórico, log do servidor e Referer).
2. **Resposta sempre JSON**, mesmo em erro interno: `{ sucesso:false, mensagem }`.
3. **Falha de sessão** (token ausente/inválido/expirado/revogado/inativo) devolve SEMPRE:
   `{ sucesso:false, expirou:true, mensagem:"Sessão expirada. Entre novamente." }`
   O front testa `expirou` (nunca regex na mensagem) para forçar re-login.
4. **Mensagens de login idênticas** para e-mail inexistente e senha errada.
5. **Nunca** devolver token, senha ou hash em logs, auditoria ou mensagens de erro.

## Ações do Portal do Cliente (PortalV2)
### `portal_login`
- Envia: `{ acao, email, senha }`
- Devolve OK: `{ sucesso:true, token, nome, expira }` — `token` = 32 bytes aleatórios base64url (~43 chars); `nome` = coluna NOME de `PORTAL_USUARIOS` (nunca o e-mail); `expira` = ISO.
- No servidor: PBKDF2 ≥100k iterações + salt 16 B; limite de tentativas (5/15 min) por e-mail via CacheService; **aba PORTAL_SESSOES grava apenas o HASH SHA-256 do token** (coluna `TOKEN_HASH`).
- Erro: `{ sucesso:false, mensagem:"E-mail ou senha incorretos." }` ou bloqueio "Muitas tentativas."

### `portal_painel`
- Envia: `{ acao, token }` (o front atual **não** envia `idCaso`)
- Backend resolve o caso: se o cliente tem exatamente 1 vínculo, usa-o; com 2+ casos sem `idCaso`, devolve erro pedindo caso explícito (transição até o front enviar `idCaso`).
- Devolve OK (formato que o front consome — VERIFICAR NOME DOS CAMPOS ANTES DE ALTERAR):
```json
{
  "sucesso": true, "nome": "Maria Aparecida", "casos": [{"id":"CASO-1","papel":"cliente"}],
  "cliente": {"nome":"Maria Aparecida"},
  "processo": {"numero":"0000000-00.2026.8.13.0000","classe":"","juizo":"","fase":"","atualizadoEm":""},
  "resumo": "texto em linguagem simples", "proximoPasso": "texto",
  "movimentacoes": [{"data":"","evento":""}],
  "diligencias": [{"data":"","tipo":"Visita ao presídio","texto":"","status":"Feito"}],
  "documentos": {"contrato":true,"procuracao":false,"declaracao":false,"enviados":[{"nome":"","data":""}]},
  "pedidos": [{"protocolo":"LS-...","tipo":"","mensagem":"","status":"NOVO","data":"dd/MM/yyyy HH:mm","resposta":""}]
}
```
- Fontes no servidor: `PORTAL_CASOS` (ID_CASO, EMAIL_CLIENTE, NUMERO, CLASSE, JUIZO, FASE, ATUALIZADO_EM, RESUMO, PROXIMO_PASSO), `PORTAL_EVENTOS` (ID_CASO, TIPO movimentacao|diligencia, DATA, EVENTO, TEXTO, STATUS, ROTULO), `PORTAL_DOCS` (ID_CASO, CONTRATO, PROCURACAO, DECLARACAO, ENVIADOS "nome|data,nome|data"), `PORTAL_PEDIDOS`. Abas ausentes → campos vazios, nunca erro.

### `portal_logout`
- Envia: `{ acao, token }` → Devolve: `{ sucesso:true }`. Marca `REVOGADO=SIM` na sessão (por hash do token).

### `portal_pedido`
- Envia: `{ acao, token, tipo, mensagem }` — **`mensagem` é o campo oficial**; backend aceita `descricao` como alias legado (remover alias quando o contrato estiver estável).
- `idCaso` opcional (mesma regra do `portal_painel`).
- Devolve OK: `{ sucesso:true, protocolo:"LS-yyyymmdd-hhmmss-xxxx" }`; repetição idêntica devolve o MESMO protocolo com `duplicado:true`.
- Limites: tipo ≤ 80 chars, mensagem ≤ 2000 chars. Escritas sob `LockService.getScriptLock()`.

### `portal_upload`
- Envia: `{ acao, token, nome, mimeType, data }` — **`data` é o campo oficial do base64** (alias `base64` aceito, transitoriamente). `idCaso` opcional.
- Validade no servidor: sessão → vínculo → extensão (pdf/jpg/png) → **magic number** (%PDF / FFD8FF / 89504E47) → tamanho ≤ **6 MB** (front e backend iguais).
- Devolve OK: `{ sucesso:true, arquivoId }`. Erros comuns: "Tipo não aceito. Use PDF, JPG ou PNG." / "Arquivo maior que 6 MB." / "Conteúdo do arquivo não corresponde ao tipo informado."
- Destino: pasta privada por caso em Drive (`PORTAL_PASTA_RAIZ` em Script Properties). Auditoria grava apenas hash, ator e resultado — nunca conteúdo.

## Ações do Painel de Gestão (Dr. Lucas)
### `loginAdmin`
- Envia: `{ acao:"loginAdmin", senha }` (POST, no corpo).
- Devolve OK: `{ sucesso:true, token, nome }`. Erro: `{ sucesso:false, mensagem:"Senha incorreta." }`
- Pendente no backend (`25_Painel_Admin.gs`): migrar de GET para POST, token de 32 bytes, limite de tentativas, devolver `expirou:true` em sessão inválida.

### `logoutAdmin` (ação nova)
- Envia: `{ acao:"logoutAdmin", token }` → revoga a sessão no servidor. Devolve `{ sucesso:true }` (o front chama como melhor esforço).

### `listarProcessosAdmin`
- Envia: `{ acao, token }` (POST) → Devolve: `{ sucesso:true, processos:[{linha, nome, email, classe, cnj, prazo, parteContraria, proximaAcao, juizo, fase, valor}] }`

### `buscarProcessoAdmin`
- Envia: `{ acao, token, linha }` → Devolve: `{ sucesso:true, processo:{...mesmos campos + linha} }`

### `salvarProcessoAdmin`
- Envia: `{ acao, token, linha|null, dados:{nome, email, classe, cnj, prazo, parteContraria, proximaAcao, juizo, fase, valor} }`
- Devolve: `{ sucesso:true }` ou erro. `linha` null = novo cliente.

## Fluxos administrativos do PortalV2 (sem rota pública no site)
- `portalV2_criar_usuario_(email, senha, nome)` — cria acesso do cliente (grava coluna NOME).
- `portalV2_revogar_todas_sessoes_(email)` — revoga todas as sessões ativas (OWASP: obrigatório após troca de senha ou suspensão de acesso).
- Abas do portal: `PORTAL_USUARIOS` (EMAIL, HASH_SENHA, CRIADO_EM, ATIVO, NOME), `PORTAL_VINCULOS`, `PORTAL_SESSOES` (TOKEN_HASH...), `PORTAL_PEDIDOS`, `PORTAL_AUDITORIA`, `PORTAL_CASOS`, `PORTAL_EVENTOS`, `PORTAL_DOCS`.

## Testes mínimos (rodar com dados fictícios antes de ligar o front)
1. `portalV2_testarLogin()` — login errado/correto + sessão.
2. `portalV2_testarPedido()` — idempotência (mesmo protocolo).
3. `portalV2_testarUpload()` — PDF ok; PNG disfarçado de .pdf negado.
4. `portalV2_testarIdor()` — **cliente B tenta pedido/upload no caso do cliente A → negado** (teste mais importante).
5. `portalV2_testarPainel()` — resposta do `portal_painel` com todos os blocos que o front consome.

## Ações de Drive no Portal do Cliente (adicionadas 14/10/2026, 2ª edição)
Implementadas no front (redesign) e NO RASCUNHO ainda não no backend. O Claude Code deve criar no `PortalV2.gs`:

### `portal_docs` (nova)
- Envia: `{ acao:'portal_docs', token }`
- Devolve OK: `{ sucesso:true, total, pastas:[{ id, nome, arquivos:[{ id, nome, tamanho, atualizadoEm }] }] }`
- Regras: token → sessão → vínculo → idCaso (único) → pasta do caso no Drive → listar SOMENTE as subpastas do padrão (`01_Contratos` … `08_Administrativo`). Nunca devolver IDs de pasta raiz/administrativa. `tamanho` humanizado (ex.: "220 KB").

### `portal_doc_link` (nova)
- Envia: `{ acao:'portal_doc_link', token, fileId }`
- Devolve: `{ sucesso:true, url }` (URL de visualização temporária; ver regras de expiração em `PORTAL_LINKS_TEMP`, orientação 3.2 do redesign). Antes de devolver, conferir que o arquivo está dentro da pasta do caso do cliente (IDOR).

### `portal_upload` (ajustes no backend)
- Front V2 envia: `{ acao:'portal_upload', token, nome, data }` (data = dataURL completo, não só base64 puro — **backend deve dar strip do prefixo `data:mime;base64,`**).
- Múltiplos arquivos: o front envia um POST por arquivo (fila no front). Servidor valida cada um (6 MB, magic number, pasta fixa `06_Enviados_pelo_cliente`).

### Formato de resposta esperado pelo front V2 em `portal_painel`
O front V2 consome este formato (mais rico que o V1):
```json
{
  "sucesso": true,
  "cliente": { "nome": "...", "email": "..." },
  "processo": { "numero": "", "classe": "", "juizo": "", "fase": "inicial|instrução|sentença|recurso", "parteContraria": "", "valor": "", "atualizadoEm": "" },
  "resumo": { "proximoPrazo": { "data": "dd/MM/yyyy", "descricao": "" }, "pendencias": 0 },
  "movimentacoes": [ { "data": "", "titulo": "", "texto": "" } ],
  "diligencias": [],
  "documentos": { "contrato": true, "procuracao": true, "declaracao": false, "enviados": 0 },
  "pedidos": [ { "protocolo": "", "tipo": "duvida|documento|audiencia|visita|outro", "mensagem": "", "status": "", "data": "", "resposta": "" } ],
  "notificacoes": [ { "data": "", "texto": "", "lida": false } ]
}
```
- `fase` é casada case-insensitive contra ["inicial","instrução","sentença","recurso"] para a barra de progresso.
- O rascunho atual do `PortalV2.gs` devolve `resumo` como string e `pedidos[].mensagem` — **o Claude deve ajustar o backend para este formato** (ou o front para o do rascunho; escolher UM e registrar aqui).

## Divergências front V2 × rascunho backend (para o Claude resolver)
1. `resumo`: front espera objeto `{proximoPrazo, pendencias}`; rascunho devolve string. Decidir formato único.
2. `movimentacoes[].titulo/texto`: front usa `titulo`+`texto`; rascunho usa `evento`. Padronizar.
3. `pedidos[].tipo`: front V2 usa valores curtos (`duvida`, `documento`…); V1 usava rótulos longos. O backend deve mapear rótulo→valor ou o front deve mostrar o valor vindo do servidor.
4. `notificacoes`: campo novo, inexistente no rascunho — derivar no backend (novas movimentações + pedidos respondidos) ou deixar o front derivar (hoje o demo fornece pronto; sem campo o front mostra vazio, sem erro).
