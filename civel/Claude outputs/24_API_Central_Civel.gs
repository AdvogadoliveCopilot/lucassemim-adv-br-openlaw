/**
 * 24 - API CENTRAL DO CASO CÍVEL (civel.lucassemim.adv.br/central-do-caso-civel.html) V1.0
 * -----------------------------------------------------------------------------------------
 * Recebe o caso montado pelo cliente no site cível e faz, em ordem:
 *   1. Rate limit por WhatsApp + honeypot + consentimento LGPD.
 *   2. Cria a pasta do cliente em 01_CLIENTES ("NOME - CÍVEL - LC-AAMMDD-XXXX")
 *      com as 3 gavetas padrão (01_Docs_Pessoais, 02_Provas, 03_Andamentos_Despachos).
 *   3. Guarda os arquivos (documento pessoal -> 01; o resto -> 02_Provas).
 *   4. Lê por OCR até 3 documentos (contrato/extrato/negativa) e pede ao Gemini uma
 *      TRIAGEM CÍVEL (resumo, tese provável, viabilidade, urgência 1-5, prescrição,
 *      documentos faltando, 1º contato...). A IA só organiza para o advogado:
 *      NADA disso volta para o cliente e nada é prometido a ele.
 *   5. Cria a "FICHA DE TRIAGEM CÍVEL" (Google Doc) em 03_Andamentos_Despachos.
 *   6. Registra uma linha na aba TRIAGEM_CIVEL da planilha.
 *   7. Cria lembrete na Agenda ("Retornar lead cível") e manda e-mail ao advogado
 *      com botão de WhatsApp.
 *   8. Devolve ao site o PROTOCOLO (LC-AAMMDD-XXXX).
 *
 * DEPENDÊNCIAS (já existem no projeto "Advogado Live"):
 *   - 00_Config_Menu: ID_RAIZ_ESCRITORIO, API_KEY, MODEL_FLASH
 *   - 23_API_Central_Caso.gs (usa os helpers ccJson, ccS, ccDig, ccEsc, ccGaveta, ccOcr,
 *     ccPlanilha, ccEscolherAdvogado, CC_ADVOGADOS, CC_MIMES_OK, CC_MAX_ARQUIVOS)
 *   - Serviço avançado "Drive API" (só para OCR; se estiver desligado, segue sem ler o PDF)
 *
 * COMO LIGAR: veja INSTALAR_CENTRAL_CIVEL.md (1 linha no doPost + 1 autorização + nova versão).
 */

// ===================== CONFIGURAÇÃO =====================
const CV_ABA = 'TRIAGEM_CIVEL';
const CV_LIMITE_ENVIOS_HORA = 6;     // por WhatsApp informado (anti-abuso)

