/**
 * 28 - ESCUDO DE SEGURANCA (04/10/2026)
 * Anti-spam, anti-dado-falso, quarentena, auditoria, protecao da planilha e backup.
 *
 * Principios:
 *  - O escudo NUNCA derruba um formulario por defeito proprio (tudo em try/catch, falha = deixa passar).
 *  - Nenhum dado pessoal vai para cache ou log em texto aberto (so hash). A aba QUARENTENA guarda o
 *    minimo para o advogado poder liberar um lead legitimo e e limpa sozinha apos 30 dias (LGPD).
 *  - Nenhum segredo fica no codigo. Chaves ficam em Propriedades do script.
 *  - Lead com cara de bot NAO cria pasta no Drive, NAO chama a IA e NAO entra no Dashboard.
 *    O bot recebe "sucesso" (nao aprende). Pessoa de verdade com erro de digitacao recebe mensagem clara.
 */

const ESCUDO = {
  ABA_QUARENTENA: "QUARENTENA",
  ABA_LOG: "LOG_SEGURANCA",
  LIMITE_GLOBAL_HORA: 40,        // envios "limpos" por hora, todos os formularios somados
  LIMITE_GLOBAL_URGENTE_HORA: 12, // urgencias por hora (teto proprio: robo nao dispara o plantao, cliente normal nao trava o plantao)
  LIMITE_ID_HORA: 5,             // por WhatsApp / e-mail / CPF
  LIMITE_ID_6H: 8,
  TEMPO_MIN_FORM_MS: 4000,       // formulario preenchido em menos de 4 s = robo
  SCORE_QUARENTENA: 60,
  SCORE_QUARENTENA_URGENTE: 90,  // caso urgente: so vai para a quarentena com sinais fortes de robo (nunca barrar familia de preso)
  SCORE_REVISAR: 30,
  MAX_ARQUIVOS: 8,
  LOGIN_MAX_FALHAS: 15,          // por canal (admin / portal antigo), janela abaixo
  LOGIN_JANELA_SEG: 900,
  RETENCAO_QUARENTENA_DIAS: 30,
  LOG_MAX_LINHAS: 3000,
  PASTA_BACKUP: "99_BACKUPS",
  BACKUPS_MANTER: 14
};

const ESCUDO_DDDS_ = "11 12 13 14 15 16 17 18 19 21 22 24 27 28 31 32 33 34 35 37 38 41 42 43 44 45 46 47 48 49 51 53 54 55 61 62 63 64 65 66 67 68 69 71 73 74 75 77 79 81 82 83 84 85 86 87 88 89 91 92 93 94 95 96 97 98 99".split(" ");

const ESCUDO_EMAILS_DESCARTAVEIS_ = ["mailinator.com", "guerrillamail.com", "10minutemail.com", "tempmail.com", "temp-mail.org", "yopmail.com", "trashmail.com", "sharklasers.com", "getnada.com", "dispostable.com", "maildrop.cc", "fakeinbox.com", "throwawaymail.com", "mohmal.com", "emailondeck.com", "tempail.com", "burnermail.io", "mailnesia.com", "spamgourmet.com", "moakt.com", "mintemail.com", "tempr.email", "discard.email"];

/* ------------------------------------------------------------------ */
/* UTILITARIOS                                                         */
/* ------------------------------------------------------------------ */

function escudoHash_(s) {
  const b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(s));
  return Utilities.base64EncodeWebSafe(b).slice(0, 16);
}

