/**
 * 23 - API CENTRAL DO CASO (SITE lucassemim.adv.br/diagnostico.html) V1.0
 * -----------------------------------------------------------------------
 * Recebe o caso montado pelo cliente no site e faz, em ordem:
 *   1. URGÊNCIA primeiro: e-mail de despacho + evento na Agenda (com local e rota)
 *      ANTES de qualquer trabalho pesado.
 *   2. Localiza (por CPF / nº CNJ) ou cria a pasta do cliente em 01_CLIENTES,
 *      reaproveitando as 3 gavetas padrão (01_Docs_Pessoais, 02_Provas,
 *      03_Andamentos_Despachos).
 *   3. Guarda os arquivos na gaveta certa (REDS/intimação/peças -> 03).
 *   4. Lê o REDS por OCR (se veio PDF/foto) e pede ao Gemini uma TRIAGEM
 *      (resumo, urgência 1-5, checklist da 1ª ação, documentos faltando...).
 *      A IA só organiza para o advogado: NADA disso volta para o cliente.
 *   5. Cria a "FICHA DE TRIAGEM" (Google Doc) dentro de 03_Andamentos_Despachos.
 *   6. Registra uma linha na aba TRIAGEM_SITE da planilha.
 *   7. Se veio data de audiência/prazo, cria evento na Agenda.
 *   8. Devolve ao site o PROTOCOLO (LS-AAMMDD-XXXX).
 *
 * DEPENDÊNCIAS (já existem no projeto "Advogado Live"):
 *   - 00_Config_Menu: ID_RAIZ_ESCRITORIO, API_KEY, MODEL_FLASH
 *   - Serviço avançado "Drive API" (v2) ligado, o mesmo usado em 21_LeitorREDS
 *     (só para OCR; se não estiver ligado a triagem segue sem ler o REDS).
 *
 * COMO LIGAR: veja INSTALAR_CENTRAL_DO_CASO.md (2 linhas no doPost + 1 autorização).
 */

// ===================== CONFIGURAÇÃO =====================
const CC_ABA = 'TRIAGEM_SITE';
// Quem recebe o despacho. 'email' vazio = e-mail da conta dona do script.
// 'cidades': lista de cidades que a pessoa cobre; '*' = qualquer uma.
const CC_ADVOGADOS = [
  { nome: 'Dr. Lucas Semim', email: '', whatsapp: '5531989420094', cidades: ['*'] }
  // Exemplo de segundo advogado/estagiário de plantão:
  // , { nome: 'Dr. Fulano', email: 'fulano@email.com', whatsapp: '5531999999999', cidades: ['Contagem', 'Betim'] }
];
const CC_LIMITE_ENVIOS_HORA = 6;     // por WhatsApp informado (anti-abuso)
const CC_MAX_ARQUIVOS = 15;
const CC_MIMES_OK = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