// ===================== PONTO DE ENTRADA =====================
function processarCentralCivel(e) {
  try {
    const d = JSON.parse(e.postData.contents);

    // robô (campo escondido preenchido): finge sucesso e não grava nada
    if (d.honeypot) return ccJson({ status: 'sucesso', protocolo: 'LC-OK' });

    if (!d.consentimento || d.consentimento.lgpd !== true) throw new Error('Consentimento LGPD ausente.');
    const contato = d.contato || {}, caso = d.caso || {};
    if (!ccS(contato.nome) || !ccS(contato.whatsapp)) throw new Error('Nome e WhatsApp são obrigatórios.');
    if (ccDig(contato.whatsapp).length < 10) throw new Error('WhatsApp inválido.');
    cvLimiteTaxa(contato.whatsapp);

    const protocolo = cvProtocolo();
    const nomePessoa = ccS(contato.nome).toUpperCase().slice(0, 80);
    const adv = ccEscolherAdvogado(contato.cidade);
    const emailAdv = adv.email || Session.getEffectiveUser().getEmail();

    // ---------- 1. PASTA DO CLIENTE ----------
    const pastaRaiz = DriveApp.getFolderById(ID_RAIZ_ESCRITORIO);
    const it = pastaRaiz.getFoldersByName('01_CLIENTES');
    const pastaClientes = it.hasNext() ? it.next() : pastaRaiz;
    const pasta = pastaClientes.createFolder(nomePessoa + ' - CÍVEL - ' + protocolo);
    const gDocs = ccGaveta(pasta, '01_Docs_Pessoais');
    const gProvas = ccGaveta(pasta, '02_Provas');
    const gAnd = ccGaveta(pasta, '03_Andamentos_Despachos');

    // ---------- 2. ARQUIVOS + OCR ----------
    const arquivos = (d.arquivos || []).slice(0, CC_MAX_ARQUIVOS);
    const salvos = [];
    let textoOcr = '', ocrUsados = 0;
    arquivos.forEach(function (arq) {
      if (CC_MIMES_OK.indexOf(arq.mimeType) === -1) return;
      const limpo = ccS(arq.nome).replace(/[^\w.\- ]+/g, '_').slice(0, 80);
      const blob = Utilities.newBlob(Utilities.base64Decode(arq.data), arq.mimeType, protocolo + '_' + limpo);
      const cat = ccS(arq.categoria);
      const f = (cat === 'pessoal' ? gDocs : gProvas).createFile(blob);
      salvos.push({ nome: f.getName(), categoria: cat, url: f.getUrl() });
      if ((cat === 'contrato' || cat === 'negativa') && ocrUsados < 3 && blob.getBytes().length < 4 * 1024 * 1024) {
        const t = ccOcr(blob);
        if (t) { textoOcr += '\n--- ' + limpo + ' ---\n' + t.slice(0, 5000); ocrUsados++; }
      }
    });

    // ---------- 3. TRIAGEM COM GEMINI (uso interno) ----------
    const ia = cvAnaliseIA(d, textoOcr, salvos.length);

    // ---------- 4. FICHA, PLANILHA, AGENDA, E-MAIL ----------
    const fichaUrl = cvCriarFicha(gAnd, d, protocolo, nomePessoa, ia, salvos, textoOcr);
    cvRegistrarPlanilha(d, protocolo, nomePessoa, ia, pasta.getUrl(), fichaUrl, adv.nome);
    cvLembreteAgenda(d, protocolo, nomePessoa, ia, pasta.getUrl());
    cvEmailFicha(d, protocolo, nomePessoa, ia, pasta.getUrl(), fichaUrl, emailAdv, salvos.length);

    return ccJson({ status: 'sucesso', protocolo: protocolo });

  } catch (erro) {
    // erro nunca vaza detalhe interno; o site cai no plano B (WhatsApp com a ficha pronta)
    try { console.error('CentralCivel: ' + erro.message + ' | ' + erro.stack); } catch (_) {}
    return ccJson({ status: 'erro', mensagem: String(erro.message || erro).slice(0, 160) });
  }
}