// Texto seguro para celula: corta tamanho, remove controle e neutraliza formula (=, +, -, @).
function escudoCel_(v, max) {
  const s = String(v == null ? "" : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").slice(0, max || 300);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}

function escudoSemAcento_(s) {
  return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// Contador atomico em cache (LockService). Devolve o valor depois de somar 1.
function escudoContar_(chave, ttl) {
  const lock = LockService.getScriptLock();
  let travou = false;
  try { lock.waitLock(3000); travou = true; } catch (e) { /* sem trava: segue */ }
  try {
    const c = CacheService.getScriptCache();
    const n = parseInt(c.get(chave) || "0", 10) + 1;
    c.put(chave, String(n), ttl);
    return n;
  } finally {
    if (travou) lock.releaseLock();
  }
}

function escudoAba_(nome, cabecalho) {
  const ss = (typeof ccPlanilha === "function" && ccPlanilha()) || SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(nome);
  if (!sh) {
    sh = ss.insertSheet(nome);
    sh.appendRow(cabecalho);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, cabecalho.length).setFontWeight("bold").setBackground("#1a1a1a").setFontColor("#d4af37");
  }
  return sh;
}

function escudoLog_(evento, origem, detalhe) {
  try {
    const sh = escudoAba_(ESCUDO.ABA_LOG, ["DATA/HORA", "EVENTO", "ORIGEM", "DETALHE"]);
    sh.appendRow([new Date(), escudoCel_(evento, 40), escudoCel_(origem, 40), escudoCel_(detalhe, 200)]);
  } catch (e) { /* log nunca derruba nada */ }
}

/* ------------------------------------------------------------------ */
/* VALIDADORES                                                         */
/* ------------------------------------------------------------------ */

// {ok, norm, motivo, suspeito}  norm = DDD + numero (10 ou 11 digitos)
// "suspeito" = numero valido, mas estranho (sequencia, internacional): nao barra, so soma pontos.
function escudoTelefone_(raw) {
  const bruto = String(raw == null ? "" : raw).trim();
  let d = bruto.replace(/\D/g, "");
  // brasileiro no exterior (+1..., +351...): aceita, com pequeno peso
  if (/^\+\s*(?!55)\d/.test(bruto)) {
    if (d.length >= 9 && d.length <= 15) return { ok: true, norm: "i" + d, suspeito: "tel_internacional" };
    return { ok: false, motivo: "tel_tamanho" };
  }
  if (d.length >= 12 && d.indexOf("55") === 0) d = d.slice(2);
  if (d.length !== 10 && d.length !== 11) return { ok: false, motivo: "tel_tamanho" };
  if (ESCUDO_DDDS_.indexOf(d.slice(0, 2)) < 0) return { ok: false, motivo: "tel_ddd" };
  const num = d.slice(2);
  if (d.length === 11 && num.charAt(0) !== "9") return { ok: false, motivo: "tel_celular_sem_9" };
  if (d.length === 10 && !/^[2-5]/.test(num)) return { ok: false, motivo: "tel_fixo_invalido" };
  if (/^(\d)\1+$/.test(num)) return { ok: false, motivo: "tel_repetido" };
  const fim = num.slice(-8);
  // sequencia (12345678 / 87654321) pode ser numero "bonito" de gente de verdade: so alerta, nao barra
  if ("01234567890".indexOf(fim) >= 0 || "09876543210".indexOf(fim) >= 0) return { ok: true, norm: d, suspeito: "tel_sequencia" };
  return { ok: true, norm: d };
}

function escudoCpfOk_(raw) {
  const c = String(raw == null ? "" : raw).replace(/\D/g, "");
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  for (let t = 9; t < 11; t++) {
    let soma = 0;
    for (let i = 0; i < t; i++) soma += parseInt(c.charAt(i), 10) * (t + 1 - i);
    const dv = ((soma * 10) % 11) % 10;
    if (dv !== parseInt(c.charAt(t), 10)) return false;
  }
  return true;
}

// Numero CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO  (DD = 98 - ((NNNNNNN AAAA J TR OOOO 00) mod 97))
function escudoCnjOk_(raw) {
  const d = String(raw == null ? "" : raw).replace(/\D/g, "");
  if (d.length !== 20) return false;
  const base = BigInt(d.slice(0, 7) + d.slice(9) + "00");
  return (98 - Number(base % BigInt(97))) === parseInt(d.slice(7, 9), 10);
}

// devolve lista [{pts, motivo}]
function escudoEmail_(raw) {
  const s = String(raw == null ? "" : raw).trim().toLowerCase();
  if (!s) return [];
  const r = [];
  if (!/^[^\s@]{2,64}@[^\s@]+\.[a-z]{2,}$/.test(s)) { r.push({ pts: 25, motivo: "email_invalido" }); return r; }
  const dom = s.split("@")[1];
  if (ESCUDO_EMAILS_DESCARTAVEIS_.indexOf(dom) >= 0) r.push({ pts: 50, motivo: "email_descartavel" });
  if (/^(test|teste|asdf|fake|aaa+|xxx+|nome|email|abc|qwerty)\d*@/.test(s)) r.push({ pts: 25, motivo: "email_teste" });
  return r;
}

function escudoNome_(raw) {
  const s = String(raw == null ? "" : raw).trim();
  const r = [];
  const sa = escudoSemAcento_(s).toLowerCase();
  if (s.length < 4) r.push({ pts: 30, motivo: "nome_curto" });
  else if (!/\s/.test(s)) r.push({ pts: 12, motivo: "nome_sem_sobrenome" });
  if (/\d/.test(s)) r.push({ pts: 25, motivo: "nome_com_numero" });
  if (/(https?:|www\.|\.com|\.br|@)/i.test(s)) r.push({ pts: 60, motivo: "nome_com_link" });
  if (/(.)\1{3,}/.test(s)) r.push({ pts: 30, motivo: "letras_repetidas" });
  if (/^(asdf|qwer|teste|test|fulano|beltrano|abc|xxx|aaa|nome|nulo|null|undefined)/.test(sa)) r.push({ pts: 40, motivo: "nome_teste" });
  if (s.length >= 4 && !/[aeiouy]/.test(sa)) r.push({ pts: 35, motivo: "nome_sem_vogal" });
  if (s.length > 80) r.push({ pts: 20, motivo: "nome_longo" });
  return r;
}

function escudoTexto_(t) {
  const s = String(t == null ? "" : t);
  const r = [];
  if (!s) return r;
  const links = (s.match(/https?:\/\/|www\./gi) || []).length;
  if (links >= 2) r.push({ pts: 40, motivo: "texto_varios_links" });
  else if (links === 1) r.push({ pts: 10, motivo: "texto_com_link" });
  if (/<\s*(script|a\s|img|iframe|svg|object)|on(error|load|click)\s*=|javascript:/i.test(s)) r.push({ pts: 70, motivo: "texto_html_script" });
  if (/(viagra|cialis|backlink|seo\s+services|ganhe\s+dinheiro|renda\s+extra|clique\s+aqui|bitcoin|forex|t\.me\/|telegram\.me|bit\.ly|casino\s+online)/i.test(s)) r.push({ pts: 45, motivo: "texto_spam" });
  if (s.length > 6000) r.push({ pts: 20, motivo: "texto_gigante" });
  return r;
}

// Junta todos os textos livres de um objeto (profundidade limitada) para a checagem de spam.
function escudoColetarTextos_(obj, prof) {
  const out = [];
  (function varre(o, n) {
    if (o == null || n > (prof || 2)) return;
    if (typeof o === "string") { if (o.length <= 20000) out.push(o); return; }
    if (typeof o === "object" && !Array.isArray(o)) Object.keys(o).forEach(function (k) { varre(o[k], n + 1); });
  })(obj, 0);
  return out;
}

/* ------------------------------------------------------------------ */
/* AVALIACAO E PORTAO                                                  */
/* ------------------------------------------------------------------ */

// p = {nome, whatsapp, email, cpf, cnj, textos:[], tempoMs, arquivos, turnstile, urgente}
function escudoAvaliar_(p) {
  const motivos = [];
  let score = 0;
  const soma = function (lista) { (lista || []).forEach(function (x) { score += x.pts; motivos.push(x.motivo); }); };
  soma(escudoNome_(p.nome));
  soma(escudoEmail_(p.email));
  if (p.telSuspeito) { score += (p.telSuspeito === "tel_internacional" ? 10 : 25); motivos.push(p.telSuspeito); }
  (p.textos || []).forEach(function (t) { soma(escudoTexto_(t)); });
  const cpfD = String(p.cpf || "").replace(/\D/g, "");
  if (cpfD && !escudoCpfOk_(cpfD)) { score += 15; motivos.push("cpf_invalido"); }
  const cnjD = String(p.cnj || "").replace(/\D/g, "");
  if (cnjD && !escudoCnjOk_(cnjD)) { score += 10; motivos.push("cnj_invalido"); }
  if (p.arquivos > ESCUDO.MAX_ARQUIVOS) { score += 40; motivos.push("muitos_arquivos"); }
  if (typeof p.tempoMs === "number") {
    if (p.tempoMs < ESCUDO.TEMPO_MIN_FORM_MS) { score += 50; motivos.push("rapido_demais"); }
  } else { score += 8; motivos.push("sem_telemetria"); }
  return { score: score, motivos: motivos };
}

function escudoTurnstile_(token) {
  const sec = PropertiesService.getScriptProperties().getProperty("TURNSTILE_SECRET");
  if (!sec) return { ativo: false, ok: true };
  if (!token) return { ativo: true, ok: false };
  try {
    const r = UrlFetchApp.fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "post", payload: { secret: sec, response: String(token).slice(0, 2048) }, muteHttpExceptions: true });
    return { ativo: true, ok: JSON.parse(r.getContentText()).success === true };
  } catch (e) {
    return { ativo: true, ok: true, erro: true }; // queda do servico nao derruba o formulario de um cliente urgente
  }
}