// ===================== PONTO DE ENTRADA =====================
function processarCentralCaso(e) {
  try {
    const d = JSON.parse(e.postData.contents);

    // robô (campo escondido preenchido): finge sucesso e não grava nada
    if (d.honeypot) return ccJson({ status: 'sucesso', protocolo: 'LS-OK', clienteNovo: true });

    if (!d.consentimento || d.consentimento.lgpd !== true) throw new Error('Consentimento LGPD ausente.');
    const contato = d.contato || {}, pessoa = d.pessoa || {}, local = d.local || {}, caso = d.caso || {}, busca = d.busca || {};
    if (!ccS(contato.nome) || !ccS(contato.whatsapp)) throw new Error('Nome e WhatsApp são obrigatórios.');
    ccLimiteTaxa(contato.whatsapp);

    const urgente = d.urgente === true;
    const protocolo = ccProtocolo();
    const nomePessoa = (ccS(pessoa.nome) || ccS(contato.nome)).toUpperCase();
    const adv = ccEscolherAdvogado(local.cidade);
    const emailAdv = adv.email || Session.getEffectiveUser().getEmail();

    // ---------- 1. URGÊNCIA PRIMEIRO ----------
    let eventoUrl = '';
    if (urgente) {
      eventoUrl = ccDespacharUrgente(d, protocolo, nomePessoa, adv, emailAdv);
    }

    // ---------- 2. PASTA DO CLIENTE ----------
    const pastaRaiz = DriveApp.getFolderById(ID_RAIZ_ESCRITORIO);
    const it = pastaRaiz.getFoldersByName('01_CLIENTES');
    const pastaClientes = it.hasNext() ? it.next() : pastaRaiz;

    const cpfD = ccDig(pessoa.cpf), cnjD = ccDig(caso.cnj);
    let pasta = ccAcharPasta(pastaClientes, cpfD, cnjD);
    const clienteNovo = !pasta;
    if (!pasta) {
      let nomePasta = nomePessoa;
      if (cpfD.length === 11) nomePasta += ' - CPF ' + ccS(pessoa.cpf);
      if (cnjD.length === 20) nomePasta += ' - Proc: ' + ccS(caso.cnj);
      else if (cpfD.length !== 11) nomePasta += ' - ' + protocolo;
      pasta = pastaClientes.createFolder(nomePasta);
    }
    const gDocs = ccGaveta(pasta, '01_Docs_Pessoais');
    const gProvas = ccGaveta(pasta, '02_Provas');
    const gAnd = ccGaveta(pasta, '03_Andamentos_Despachos');

    // ---------- 3. ARQUIVOS + OCR DO REDS ----------
    const arquivos = (d.arquivos || []).slice(0, CC_MAX_ARQUIVOS);
    const salvos = [];
    let textoOcr = '';
    let ocrUsados = 0;
    arquivos.forEach(function (arq) {
      if (CC_MIMES_OK.indexOf(arq.mimeType) === -1) return;
      const limpo = ccS(arq.nome).replace(/^[A-Z]+__/, '');
      const blob = Utilities.newBlob(Utilities.base64Decode(arq.data), arq.mimeType, protocolo + '_' + limpo);
      const cat = ccS(arq.categoria);
      const dest = cat === 'pessoal' ? gDocs : cat === 'prova' ? gProvas : gAnd;
      const f = dest.createFile(blob);
      salvos.push({ nome: f.getName(), categoria: cat, url: f.getUrl() });
      if ((cat === 'reds' || cat === 'intimacao' || cat === 'peca') && ocrUsados < 3 && blob.getBytes().length < 4 * 1024 * 1024) {
        const t = ccOcr(blob);
        if (t) { textoOcr += '\n--- ' + limpo + ' ---\n' + t.slice(0, 5000); ocrUsados++; }
      }
    });

    // ---------- 4. TRIAGEM COM GEMINI (uso interno) ----------
    const ia = ccAnaliseIA(d, textoOcr, salvos.length);

    // ---------- 5. FICHA DE TRIAGEM (Google Doc) ----------
    const fichaUrl = ccCriarFicha(gAnd, d, protocolo, nomePessoa, ia, salvos, textoOcr, clienteNovo);

    // ---------- 6. LINHA NA PLANILHA ----------
    ccRegistrarPlanilha(d, protocolo, nomePessoa, ia, pasta.getUrl(), fichaUrl, urgente, adv.nome);

    // ---------- 7. AUDIÊNCIA / PRAZO NA AGENDA ----------
    ccAgendarPrazo(caso.prazo, nomePessoa, protocolo, pasta.getUrl());

    // ---------- 8. E-MAIL FINAL ----------
    ccEmailFicha(d, protocolo, nomePessoa, ia, pasta.getUrl(), fichaUrl, eventoUrl, urgente, emailAdv, salvos.length, clienteNovo);

    return ccJson({
      status: 'sucesso',
      protocolo: protocolo,
      clienteNovo: clienteNovo,
      urgente: urgente,
      despacho: urgente ? { acionado: true, responsavel: adv.nome } : null,
      mensagem: urgente ? 'Plantão acionado.' : (clienteNovo ? 'Pasta criada com sucesso!' : 'Dados adicionados à pasta existente.')
    });

  } catch (erro) {
    // erro nunca vaza detalhe interno sensível; o site cai no plano B (WhatsApp)
    try { console.error('CentralCaso: ' + erro.message + ' | ' + erro.stack); } catch (_) {}
    return ccJson({ status: 'erro', mensagem: String(erro.message || erro).slice(0, 160) });
  }
}