// ===================== IA (USO INTERNO) =====================
function cvAnaliseIA(d, textoOcr, nArquivos) {
  const urgBase = (d.assunto === 'saude' && /semana|m[eê]s/i.test(ccS(d.caso && d.caso.quando))) ? 4 : 3;
  const vazio = {
    resumo: 'Triagem automática indisponível. Ler o relato bruto na ficha.', area: ccS(d.assuntoLabel), tese_provavel: [],
    viabilidade: 'indefinida', urgencia: urgBase, justificativa_urgencia: '', tutela_urgencia: false, prescricao_alerta: '',
    riscos: [], documentos_faltando: [], pecas_cabiveis: [], checklist_primeiro_contato: [], perguntas_ao_cliente: [], observacoes: ''
  };
  try {
    if (typeof API_KEY === 'undefined' || !API_KEY) return vazio;
    const copia = JSON.parse(JSON.stringify(d)); delete copia.arquivos; delete copia.origem; delete copia.honeypot;
    const prompt =
      'Você é assistente de TRIAGEM de um escritório de advocacia CÍVEL em Minas Gerais (Sabará e Belo Horizonte), ' +
      'com foco em direito do consumidor, bancário, saúde suplementar, seguros, responsabilidade civil, usucapião e família/sucessões. ' +
      'Seu texto será lido SÓ pelo advogado, para ganhar tempo. Regras: não invente fatos; marque como "a confirmar" o que faltar; ' +
      'não prometa resultado nem valor de indenização; cite artigo de lei ou súmula apenas quando houver base clara nos dados; ' +
      'atenção a prescrição/decadência (CDC arts. 26 e 27, CC art. 206) e a hipóteses de tutela de urgência (ex.: negativa de tratamento). ' +
      'Escreva em português do Brasil, objetivo, sem floreio.\n\n' +
      'DADOS DO CLIENTE (JSON):\n' + JSON.stringify(copia) + '\n\n' +
      (textoOcr ? 'TEXTO EXTRAÍDO POR OCR DOS DOCUMENTOS ENVIADOS:\n' + textoOcr + '\n\n' : '') +
      'Arquivos anexados: ' + nArquivos + '.\n\n' +
      'Responda SOMENTE com um JSON válido com estas chaves: ' +
      '"resumo" (até 6 linhas), "area" (string), "tese_provavel" (array de strings), ' +
      '"viabilidade" (um de: "alta","media","baixa","indefinida"), ' +
      '"urgencia" (inteiro 1 a 5; 5 = risco de dano imediato à saúde/moradia ou prazo prescricional vencendo), "justificativa_urgencia" (string), ' +
      '"tutela_urgencia" (boolean), "prescricao_alerta" (string; vazio se não houver), ' +
      '"riscos" (array), "documentos_faltando" (array), "pecas_cabiveis" (array, ex.: ação de obrigação de fazer com tutela, declaratória de inexistência de débito, indenizatória, usucapião extrajudicial), ' +
      '"checklist_primeiro_contato" (array de até 6 passos para o advogado no 1º contato pelo WhatsApp), ' +
      '"perguntas_ao_cliente" (array de até 6), "observacoes" (string).';
    const resp = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/' + MODEL_FLASH + ':generateContent?key=' + API_KEY, {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      payload: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, responseMimeType: 'application/json' } })
    });
    const j = JSON.parse(resp.getContentText());
    const txt = j.candidates && j.candidates[0].content.parts[0].text;
    if (!txt) return vazio;
    const o = JSON.parse(txt.replace(/^\s*[\x60]{3}(json)?|[\x60]{3}\s*$/g, '').trim());
    Object.keys(vazio).forEach(function (k) { if (o[k] == null) o[k] = vazio[k]; });
    o.urgencia = Math.max(1, Math.min(5, parseInt(o.urgencia, 10) || vazio.urgencia));
    o.tutela_urgencia = o.tutela_urgencia === true;
    return o;
  } catch (e) { console.warn('IA cível: ' + e.message); return vazio; }
}