function escudoQuarentena_(origem, p, score, motivos, status) {
  try {
    const sh = escudoAba_(ESCUDO.ABA_QUARENTENA, ["DATA/HORA", "ORIGEM", "STATUS", "SCORE", "MOTIVOS", "NOME", "WHATSAPP", "E-MAIL", "TRECHO DO TEXTO"]);
    sh.appendRow([new Date(), origem, status, score, motivos.join(", "), escudoCel_(p.nome, 80), escudoCel_(String(p.whatsapp || "").replace(/\D/g, ""), 20), escudoCel_(p.email, 80), escudoCel_((p.textos || []).join(" | "), 300)]);
  } catch (e) { /* nunca derruba */ }
}

/**
 * Chamar no inicio de cada formulario publico, depois do honeypot e do consentimento.
 * Devolve {quarentena:boolean, revisar:boolean, score, motivos}.
 * Lanca Error com mensagem amigavel quando a pessoa pode corrigir (WhatsApp invalido, limite).
 * Se o proprio escudo falhar, deixa o envio passar.
 */
function escudoPortao_(origem, p) {
  let tel;
  try {
    tel = escudoTelefone_(p.whatsapp);
    if (!tel.ok) {
      escudoLog_("tel_invalido", origem, tel.motivo);
      throw new Error("Confira seu WhatsApp: DDD + número (ex.: 31 99999-9999). Se for urgente, chame o plantão pelo botão do site.");
    }
  } catch (err) {
    if (/WhatsApp/.test(String(err.message))) throw err;
    return { quarentena: false, revisar: false, score: 0, motivos: ["escudo_falhou"] };
  }
  try {
    p.telSuspeito = tel.suspeito || "";
    const av = escudoAvaliar_(p);
    const ts = escudoTurnstile_(p.turnstile);
    if (ts.ativo && !ts.ok) { av.score += 70; av.motivos.push("turnstile_falhou"); }
    const corteQuarentena = p.urgente ? ESCUDO.SCORE_QUARENTENA_URGENTE : ESCUDO.SCORE_QUARENTENA;
    if (av.score >= corteQuarentena) {
      escudoQuarentena_(origem, p, av.score, av.motivos, "QUARENTENA");
      escudoLog_("quarentena", origem, "score " + av.score + ": " + av.motivos.join(","));
      return { quarentena: true, revisar: false, score: av.score, motivos: av.motivos };
    }
    const lim = escudoLimites_(p, tel.norm);
    if (lim) {
      escudoLog_("limite_excedido", origem, lim);
      throw new Error("Muitos envios em pouco tempo. Se for urgente, chame o plantão pelo WhatsApp.");
    }
    if (av.score >= ESCUDO.SCORE_REVISAR) {
      escudoQuarentena_(origem, p, av.score, av.motivos, "ACEITO - REVISAR");
      escudoLog_("revisar", origem, "score " + av.score + ": " + av.motivos.join(","));
      return { quarentena: false, revisar: true, score: av.score, motivos: av.motivos };
    }
    return { quarentena: false, revisar: false, score: av.score, motivos: av.motivos };
  } catch (err2) {
    if (/Muitos envios/.test(String(err2.message))) throw err2;
    escudoLog_("escudo_falhou", origem, String(err2.message).slice(0, 150));
    return { quarentena: false, revisar: false, score: 0, motivos: ["escudo_falhou"] };
  }
}