// ===================== URGÊNCIA =====================
function ccDespacharUrgente(d, protocolo, nomePessoa, adv, emailAdv) {
  const contato = d.contato || {}, local = d.local || {}, caso = d.caso || {};
  const localTxt = [local.tipo, local.nome, local.referencia, local.cidade].filter(String).join(' · ') || 'local não informado';
  const mapa = local.lat ? 'https://www.google.com/maps?q=' + local.lat + ',' + local.lng : '';
  const rota = local.lat
    ? 'https://www.google.com/maps/dir/?api=1&destination=' + local.lat + ',' + local.lng
    : 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent([local.nome, local.referencia, local.cidade, 'MG'].filter(String).join(', '));
  const zap = 'https://wa.me/55' + ccDig(contato.whatsapp).replace(/^55/, '') + '?text=' + encodeURIComponent('Aqui é do escritório Dr. Lucas Semim. Recebi seu pedido de plantão (protocolo ' + protocolo + '). Pode falar agora?');

  // Agenda: evento "agora" com lembrete imediato (notifica o celular)
  let eventoUrl = '';
  try {
    const ini = new Date(), fim = new Date(ini.getTime() + 2 * 3600 * 1000);
    const desc = 'PLANTÃO URGENTE ' + protocolo + '\nPessoa: ' + nomePessoa + '\nContato: ' + ccS(contato.nome) + ' ' + ccS(contato.whatsapp) +
      '\nLocal: ' + localTxt + '\nRota: ' + rota + '\nWhatsApp: ' + zap + '\nCrimes: ' + (caso.crimes || []).join(', ');
    const ev = CalendarApp.getDefaultCalendar().createEvent('🚨 PLANTÃO · ' + nomePessoa + ' · ' + (local.nome || local.cidade || 'local a confirmar'), ini, fim, { location: [local.nome, local.referencia, local.cidade, 'MG'].filter(String).join(', '), description: desc });
    try { ev.setColor(CalendarApp.EventColor.RED); ev.addPopupReminder(0); ev.addPopupReminder(10); } catch (_) {}
    eventoUrl = 'https://calendar.google.com/calendar/u/0/r';
  } catch (errCal) { console.warn('Agenda: ' + errCal.message); }

  // E-mail de despacho (só o essencial, sai em segundos)
  const html =
    '<div style="font-family:Arial,sans-serif;max-width:620px">' +
    '<div style="background:#b3140f;color:#fff;padding:14px 18px;border-radius:8px 8px 0 0;font-size:18px;font-weight:bold">🚨 DESPACHO URGENTE · ' + ccEsc(protocolo) + '</div>' +
    '<div style="border:1px solid #ddd;border-top:0;padding:16px 18px;border-radius:0 0 8px 8px;line-height:1.55">' +
    '<p style="margin:0 0 6px"><b>Pessoa presa:</b> ' + ccEsc(nomePessoa) + (ccS(d.pessoa && d.pessoa.cpf) ? ' (CPF ' + ccEsc(d.pessoa.cpf) + ')' : '') + '</p>' +
    '<p style="margin:0 0 6px"><b>Local:</b> ' + ccEsc(localTxt) + (local.quando ? ' · prisão: ' + ccEsc(local.quando) : '') + (local.custodia ? ' · custódia: ' + ccEsc(local.custodia) : '') + '</p>' +
    '<p style="margin:0 0 6px"><b>Crime(s) apontado(s):</b> ' + ccEsc((caso.crimes || []).join(', ') || 'não informado') + '</p>' +
    '<p style="margin:0 0 6px"><b>Quem pediu:</b> ' + ccEsc(ccS(contato.nome)) + ' (' + ccEsc(ccS(d.contato && d.contato.relacao)) + ') · ' + ccEsc(ccS(contato.whatsapp)) + '</p>' +
    (caso.relato ? '<p style="margin:0 0 10px"><b>Relato:</b> ' + ccEsc(caso.relato).slice(0, 700) + '</p>' : '') +
    '<p style="margin:14px 0 0">' +
    '<a href="' + zap + '" style="background:#25d366;color:#fff;padding:11px 16px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;margin:0 6px 6px 0">💬 Chamar no WhatsApp</a>' +
    '<a href="' + rota + '" style="background:#1a73e8;color:#fff;padding:11px 16px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;margin:0 6px 6px 0">📍 Rota até o local</a>' +
    (mapa ? '<a href="' + mapa + '" style="background:#333;color:#fff;padding:11px 16px;border-radius:6px;text-decoration:none;display:inline-block;margin:0 0 6px 0">Ver GPS enviado</a>' : '') +
    '</p><p style="color:#777;font-size:12px;margin:12px 0 0">A pasta no Drive e a triagem da IA chegam no próximo e-mail (1 a 2 minutos).</p>' +
    '</div></div>';
  try {
    MailApp.sendEmail({
      to: emailAdv, subject: '🚨 PLANTÃO · ' + nomePessoa + ' · ' + (local.cidade || local.nome || 'local a confirmar') + ' · ' + protocolo,
      htmlBody: html, body: 'DESPACHO URGENTE ' + protocolo + ' — ' + nomePessoa + ' — ' + localTxt + ' — WhatsApp: ' + zap + ' — Rota: ' + rota
    });
  } catch (errMail) { console.warn('Email urgente: ' + errMail.message); }
  return eventoUrl;
}

