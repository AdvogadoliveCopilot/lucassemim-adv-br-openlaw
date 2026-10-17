/* =====================================================================
   CENTRAL DO CASO CÍVEL — Dr. Lucas Semim (central-do-caso-civel.html)
   5 passos: assunto → contato → caso → documentos → revisão/envio.
   Envia para o Apps Script "Api site" (acao: 'central_civel'): pasta no
   Drive, triagem por IA (uso interno), planilha e e-mail.
   Se o backend falhar, o lead NÃO se perde: cai no WhatsApp com a ficha pronta.
   ===================================================================== */
(function () {
  'use strict';

  var CFG = window.CV_CONFIG || {};
  var API = CFG.apiUrl || '';
  var WPP = String(CFG.whatsapp || '5531989420094');
  var DRAFT = 'cv_central_draft_v1';
  var MAX_FILE = 8 * 1024 * 1024, MAX_FILES = 12, MAX_TOTAL_B64 = 24 * 1024 * 1024;

  var ASSUNTOS = [
    { v: 'saude',       l: 'Plano de saúde',        i: 'fa-heart-pulse',        d: 'Negativa, reajuste abusivo, cancelamento',
      ph: 'Ex.: o plano negou a cirurgia / o reajuste foi de 40% / cancelaram meu contrato…', q: 'Qual procedimento ou problema, e qual plano?' },
    { v: 'rmc',         l: 'Cartão RMC / consignado', i: 'fa-credit-card',      d: 'Desconto no INSS que você não reconhece',
      ph: 'Ex.: vejo um desconto de cartão no meu benefício e nunca contratei…', q: 'Qual banco aparece no extrato do INSS?' },
    { v: 'golpe',       l: 'Golpe do Pix / fraude',  i: 'fa-user-secret',        d: 'Pix enviado, conta invadida, falso atendente',
      ph: 'Ex.: caí em um golpe, fiz um Pix de R$ … e o banco não devolveu…', q: 'Qual banco e qual o valor perdido?' },
    { v: 'banco',       l: 'Banco, juros e dívidas', i: 'fa-building-columns',   d: 'Juros abusivos, nome negativado, superendividamento',
      ph: 'Ex.: meu nome foi negativado por uma dívida que não é minha…', q: 'Qual instituição e que valor está em discussão?' },
    { v: 'seguro',      l: 'Seguro negado',         i: 'fa-file-shield',        d: 'Seguradora recusou o pagamento',
      ph: 'Ex.: o seguro de vida / do carro foi negado depois do sinistro…', q: 'Qual seguradora e que tipo de seguro?' },
    { v: 'acidente',    l: 'Acidente de trânsito',   i: 'fa-car-burst',          d: 'Lesão, morte, danos ao veículo',
      ph: 'Ex.: fui atingido por um carro, tenho lesões e o motorista não assumiu…', q: 'Houve boletim de ocorrência? Quem foi o responsável?' },
    { v: 'erro-medico', l: 'Erro médico',           i: 'fa-user-doctor',        d: 'Falha em tratamento, cirurgia ou diagnóstico',
      ph: 'Ex.: depois da cirurgia fiquei com sequela e o hospital não se responsabilizou…', q: 'Qual hospital/médico e o que aconteceu?' },
    { v: 'bets',        l: 'Bets e apostas',        i: 'fa-dice',               d: 'Perdas em sites de apostas, ludopatia',
      ph: 'Ex.: perdi valores em um site de apostas e não consigo sacar meu saldo…', q: 'Qual site e quanto foi depositado/perdido?' },
    { v: 'usucapiao',   l: 'Usucapião',             i: 'fa-house-chimney',      d: 'Moro no imóvel há anos sem escritura',
      ph: 'Ex.: moro há 12 anos neste terreno e não tenho a escritura…', q: 'Há quantos anos mora e onde fica o imóvel?' },
    { v: 'familia',     l: 'Família e inventário',  i: 'fa-people-roof',        d: 'Herança, partilha, divórcio, pensão',
      ph: 'Ex.: meu pai faleceu e deixou imóveis, precisamos fazer o inventário…', q: 'Quantos herdeiros e quais bens?' },
    { v: 'contratos',   l: 'Contratos e cobranças', i: 'fa-file-signature',     d: 'Descumprimento, execução, dívida a receber',
      ph: 'Ex.: fiz um negócio, a outra parte não cumpriu e quero receber…', q: 'Há contrato ou comprovantes? Qual o valor?' },
    { v: 'outro',       l: 'Outro assunto',         i: 'fa-circle-question',    d: 'Não achou o seu? Conte aqui',
      ph: 'Conte com suas palavras o que aconteceu…', q: 'Quem causou o problema?' }
  ];
  var CIDADES = ['Sabará', 'Belo Horizonte', 'Contagem', 'Betim', 'Ribeirão das Neves', 'Santa Luzia', 'Nova Lima', 'Caeté', 'Esmeraldas', 'Vespasiano', 'Lagoa Santa', 'Ibirité', 'Outra cidade'];
  var QUANDO = [{ v: 'semana', l: 'Nesta semana' }, { v: 'mes', l: 'No último mês' }, { v: 'ano', l: 'Neste ano' }, { v: '1-3', l: 'Há 1 a 3 anos' }, { v: '3+', l: 'Há mais de 3 anos' }, { v: 'naosei', l: 'Não sei' }];
  var VALOR = [{ v: 'ate1', l: 'Até R$ 1 mil' }, { v: '1-5', l: 'R$ 1 a 5 mil' }, { v: '5-20', l: 'R$ 5 a 20 mil' }, { v: '20-100', l: 'R$ 20 a 100 mil' }, { v: '100+', l: 'Mais de R$ 100 mil' }, { v: 'naosei', l: 'Não sei' }];
  var PROC = [{ v: 'nao', l: 'Ainda não' }, { v: 'sim', l: 'Já tenho processo' }, { v: 'naosei', l: 'Não sei' }];
  var CATS = [{ v: 'pessoal', l: 'Documento pessoal' }, { v: 'contrato', l: 'Contrato / extrato' }, { v: 'prova', l: 'Foto / print' }, { v: 'negativa', l: 'Negativa / carta' }];
  var STEPS = ['Assunto', 'Contato', 'Caso', 'Documentos', 'Envio'];
  var FLOW = ['assunto', 'contato', 'caso', 'docs', 'enviar'];

  var S = { step: 'assunto', d: {}, files: [], cat: 'contrato', busy: false, done: null };
  var root;

  function $(s, c) { return (c || root).querySelector(s); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]; }); }
  function digits(s) { return String(s || '').replace(/\D/g, ''); }
  function lab(list, v) { for (var i = 0; i < list.length; i++) if (list[i].v === v) return list[i].l; return ''; }
  function assunto() { for (var i = 0; i < ASSUNTOS.length; i++) if (ASSUNTOS[i].v === S.d.assunto) return ASSUNTOS[i]; return null; }
  function track(ev, x) { try { window.dataLayer = window.dataLayer || []; var o = { event: ev, assunto: S.d.assunto || '' }; for (var k in (x || {})) o[k] = x[k]; window.dataLayer.push(o); } catch (e) {} }
  function maskPhone(v) { var d = digits(v).slice(0, 11); if (d.length > 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2, d.length - 4) + '-' + d.slice(-4); if (d.length > 2) return '(' + d.slice(0, 2) + ') ' + d.slice(2); return d; }
  function maskCnj(v) { var d = digits(v).slice(0, 20); var o = d.slice(0, 7); if (d.length > 7) o += '-' + d.slice(7, 9); if (d.length > 9) o += '.' + d.slice(9, 13); if (d.length > 13) o += '.' + d.slice(13, 14); if (d.length > 14) o += '.' + d.slice(14, 16); if (d.length > 16) o += '.' + d.slice(16, 20); return o; }
  function saveDraft() { try { sessionStorage.setItem(DRAFT, JSON.stringify({ d: S.d, s: S.step })); } catch (e) {} }
  function loadDraft() { try { var j = JSON.parse(sessionStorage.getItem(DRAFT) || 'null'); if (j && j.d) { S.d = j.d; if (FLOW.indexOf(j.s) > -1) S.step = j.s; } } catch (e) {} }
  function clearDraft() { try { sessionStorage.removeItem(DRAFT); } catch (e) {} }

  /* ---------- views ---------- */
  function stepper() {
    var idx = FLOW.indexOf(S.step);
    return '<ol class="cv-steps">' + STEPS.map(function (n, i) { return '<li class="' + (i < idx ? 'done' : i === idx ? 'now' : '') + '"><span>' + n + '</span></li>'; }).join('') + '</ol>';
  }
  function chips(name, list) {
    return '<div class="cv-chips" role="group">' + list.map(function (o) {
      return '<button type="button" class="cv-chip" data-chip="' + name + '" data-v="' + o.v + '" aria-pressed="' + (S.d[name] === o.v) + '">' + esc(o.l) + '</button>';
    }).join('') + '</div>';
  }
  function row(label, inner, hint) { return '<div class="cv-row"><label class="cv-lab">' + label + '</label>' + inner + (hint ? '<p class="cv-hint">' + hint + '</p>' : '') + '</div>'; }

  var VIEW = {
    assunto: function () {
      return '<h2 class="cv-h">O que aconteceu com você?</h2><p class="cv-p">Escolha o assunto que mais se parece com o seu caso.</p>' +
        '<div class="cv-grid">' + ASSUNTOS.map(function (a) {
          return '<button type="button" class="cv-opt" data-assunto="' + a.v + '" aria-pressed="' + (S.d.assunto === a.v) + '"><i class="fas ' + a.i + '"></i><b>' + esc(a.l) + '</b><small>' + esc(a.d) + '</small></button>';
        }).join('') + '</div>';
    },
    contato: function () {
      var d = S.d;
      return '<h2 class="cv-h">Como falamos com você?</h2><p class="cv-p">Usamos só para responder sobre o seu caso. Sigilo profissional garantido.</p>' +
        '<div id="err" class="cv-err" role="alert"></div>' +
        row('Seu nome', '<input class="cv-in" id="f-nome" autocomplete="name" value="' + esc(d.nome) + '" placeholder="Nome completo">') +
        '<div class="cv-row two"><div><label class="cv-lab">WhatsApp</label><input class="cv-in" id="f-whats" inputmode="tel" autocomplete="tel" value="' + esc(d.whats) + '" placeholder="(31) 9 0000-0000"></div>' +
        '<div><label class="cv-lab">E-mail <small>(opcional)</small></label><input class="cv-in" id="f-email" type="email" autocomplete="email" value="' + esc(d.email) + '" placeholder="voce@email.com"></div></div>' +
        row('Cidade', '<select class="cv-sel" id="f-cidade"><option value="">Selecione</option>' + CIDADES.map(function (c) { return '<option' + (d.cidade === c ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</select>') +
        '<input class="cv-hp" id="f-hp" tabindex="-1" autocomplete="off" aria-hidden="true">';
    },
    caso: function () {
      var d = S.d, a = assunto() || ASSUNTOS[ASSUNTOS.length - 1];
      return '<h2 class="cv-h">Conte o seu caso</h2><p class="cv-p">Quanto mais claro, melhor a análise. Não precisa de linguagem jurídica.</p>' +
        '<div id="err" class="cv-err" role="alert"></div>' +
        row('Quando aconteceu?', chips('quando', QUANDO), 'O prazo para agir depende da data.') +
        row('Qual o valor envolvido?', chips('valor', VALOR)) +
        row('Já existe processo?', chips('proc', PROC)) +
        (d.proc === 'sim' ? row('Número do processo <small>(se tiver)</small>', '<input class="cv-in" id="f-cnj" inputmode="numeric" value="' + esc(d.cnj) + '" placeholder="0000000-00.0000.0.00.0000">') : '') +
        row(esc(a.q), '<input class="cv-in" id="f-parte" value="' + esc(d.parte) + '" placeholder="Empresa, banco, plano, pessoa…">') +
        row('O que aconteceu?', '<textarea class="cv-ta" id="f-relato" placeholder="' + esc(a.ph) + '">' + esc(d.relato) + '</textarea>');
    },
    docs: function () {
      return '<h2 class="cv-h">Envie seus documentos</h2><p class="cv-p">Contrato, extrato, negativa, prints, fotos. Se não tiver agora, pode pular e mandar depois pelo WhatsApp.</p>' +
        '<div id="err" class="cv-err" role="alert"></div>' +
        '<div class="cv-chips" style="margin-bottom:12px">' + CATS.map(function (c) { return '<button type="button" class="cv-chip" data-cat="' + c.v + '" aria-pressed="' + (S.cat === c.v) + '">' + c.l + '</button>'; }).join('') + '</div>' +
        '<div class="cv-drop" id="drop" tabindex="0" role="button" aria-label="Anexar arquivos"><i class="fas fa-cloud-arrow-up"></i><b>Toque ou arraste para anexar</b><small>Foto, print ou PDF. Até 8 MB por arquivo, até ' + MAX_FILES + ' arquivos.</small></div>' +
        '<input type="file" id="file" multiple accept="image/*,application/pdf" hidden>' +
        '<ul class="cv-files" id="files"></ul>';
    },
    enviar: function () {
      var d = S.d, a = assunto();
      var li = function (k, v) { return '<li><span>' + k + '</span><span>' + esc(v || '—') + '</span></li>'; };
      return '<h2 class="cv-h">Confira e envie</h2><p class="cv-p">Está tudo certo? O Dr. Lucas recebe a ficha organizada e responde pelo WhatsApp.</p>' +
        '<div id="err" class="cv-err" role="alert"></div>' +
        '<ul class="cv-sum">' + li('Assunto', a ? a.l : '') + li('Nome', d.nome) + li('WhatsApp', d.whats) + li('Cidade', d.cidade) + li('Quando', lab(QUANDO, d.quando)) + li('Valor', lab(VALOR, d.valor)) + li('Processo', lab(PROC, d.proc)) + li('Documentos', S.files.length ? S.files.length + ' arquivo(s)' : 'nenhum por enquanto') + '</ul>' +
        '<label class="cv-consent"><input type="checkbox" id="f-lgpd"' + (d.lgpd ? ' checked' : '') + '><span>Autorizo o uso destes dados e documentos apenas para análise do meu caso pelo escritório, conforme a LGPD e o sigilo profissional (Estatuto da Advocacia, art. 25).</span></label>';
    }
  };

  function nav() {
    var i = FLOW.indexOf(S.step), last = S.step === 'enviar';
    var skip = S.step === 'docs' ? '<button type="button" class="cv-skip" data-act="next">Pular esta etapa</button>' : '';
    return '<div class="cv-nav">' + (i > 0 ? '<button type="button" class="cv-btn ghost" data-act="prev"><i class="fas fa-arrow-left"></i></button>' : '') +
      '<button type="button" class="cv-btn main" data-act="' + (last ? 'submit' : 'next') + '">' + (last ? '<i class="fab fa-whatsapp"></i> Enviar meu caso' : 'Continuar <i class="fas fa-arrow-right"></i>') + '</button></div>' + skip;
  }

  function render() {
    if (S.done) return renderDone();
    var view = VIEW[S.step]();
    root.innerHTML = '<div class="cv-card">' + stepper() + '<div id="stepbox">' + view + '</div>' + (S.step === 'assunto' ? '' : nav()) + '</div><div class="cv-sending" id="sending"><div><i class="fas fa-circle-notch"></i>Enviando seu caso…</div></div>';
    if (S.step === 'docs') renderFiles();
  }

  /* ---------- validação ---------- */
  function showErr(msg, id) {
    var box = $('#err'); if (box) { box.textContent = msg; box.classList.add('on'); }
    var el = id && $('#' + id); if (el) { el.classList.add('err'); el.focus(); } else if (box) box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return false;
  }
  function validate(step) {
    var d = S.d;
    if (step === 'contato') {
      if (!d.nome || d.nome.trim().length < 3) return showErr('Informe seu nome completo.', 'f-nome');
      if (digits(d.whats).length < 10) return showErr('Informe um WhatsApp com DDD.', 'f-whats');
      if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return showErr('Esse e-mail parece incorreto.', 'f-email');
      if (!d.cidade) return showErr('Escolha sua cidade.', 'f-cidade');
    }
    if (step === 'caso') {
      if (!d.quando) return showErr('Diga quando aconteceu. Se não souber, marque “Não sei”.');
      if (!d.proc) return showErr('Diga se já existe processo.');
      if (!d.relato || d.relato.trim().length < 20) return showErr('Conte um pouco mais do que aconteceu (pelo menos uma ou duas frases).', 'f-relato');
    }
    if (step === 'enviar' && !d.lgpd) return showErr('Marque a autorização para enviarmos o caso.', 'f-lgpd');
    return true;
  }
  function collect() {
    var g = function (id) { var e = $('#' + id); return e ? e.value : undefined; };
    var d = S.d;
    if (S.step === 'contato') { d.nome = g('f-nome'); d.whats = g('f-whats'); d.email = g('f-email'); d.cidade = g('f-cidade'); }
    if (S.step === 'caso') { d.parte = g('f-parte'); d.relato = g('f-relato'); var c = g('f-cnj'); if (c !== undefined) d.cnj = c; }
    if (S.step === 'enviar') { var l = $('#f-lgpd'); d.lgpd = !!(l && l.checked); }
  }
  function go(step) { S.step = step; saveDraft(); render(); window.scrollTo({ top: Math.max(0, root.getBoundingClientRect().top + window.pageYOffset - 90), behavior: 'smooth' }); }

  /* ---------- arquivos ---------- */
  function safeName(n) { return String(n || 'arquivo').replace(/[^\w.\- ]+/g, '_').slice(0, 80); }
  function readB64(blob) { return new Promise(function (ok, no) { var r = new FileReader(); r.onload = function () { ok(String(r.result).split(',')[1]); }; r.onerror = no; r.readAsDataURL(blob); }); }
  function shrink(file) {
    return new Promise(function (ok, no) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var max = 1800, w = img.naturalWidth, h = img.naturalHeight, r = Math.min(1, max / Math.max(w, h));
        var c = document.createElement('canvas'); c.width = Math.round(w * r); c.height = Math.round(h * r);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(function (b) { URL.revokeObjectURL(url); b ? ok(b) : no(new Error('blob')); }, 'image/jpeg', 0.82);
      };
      img.onerror = function () { URL.revokeObjectURL(url); no(new Error('img')); };
      img.src = url;
    });
  }
  function totalB64() { return S.files.reduce(function (a, f) { return a + f.data.length; }, 0); }
  async function addFiles(list) {
    var msg = [];
    for (var i = 0; i < list.length; i++) {
      var f = list[i];
      if (S.files.length >= MAX_FILES) { msg.push('Limite de ' + MAX_FILES + ' arquivos. Mande o restante pelo WhatsApp.'); break; }
      var isImg = /^image\//.test(f.type), isPdf = f.type === 'application/pdf';
      if (!isImg && !isPdf) { msg.push('“' + f.name + '”: envie foto ou PDF.'); continue; }
      try {
        var blob = f, mime = f.type, name = safeName(f.name), thumb = '';
        if (isImg) { try { blob = await shrink(f); mime = 'image/jpeg'; name = name.replace(/\.[^.]+$/, '') + '.jpg'; thumb = URL.createObjectURL(blob); } catch (e) { blob = f; } }
        if (blob.size > MAX_FILE) { msg.push('“' + f.name + '” passa de 8 MB. Mande pelo WhatsApp.'); continue; }
        var data = await readB64(blob);
        if (totalB64() + data.length > MAX_TOTAL_B64) { msg.push('Limite total de envio atingido. Mande o restante pelo WhatsApp.'); break; }
        S.files.push({ id: Date.now() + '' + i, nome: name, mimeType: mime, size: blob.size, data: data, categoria: S.cat, thumb: thumb });
      } catch (e) { msg.push('Não consegui ler “' + f.name + '”.'); }
    }
    renderFiles();
    var box = $('#err'); if (box) { if (msg.length) { box.textContent = msg.join(' '); box.classList.add('on'); } else box.classList.remove('on'); }
  }
  function renderFiles() {
    var ul = $('#files'); if (!ul) return;
    ul.innerHTML = S.files.map(function (f) {
      return '<li>' + (f.thumb ? '<img class="th" src="' + f.thumb + '" alt="">' : '<span class="th"><i class="fas fa-file-pdf"></i></span>') + '<span class="nm">' + esc(f.nome) + '</span><span class="sz">' + (f.size > 1048576 ? (f.size / 1048576).toFixed(1) + ' MB' : Math.round(f.size / 1024) + ' KB') + '</span><button type="button" data-act="rm" data-id="' + f.id + '" aria-label="Remover">✕</button></li>';
    }).join('');
  }

  /* ---------- envio ---------- */
  function payload() {
    var d = S.d, a = assunto();
    return {
      acao: 'central_civel', versao: CFG.versao || '', assunto: d.assunto, assuntoLabel: a ? a.l : '',
      contato: { nome: (d.nome || '').trim(), whatsapp: d.whats, email: (d.email || '').trim(), cidade: d.cidade },
      caso: { quando: lab(QUANDO, d.quando), valor: lab(VALOR, d.valor), temProcesso: lab(PROC, d.proc), cnj: d.cnj || '', parteContraria: (d.parte || '').trim(), relato: (d.relato || '').trim() },
      consentimento: { lgpd: true, em: new Date().toISOString() },
      origem: { url: location.href, ref: document.referrer || '', ua: navigator.userAgent.slice(0, 120) },
      honeypot: ($('#f-hp') || {}).value || '',
      arquivos: S.files.map(function (f) { return { nome: f.nome, mimeType: f.mimeType, data: f.data, categoria: f.categoria }; })
    };
  }
  function wppText(proto) {
    var d = S.d, a = assunto();
    var t = 'Olá Dr. Lucas, enviei meu caso cível pelo site' + (proto ? ' (protocolo ' + proto + ')' : '') + '.\nAssunto: ' + (a ? a.l : '') + '\nNome: ' + (d.nome || '') + '\nCidade: ' + (d.cidade || '');
    if (d.quando) t += '\nQuando: ' + lab(QUANDO, d.quando);
    if (d.parte) t += '\nContra: ' + d.parte;
    if (d.relato) t += '\nRelato: ' + d.relato.slice(0, 600);
    return t;
  }
  function wppLink(proto) { return 'https://wa.me/' + WPP + '?text=' + encodeURIComponent(wppText(proto)); }

  async function submit() {
    if (S.busy) return; collect(); if (!validate('enviar')) return;
    var hp = $('#f-hp'); if (hp && hp.value) return;
    S.busy = true; var ov = $('#sending'); if (ov) ov.classList.add('on');
    track('cv_central_submit', { arquivos: S.files.length });
    try {
      if (!API) throw new Error('backend não configurado');
      var ctl = new AbortController(), to = setTimeout(function () { ctl.abort(); }, 150000);
      var resp = await fetch(API, { method: 'POST', body: JSON.stringify(payload()), signal: ctl.signal });
      clearTimeout(to);
      var j = await resp.json();
      if (j.status !== 'sucesso') throw new Error(j.mensagem || 'erro no servidor');
      S.done = { ok: true, proto: j.protocolo || '' }; clearDraft(); track('cv_central_ok');
    } catch (e) { S.done = { ok: false, erro: (e && e.message) || 'falha de conexão' }; track('cv_central_fail'); }
    S.busy = false; render(); window.scrollTo({ top: Math.max(0, root.getBoundingClientRect().top + window.pageYOffset - 90), behavior: 'smooth' });
  }

  function renderDone() {
    var r = S.done, html;
    if (r.ok) {
      html = '<div class="cv-card"><div class="cv-ok"><div class="big"><i class="fas fa-check"></i></div><h2 class="cv-h">Caso recebido</h2>' +
        '<p class="cv-p">Seu caso já está com o Dr. Lucas, organizado e com os documentos que você enviou.</p>' +
        (r.proto ? '<div class="cv-proto"><span id="proto">' + esc(r.proto) + '</span><button type="button" data-act="copy" aria-label="Copiar protocolo"><i class="far fa-copy"></i></button></div>' : '') +
        '<ul class="cv-tl"><li class="ok"><b>Caso recebido</b> e guardado com sigilo</li><li class="now"><b>Análise do advogado</b> sobre direito, prazo e provas</li><li><b>Contato pelo WhatsApp</b> com o próximo passo e as condições</li></ul>' +
        '<div class="cv-nav"><a class="cv-btn wpp" href="' + wppLink(r.proto) + '" target="_blank" rel="noopener"><i class="fab fa-whatsapp"></i> Continuar no WhatsApp</a></div></div></div>';
    } else {
      html = '<div class="cv-card"><div class="cv-ok"><div class="big" style="background:linear-gradient(135deg,#ffd37a,#e0a21b);color:#2a1c00"><i class="fas fa-triangle-exclamation"></i></div><h2 class="cv-h">Quase lá: envie pelo WhatsApp</h2>' +
        '<p class="cv-p">Não conseguimos enviar o formulário agora. <b>Seus dados não foram perdidos</b>: toque no botão e a ficha vai pronta na conversa com o Dr. Lucas.' + (S.files.length ? ' Depois, mande os ' + S.files.length + ' documento(s) na mesma conversa.' : '') + '</p>' +
        '<div class="cv-nav"><a class="cv-btn wpp" href="' + wppLink('') + '" target="_blank" rel="noopener"><i class="fab fa-whatsapp"></i> Enviar ficha no WhatsApp</a><button type="button" class="cv-btn ghost" data-act="retry">Tentar de novo</button></div></div></div>';
    }
    root.innerHTML = html;
  }

  /* ---------- eventos ---------- */
  function onClick(ev) {
    var t = ev.target;
    var a = t.closest('[data-assunto]'); if (a) { S.d.assunto = a.getAttribute('data-assunto'); track('cv_central_assunto'); go('contato'); return; }
    var c = t.closest('[data-chip]'); if (c) { collect(); S.d[c.getAttribute('data-chip')] = c.getAttribute('data-v'); saveDraft(); var sy = window.pageYOffset; render(); window.scrollTo(0, sy); return; }
    var k = t.closest('[data-cat]'); if (k) { S.cat = k.getAttribute('data-cat'); render(); return; }
    var b = t.closest('[data-act]'); if (!b) { if (t.closest('#drop')) $('#file').click(); return; }
    var act = b.getAttribute('data-act');
    if (act === 'next') { collect(); if (validate(S.step)) go(FLOW[FLOW.indexOf(S.step) + 1]); }
    else if (act === 'prev') { collect(); go(FLOW[Math.max(0, FLOW.indexOf(S.step) - 1)]); }
    else if (act === 'submit') submit();
    else if (act === 'rm') { S.files = S.files.filter(function (f) { return f.id !== b.getAttribute('data-id'); }); renderFiles(); }
    else if (act === 'copy') { var p = $('#proto'); if (p && navigator.clipboard) navigator.clipboard.writeText(p.textContent); }
    else if (act === 'retry') { S.done = null; render(); }
  }
  function onInput(ev) {
    var t = ev.target;
    if (t.id === 'f-whats') t.value = maskPhone(t.value);
    if (t.id === 'f-cnj') t.value = maskCnj(t.value);
    t.classList && t.classList.remove('err');
    collect(); saveDraft();
  }

  function init() {
    root = document.getElementById('cv-root'); if (!root) return;
    loadDraft();
    try {
      var q = new URLSearchParams(location.search).get('assunto');
      if (q) { for (var i = 0; i < ASSUNTOS.length; i++) if (ASSUNTOS[i].v === q) { S.d.assunto = q; if (S.step === 'assunto') S.step = 'contato'; } }
    } catch (e) {}
    render();
    root.addEventListener('click', onClick);
    root.addEventListener('input', onInput);
    root.addEventListener('change', function (e) { if (e.target.id === 'file') { addFiles(Array.prototype.slice.call(e.target.files)); e.target.value = ''; } else onInput(e); });
    root.addEventListener('dragover', function (e) { var dz = e.target.closest('#drop'); if (dz) { e.preventDefault(); dz.classList.add('over'); } });
    root.addEventListener('dragleave', function (e) { var dz = e.target.closest('#drop'); if (dz) dz.classList.remove('over'); });
    root.addEventListener('drop', function (e) { var dz = e.target.closest('#drop'); if (dz) { e.preventDefault(); dz.classList.remove('over'); addFiles(Array.prototype.slice.call(e.dataTransfer.files)); } });
    root.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.id === 'drop') { e.preventDefault(); $('#file').click(); } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
