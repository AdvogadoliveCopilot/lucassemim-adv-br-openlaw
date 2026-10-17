/**
 * 32 - PORTAL DO CLIENTE V3 + CENTRAL DE COMANDOS DO DR. LUCAS SEMIM  (12/10/2026; gravação exata do texto corrigida em 15/10/2026)
 * ---------------------------------------------------------------------------------
 * Dois lados, uma planilha (abas PORTAL_*):
 *
 *   1) API PÚBLICA do portal (lucassemim.adv.br/portal/painel-cliente.html)
 *      Ações: portal_login, portal_painel, portal_pedido, portal_upload, portal_logout.
 *      Entrada: portal3Rotear(d)  (1 linha no doPost; veja INSTALAR_PORTAL_V3.md).
 *
 *   2) CENTRAL DE COMANDOS (só você): painel do advogado em HtmlService (CentralComandos.html),
 *      aberto por uma implantação PRÓPRIA do Apps Script: "Executar como: usuário que acessa" e
 *      "Quem pode acessar: somente eu". Entra com a sua conta Google (com verificação em 2 etapas
 *      se você a tiver ligada) e confere a lista PC3_ADMIN_EMAILS. Nenhuma senha de advogado
 *      trafega pelo site. Entrada: central3Servir(e) (1 linha no doGet).
 *
 * Princípios de segurança (o que o código FAZ; não é parecer de conformidade LGPD):
 *   - Cliente entra com e-mail + senha provisória gerada pelo sistema (60 bits, sem I/O/0/1).
 *     A senha nunca é guardada: só salt + HMAC-SHA256 com um "pepper" que fica em
 *     Propriedades do script (não está na planilha nem no código).
 *   - Mensagem única para erro de e-mail ou de senha; trava de tentativas por e-mail
 *     (5 erros -> 15 min) e teto global; nada de CPF no login; nada sensível na URL (só POST).
 *   - Sessão de 6 h em cache (token de 256 bits; só o hash fica no cache). Trocar a senha,
 *     bloquear o acesso ou "encerrar sessões" invalida os tokens antigos (SESSVER).
 *   - Autorização no servidor: o cliente só enxerga os casos ligados ao seu usuário na aba
 *     PORTAL_ACESSOS. O navegador nunca escolhe o ID do caso sem ser conferido.
 *   - Upload: só PDF/JPG/PNG conferidos pelos primeiros bytes, até 6 MB, 10 por dia, em pasta
 *     privada do Drive. Nenhum link público é criado.
 *   - Resumo do caso: só aparece para o cliente depois que VOCÊ libera (nada de IA falando
 *     direto com o cliente). O que sai na tela é sempre texto puro (sem HTML).
 *   - Auditoria (aba PORTAL_AUDITORIA) sem conteúdo de mensagens/arquivos.
 *   - Segredos só em Propriedades do script. Funções com "_" no fim são internas.
 *
 * Limites desta versão (fale com o Claude antes de abrir para muitos clientes):
 *   - Sem "trocar a minha senha" nem 2ª etapa para o cliente (senha provisória forte + trava).
 *   - Apps Script não enxerga o IP de quem acessa: a trava é por e-mail, não por IP.
 *   - Planilha como banco: ótimo para algumas dezenas de clientes; depois, migrar.
 *
 * Dois jeitos de instalar:
 *   A) PROJETO NOVO (recomendado): script avulso + planilha nova + pasta-raiz nova no Drive, tudo criado por portal3Instalar().
 *      Junto vai o arquivo 00_Roteador_PROJETO_NOVO.gs (doGet/doPost próprios). Cada caso ganha sua pasta (com as 8 subpastas)
 *      sozinha, casos encerrados vão para o arquivo morto e uma rotina diária confere tudo. Guia: INSTALAR_PROJETO_NOVO.md.
 *   B) Dentro do projeto antigo "Advogado Live": 2 linhas nos doGet/doPost que já existem (NÃO use o arquivo do roteador).
 *      Guia: INSTALAR_PORTAL_V3.md.
 * Teste no editor: portal3Testes().
 */

// ===================== CONFIGURAÇÃO =====================
const PC3 = {
  TZ: 'America/Sao_Paulo',
  URL_PORTAL: 'https://lucassemim.adv.br/portal/painel-cliente.html',
  SESSAO_SEG: 21600,                 // 6 h (máximo do CacheService)
  LOGIN_MAX_FALHAS: 5,               // por e-mail
  LOGIN_BLOQUEIO_SEG: 900,           // 15 min
  LOGIN_GLOBAL_FALHAS_10MIN: 60,     // teto geral de ERROS de login por 10 min (freio contra ataque em massa)
  PEDIDOS_DIA: 10,
  UPLOADS_DIA: 10,
  UPLOAD_MAX_BYTES: 6 * 1024 * 1024,
  UPLOAD_MAX_BASE64: 8600000,
  DOC_MAX_BYTES: 8 * 1024 * 1024,    // maior arquivo que o cliente baixa pelo painel (a resposta do Apps Script é texto/base64)
  DOWNLOADS_HORA: 40,                // freio: downloads por usuário por hora
  PASTA_UPLOAD: '06_Enviados_pelo_cliente',
  SUBPASTAS: ['01_Contratos_e_Procuracoes', '02_Documentos_do_cliente', '03_Pecas_do_processo', '04_Decisoes_e_intimacoes', '05_Provas_e_laudos', '06_Enviados_pelo_cliente', '07_Para_o_cliente', '08_Administrativo_interno'],
  GRUPOS_DOC: ['Contratos e procurações', 'Decisões e peças', 'Provas e laudos', 'Orientações do escritório', 'Outros'],
  MIMES_DOC: ['application/pdf', 'image/jpeg', 'image/png', 'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  MIMES_NATIVOS: ['application/vnd.google-apps.document', 'application/vnd.google-apps.spreadsheet', 'application/vnd.google-apps.presentation'],   // saem como PDF
  AUDITORIA_MAX: 6000,
  // --- projeto novo: Drive organizado sozinho ---
  RAIZ_NOME: 'Portal do Cliente – Lucas Semim',
  PLANILHA_NOME: 'Portal do Cliente – Banco de dados',
  PASTAS_RAIZ: { CLIENTES: '01_Clientes', MODELOS: '02_Modelos', ARQUIVO: '03_Arquivo_morto', BACKUPS: '04_Backups' },
  ROTINA_HORA: 3,                    // a rotina diária roda por volta das 3h (horário de Brasília)
  ORGANIZAR_MAX_MS: 270000,          // a rotina para sozinha aos 4,5 min (o Apps Script corta aos 6)
  ORGANIZAR_MAX_ARQ: 200,            // arquivos soltos examinados por vez, em UMA pasta de caso
  // "Organizar arquivos soltos": a PRIMEIRA palavra-chave do nome do arquivo decide a subpasta. Sem palavra, o arquivo fica onde está.
  REGRAS_ARQUIVO: [
    { pasta: '01_Contratos_e_Procuracoes', palavras: ['contrato', 'contratos', 'procuracao', 'procuracoes', 'substabelecimento', 'substabelecimentos'] },
    { pasta: '03_Pecas_do_processo', palavras: ['habeas corpus', 'resposta a acusacao', 'alegacoes finais', 'liberdade provisoria', 'revisao criminal', 'mandado de seguranca', 'auto de prisao em flagrante',
      'peticao', 'peticoes', 'recurso', 'recursos', 'apelacao', 'agravo', 'embargos', 'hc', 'memoriais', 'contestacao', 'razoes', 'contrarrazoes', 'requerimento', 'requerimentos',
      'relaxamento', 'revogacao', 'denuncia', 'oficio', 'oficios', 'apf', 'inquerito'] },
    { pasta: '04_Decisoes_e_intimacoes', palavras: ['ata de audiencia', 'termo de audiencia', 'decisao', 'decisoes', 'sentenca', 'sentencas', 'acordao', 'acordaos', 'despacho', 'despachos',
      'intimacao', 'intimacoes', 'mandado', 'mandados', 'alvara', 'alvaras', 'citacao', 'citacoes', 'ata', 'atas'] },
    { pasta: '05_Provas_e_laudos', palavras: ['exame de corpo de delito', 'cadeia de custodia', 'captura de tela', 'laudo', 'laudos', 'pericia', 'pericias', 'exame', 'exames', 'prova', 'provas',
      'video', 'videos', 'foto', 'fotos', 'fotografia', 'fotografias', 'audio', 'audios', 'gravacao', 'gravacoes', 'print', 'prints', 'conversa', 'conversas', 'whatsapp', 'prontuario', 'atestado'] },
    { pasta: '02_Documentos_do_cliente', palavras: ['comprovante de residencia', 'comprovante de endereco', 'certidao de nascimento', 'certidao de casamento', 'certidao de antecedentes',
      'titulo de eleitor', 'carteira de trabalho', 'rg', 'cpf', 'cnh', 'identidade', 'comprovante', 'comprovantes', 'holerite', 'contracheque', 'ctps', 'passaporte'] },
    { pasta: '07_Para_o_cliente', palavras: ['para o cliente', 'para cliente', 'orientacao', 'orientacoes'] },
    { pasta: '08_Administrativo_interno', palavras: ['recibo', 'recibos', 'nota fiscal', 'financeiro', 'interno', 'anotacoes', 'anotacao', 'estrategia'] }
  ],
  TIPOS_PEDIDO: ['Pedir visita ao preso', 'Cópia de decisão ou peça', 'Retorno do advogado', 'Enviar informação nova', 'Outro assunto'],
  TIPOS_DILIGENCIA: ['Visita ao presídio', 'Contato com a família', 'Petição protocolada', 'Ofício enviado', 'Audiência', 'Pesquisa no processo', 'Atendimento na delegacia'],
  STATUS_DILIGENCIA: ['Pendente', 'Em andamento', 'Feito'],
  ABA: {
    USUARIOS: 'PORTAL_USUARIOS', CASOS: 'PORTAL_CASOS', ACESSOS: 'PORTAL_ACESSOS',
    ANDAMENTOS: 'PORTAL_ANDAMENTOS', DILIGENCIAS: 'PORTAL_DILIGENCIAS', DOCUMENTOS: 'PORTAL_DOCUMENTOS',
    PEDIDOS: 'PORTAL_PEDIDOS', AUDITORIA: 'PORTAL_AUDITORIA'
  },
  CAB: {
    PORTAL_USUARIOS: ['ID_USUARIO', 'EMAIL', 'NOME', 'SALT', 'HASH', 'STATUS', 'TIPO', 'SESSVER', 'CRIADO_EM', 'ULTIMO_LOGIN', 'OBS'],
    PORTAL_CASOS: ['ID_CASO', 'ROTULO', 'NUMERO', 'CLASSE', 'JUIZO', 'FASE', 'ATUALIZADO_EM', 'RESUMO', 'PROXIMO_PASSO', 'RESUMO_LIBERADO', 'STATUS', 'PASTA_DRIVE_ID', 'CRIADO_EM', 'CONTRATO', 'PROCURACAO', 'DECLARACAO', 'TIPO'],
    PORTAL_ACESSOS: ['ID_USUARIO', 'ID_CASO', 'CRIADO_EM', 'ATIVO'],
    PORTAL_ANDAMENTOS: ['ID', 'ID_CASO', 'DATA', 'EVENTO', 'VISIVEL', 'CRIADO_EM'],
    PORTAL_DILIGENCIAS: ['ID', 'ID_CASO', 'DATA', 'TIPO', 'TEXTO', 'STATUS', 'VISIVEL', 'CRIADO_EM'],
    PORTAL_DOCUMENTOS: ['ID', 'ID_CASO', 'ID_USUARIO', 'DATA', 'NOME', 'DRIVE_ID', 'ORIGEM', 'VISIVEL', 'GRUPO', 'MIME', 'TAMANHO'],
    PORTAL_PEDIDOS: ['PROTOCOLO', 'ID_CASO', 'ID_USUARIO', 'DATA_HORA', 'TIPO', 'MENSAGEM', 'STATUS', 'RESPOSTA', 'RESPONDIDO_EM'],
    PORTAL_AUDITORIA: ['DATA_HORA', 'ATOR', 'ACAO', 'ID_CASO', 'RESULTADO', 'DETALHE']
  }
};
const PC3_ALFA_ = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // 32 caracteres, sem I, O, 0, 1
const PC3_PROP_SUB_ = { CLIENTES: 'PC3_PASTA_CLIENTES_ID', MODELOS: 'PC3_PASTA_MODELOS_ID', ARQUIVO: 'PC3_PASTA_ARQUIVO_ID', BACKUPS: 'PC3_PASTA_BACKUPS_ID' };
const PC3_SUB_ = {};                                     // subpastas do caso já conhecidas nesta execução (a busca por nome do Drive pode demorar a "enxergar" pasta recém-criada)
let PC3_SS_ = null;                                      // planilha em memória (só nesta execução)
let PC3_LOCK_ = 0;                                       // nível de trava (evita pedir a mesma trava duas vezes)
const PC3_ABAS_OK_ = {};                                 // abas cujo cabeçalho já foi conferido nesta execução

// ===================== UTILITÁRIOS =====================
function pc3Prop_(k) { return PropertiesService.getScriptProperties().getProperty(k) || ''; }
function pc3SetProp_(k, v) { PropertiesService.getScriptProperties().setProperty(k, String(v)); }

function pc3Hex_(bytes) {
  return bytes.map(function (b) { return ((b < 0 ? b + 256 : b) & 255).toString(16).padStart(2, '0'); }).join('');
}
function pc3Sha_(s) { return pc3Hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(s), Utilities.Charset.UTF_8)); }

// Aleatório de verdade: o Apps Script só tem o UUID v4 (SecureRandom). Pula os nibbles fixos (versão e variante).
function pc3RandHex_(n) {
  let s = '';
  while (s.length < n) {
    const u = Utilities.getUuid().replace(/-/g, '');
    for (let i = 0; i < u.length && s.length < n; i++) { if (i === 12 || i === 16) continue; s += u.charAt(i); }
  }
  return s;
}
function pc3RandAlfa_(n) {
  const h = pc3RandHex_(n * 2);
  let s = '';
  for (let i = 0; i < n; i++) s += PC3_ALFA_.charAt(parseInt(h.substr(i * 2, 2), 16) % 32);   // 256 é múltiplo de 32: sem viés
  return s;
}
function pc3SenhaBonita_(s) { return String(s).replace(/(.{4})(?=.)/g, '$1-'); }
function pc3SenhaNorm_(s) { return String(s == null ? '' : s).replace(/[\s-]/g, '').toUpperCase(); }

function pc3Igual_(a, b) {   // comparação sem "saída antecipada"
  a = String(a); b = String(b);
  let r = a.length ^ b.length;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) r |= (a.charCodeAt(i % (a.length || 1)) ^ b.charCodeAt(i % (b.length || 1)));
  return r === 0;
}
function pc3HashSenha_(salt, senhaNorm) {
  const pepper = pc3Prop_('PC3_PEPPER');
  if (!pepper) throw new Error('Portal não instalado (rode portal3Instalar).');
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(salt + '|' + senhaNorm, pepper));
}

function pc3Hoje_() { return Utilities.formatDate(new Date(), PC3.TZ, 'yyyy-MM-dd'); }
function pc3Agora_() { return Utilities.formatDate(new Date(), PC3.TZ, "yyyy-MM-dd'T'HH:mm:ss"); }
function pc3Data_(iso) { const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? m[3] + '/' + m[2] + '/' + m[1] : String(iso || ''); }
function pc3DataHora_(iso) {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  return m ? m[3] + '/' + m[2] + '/' + m[1] + ' ' + m[4] + ':' + m[5] : pc3Data_(iso);
}