// ===================== PASTAS / ARQUIVOS =====================
function ccAcharPasta(pastaClientes, cpfD, cnjD) {
  if (cpfD.length < 11 && cnjD.length < 20) return null;
  const it = pastaClientes.getFolders();
  while (it.hasNext()) {
    const p = it.next(), nd = p.getName().replace(/\D/g, '');
    if ((cpfD.length === 11 && nd.indexOf(cpfD) !== -1) || (cnjD.length === 20 && nd.indexOf(cnjD) !== -1)) return p;
  }
  return null;
}
function ccGaveta(mae, nome) {
  const it = mae.getFoldersByName(nome);
  return it.hasNext() ? it.next() : mae.createFolder(nome);
}
function ccOcr(blob) {
  try {
    const r = Drive.Files.insert({ title: 'tmp_ocr_' + Date.now(), mimeType: MimeType.GOOGLE_DOCS }, blob, { ocr: true, ocrLanguage: 'pt' });
    const txt = DocumentApp.openById(r.id).getBody().getText();
    Drive.Files.remove(r.id);
    return txt;
  } catch (e) { return ''; }   // Drive API avançada desligada ou arquivo ilegível: segue sem OCR
}

// ===================== IA (USO INTERNO) =====================
function ccAnaliseIA(d, textoOcr, nArquivos) {
  const vazio = {
    resumo: 'Triagem automática indisponível. Ler o relato bruto na ficha.', crime_provavel: [], fase: '', urgencia: d.urgente ? 5 : 3,
    justificativa_urgencia: d.urgente ? 'Pessoa presa agora (marcado pelo cliente).' : '', riscos: [], checklist_primeira_acao: [], documentos_faltando: [],
    pecas_cabiveis: [], prazos_atencao: [], perguntas_ao_cliente: [], observacoes: ''
  };
  try {
    if (typeof API_KEY === 'undefined' || !API_KEY) return vazio;
    const copia = JSON.parse(JSON.stringify(d)); delete copia.arquivos; delete copia.origem; delete copia.honeypot;
    const prompt =
      'Você é assistente de TRIAGEM de um escritório de advocacia CRIMINAL em Minas Gerais (Sabará e Belo Horizonte). ' +
      'Seu texto será lido SÓ pelo advogado, para ganhar tempo. Regras: não invente fatos, não afirme o que não está nos dados; ' +
      'marque como "a confirmar" o que faltar; escreva em português do Brasil, objetivo, sem floreio.\n\n' +
      'DADOS DO CLIENTE (JSON):\n' + JSON.stringify(copia) + '\n\n' +
      (textoOcr ? 'TEXTO EXTRAÍDO POR OCR DOS DOCUMENTOS ENVIADOS (REDS/intimação/peças):\n' + textoOcr + '\n\n' : '') +
      'Arquivos anexados: ' + nArquivos + '.\n\n' +
      'Responda SOMENTE com um JSON válido com estas chaves: ' +
      '"resumo" (até 6 linhas), "crime_provavel" (array de strings, com artigo de lei quando houver base), "fase" (string), ' +
      '"urgencia" (inteiro 1 a 5; 5 = pessoa presa agora ou prazo vencendo), "justificativa_urgencia" (string), ' +
      '"riscos" (array), "checklist_primeira_acao" (array de até 8 passos práticos para o advogado na delegacia/fórum), ' +
      '"documentos_faltando" (array), "pecas_cabiveis" (array, ex.: relaxamento de prisão, liberdade provisória, habeas corpus, resposta à acusação), ' +
      '"prazos_atencao" (array), "perguntas_ao_cliente" (array de até 6), "observacoes" (string).';
    const resp = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/' + MODEL_FLASH + ':generateContent?key=' + API_KEY, {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      payload: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, responseMimeType: 'application/json' } })
    });
    const j = JSON.parse(resp.getContentText());
    const txt = j.candidates && j.candidates[0].content.parts[0].text;
    if (!txt) return vazio;
    const o = JSON.parse(txt.replace(/^```json|```$/g, '').trim());
    Object.keys(vazio).forEach(function (k) { if (o[k] == null) o[k] = vazio[k]; });
    o.urgencia = Math.max(1, Math.min(5, parseInt(o.urgencia, 10) || vazio.urgencia));
    if (d.urgente && o.urgencia < 4) o.urgencia = 4;   // urgência marcada pelo cliente nunca é rebaixada abaixo de 4
    return o;
  } catch (e) { console.warn('IA: ' + e.message); return vazio; }
}