function escudoLimites_(p, telNorm) {
  const ids = ["t" + escudoHash_(telNorm)];
  const em = String(p.email || "").toLowerCase().trim();
  if (em) ids.push("e" + escudoHash_(em));
  const cpfD = String(p.cpf || "").replace(/\D/g, "");
  if (cpfD.length === 11) ids.push("c" + escudoHash_(cpfD));
  const hora = Utilities.formatDate(new Date(), "America/Sao_Paulo", "yyyyMMddHH");
  // urgencia tem teto proprio: robo nao esgota o limite dos clientes normais e cliente normal nao trava o plantao
  if (p.urgente) {
    if (escudoContar_("esc_gu_" + hora, 3700) > ESCUDO.LIMITE_GLOBAL_URGENTE_HORA) return "global_urgente_hora";
  } else if (escudoContar_("esc_g_" + hora, 3700) > ESCUDO.LIMITE_GLOBAL_HORA) return "global_hora";
  for (let i = 0; i < ids.length; i++) {
    if (escudoContar_("esc_h_" + ids[i], 3600) > ESCUDO.LIMITE_ID_HORA) return "id_hora";
    if (escudoContar_("esc_6_" + ids[i], 21600) > ESCUDO.LIMITE_ID_6H) return "id_6h";
  }
  return "";
}