// Texto seguro para guardar: tira controle, limita tamanho, neutraliza fórmula (=, +, -, @) com um espaço.
function pc3Texto_(v, max, multilinha) {
  let s = String(v == null ? '' : v).replace(/\r\n?/g, '\n');
  s = s.replace(multilinha ? /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g, multilinha ? '' : ' ');
  s = s.replace(/[‪-‮⁦-⁩]/g, '').trim().slice(0, max || 300);   // tira marcas de direção de texto (disfarce de texto)
  return /^[=+\-@]/.test(s) ? ' ' + s : s;
}
function pc3Email_(raw) {
  const e = String(raw == null ? '' : raw).trim().toLowerCase();
  if (e.length < 6 || e.length > 120) return '';
  return /^[^\s@,;<>()"']{1,64}@[a-z0-9.\-]{1,190}\.[a-z]{2,}$/.test(e) ? e : '';
}
function pc3NomeArquivo_(raw) {
  let n = String(raw == null ? 'documento' : raw).replace(/[\\\/]/g, '_').replace(/[^\w.\- ()À-ú]/g, '_').replace(/\.{2,}/g, '.').trim();
  if (!n || /^\.+$/.test(n)) n = 'documento';
  return n.slice(0, 100);
}
function pc3Sim_(v) { return v === true || String(v).toUpperCase() === 'SIM' ? 'SIM' : 'NAO'; }
function pc3Resp_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function pc3Erro_(msg) { return { sucesso: false, mensagem: msg }; }
function pc3Expirou_() { return { sucesso: false, expirou: true, mensagem: 'Sessão expirada. Entre novamente.' }; }

// ===================== PLANILHA =====================
function pc3Planilha_() {
  if (PC3_SS_) return PC3_SS_;
  const id = pc3Prop_('PC3_PLANILHA_ID');
  if (id) { PC3_SS_ = SpreadsheetApp.openById(id); return PC3_SS_; }
  let ss = null;
  try { ss = SpreadsheetApp.getActiveSpreadsheet(); } catch (_) {}
  if (!ss) throw new Error('Planilha não configurada (rode portal3Instalar).');
  PC3_SS_ = ss;
  return ss;
}
function pc3Aba_(nome) {
  const ss = pc3Planilha_();
  let sh = ss.getSheetByName(nome);
  const cab = PC3.CAB[nome];
  if (!sh) {
    if (!cab) throw new Error('Aba desconhecida: ' + nome);
    sh = ss.insertSheet(nome);
    sh.getRange(1, 1, sh.getMaxRows(), cab.length).setNumberFormat('@');   // tudo texto: datas, números e "fórmulas" não são interpretados
    sh.getRange(1, 1, 1, cab.length).setValues([cab]);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, cab.length).setFontWeight('bold').setBackground('#1a1a1a').setFontColor('#d4af37');
    PC3_ABAS_OK_[nome] = true;
  } else if (cab && !PC3_ABAS_OK_[nome]) {
    PC3_ABAS_OK_[nome] = true;                                              // confere o cabeçalho uma vez por execução
    const lc = sh.getLastColumn();
    if (lc < cab.length) {                                                  // aba de uma versão anterior: acrescenta as colunas novas no fim
      sh.getRange(1, lc + 1, sh.getMaxRows(), cab.length - lc).setNumberFormat('@');
      sh.getRange(1, lc + 1, 1, cab.length - lc).setValues([cab.slice(lc)]).setFontWeight('bold').setBackground('#1a1a1a').setFontColor('#d4af37');
    }
  }
  return sh;
}
function pc3Cel_(x) {
  if (x == null) return '';
  if (x instanceof Date) return Utilities.formatDate(x, PC3.TZ, "yyyy-MM-dd'T'HH:mm:ss");   // se alguém editar à mão e a planilha virar data
  return String(x);
}
// Gravação EXATA do texto. Medido no Google de verdade (15/10/2026), com a célula em formato texto ("@"):
//   - o formato "@" segura data, número e zeros à esquerda, MAS um texto que começa com "=" vira FÓRMULA mesmo assim;
//   - um apóstrofo inicial é o "escape" do Google e é consumido ("'abc" ficaria "abc").
// Por isso, texto que começa com = + - @ ' (ou tab/CR) leva UM apóstrofo na frente: o Google consome esse apóstrofo
// e guarda o texto exato. A leitura (pc3Ler_) não precisa desfazer nada.
function pc3Esc_(v) {
  const s = v == null ? '' : String(v);
  return /^[=+\-@\t\r']/.test(s) ? "'" + s : s;
}
function pc3Ler_(nome) {
  const sh = pc3Aba_(nome);
  const v = sh.getDataRange().getValues();
  if (v.length < 2) return [];
  const cab = v[0].map(String), out = [];
  for (let i = 1; i < v.length; i++) {
    const o = { _linha: i + 1 };
    for (let j = 0; j < cab.length; j++) o[cab[j]] = pc3Cel_(v[i][j]);
    if (!o[cab[0]]) continue;                       // linha em branco no meio da aba
    out.push(o);
  }
  return out;
}
function pc3Travar_(fn) {
  if (PC3_LOCK_ > 0) return fn();                   // já estamos dentro de uma trava
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  PC3_LOCK_++;
  try { return fn(); } finally { PC3_LOCK_--; lock.releaseLock(); }
}
function pc3Add_(nome, obj) {
  pc3Travar_(function () {
    const sh = pc3Aba_(nome), cab = PC3.CAB[nome];
    const linha = sh.getLastRow() + 1;
    // a aba nova nasce com 1000 linhas e getRange+setValues NÃO cresce sozinho: sem isto, a gravação para na linha 1000
    if (linha > sh.getMaxRows()) sh.insertRowsAfter(sh.getMaxRows(), Math.max(500, linha - sh.getMaxRows()));
    const rg = sh.getRange(linha, 1, 1, cab.length);
    rg.setNumberFormat('@');
    rg.setValues([cab.map(function (c) { return pc3Esc_(obj[c]); })]);
  });
}
// reg = registro lido por pc3Ler_ (traz _linha). Confere se a linha ainda é a mesma antes de gravar.
function pc3Set_(nome, reg, patch) {
  pc3Travar_(function () {
    if (!reg || !reg._linha) throw new Error('Registro inválido.');
    const sh = pc3Aba_(nome), cab = PC3.CAB[nome];
    if (pc3Cel_(sh.getRange(reg._linha, 1).getValue()) !== String(reg[cab[0]])) throw new Error('Os dados mudaram enquanto você mexia. Atualize a tela e tente de novo.');
    Object.keys(patch).forEach(function (k) {
      const j = cab.indexOf(k);
      if (j < 0) return;
      const c = sh.getRange(reg._linha, j + 1);
      c.setNumberFormat('@');
      c.setValue(pc3Esc_(patch[k]));
    });
  });
}
function pc3NovoId_(prefixo, existentes) {
  for (let t = 0; t < 30; t++) {
    const id = prefixo + pc3RandAlfa_(6);
    if (existentes.indexOf(id) === -1) return id;
  }
  throw new Error('Não consegui gerar um ID único.');
}

function pc3Audit_(ator, acao, casoId, resultado, detalhe) {
  try {
    pc3Add_(PC3.ABA.AUDITORIA, { DATA_HORA: pc3Agora_(), ATOR: String(ator || ''), ACAO: String(acao || ''), ID_CASO: String(casoId || ''), RESULTADO: String(resultado || ''), DETALHE: pc3Texto_(detalhe || '', 160) });
    const sh = pc3Aba_(PC3.ABA.AUDITORIA);
    if (sh.getLastRow() > PC3.AUDITORIA_MAX) pc3Travar_(function () { sh.deleteRows(2, 1000); });
  } catch (e) { /* auditoria nunca derruba o fluxo */ }
}

// ===================== CONTADORES / SESSÃO =====================
function pc3Contar_(chave, ttl) {          // contagem aproximada (basta para freio de abuso)
  const c = CacheService.getScriptCache();
  const n = (parseInt(c.get(chave) || '0', 10) || 0) + 1;
  c.put(chave, String(n), ttl);
  return n;
}
function pc3Valor_(chave) { return parseInt(CacheService.getScriptCache().get(chave) || '0', 10) || 0; }

function pc3NovaSessao_(user) {
  const token = pc3RandHex_(64);
  CacheService.getScriptCache().put('pc3s:' + pc3Sha_(token), JSON.stringify({ u: user.ID_USUARIO, v: parseInt(user.SESSVER, 10) || 1 }), PC3.SESSAO_SEG);
  return token;
}
function pc3Sessao_(token) {
  if (!/^[a-f0-9]{64}$/.test(String(token || ''))) return null;
  const raw = CacheService.getScriptCache().get('pc3s:' + pc3Sha_(token));
  if (!raw) return null;
  let s; try { s = JSON.parse(raw); } catch (e) { return null; }
  const u = pc3Ler_(PC3.ABA.USUARIOS).filter(function (x) { return x.ID_USUARIO === s.u; })[0];
  if (!u || u.STATUS !== 'ATIVO' || (parseInt(u.SESSVER, 10) || 1) !== s.v) return null;
  return { user: u };
}

// ===================== ADMIN =====================
function pc3AdminEmails_() { return pc3Prop_('PC3_ADMIN_EMAILS').toLowerCase().split(',').map(function (x) { return x.trim(); }).filter(Boolean); }
function pc3EmailAtivo_() {
  let e = '';
  try { e = Session.getActiveUser().getEmail(); } catch (_) {}
  return String(e || '').toLowerCase();
}
function pc3EhAdmin_() { const e = pc3EmailAtivo_(); return !!e && pc3AdminEmails_().indexOf(e) !== -1; }
function pc3ExigirAdmin_() {
  if (!pc3EhAdmin_()) throw new Error('Acesso negado. Entre com a conta Google do advogado.');
  return pc3EmailAtivo_();
}
function pc3AtorAdmin_() { return 'adv:' + pc3Sha_(pc3EmailAtivo_()).slice(0, 8); }
function pc3Avisar_(assunto, corpo) {
  try {
    const para = pc3AdminEmails_()[0];
    if (!para) return;
    MailApp.sendEmail({ to: para, subject: assunto, body: corpo + '\n\nCentral de Comandos: ' + (pc3Prop_('PC3_CENTRAL_URL') || '(abra pelo favorito da Central)') });
  } catch (e) { /* e-mail nunca derruba o fluxo */ }
}

// ===================== API PÚBLICA =====================
/** Chamado pelo doPost: if (acao começa com "portal_") return portal3Rotear(d); */
function portal3Rotear(d) {
  try {
    d = d || {};
    switch (d.acao) {
      case 'portal_login': return pc3Resp_(pc3Login_(d));
      case 'portal_painel': return pc3Resp_(pc3Painel_(d));
      case 'portal_pedido': return pc3Resp_(pc3Pedido_(d));
      case 'portal_upload': return pc3Resp_(pc3Upload_(d));
      case 'portal_docs': return pc3Resp_(pc3Docs_(d));
      case 'portal_doc_baixar': return pc3Resp_(pc3DocBaixar_(d));
      case 'portal_logout': return pc3Resp_(pc3Logout_(d));
      default: return pc3Resp_(pc3Erro_('Ação não reconhecida.'));
    }
  } catch (err) {
    try { console.error('Portal3: ' + err.message); } catch (_) {}
    return pc3Resp_(pc3Erro_('Não foi possível concluir agora. Tente de novo em instantes.'));
  }
}

function pc3Login_(d) {
  const msgGenerica = 'E-mail ou senha incorretos.';
  const senhaBruta = String(d.senha == null ? '' : d.senha);
  if (!String(d.email == null ? '' : d.email).trim() || !senhaBruta) return pc3Erro_('Preencha e-mail e senha.');
  const email = pc3Email_(d.email);
  if (!email || senhaBruta.length > 64) return pc3Erro_(msgGenerica);
  const cache = CacheService.getScriptCache();
  const janela = 'pc3g:' + Math.floor(Date.now() / 600000);
  if (pc3Valor_(janela) >= PC3.LOGIN_GLOBAL_FALHAS_10MIN) return pc3Erro_('Muitas tentativas agora. Tente de novo em alguns minutos.');
  const chaveEmail = 'pc3f:' + pc3Sha_(email).slice(0, 32);
  if (pc3Valor_(chaveEmail) >= PC3.LOGIN_MAX_FALHAS) {
    const marca = 'pc3b:' + pc3Sha_(email).slice(0, 32);
    if (!cache.get(marca)) { cache.put(marca, '1', PC3.LOGIN_BLOQUEIO_SEG); pc3Audit_('anon:' + pc3Sha_(email).slice(0, 8), 'login_bloqueado', '', 'bloqueado', ''); }
    return pc3Erro_('Muitas tentativas. Aguarde 15 minutos ou fale com o escritório.');
  }
  const u = pc3Ler_(PC3.ABA.USUARIOS).filter(function (x) { return x.EMAIL === email; })[0];
  const salt = u ? u.SALT : '0000000000000000';
  const hash = pc3HashSenha_(salt, pc3SenhaNorm_(senhaBruta));      // sempre calcula: o tempo não revela se o e-mail existe
  const ok = !!u && u.STATUS === 'ATIVO' && pc3Igual_(hash, u.HASH);
  if (!ok) {
    pc3Contar_(chaveEmail, PC3.LOGIN_BLOQUEIO_SEG);
    pc3Contar_(janela, 700);
    pc3Audit_('anon:' + pc3Sha_(email).slice(0, 8), 'login_falha', '', 'falha', '');
    return pc3Erro_(msgGenerica);
  }
  cache.remove(chaveEmail);
  const token = pc3NovaSessao_(u);
  pc3Set_(PC3.ABA.USUARIOS, u, { ULTIMO_LOGIN: pc3Agora_() });
  pc3Audit_(u.ID_USUARIO, 'login_ok', '', 'ok', '');
  return { sucesso: true, token: token, nome: u.NOME };
}

function pc3CasosDoUsuario_(uid) {
  const ids = pc3Ler_(PC3.ABA.ACESSOS).filter(function (a) { return a.ID_USUARIO === uid && a.ATIVO === 'SIM'; }).map(function (a) { return a.ID_CASO; });
  if (!ids.length) return [];
  return pc3Ler_(PC3.ABA.CASOS).filter(function (c) { return ids.indexOf(c.ID_CASO) !== -1 && c.STATUS === 'ATIVO'; });
}
function pc3EscolherCaso_(user, casoIdPedido) {
  const casos = pc3CasosDoUsuario_(user.ID_USUARIO);
  if (!casos.length) return null;
  if (casoIdPedido) { const c = casos.filter(function (x) { return x.ID_CASO === String(casoIdPedido); })[0]; if (c) return c; }
  return casos[0];
}

// Monta o que o CLIENTE vê. uidFiltro = só os pedidos desse usuário (null = todos, para a prévia do advogado).
function pc3MontarPainel_(nome, caso, uidFiltro, email) {
  const out = {
    sucesso: true, cliente: { nome: nome, email: email || '' },
    processo: { numero: '', classe: '', juizo: '', fase: '', atualizadoEm: '' },
    resumo: '', proximoPasso: '', movimentacoes: [], diligencias: [],
    documentos: { contrato: false, procuracao: false, declaracao: false, enviados: [] }, pedidos: []
  };
  if (!caso) return out;
  out.processo = { numero: caso.NUMERO, classe: caso.CLASSE, juizo: caso.JUIZO, fase: caso.FASE, atualizadoEm: pc3Data_(caso.ATUALIZADO_EM) };
  if (caso.RESUMO_LIBERADO === 'SIM') { out.resumo = caso.RESUMO; out.proximoPasso = caso.PROXIMO_PASSO; }
  const cid = caso.ID_CASO;
  out.movimentacoes = pc3Ler_(PC3.ABA.ANDAMENTOS).filter(function (a) { return a.ID_CASO === cid && a.VISIVEL === 'SIM'; })
    .sort(function (a, b) { return a.DATA < b.DATA ? 1 : a.DATA > b.DATA ? -1 : 0; }).slice(0, 30)
    .map(function (a) { return { data: pc3Data_(a.DATA), evento: a.EVENTO, titulo: a.EVENTO, descricao: '' }; });   // "titulo" = nome usado pelo visual novo; "evento" = nome do visual antigo
  out.diligencias =pc3Ler_(PC3.ABA.DILIGENCIAS).filter(function (a) { return a.ID_CASO === cid && a.VISIVEL === 'SIM'; })
    .sort(function (a, b) { return a.DATA < b.DATA ? 1 : a.DATA > b.DATA ? -1 : 0; }).slice(0, 20)
    .map(function (a) { return { data: pc3Data_(a.DATA), tipo: a.TIPO, texto: a.TEXTO, status: a.STATUS }; });
  const todosDocs = pc3Ler_(PC3.ABA.DOCUMENTOS).filter(function (a) { return a.ID_CASO === cid; });
  out.documentos = {
    contrato: caso.CONTRATO === 'SIM', procuracao: caso.PROCURACAO === 'SIM', declaracao: caso.DECLARACAO === 'SIM',
    enviados: todosDocs.filter(function (a) { return a.ORIGEM === 'cliente' && a.VISIVEL === 'SIM' && (!uidFiltro || a.ID_USUARIO === uidFiltro); })
      .sort(function (a, b) { return a.DATA < b.DATA ? 1 : -1; }).slice(0, 20).map(function (a) { return { nome: a.NOME, data: pc3Data_(a.DATA) }; }),
    escritorio: todosDocs.filter(function (a) { return a.ORIGEM === 'escritorio' && a.VISIVEL === 'SIM'; }).length      // quantos arquivos o escritório já liberou na biblioteca
  };
  out.pedidos = pc3Ler_(PC3.ABA.PEDIDOS).filter(function (p) { return p.ID_CASO === cid && (!uidFiltro || p.ID_USUARIO === uidFiltro); })
    .sort(function (a, b) { return a.DATA_HORA < b.DATA_HORA ? 1 : -1; }).slice(0, 20)
    .map(function (p) { return { protocolo: p.PROTOCOLO, tipo: p.TIPO, mensagem: p.MENSAGEM, status: p.STATUS, resposta: p.RESPOSTA, data: pc3DataHora_(p.DATA_HORA) }; });
  return out;
}

function pc3Painel_(d) {
  const s = pc3Sessao_(d.token);
  if (!s) return pc3Expirou_();
  const caso = pc3EscolherCaso_(s.user, d.casoId);
  pc3Audit_(s.user.ID_USUARIO, 'painel', caso ? caso.ID_CASO : '', 'ok', '');
  return pc3MontarPainel_(s.user.NOME, caso, s.user.ID_USUARIO, s.user.EMAIL);
}

// ---------- biblioteca de documentos (arquivos do escritório, liberados um a um na Central) ----------
const PC3_EXT_ = {
  'application/pdf': ['pdf'], 'image/jpeg': ['jpg', 'jpeg'], 'image/png': ['png'], 'text/plain': ['txt'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx']
};
// Garante extensão compatível com o tipo (quem recebe o arquivo precisa conseguir abrir). Nativos do Google saem como PDF.
function pc3NomeComExt_(nome, mime) {
  const exts = PC3_EXT_[mime];
  nome = String(nome || 'documento');
  if (!exts) return nome;
  const m = /\.([A-Za-z0-9]{1,5})$/.exec(nome);
  if (m && exts.indexOf(m[1].toLowerCase()) !== -1) return nome;
  return nome.slice(0, 100 - exts[0].length - 1) + '.' + exts[0];
}
function pc3Tamanho_(n) {
  n = Number(n) || 0;
  if (n <= 0) return '';
  if (n < 1024) return n + ' B';
  if (n < 1048576) return Math.max(1, Math.round(n / 1024)) + ' KB';
  return (n / 1048576).toFixed(1).replace('.', ',') + ' MB';
}

function pc3Docs_(d) {
  const s = pc3Sessao_(d.token);
  if (!s) return pc3Expirou_();
  const caso = pc3EscolherCaso_(s.user, d.casoId);
  if (!caso) return { sucesso: true, total: 0, pastas: [] };
  const docs = pc3Ler_(PC3.ABA.DOCUMENTOS).filter(function (x) { return x.ID_CASO === caso.ID_CASO && x.ORIGEM === 'escritorio' && x.VISIVEL === 'SIM'; })
    .sort(function (a, b) { return a.DATA < b.DATA ? 1 : a.DATA > b.DATA ? -1 : 0; });
  const grupos = {};
  docs.forEach(function (x) {
    const g = PC3.GRUPOS_DOC.indexOf(x.GRUPO) !== -1 ? x.GRUPO : 'Outros';
    (grupos[g] = grupos[g] || []).push({ id: x.ID, nome: x.NOME, atualizadoEm: pc3Data_(x.DATA), tamanho: pc3Tamanho_(x.TAMANHO), tipo: x.MIME });
  });
  return {
    sucesso: true, total: docs.length,
    pastas: PC3.GRUPOS_DOC.filter(function (g) { return grupos[g]; }).map(function (g) { return { id: g, nome: g, arquivos: grupos[g] }; })   // o "id" da pasta é só o nome do grupo: nunca um ID do Drive
  };
}

/** O arquivo vai no corpo da resposta (base64). Nenhum link do Drive é criado nem compartilhado. */
function pc3DocBaixar_(d) {
  const s = pc3Sessao_(d.token);
  if (!s) return pc3Expirou_();
  const uid = s.user.ID_USUARIO;
  const idDoc = String(d.id == null ? '' : d.id);
  if (!/^D-[A-Z0-9]{6}$/.test(idDoc)) return pc3Erro_('Documento não encontrado.');
  const hora = 'pc3d:' + uid + ':' + Math.floor(Date.now() / 3600000);
  if (pc3Valor_(hora) >= PC3.DOWNLOADS_HORA) return pc3Erro_('Muitos downloads em pouco tempo. Tente de novo mais tarde.');
  const meusCasos = pc3CasosDoUsuario_(uid).map(function (c) { return c.ID_CASO; });
  const doc = pc3Ler_(PC3.ABA.DOCUMENTOS).filter(function (x) { return x.ID === idDoc; })[0];
  if (!doc || doc.ORIGEM !== 'escritorio' || doc.VISIVEL !== 'SIM' || !doc.DRIVE_ID || meusCasos.indexOf(doc.ID_CASO) === -1) {
    pc3Audit_(uid, 'doc_negado', doc ? doc.ID_CASO : '', 'negado', idDoc);
    return pc3Erro_('Documento não encontrado.');
  }
  pc3Contar_(hora, 3600);
  let blob, nome = pc3NomeArquivo_(doc.NOME);
  try {
    const f = DriveApp.getFileById(doc.DRIVE_ID);
    const mime = f.getMimeType();
    if (PC3.MIMES_NATIVOS.indexOf(mime) !== -1) {
      blob = f.getAs('application/pdf');
      nome = pc3NomeComExt_(nome, 'application/pdf');
    } else if (PC3.MIMES_DOC.indexOf(mime) !== -1) {
      if (f.getSize() > PC3.DOC_MAX_BYTES) return pc3Erro_('Arquivo grande demais para baixar pelo painel. Peça ao escritório.');
      blob = f.getBlob();
      nome = pc3NomeComExt_(nome, mime);
    } else {
      pc3Audit_(uid, 'doc_tipo_bloqueado', doc.ID_CASO, 'negado', idDoc);
      return pc3Erro_('Este arquivo não pode ser baixado pelo painel. Peça ao escritório.');
    }
  } catch (e) {
    pc3Audit_(uid, 'doc_erro', doc.ID_CASO, 'erro', idDoc);
    return pc3Erro_('Não consegui abrir o arquivo agora. Tente de novo ou fale com o escritório.');
  }
  const bytes = blob.getBytes();
  if (bytes.length > PC3.DOC_MAX_BYTES) return pc3Erro_('Arquivo grande demais para baixar pelo painel. Peça ao escritório.');
  pc3Audit_(uid, 'doc_baixado', doc.ID_CASO, 'ok', idDoc);
  return { sucesso: true, nome: nome, mimeType: blob.getContentType() || 'application/octet-stream', data: Utilities.base64Encode(bytes) };
}

function pc3Pedido_(d) {
  const s = pc3Sessao_(d.token);
  if (!s) return pc3Expirou_();
  const tipo = String(d.tipo == null ? '' : d.tipo);
  if (PC3.TIPOS_PEDIDO.indexOf(tipo) === -1) return pc3Erro_('Escolha um assunto da lista.');
  const msg = pc3Texto_(d.mensagem, 1200, true);
  if (msg.length < 5) return pc3Erro_('Escreva uma mensagem curta explicando o pedido.');
  const caso = pc3EscolherCaso_(s.user, d.casoId);
  if (!caso) return pc3Erro_('Seu acesso ainda não está ligado a um caso. Fale com o escritório.');
  const hoje = pc3Hoje_();
  const jaHoje = pc3Ler_(PC3.ABA.PEDIDOS).filter(function (p) { return p.ID_USUARIO === s.user.ID_USUARIO && p.DATA_HORA.indexOf(hoje) === 0; }).length;
  if (jaHoje >= PC3.PEDIDOS_DIA) return pc3Erro_('Limite de pedidos de hoje atingido. Se for urgente, chame no WhatsApp.');
  const protocolo = pc3Travar_(function () {
    const existentes = pc3Ler_(PC3.ABA.PEDIDOS).map(function (p) { return p.PROTOCOLO; });
    let pr = '';
    for (let t = 0; t < 30; t++) {
      pr = 'PC-' + Utilities.formatDate(new Date(), PC3.TZ, 'yyMMdd') + '-' + pc3RandAlfa_(4);
      if (existentes.indexOf(pr) === -1) break;
    }
    pc3Add_(PC3.ABA.PEDIDOS, { PROTOCOLO: pr, ID_CASO: caso.ID_CASO, ID_USUARIO: s.user.ID_USUARIO, DATA_HORA: pc3Agora_(), TIPO: tipo, MENSAGEM: msg, STATUS: 'Pendente', RESPOSTA: '', RESPONDIDO_EM: '' });
    return pr;
  });
  pc3Audit_(s.user.ID_USUARIO, 'pedido', caso.ID_CASO, 'ok', protocolo);
  if (caso.TIPO !== 'autoteste') pc3Avisar_('Portal · novo pedido ' + protocolo + ' (' + tipo + ')', 'Há um pedido novo de cliente no portal. Protocolo ' + protocolo + '.');
  return { sucesso: true, protocolo: protocolo };
}

function pc3PastaRaiz_() {
  if (typeof ID_RAIZ_ESCRITORIO !== 'undefined' && ID_RAIZ_ESCRITORIO) return DriveApp.getFolderById(ID_RAIZ_ESCRITORIO);
  const id = pc3Prop_('PC3_PASTA_RAIZ_ID');
  return id ? DriveApp.getFolderById(id) : DriveApp.getRootFolder();
}
// Pasta do caso no Drive. Se a Central ligou a pasta real do cliente, é ela (e NUNCA é trocada em silêncio: se não abrir, dá erro).
function pc3PastaCaso_(caso) {
  if (caso.PASTA_DRIVE_ID) return DriveApp.getFolderById(caso.PASTA_DRIVE_ID);
  if (pc3Prop_('PC3_PASTA_RAIZ_ID')) return pc3CriarPastaCaso_(caso.ID_CASO);   // projeto novo: pasta padrão do caso, dentro de 01_Clientes
  const raiz = pc3PastaRaiz_();
  const it = raiz.getFoldersByName('PORTAL_RECEBIDOS');
  const base = it.hasNext() ? it.next() : raiz.createFolder('PORTAL_RECEBIDOS');
  const pasta = base.createFolder(caso.ID_CASO + ' - ' + String(caso.ROTULO || '').slice(0, 60));
  pc3Set_(PC3.ABA.CASOS, caso, { PASTA_DRIVE_ID: pasta.getId() });
  return pasta;
}
// Onde caem os envios do cliente: <pasta do caso>/06_Enviados_pelo_cliente
function pc3PastaUpload_(caso) {
  const base = pc3PastaCaso_(caso);
  const conhecidas = PC3_SUB_[base.getId()];
  if (conhecidas && conhecidas[PC3.PASTA_UPLOAD]) return conhecidas[PC3.PASTA_UPLOAD];
  const it = base.getFoldersByName(PC3.PASTA_UPLOAD);
  return it.hasNext() ? it.next() : base.createFolder(PC3.PASTA_UPLOAD);
}
// ===================== DRIVE ORGANIZADO (projeto novo) =====================
// Quando o projeto foi montado pelo instalador existe uma pasta-raiz ("Portal do Cliente – Lucas Semim") com:
//   01_Clientes (uma pasta por caso, com as 8 subpastas) · 02_Modelos · 03_Arquivo_morto (casos encerrados) · 04_Backups (cópia semanal da planilha)
// Tudo o que o sistema cria fica DENTRO dessa raiz. Nenhuma função daqui apaga arquivo de cliente.
function pc3Url_(pasta) { return 'https://drive.google.com/drive/folders/' + pasta.getId(); }

function pc3Raiz_() {                                  // pasta-raiz do projeto novo; null se este projeto não tem uma
  const id = pc3Prop_('PC3_PASTA_RAIZ_ID');
  if (!id) return null;
  let raiz;
  try { raiz = DriveApp.getFolderById(id); } catch (e) { throw new Error('A pasta-raiz do portal no Drive não abre. Rode portal3Diagnostico.'); }
  if (raiz.isTrashed()) throw new Error('A pasta-raiz do portal está na lixeira do Drive. Restaure-a (ou rode portal3Diagnostico).');
  return raiz;
}
// 01_Clientes, 02_Modelos, 03_Arquivo_morto, 04_Backups. O ID fica guardado: a busca por nome do Drive pode não "enxergar" uma pasta recém-criada e duplicá-la.
function pc3SubRaiz_(chave) {
  const raiz = pc3Raiz_();
  if (!raiz) return null;
  const prop = PC3_PROP_SUB_[chave], salvo = pc3Prop_(prop);
  if (salvo) { try { const f = DriveApp.getFolderById(salvo); if (!f.isTrashed()) return f; } catch (_) {} }
  const nome = PC3.PASTAS_RAIZ[chave], it = raiz.getFoldersByName(nome);
  const f = it.hasNext() ? it.next() : raiz.createFolder(nome);
  pc3SetProp_(prop, f.getId());
  return f;
}
// Pastas que NUNCA podem ser tratadas como "a pasta de um cliente": a raiz do Drive inteiro, a raiz do portal, as 4 pastas numeradas e qualquer pasta
// que contenha a raiz do portal. Devolve a explicação (texto) ou '' se a pasta serve. Protege contra um link colado errado.
function pc3PastaInadequada_(pasta) {
  const id = pasta.getId();
  try { if (id === DriveApp.getRootFolder().getId()) return 'Essa é a raiz do seu Drive inteiro. Ligue a pasta de UM cliente.'; } catch (_) {}
  const raizId = pc3Prop_('PC3_PASTA_RAIZ_ID');
  if (!raizId) return '';
  const estrutura = [raizId].concat(Object.keys(PC3_PROP_SUB_).map(function (k) { return pc3Prop_(PC3_PROP_SUB_[k]); }));
  if (estrutura.indexOf(id) !== -1) return 'Essa é uma pasta de organização do portal, não a pasta de um cliente.';
  let raiz = null;
  try { raiz = DriveApp.getFolderById(raizId); } catch (_) {}
  if (raiz && pc3DentroDe_(raiz, id)) return 'Essa pasta contém a pasta-raiz do portal. Ligue a pasta de UM cliente.';
  return '';
}
function pc3ExigirPastaDeCliente_(pasta) { const ruim = pc3PastaInadequada_(pasta); if (ruim) throw new Error(ruim); }
// Onde está a pasta do caso, SEM mexer em nada: 'sem-pasta' | 'organizada' (dentro de 01_Clientes ou 03_Arquivo_morto) | 'externa' (ligada à mão, fora da estrutura) | 'erro' (não abre).
// Projeto sem pasta-raiz (modo projeto antigo): '' (o botão de adotar nem aparece).
function pc3LugarPasta_(caso) {
  if (!pc3Prop_('PC3_PASTA_RAIZ_ID')) return '';
  if (!caso.PASTA_DRIVE_ID) return 'sem-pasta';
  try {
    const ids = [pc3Prop_(PC3_PROP_SUB_.CLIENTES), pc3Prop_(PC3_PROP_SUB_.ARQUIVO)], it = DriveApp.getFolderById(caso.PASTA_DRIVE_ID).getParents();
    while (it.hasNext()) { if (ids.indexOf(it.next().getId()) !== -1) return 'organizada'; }
    return 'externa';
  } catch (e) { return 'erro'; }
}
function pc3NomePastaCaso_(caso) {
  const rot = pc3Texto_(caso.ROTULO, 80).replace(/[\/\\]/g, '-').trim() || 'Caso sem nome';
  return rot + ' (' + caso.ID_CASO + ')';
}
// Cria as subpastas padrão que faltam (não mexe no que já existe) e devolve os nomes criados.
function pc3GarantirSubpastas_(pasta) {
  return pc3Travar_(function () {
    const tem = {}, it = pasta.getFolders();
    while (it.hasNext()) { const f = it.next(); if (!tem[f.getName()]) tem[f.getName()] = f; }
    const criadas = [];
    PC3.SUBPASTAS.forEach(function (n) { if (!tem[n]) { tem[n] = pasta.createFolder(n); criadas.push(n); } });
    PC3_SUB_[pasta.getId()] = tem;
    return criadas;
  });
}
// Cria a pasta padrão do caso (01_Clientes/<nome do caso> (<ID>), com as 8 subpastas) e grava o ID no caso. Se o caso já tem pasta, devolve essa e não mexe nela.
function pc3CriarPastaCaso_(idCaso) {
  return pc3Travar_(function () {
    const caso = pc3CasoPorId_(idCaso);                              // lê de novo, já com a trava
    if (caso.PASTA_DRIVE_ID) return DriveApp.getFolderById(caso.PASTA_DRIVE_ID);
    const base = pc3SubRaiz_(caso.STATUS === 'ENCERRADO' ? 'ARQUIVO' : 'CLIENTES');
    if (!base) throw new Error('Este projeto ainda não tem a pasta-raiz do portal (rode portal3Instalar).');
    const nome = pc3NomePastaCaso_(caso), ja = base.getFoldersByName(nome);   // tentativa anterior que caiu no meio é reaproveitada (o ID do caso está no nome)
    const pasta = ja.hasNext() ? ja.next() : base.createFolder(nome);
    pc3Set_(PC3.ABA.CASOS, caso, { PASTA_DRIVE_ID: pasta.getId() });
    pc3GarantirSubpastas_(pasta);
    pc3Audit_('sistema', 'pasta_criada', caso.ID_CASO, 'ok', '');
    return pasta;
  });
}
// Caso encerrado -> 03_Arquivo_morto; caso reaberto -> volta para 01_Clientes. Só mexe em pasta que está num desses dois lugares:
// a pasta que você ligou à mão (de qualquer outro ponto do Drive) NUNCA é movida.
function pc3AjustarLugarPasta_(caso) {
  if (!caso.PASTA_DRIVE_ID || !pc3Prop_('PC3_PASTA_RAIZ_ID')) return 'sem-pasta';
  const clientes = pc3SubRaiz_('CLIENTES'), arquivo = pc3SubRaiz_('ARQUIVO');
  const pasta = DriveApp.getFolderById(caso.PASTA_DRIVE_ID);
  const pais = [], it = pasta.getParents();
  while (it.hasNext()) pais.push(it.next().getId());
  const emClientes = pais.indexOf(clientes.getId()) !== -1, emArquivo = pais.indexOf(arquivo.getId()) !== -1;
  if (!emClientes && !emArquivo) return 'externa';
  if (caso.STATUS === 'ENCERRADO') { if (emArquivo) return 'ok'; pasta.moveTo(arquivo); return 'movida-arquivo'; }
  if (emClientes) return 'ok';
  pasta.moveTo(clientes);
  return 'movida-clientes';
}
// Rotina de estrutura (diária e botão "Organizar agora"): cria o que falta e arruma o lugar das pastas. Não apaga nada e não mexe em pasta ligada à mão.
function pc3OrganizarEstrutura_() {
  const r = { casos: 0, pastasCriadas: 0, subpastasCriadas: 0, movidas: 0, externas: 0, erros: [], parou: false };
  if (!pc3Prop_('PC3_PASTA_RAIZ_ID')) return r;
  const t0 = Date.now();
  ['CLIENTES', 'MODELOS', 'ARQUIVO', 'BACKUPS'].forEach(function (k) { pc3SubRaiz_(k); });
  pc3Ler_(PC3.ABA.CASOS).forEach(function (c0) {
    if (r.parou) return;
    if (Date.now() - t0 > PC3.ORGANIZAR_MAX_MS) { r.parou = true; return; }
    r.casos++;
    try {
      let caso = c0;
      if (!caso.PASTA_DRIVE_ID) { pc3CriarPastaCaso_(caso.ID_CASO); r.pastasCriadas++; caso = pc3CasoPorId_(caso.ID_CASO); }
      const lugar = pc3AjustarLugarPasta_(caso);
      if (lugar === 'externa') { r.externas++; return; }
      if (lugar.indexOf('movida') === 0) r.movidas++;
      r.subpastasCriadas += pc3GarantirSubpastas_(DriveApp.getFolderById(caso.PASTA_DRIVE_ID)).length;
    } catch (e) { r.erros.push(c0.ID_CASO + ': ' + String(e && e.message || e).slice(0, 120)); }
  });
  return r;
}
function pc3ResumoRotina_(r) {
  return r.casos + ' caso(s): ' + r.pastasCriadas + ' pasta(s) criada(s), ' + r.subpastasCriadas + ' subpasta(s) criada(s), ' + r.movidas + ' movida(s)' +
    (r.externas ? ', ' + r.externas + ' ligada(s) à mão (não mexi)' : '') + (r.erros.length ? ', ' + r.erros.length + ' aviso(s)' : '') + (r.parou ? ' (parei por tempo; a próxima rodada continua)' : '');
}
function pc3RegistrarRotina_(r, ator) {
  const resumo = pc3ResumoRotina_(r);
  pc3SetProp_('PC3_ULTIMA_ROTINA', pc3Agora_() + '|' + resumo);
  pc3Audit_(ator, 'pastas_organizadas', '', r.erros.length ? 'avisos' : 'ok', resumo);
  return resumo;
}

// ----- arquivos soltos: sugere a subpasta pelo nome do arquivo (você confere antes de mover) -----
function pc3NormNome_(s) {
  return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\.[a-z0-9]{1,5}$/, '').replace(/[^a-z0-9]+/g, ' ').trim();
}
function pc3RegraArquivo_(nome) {
  const t = ' ' + pc3NormNome_(nome) + ' ';
  let melhor = null;
  PC3.REGRAS_ARQUIVO.forEach(function (r) {
    r.palavras.forEach(function (w) {
      const i = t.indexOf(' ' + w + ' ');
      if (i !== -1 && (!melhor || i < melhor.i || (i === melhor.i && w.length > melhor.palavra.length))) melhor = { i: i, pasta: r.pasta, palavra: w };
    });
  });
  return melhor;
}
// Só olha os arquivos que estão SOLTOS na raiz da pasta do caso (o que já está em subpasta não é tocado).
function pc3PlanoArquivos_(caso) {
  let pasta;
  try { pasta = DriveApp.getFolderById(caso.PASTA_DRIVE_ID); } catch (e) { throw new Error('A pasta ligada a este caso não abre. Ligue de novo.'); }
  pc3ExigirPastaDeCliente_(pasta);                                               // nunca arruma a raiz do Drive nem as pastas do próprio portal
  const existentes = {}, itf = pasta.getFolders();
  while (itf.hasNext()) { const f = itf.next(); if (!existentes[f.getName()]) existentes[f.getName()] = f; }
  const itens = [], semRegra = [], it = pasta.getFiles();
  let lidos = 0, cortado = false;
  while (it.hasNext()) {
    if (lidos >= PC3.ORGANIZAR_MAX_ARQ) { cortado = true; break; }
    const f = it.next();
    if (f.getMimeType() === 'application/vnd.google-apps.shortcut') continue;
    lidos++;
    const nome = f.getName(), r = pc3RegraArquivo_(nome);
    if (r) itens.push({ f: f, id: f.getId(), nome: nome, destino: r.pasta, palavra: r.palavra, existe: !!existentes[r.pasta] });
    else semRegra.push(nome);
  }
  return { pasta: pasta, existentes: existentes, itens: itens, semRegra: semRegra, cortado: cortado };
}

// ----- cópia semanal da planilha -----
function pc3DiaSemana_() { return new Date(pc3Hoje_() + 'T12:00:00Z').getUTCDay(); }   // 0 = domingo (calculado pela data de Brasília, sem depender do fuso do projeto)
function pc3Backup_() {
  const pasta = pc3SubRaiz_('BACKUPS');
  if (!pasta) return '';
  const nome = 'Backup do portal – ' + pc3Hoje_();
  if (pasta.getFilesByName(nome).hasNext()) return nome;                       // já fez hoje
  DriveApp.getFileById(pc3Prop_('PC3_PLANILHA_ID')).makeCopy(nome, pasta);
  return nome;
}

function pc3TipoPeloConteudo_(bytes) {   // confere os primeiros bytes; bytes do Apps Script vêm com sinal
  const b = [0, 1, 2, 3].map(function (i) { return (bytes[i] || 0) & 255; });
  if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return 'application/pdf';
  if (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return 'image/jpeg';
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47) return 'image/png';
  return '';
}

function pc3Upload_(d) {
  const s = pc3Sessao_(d.token);
  if (!s) return pc3Expirou_();
  // Aceita base64 puro OU "data:<tipo>;base64,<dados>" (o que o FileReader devolve): o prefixo é descartado e, se faltar o mimeType, vem dele.
  let b64 = String(d.data == null ? '' : d.data);
  const pref = /^data:([a-z0-9.+\/-]{1,60});base64,/i.exec(b64.slice(0, 120));
  if (pref) b64 = b64.slice(pref[0].length);
  const mime = String(d.mimeType ? d.mimeType : (pref ? pref[1].toLowerCase() : ''));
  if (['application/pdf', 'image/jpeg', 'image/png'].indexOf(mime) === -1) return pc3Erro_('Envie apenas PDF, JPG ou PNG.');
  if (!b64) return pc3Erro_('Arquivo vazio.');
  if (b64.length > PC3.UPLOAD_MAX_BASE64) return pc3Erro_('Arquivo muito grande (máximo 6 MB).');
  let bytes;
  try { bytes = Utilities.base64Decode(b64); } catch (e) { return pc3Erro_('Não consegui ler o arquivo. Tente de novo.'); }
  if (bytes.length > PC3.UPLOAD_MAX_BYTES) return pc3Erro_('Arquivo muito grande (máximo 6 MB).');
  if (pc3TipoPeloConteudo_(bytes) !== mime) return pc3Erro_('O arquivo não parece ser um ' + (mime === 'application/pdf' ? 'PDF' : 'JPG ou PNG') + ' válido.');
  const caso = pc3EscolherCaso_(s.user, d.casoId);
  if (!caso) return pc3Erro_('Seu acesso ainda não está ligado a um caso. Fale com o escritório.');
  const hoje = pc3Hoje_();
  const jaHoje = pc3Ler_(PC3.ABA.DOCUMENTOS).filter(function (x) { return x.ID_USUARIO === s.user.ID_USUARIO && x.ORIGEM === 'cliente' && x.DATA === hoje; }).length;
  if (jaHoje >= PC3.UPLOADS_DIA) return pc3Erro_('Limite de envios de hoje atingido. Fale com o escritório.');
  const nome = pc3NomeArquivo_(d.nome);
  let arq;
  try {
    const pasta = pc3PastaUpload_(caso);
    arq = pasta.createFile(Utilities.newBlob(bytes, mime, Utilities.formatDate(new Date(), PC3.TZ, 'yyMMdd_HHmm') + '_' + nome));
  } catch (e) {
    pc3Audit_(s.user.ID_USUARIO, 'upload_pasta_erro', caso.ID_CASO, 'erro', String(e && e.message || e).slice(0, 100));
    pc3Avisar_('Portal · não consegui salvar um documento no caso ' + caso.ID_CASO, 'Um cliente tentou enviar um documento, mas a pasta do Drive ligada a este caso não abriu. Confira a pasta na Central (aba do caso).');
    return pc3Erro_('Não consegui receber o arquivo agora. Fale com o escritório.');
  }
  try { arq.setDescription('Enviado pelo cliente no portal em ' + pc3Agora_()); } catch (_) {}
  pc3Travar_(function () {
    const ids = pc3Ler_(PC3.ABA.DOCUMENTOS).map(function (x) { return x.ID; });
    pc3Add_(PC3.ABA.DOCUMENTOS, { ID: pc3NovoId_('D-', ids), ID_CASO: caso.ID_CASO, ID_USUARIO: s.user.ID_USUARIO, DATA: hoje, NOME: nome, DRIVE_ID: arq.getId(), ORIGEM: 'cliente', VISIVEL: 'SIM', GRUPO: '', MIME: mime, TAMANHO: String(bytes.length) });
  });
  pc3Audit_(s.user.ID_USUARIO, 'upload', caso.ID_CASO, 'ok', mime);
  if (caso.TIPO !== 'autoteste') pc3Avisar_('Portal · documento novo no caso ' + caso.ID_CASO, 'Um cliente enviou um documento pelo portal (caso ' + caso.ID_CASO + '). O arquivo está na pasta PORTAL_RECEBIDOS do Drive.');
  return { sucesso: true, nome: nome };
}

function pc3Logout_(d) {
  const t = String(d.token || '');
  if (/^[a-f0-9]{64}$/.test(t)) { const s = pc3Sessao_(t); CacheService.getScriptCache().remove('pc3s:' + pc3Sha_(t)); if (s) pc3Audit_(s.user.ID_USUARIO, 'logout', '', 'ok', ''); }
  return { sucesso: true };
}

// ===================== USUÁRIOS (uso interno e da Central) =====================
function pc3CriarUsuario_(nome, email, tipo, obs) {
  return pc3Travar_(function () {
    const us = pc3Ler_(PC3.ABA.USUARIOS);
    if (us.some(function (u) { return u.EMAIL === email; })) throw new Error('Já existe um acesso com este e-mail.');
    const senha = pc3RandSenha_();
    const salt = pc3RandHex_(16);
    const id = pc3NovoId_('U-', us.map(function (u) { return u.ID_USUARIO; }));
    pc3Add_(PC3.ABA.USUARIOS, { ID_USUARIO: id, EMAIL: email, NOME: nome, SALT: salt, HASH: pc3HashSenha_(salt, pc3SenhaNorm_(senha)), STATUS: 'ATIVO', TIPO: tipo || 'cliente', SESSVER: '1', CRIADO_EM: pc3Agora_(), ULTIMO_LOGIN: '', OBS: obs || '' });
    return { id: id, senha: senha };
  });
}
function pc3RandSenha_() { return pc3RandAlfa_(12); }

function pc3Vincular_(uid, casoId) {
  pc3Travar_(function () {
    const ac = pc3Ler_(PC3.ABA.ACESSOS).filter(function (a) { return a.ID_USUARIO === uid && a.ID_CASO === casoId; })[0];
    if (ac) { if (ac.ATIVO !== 'SIM') pc3Set_(PC3.ABA.ACESSOS, ac, { ATIVO: 'SIM' }); return; }
    pc3Add_(PC3.ABA.ACESSOS, { ID_USUARIO: uid, ID_CASO: casoId, CRIADO_EM: pc3Agora_(), ATIVO: 'SIM' });
  });
}
function pc3NovoCaso_(c, tipo) {
  return pc3Travar_(function () {
    const ids = pc3Ler_(PC3.ABA.CASOS).map(function (x) { return x.ID_CASO; });
    const id = pc3NovoId_('C-', ids);
    pc3Add_(PC3.ABA.CASOS, {
      ID_CASO: id, ROTULO: pc3Texto_(c.rotulo, 80), NUMERO: pc3Texto_(c.numero, 40), CLASSE: pc3Texto_(c.classe, 80), JUIZO: pc3Texto_(c.juizo, 100),
      FASE: pc3Texto_(c.fase, 60), ATUALIZADO_EM: pc3Hoje_(), RESUMO: pc3Texto_(c.resumo, 1500, true), PROXIMO_PASSO: pc3Texto_(c.proximoPasso, 400, true),
      RESUMO_LIBERADO: pc3Sim_(c.resumoLiberado), STATUS: 'ATIVO', PASTA_DRIVE_ID: '', CRIADO_EM: pc3Agora_(),
      CONTRATO: pc3Sim_(c.contrato), PROCURACAO: pc3Sim_(c.procuracao), DECLARACAO: pc3Sim_(c.declaracao), TIPO: tipo || 'cliente'
    });
    return id;
  });
}

// ===================== CENTRAL DE COMANDOS (servidor) =====================
/** Chamado pelo doGet: var _c = central3Servir(e); if (_c) return _c;  (devolve null para quem não é advogado) */
function central3Servir(e) {
  if (!pc3EhAdmin_()) return null;
  return HtmlService.createHtmlOutputFromFile('CentralComandos')
    .setTitle('Central de Comandos · Dr. Lucas Semim')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

function pc3Cont_(arr, f) { let n = 0; arr.forEach(function (x) { if (f(x)) n++; }); return n; }
function pc3UrlGoogle_(u) { u = String(u || ''); return /^https:\/\/(drive|docs)\.google\.com\//.test(u) ? u.slice(0, 300) : ''; }
// Projeto novo: as triagens do site continuam na planilha ANTIGA. Guarde o ID dela em PC3_TRIAGEM_PLANILHA_ID para aparecerem no "Hoje".
function pc3PlanilhaTriagem_() {
  const id = pc3Prop_('PC3_TRIAGEM_PLANILHA_ID');
  return id ? SpreadsheetApp.openById(id) : pc3Planilha_();
}
function pc3Triagens_() {
  try {
    const sh = pc3PlanilhaTriagem_().getSheetByName('TRIAGEM_SITE');
    if (!sh || sh.getLastRow() < 2) return [];
    const v = sh.getDataRange().getValues(), cab = v[0].map(String);
    const col = function (n) { return cab.indexOf(n); };
    const fmt = function (x) { return x instanceof Date ? Utilities.formatDate(x, PC3.TZ, 'dd/MM HH:mm') : String(x == null ? '' : x); };
    const out = [];
    for (let i = v.length - 1; i >= 1 && out.length < 8; i--) {
      const l = v[i];
      out.push({
        quando: fmt(l[col('DATA/HORA')]), protocolo: String(l[col('PROTOCOLO')] || ''), urgente: String(l[col('URGENTE')] || '') === 'SIM',
        pessoa: String(l[col('PESSOA ENVOLVIDA')] || ''), quemPediu: String(l[col('QUEM PEDIU')] || ''), whatsapp: String(l[col('WHATSAPP')] || '').replace(/\D/g, ''),
        cidade: String(l[col('CIDADE')] || ''), urgenciaIA: String(l[col('URGÊNCIA IA (1-5)')] || ''), pasta: pc3UrlGoogle_(l[col('PASTA')]), ficha: pc3UrlGoogle_(l[col('FICHA')]), status: String(l[col('STATUS')] || '')
      });
    }
    return out;
  } catch (e) { return []; }
}
function pc3Prazos_() {
  try {
    const ini = new Date(), fim = new Date(ini.getTime() + 14 * 86400000);
    return CalendarApp.getDefaultCalendar().getEvents(ini, fim).filter(function (ev) { return /AUDI[ÊE]NCIA|PRAZO|PLANT[ÃA]O/i.test(ev.getTitle()); }).slice(0, 10).map(function (ev) {
      return { titulo: ev.getTitle(), quando: Utilities.formatDate(ev.getStartTime(), PC3.TZ, ev.isAllDayEvent() ? "dd/MM '(dia todo)'" : 'dd/MM HH:mm'), local: ev.getLocation() || '' };
    });
  } catch (e) { return []; }
}

function pc3ResumoDrive_() {
  const id = pc3Prop_('PC3_PASTA_RAIZ_ID');
  if (!id) return { ativo: false };
  const ult = pc3Prop_('PC3_ULTIMA_ROTINA').split('|');
  return {
    ativo: true, raizUrl: 'https://drive.google.com/drive/folders/' + id,
    planilhaUrl: pc3Prop_('PC3_PLANILHA_ID') ? 'https://docs.google.com/spreadsheets/d/' + pc3Prop_('PC3_PLANILHA_ID') + '/edit' : '',
    rotina: pc3Prop_('PC3_ROTINA_LIGADA') === '1', ultima: ult[0] ? pc3DataHora_(ult[0]) : '', ultimaResumo: ult.slice(1).join('|')
  };
}
function central3Estado() {
  pc3ExigirAdmin_();
  const casos = pc3Ler_(PC3.ABA.CASOS), us = pc3Ler_(PC3.ABA.USUARIOS), ped = pc3Ler_(PC3.ABA.PEDIDOS), ac = pc3Ler_(PC3.ABA.ACESSOS), docs = pc3Ler_(PC3.ABA.DOCUMENTOS);
  const rot = {}; casos.forEach(function (c) { rot[c.ID_CASO] = c.ROTULO; });
  const limite = Utilities.formatDate(new Date(Date.now() - 7 * 86400000), PC3.TZ, 'yyyy-MM-dd');
  return {
    admin: pc3EmailAtivo_(),
    kpis: {
      casosAtivos: pc3Cont_(casos, function (c) { return c.STATUS === 'ATIVO' && c.TIPO !== 'teste'; }),
      acessosAtivos: pc3Cont_(us, function (u) { return u.STATUS === 'ATIVO' && u.TIPO !== 'teste'; }),
      pedidosPendentes: pc3Cont_(ped, function (p) { return p.STATUS !== 'Respondido'; }),
      docs7d: pc3Cont_(docs, function (x) { return x.ORIGEM === 'cliente' && x.DATA >= limite; })
    },
    pedidosPendentes: ped.filter(function (p) { return p.STATUS !== 'Respondido'; }).sort(function (a, b) { return a.DATA_HORA < b.DATA_HORA ? 1 : -1; }).slice(0, 12)
      .map(function (p) { return { protocolo: p.PROTOCOLO, quando: pc3DataHora_(p.DATA_HORA), tipo: p.TIPO, casoId: p.ID_CASO, caso: rot[p.ID_CASO] || '' }; }),
    triagens: pc3Triagens_(),
    prazos: pc3Prazos_(),
    config: { tiposDiligencia: PC3.TIPOS_DILIGENCIA, statusDiligencia: PC3.STATUS_DILIGENCIA, gruposDoc: PC3.GRUPOS_DOC, subpastas: PC3.SUBPASTAS, pastasAutomaticas: !!pc3Prop_('PC3_PASTA_RAIZ_ID') },
    drive: pc3ResumoDrive_(),
    busca: {
      casos: casos.map(function (c) { return { id: c.ID_CASO, rotulo: c.ROTULO, numero: c.NUMERO, status: c.STATUS }; }),
      acessos: us.map(function (u) { return { id: u.ID_USUARIO, nome: u.NOME, email: u.EMAIL }; }),
      pedidos: ped.map(function (p) { return { protocolo: p.PROTOCOLO, tipo: p.TIPO, status: p.STATUS, caso: rot[p.ID_CASO] || '' }; })
    },
    portalInstalado: true,
    urlPortal: PC3.URL_PORTAL
  };
}

function central3ListarCasos() {
  pc3ExigirAdmin_();
  const ped = pc3Ler_(PC3.ABA.PEDIDOS), ac = pc3Ler_(PC3.ABA.ACESSOS);
  return pc3Ler_(PC3.ABA.CASOS).map(function (c) {
    return {
      id: c.ID_CASO, rotulo: c.ROTULO, numero: c.NUMERO, classe: c.CLASSE, fase: c.FASE, status: c.STATUS, tipo: c.TIPO, atualizadoEm: pc3Data_(c.ATUALIZADO_EM), atualizadoIso: c.ATUALIZADO_EM,
      acessos: pc3Cont_(ac, function (a) { return a.ID_CASO === c.ID_CASO && a.ATIVO === 'SIM'; }),
      pedidosPendentes: pc3Cont_(ped, function (p) { return p.ID_CASO === c.ID_CASO && p.STATUS !== 'Respondido'; }),
      resumoLiberado: c.RESUMO_LIBERADO === 'SIM'
    };
  }).sort(function (a, b) { return a.atualizadoIso < b.atualizadoIso ? 1 : -1; });
}

function central3AbrirCaso(id) {
  pc3ExigirAdmin_();
  const caso = pc3Ler_(PC3.ABA.CASOS).filter(function (c) { return c.ID_CASO === String(id); })[0];
  if (!caso) throw new Error('Caso não encontrado.');
  const us = pc3Ler_(PC3.ABA.USUARIOS), nomeDe = {}; us.forEach(function (u) { nomeDe[u.ID_USUARIO] = u.NOME; });
  const ordenar = function (a, b) { return a.DATA < b.DATA ? 1 : a.DATA > b.DATA ? -1 : 0; };
  return {
    caso: {
      id: caso.ID_CASO, rotulo: caso.ROTULO, numero: caso.NUMERO, classe: caso.CLASSE, juizo: caso.JUIZO, fase: caso.FASE, atualizadoEm: pc3Data_(caso.ATUALIZADO_EM),
      resumo: caso.RESUMO, proximoPasso: caso.PROXIMO_PASSO, resumoLiberado: caso.RESUMO_LIBERADO === 'SIM', status: caso.STATUS, tipo: caso.TIPO,
      contrato: caso.CONTRATO === 'SIM', procuracao: caso.PROCURACAO === 'SIM', declaracao: caso.DECLARACAO === 'SIM',
      pasta: caso.PASTA_DRIVE_ID ? 'https://drive.google.com/drive/folders/' + caso.PASTA_DRIVE_ID : '',
      pastaLugar: pc3LugarPasta_(caso)                                              // '' (projeto sem raiz) | 'sem-pasta' | 'organizada' | 'externa' | 'erro'
    },
    andamentos: pc3Ler_(PC3.ABA.ANDAMENTOS).filter(function (a) { return a.ID_CASO === caso.ID_CASO; }).sort(ordenar)
      .map(function (a) { return { id: a.ID, data: a.DATA, dataBr: pc3Data_(a.DATA), evento: a.EVENTO, visivel: a.VISIVEL === 'SIM' }; }),
    diligencias: pc3Ler_(PC3.ABA.DILIGENCIAS).filter(function (a) { return a.ID_CASO === caso.ID_CASO; }).sort(ordenar)
      .map(function (a) { return { id: a.ID, data: a.DATA, dataBr: pc3Data_(a.DATA), tipo: a.TIPO, texto: a.TEXTO, status: a.STATUS, visivel: a.VISIVEL === 'SIM' }; }),
    documentos: pc3Ler_(PC3.ABA.DOCUMENTOS).filter(function (a) { return a.ID_CASO === caso.ID_CASO; }).sort(ordenar)
      .map(function (a) { return { id: a.ID, dataBr: pc3Data_(a.DATA), nome: a.NOME, origem: a.ORIGEM, por: nomeDe[a.ID_USUARIO] || '', visivel: a.VISIVEL === 'SIM', grupo: a.GRUPO || '', tamanho: pc3Tamanho_(a.TAMANHO), link: a.DRIVE_ID ? 'https://drive.google.com/file/d/' + a.DRIVE_ID + '/view' : '' }; }),
    acessos: pc3Ler_(PC3.ABA.ACESSOS).filter(function (a) { return a.ID_CASO === caso.ID_CASO; }).map(function (a) {
      const u = us.filter(function (x) { return x.ID_USUARIO === a.ID_USUARIO; })[0] || {};
      return { usuarioId: a.ID_USUARIO, nome: u.NOME || '', email: u.EMAIL || '', status: u.STATUS || '', ativo: a.ATIVO === 'SIM', ultimoLogin: pc3DataHora_(u.ULTIMO_LOGIN || '') };
    }),
    pedidos: pc3Ler_(PC3.ABA.PEDIDOS).filter(function (p) { return p.ID_CASO === caso.ID_CASO; }).sort(function (a, b) { return a.DATA_HORA < b.DATA_HORA ? 1 : -1; })
      .map(function (p) { return { protocolo: p.PROTOCOLO, quando: pc3DataHora_(p.DATA_HORA), tipo: p.TIPO, mensagem: p.MENSAGEM, status: p.STATUS, resposta: p.RESPOSTA, por: nomeDe[p.ID_USUARIO] || '' }; })
  };
}

function central3NovoCaso(c) {
  pc3ExigirAdmin_();
  c = c || {};
  if (pc3Texto_(c.rotulo, 80).length < 3) throw new Error('Dê um nome interno ao caso (ex.: "João – tráfico – Sabará").');
  // Se veio o link de uma pasta que o cliente já tem, confere ANTES de criar o caso: link ruim = erro claro e nada é criado.
  let pastaLigadaId = '';
  if (String(c.pastaUrl == null ? '' : c.pastaUrl).trim()) {
    pastaLigadaId = pc3IdDrive_(c.pastaUrl);
    if (!pastaLigadaId) throw new Error('O link da pasta não parece ser de uma pasta do Drive. Cole o link inteiro ou deixe em branco.');
    let p;
    try { p = DriveApp.getFolderById(pastaLigadaId); } catch (e) { throw new Error('Não consegui abrir essa pasta com a sua conta Google. Confira o link (precisa ser de uma PASTA) ou deixe em branco.'); }
    pc3ExigirPastaDeCliente_(p);
  }
  const id = pc3NovoCaso_(c, 'cliente');
  pc3Audit_(pc3AtorAdmin_(), 'caso_novo', id, 'ok', '');
  const r = { id: id, pasta: '', aviso: '' };
  if (pastaLigadaId) {                                                           // cliente que já tem pasta: liga a dela e NÃO cria uma pasta padrão vazia ao lado
    pc3Set_(PC3.ABA.CASOS, pc3CasoPorId_(id), { PASTA_DRIVE_ID: pastaLigadaId });
    pc3Audit_(pc3AtorAdmin_(), 'pasta_ligada', id, 'ok', '');
    r.pasta = 'https://drive.google.com/drive/folders/' + pastaLigadaId;
  } else if (pc3Prop_('PC3_PASTA_RAIZ_ID')) {                                    // projeto novo: a pasta do caso nasce junto
    try { r.pasta = pc3Url_(pc3CriarPastaCaso_(id)); }
    catch (e) {
      r.aviso = 'Caso criado, mas não consegui criar a pasta no Drive agora. Use “Organizar agora” (tela Hoje, em “Pastas no Drive”) ou o botão da aba Documentos para tentar de novo.';
      pc3Audit_(pc3AtorAdmin_(), 'pasta_erro', id, 'erro', e && e.message);
    }
  }
  return r;
}

function central3SalvarCaso(id, c) {
  pc3ExigirAdmin_();
  c = c || {};
  const caso = pc3Ler_(PC3.ABA.CASOS).filter(function (x) { return x.ID_CASO === String(id); })[0];
  if (!caso) throw new Error('Caso não encontrado.');
  const status = c.status === 'ENCERRADO' ? 'ENCERRADO' : 'ATIVO';
  pc3Travar_(function () {
    pc3Set_(PC3.ABA.CASOS, caso, {
      ROTULO: pc3Texto_(c.rotulo, 80) || caso.ROTULO, NUMERO: pc3Texto_(c.numero, 40), CLASSE: pc3Texto_(c.classe, 80), JUIZO: pc3Texto_(c.juizo, 100), FASE: pc3Texto_(c.fase, 60),
      RESUMO: pc3Texto_(c.resumo, 1500, true), PROXIMO_PASSO: pc3Texto_(c.proximoPasso, 400, true), RESUMO_LIBERADO: pc3Sim_(c.resumoLiberado), STATUS: status,
      CONTRATO: pc3Sim_(c.contrato), PROCURACAO: pc3Sim_(c.procuracao), DECLARACAO: pc3Sim_(c.declaracao), ATUALIZADO_EM: pc3Hoje_()
    });
  });
  pc3Audit_(pc3AtorAdmin_(), 'caso_salvo', caso.ID_CASO, 'ok', c.resumoLiberado ? 'resumo liberado' : '');
  let pasta = '';
  if (caso.PASTA_DRIVE_ID && status !== caso.STATUS) {                              // encerrou ou reabriu: leva a pasta para o lugar certo
    try { pasta = pc3AjustarLugarPasta_(Object.assign({}, caso, { STATUS: status })); if (pasta.indexOf('movida') === 0) pc3Audit_(pc3AtorAdmin_(), 'pasta_movida', caso.ID_CASO, 'ok', pasta); }
    catch (e) { pasta = 'erro'; pc3Audit_(pc3AtorAdmin_(), 'pasta_erro', caso.ID_CASO, 'erro', e && e.message); }
  }
  return { ok: true, pasta: pasta };
}

function pc3DataValida_(d) { return /^\d{4}-\d{2}-\d{2}$/.test(String(d || '')) && !isNaN(new Date(d + 'T12:00:00').getTime()) ? d : pc3Hoje_(); }
function pc3TocarCaso_(casoId) {
  const caso = pc3Ler_(PC3.ABA.CASOS).filter(function (x) { return x.ID_CASO === casoId; })[0];
  if (caso) pc3Set_(PC3.ABA.CASOS, caso, { ATUALIZADO_EM: pc3Hoje_() });
}

function central3AddAndamento(casoId, data, evento, visivel) {
  pc3ExigirAdmin_();
  const ev = pc3Texto_(evento, 300);
  if (ev.length < 3) throw new Error('Escreva o andamento (pelo menos 3 letras).');
  if (!pc3Ler_(PC3.ABA.CASOS).some(function (x) { return x.ID_CASO === String(casoId); })) throw new Error('Caso não encontrado.');
  const id = pc3Travar_(function () {
    const ids = pc3Ler_(PC3.ABA.ANDAMENTOS).map(function (x) { return x.ID; });
    const nid = pc3NovoId_('A-', ids);
    pc3Add_(PC3.ABA.ANDAMENTOS, { ID: nid, ID_CASO: String(casoId), DATA: pc3DataValida_(data), EVENTO: ev, VISIVEL: pc3Sim_(visivel), CRIADO_EM: pc3Agora_() });
    return nid;
  });
  if (pc3Sim_(visivel) === 'SIM') pc3TocarCaso_(String(casoId));
  pc3Audit_(pc3AtorAdmin_(), 'andamento_novo', casoId, 'ok', id);
  return { id: id };
}

function central3AddDiligencia(casoId, data, tipo, texto, status, visivel) {
  pc3ExigirAdmin_();
  if (PC3.TIPOS_DILIGENCIA.indexOf(tipo) === -1) throw new Error('Escolha o tipo da diligência.');
  if (PC3.STATUS_DILIGENCIA.indexOf(status) === -1) throw new Error('Escolha o status.');
  const tx = pc3Texto_(texto, 600, true);
  if (tx.length < 3) throw new Error('Descreva a diligência (pelo menos 3 letras).');
  if (!pc3Ler_(PC3.ABA.CASOS).some(function (x) { return x.ID_CASO === String(casoId); })) throw new Error('Caso não encontrado.');
  const id = pc3Travar_(function () {
    const ids = pc3Ler_(PC3.ABA.DILIGENCIAS).map(function (x) { return x.ID; });
    const nid = pc3NovoId_('G-', ids);
    pc3Add_(PC3.ABA.DILIGENCIAS, { ID: nid, ID_CASO: String(casoId), DATA: pc3DataValida_(data), TIPO: tipo, TEXTO: tx, STATUS: status, VISIVEL: pc3Sim_(visivel), CRIADO_EM: pc3Agora_() });
    return nid;
  });
  if (pc3Sim_(visivel) === 'SIM') pc3TocarCaso_(String(casoId));
  pc3Audit_(pc3AtorAdmin_(), 'diligencia_nova', casoId, 'ok', id);
  return { id: id };
}

/** Mostra/esconde do cliente (nada é apagado). tipo: 'andamento' | 'diligencia'. */
function central3Alternar(tipo, id) {
  pc3ExigirAdmin_();
  const aba = tipo === 'andamento' ? PC3.ABA.ANDAMENTOS : tipo === 'diligencia' ? PC3.ABA.DILIGENCIAS : '';
  if (!aba) throw new Error('Tipo inválido.');
  const r = pc3Ler_(aba).filter(function (x) { return x.ID === String(id); })[0];
  if (!r) throw new Error('Registro não encontrado.');
  const novo = r.VISIVEL === 'SIM' ? 'NAO' : 'SIM';
  pc3Set_(aba, r, { VISIVEL: novo });
  pc3Audit_(pc3AtorAdmin_(), tipo + '_visivel', r.ID_CASO, novo, r.ID);
  return { visivel: novo === 'SIM' };
}

function central3AtualizarStatusDiligencia(id, status) {
  pc3ExigirAdmin_();
  if (PC3.STATUS_DILIGENCIA.indexOf(status) === -1) throw new Error('Status inválido.');
  const r = pc3Ler_(PC3.ABA.DILIGENCIAS).filter(function (x) { return x.ID === String(id); })[0];
  if (!r) throw new Error('Registro não encontrado.');
  pc3Set_(PC3.ABA.DILIGENCIAS, r, { STATUS: status });
  pc3TocarCaso_(r.ID_CASO);
  pc3Audit_(pc3AtorAdmin_(), 'diligencia_status', r.ID_CASO, status, r.ID);
  return { ok: true };
}

function central3Prever(casoId) {
  pc3ExigirAdmin_();
  const caso = pc3Ler_(PC3.ABA.CASOS).filter(function (x) { return x.ID_CASO === String(casoId); })[0];
  if (!caso) throw new Error('Caso não encontrado.');
  return pc3MontarPainel_('(prévia)', caso, null);
}

function central3CriarAcesso(casoId, nome, email) {
  pc3ExigirAdmin_();
  const caso = pc3Ler_(PC3.ABA.CASOS).filter(function (x) { return x.ID_CASO === String(casoId); })[0];
  if (!caso) throw new Error('Caso não encontrado.');
  const em = pc3Email_(email);
  if (!em) throw new Error('E-mail inválido.');
  const nm = pc3Texto_(nome, 80);
  const existente = pc3Ler_(PC3.ABA.USUARIOS).filter(function (u) { return u.EMAIL === em; })[0];
  if (existente) {
    pc3Vincular_(existente.ID_USUARIO, caso.ID_CASO);
    pc3Audit_(pc3AtorAdmin_(), 'acesso_vinculado', caso.ID_CASO, 'ok', existente.ID_USUARIO);
    return { novo: false, usuarioId: existente.ID_USUARIO, email: em, nome: existente.NOME, mensagem: 'Este e-mail já tinha acesso: liguei também a este caso. A senha dele não mudou.' };
  }
  if (nm.length < 2) throw new Error('Informe o nome de quem vai usar o acesso.');
  const r = pc3CriarUsuario_(nm, em, caso.TIPO === 'teste' ? 'teste' : 'cliente', '');
  pc3Vincular_(r.id, caso.ID_CASO);
  pc3Audit_(pc3AtorAdmin_(), 'acesso_criado', caso.ID_CASO, 'ok', r.id);
  return { novo: true, usuarioId: r.id, email: em, nome: nm, senha: pc3SenhaBonita_(r.senha), url: PC3.URL_PORTAL };
}

function central3RedefinirSenha(usuarioId) {
  pc3ExigirAdmin_();
  const u = pc3Ler_(PC3.ABA.USUARIOS).filter(function (x) { return x.ID_USUARIO === String(usuarioId); })[0];
  if (!u) throw new Error('Acesso não encontrado.');
  const senha = pc3RandSenha_(), salt = pc3RandHex_(16);
  pc3Set_(PC3.ABA.USUARIOS, u, { SALT: salt, HASH: pc3HashSenha_(salt, pc3SenhaNorm_(senha)), SESSVER: String((parseInt(u.SESSVER, 10) || 1) + 1), STATUS: 'ATIVO' });
  CacheService.getScriptCache().remove('pc3f:' + pc3Sha_(u.EMAIL).slice(0, 32));
  pc3Audit_(pc3AtorAdmin_(), 'senha_redefinida', '', 'ok', u.ID_USUARIO);
  return { usuarioId: u.ID_USUARIO, email: u.EMAIL, nome: u.NOME, senha: pc3SenhaBonita_(senha), url: PC3.URL_PORTAL };
}

function central3Bloquear(usuarioId, bloquear) {
  pc3ExigirAdmin_();
  const u = pc3Ler_(PC3.ABA.USUARIOS).filter(function (x) { return x.ID_USUARIO === String(usuarioId); })[0];
  if (!u) throw new Error('Acesso não encontrado.');
  pc3Set_(PC3.ABA.USUARIOS, u, { STATUS: bloquear ? 'BLOQUEADO' : 'ATIVO', SESSVER: String((parseInt(u.SESSVER, 10) || 1) + 1) });
  pc3Audit_(pc3AtorAdmin_(), bloquear ? 'acesso_bloqueado' : 'acesso_liberado', '', 'ok', u.ID_USUARIO);
  return { ok: true };
}

function central3Desvincular(usuarioId, casoId, ativo) {
  pc3ExigirAdmin_();
  const a = pc3Ler_(PC3.ABA.ACESSOS).filter(function (x) { return x.ID_USUARIO === String(usuarioId) && x.ID_CASO === String(casoId); })[0];
  if (!a) throw new Error('Ligação não encontrada.');
  pc3Set_(PC3.ABA.ACESSOS, a, { ATIVO: ativo ? 'SIM' : 'NAO' });
  pc3Audit_(pc3AtorAdmin_(), ativo ? 'acesso_religado' : 'acesso_desligado', casoId, 'ok', usuarioId);
  return { ok: true };
}

function central3Acessos() {
  pc3ExigirAdmin_();
  const ac = pc3Ler_(PC3.ABA.ACESSOS), casos = pc3Ler_(PC3.ABA.CASOS), rot = {};
  casos.forEach(function (c) { rot[c.ID_CASO] = c.ROTULO; });
  return pc3Ler_(PC3.ABA.USUARIOS).map(function (u) {
    return {
      id: u.ID_USUARIO, nome: u.NOME, email: u.EMAIL, status: u.STATUS, tipo: u.TIPO, ultimoLogin: pc3DataHora_(u.ULTIMO_LOGIN), criadoEm: pc3Data_(u.CRIADO_EM),
      casos: ac.filter(function (a) { return a.ID_USUARIO === u.ID_USUARIO && a.ATIVO === 'SIM'; }).map(function (a) { return { id: a.ID_CASO, rotulo: rot[a.ID_CASO] || a.ID_CASO }; })
    };
  });
}

function central3Pedidos() {
  pc3ExigirAdmin_();
  const rot = {}, nomeDe = {};
  pc3Ler_(PC3.ABA.CASOS).forEach(function (c) { rot[c.ID_CASO] = c.ROTULO; });
  pc3Ler_(PC3.ABA.USUARIOS).forEach(function (u) { nomeDe[u.ID_USUARIO] = u.NOME; });
  return pc3Ler_(PC3.ABA.PEDIDOS).sort(function (a, b) { return a.DATA_HORA < b.DATA_HORA ? 1 : -1; }).slice(0, 120).map(function (p) {
    return { protocolo: p.PROTOCOLO, casoId: p.ID_CASO, caso: rot[p.ID_CASO] || '', por: nomeDe[p.ID_USUARIO] || '', quando: pc3DataHora_(p.DATA_HORA), tipo: p.TIPO, mensagem: p.MENSAGEM, status: p.STATUS, resposta: p.RESPOSTA, respondidoEm: pc3DataHora_(p.RESPONDIDO_EM) };
  });
}

function central3ResponderPedido(protocolo, resposta, status) {
  pc3ExigirAdmin_();
  const p = pc3Ler_(PC3.ABA.PEDIDOS).filter(function (x) { return x.PROTOCOLO === String(protocolo); })[0];
  if (!p) throw new Error('Pedido não encontrado.');
  const st = status === 'Em análise' ? 'Em análise' : 'Respondido';
  const tx = pc3Texto_(resposta, 1200, true);
  if (st === 'Respondido' && tx.length < 2) throw new Error('Escreva a resposta ao cliente.');
  pc3Set_(PC3.ABA.PEDIDOS, p, { RESPOSTA: tx, STATUS: st, RESPONDIDO_EM: pc3Agora_() });
  pc3TocarCaso_(p.ID_CASO);
  pc3Audit_(pc3AtorAdmin_(), 'pedido_' + (st === 'Respondido' ? 'respondido' : 'analise'), p.ID_CASO, 'ok', p.PROTOCOLO);
  const u = pc3Ler_(PC3.ABA.USUARIOS).filter(function (x) { return x.ID_USUARIO === p.ID_USUARIO; })[0];
  if (u && u.TIPO === 'cliente' && st === 'Respondido') {
    try {
      MailApp.sendEmail({ to: u.EMAIL, subject: 'Atualização no seu painel do cliente',
        body: 'Olá, ' + String(u.NOME).split(' ')[0] + '.\n\nO escritório respondeu ao seu pedido ' + p.PROTOCOLO + '. Para ler, entre no seu painel:\n' + PC3.URL_PORTAL + '\n\nPor segurança, a resposta não vai neste e-mail.\n\nLucas Renan Semim · OAB/MG 222.539' });
    } catch (e) { /* sem e-mail, a resposta continua no painel */ }
  }
  return { ok: true };
}

function central3Registro(n) {
  pc3ExigirAdmin_();
  const v = pc3Ler_(PC3.ABA.AUDITORIA);
  return v.slice(-Math.min(Math.max(parseInt(n, 10) || 80, 1), 300)).reverse()
    .map(function (r) { return { quando: pc3DataHora_(r.DATA_HORA), ator: r.ATOR, acao: r.ACAO, caso: r.ID_CASO, resultado: r.RESULTADO, detalhe: r.DETALHE }; });
}

// ---------- Drive: pasta do cliente e biblioteca de documentos ----------
function pc3IdDrive_(txt) {                       // aceita link de pasta/arquivo do Drive ou o ID puro
  const s = String(txt == null ? '' : txt).trim();
  const m = s.match(/\/(?:folders|d)\/([A-Za-z0-9_-]{15,})/) || s.match(/[?&]id=([A-Za-z0-9_-]{15,})/);
  if (m) return m[1];
  return /^[A-Za-z0-9_-]{15,}$/.test(s) ? s : '';
}
// true se a pasta "raizId" é o próprio item ou uma pasta ancestral dele (sobe até 8 níveis)
function pc3DentroDe_(item, raizId) {
  const alvo = String(raizId), vistos = {};
  let nivel = [item];
  for (let prof = 0; prof < 8 && nivel.length; prof++) {
    const prox = [];
    for (let i = 0; i < nivel.length; i++) {
      if (nivel[i].getId() === alvo) return true;
      const ps = nivel[i].getParents();
      while (ps.hasNext()) {
        const p = ps.next(), pid = p.getId();
        if (pid === alvo) return true;
        if (!vistos[pid]) { vistos[pid] = 1; prox.push(p); }
      }
    }
    nivel = prox;
  }
  return false;
}
function pc3CasoPorId_(id) {
  const caso = pc3Ler_(PC3.ABA.CASOS).filter(function (c) { return c.ID_CASO === String(id); })[0];
  if (!caso) throw new Error('Caso não encontrado.');
  return caso;
}
function pc3CasoComPasta_(id) {
  const caso = pc3CasoPorId_(id);
  if (!caso.PASTA_DRIVE_ID) throw new Error('Ligue primeiro a pasta do cliente neste caso.');
  return caso;
}

/** Liga ao caso a pasta REAL do cliente no Drive (cole o link). Os envios do cliente passam a cair em <pasta>/06_Enviados_pelo_cliente. */
function central3LigarPasta(casoId, urlOuId) {
  pc3ExigirAdmin_();
  const caso = pc3CasoPorId_(casoId);
  const id = pc3IdDrive_(urlOuId);
  if (!id) throw new Error('Cole o link da pasta do cliente no Drive (ou o ID dela).');
  let nome, p;
  try { p = DriveApp.getFolderById(id); nome = p.getName(); } catch (e) { throw new Error('Não consegui abrir essa pasta com a sua conta Google. Confira se o link é de uma PASTA.'); }
  pc3ExigirPastaDeCliente_(p);
  pc3Set_(PC3.ABA.CASOS, caso, { PASTA_DRIVE_ID: id });
  pc3Audit_(pc3AtorAdmin_(), 'pasta_ligada', caso.ID_CASO, 'ok', '');
  return { id: id, nome: nome, url: 'https://drive.google.com/drive/folders/' + id };
}

/** Cria dentro da pasta do caso as subpastas padrão que ainda não existem (não mexe no que já existe). */
function central3CriarSubpastas(casoId) {
  pc3ExigirAdmin_();
  const caso = pc3CasoComPasta_(casoId);
  let raiz;
  try { raiz = DriveApp.getFolderById(caso.PASTA_DRIVE_ID); } catch (e) { throw new Error('A pasta ligada a este caso não abre. Ligue de novo.'); }
  pc3ExigirPastaDeCliente_(raiz);
  const criadas = pc3GarantirSubpastas_(raiz);
  pc3Audit_(pc3AtorAdmin_(), 'subpastas_criadas', caso.ID_CASO, 'ok', String(criadas.length));
  return { criadas: criadas, total: PC3.SUBPASTAS.length };
}

/** Projeto novo: cria a pasta padrão do caso em 01_Clientes (com as 8 subpastas). Para caso que ainda não tem pasta. */
function central3CriarPastaCaso(casoId) {
  pc3ExigirAdmin_();
  const caso = pc3CasoPorId_(casoId);
  if (!pc3Prop_('PC3_PASTA_RAIZ_ID')) throw new Error('Este projeto não tem a pasta-raiz do portal. Rode portal3Instalar no editor.');
  if (caso.PASTA_DRIVE_ID) throw new Error('Este caso já tem pasta no Drive.');
  const pasta = pc3CriarPastaCaso_(caso.ID_CASO);
  return { id: pasta.getId(), nome: pasta.getName(), url: pc3Url_(pasta) };
}

/** Projeto novo: "adota" a pasta que você ligou à mão. Move-a para 01_Clientes (ou 03_Arquivo_morto, se o caso está encerrado) e cria as subpastas padrão que faltam.
 *  Não renomeia, não apaga e não mexe nos arquivos que já estão dentro dela. Para desfazer, basta mover a pasta de volta pelo Drive. */
function central3AdotarPasta(casoId) {
  pc3ExigirAdmin_();
  const caso = pc3CasoComPasta_(casoId);
  if (!pc3Prop_('PC3_PASTA_RAIZ_ID')) throw new Error('Este projeto não tem a pasta-raiz do portal. Rode portal3Instalar no editor.');
  let pasta;
  try { pasta = DriveApp.getFolderById(caso.PASTA_DRIVE_ID); } catch (e) { throw new Error('A pasta ligada a este caso não abre. Ligue de novo.'); }
  pc3ExigirPastaDeCliente_(pasta);
  const clientes = pc3SubRaiz_('CLIENTES'), arquivo = pc3SubRaiz_('ARQUIVO'), pais = [], it = pasta.getParents();
  while (it.hasNext()) pais.push(it.next().getId());
  if (pais.indexOf(clientes.getId()) !== -1 || pais.indexOf(arquivo.getId()) !== -1) throw new Error('Esta pasta já faz parte da organização do portal.');
  const destino = caso.STATUS === 'ENCERRADO' ? arquivo : clientes;
  try { pasta.moveTo(destino); }
  catch (e) {
    pc3Audit_(pc3AtorAdmin_(), 'pasta_erro', caso.ID_CASO, 'erro', 'adotar: ' + String(e && e.message || e).slice(0, 120));
    throw new Error('Não consegui mover a pasta (você precisa ser o dono dela ou ter permissão de edição). Nada foi alterado.');
  }
  const criadas = pc3GarantirSubpastas_(pasta);
  pc3Audit_(pc3AtorAdmin_(), 'pasta_adotada', caso.ID_CASO, 'ok', criadas.length + ' subpasta(s) criada(s)');
  return { nome: pasta.getName(), destino: destino.getName(), url: pc3Url_(pasta), subpastasCriadas: criadas.length };
}

/** Mostra o que "Organizar arquivos soltos" faria nesta pasta (não move nada). */
function central3OrganizarPlano(casoId) {
  pc3ExigirAdmin_();
  const caso = pc3CasoComPasta_(casoId), pl = pc3PlanoArquivos_(caso);
  return {
    pasta: pl.pasta.getName(),
    itens: pl.itens.map(function (x) { return { id: x.id, nome: x.nome, destino: x.destino, palavra: x.palavra, criaPasta: !x.existe }; }),
    semRegra: pl.semRegra.slice(0, 20), semRegraTotal: pl.semRegra.length, cortado: pl.cortado
  };
}

/** Move os arquivos SOLTOS na raiz da pasta do caso para a subpasta sugerida pelo nome. O que não tem palavra-chave fica onde está. Nada é apagado. */
function central3OrganizarArquivos(casoId) {
  pc3ExigirAdmin_();
  const caso = pc3CasoComPasta_(casoId), pl = pc3PlanoArquivos_(caso);
  let movidos = 0, erros = 0;
  pl.itens.forEach(function (x) {
    try {
      let dest = pl.existentes[x.destino];
      if (!dest) { dest = pl.pasta.createFolder(x.destino); pl.existentes[x.destino] = dest; }
      x.f.moveTo(dest);
      movidos++;
    } catch (e) { erros++; }
  });
  pc3Audit_(pc3AtorAdmin_(), 'arquivos_organizados', caso.ID_CASO, erros ? 'avisos' : 'ok', movidos + ' arquivo(s)');
  return { movidos: movidos, semRegra: pl.semRegra.length, erros: erros };
}

/** Botão "Organizar agora" (a mesma conferência que a rotina diária faz sozinha). */
function central3OrganizarTudo() {
  pc3ExigirAdmin_();
  if (!pc3Prop_('PC3_PASTA_RAIZ_ID')) throw new Error('Este projeto não tem a pasta-raiz do portal. Rode portal3Instalar no editor.');
  const r = pc3OrganizarEstrutura_();
  r.resumo = pc3RegistrarRotina_(r, pc3AtorAdmin_());
  return r;
}

/** Mostra o conteúdo de UMA pasta do caso (a raiz ou uma subpasta), para você escolher o que liberar. */
function central3ListarPasta(casoId, pastaId) {
  pc3ExigirAdmin_();
  const caso = pc3CasoComPasta_(casoId), raizId = caso.PASTA_DRIVE_ID;
  const alvoId = pastaId ? pc3IdDrive_(pastaId) : raizId;
  if (!alvoId) throw new Error('Pasta inválida.');
  let pasta, raiz;
  try { raiz = DriveApp.getFolderById(raizId); pasta = alvoId === raizId ? raiz : DriveApp.getFolderById(alvoId); } catch (e) { throw new Error('Não consegui abrir a pasta. Ligue a pasta do cliente de novo.'); }
  pc3ExigirPastaDeCliente_(raiz);
  if (alvoId !== raizId && !pc3DentroDe_(pasta, raizId)) throw new Error('Essa pasta não pertence a este caso.');
  const pub = {};
  pc3Ler_(PC3.ABA.DOCUMENTOS).filter(function (x) { return x.ID_CASO === caso.ID_CASO && x.ORIGEM === 'escritorio'; }).forEach(function (x) { pub[x.DRIVE_ID] = x; });
  const subpastas = [], itf = pasta.getFolders();
  while (itf.hasNext() && subpastas.length < 80) { const f = itf.next(); subpastas.push({ id: f.getId(), nome: f.getName() }); }
  subpastas.sort(function (a, b) { return a.nome < b.nome ? -1 : a.nome > b.nome ? 1 : 0; });
  const arquivos = [], itx = pasta.getFiles();
  let cortado = false;
  while (itx.hasNext()) {
    if (arquivos.length >= 80) { cortado = true; break; }
    const f = itx.next(), mime = f.getMimeType(), p = pub[f.getId()];
    arquivos.push({ id: f.getId(), nome: f.getName(), permitido: PC3.MIMES_DOC.indexOf(mime) !== -1 || PC3.MIMES_NATIVOS.indexOf(mime) !== -1, docId: p ? p.ID : '', publicado: !!p, visivel: !!p && p.VISIVEL === 'SIM' });
  }
  arquivos.sort(function (a, b) { return a.nome < b.nome ? -1 : a.nome > b.nome ? 1 : 0; });
  const caminho = [];
  let cur = pasta;
  for (let g = 0; g < 8 && cur.getId() !== raizId; g++) {
    caminho.unshift({ id: cur.getId(), nome: cur.getName() });
    const ps = cur.getParents();
    if (!ps.hasNext()) break;
    cur = ps.next();
  }
  return { raiz: { id: raizId, nome: raiz.getName() }, atual: { id: pasta.getId(), nome: pasta.getName() }, caminho: caminho, subpastas: subpastas, arquivos: arquivos, cortado: cortado, grupos: PC3.GRUPOS_DOC };
}

/** Libera um arquivo da pasta do caso para o cliente baixar no painel. Só arquivos DENTRO da pasta do caso. */
function central3PublicarDoc(casoId, driveId, nome, grupo) {
  pc3ExigirAdmin_();
  const caso = pc3CasoComPasta_(casoId);
  const id = pc3IdDrive_(driveId);
  if (!id) throw new Error('Arquivo inválido.');
  let f, pastaCaso;
  try { pastaCaso = DriveApp.getFolderById(caso.PASTA_DRIVE_ID); } catch (e) { throw new Error('A pasta ligada a este caso não abre. Ligue de novo.'); }
  pc3ExigirPastaDeCliente_(pastaCaso);
  try { f = DriveApp.getFileById(id); } catch (e) { throw new Error('Não consegui abrir esse arquivo com a sua conta Google.'); }
  if (!pc3DentroDe_(f, caso.PASTA_DRIVE_ID)) throw new Error('Esse arquivo não está dentro da pasta deste caso. Mova-o para a pasta do cliente e tente de novo.');
  const mime = f.getMimeType(), nativo = PC3.MIMES_NATIVOS.indexOf(mime) !== -1;
  if (!nativo && PC3.MIMES_DOC.indexOf(mime) === -1) throw new Error('Tipo de arquivo não permitido no painel. Use PDF, imagem (JPG/PNG), Word, Excel ou texto.');
  const tam = nativo ? 0 : f.getSize();
  if (tam > PC3.DOC_MAX_BYTES) throw new Error('Arquivo maior que 8 MB. Reduza o tamanho ou entregue por outro meio.');
  const nm = pc3NomeComExt_(pc3NomeArquivo_(pc3Texto_(nome, 100) || f.getName()), nativo ? 'application/pdf' : mime);   // o cliente baixa com a extensão certa
  const gr = PC3.GRUPOS_DOC.indexOf(grupo) !== -1 ? grupo : 'Outros';
  const ex = pc3Ler_(PC3.ABA.DOCUMENTOS).filter(function (x) { return x.ID_CASO === caso.ID_CASO && x.ORIGEM === 'escritorio' && x.DRIVE_ID === id; })[0];
  let docId;
  if (ex) { pc3Set_(PC3.ABA.DOCUMENTOS, ex, { VISIVEL: 'SIM', NOME: nm, GRUPO: gr, MIME: mime, TAMANHO: String(tam) }); docId = ex.ID; }
  else {
    docId = pc3Travar_(function () {
      const ids = pc3Ler_(PC3.ABA.DOCUMENTOS).map(function (x) { return x.ID; });
      const nid = pc3NovoId_('D-', ids);
      pc3Add_(PC3.ABA.DOCUMENTOS, { ID: nid, ID_CASO: caso.ID_CASO, ID_USUARIO: '', DATA: pc3Hoje_(), NOME: nm, DRIVE_ID: id, ORIGEM: 'escritorio', VISIVEL: 'SIM', GRUPO: gr, MIME: mime, TAMANHO: String(tam) });
      return nid;
    });
  }
  pc3TocarCaso_(caso.ID_CASO);
  pc3Audit_(pc3AtorAdmin_(), 'doc_publicado', caso.ID_CASO, ex ? 'reativado' : 'ok', docId);
  return { id: docId, nome: nm, grupo: gr };
}

/** Mostra/esconde um documento da biblioteca do cliente (o arquivo continua no Drive). */
function central3DocVisivel(docId, visivel) {
  pc3ExigirAdmin_();
  const r = pc3Ler_(PC3.ABA.DOCUMENTOS).filter(function (x) { return x.ID === String(docId) && x.ORIGEM === 'escritorio'; })[0];
  if (!r) throw new Error('Documento não encontrado.');
  pc3Set_(PC3.ABA.DOCUMENTOS, r, { VISIVEL: visivel ? 'SIM' : 'NAO' });
  pc3Audit_(pc3AtorAdmin_(), visivel ? 'doc_visivel' : 'doc_oculto', r.ID_CASO, 'ok', r.ID);
  return { visivel: !!visivel };
}

function central3CriarTeste() {
  pc3ExigirAdmin_();
  return pc3CriarTeste_();
}

// ===================== INSTALAÇÃO E TESTE (rodar no editor) =====================
// Estas funções só rodam para o advogado (ou, antes da 1ª instalação, para quem rodar no editor).
function pc3GuardaSetup_() {
  if (!pc3AdminEmails_().length) return;
  if (!pc3EhAdmin_()) throw new Error('Acesso negado. Rode esta função no editor do Apps Script, logado com a conta do advogado.');
}

const PC3_LEIAME_ = [
  'PORTAL DO CLIENTE · DR. LUCAS SEMIM — como esta pasta funciona',
  '',
  'Esta pasta é criada e organizada automaticamente pelo script do Portal do Cliente. Não renomeie nem apague as 4 pastas numeradas.',
  '',
  '01_Clientes ........ uma pasta por caso: "Nome do caso (C-XXXXXX)". Dentro de cada uma ficam as 8 subpastas padrão (veja abaixo).',
  '02_Modelos ......... modelos de contrato, procuração e declaração (use à vontade).',
  '03_Arquivo_morto ... pastas de casos marcados como ENCERRADO na Central (voltam sozinhas para 01_Clientes se você reabrir o caso).',
  '04_Backups ......... cópia semanal da planilha do portal (aos domingos). Apague as antigas quando quiser.',
  'Planilha "Portal do Cliente – Banco de dados" ... é o banco do portal. Não apague nem edite à mão.',
  '',
  'Subpastas de cada caso:',
  '01_Contratos_e_Procuracoes · 02_Documentos_do_cliente · 03_Pecas_do_processo · 04_Decisoes_e_intimacoes · 05_Provas_e_laudos',
  '06_Enviados_pelo_cliente (o que o cliente envia pelo painel cai aqui) · 07_Para_o_cliente · 08_Administrativo_interno (o cliente nunca vê)',
  '',
  'O cliente só baixa o que você libera na Central de Comandos. Este script não compartilha nenhuma pasta com ninguém e não apaga arquivos de cliente.'
].join('\n');

// Monta (ou só confere) a árvore de pastas do portal no Drive. Pode rodar quantas vezes quiser: só cria o que falta.
function pc3MontarPastas_() {
  let raiz;
  if (pc3Prop_('PC3_PASTA_RAIZ_ID')) raiz = pc3Raiz_();
  else { raiz = DriveApp.createFolder(PC3.RAIZ_NOME); pc3SetProp_('PC3_PASTA_RAIZ_ID', raiz.getId()); }
  ['CLIENTES', 'MODELOS', 'ARQUIVO', 'BACKUPS'].forEach(function (k) { pc3SubRaiz_(k); });
  if (!raiz.getFilesByName('LEIA-ME.txt').hasNext()) raiz.createFile('LEIA-ME.txt', PC3_LEIAME_, 'text/plain');
  // a planilha criada por ESTE projeto mora dentro da raiz (uma vez só: se você mover depois, não desfazemos)
  if (pc3Prop_('PC3_PLANILHA_CRIADA') === '1' && pc3Prop_('PC3_PLANILHA_NA_RAIZ') !== '1' && pc3Prop_('PC3_PLANILHA_ID')) {
    DriveApp.getFileById(pc3Prop_('PC3_PLANILHA_ID')).moveTo(raiz);
    pc3SetProp_('PC3_PLANILHA_NA_RAIZ', '1');
  }
  return raiz;
}
function pc3LimparAbaPadrao_(ss) {                      // a planilha nova nasce com uma aba vazia ("Página1"/"Sheet1"): sai, para não atrapalhar
  try {
    const abas = ss.getSheets();
    if (abas.length < 2) return;
    const padrao = abas.filter(function (a) { return /^(Sheet|Planilha|Página|Pagina|Hoja|Feuille|Tabelle|Foglio)\s?\d+$/i.test(a.getName()) && a.getLastRow() === 0; })[0];
    if (padrao) ss.deleteSheet(padrao);
  } catch (_) {}
}
function pc3LigarRotina_() {
  const ja = ScriptApp.getProjectTriggers().filter(function (t) { return t.getHandlerFunction() === 'portal3Manutencao'; });
  if (!ja.length) ScriptApp.newTrigger('portal3Manutencao').timeBased().everyDays(1).atHour(PC3.ROTINA_HORA).inTimezone(PC3.TZ).create();
  pc3SetProp_('PC3_ROTINA_LIGADA', '1');
  return ja.length ? 'já estava ligada' : 'ligada (todo dia por volta das ' + PC3.ROTINA_HORA + 'h)';
}

/** 1) Rode UMA VEZ e aceite as permissões.
 *  PROJETO NOVO (script avulso): cria a planilha, a pasta-raiz no Drive com as pastas padrão, o segredo das senhas, a lista de advogados e a rotina diária.
 *  PROJETO ANTIGO (preso à planilha): usa a planilha em que o script mora; não cria pasta-raiz nem rotina (portal3MontarPastas faz isso, se você quiser). */
function portal3Instalar() {
  pc3GuardaSetup_();
  let ss = null, criou = false;
  const idSalvo = pc3Prop_('PC3_PLANILHA_ID');
  if (idSalvo) { try { ss = SpreadsheetApp.openById(idSalvo); } catch (e) { throw new Error('A planilha guardada em PC3_PLANILHA_ID não abre com esta conta. Confira a propriedade (ou apague-a para criar uma planilha nova).'); } }
  if (!ss) { try { ss = SpreadsheetApp.getActiveSpreadsheet(); } catch (_) {} }
  if (!ss) { const id = pc3Prop_('ID_PLANILHA_TRIAGEM'); if (id) ss = SpreadsheetApp.openById(id); }
  if (!ss) { ss = SpreadsheetApp.create(PC3.PLANILHA_NOME); criou = true; }       // projeto novo: cria a planilha de dados
  pc3SetProp_('PC3_PLANILHA_ID', ss.getId());
  if (criou) pc3SetProp_('PC3_PLANILHA_CRIADA', '1');
  PC3_SS_ = ss;
  Object.keys(PC3.ABA).forEach(function (k) { pc3Aba_(PC3.ABA[k]); });
  if (criou) pc3LimparAbaPadrao_(ss);
  if (!pc3Prop_('PC3_PEPPER')) pc3SetProp_('PC3_PEPPER', pc3RandHex_(64));
  const eu = String(Session.getEffectiveUser().getEmail() || '').toLowerCase();
  if (!pc3Prop_('PC3_ADMIN_EMAILS') && eu) pc3SetProp_('PC3_ADMIN_EMAILS', eu);
  // projeto novo: monta o Drive (pasta-raiz + 01..04 + LEIA-ME) e leva a planilha para dentro dela
  const raiz = (pc3Prop_('PC3_PLANILHA_CRIADA') === '1' || pc3Prop_('PC3_PASTA_RAIZ_ID')) ? pc3MontarPastas_() : null;
  // toca nos serviços para o Google pedir todas as autorizações agora
  MailApp.getRemainingDailyQuota();
  DriveApp.getRootFolder().getName();
  CalendarApp.getDefaultCalendar().getName();
  let rotina = 'não ligada (projeto preso à planilha; portal3LigarRotinaDiaria liga, se quiser)';
  if (raiz) { try { rotina = pc3LigarRotina_(); } catch (e) { rotina = 'NÃO ligada: ' + String(e && e.message || e); } }
  Logger.log([
    'Portal V3 instalado.',
    'Planilha de dados: ' + ss.getName() + (criou ? ' (criada agora)' : '') + ' → ' + pc3ResumoDrive_().planilhaUrl,
    raiz ? 'Pasta-raiz no Drive: ' + pc3Url_(raiz) : 'Pasta-raiz no Drive: não configurada (modo projeto antigo)',
    'Rotina diária de pastas: ' + rotina,
    'Advogados autorizados: ' + pc3Prop_('PC3_ADMIN_EMAILS'),
    'Abas: ' + Object.keys(PC3.ABA).map(function (k) { return PC3.ABA[k]; }).join(', ')
  ].join('\n'));
}

/** Confere/monta a árvore de pastas do portal no Drive (só cria o que falta). Use se o projeto está preso à planilha antiga e você quer as pastas automáticas. */
function portal3MontarPastas() {
  pc3GuardaSetup_();
  const raiz = pc3MontarPastas_();
  Logger.log('Pastas do portal conferidas. Raiz: ' + pc3Url_(raiz));
}

/** Liga a rotina diária (cria o que falta nas pastas e arruma o lugar delas; cópia da planilha aos domingos). Não apaga nada. */
function portal3LigarRotinaDiaria() {
  pc3GuardaSetup_();
  if (!pc3Prop_('PC3_PASTA_RAIZ_ID')) throw new Error('Sem pasta-raiz do portal. Rode portal3Instalar (projeto novo) ou portal3MontarPastas primeiro.');
  Logger.log('Rotina diária: ' + pc3LigarRotina_() + '.');
}
function portal3DesligarRotinaDiaria() {
  pc3GuardaSetup_();
  let n = 0;
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'portal3Manutencao') { ScriptApp.deleteTrigger(t); n++; } });
  pc3SetProp_('PC3_ROTINA_LIGADA', '0');
  Logger.log('Rotina diária desligada (' + n + ' gatilho(s) removido(s)). As pastas continuam como estão.');
}

