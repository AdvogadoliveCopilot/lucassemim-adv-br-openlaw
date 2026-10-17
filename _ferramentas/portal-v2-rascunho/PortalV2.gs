/**
 * PortalV2.gs — RASCUNHO DE ESTUDO (Etapa C local) — NÃO COPIAR NO PROJETO ONLINE SEM REVISÃO
 * Dr. Lucas Semim · gerado pela missão noturna 13/10/2026 conforme _ferramentas/estudo-noturno-fontes-externas-20261013.md
 *
 * PROPÓSITO
 *   Implementar, do lado servidor, as 5 ações que portal/painel-cliente.html já envia:
 *     portal_login · portal_painel · portal_logout · portal_pedido · portal_upload
 *   Ser um MÓDULO colado em um projeto Apps Script EXISTENTE (nunca criar doGet/doPost próprios aqui:
 *   o roteador central chama este módulo por prefixo portalV2_).
 *
 * SEGURANÇA IMPLEMENTADA (cada item = fonte no estudo noturno)
 *   1. Senha nunca em URL: tudo por POST com corpo JSON.
 *   2. PBKDF2 ≥ 100.000 iterações + salt 16 bytes por usuário (formato pbkdf2$iter$salt$hash).
 *   3. Token de sessão: 32 bytes aleatórios → base64 (~43 chars), validade 12 h absoluta + 30 min inatividade.
 *   4. Revogação: logout e troca de senha revogam TODAS as sessões do cliente.
 *   5. Erros de login idênticos (não revela se e-mail existe) + limite de tentativas por e-mail via CacheService.
 *   6. LockService.getScriptLock() em TODA escrita crítica (nunca em leitura).
 *   7. Idempotência de pedidos: hash do corpo; pedido repetido devolve o protocolo original.
 *   8. Upload: extensão + magic number conferidos; tamanho ≤ 8 MB; pasta por caso privada; auditoria sem conteúdo.
 *   9. IDOR: toda leitura/gravação parte do token → cliente → vínculo → recurso. Sem confiar em IDs do browser.
 *  10. Auditoria: ator, ação, recurso (hash), resultado, horário. NUNCA conteúdo de cliente, senha ou token.
 *
 * COMO TESTAR (com dados fictícios, nunca com dados reais)
 *   - Funções portalV2_testarLogin(), portalV2_testarPedido(), portalV2_testarUpload() rodam no editor.
 *   - Antes de ligar ao front, conferir: abas PORTAL_* criadas e nomes de coluna conferidos com o schema abaixo.
 *
 * ADESÃO AO AMBIENTE ONLINE (a revisar antes de colar)
 *   - Este módulo NÃO cria doGet/doPost. Integrar em 1 roteador central:
 *       case 'portal_login':   return portalV2_login(e);
 *       case 'portal_painel':  return portalV2_painel(e);
 *       case 'portal_logout':  return portalV2_logout(e);
 *       case 'portal_pedido':  return portalV2_pedido(e);
 *       case 'portal_upload':  return portalV2_upload(e);
 *   - Não mexe em TRIAGEM_SITE, CV_ABA, RETORNO_CIVEL ou abas do Escudo.
 *   - Nome de abas: PORTAL_SESSOES, PORTAL_PEDIDOS, PORTAL_AUDITORIA, PORTAL_USUARIOS, PORTAL_VINCULOS.
 */

var PV_ITERACOES = 100000;
var PV_SESSAO_H = 12;          // validade absoluta (horas)
var PV_INATIVIDADE_MIN = 30;   // expiração por inatividade
var PV_MAX_ARQUIVO = 6 * 1024 * 1024;   // alinhado ao front (portal/painel-cliente.html limita 6 MB) — orientação 1.6 de 14/10
var PV_MAX_TENTATIVAS = 5;

var PV_ABAS = {
  usuarios:  'PORTAL_USUARIOS',
  vinculos:  'PORTAL_VINCULOS',
  sessoes:   'PORTAL_SESSOES',
  pedidos:   'PORTAL_PEDIDOS',
  auditoria: 'PORTAL_AUDITORIA'
};

// =========================== ROTEADOR (chamado pelo doGet/doPost central) ===========================