// Cadastro "generico" (fallback do doPost): exige corpo valido, nome e um contato verdadeiro.
// Devolve true = pode processar; false = ignorar silenciosamente.
function escudoPortaoLegado_(corpo) {
  try {
    if (!corpo || typeof corpo !== "object" || Array.isArray(corpo)) { escudoLog_("legado_corpo_invalido", "intake_site", ""); return false; }
    if (corpo.honeypot || corpo.website) { escudoLog_("legado_honeypot", "intake_site", ""); return false; }
    const tel = corpo.telefone || corpo.whatsapp || corpo.celular || "";
    const email = corpo.email || "";
    const telOk = tel ? escudoTelefone_(tel).ok : false;
    const emOk = email ? (escudoEmail_(email).filter(function (x) { return x.pts >= 25; }).length === 0) : false;
    if (!corpo.nome || (!telOk && !emOk)) { escudoLog_("legado_sem_contato_valido", "intake_site", ""); return false; }
    const av = escudoAvaliar_({ nome: corpo.nome, email: email, cpf: corpo.cpf, textos: escudoColetarTextos_(corpo, 1), tempoMs: 99999 });
    if (av.score >= ESCUDO.SCORE_QUARENTENA) {
      escudoQuarentena_("intake_site", { nome: corpo.nome, whatsapp: tel, email: email, textos: escudoColetarTextos_(corpo, 1) }, av.score, av.motivos, "QUARENTENA");
      escudoLog_("quarentena", "intake_site", "score " + av.score);
      return false;
    }
    const lim = escudoLimites_({ email: email, cpf: corpo.cpf }, telOk ? escudoTelefone_(tel).norm : "sem-tel-" + escudoHash_(email));
    if (lim) { escudoLog_("limite_excedido", "intake_site", lim); return false; }
    return true;
  } catch (e) {
    return true; // falha do escudo nao derruba o cadastro
  }
}

/* ------------------------------------------------------------------ */
/* TRAVA DE LOGIN (painel admin e portal antigo)                       */
/* ------------------------------------------------------------------ */

function escudoLoginBloqueado_(canal) {
  try { return parseInt(CacheService.getScriptCache().get("esc_lf_" + canal) || "0", 10) >= ESCUDO.LOGIN_MAX_FALHAS; } catch (e) { return false; }
}

function escudoLoginFalhou_(canal) {
  try { escudoContar_("esc_lf_" + canal, ESCUDO.LOGIN_JANELA_SEG); escudoLog_("login_falhou", canal, ""); } catch (e) { /* nunca derruba */ }
}