/** É isto que o gatilho diário chama (roda sem ninguém na tela). Cria o que falta, arruma o lugar das pastas e, aos domingos, copia a planilha. Não apaga nada. */
function portal3Manutencao() {
  if (!pc3Prop_('PC3_PASTA_RAIZ_ID')) { Logger.log('Sem pasta-raiz do portal: nada a organizar.'); return; }
  const r = pc3OrganizarEstrutura_();
  let backup = '';
  try { if (pc3DiaSemana_() === 0) backup = pc3Backup_(); } catch (e) { r.erros.push('cópia da planilha: ' + String(e && e.message || e).slice(0, 100)); }
  Logger.log('Rotina de pastas: ' + pc3RegistrarRotina_(r, 'sistema') + (backup ? '\nCópia da planilha: ' + backup : '') + (r.erros.length ? '\n' + r.erros.join('\n') : ''));
}

/** Faz agora uma cópia da planilha em 04_Backups (uma por dia; não apaga as antigas). */
function portal3BackupAgora() {
  pc3GuardaSetup_();
  const n = pc3Backup_();
  Logger.log(n ? 'Cópia da planilha: ' + n + ' (pasta 04_Backups).' : 'Sem pasta-raiz do portal: nada feito.');
}

/** Mostra o que está configurado (sem revelar segredos). */
function portal3Diagnostico() {
  pc3GuardaSetup_();
  const linhas = [];
  linhas.push('Planilha ligada: ' + (pc3Prop_('PC3_PLANILHA_ID') ? 'sim' + (pc3Prop_('PC3_PLANILHA_CRIADA') === '1' ? ' (criada por este projeto)' : ' (planilha do projeto antigo)') : 'NÃO (rode portal3Instalar)'));
  linhas.push('Pepper (segredo das senhas): ' + (pc3Prop_('PC3_PEPPER') ? 'definido' : 'NÃO definido'));
  linhas.push('Advogados autorizados: ' + (pc3AdminEmails_().join(', ') || 'NENHUM'));
  linhas.push('URL da Central guardada (para os e-mails): ' + (pc3Prop_('PC3_CENTRAL_URL') ? 'sim' : 'não (opcional)'));
  try { Object.keys(PC3.ABA).forEach(function (k) { linhas.push(PC3.ABA[k] + ': ' + (pc3Ler_(PC3.ABA[k]).length) + ' registro(s)'); }); } catch (e) { linhas.push('Erro ao ler as abas: ' + e.message); }
  linhas.push('ID_RAIZ_ESCRITORIO (Drive, projeto antigo): ' + ((typeof ID_RAIZ_ESCRITORIO !== 'undefined' && ID_RAIZ_ESCRITORIO) ? 'definido' : 'não definido'));
  try {
    const raiz = pc3Raiz_();
    linhas.push('Pasta-raiz do portal (Drive): ' + (raiz ? 'abre (' + raiz.getName() + ')' : 'não configurada (sem pastas automáticas)'));
    if (raiz) Object.keys(PC3.PASTAS_RAIZ).forEach(function (k) { linhas.push('  ' + PC3.PASTAS_RAIZ[k] + ': ' + (pc3Prop_(PC3_PROP_SUB_[k]) ? 'ok' : 'ainda não criada')); });
  } catch (e) { linhas.push('Pasta-raiz do portal: PROBLEMA — ' + e.message); }
  linhas.push('Rotina diária de pastas: ' + (pc3Prop_('PC3_ROTINA_LIGADA') === '1' ? 'ligada' : 'desligada') + ' | última: ' + (pc3Prop_('PC3_ULTIMA_ROTINA') ? pc3Prop_('PC3_ULTIMA_ROTINA').replace('|', ' — ') : 'nunca rodou'));
  try { const g = ScriptApp.getProjectTriggers().map(function (t) { return t.getHandlerFunction(); }); linhas.push('Gatilhos do projeto: ' + (g.join(', ') || 'nenhum')); } catch (e) { linhas.push('Gatilhos: não consegui ler (' + e.message + ')'); }
  linhas.push('Triagens do site (planilha antiga) no "Hoje": ' + (pc3Prop_('PC3_TRIAGEM_PLANILHA_ID') ? 'ligadas' : 'não ligadas (opcional: PC3_TRIAGEM_PLANILHA_ID)'));
  Logger.log(linhas.join('\n'));
}