// ===================== FICHA (GOOGLE DOC) =====================
function ccCriarFicha(gAnd, d, protocolo, nomePessoa, ia, salvos, textoOcr, clienteNovo) {
  try {
    const contato = d.contato || {}, pessoa = d.pessoa || {}, local = d.local || {}, caso = d.caso || {}, busca = d.busca || {};
    const doc = DocumentApp.create('FICHA DE TRIAGEM - ' + protocolo + ' - ' + nomePessoa);
    const body = doc.getBody();
    const H1 = DocumentApp.ParagraphHeading.HEADING1, H2 = DocumentApp.ParagraphHeading.HEADING2;
    const lista = function (arr) { (arr || []).forEach(function (x) { body.appendListItem(String(x)); }); if (!(arr || []).length) body.appendParagraph('—'); };

    body.appendParagraph('FICHA DE TRIAGEM · ' + protocolo).setHeading(H1);
    body.appendParagraph((d.urgente ? '🚨 URGENTE — ' : '') + ccS(d.modo).toUpperCase() + ' · ' + Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy HH:mm') + (clienteNovo ? ' · cliente novo' : ' · pasta já existente'));
    body.appendParagraph('Gerada automaticamente pelo site (Central do Caso). A análise da IA abaixo é RASCUNHO DE ORGANIZAÇÃO: conferir antes de usar.').setItalic(true);

    body.appendParagraph('DADOS').setHeading(H2);
    const linhas = [
      ['Pessoa envolvida', nomePessoa + (ccS(pessoa.cpf) ? ' · CPF ' + pessoa.cpf : '')],
      ['Quem pediu', ccS(contato.nome) + ' (' + ccS(contato.relacao) + ')'],
      ['WhatsApp / e-mail', ccS(contato.whatsapp) + ' / ' + (ccS(contato.email) || '—')],
      ['Fase', ccS(caso.fase) || '—'], ['Processo (CNJ)', ccS(caso.cnj) || '—'], ['Vara / comarca', ccS(caso.vara) || '—'],
      ['Crime(s)', (caso.crimes || []).join(', ') || '—'], ['Próx. audiência/prazo', ccS(caso.prazo) || '—']
    ];
    if (d.urgente) {
      linhas.splice(1, 0, ['LOCAL DA PRISÃO', [local.tipo, local.nome, local.referencia, local.cidade].filter(String).join(' · ') || '—'],
        ['Quando / custódia', (ccS(local.quando) || '—') + ' / ' + (ccS(local.custodia) || '—')], ['Mapa', ccS(local.mapa) || '—']);
    }
    body.appendTable(linhas);

    body.appendParagraph('RELATO DO CLIENTE').setHeading(H2);
    body.appendParagraph(ccS(caso.relato) || '—');

    body.appendParagraph('BUSCAS AUTORIZADAS PELO CLIENTE').setHeading(H2);
    lista((busca.itens || []).concat(busca.reds && (busca.reds.numero || busca.reds.data || busca.reds.local) ? ['REDS: nº ' + (busca.reds.numero || '?') + ' · data ' + (busca.reds.data || '?') + ' · local ' + (busca.reds.local || '?')] : []));

    body.appendParagraph('TRIAGEM DA IA  (urgência ' + ia.urgencia + '/5)').setHeading(H2);
    body.appendParagraph(ia.resumo);
    if (ia.justificativa_urgencia) body.appendParagraph('Urgência: ' + ia.justificativa_urgencia).setItalic(true);
    [['Crime provável', ia.crime_provavel], ['Riscos', ia.riscos], ['Checklist da 1ª ação', ia.checklist_primeira_acao], ['Documentos faltando', ia.documentos_faltando],
     ['Peças cabíveis', ia.pecas_cabiveis], ['Prazos/atenção', ia.prazos_atencao], ['Perguntas ao cliente', ia.perguntas_ao_cliente]].forEach(function (par) {
      body.appendParagraph(par[0]).setHeading(DocumentApp.ParagraphHeading.HEADING3); lista(par[1]);
    });
    if (ia.observacoes) body.appendParagraph('Obs.: ' + ia.observacoes);

    body.appendParagraph('ARQUIVOS RECEBIDOS').setHeading(H2);
    lista(salvos.map(function (s) { return s.nome + ' [' + s.categoria + ']'; }));
    if (textoOcr) { body.appendParagraph('TEXTO LIDO POR OCR (bruto)').setHeading(H2); body.appendParagraph(textoOcr.slice(0, 9000)); }
    doc.saveAndClose();

    const arq = DriveApp.getFileById(doc.getId());
    arq.moveTo(gAnd);
    return arq.getUrl();
  } catch (e) { console.warn('Ficha: ' + e.message); return ''; }
}

// ===================== PLANILHA / AGENDA / E-MAIL =====================
function ccPlanilha() {
  let ss = null;
  try { ss = SpreadsheetApp.getActiveSpreadsheet(); } catch (_) {}
  if (!ss) { const id = PropertiesService.getScriptProperties().getProperty('ID_PLANILHA_TRIAGEM'); if (id) ss = SpreadsheetApp.openById(id); }
  return ss;
}
function ccRegistrarPlanilha(d, protocolo, nomePessoa, ia, pastaUrl, fichaUrl, urgente, responsavel) {
  try {
    const ss = ccPlanilha(); if (!ss) return;
    let sh = ss.getSheetByName(CC_ABA);
    if (!sh) {
      sh = ss.insertSheet(CC_ABA);
      sh.appendRow(['DATA/HORA', 'PROTOCOLO', 'URGENTE', 'CAMINHO', 'PESSOA ENVOLVIDA', 'QUEM PEDIU', 'WHATSAPP', 'RELAÇÃO', 'CIDADE', 'LOCAL', 'MAPA', 'FASE', 'CNJ', 'CRIMES', 'URGÊNCIA IA (1-5)', 'RESUMO IA', '1ª AÇÃO (IA)', 'DOCS FALTANDO (IA)', 'BUSCAS AUTORIZADAS', 'PASTA', 'FICHA', 'RESPONSÁVEL', 'STATUS']);
      sh.setFrozenRows(1); sh.getRange(1, 1, 1, 23).setFontWeight('bold').setBackground('#1a1a1a').setFontColor('#d4af37');
    }
    const c = d.contato || {}, p = d.pessoa || {}, l = d.local || {}, k = d.caso || {}, b = d.busca || {};
    sh.appendRow([new Date(), protocolo, urgente ? 'SIM' : 'não', ccS(d.modo), nomePessoa, ccS(c.nome), ccS(c.whatsapp), ccS(c.relacao), ccS(l.cidade), [l.tipo, l.nome].filter(String).join(' · '), ccS(l.mapa),
      ccS(k.fase), ccS(k.cnj), (k.crimes || []).join(', '), ia.urgencia, ia.resumo, (ia.checklist_primeira_acao || []).join(' | '), (ia.documentos_faltando || []).join(' | '), (b.itens || []).join(', '), pastaUrl, fichaUrl, responsavel, 'NOVO']);
    if (urgente) sh.getRange(sh.getLastRow(), 1, 1, 23).setBackground('#fde2e1');
  } catch (e) { console.warn('Planilha: ' + e.message); }
}
function ccAgendarPrazo(prazo, nomePessoa, protocolo, pastaUrl) {
  try {
    if (!prazo || !/^\d{4}-\d{2}-\d{2}$/.test(prazo)) return;
    const dt = new Date(prazo + 'T12:00:00');
    if (isNaN(dt.getTime())) return;
    CalendarApp.getDefaultCalendar().createAllDayEvent('⚖️ AUDIÊNCIA/PRAZO · ' + nomePessoa + ' · ' + protocolo, dt, { description: 'Informado pelo cliente no site. Conferir nos autos.\nPasta: ' + pastaUrl });
  } catch (e) { console.warn('Prazo: ' + e.message); }
}
function ccEmailFicha(d, protocolo, nomePessoa, ia, pastaUrl, fichaUrl, eventoUrl, urgente, emailAdv, nArq, clienteNovo) {
  try {
    const k = d.caso || {};
    const li = function (a) { return (a || []).slice(0, 8).map(function (x) { return '<li>' + ccEsc(x) + '</li>'; }).join('') || '<li>—</li>'; };
    const html = '<div style="font-family:Arial,sans-serif;max-width:640px;line-height:1.5">' +
      '<h2 style="margin:0 0 4px">' + (urgente ? '🚨 ' : '📁 ') + ccEsc(nomePessoa) + ' · ' + ccEsc(protocolo) + '</h2>' +
      '<p style="margin:0 0 10px;color:#666">' + (urgente ? 'Pasta e triagem prontas.' : 'Novo caso pela Central do Caso') + ' · ' + (clienteNovo ? 'cliente novo' : 'pasta já existente') + ' · ' + nArq + ' arquivo(s) · urgência IA <b>' + ia.urgencia + '/5</b></p>' +
      '<p><b>Resumo (IA, conferir):</b> ' + ccEsc(ia.resumo) + '</p>' +
      '<p style="margin:10px 0 2px"><b>1ª ação sugerida</b></p><ul style="margin:0">' + li(ia.checklist_primeira_acao) + '</ul>' +
      '<p style="margin:10px 0 2px"><b>Documentos faltando</b></p><ul style="margin:0">' + li(ia.documentos_faltando) + '</ul>' +
      '<p style="margin:16px 0 0"><a href="' + pastaUrl + '" style="background:#d4af37;color:#111;padding:10px 14px;border-radius:6px;text-decoration:none;font-weight:bold">Abrir pasta no Drive</a> ' +
      (fichaUrl ? '<a href="' + fichaUrl + '" style="background:#222;color:#fff;padding:10px 14px;border-radius:6px;text-decoration:none">Ficha de triagem</a>' : '') + '</p>' +
      '<p style="color:#999;font-size:12px;margin-top:14px">Contato: ' + ccEsc(ccS(d.contato && d.contato.nome)) + ' · ' + ccEsc(ccS(d.contato && d.contato.whatsapp)) + '. Tudo gerado automaticamente; a IA só organiza, a estratégia é sua.</p></div>';
    MailApp.sendEmail({ to: emailAdv, subject: (urgente ? '✅ Ficha pronta · ' : '📁 Novo caso · ') + nomePessoa + ' · ' + protocolo, htmlBody: html, body: 'Novo caso ' + protocolo + ' — ' + nomePessoa + ' — pasta: ' + pastaUrl });
  } catch (e) { console.warn('Email ficha: ' + e.message); }
}

// ===================== UTILITÁRIOS =====================
function ccJson(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function ccS(v) { return v == null ? '' : String(v).trim(); }
function ccDig(v) { return String(v == null ? '' : v).replace(/\D/g, ''); }
function ccEsc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); }
function ccProtocolo() {
  return 'LS-' + Utilities.formatDate(new Date(), 'GMT-3', 'yyMMdd') + '-' + Utilities.getUuid().replace(/-/g, '').slice(0, 4).toUpperCase();
}
function ccEscolherAdvogado(cidade) {
  const c = ccS(cidade).toLowerCase();
  for (let i = 0; i < CC_ADVOGADOS.length; i++) {
    const cs = (CC_ADVOGADOS[i].cidades || []).map(function (x) { return String(x).toLowerCase(); });
    if (c && cs.indexOf(c) !== -1) return CC_ADVOGADOS[i];
  }
  for (let j = 0; j < CC_ADVOGADOS.length; j++) if ((CC_ADVOGADOS[j].cidades || []).indexOf('*') !== -1) return CC_ADVOGADOS[j];
  return CC_ADVOGADOS[0];
}
function ccLimiteTaxa(whats) {
  const cache = CacheService.getScriptCache(), chave = 'cc_' + ccDig(whats);
  const n = parseInt(cache.get(chave) || '0', 10);
  if (n >= CC_LIMITE_ENVIOS_HORA) throw new Error('Muitos envios deste número. Chame o plantão pelo WhatsApp.');
  cache.put(chave, String(n + 1), 3600);
}