/* ------------------------------------------------------------------ */
/* PROTECAO DA PLANILHA, BACKUP E AUDITORIA (rodar pelo menu)          */
/* ------------------------------------------------------------------ */

function escudoProtegerPlanilha() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dono = ss.getOwner() ? ss.getOwner().getEmail() : Session.getEffectiveUser().getEmail();
  const resumo = [];
  // 1) Abas do escudo: so o dono edita (o advogado le e filtra; o robo escreve como dono).
  [ESCUDO.ABA_LOG, ESCUDO.ABA_QUARENTENA].forEach(function (nome) {
    const sh = ss.getSheetByName(nome);
    if (!sh) return;
    sh.getProtections(SpreadsheetApp.ProtectionType.SHEET).forEach(function (p) { if (p.getDescription() === "Escudo") p.remove(); });
    const p = sh.protect().setDescription("Escudo");
    p.removeEditors(p.getEditors().filter(function (u) { return u.getEmail() !== dono; }));
    if (p.canDomainEdit()) p.setDomainEdit(false);
    resumo.push("aba " + nome + ": so o dono edita");
  });
  // 2) Dashboard: cabecalho e colunas com formula protegidos em modo aviso (evita estrago por engano).
  const dash = ss.getSheetByName("Dashboard Principal");
  if (dash) {
    dash.getProtections(SpreadsheetApp.ProtectionType.RANGE).forEach(function (p) { if (p.getDescription() === "Escudo: aviso") p.remove(); });
    const ult = Math.max(dash.getLastColumn(), 1);
    dash.getRange(1, 1, 2, ult).protect().setDescription("Escudo: aviso").setWarningOnly(true);
    if (dash.getLastRow() >= 3) {
      const formulas = dash.getRange(3, 1, 1, ult).getFormulas()[0];
      let cols = 0;
      for (let c = 0; c < formulas.length; c++) {
        if (formulas[c]) { dash.getRange(3, c + 1, Math.max(dash.getLastRow() - 2, 1), 1).protect().setDescription("Escudo: aviso").setWarningOnly(true); cols++; }
      }
      resumo.push("Dashboard: cabecalho + " + cols + " colunas com formula protegidas (aviso)");
    }
  }
  const msg = resumo.length ? resumo.join("\n") : "Nada a proteger ainda (abas do escudo so existem depois do primeiro registro).";
  try { SpreadsheetApp.getUi().alert("Escudo — proteção aplicada", msg, SpreadsheetApp.getUi().ButtonSet.OK); } catch (e) { /* sem UI */ }
  escudoLog_("protecao_aplicada", "menu", resumo.join(" | "));
  return msg;
}

function escudoRemoverProtecoes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let n = 0;
  ss.getSheets().forEach(function (sh) {
    sh.getProtections(SpreadsheetApp.ProtectionType.SHEET).concat(sh.getProtections(SpreadsheetApp.ProtectionType.RANGE)).forEach(function (p) {
      if (/^Escudo/.test(p.getDescription())) { p.remove(); n++; }
    });
  });
  try { SpreadsheetApp.getUi().alert("Escudo", n + " proteção(ões) removida(s).", SpreadsheetApp.getUi().ButtonSet.OK); } catch (e) { /* sem UI */ }
  return n;
}

function escudoBackupDiario() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const raiz = DriveApp.getFolderById(ID_RAIZ_ESCRITORIO);
  const it = raiz.getFoldersByName(ESCUDO.PASTA_BACKUP);
  const pasta = it.hasNext() ? it.next() : raiz.createFolder(ESCUDO.PASTA_BACKUP);
  const nome = "BACKUP " + Utilities.formatDate(new Date(), "America/Sao_Paulo", "yyyy-MM-dd HHmm") + " - " + ss.getName();
  DriveApp.getFileById(ss.getId()).makeCopy(nome, pasta);
  // rodizio: mantem os mais recentes; o excedente vai para a lixeira (recuperavel por 30 dias)
  const arqs = [];
  const fi = pasta.getFiles();
  while (fi.hasNext()) { const f = fi.next(); if (/^BACKUP /.test(f.getName())) arqs.push(f); }
  arqs.sort(function (a, b) { return b.getDateCreated() - a.getDateCreated(); });
  for (let i = ESCUDO.BACKUPS_MANTER; i < arqs.length; i++) arqs[i].setTrashed(true);
  escudoLog_("backup_ok", "rotina", nome);
  return nome;
}