/** Opcional: guarda a URL da Central (a que termina em /exec) para os e-mails de aviso. */
function portal3GuardarUrlCentral(url) {
  pc3GuardaSetup_();
  if (!/^https:\/\/script\.google\.com\/(?:a\/[^\/]+\/)?macros\/s\/[\w-]+\/exec$/.test(String(url || ''))) throw new Error('Informe a URL que termina em /exec.');
  pc3SetProp_('PC3_CENTRAL_URL', url);
  Logger.log('URL da Central guardada.');
}

function pc3CriarTeste_() {
  const email = 'cliente.teste@example.com';
  const existente = pc3Ler_(PC3.ABA.CASOS).filter(function (x) { return x.TIPO === 'teste'; })[0];
  const caso = existente ? existente.ID_CASO : pc3NovoCaso_({
    rotulo: 'TESTE – caso de demonstração', numero: '0000000-00.2026.8.13.0000', classe: 'Ação Penal (exemplo)', juizo: '1ª Vara Criminal (exemplo)', fase: 'Instrução',
    resumo: 'Exemplo: o processo está na fase de instrução. Isso significa que o juiz está reunindo as provas e ouvindo as testemunhas antes de decidir.',
    proximoPasso: 'Exemplo: aguardar a data da audiência e reunir os documentos que o advogado pediu.', resumoLiberado: true, contrato: true, procuracao: true, declaracao: false
  }, 'teste');
  // dados de exemplo só na primeira vez
  if (!pc3Ler_(PC3.ABA.ANDAMENTOS).some(function (a) { return a.ID_CASO === caso; })) {
    const d = function (dias) { return Utilities.formatDate(new Date(Date.now() - dias * 86400000), PC3.TZ, 'yyyy-MM-dd'); };
    pc3Travar_(function () {
      pc3Add_(PC3.ABA.ANDAMENTOS, { ID: 'A-TESTE1', ID_CASO: caso, DATA: d(10), EVENTO: 'Citação realizada (exemplo)', VISIVEL: 'SIM', CRIADO_EM: pc3Agora_() });
      pc3Add_(PC3.ABA.ANDAMENTOS, { ID: 'A-TESTE2', ID_CASO: caso, DATA: d(3), EVENTO: 'Juntada de petição da defesa (exemplo)', VISIVEL: 'SIM', CRIADO_EM: pc3Agora_() });
      pc3Add_(PC3.ABA.ANDAMENTOS, { ID: 'A-TESTE3', ID_CASO: caso, DATA: d(1), EVENTO: 'Audiência designada (exemplo)', VISIVEL: 'SIM', CRIADO_EM: pc3Agora_() });
      pc3Add_(PC3.ABA.DILIGENCIAS, { ID: 'G-TESTE1', ID_CASO: caso, DATA: d(2), TIPO: 'Visita ao presídio', TEXTO: 'Exemplo: visita ao assistido para explicar a fase do processo e ouvir as dúvidas da família.', STATUS: 'Feito', VISIVEL: 'SIM', CRIADO_EM: pc3Agora_() });
      pc3Add_(PC3.ABA.DILIGENCIAS, { ID: 'G-TESTE2', ID_CASO: caso, DATA: d(1), TIPO: 'Petição protocolada', TEXTO: 'Exemplo: pedido de revogação da prisão preventiva protocolado.', STATUS: 'Em andamento', VISIVEL: 'SIM', CRIADO_EM: pc3Agora_() });
    });
  }
  const us = pc3Ler_(PC3.ABA.USUARIOS).filter(function (u) { return u.EMAIL === email; })[0];
  let senha;
  if (us) {
    senha = pc3RandSenha_();
    const salt = pc3RandHex_(16);
    pc3Set_(PC3.ABA.USUARIOS, us, { SALT: salt, HASH: pc3HashSenha_(salt, pc3SenhaNorm_(senha)), STATUS: 'ATIVO', SESSVER: String((parseInt(us.SESSVER, 10) || 1) + 1) });
    CacheService.getScriptCache().remove('pc3f:' + pc3Sha_(email).slice(0, 32));
    pc3Vincular_(us.ID_USUARIO, caso);
  } else {
    const r = pc3CriarUsuario_('Maria Teste', email, 'teste', 'Usuário de demonstração');
    senha = r.senha;
    pc3Vincular_(r.id, caso);
  }
  pc3Audit_(pc3EmailAtivo_() ? pc3AtorAdmin_() : 'editor', 'teste_criado', caso, 'ok', '');
  return { email: email, senha: pc3SenhaBonita_(senha), url: PC3.URL_PORTAL, casoId: caso };
}