function portalV2_despachar(p) {
  switch (String(p.acao || '')) {
    case 'portal_login':   return portalV2_login(p);
    case 'portal_painel':  return portalV2_painel(p);
    case 'portal_logout':  return portalV2_logout(p);
    case 'portal_pedido':  return portalV2_pedido(p);
    case 'portal_upload':  return portalV2_upload(p);
    default:               return { sucesso: false, mensagem: 'Ação não reconhecida.' };
  }
}

// Resposta de falha de sessão PADRONIZADA (orientação 1.5 de 14/10):
// o front (portal/painel-cliente.html) testa j.expirou para forçar re-login.
// TODA falha de sessão deve usar portalV2_erro_sessao_().
function portalV2_erro_sessao_(mensagem) {
  return { sucesso: false, expirou: true, mensagem: mensagem || 'Sessão expirada. Entre novamente.' };
}

// =========================== ABAS (criação idempotente) ===========================

function portalV2_aba_(nome, colunas) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(nome);
  if (!sh) {
    sh = ss.insertSheet(nome);
    sh.appendRow(colunas);
    sh.getRange(1, 1, 1, colunas.length).setFontWeight('bold');
    // proteção básica: só o dono edita
    var prot = sh.protect();
    prot.setDescription('PortalV2 · ' + nome);
    if (prot.canDomainEdit()) prot.setDomainEdit(false);
    prot.addEditor(Session.getEffectiveUser());
  }
  return sh;
}

function portalV2_lembrar_abas_() {
  portalV2_aba_(PV_ABAS.usuarios,  ['EMAIL', 'HASH_SENHA', 'CRIADO_EM', 'ATIVO', 'NOME']);
  portalV2_aba_(PV_ABAS.vinculos,  ['EMAIL_CLIENTE', 'ID_CASO', 'PAPEL', 'CRIADO_EM']);
  portalV2_aba_(PV_ABAS.sessoes,   ['TOKEN_HASH', 'EMAIL', 'CRIADO_EM', 'EXPIRA_EM', 'ULTIMO_USO', 'REVOGADO']);
  portalV2_aba_(PV_ABAS.pedidos,   ['PROTOCOLO', 'EMAIL', 'ID_CASO', 'TIPO', 'DESCRICAO', 'STATUS', 'CRIADO_EM', 'RESPOSTA', 'HASH_IDEMPOTENCIA']);
  portalV2_aba_(PV_ABAS.auditoria, ['TS', 'ATOR', 'ACAO', 'RECURSO', 'RESULTADO']);
}

// Deriva o caso único do vínculo (orientação 1.3 de 14/10, opção "a"):
// o front atual NÃO envia idCaso; quando o cliente tem exatamente 1 caso ativo,
// o backend usa esse caso. Com 0 ou 2+ casos, exige idCaso explícito.
// Migração futura: front passa a enviar idCaso (opção "b") e isto vira só fallback.
function portalV2_resolver_caso_(email, idCaso) {
  if (idCaso) return portalV2_tem_vinculo_(email, idCaso) ? idCaso : null;
  var sh = portalV2_aba_(PV_ABAS.vinculos, null);
  var dados = sh.getDataRange().getValues();
  var unico = null;
  for (var i = 1; i < dados.length; i++) {
    if (portalV2_normalizar_email_(dados[i][0]) === email) {
      if (unico !== null) return null; // 2+ casos sem idCaso → ambíguo
      unico = String(dados[i][1]);
    }
  }
  return unico;
}

// =========================== 1. LOGIN ===========================