// Manutencao: limpa quarentena antiga (LGPD) e enxuga o log.
function escudoLimpeza_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const q = ss.getSheetByName(ESCUDO.ABA_QUARENTENA);
  if (q && q.getLastRow() > 1) {
    const corte = Date.now() - ESCUDO.RETENCAO_QUARENTENA_DIAS * 86400000;
    const datas = q.getRange(2, 1, q.getLastRow() - 1, 1).getValues();
    for (let i = datas.length - 1; i >= 0; i--) {
      const d = datas[i][0];
      if (d instanceof Date && d.getTime() < corte) q.deleteRow(i + 2);
    }
  }
  const lg = ss.getSheetByName(ESCUDO.ABA_LOG);
  if (lg && lg.getLastRow() > ESCUDO.LOG_MAX_LINHAS + 1) lg.deleteRows(2, lg.getLastRow() - ESCUDO.LOG_MAX_LINHAS - 1);
}

function escudoManutencaoDiaria() {
  try { escudoBackupDiario(); } catch (e) { escudoLog_("backup_falhou", "rotina", String(e.message).slice(0, 150)); }
  try { escudoLimpeza_(); } catch (e2) { escudoLog_("limpeza_falhou", "rotina", String(e2.message).slice(0, 150)); }
}

// Cria o gatilho diario (3h da manha). Rodar uma vez pelo menu.
function escudoInstalarRotinas() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === "escudoManutencaoDiaria") ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger("escudoManutencaoDiaria").timeBased().everyDays(1).atHour(3).create();
  try { SpreadsheetApp.getUi().alert("Escudo", "Backup diário e limpeza instalados (todo dia por volta das 3h). Backups ficam na pasta " + ESCUDO.PASTA_BACKUP + " (14 mais recentes).", SpreadsheetApp.getUi().ButtonSet.OK); } catch (e) { /* sem UI */ }
}

// Relatorio de seguranca: quem tem acesso, links publicos, segredos e travas ativas.
function escudoAuditoria() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const L = [];
  const dono = ss.getOwner() ? ss.getOwner().getEmail() : "?";
  L.push("DONO DA PLANILHA: " + dono);
  const eds = ss.getEditors().map(function (u) { return u.getEmail(); }).filter(function (m) { return m !== dono; });
  L.push("EDITORES: " + (eds.length ? eds.join(", ") : "nenhum além do dono"));
  const vis = ss.getViewers().map(function (u) { return u.getEmail(); });
  L.push("SO LEITURA: " + (vis.length ? vis.join(", ") : "ninguém"));
  const alvos = [["Planilha", DriveApp.getFileById(ss.getId())], ["Pasta raiz", DriveApp.getFolderById(ID_RAIZ_ESCRITORIO)]];
  alvos.forEach(function (a) {
    const acc = a[1].getSharingAccess(), perm = a[1].getSharingPermission();
    const publico = (acc === DriveApp.Access.ANYONE || acc === DriveApp.Access.ANYONE_WITH_LINK);
    L.push((publico ? "⚠️ " : "OK ") + a[0] + ": compartilhamento " + acc + " / " + perm);
  });
  const props = PropertiesService.getScriptProperties().getKeys();
  L.push("SEGREDOS NO COFRE (só nomes): " + props.filter(function (k) { return !/^rs:/.test(k); }).join(", "));
  L.push(PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY") ? "OK chave Gemini no cofre" : "⚠️ chave Gemini ausente do cofre");
  L.push(PropertiesService.getScriptProperties().getProperty("TURNSTILE_SECRET") ? "OK Turnstile (anti-robô) ativo" : "Turnstile (anti-robô) ainda não configurado");
  L.push(PropertiesService.getScriptProperties().getProperty("ADMIN_PANEL_HASH") ? "OK senha do painel admin guardada só como hash" : "painel admin sem senha definida");
  const gat = ScriptApp.getProjectTriggers().map(function (t) { return t.getHandlerFunction(); });
  L.push("GATILHOS ATIVOS: " + (gat.length ? gat.join(", ") : "nenhum"));
  const q = ss.getSheetByName(ESCUDO.ABA_QUARENTENA);
  L.push("QUARENTENA: " + (q ? Math.max(q.getLastRow() - 1, 0) : 0) + " registro(s) para revisar");
  const txt = L.join("\n");
  Logger.log(txt);
  try { SpreadsheetApp.getUi().alert("Escudo — auditoria de segurança", txt, SpreadsheetApp.getUi().ButtonSet.OK); } catch (e) { /* sem UI */ }
  return txt;
}