/** 2) Cria (ou renova a senha de) o usuário de DEMONSTRAÇÃO. A senha aparece só no Registro de execução. */
function portal3CriarUsuarioTeste() {
  pc3GuardaSetup_();
  const r = pc3CriarTeste_();
  Logger.log('USUÁRIO DE TESTE (dados fictícios)\nEndereço: ' + r.url + '\nE-mail: ' + r.email + '\nSenha: ' + r.senha + '\n(para outra senha, rode esta função de novo; ela renova)');
}

function pc3ApagarLinhas_(aba, filtro) {
  const sh = pc3Aba_(aba);
  const linhas = pc3Ler_(aba).filter(filtro).map(function (r) { return r._linha; }).sort(function (a, b) { return b - a; });
  linhas.forEach(function (l) { sh.deleteRow(l); });
  return linhas.length;
}

/** Remove todos os registros de TESTE (usuário, caso, andamentos, pedidos, documentos). Só mexe no que é do tipo teste. */
function portal3RemoverTeste() {
  pc3GuardaSetup_();
  const n = pc3Travar_(function () {
    const casosTeste = pc3Ler_(PC3.ABA.CASOS).filter(function (c) { return c.TIPO === 'teste'; }).map(function (c) { return c.ID_CASO; });
    const usTeste = pc3Ler_(PC3.ABA.USUARIOS).filter(function (u) { return u.TIPO === 'teste'; }).map(function (u) { return u.ID_USUARIO; });
    const doCaso = function (r) { return casosTeste.indexOf(r.ID_CASO) !== -1; };
    return [
      pc3ApagarLinhas_(PC3.ABA.ANDAMENTOS, doCaso), pc3ApagarLinhas_(PC3.ABA.DILIGENCIAS, doCaso),
      pc3ApagarLinhas_(PC3.ABA.DOCUMENTOS, doCaso), pc3ApagarLinhas_(PC3.ABA.PEDIDOS, doCaso),
      pc3ApagarLinhas_(PC3.ABA.ACESSOS, function (r) { return usTeste.indexOf(r.ID_USUARIO) !== -1 || casosTeste.indexOf(r.ID_CASO) !== -1; }),
      pc3ApagarLinhas_(PC3.ABA.CASOS, function (r) { return r.TIPO === 'teste'; }),
      pc3ApagarLinhas_(PC3.ABA.USUARIOS, function (r) { return r.TIPO === 'teste'; })
    ];
  });
  Logger.log('Teste removido. Linhas apagadas (andamentos, diligências, documentos, pedidos, acessos, casos, usuários): ' + n.join(', ') + '. Os arquivos enviados no teste continuam no Drive, na pasta do caso de teste (apague à mão se quiser).');
}