function portalV2_login(p) {
  portalV2_lembrar_abas_();
  var email = portalV2_normalizar_email_(p.email);
  var senha = String(p.senha || '');
  if (!email || !senha) return { sucesso: false, mensagem: 'Preencha e-mail e senha.' };

  // limite de tentativas (CacheService é volátil — só para bloqueio por tempo, não para revogação)
  var chave = 'pv_tent_' + email;
  var cache = CacheService.getScriptCache();
  var tent = Number(cache.get(chave) || 0);
  if (tent >= PV_MAX_TENTATIVAS) {
    portalV2_auditar_(email, 'login', 'bloqueio_temporario', 'negado');
    return { sucesso: false, mensagem: 'Muitas tentativas. Tente novamente mais tarde.' };
  }

  var linha = portalV2_buscar_usuario_(email);
  // mensagem IDÊNTICA para e-mail inexistente e senha errada
  var msg_erro = { sucesso: false, mensagem: 'E-mail ou senha incorretos.' };
  if (!linha) {
    cache.put(chave, String(tent + 1), 900);
    portalV2_auditar_(email, 'login', 'sem_usuario', 'negado');
    return msg_erro;
  }
  var [_, hashArmazenado, , ativo] = linha;
  if (!ativo || !portalV2_verificar_senha_(senha, hashArmazenado)) {
    cache.put(chave, String(tent + 1), 900);
    portalV2_auditar_(email, 'login', 'senha_errada', 'negado');
    return msg_erro;
  }

  cache.remove(chave);
  // token: 32 bytes aleatórios
  var token = Utilities.base64Encode(Utilities.getRandomBytes(32))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  var agora = new Date();
  var expira = new Date(agora.getTime() + PV_SESSAO_H * 3600000);

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return { sucesso: false, mensagem: 'Servidor ocupado. Tente de novo.' };
  try {
    // Orientação 2.5 de 14/10: só o HASH do token vai para a aba.
    // Quem abrir a planilha não consegue se passar pelo cliente.
    portalV2_aba_(PV_ABAS.sessoes, null).appendRow([portalV2_hash_token_(token), email, agora, expira, agora, '']);
  } finally { lock.releaseLock(); }

  portalV2_auditar_(email, 'login', 'sessao', 'ok');
  // Orientação 1.7 de 14/10: nome real da pessoa (coluna NOME), nunca o e-mail
  return { sucesso: true, token: token, nome: (linha[4] || linha[0] || '').trim() || email, expira: expira.toISOString() };
}

// =========================== 2. PAINEL (leitura autorizada por vínculo) ===========================

function portalV2_painel(p) {
  portalV2_lembrar_abas_();
  var sess = portalV2_sessao_valida_(p.token, true);
  if (!sess.ok) return portalV2_erro_sessao_(sess.mensagem);
  var email = sess.email;

  var sh = portalV2_aba_(PV_ABAS.vinculos, null);
  var dados = sh.getDataRange().getValues();
  var casos = [];
  for (var i = 1; i < dados.length; i++) {
    if (portalV2_normalizar_email_(dados[i][0]) === email) {
      casos.push({ id: String(dados[i][1]), papel: String(dados[i][2] || 'cliente') });
    }
  }

  // Enriquecimento do painel (orientação 1.4 de 14/10): o front espera
  // cliente/processo/resumo/movimentacoes/diligencias/documentos/pedidos.
  // Fontes: PORTAL_CASOS (dados do processo + resumo), PORTAL_PEDIDOS.
  // Movimentações e diligências: PORTAL_EVENTOS (aba opcional; se não existir, vazio).
  var resp = { sucesso: true, casos: casos, nome: sess.nome, cliente: { nome: sess.nome } };
  if (casos.length) {
    var caso = portalV2_dados_caso_(email, casos[0].id);
    resp.processo = caso.processo;
    resp.resumo = caso.resumo;
    resp.proximoPasso = caso.proximoPasso;
    resp.movimentacoes = caso.movimentacoes;
    resp.diligencias = caso.diligencias;
    resp.documentos = caso.documentos;
    resp.pedidos = portalV2_pedidos_do_caso_(email, casos[0].id);
  }
  return resp;
}

// Dados do caso a partir de PORTAL_CASOS (criada pelo fluxo administrativo):
// colunas: ID_CASO, EMAIL_CLIENTE, NUMERO, CLASSE, JUIZO, FASE, ATUALIZADO_EM, RESUMO, PROXIMO_PASSO
function portalV2_dados_caso_(email, idCaso) {
  var vazio = { processo: {}, resumo: '', proximoPasso: '', movimentacoes: [], diligencias: [], documentos: {} };
  var sh;
  try { sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('PORTAL_CASOS'); } catch (e) { sh = null; }
  if (!sh) return vazio;
  var dados = sh.getDataRange().getValues();
  for (var i = 1; i < dados.length; i++) {
    if (String(dados[i][0]) === String(idCaso) && portalV2_normalizar_email_(dados[i][1]) === portalV2_normalizar_email_(email)) {
      return {
        processo: {
          numero: String(dados[i][2] || ''), classe: String(dados[i][3] || ''),
          juizo: String(dados[i][4] || ''), fase: String(dados[i][5] || ''),
          atualizadoEm: String(dados[i][6] || '')
        },
        resumo: String(dados[i][7] || ''),
        proximoPasso: String(dados[i][8] || ''),
        movimentacoes: portalV2_eventos_do_caso_(idCaso, 'movimentacao'),
        diligencias: portalV2_eventos_do_caso_(idCaso, 'diligencia'),
        documentos: portalV2_documentos_do_caso_(idCaso)
      };
    }
  }
  return vazio;
}

