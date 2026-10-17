
## Estudo noturno — fontes externas consultadas (13/10/2026, madrugada)
Pesquisa em fontes oficiais e listas de verificação de segurança para embasar a implementação do backend do portal. Nada destes achados altera o projeto; entram como recomendações para o Claude Code.

### 1. Limites de plataforma do Apps Script (fonte: [documentação oficial de quotas](https://developers.google.com/apps-script/guides/services/quotas))
- Cada execução tem **6 minutos** de limite; **1.000 execuções simultâneas** por script e 30 por usuário. **Upload base64:** o front já limita a 24 MB de total em base64 — converter e escrever no Drive dentro do tempo é viável, mas um pedido grande + conversão + Drive pode chegar perto do teto. Recomendação: enviar **um arquivo por requisição** (o front já faz isso no `portal_upload`) e limitar cada arquivo a 8 MB no servidor também.
- **Properties value size: 9 KB por valor, 500 KB no total.** Não guardar sessões ou pedidos em `PropertiesService`; usar a planilha ou `CacheService` (cache é volátil — nunca para revogação de sessão).
- **Propriedades não são seguras por padrão?** Elas são privadas do script, mas qualquer pessoa com acesso ao editor as lê. Manter chaves de API lá, nunca senha de cliente (senha nem existe em Properties — só hash em aba).
- **Erro clássico de implantação:** "Script function not found: doGet/doPost" com HTTP 200 e página HTML de erro ([issue conhecido](https://issuetracker.google.com/issues/532577548)). Consequência prática: o front pode receber `r.json()` com exceção confusa. Recomendação: o backend **sempre** responder JSON, mesmo em erro; e ter `doGet` também definido (mesmo que só para diagnóstico), para não cair nesse bug.

### 2. Concorrência e integridade (fonte: [LockService oficial](https://developers.google.com/apps-script/reference/lock) e benchmarks de escrita concorrente)
- `appendRow` concorrente pode **perder linhas**; usar `LockService.getDocumentLock()` com `tryLock(30000)` envolvendo toda escrita crítica (criar pedido, gravar sessão, validar token único).
- **Não usar lock em leitura** (só em escrita) e nunca dentro de laço longo — bloqueia outras execuções.
- **Idempotência de pedidos:** hash do corpo + LockService: se o hash já existe na aba, devolver o protocolo original em vez de criar linha duplicada.

### 3. Hash de senha no Apps Script (fonte: [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html))
- OWASP recomenda Argon2id/bcrypt/PBKDF2; **SHA-256 puro é inadequado** (rápido demais, permite ataque de força bruta massivo). Apps Script não tem bcrypt nativo, mas tem `Utilities.computeDigest` com `PBKDF2_WITH_HMAC_SHA_1` — **usar PBKDF2 com ≥ 100.000 iterações** e salt único de 16 bytes por usuário (gerado com `Utilities.getRandomBytes(16)`).
- **Formato na aba:** `pbkdf2$iteracoes$salt_hex$hash_hex` (padrão Django — facilita migrar o parâmetro de iterações no futuro).
- **Nunca truncar senha em silêncio** e aceitar todos os caracteres; não impor regra de troca periódica (orientação NIST/OWASP).
- **Referência de projeto similar** (comunitário, ler com cautela e conferir): [login form em Apps Script com hash+salt](https://github.com/cedroid/google-appscript-login-form) — confirma que o padrão é viável, mas usa SHA-256 simples; nosso projeto deve usar PBKDF2.

### 4. Sessões (fonte: [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html))
- Token com **entropia ≥ 128 bits** (16 bytes aleatórios). Em Apps Script: `Utilities.base64Encode(Utilities.getRandomBytes(32))` → ~43 caracteres.
- **Expiração absoluta e por inatividade**; renovação (sliding) ok, mas com teto absoluto.
- **Após troca de senha, revogar todas as sessões ativas** (OWASP explicitamente recomenda).
- **Acesso cruzado por ID manipulado é falha conhecida** (CWE-639/IDOR): conferir sempre, a cada requisição, se o recurso pertence ao usuário autenticado (fonte: [OWASP Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)).

### 5. Upload (fonte: [OWASP File Upload](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html))
- Validar **autenticação e autorização** antes de qualquer acesso ao serviço de upload (não só no download).
- **Validar por conteúdo**, não só por extensão: ler os primeiros bytes do base64 (magic number de PDF/JPG/PNG) e conferir extensão+magic juntos.
- **Menor privilégio no filesystem:** cada pasta de caso com acesso restrito; nunca pasta compartilhada por link público. Registrar quem enviou, quando e hash do conteúdo em aba de auditoria.
- **Limites de tamanho e contagem** no servidor também (front limita, mas servidor revalida).

### 6. Ajustes nas orientações anteriores (resultantes deste estudo)
- A seção 2 item 1 do documento anterior já orienta roteamento por `acao` em um `doPost` central. **Acrescentar:** definir também um `doGet` que responda JSON de status (mesmo que só "acao não suportada via GET"), para evitar o bug de implantação acima.
- A orientação de sessão "8–12 h" está ok, mas acrescentar **expiração por inatividade separada** (ex.: 30 min sem uso → re-login).
- Não usar `CacheService` para revogação de sessão (volátil). Sessões em aba; cache só para bloqueio de tentativas por IP.

### 7. Lista de fontes (todas acessadas nesta madrugada)
- [Quotas oficiais Apps Script](https://developers.google.com/apps-script/guides/services/quotas)
- [LockService oficial](https://developers.google.com/apps-script/reference/lock)
- [OWASP Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html) (consultada via busca)
- [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [OWASP File Upload](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- [Projeto comunitário de login Apps Script (leitura crítica)](https://github.com/cedroid/google-appscript-login-form)
- [Issue Google de "Script function not found"](https://issuetracker.google.com/issues/532577548)

**Não acessou nem baixou dados da planilha, clientes ou site.** Toda a leitura foi em documentação pública e listas de boas práticas. Nenhuma ferramenta instalada, nenhum arquivo modificado fora deste relatório.

## Avanço da madrugada — rascunho do backend pronto para revisão
- **Novo arquivo:** `_ferramentas/portal-v2-rascunho/PortalV2.gs` (rascunho de estudo, ~390 linhas). Implementa as 5 ações que o front já envia (`portal_login`, `portal_painel`, `portal_logout`, `portal_pedido`, `portal_upload`) aplicando integralmente os achados do estudo: PBKDF2 100.000 iterações + salt de 16 bytes, token de 32 bytes, validade 12 h + inatividade 30 min, revogação em logout, mensagem de erro idêntica no login, limite de tentativas por CacheService, LockService em toda escrita crítica, idempotência de pedidos por hash, upload com magic number + tamanho + pasta privada por caso, e auditoria sem conteúdo de cliente.
- **Validado localmente:** sintaxe OK; nenhuma chamada de escrita em abas de terceiros (TRIAGEM_SITE/CV_ABA/RETORNO_CIVIL aparecem só em comentário); sem `getUi()` nem `UrlFetchApp`; sem `doGet`/`doPost` próprios (o módulo é colado em um projeto existente e despachado por `portalV2_despachar`).
- **NÃO copiado para o projeto online do Apps Script.** Nada executado no Google. Antes de colar: revisar colisões de nomes (`portalV2_*`), configurar a propriedade `PORTAL_PASTA_RAIZ` no servidor, conferir o schema de colunas das abas `PORTAL_*` e rodar `portalV2_testarLogin/pedido/upload` com dados fictícios.
- **Pendência da manhã:** o front envia `portal_painel` esperando detalhes por caso (movimentações, documentos, pedidos) — o rascunho devolve apenas a lista de vínculos. O Claude completa essa parte depois que o Dr. Lucas definir o que cada papel vê (mesma decisão pendente de permissões).