function escudoAbrirQuarentena() {
  const sh = escudoAba_(ESCUDO.ABA_QUARENTENA, ["DATA/HORA", "ORIGEM", "STATUS", "SCORE", "MOTIVOS", "NOME", "WHATSAPP", "E-MAIL", "TRECHO DO TEXTO"]);
  SpreadsheetApp.getActive().setActiveSheet(sh);
}

/* ------------------------------------------------------------------ */
/* TESTES (nao gravam nada). Rodar: escudoTestes                       */
/* ------------------------------------------------------------------ */

function escudoTestes() {
  const falhas = [];
  const t = function (nome, cond) { if (!cond) falhas.push(nome); };
  t("tel ok 31 9", escudoTelefone_("(31) 98394-4973").ok);
  t("tel +55", escudoTelefone_("+55 31 98394-4973").ok);
  t("tel ddd invalido", !escudoTelefone_("(10) 98394-4973").ok);
  t("tel repetido", !escudoTelefone_("31 99999-9999").ok);
  t("tel sequencia vira alerta", escudoTelefone_("31 91234-5678").ok && escudoTelefone_("31 91234-5678").suspeito === "tel_sequencia");
  t("tel internacional", escudoTelefone_("+1 415 555 2671").ok && escudoTelefone_("+1 415 555 2671").suspeito === "tel_internacional");
  t("tel +55 continua BR", escudoTelefone_("+55 31 98394-4973").norm === "31983944973");
  t("tel curto", !escudoTelefone_("3198").ok);
  t("tel fixo ok", escudoTelefone_("(31) 3333-4455").ok);
  t("cpf valido", escudoCpfOk_("529.982.247-25"));
  t("cpf invalido", !escudoCpfOk_("111.111.111-11") && !escudoCpfOk_("529.982.247-24"));
  t("cnj valido", escudoCnjOk_("5007368-51.2026.8.13.0672"));
  t("cnj tamanho", !escudoCnjOk_("123"));
  t("urgente tem corte maior", ESCUDO.SCORE_QUARENTENA_URGENTE > ESCUDO.SCORE_QUARENTENA);
  t("email descartavel", escudoEmail_("a@mailinator.com").length > 0);
  t("email ok", escudoEmail_("maria.silva@gmail.com").length === 0);
  t("nome ok", escudoNome_("Maria da Silva Souza").length === 0);
  t("nome lixo", escudoNome_("asdfgh").length > 0);
  t("texto spam", escudoTexto_("compre backlink em http://x.com e http://y.com").length >= 2);
  t("texto normal", escudoTexto_("Meu filho foi preso ontem em Sabará e preciso de ajuda urgente.").length === 0);
  const bot = escudoAvaliar_({ nome: "xxxx", whatsapp: "31 99999-9999", email: "a@mailinator.com", textos: ["http://a.com http://b.com"], tempoMs: 800 });
  t("bot pontua alto", bot.score >= ESCUDO.SCORE_QUARENTENA);
  const gente = escudoAvaliar_({ nome: "João Pedro Almeida", email: "joao@gmail.com", textos: ["Preciso de advogado para audiência de custódia"], tempoMs: 45000 });
  t("gente pontua baixo", gente.score < ESCUDO.SCORE_REVISAR);
  const msg = falhas.length ? "FALHOU: " + falhas.join(" | ") : "Todos os testes do Escudo passaram.";
  Logger.log("[ESCUDO] " + msg);
  try { SpreadsheetApp.getUi().alert("Escudo — testes", msg, SpreadsheetApp.getUi().ButtonSet.OK); } catch (e) { /* sem UI */ }
  return msg;
}