// Aba opcional PORTAL_EVENTOS: ID_CASO, TIPO ('movimentacao'|'diligencia'), DATA, EVENTO, TEXTO, STATUS
// Ausente ou sem linhas → listas vazias (o front já trata). Nunca lança erro.
function portalV2_eventos_do_caso_(idCaso, tipo) {
  var out = [];
  try {
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('PORTAL_EVENTOS');
    if (!sh) return out;
    var dados = sh.getDataRange().getValues();
    for (var i = 1; i < dados.length; i++) {
      if (String(dados[i][0]) === String(idCaso) && String(dados[i][1]) === tipo) {
        var ev = { data: String(dados[i][2] || ''), evento: String(dados[i][3] || '') };
        if (tipo === 'diligencia') {
          ev.texto = String(dados[i][4] || '');
          ev.status = String(dados[i][5] || '');
          ev.tipo = String(dados[i][6] || ''); // rótulo exibido (ex.: 'Visita ao presídio')
        }
        out.push(ev);
      }
    }
  } catch (e) { /* aba ausente → vazio */ }
  return out;
}

// Aba opcional PORTAL_DOCS: ID_CASO, CONTRATO, PROCURACAO, DECLARACAO, ENVIADOS (nome+data separados por vírgula)
function portalV2_documentos_do_caso_(idCaso) {
  var docs = { contrato: false, procuracao: false, declaracao: false, enviados: [] };
  try {
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('PORTAL_DOCS');
    if (!sh) return docs;
    var dados = sh.getDataRange().getValues();
    for (var i = 1; i < dados.length; i++) {
      if (String(dados[i][0]) === String(idCaso)) {
        docs.contrato = String(dados[i][1] || '') === 'SIM';
        docs.procuracao = String(dados[i][2] || '') === 'SIM';
        docs.declaracao = String(dados[i][3] || '') === 'SIM';
        var enviados = String(dados[i][4] || '');
        if (enviados) {
          enviados.split(',').forEach(function (par) {
            var p = par.split('|');
            if (p[0]) docs.enviados.push({ nome: p[0], data: p[1] || '' });
          });
        }
        break;
      }
    }
  } catch (e) { /* aba ausente → padrão */ }
  return docs;
}

// Pedidos do cliente no caso, mais recentes primeiro (aba PORTAL_PEDIDOS)
function portalV2_pedidos_do_caso_(email, idCaso) {
  var out = [];
  var sh = portalV2_aba_(PV_ABAS.pedidos, null);
  var dados = sh.getDataRange().getValues();
  for (var i = dados.length - 1; i >= 1; i--) {
    if (portalV2_normalizar_email_(dados[i][1]) === portalV2_normalizar_email_(email) && String(dados[i][2]) === String(idCaso)) {
      out.push({
        protocolo: String(dados[i][0]), tipo: String(dados[i][3] || ''),
        mensagem: String(dados[i][4] || ''), status: String(dados[i][5] || 'NOVO'),
        data: portalV2_formatar_data_(dados[i][6]),
        resposta: String(dados[i][7] || '')
      });
    }
  }
  return out;
}

function portalV2_formatar_data_(d) {
  try {
    var dt = new Date(d);
    if (isNaN(dt.getTime())) return String(d || '');
    return Utilities.formatDate(dt, 'GMT-3', 'dd/MM/yyyy HH:mm');
  } catch (e) { return String(d || ''); }
}

// =========================== 3. LOGOUT (revoga a sessão) ===========================