// ===================== TESTES (rodar no editor) =====================
/** 1) Rode UMA VEZ e aceite as permissões (Drive, Docs, Planilhas, Gmail, Agenda, UrlFetch). */
function autorizarCentralCaso() {
  MailApp.getRemainingDailyQuota();
  CalendarApp.getDefaultCalendar().getName();
  DriveApp.getFolderById(ID_RAIZ_ESCRITORIO).getName();
  DocumentApp.create('tmp_autorizacao').getId();   // cria e já apaga abaixo
  DriveApp.getFilesByName('tmp_autorizacao').next().setTrashed(true);
  UrlFetchApp.fetch('https://www.google.com', { muteHttpExceptions: true });
  Logger.log('Permissões OK.');
}
/** 2) Simula um pedido de plantão. Cria a pasta "TESTE SITE ..." — apague depois. */
function testarCentralCaso() {
  const fake = {
    acao: 'central_caso', modo: 'urgencia', urgente: true,
    contato: { nome: 'TESTE Maria', whatsapp: '(31) 99999-0000', email: '', relacao: 'familiar' },
    pessoa: { nome: 'TESTE SITE João', cpf: '', preso: 'sim' },
    local: { tipo: 'Delegacia', nome: 'Delegacia de Polícia Civil de Sabará', cidade: 'Sabará', referencia: '', lat: null, lng: null, quando: 'Agora há pouco', custodia: 'Ainda não', mapa: '' },
    caso: { fase: 'Prisão em flagrante', cnj: '', vara: '', crimes: ['Tráfico de drogas'], prazo: '', relato: 'Teste do sistema. Abordado em via pública, encontrado com porções de droga.' },
    busca: { itens: ['reds', 'flagrante'], reds: { numero: '', data: '', local: '' } },
    consentimento: { lgpd: true, em: new Date().toISOString() }, arquivos: []
  };
  const r = processarCentralCaso({ postData: { contents: JSON.stringify(fake) } });
  Logger.log(r.getContent());
}