/** 3) Autoteste no AMBIENTE REAL do Google. Cria dados temporários, confere cada regra e apaga tudo no fim. */
function portal3Testes() {
  pc3GuardaSetup_();
  const falhas = [];
  const confere = function (cond, msg) { if (!cond) falhas.push(msg); };
  const chama = function (o) { return JSON.parse(portal3Rotear(o).getContent()); };
  const email = 'autoteste.portal@example.com', email2 = 'autoteste2.portal@example.com';
  let casoId = null, uids = [], pastaTeste = '';
  const limparUsuarios = function () { pc3ApagarLinhas_(PC3.ABA.USUARIOS, function (u) { return u.EMAIL === email || u.EMAIL === email2; }); };
  try {
    portal3Instalar();
    limparUsuarios();                                   // restos de uma execução anterior que tenha caído no meio
    const u = pc3CriarUsuario_('Autoteste', email, 'autoteste', 'apague'); uids.push(u.id);
    casoId = pc3NovoCaso_({ rotulo: 'AUTOTESTE', numero: '1', classe: 'x', juizo: 'x', fase: 'x', resumo: 'segredo do resumo', proximoPasso: 'p', resumoLiberado: false }, 'autoteste');
    pc3Vincular_(u.id, casoId);

    // 1) a planilha não pode "interpretar" nem "consertar" o que gravamos
    //    (no Google real, "=..." vira fórmula mesmo em célula de texto e um apóstrofo inicial some: veja pc3Esc_)
    const raros = ['=1+1', '=HYPERLINK("http://x","y")', "'abc", "''=x", '+55 31 98942-0094', '-1', '@x', '0012', ' =1+1', 'linha 1\nlinha 2'];
    raros.forEach(function (txt, k) { pc3Add_(PC3.ABA.ANDAMENTOS, { ID: 'A-AUT' + k, ID_CASO: casoId, DATA: '2026-01-02', EVENTO: txt, VISIVEL: 'SIM', CRIADO_EM: '0012345678901234567' }); });
    const lidos = pc3Ler_(PC3.ABA.ANDAMENTOS).filter(function (x) { return /^A-AUT\d$/.test(x.ID); });
    const alterados = raros.filter(function (txt, k) {
      const x = lidos.filter(function (y) { return y.ID === 'A-AUT' + k; })[0];
      return !x || x.EVENTO !== txt || x.DATA !== '2026-01-02' || x.CRIADO_EM !== '0012345678901234567';
    });
    confere(alterados.length === 0, 'a planilha alterou o que foi gravado (data, fórmula, apóstrofo ou número com zeros): ' + JSON.stringify(alterados));
    const reg0 = lidos.filter(function (y) { return y.ID === 'A-AUT0'; })[0];
    if (reg0) {                                         // a edição (pc3Set_) também grava o texto exato
      pc3Set_(PC3.ABA.ANDAMENTOS, reg0, { EVENTO: "'+x=1" });
      const depois = pc3Ler_(PC3.ABA.ANDAMENTOS).filter(function (y) { return y.ID === 'A-AUT0'; })[0];
      confere(depois && depois.EVENTO === "'+x=1", 'a edição alterou o texto gravado');
    }

    // 2) login
    let r = chama({ acao: 'portal_login', email: email, senha: 'ERRADA-0000' });
    confere(r.sucesso === false && /incorretos/.test(r.mensagem), 'senha errada deveria dar a mensagem única');
    r = chama({ acao: 'portal_login', email: 'naoexiste@example.com', senha: u.senha });
    confere(r.sucesso === false && /incorretos/.test(r.mensagem), 'e-mail inexistente deveria dar a MESMA mensagem');
    r = chama({ acao: 'portal_login', email: email, senha: pc3SenhaBonita_(u.senha).toLowerCase() });
    confere(r.sucesso === true && /^[a-f0-9]{64}$/.test(r.token), 'login correto (com hífens e minúsculas) deveria funcionar');
    const token = r.token;

    // 3) painel e liberação do resumo
    r = chama({ acao: 'portal_painel', token: token });
    confere(r.sucesso === true && r.resumo === '' && r.processo.numero === '1', 'resumo NÃO liberado não pode aparecer ao cliente');
    pc3Set_(PC3.ABA.CASOS, pc3Ler_(PC3.ABA.CASOS).filter(function (c) { return c.ID_CASO === casoId; })[0], { RESUMO_LIBERADO: 'SIM' });
    r = chama({ acao: 'portal_painel', token: token });
    confere(r.resumo === 'segredo do resumo', 'resumo liberado deveria aparecer');
    r = chama({ acao: 'portal_painel', token: 'a'.repeat(64) });
    confere(r.expirou === true, 'token falso deveria expirar');

    // 4) pedido
    r = chama({ acao: 'portal_pedido', token: token, tipo: 'Outro assunto', mensagem: '=HYPERLINK("http://x","clique") teste' });
    confere(r.sucesso === true && /^PC-\d{6}-[A-Z0-9]{4}$/.test(r.protocolo), 'pedido deveria gerar protocolo');
    const prot = r.protocolo;
    const ped = pc3Ler_(PC3.ABA.PEDIDOS).filter(function (p) { return p.PROTOCOLO === prot; })[0];
    confere(ped && ped.MENSAGEM.charAt(0) === ' ', 'mensagem começando com "=" deveria ser neutralizada');
    r = chama({ acao: 'portal_pedido', token: token, tipo: 'Assunto inventado', mensagem: 'teste teste' });
    confere(r.sucesso === false, 'assunto fora da lista deveria ser recusado');

    // 5) upload
    const pdfB64 = Utilities.base64Encode(Utilities.newBlob('%PDF-1.4 teste', 'application/pdf', 'a.pdf').getBytes());
    r = chama({ acao: 'portal_upload', token: token, nome: '../../etc/passwd.pdf', mimeType: 'application/pdf', data: pdfB64 });
    confere(r.sucesso === true && r.nome.indexOf('/') === -1, 'PDF válido deveria subir e o nome ser limpo');
    r = chama({ acao: 'portal_upload', token: token, nome: 'falso.pdf', mimeType: 'application/pdf', data: Utilities.base64Encode(Utilities.newBlob('<script>alert(1)</script>', 'text/plain', 'x').getBytes()) });
    confere(r.sucesso === false, 'arquivo que não é PDF (mesmo com tipo PDF) deveria ser recusado');

    // 5b) pastas automáticas (só quando este projeto tem a pasta-raiz do portal)
    if (pc3Prop_('PC3_PASTA_RAIZ_ID')) {
      const cp = pc3Ler_(PC3.ABA.CASOS).filter(function (c) { return c.ID_CASO === casoId; })[0];
      pastaTeste = (cp && cp.PASTA_DRIVE_ID) || '';
      confere(!!pastaTeste, 'o primeiro envio de arquivo deveria criar a pasta do caso');
      if (pastaTeste) {
        const pt = DriveApp.getFolderById(pastaTeste);
        confere(pc3DentroDe_(pt, pc3SubRaiz_('CLIENTES').getId()), 'a pasta do caso deveria nascer dentro de 01_Clientes');
        confere(PC3.SUBPASTAS.every(function (n) { return pt.getFoldersByName(n).hasNext(); }), 'a pasta do caso deveria ter as ' + PC3.SUBPASTAS.length + ' subpastas padrão');
        const up = pt.getFoldersByName(PC3.PASTA_UPLOAD);
        confere(up.hasNext() && up.next().getFiles().hasNext(), 'o PDF enviado deveria estar em 06_Enviados_pelo_cliente');
        const dadosCaso = { rotulo: 'AUTOTESTE', numero: '1', classe: 'x', juizo: 'x', fase: 'x', resumo: 'segredo do resumo', proximoPasso: 'p', resumoLiberado: true };
        central3SalvarCaso(casoId, Object.assign({ status: 'ENCERRADO' }, dadosCaso));
        confere(pc3DentroDe_(DriveApp.getFolderById(pastaTeste), pc3SubRaiz_('ARQUIVO').getId()), 'caso encerrado deveria levar a pasta para 03_Arquivo_morto');
        central3SalvarCaso(casoId, Object.assign({ status: 'ATIVO' }, dadosCaso));
        confere(pc3DentroDe_(DriveApp.getFolderById(pastaTeste), pc3SubRaiz_('CLIENTES').getId()), 'caso reaberto deveria voltar para 01_Clientes');
      }
    }

    // 6) outro usuário não vê o caso
    const u2 = pc3CriarUsuario_('Outro', email2, 'autoteste', 'apague'); uids.push(u2.id);
    const t2 = chama({ acao: 'portal_login', email: email2, senha: u2.senha }).token;
    r = chama({ acao: 'portal_painel', token: t2, casoId: casoId });
    confere(r.sucesso === true && r.processo.numero === '' && r.movimentacoes.length === 0, 'usuário SEM ligação não pode ver o caso, nem escolhendo o ID');
    r = chama({ acao: 'portal_pedido', token: t2, tipo: 'Outro assunto', mensagem: 'tentando pedir em caso alheio' });
    confere(r.sucesso === false, 'usuário SEM ligação não pode abrir pedido');

    // 7) Central (você está logado como advogado no editor)
    const est = central3Estado();
    confere(est && est.kpis && est.pedidosPendentes.some(function (p) { return p.protocolo === prot; }), 'Central deveria listar o pedido pendente');
    central3ResponderPedido(prot, 'Resposta de teste.', 'Respondido');
    r = chama({ acao: 'portal_painel', token: token });
    confere(r.pedidos.some(function (p) { return p.protocolo === prot && p.status === 'Respondido' && p.resposta === 'Resposta de teste.'; }), 'cliente deveria ver a resposta');
    const novo = central3RedefinirSenha(u.id);
    r = chama({ acao: 'portal_painel', token: token });
    confere(r.expirou === true, 'nova senha deveria derrubar a sessão antiga');
    r = chama({ acao: 'portal_login', email: email, senha: novo.senha });
    confere(r.sucesso === true, 'login com a senha nova deveria funcionar');

    // 8) trava de tentativas
    for (let i = 0; i < PC3.LOGIN_MAX_FALHAS; i++) chama({ acao: 'portal_login', email: email, senha: 'ERRADA' + i });
    r = chama({ acao: 'portal_login', email: email, senha: novo.senha });
    confere(r.sucesso === false && /Muitas tentativas/.test(r.mensagem), 'depois de ' + PC3.LOGIN_MAX_FALHAS + ' erros deveria travar, mesmo com a senha certa');
    central3RedefinirSenha(u.id);                       // nova senha também destrava
    // 9) bloquear derruba a sessão
    const u3 = central3RedefinirSenha(u.id);
    const t3 = chama({ acao: 'portal_login', email: email, senha: u3.senha }).token;
    central3Bloquear(u.id, true);
    r = chama({ acao: 'portal_painel', token: t3 });
    confere(r.expirou === true, 'acesso bloqueado deveria derrubar a sessão');
    r = chama({ acao: 'portal_logout', token: t3 });
    confere(r.sucesso === true, 'logout deveria responder sucesso');
  } catch (e) {
    falhas.push('Erro inesperado: ' + e.message);
  } finally {
    try {
      pc3Travar_(function () {
        const doCaso = function (r) { return r.ID_CASO === casoId; };
        [PC3.ABA.ANDAMENTOS, PC3.ABA.DILIGENCIAS, PC3.ABA.DOCUMENTOS, PC3.ABA.PEDIDOS].forEach(function (a) { pc3ApagarLinhas_(a, doCaso); });
        pc3ApagarLinhas_(PC3.ABA.ACESSOS, function (r) { return uids.indexOf(r.ID_USUARIO) !== -1 || r.ID_CASO === casoId; });
        pc3ApagarLinhas_(PC3.ABA.CASOS, doCaso);
        pc3ApagarLinhas_(PC3.ABA.USUARIOS, function (r) { return uids.indexOf(r.ID_USUARIO) !== -1 || r.EMAIL === email || r.EMAIL === email2; });
      });
      const c = CacheService.getScriptCache();
      [email, email2].forEach(function (m) { c.remove('pc3f:' + pc3Sha_(m).slice(0, 32)); c.remove('pc3b:' + pc3Sha_(m).slice(0, 32)); });
    } catch (e2) { falhas.push('Limpeza falhou: ' + e2.message); }
    try {                                                // a pasta de teste (só ela, pelo nome) vai para a lixeira do Drive
      if (pastaTeste) { const ft = DriveApp.getFolderById(pastaTeste); if (/^AUTOTESTE \(C-/.test(ft.getName())) ft.setTrashed(true); }
    } catch (e3) { /* sobra uma pasta de teste: inofensivo */ }
  }
  if (falhas.length) throw new Error('FALHAS DO PORTAL V3:\n- ' + falhas.join('\n- '));
  Logger.log('Todos os testes do Portal V3 passaram e os dados temporários foram apagados. ' + (pastaTeste ? '(A pasta de teste do Drive foi para a lixeira.)' : '(O PDF de teste ficou na pasta PORTAL_RECEBIDOS do Drive; pode apagar.)'));
}