function portalV2_logout(p) {
  portalV2_lembrar_abas_();
  var sh = portalV2_aba_(PV_ABAS.sessoes, null);
  var dados = sh.getDataRange().getValues();
  var alvo = portalV2_hash_token_(p.token); // sessões gravam só o hash (orientação 2.5 de 14/10)
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return { sucesso: false, mensagem: 'Servidor ocupado.' };
  try {
    for (var i = 1; i < dados.length; i++) {
      if (dados[i][0] === alvo && dados[i][5] !== 'SIM') {
        sh.getRange(i + 1, 6).setValue('SIM');
        break;
      }
    }
  } finally { lock.releaseLock(); }
  portalV2_auditar_('sessao', 'logout', 'token', 'ok');
  return { sucesso: true };
}

// =========================== 4. PEDIDO (idempotente) ===========================

function portalV2_pedido(p) {
  portalV2_lembrar_abas_();
  var sess = portalV2_sessao_valida_(p.token, true);
  if (!sess.ok) return portalV2_erro_sessao_(sess.mensagem);
  var email = sess.email;
  // Orientação 1.1 de 14/10: o front envia 'mensagem'; aceitar também 'descricao' (alias legado)
  var idCaso = portalV2_resolver_caso_(email, String(p.idCaso || ''));
  if (!idCaso) {
    portalV2_auditar_(email, 'pedido', String(p.idCaso || '(vazio)'), 'sem_vinculo');
    return { sucesso: false, mensagem: 'Caso não vinculado ao seu acesso.' };
  }
  var tipo = String(p.tipo || '').slice(0, 80);
  var desc = String(p.mensagem || p.descricao || '').slice(0, 2000);
  var corpoHash = Utilities.base64Encode(Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256, JSON.stringify([email, idCaso, tipo, desc])));

  var sh = portalV2_aba_(PV_ABAS.pedidos, null);
  var dados = sh.getDataRange().getValues();
  // idempotência: mesmo pedido repetido devolve o mesmo protocolo
  for (var i = 1; i < dados.length; i++) {
    if (dados[i][8] === corpoHash) return { sucesso: true, protocolo: String(dados[i][0]), duplicado: true };
  }

  var proto = 'LS-' + Utilities.formatDate(new Date(), 'GMT-3', 'yyyyMMdd-HHmmss') + '-' +
              Utilities.base64Encode(Utilities.getRandomBytes(3)).replace(/[^A-Za-z0-9]/g, '').slice(0, 4);
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return { sucesso: false, mensagem: 'Servidor ocupado. Tente de novo.' };
  try {
    sh.appendRow([proto, email, idCaso, tipo, desc, 'NOVO', new Date(), '', corpoHash]);
  } finally { lock.releaseLock(); }
  portalV2_auditar_(email, 'pedido', proto, 'ok');
  return { sucesso: true, protocolo: proto };
}

// =========================== 5. UPLOAD (magic number + tamanho + pasta privada) ===========================

var PV_MAGIC = {
  'pdf': [0x25, 0x50, 0x44, 0x46],                 // %PDF
  'jpg': [0xFF, 0xD8, 0xFF],                        // JPEG
  'png': [0x89, 0x50, 0x4E, 0x47]                   // PNG
};