// ===================== FICHA (GOOGLE DOC) =====================
function cvCriarFicha(gAnd, d, protocolo, nomePessoa, ia, salvos, textoOcr) {
  try {
    const c = d.contato || {}, k = d.caso || {};
    const doc = DocumentApp.create('FICHA DE TRIAGEM CÍVEL - ' + protocolo + ' - ' + nomePessoa);
    const body = doc.getBody();
    const H1 = DocumentApp.ParagraphHeading.HEADING1, H2 = DocumentApp.ParagraphHeading.HEADING2, H3 = DocumentApp.ParagraphHeading.HEADING3;
    const lista = function (arr) { (arr || []).forEach(function (x) { body.appendListItem(String(x)); }); if (!(arr || []).length) body.appendParagraph('—'); };

    body.appendParagraph('FICHA DE TRIAGEM CÍVEL · ' + protocolo).setHeading(H1);
    body.appendParagraph(ccS(d.assuntoLabel).toUpperCase() + ' · ' + Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy HH:mm')).setBold(true);
    body.appendParagraph('Gerada automaticamente pelo site (Central do Caso Cível). A análise da IA abaixo é RASCUNHO DE ORGANIZAÇÃO: conferir antes de usar. Nada disso foi enviado ao cliente.').setItalic(true);

    body.appendParagraph('DADOS').setHeading(H2);
    body.appendTable([
      ['Cliente', nomePessoa],
      ['WhatsApp / e-mail', ccS(c.whatsapp) + ' / ' + (ccS(c.email) || '—')],
      ['Cidade', ccS(c.cidade) || '—'],
      ['Assunto', ccS(d.assuntoLabel) || '—'],
      ['Quando aconteceu', ccS(k.quando) || '—'],
      ['Valor envolvido', ccS(k.valor) || '—'],
      ['Parte contrária', ccS(k.parteContraria) || '—'],
      ['Já existe processo?', ccS(k.temProcesso) + (ccS(k.cnj) ? ' · ' + k.cnj : '')]
    ]);

    body.appendParagraph('RELATO DO CLIENTE').setHeading(H2);
    body.appendParagraph(ccS(k.relato) || '—');

    body.appendParagraph('TRIAGEM DA IA  (urgência ' + ia.urgencia + '/5 · viabilidade ' + ia.viabilidade + (ia.tutela_urgencia ? ' · CABE TUTELA DE URGÊNCIA' : '') + ')').setHeading(H2);
    body.appendParagraph(ia.resumo);
    if (ia.justificativa_urgencia) body.appendParagraph('Urgência: ' + ia.justificativa_urgencia).setItalic(true);
    if (ia.prescricao_alerta) body.appendParagraph('⚠ Prescrição/decadência: ' + ia.prescricao_alerta).setBold(true);
    [['Tese provável', ia.tese_provavel], ['Riscos', ia.riscos], ['Peças cabíveis', ia.pecas_cabiveis], ['Documentos faltando', ia.documentos_faltando],
     ['Checklist do 1º contato', ia.checklist_primeiro_contato], ['Perguntas ao cliente', ia.perguntas_ao_cliente]].forEach(function (par) {
      body.appendParagraph(par[0]).setHeading(H3); lista(par[1]);
    });
    if (ia.observacoes) body.appendParagraph('Obs.: ' + ia.observacoes);

    body.appendParagraph('ARQUIVOS RECEBIDOS').setHeading(H2);
    lista(salvos.map(function (s) { return s.nome + ' [' + s.categoria + ']'; }));
    if (textoOcr) { body.appendParagraph('TEXTO LIDO POR OCR (bruto)').setHeading(H2); body.appendParagraph(textoOcr.slice(0, 9000)); }
    doc.saveAndClose();

    const arq = DriveApp.getFileById(doc.getId());
    arq.moveTo(gAnd);
    return arq.getUrl();
  } catch (e) { console.warn('Ficha cível: ' + e.message); return ''; }
}

// ===================== PLANILHA / AGENDA / E-MAIL =====================
function cvRegistrarPlanilha(d, protocolo, nomePessoa, ia, pastaUrl, fichaUrl, responsavel) {
  try {
    const ss = ccPlanilha(); if (!ss) return;
    let sh = ss.getSheetByName(CV_ABA);
    const cols = ['DATA/HORA', 'PROTOCOLO', 'ASSUNTO', 'CLIENTE', 'WHATSAPP', 'E-MAIL', 'CIDADE', 'QUANDO', 'VALOR', 'PARTE CONTRÁRIA', 'PROCESSO?', 'URGÊNCIA IA (1-5)', 'VIABILIDADE', 'TUTELA?', 'PRESCRIÇÃO', 'RESUMO IA', 'DOCS FALTANDO (IA)', 'PASTA', 'FICHA', 'RESPONSÁVEL', 'STATUS'];
    if (!sh) {
      sh = ss.insertSheet(CV_ABA);
      sh.appendRow(cols);
      sh.setFrozenRows(1); sh.getRange(1, 1, 1, cols.length).setFontWeight('bold').setBackground('#0c3f45').setFontColor('#d4af37');
    }
    const c = d.contato || {}, k = d.caso || {};
    sh.appendRow([new Date(), protocolo, ccS(d.assuntoLabel), nomePessoa, ccS(c.whatsapp), ccS(c.email), ccS(c.cidade), ccS(k.quando), ccS(k.valor), ccS(k.parteContraria),
      ccS(k.temProcesso) + (ccS(k.cnj) ? ' ' + k.cnj : ''), ia.urgencia, ia.viabilidade, ia.tutela_urgencia ? 'SIM' : 'não', ia.prescricao_alerta, ia.resumo,
      (ia.documentos_faltando || []).join(' | '), pastaUrl, fichaUrl, responsavel, 'NOVO']);
    if (ia.urgencia >= 4 || ia.tutela_urgencia) sh.getRange(sh.getLastRow(), 1, 1, cols.length).setBackground('#fff3cd');
  } catch (e) { console.warn('Planilha cível: ' + e.message); }
}

function cvLembreteAgenda(d, protocolo, nomePessoa, ia, pastaUrl) {
  try {
    const ini = new Date(Date.now() + (ia.urgencia >= 4 ? 15 : 120) * 60000), fim = new Date(ini.getTime() + 30 * 60000);
    const c = d.contato || {};
    const ev = CalendarApp.getDefaultCalendar().createEvent('📞 Retornar lead cível · ' + nomePessoa + ' · ' + ccS(d.assuntoLabel), ini, fim, {
      description: protocolo + '\nWhatsApp: ' + ccS(c.whatsapp) + '\nUrgência IA: ' + ia.urgencia + '/5\nPasta: ' + pastaUrl
    });
    try { ev.addPopupReminder(0); } catch (_) {}
  } catch (e) { console.warn('Agenda cível: ' + e.message); }
}

function cvEmailFicha(d, protocolo, nomePessoa, ia, pastaUrl, fichaUrl, emailAdv, nArq) {
  try {
    const c = d.contato || {}, k = d.caso || {};
    const zap = 'https://wa.me/55' + ccDig(c.whatsapp).replace(/^55/, '') + '?text=' + encodeURIComponent('Olá ' + ccS(c.nome).split(' ')[0] + ', aqui é do escritório do Dr. Lucas Semim. Recebi seu caso (protocolo ' + protocolo + '). Pode falar agora?');
    const li = function (a) { return (a || []).slice(0, 8).map(function (x) { return '<li>' + ccEsc(x) + '</li>'; }).join('') || '<li>—</li>'; };
    const quente = ia.urgencia >= 4 || ia.tutela_urgencia;
    const html = '<div style="font-family:Arial,sans-serif;max-width:640px;line-height:1.5">' +
      '<h2 style="margin:0 0 4px">' + (quente ? '🔥 ' : '⚖️ ') + ccEsc(nomePessoa) + ' · ' + ccEsc(protocolo) + '</h2>' +
      '<p style="margin:0 0 10px;color:#666">' + ccEsc(ccS(d.assuntoLabel)) + ' · ' + ccEsc(ccS(c.cidade)) + ' · ' + nArq + ' arquivo(s) · urgência IA <b>' + ia.urgencia + '/5</b> · viabilidade <b>' + ccEsc(ia.viabilidade) + '</b>' + (ia.tutela_urgencia ? ' · <b>cabe tutela de urgência</b>' : '') + '</p>' +
      '<p><b>Quando:</b> ' + ccEsc(ccS(k.quando) || '—') + ' · <b>Valor:</b> ' + ccEsc(ccS(k.valor) || '—') + ' · <b>Contra:</b> ' + ccEsc(ccS(k.parteContraria) || '—') + '</p>' +
      '<p><b>Resumo (IA, conferir):</b> ' + ccEsc(ia.resumo) + '</p>' +
      (ia.prescricao_alerta ? '<p style="background:#fff3cd;padding:8px 10px;border-radius:6px"><b>⚠ Prescrição:</b> ' + ccEsc(ia.prescricao_alerta) + '</p>' : '') +
      '<p style="margin:10px 0 2px"><b>Peças cabíveis</b></p><ul style="margin:0">' + li(ia.pecas_cabiveis) + '</ul>' +
      '<p style="margin:10px 0 2px"><b>Documentos faltando</b></p><ul style="margin:0">' + li(ia.documentos_faltando) + '</ul>' +
      '<p style="margin:16px 0 0"><a href="' + zap + '" style="background:#25d366;color:#fff;padding:10px 14px;border-radius:6px;text-decoration:none;font-weight:bold">💬 Chamar no WhatsApp</a> ' +
      '<a href="' + pastaUrl + '" style="background:#d4af37;color:#111;padding:10px 14px;border-radius:6px;text-decoration:none;font-weight:bold">Abrir pasta</a> ' +
      (fichaUrl ? '<a href="' + fichaUrl + '" style="background:#0c3f45;color:#fff;padding:10px 14px;border-radius:6px;text-decoration:none">Ficha</a>' : '') + '</p>' +
      '<p style="color:#999;font-size:12px;margin-top:14px">Gerado automaticamente; a IA só organiza, a estratégia é sua.</p></div>';
    MailApp.sendEmail({ to: emailAdv, subject: (quente ? '🔥 Lead cível quente · ' : '⚖️ Novo caso cível · ') + nomePessoa + ' · ' + ccS(d.assuntoLabel) + ' · ' + protocolo, htmlBody: html, body: 'Novo caso cível ' + protocolo + ' — ' + nomePessoa + ' — pasta: ' + pastaUrl + ' — WhatsApp: ' + zap });
  } catch (e) { console.warn('Email cível: ' + e.message); }
}


// ===================== LEAD DE RETORNO (widget "Notamos que você já nos visitou") =====================
/** Rota leve: guarda nome + WhatsApp + respostas do widget, avisa por e-mail. Sem pasta no Drive, sem IA. */
function processarRetornoCivel(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.honeypot) return ccJson({ status: 'sucesso' });
    const nome = ccS(d.nome).slice(0, 80), tel = ccDig(d.telefone);
    if (nome.length < 2 || tel.length < 10 || tel.length > 13) throw new Error('Dados inválidos.');
    cvLimiteTaxa(tel);

    const ss = ccPlanilha();
    if (ss) {
      let sh = ss.getSheetByName('RETORNO_CIVEL');
      const cols = ['DATA/HORA', 'NOME', 'WHATSAPP', 'JÁ ATENDIDO?', 'AVALIAÇÃO', 'SITUAÇÃO', 'PÁGINA', 'VISITAS', 'CAMPANHA', 'STATUS'];
      if (!sh) {
        sh = ss.insertSheet('RETORNO_CIVEL'); sh.appendRow(cols); sh.setFrozenRows(1);
        sh.getRange(1, 1, 1, cols.length).setFontWeight('bold').setBackground('#0c3f45').setFontColor('#d4af37');
      }
      sh.appendRow([new Date(), nome, ccS(d.telefone), ccS(d.jaAtendido), ccS(d.avaliacao), ccS(d.situacao), ccS(d.pagina), d.visitas || '', ccS(d.campanha), 'NOVO']);
    }

    const adv = ccEscolherAdvogado('');
    const emailAdv = adv.email || Session.getEffectiveUser().getEmail();
    const zap = 'https://wa.me/55' + tel.replace(/^55/, '') + '?text=' + encodeURIComponent('Olá ' + nome.split(' ')[0] + ', aqui é do escritório do Dr. Lucas Semim. Você pediu uma orientação pelo nosso site. Pode falar agora?');
    const html = '<div style="font-family:Arial,sans-serif;max-width:600px;line-height:1.5">' +
      '<h2 style="margin:0 0 6px">🔁 Visitante recorrente · ' + ccEsc(nome) + '</h2>' +
      '<p style="margin:0 0 4px"><b>WhatsApp:</b> ' + ccEsc(ccS(d.telefone)) + '</p>' +
      '<p style="margin:0 0 4px"><b>Já foi atendido?</b> ' + ccEsc(ccS(d.jaAtendido)) + ' · <b>Avaliação:</b> ' + ccEsc(ccS(d.avaliacao) || '—') + ' · <b>Situação:</b> ' + ccEsc(ccS(d.situacao) || '—') + '</p>' +
      '<p style="margin:0 0 12px;color:#666"><b>Página:</b> ' + ccEsc(ccS(d.pagina)) + ' · visita nº ' + ccEsc(String(d.visitas || '?')) + '</p>' +
      '<a href="' + zap + '" style="background:#25d366;color:#fff;padding:10px 14px;border-radius:6px;text-decoration:none;font-weight:bold">💬 Chamar no WhatsApp</a>' +
      '<p style="color:#999;font-size:12px;margin-top:14px">Lead do widget de retorno do site cível.</p></div>';
    MailApp.sendEmail({ to: emailAdv, subject: '🔁 Lead de retorno (cível) · ' + nome, htmlBody: html, body: 'Lead de retorno cível: ' + nome + ' ' + ccS(d.telefone) + ' — ' + zap });
    return ccJson({ status: 'sucesso' });
  } catch (erro) {
    try { console.error('RetornoCivel: ' + erro.message); } catch (_) {}
    return ccJson({ status: 'erro', mensagem: String(erro.message || erro).slice(0, 120) });
  }
}