function portalV2_upload(p) {
  portalV2_lembrar_abas_();
  var sess = portalV2_sessao_valida_(p.token, true);
  if (!sess.ok) return portalV2_erro_sessao_(sess.mensagem);
  var email = sess.email;
  var nomeArq = String(p.nome || '').replace(/[^\w.\-]/g, '_').slice(0, 120);
  // Orientação 1.2 de 14/10: o front envia o base64 em 'data'; aceitar também 'base64' (alias legado)
  var b64 = String(p.data || p.base64 || '');
  var idCaso = portalV2_resolver_caso_(email, String(p.idCaso || ''));

  if (!idCaso) {
    portalV2_auditar_(email, 'upload', String(p.idCaso || '(vazio)'), 'sem_vinculo');
    return { sucesso: false, mensagem: 'Caso não vinculado ao seu acesso.' };
  }
  var ext = (nomeArq.split('.').pop() || '').toLowerCase();
  if (!PV_MAGIC[ext]) return { sucesso: false, mensagem: 'Tipo não aceito. Use PDF, JPG ou PNG.' };
  var bytes = Utilities.base64Decode(b64);
  if (bytes.length > PV_MAX_ARQUIVO) return { sucesso: false, mensagem: 'Arquivo maior que 6 MB.' };
  // conferir magic number
  var magic = PV_MAGIC[ext];
  for (var m = 0; m < magic.length; m++) {
    if (bytes[m] !== magic[m]) {
      portalV2_auditar_(email, 'upload', nomeArq, 'conteudo_incompativel');
      return { sucesso: false, mensagem: 'Conteúdo do arquivo não corresponde ao tipo informado.' };
    }
  }

  // pasta por caso, sem compartilhamento por link
  var raiz = PropertiesService.getScriptProperties().getProperty('PORTAL_PASTA_RAIZ') || '';
  if (!raiz) return { sucesso: false, mensagem: 'Pasta raiz não configurada no servidor.' };
  var pastaCaso = portalV2_pasta_caso_(raiz, idCaso);
  var blob = Utilities.newBlob(bytes, { 'application/pdf': 'application/pdf', 'jpg': 'image/jpeg', 'png': 'image/png' }[ext], nomeArq);
  var arquivo = pastaCaso.createFile(blob);

  var hash = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes));
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return { sucesso: false, mensagem: 'Servidor ocupado.' };
  try {
    portalV2_aba_(PV_ABAS.auditoria, null).appendRow([new Date(), email, 'upload', 'hash:' + hash, 'ok']);
  } finally { lock.releaseLock(); }
  portalV2_auditar_(email, 'upload', 'arquivo:' + nomeArq, 'ok');
  return { sucesso: true, arquivoId: arquivo.getId() };
}

// =========================== AUXILIARES ===========================

function portalV2_normalizar_email_(e) { return String(e || '').trim().toLowerCase(); }

function portalV2_buscar_usuario_(email) {
  var sh = portalV2_aba_(PV_ABAS.usuarios, null);
  var dados = sh.getDataRange().getValues();
  for (var i = 1; i < dados.length; i++) {
    if (portalV2_normalizar_email_(dados[i][0]) === email) return dados[i];
  }
  return null;
}

// Verifica senha com PBKDF2 (formato pbkdf2$iter$salt$hash)
function portalV2_verificar_senha_(senha, armazenado) {
  var partes = String(armazenado || '').split('$');
  if (partes.length !== 4 || partes[0] !== 'pbkdf2') return false;
  var iter = Number(partes[1]) || PV_ITERACOES;
  var salt = Utilities.newBlob(Utilities.base64Decode(partes[2])).getBytes();
  var esperado = partes[3];
  var candidato = portalV2_pbkdf2_(senha, salt, iter);
  return candidato === esperado;
}

function portalV2_pbkdf2_(senha, salt, iter) {
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.PBKDF2_WITH_HMAC_SHA_1, senha + '', { salt: salt, iterations: iter, keyLength: 32 });
  return Utilities.base64Encode(digest);
}

function portalV2_criar_usuario_(email, senha, nome) {  // chamado por fluxo administrativo, não pelo site
  portalV2_lembrar_abas_();
  var sh = portalV2_aba_(PV_ABAS.usuarios, null);
  if (portalV2_buscar_usuario_(email)) return { ok: false, motivo: 'usuario_existe' };
  var salt = Utilities.getRandomBytes(16);
  var hash = portalV2_pbkdf2_(senha, salt, PV_ITERACOES);
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return { ok: false, motivo: 'lock' };
  try {
    // colunas: EMAIL, HASH_SENHA, CRIADO_EM, ATIVO, NOME (orientação 1.7 de 14/10)
    sh.appendRow([portalV2_normalizar_email_(email), 'pbkdf2$' + PV_ITERACOES + '$' +
      Utilities.base64Encode(salt) + '$' + hash, new Date(), true, String(nome || '').trim()]);
  } finally { lock.releaseLock(); }
  return { ok: true };
}

// Nome real do usuário a partir da coluna NOME; cai para o e-mail se a coluna estiver vazia
function portalV2_nome_usuario_(email) {
  var linha = portalV2_buscar_usuario_(email);
  return (linha && String(linha[4] || '').trim()) || email;
}

// Hash do token para gravar na aba PORTAL_SESSOES (o token em si nunca fica na planilha)
function portalV2_hash_token_(token) {
  return Utilities.base64Encode(Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256, String(token || '')));
}

// Revoga TODAS as sessões ativas de um usuário (OWASP: troca de senha exige isso)
// Fluxo administrativo; também usável após suspender o acesso (coluna ATIVO = FALSO)
function portalV2_revogar_todas_sessoes_(email) {
  var sh = portalV2_aba_(PV_ABAS.sessoes, null);
  var dados = sh.getDataRange().getValues();
  var alvo = portalV2_normalizar_email_(email);
  var revogadas = 0;
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return { ok: false, motivo: 'lock' };
  try {
    for (var i = 1; i < dados.length; i++) {
      if (portalV2_normalizar_email_(dados[i][1]) === alvo && dados[i][5] !== 'SIM') {
        sh.getRange(i + 1, 6).setValue('SIM');
        revogadas++;
      }
    }
  } finally { lock.releaseLock(); }
  portalV2_auditar_(alvo, 'revogar_sessoes', 'todas', 'ok:' + revogadas);
  return { ok: true, revogadas: revogadas };
}

function portalV2_sessao_valida_(token, renovar) {
  if (!token) return { ok: false, mensagem: 'Sessão expirada. Entre novamente.' };
  var sh = portalV2_aba_(PV_ABAS.sessoes, null);
  var dados = sh.getDataRange().getValues();
  var alvo = portalV2_hash_token_(token); // sessões gravam só o hash (orientação 2.5 de 14/10)
  var agora = new Date();
  for (var i = 1; i < dados.length; i++) {
    if (dados[i][0] !== alvo) continue;
    if (dados[i][5] === 'SIM') return { ok: false, mensagem: 'Sessão encerrada. Entre novamente.' };
    var expira = new Date(dados[i][3]);
    var ultimo = new Date(dados[i][4]);
    if (agora > expira) return { ok: false, mensagem: 'Sessão expirada. Entre novamente.' };
    if ((agora.getTime() - ultimo.getTime()) > PV_INATIVIDADE_MIN * 60000) {
      return { ok: false, mensagem: 'Sessão expirada por inatividade. Entre novamente.' };
    }
    if (renovar) {
      var lock = LockService.getScriptLock();
      if (lock.tryLock(10000)) {
        try { sh.getRange(i + 1, 5).setValue(agora); } finally { lock.releaseLock(); }
      }
    }
    return { ok: true, email: dados[i][1], nome: portalV2_nome_usuario_(dados[i][1]) };
  }
  return { ok: false, mensagem: 'Sessão inválida. Entre novamente.' };
}

function portalV2_tem_vinculo_(email, idCaso) {
  var sh = portalV2_aba_(PV_ABAS.vinculos, null);
  var dados = sh.getDataRange().getValues();
  for (var i = 1; i < dados.length; i++) {
    if (portalV2_normalizar_email_(dados[i][0]) === email && String(dados[i][1]) === String(idCaso)) return true;
  }
  return false;
}

function portalV2_pasta_caso_(raiz, idCaso) {
  var raizFolder = DriveApp.getFolderById(raiz);
  var it = raizFolder.getFoldersByName(idCaso);
  return it.hasNext() ? it.next() : raizFolder.createFolder(idCaso);
}

function portalV2_auditar_(ator, acao, recurso, resultado) {
  try {
    portalV2_aba_(PV_ABAS.auditoria, null).appendRow([new Date(), ator, acao, recurso, resultado]);
  } catch (e) { /* auditoria não bloqueia a operação principal */ }
}

// =========================== TESTES LOCAIS (dados fictícios) ===========================

function portalV2_testarLogin() {
  // 1) criar usuário fictício
  portalV2_lembrar_abas_();
  var r = portalV2_criar_usuario_('teste.ficticio@exemplo.com', 'SenhaFicticia123!');
  Logger.log('criar_usuario: ' + JSON.stringify(r));
  // 2) login errado
  var e1 = portalV2_login({ email: 'teste.ficticio@exemplo.com', senha: 'Errado' });
  Logger.log('login_errado: ' + JSON.stringify(e1));
  // 3) login correto
  var e2 = portalV2_login({ email: 'teste.ficticio@exemplo.com', senha: 'SenhaFicticia123!' });
  Logger.log('login_ok: ' + JSON.stringify(e2));
  // 4) conferir sessão
  var s = portalV2_sessao_valida_(e2.token, false);
  Logger.log('sessao: ' + JSON.stringify(s));
}