// ===================== UTILITÁRIOS =====================
function cvProtocolo() {
  return 'LC-' + Utilities.formatDate(new Date(), 'GMT-3', 'yyMMdd') + '-' + Utilities.getUuid().replace(/-/g, '').slice(0, 4).toUpperCase();
}
function cvLimiteTaxa(whats) {
  const cache = CacheService.getScriptCache(), chave = 'cv_' + ccDig(whats);
  const n = parseInt(cache.get(chave) || '0', 10);
  if (n >= CV_LIMITE_ENVIOS_HORA) throw new Error('Muitos envios deste número. Chame o escritório pelo WhatsApp.');
  cache.put(chave, String(n + 1), 3600);
}

// ===================== TESTES (rodar no editor) =====================
/** 1) Rode UMA VEZ e aceite as permissões (se já autorizou a Central do Caso, nada novo é pedido). */
function autorizarCentralCivel() {
  MailApp.getRemainingDailyQuota();
  CalendarApp.getDefaultCalendar().getName();
  DriveApp.getFolderById(ID_RAIZ_ESCRITORIO).getName();
  UrlFetchApp.fetch('https://www.google.com', { muteHttpExceptions: true });
  Logger.log('Permissões OK.');
}
/** 2) Simula um caso. Cria a pasta "TESTE SITE ... - CÍVEL" — apague depois. */
function testarRetornoCivel() {
  const fake = { acao: 'lead_retorno_civel', nome: 'TESTE Retorno', telefone: '(31) 99999-0000', jaAtendido: 'nao', avaliacao: '', situacao: 'plano_saude', pagina: '/index.html', visitas: 3, campanha: 'organico', honeypot: '' };
  Logger.log(processarRetornoCivel({ postData: { contents: JSON.stringify(fake) } }).getContent());
}
function testarCentralCivel() {
  const fake = {
    acao: 'central_civel', assunto: 'saude', assuntoLabel: 'Plano de saúde',
    contato: { nome: 'TESTE Site Maria', whatsapp: '(31) 99999-0000', email: '', cidade: 'Sabará' },
    caso: { quando: 'No último mês', valor: 'R$ 5 a 20 mil', temProcesso: 'Ainda não', cnj: '', parteContraria: 'Plano de saúde X',
            relato: 'Teste do sistema. O plano negou a cirurgia de coluna indicada pelo médico, alegando carência. Tenho o laudo e a carta de negativa.' },
    consentimento: { lgpd: true, em: new Date().toISOString() }, honeypot: '', arquivos: []
  };
  const r = processarCentralCivel({ postData: { contents: JSON.stringify(fake) } });
  Logger.log(r.getContent());
}