function portalV2_testarPedido() {
  var e = portalV2_login({ email: 'teste.ficticio@exemplo.com', senha: 'SenhaFicticia123!' });
  var p1 = portalV2_pedido({ token: e.token, idCaso: 'CASO-TESTE', tipo: 'documento', descricao: 'Pedido fictício' });
  var p2 = portalV2_pedido({ token: e.token, idCaso: 'CASO-TESTE', tipo: 'documento', descricao: 'Pedido fictício' });
  Logger.log('pedido_1: ' + JSON.stringify(p1));
  Logger.log('pedido_2 (duplicado): ' + JSON.stringify(p2));
  // conferir que o protocolo é o mesmo
}

function portalV2_testarUpload() {
  var e = portalV2_login({ email: 'teste.ficticio@exemplo.com', senha: 'SenhaFicticia123!' });
  // bytes %PDF- (4 primeiros de um PDF real)
  var b64 = Utilities.base64Encode([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E]);
  var u1 = portalV2_upload({ token: e.token, idCaso: 'CASO-TESTE', nome: 'teste.pdf', data: b64 });
  Logger.log('upload_pdf: ' + JSON.stringify(u1));
  // testar tipo falso: bytes PNG com extensão .pdf → deve negar
  var u2 = portalV2_upload({ token: e.token, idCaso: 'CASO-TESTE', nome: 'falso.pdf', data: Utilities.base64Encode([0x89, 0x50, 0x4E, 0x47]) });
  Logger.log('upload_png_como_pdf (esperado negar): ' + JSON.stringify(u2));
}

// Teste IDOR (orientação 2.9 de 14/10): cliente B tenta pedido no caso do cliente A → negado.
// Pré-condição: criar 2 usuários e vínculos distintos em PORTAL_VINCULOS antes de rodar.
function portalV2_testarIdor() {
  var a = portalV2_login({ email: 'teste.ficticio@exemplo.com', senha: 'SenhaFicticia123!' });
  var b = portalV2_login({ email: 'teste.ficticio.dois@exemplo.com', senha: 'OutraFicticia456!' });
  // CASO-TESTE é do usuário A; B tenta acessar → esperado 'sem_vinculo'
  var r = portalV2_pedido({ token: b.token, idCaso: 'CASO-TESTE', tipo: 'documento', mensagem: 'Tentativa do cliente B no caso do cliente A' });
  Logger.log('idor_pedido (esperado negar): ' + JSON.stringify(r));
  // mesmíssima coisa via upload
  var u = portalV2_upload({ token: b.token, idCaso: 'CASO-TESTE', nome: 'intruso.pdf', data: Utilities.base64Encode([0x25, 0x50, 0x44, 0x46]) });
  Logger.log('idor_upload (esperado negar): ' + JSON.stringify(u));
}

// Teste do enriquecimento do painel (orientação 1.4 de 14/10):
// conferir que a resposta tem cliente/processo/resumo/movimentacoes/diligencias/documentos/pedidos
function portalV2_testarPainel() {
  portalV2_lembrar_abas_();
  // cria aba de casos fictícios se não existir
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName('PORTAL_CASOS')) {
    var sh = ss.insertSheet('PORTAL_CASOS');
    sh.appendRow(['ID_CASO', 'EMAIL_CLIENTE', 'NUMERO', 'CLASSE', 'JUIZO', 'FASE', 'ATUALIZADO_EM', 'RESUMO', 'PROXIMO_PASSO']);
    sh.appendRow(['CASO-TESTE', 'teste.ficticio@exemplo.com', '0000000-00.2026.8.13.0000', 'Ação Penal (fictícia)', '1ª Vara (fictícia)', 'Instrução', '02/10/2026', 'Resumo fictício.', 'Próximo passo fictício.']);
  }
  var e = portalV2_login({ email: 'teste.ficticio@exemplo.com', senha: 'SenhaFicticia123!' });
  // sem idCaso: front atual não envia; deve resolver pelo vínculo único (CASO-TESTE)
  var p = portalV2_painel({ token: e.token });
  Logger.log('painel (sem idCaso, vínculo único): ' + JSON.stringify(p).slice(0, 2000));
}
