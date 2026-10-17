/* =====================================================================
   CENTRAL DO CASO — Dr. Lucas Semim (diagnostico.html)
   3 caminhos: URGÊNCIA (despacho de advogado) · MONTAR O PROCESSO ·
   ESCRITÓRIO BUSCA OS DADOS (REDS/BO, processo, SEEU).
   Envia tudo para o Apps Script "Api site" -> Google Drive / Planilha /
   Gemini / e-mail / Agenda. Se o backend falhar, o lead NÃO se perde:
   cai no WhatsApp com a ficha pronta.
   ===================================================================== */
(function () {
  'use strict';

  var CFG = window.LS_CONFIG || {};
  var API = CFG.apiUrl || '';
  var WPP = String(CFG.whatsapp || '5531989420094');
  var DRAFT_KEY = 'ls_central_draft_v1';
  var MAX_FILE = 8 * 1024 * 1024, MAX_FILES = 12, MAX_TOTAL_B64 = 24 * 1024 * 1024;

  var CIDADES = ['Sabará','Belo Horizonte','Contagem','Betim','Ribeirão das Neves','Santa Luzia','Esmeraldas','Caeté','Nova Lima','Vespasiano','Lagoa Santa','São José da Lapa','Pedro Leopoldo','Ibirité','Igarapé','São Joaquim de Bicas','Brumadinho','Mateus Leme','Sarzedo','Raposos','Taquaraçu de Minas','Outra cidade'];
  var UNIDADES = ['Complexo Penitenciário Nelson Hungria (Contagem)','Complexo Penitenciário Estevão Pinto (Belo Horizonte)','CERESP Gameleira (Belo Horizonte)','Presídio de São Joaquim de Bicas I','Presídio de São Joaquim de Bicas II','Penitenciária José Maria Alkmin (Ribeirão das Neves)','Presídio Inspetor José Martinho Drumond (Ribeirão das Neves)'];
  var LOCAL_TIPOS = [
    { v: 'delegacia', l: 'Delegacia', i: 'fa-building-shield' },
    { v: 'presidio', l: 'Presídio / Penitenciária', i: 'fa-lock' },
    { v: 'pm', l: 'Viatura / Quartel da PM', i: 'fa-car-side' },
    { v: 'hospital', l: 'Hospital', i: 'fa-hospital' },
    { v: 'naosei', l: 'Não sei onde está', i: 'fa-circle-question' }
  ];
  var QUANDO = [
    { v: 'agora', l: 'Agora há pouco' }, { v: 'horas', l: 'Há algumas horas' },
    { v: 'hoje', l: 'Hoje cedo' }, { v: 'ontem', l: 'Ontem ou antes' }
  ];
  var CUSTODIA = [
    { v: 'nao', l: 'Ainda não' }, { v: 'sim', l: 'Já foi' }, { v: 'naosei', l: 'Não sei' }
  ];
  var CRIMES = ['Tráfico de drogas','Furto','Roubo','Violência doméstica / Maria da Penha','Homicídio / Tribunal do Júri','Lesão corporal','Embriaguez ao volante / trânsito','Porte ou posse de arma','Estelionato / golpe','Crime eleitoral','Receptação','Outro / não sei'];
  var FASES = [
    { v: 'flagrante', l: 'Prisão em flagrante' }, { v: 'inquerito', l: 'Inquérito policial' },
    { v: 'denuncia', l: 'Denúncia recebida' }, { v: 'instrucao', l: 'Instrução (audiências)' },
    { v: 'sentenca', l: 'Sentença' }, { v: 'recurso', l: 'Recurso' },
    { v: 'execucao', l: 'Execução da pena' }, { v: 'intimacao', l: 'Intimação / mandado' },
    { v: 'naosei', l: 'Não sei' }
  ];
  var RELACAO = [
    { v: 'proprio', l: 'Sou eu mesmo(a)' }, { v: 'familiar', l: 'Familiar' },
    { v: 'amigo', l: 'Amigo(a) / companheiro(a)' }, { v: 'outro', l: 'Outra pessoa' }
  ];
  var BUSCAS = [
    { v: 'reds', t: 'Boletim de Ocorrência / REDS', d: 'O escritório localiza o registro, lê e organiza os dados do fato.' },
    { v: 'processo', t: 'Consulta do processo ou inquérito', d: 'PJe, TJMG, TRF6, SEEU: fase, decisões, prazos e audiências marcadas.' },
    { v: 'flagrante', t: 'Auto de prisão em flagrante e custódia', d: 'Cópia do auto, depoimentos e situação da audiência de custódia.' },
    { v: 'antecedentes', t: 'Certidões e antecedentes criminais', d: 'Para saber o que já consta antes de definir a estratégia.' },
    { v: 'execucao', t: 'Situação da execução penal (SEEU)', d: 'Regime, progressão, saidinha, tornozeleira, livramento condicional.' },
    { v: 'provas', t: 'Provas de terceiros', d: 'Câmeras, laudos e perícias: pedido de preservação e requisição.' }
  ];
  var CATS = [
    { v: 'pessoal', l: 'Documento pessoal', i: 'fa-id-card' }, { v: 'reds', l: 'REDS / BO', i: 'fa-file-shield' },
    { v: 'intimacao', l: 'Intimação / mandado', i: 'fa-triangle-exclamation' }, { v: 'peca', l: 'Peça do processo', i: 'fa-file-lines' },
    { v: 'prova', l: 'Foto / vídeo / print', i: 'fa-camera' }
  ];
  var MODOS = {
    urgencia: { l: 'Urgência — pessoa presa agora', flow: ['modo','contato','local','fato','docs','enviar'], steps: ['Caminho','Contato','Local','Fatos','Provas','Envio'] },
    processo: { l: 'Montar o meu processo', flow: ['modo','contato','caso','docs','busca','enviar'], steps: ['Caminho','Contato','Caso','Documentos','Buscas','Envio'] },
    busca:    { l: 'Escritório busca os dados', flow: ['modo','contato','caso','busca','docs','enviar'], steps: ['Caminho','Contato','Caso','Buscas','Documentos','Envio'] }
  };

  var T0 = Date.now(); // ESCUDO 04/10/2026: o servidor desconfia de formulario enviado em menos de 4 s (robo)
  var S = { step: 'modo', data: { crimes: [], buscas: [] }, files: [], cat: 'reds', busy: false, done: null };
  var root;

  /* ---------- utilidades ---------- */
  function $(s, c) { return (c || root).querySelector(s); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]; }); }
  function digits(s) { return String(s || '').replace(/\D/g, ''); }
  function lab(list, v) { for (var i = 0; i < list.length; i++) if (list[i].v === v) return list[i].l; return ''; }
  function track(ev, extra) { try { window.dataLayer = window.dataLayer || []; var o = { event: ev, modo: S.data.modo || '' }; for (var k in (extra || {})) o[k] = extra[k]; window.dataLayer.push(o); } catch (e) {} }
  function maskPhone(v) { var d = digits(v).slice(0, 11); if (d.length > 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2, d.length - 4) + '-' + d.slice(-4); if (d.length > 2) return '(' + d.slice(0, 2) + ') ' + d.slice(2); return d; }
  function maskCpf(v) { var d = digits(v).slice(0, 11); return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2'); }
  function maskCnj(v) { var d = digits(v).slice(0, 20); var m = d.replace(/^(\d{0,7})(\d{0,2})(\d{0,4})(\d{0,1})(\d{0,2})(\d{0,4}).*$/, function (_, a, b, c, dd, e, f) { return a + (b ? '-' + b : '') + (c ? '.' + c : '') + (dd ? '.' + dd : '') + (e ? '.' + e : '') + (f ? '.' + f : ''); }); return m; }
  function saveDraft() { try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ d: S.data, s: S.step })); } catch (e) {} }
  function loadDraft() { try { var j = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null'); if (j && j.d && j.d.modo && MODOS[j.d.modo]) { S.data = j.d; S.data.crimes = S.data.crimes || []; S.data.buscas = S.data.buscas || []; if (MODOS[j.d.modo].flow.indexOf(j.s) > -1) S.step = j.s; } } catch (e) {} }
  function clearDraft() { try { sessionStorage.removeItem(DRAFT_KEY); } catch (e) {} }
  function mapsLink() { var d = S.data; return d.lLat ? 'https://www.google.com/maps?q=' + d.lLat + ',' + d.lLng : ''; }
  function flow() { return (MODOS[S.data.modo] || MODOS.urgencia).flow; }
  function isUrg() { return S.data.modo === 'urgencia'; }

  /* ---------- chips ---------- */
  function chips(key, list, opt) {
    opt = opt || {};
    var cur = S.data[key];
    return '<div class="cc-chips" role="group">' + list.map(function (it) {
      var v = typeof it === 'string' ? it : it.v, l = typeof it === 'string' ? it : it.l, ic = it.i;
      var on = opt.multi ? (cur || []).indexOf(v) > -1 : cur === v;
      return '<button type="button" class="cc-chip' + (on ? ' on' : '') + (opt.red ? ' red' : '') + '" data-k="' + key + '" data-v="' + esc(v) + '"' + (opt.multi ? ' data-multi="1"' : '') + ' aria-pressed="' + on + '">' + (ic ? '<i class="fa-solid ' + ic + '"></i>' : '') + esc(l) + '</button>';
    }).join('') + '</div>';
  }
  function field(label, html, hint, cls) { return '<div class="cc-f ' + (cls || '') + '"><label>' + label + '</label>' + html + (hint ? '<small>' + hint + '</small>' : '') + '</div>'; }
  function inp(k, o) { o = o || {}; return '<input class="cc-in" id="f-' + k + '" data-k="' + k + '" type="' + (o.type || 'text') + '" value="' + esc(S.data[k] || '') + '" placeholder="' + esc(o.ph || '') + '" autocomplete="' + (o.ac || 'off') + '"' + (o.inputmode ? ' inputmode="' + o.inputmode + '"' : '') + (o.list ? ' list="' + o.list + '"' : '') + (o.max ? ' maxlength="' + o.max + '"' : '') + '>'; }

  /* ---------- etapas ---------- */
  var VIEW = {
    modo: function () {
      return '<h2 class="cc-h">Qual é a <em>sua situação</em> agora?</h2><p class="cc-p">Escolha o caminho. Em 2 minutos o seu caso entra organizado no escritório: sem repetir a história, sem perder documento.</p>' +
        '<div class="cc-modes">' +
        '<button type="button" class="cc-mode urg" data-mode="urgencia"><span class="ico"><i class="fa-solid fa-triangle-exclamation"></i></span><h3>Alguém foi preso agora</h3><p>Diga onde a pessoa está. O escritório é acionado na hora e um advogado é designado para ir até o local.</p><span class="go">Acionar plantão →</span></button>' +
        '<button type="button" class="cc-mode proc" data-mode="processo"><span class="ico"><i class="fa-solid fa-folder-open"></i></span><h3>Montar o meu processo</h3><p>Já tem inquérito, processo ou intimação? Conte o caso, envie os documentos e a ficha fica pronta para análise.</p><span class="go">Montar o caso →</span></button>' +
        '<button type="button" class="cc-mode bus" data-mode="busca"><span class="ico"><i class="fa-solid fa-magnifying-glass-chart"></i></span><h3>Busquem os dados por mim</h3><p>Não tem os papéis? Autorize o escritório a buscar o BO/REDS, o processo e a situação da execução penal.</p><span class="go">Autorizar a busca →</span></button>' +
        '</div>' +
        '<p class="cc-hint" style="margin-top:18px"><i class="fa-solid fa-lock"></i> Sigilo profissional. Seus dados vão direto para a pasta privada do escritório e são tratados conforme a LGPD.</p>';
    },

    contato: function () {
      var d = S.data, prop = d.relacao === 'proprio';
      return '<h2 class="cc-h">Quem está <em>falando</em>?</h2><p class="cc-p">O advogado precisa saber com quem falar e sobre quem é o caso.</p>' +
        '<div class="cc-err" id="err"></div>' +
        '<div class="cc-row two">' + field('Seu nome *', inp('cNome', { ph: 'Nome e sobrenome', ac: 'name' })) + field('Seu WhatsApp *', inp('cWhats', { ph: '(31) 9XXXX-XXXX', type: 'tel', ac: 'tel', inputmode: 'tel', max: 15 })) + '</div>' +
        '<div class="cc-row two">' + field('E-mail (opcional)', inp('cEmail', { ph: 'seuemail@exemplo.com', type: 'email', ac: 'email' }), 'Para receber cópia de documentos, se quiser.') + '</div>' +
        '<div class="cc-row">' + field('Quem é você em relação ao caso? *', chips('relacao', RELACAO)) + '</div>' +
        (prop ? '' : '<div class="cc-row two">' + field('Nome da pessoa envolvida *', inp('pNome', { ph: 'Quem foi preso / investigado / réu', ac: 'off' })) + field('CPF dela (opcional)', inp('pCpf', { ph: '000.000.000-00', inputmode: 'numeric', max: 14 }), 'Ajuda o escritório a localizar o REDS e o processo.') + '</div>') +
        (prop ? '<div class="cc-row two">' + field('Seu CPF (opcional)', inp('pCpf', { ph: '000.000.000-00', inputmode: 'numeric', max: 14 }), 'Ajuda o escritório a localizar o REDS e o processo.') + '</div>' : '') +
        '<div class="cc-hp" aria-hidden="true"><label>Site <input type="text" id="f-hp" tabindex="-1" autocomplete="off"></label></div>';
    },

    local: function () {
      var d = S.data, tipo = d.lTipo, geo = d.lLat;
      var ph = tipo === 'presidio' ? 'Nome da unidade prisional' : tipo === 'delegacia' ? 'Ex.: Delegacia de Plantão / 1ª DP / nome da delegacia' : tipo === 'hospital' ? 'Nome do hospital' : 'Nome do local, se souber';
      return '<h2 class="cc-h">Onde a pessoa <em>está presa</em>?</h2><p class="cc-p">Quanto mais exato o local, mais rápido o advogado chega. Não sabe? Mande a sua localização ou o que souber.</p>' +
        '<div class="cc-err" id="err"></div>' +
        '<div class="cc-row">' + field('Tipo de local *', chips('lTipo', LOCAL_TIPOS, { red: true })) + '</div>' +
        '<div class="cc-row two">' + field('Cidade *', '<select class="cc-sel" id="f-lCidade" data-k="lCidade"><option value="">Escolha a cidade…</option>' + CIDADES.map(function (c) { return '<option' + (d.lCidade === c ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</select>') +
          field('Nome do local', inp('lNome', { ph: ph, list: 'cc-unidades' }), 'Delegacia, presídio ou hospital.') + '</div>' +
        '<datalist id="cc-unidades">' + (tipo === 'presidio' ? UNIDADES.map(function (u) { return '<option value="' + esc(u) + '">'; }).join('') : '') + '</datalist>' +
        '<div class="cc-row">' + field('Endereço ou ponto de referência', inp('lRef', { ph: 'Rua, bairro, ao lado de…' })) + '</div>' +
        '<div class="cc-geo' + (geo ? ' ok' : '') + '"><p>' + (geo ? '<b><i class="fa-solid fa-circle-check"></i> Localização enviada</b> (precisão de ' + Math.round(d.lPrec || 0) + ' m). O advogado recebe o mapa com a rota.' : '<b><i class="fa-solid fa-location-crosshairs"></i> Você está no local?</b> Envie sua localização e o advogado recebe a rota pronta no celular.') + '</p><button type="button" class="cc-btn ' + (geo ? 'ghost' : 'red') + ' sm" data-act="geo">' + (geo ? 'Atualizar' : 'Enviar minha localização') + '</button></div>' +
        '<div class="cc-row two">' + field('Quando foi a prisão?', chips('lQuando', QUANDO)) + field('Já houve audiência de custódia?', chips('custodia', CUSTODIA)) + '</div>';
    },

    fato: function () {
      return '<h2 class="cc-h">O que <em>aconteceu</em>?</h2><p class="cc-p">Só o essencial. O advogado completa tudo pessoalmente.</p>' +
        '<div class="cc-err" id="err"></div>' +
        '<div class="cc-row">' + field('Do que a pessoa é acusada? (pode marcar mais de uma)', chips('crimes', CRIMES, { multi: true, red: true })) + '</div>' +
        '<div class="cc-row">' + field('Conte em poucas linhas', '<textarea class="cc-ta" id="f-relato" data-k="relato" placeholder="Como foi a abordagem, quem estava junto, se mostraram mandado, se a pessoa já falou algo na delegacia…">' + esc(S.data.relato || '') + '</textarea>', 'Se a pessoa ainda não depôs, melhor que ela só fale depois de conversar com o advogado.') + '</div>';
    },

    caso: function () {
      var busca = S.data.modo === 'busca';
      return '<h2 class="cc-h">Monte o <em>seu caso</em></h2><p class="cc-p">' + (busca ? 'Preencha o que souber. O resto o escritório descobre.' : 'Quanto mais completo, mais rápida a análise do advogado.') + '</p>' +
        '<div class="cc-err" id="err"></div>' +
        '<div class="cc-row">' + field('Em que fase está? ' + (busca ? '' : '*'), chips('fase', FASES)) + '</div>' +
        '<div class="cc-row two">' + field('Número do processo (CNJ)', inp('cnj', { ph: '0000000-00.0000.0.00.0000', inputmode: 'numeric', max: 25 }), 'Se tiver. Está na intimação ou no site do tribunal.') + field('Comarca / Vara', inp('vara', { ph: 'Ex.: 2ª Vara Criminal de Sabará' })) + '</div>' +
        '<div class="cc-row">' + field('Crime(s) apontado(s)', chips('crimes', CRIMES, { multi: true })) + '</div>' +
        '<div class="cc-row two">' + field('Próxima audiência ou prazo', inp('prazo', { type: 'date' }), 'Se a intimação trouxer data.') + field('A pessoa está presa?', chips('preso', [{ v: 'sim', l: 'Sim' }, { v: 'nao', l: 'Não' }])) + '</div>' +
        '<div class="cc-row">' + field('Conte o caso com as suas palavras', '<textarea class="cc-ta" id="f-relato" data-k="relato" placeholder="O que aconteceu, desde quando, o que já foi feito, se já tem advogado…">' + esc(S.data.relato || '') + '</textarea>') + '</div>';
    },

    busca: function () {
      var d = S.data, tem = function (v) { return (d.buscas || []).indexOf(v) > -1; };
      var req = S.data.modo === 'busca';
      return '<h2 class="cc-h">O escritório <em>busca por você</em></h2><p class="cc-p">' + (req ? 'Marque o que o advogado deve ir atrás. Você não precisa saber onde fica nada.' : 'Opcional: marque o que o escritório pode buscar para completar a sua ficha.') + '</p>' +
        '<div class="cc-err" id="err"></div>' +
        BUSCAS.map(function (b) { return '<label class="cc-check' + (tem(b.v) ? ' on' : '') + '"><input type="checkbox" data-k="buscas" data-v="' + b.v + '" data-multi="1"' + (tem(b.v) ? ' checked' : '') + '><div><b>' + esc(b.t) + '</b><span>' + esc(b.d) + '</span></div></label>'; }).join('') +
        (tem('reds') ? '<div class="cc-sub-panel"><div class="cc-row three">' + field('Nº do REDS (se souber)', inp('redsNum', { ph: '2026-000000000-001' })) + field('Data do fato', inp('redsData', { type: 'date' })) + field('Local do fato', inp('redsLocal', { ph: 'Bairro / cidade' })) + '</div></div>' : '') +
        '<div class="cc-note"><i class="fa-solid fa-scale-balanced"></i><div>O que é público o escritório consulta já. O que depende de sigilo, vista ou cópia dos autos é feito pelo advogado <b>depois da procuração</b>, sempre dentro da lei e da OAB.</div></div>';
    },

    docs: function () {
      S.data.catSel = S.cat;
      var optional = isUrg() ? 'Tem foto do REDS, da intimação ou do mandado? Mande agora. Se não tiver, pule: o advogado busca.' : 'Envie o que tiver. Cada arquivo vai para a gaveta certa da pasta do caso.';
      return '<h2 class="cc-h">Envie os <em>documentos</em></h2><p class="cc-p">' + optional + '</p>' +
        '<div class="cc-err" id="err"></div>' +
        '<div class="cc-cats"><span class="cc-lab">1. O que você vai enviar agora?</span><div style="height:8px"></div>' + chips('catSel', CATS) + '</div>' +
        '<span class="cc-lab">2. Anexe</span><div style="height:8px"></div>' +
        '<div class="cc-drop" id="drop" tabindex="0" role="button" aria-label="Anexar arquivos"><i class="fa-solid fa-cloud-arrow-up"></i><b>Arraste ou toque para anexar</b><small>Foto, PDF ou print. Até 8 MB por arquivo, até ' + MAX_FILES + ' arquivos.</small></div>' +
        '<input type="file" id="file-in" multiple accept="image/*,application/pdf" style="display:none">' +
        '<ul class="cc-files" id="files"></ul>';
    },

    enviar: function () {
      var d = S.data;
      var rows = resumoRows().map(function (r) { return '<div><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>'; }).join('');
      return '<h2 class="cc-h">Confira e <em>envie</em></h2><p class="cc-p">' + (isUrg() ? 'O envio aciona o plantão agora.' : 'Seu caso entra organizado na pasta do escritório.') + '</p>' +
        '<div class="cc-err" id="err"></div><dl class="cc-sum">' + rows + '</dl>' +
        '<label class="cc-check' + (d.lgpd ? ' on' : '') + '"><input type="checkbox" data-k="lgpd" data-bool="1"' + (d.lgpd ? ' checked' : '') + '><div><b>Autorizo o tratamento dos meus dados *</b><span>Concordo que o escritório use estas informações para analisar o caso e entrar em contato por WhatsApp, telefone ou e-mail. Dados sensíveis são guardados em pasta privada e usados só para o atendimento (LGPD, arts. 7º e 11). <a href="https://lucassemim.adv.br/politica-privacidade.html" target="_blank" rel="noopener" style="color:var(--cc-gold)">Política de privacidade</a>.</span></div></label>' +
        '<div class="cc-note"><i class="fa-solid fa-shield-halved"></i><div>O envio é gratuito. As condições do atendimento (inclusive o deslocamento do advogado) são confirmadas pelo Dr. Lucas por WhatsApp antes de qualquer cobrança.</div></div>';
    }
  };

  function resumoRows() {
    var d = S.data, r = [];
    r.push(['Caminho', (MODOS[d.modo] || {}).l || '']);
    r.push(['Contato', (d.cNome || '') + ' · ' + (d.cWhats || '') + (d.cEmail ? ' · ' + d.cEmail : '')]);
    r.push(['Pessoa envolvida', (d.pNome || '') + (d.relacao ? ' (' + lab(RELACAO, d.relacao) + ')' : '')]);
    if (isUrg()) {
      r.push(['Local', [lab(LOCAL_TIPOS, d.lTipo), d.lNome, d.lCidade].filter(Boolean).join(' · ') + (d.lLat ? ' · localização GPS' : '')]);
      if (d.lQuando) r.push(['Quando', lab(QUANDO, d.lQuando)]);
      if (d.custodia) r.push(['Custódia', lab(CUSTODIA, d.custodia)]);
    } else {
      if (d.fase) r.push(['Fase', lab(FASES, d.fase)]);
      if (d.cnj) r.push(['Processo', d.cnj + (d.vara ? ' · ' + d.vara : '')]);
    }
    if ((d.crimes || []).length) r.push(['Crime(s)', d.crimes.join(', ')]);
    if ((d.buscas || []).length) r.push(['Buscas autorizadas', d.buscas.map(function (b) { for (var i = 0; i < BUSCAS.length; i++) if (BUSCAS[i].v === b) return BUSCAS[i].t; return b; }).join('; ')]);
    r.push(['Documentos', S.files.length ? S.files.length + ' arquivo(s) anexado(s)' : 'Nenhum (o advogado busca)']);
    return r;
  }

  /* ---------- ficha viva ---------- */
  function ficha() {
    var d = S.data, m = d.modo, items = [];
    function it(ok, t, v) { items.push({ ok: !!ok, t: t, v: v || '' }); }
    it(m, 'Caminho', m ? MODOS[m].l : 'Escolha uma opção');
    it(d.cNome && digits(d.cWhats).length >= 10, 'Contato', d.cNome ? d.cNome + (d.cWhats ? ' · ' + d.cWhats : '') : 'Nome e WhatsApp');
    it(d.pNome || d.relacao === 'proprio', 'Pessoa envolvida', d.relacao === 'proprio' ? (d.cNome || 'Você') : d.pNome || '');
    if (m === 'urgencia') {
      it(d.lTipo && (d.lCidade || d.lLat), 'Local da prisão', [lab(LOCAL_TIPOS, d.lTipo), d.lNome, d.lCidade].filter(Boolean).join(' · ') + (d.lLat ? ' 📍' : ''));
      it((d.crimes || []).length || d.relato, 'Fatos', (d.crimes || []).join(', '));
    } else if (m) {
      it(d.fase || (d.crimes || []).length || d.relato, 'Caso', [lab(FASES, d.fase), (d.crimes || []).join(', ')].filter(Boolean).join(' · '));
      it(d.cnj, 'Nº do processo', d.cnj || 'Opcional');
    }
    if (m && m !== 'urgencia') it((d.buscas || []).length, 'Buscas pelo escritório', (d.buscas || []).length ? d.buscas.length + ' autorizada(s)' : 'Opcional');
    if (m) it(S.files.length, 'Documentos', S.files.length ? S.files.length + ' anexado(s)' : 'Opcional');
    var ok = items.filter(function (x) { return x.ok; }).length, pct = Math.round(ok / items.length * 100);
    return '<h4><i class="fa-solid fa-folder-tree"></i>Ficha do caso</h4><div class="cc-meter"><b style="width:' + pct + '%"></b></div><div class="cc-meter-t"><span>' + (pct >= 100 ? 'Ficha completa' : 'Ficha em montagem') + '</span><span>' + pct + '%</span></div>' +
      '<ul class="cc-fl">' + items.map(function (x) { return '<li class="' + (x.ok ? 'ok' : '') + '"><i class="fa-solid ' + (x.ok ? 'fa-circle-check' : 'fa-circle') + '"></i><div><b>' + esc(x.t) + '</b>' + (x.v ? '<span>' + esc(x.v) + '</span>' : '') + '</div></li>'; }).join('') + '</ul>';
  }
  function updFicha() { var a = $('#ficha'); if (a) a.innerHTML = ficha(); }

  /* ---------- render ---------- */
  function stepper() {
    var m = MODOS[S.data.modo]; if (!m) return '';
    var idx = m.flow.indexOf(S.step);
    return '<ol class="cc-steps' + (isUrg() ? ' urg' : '') + '" aria-label="Etapas">' + m.steps.map(function (n, i) { return '<li class="' + (i < idx ? 'done' : i === idx ? 'now' : '') + '"><i></i><span>' + n + '</span></li>'; }).join('') + '</ol>';
  }
  function nav() {
    var f = flow(), idx = f.indexOf(S.step), last = S.step === 'enviar';
    var skip = (S.step === 'docs' || (S.step === 'busca' && S.data.modo === 'processo')) ? '<button type="button" class="cc-skip" data-act="next">Pular esta etapa</button>' : '';
    return '<div class="cc-nav">' + (idx > 0 ? '<button type="button" class="cc-btn ghost" data-act="prev">← Voltar</button>' : '<span></span>') +
      '<span style="display:flex;gap:18px;align-items:center;flex-wrap:wrap;justify-content:flex-end">' + skip +
      (last ? '<button type="button" class="cc-btn ' + (isUrg() ? 'red' : 'gold') + '" data-act="submit">' + (isUrg() ? 'Acionar plantão agora' : 'Enviar meu caso') + ' <i class="fa-solid fa-paper-plane"></i></button>'
            : '<button type="button" class="cc-btn gold" data-act="next">Continuar →</button>') + '</span></div>';
  }
  function render() {
    if (S.done) return renderDone();
    var view = VIEW[S.step] || VIEW.modo;
    root.innerHTML = '<div class="cc-grid"><div class="cc-card" id="main">' + (S.step === 'modo' ? '' : stepper()) + '<div class="cc-step" id="stepbox">' + view() + '</div>' + (S.step === 'modo' ? '' : nav()) + '</div>' +
      '<aside class="cc-card cc-ficha" id="ficha" aria-live="polite">' + ficha() + '</aside></div>' +
      '<div class="cc-sending" id="sending" role="alertdialog" aria-live="assertive"><div><div class="cc-spin"></div><h3>Enviando seu caso…</h3><p>Não feche esta página. Estamos criando a pasta e organizando os documentos.</p></div></div>';
    if (S.step === 'docs') renderFiles();
    saveDraft();
  }
  function go(step, scroll) {
    S.step = step; render(); track('ls_central_step', { etapa: step });
    if (scroll !== false) { var m = $('#main'); if (m) { var y = m.getBoundingClientRect().top + window.pageYOffset - 90; window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' }); } }
  }

  /* ---------- validação ---------- */
  var CHECK = {
    contato: function (d) {
      var e = [];
      if (!d.cNome || d.cNome.trim().length < 3) e.push(['cNome', 'Informe o seu nome.']);
      var w = digits(d.cWhats); if (w.length < 10 || w.length > 11) e.push(['cWhats', 'Informe o WhatsApp com DDD. Ex.: (31) 9XXXX-XXXX.']);
      if (!d.relacao) e.push([null, 'Diga quem você é em relação ao caso.']);
      if (d.relacao && d.relacao !== 'proprio' && (!d.pNome || d.pNome.trim().length < 3)) e.push(['pNome', 'Informe o nome da pessoa envolvida.']);
      if (d.cEmail && !/^\S+@\S+\.\S+$/.test(d.cEmail)) e.push(['cEmail', 'E-mail inválido.']);
      if (d.pCpf && digits(d.pCpf).length !== 11) e.push(['pCpf', 'CPF incompleto. Deixe em branco se não souber.']);
      return e;
    },
    local: function (d) {
      var e = [];
      if (!d.lTipo) e.push([null, 'Escolha o tipo de local.']);
      if (!d.lCidade && !d.lLat) e.push(['lCidade', 'Escolha a cidade ou envie a sua localização.']);
      if (!d.lNome && !d.lRef && !d.lLat && d.lTipo !== 'naosei') e.push(['lNome', 'Diga o nome do local, um ponto de referência ou envie a localização.']);
      return e;
    },
    fato: function (d) { return ((d.crimes || []).length || (d.relato && d.relato.trim().length > 5)) ? [] : [[null, 'Marque o crime apontado ou escreva algumas linhas. Se não souber, marque “Outro / não sei”.']]; },
    caso: function (d) {
      var e = [];
      if (d.modo === 'processo' && !d.fase) e.push([null, 'Escolha a fase do caso. Se não souber, marque “Não sei”.']);
      if (d.cnj && digits(d.cnj).length !== 20) e.push(['cnj', 'O número do processo tem 20 dígitos. Deixe em branco se não tiver.']);
      return e;
    },
    busca: function (d) { return (d.modo === 'busca' && !(d.buscas || []).length) ? [[null, 'Marque pelo menos uma busca para o escritório fazer.']] : []; },
    enviar: function (d) { return d.lgpd ? [] : [[null, 'Para enviar, marque a autorização de tratamento dos dados.']]; }
  };
  function validate(step) {
    var fn = CHECK[step], errs = fn ? fn(S.data) : [], box = $('#err');
    root.querySelectorAll('.bad').forEach(function (n) { n.classList.remove('bad'); });
    if (!errs.length) { if (box) box.classList.remove('on'); return true; }
    if (box) { box.innerHTML = '<b>Falta pouco:</b><br>' + errs.map(function (x) { return esc(x[1]); }).join('<br>'); box.classList.add('on'); }
    errs.forEach(function (x) { if (x[0]) { var n = $('#f-' + x[0]); if (n) n.classList.add('bad'); } });
    var first = errs[0][0] ? $('#f-' + errs[0][0]) : null;
    if (first) first.focus(); else if (box) box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return false;
  }

  /* ---------- arquivos ---------- */
  function safeName(n) { return String(n || 'arquivo').replace(/[^\w.\- ]+/g, '_').slice(0, 80); }
  function readB64(blob) { return new Promise(function (ok, no) { var r = new FileReader(); r.onload = function () { ok(String(r.result).split(',')[1]); }; r.onerror = no; r.readAsDataURL(blob); }); }
  function shrinkImage(file) {
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
    var box = $('#err'), msg = [];
    for (var i = 0; i < list.length; i++) {
      var f = list[i];
      if (S.files.length >= MAX_FILES) { msg.push('Limite de ' + MAX_FILES + ' arquivos. Mande o restante pelo WhatsApp.'); break; }
      var isImg = /^image\//.test(f.type), isPdf = f.type === 'application/pdf';
      if (!isImg && !isPdf) { msg.push('“' + f.name + '”: envie foto ou PDF.'); continue; }
      try {
        var blob = f, mime = f.type, name = safeName(f.name), thumb = '';
        if (isImg) { try { blob = await shrinkImage(f); mime = 'image/jpeg'; name = name.replace(/\.[^.]+$/, '') + '.jpg'; thumb = URL.createObjectURL(blob); } catch (e) { blob = f; } }
        if (blob.size > MAX_FILE) { msg.push('“' + f.name + '” passa de 8 MB. Mande pelo WhatsApp.'); continue; }
        var data = await readB64(blob);
        if (totalB64() + data.length > MAX_TOTAL_B64) { msg.push('Limite total de envio atingido. Mande o restante pelo WhatsApp.'); break; }
        S.files.push({ id: Date.now() + '' + i, nome: name, mimeType: mime, size: blob.size, data: data, categoria: S.cat, thumb: thumb });
      } catch (e) { msg.push('Não consegui ler “' + f.name + '”.'); }
    }
    renderFiles(); updFicha();
    if (box) { if (msg.length) { box.innerHTML = esc(msg.join(' ')); box.classList.add('on'); } else box.classList.remove('on'); }
  }
  function renderFiles() {
    var ul = $('#files'); if (!ul) return;
    ul.innerHTML = S.files.map(function (f) {
      return '<li>' + (f.thumb ? '<img class="th" src="' + f.thumb + '" alt="">' : '<span class="th"><i class="fa-solid fa-file-pdf"></i></span>') + '<span class="nm">' + esc(f.nome) + '</span><span class="tag">' + esc(lab(CATS, f.categoria)) + '</span><span class="sz">' + (f.size / 1024 > 1024 ? (f.size / 1048576).toFixed(1) + ' MB' : Math.round(f.size / 1024) + ' KB') + '</span><button type="button" data-act="rm" data-id="' + f.id + '" aria-label="Remover">✕</button></li>';
    }).join('');
  }

  /* ---------- geolocalização ---------- */
  function geo(btn) {
    if (!navigator.geolocation) { alert('Seu navegador não permite localização. Escreva o endereço ou o nome do local.'); return; }
    btn.disabled = true; btn.textContent = 'Localizando…';
    navigator.geolocation.getCurrentPosition(function (p) {
      S.data.lLat = +p.coords.latitude.toFixed(6); S.data.lLng = +p.coords.longitude.toFixed(6); S.data.lPrec = p.coords.accuracy;
      saveDraft(); render(); track('ls_central_geo', { ok: 1 });
    }, function () {
      btn.disabled = false; btn.textContent = 'Enviar minha localização';
      var box = $('#err'); if (box) { box.innerHTML = 'Não consegui pegar a localização. Permita o acesso no navegador ou escreva o endereço.'; box.classList.add('on'); }
    }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 });
  }

  /* ---------- envio ---------- */
  function relatoCompleto() {
    var d = S.data, L = [];
    L.push('CAMINHO: ' + (MODOS[d.modo] || {}).l);
    if (d.relacao) L.push('RELAÇÃO: ' + lab(RELACAO, d.relacao));
    if (isUrg()) {
      L.push('LOCAL: ' + [lab(LOCAL_TIPOS, d.lTipo), d.lNome, d.lCidade, d.lRef].filter(Boolean).join(' | '));
      if (mapsLink()) L.push('MAPA: ' + mapsLink());
      if (d.lQuando) L.push('QUANDO: ' + lab(QUANDO, d.lQuando));
      if (d.custodia) L.push('AUDIÊNCIA DE CUSTÓDIA: ' + lab(CUSTODIA, d.custodia));
    } else {
      if (d.fase) L.push('FASE: ' + lab(FASES, d.fase));
      if (d.vara) L.push('VARA/COMARCA: ' + d.vara);
      if (d.prazo) L.push('PRÓXIMA AUDIÊNCIA/PRAZO: ' + d.prazo);
      if (d.preso) L.push('PESSOA PRESA: ' + (d.preso === 'sim' ? 'Sim' : 'Não'));
    }
    if ((d.crimes || []).length) L.push('CRIMES: ' + d.crimes.join(', '));
    if ((d.buscas || []).length) L.push('BUSCAS AUTORIZADAS: ' + d.buscas.join(', '));
    if (d.redsNum || d.redsData || d.redsLocal) L.push('REDS: nº ' + (d.redsNum || '?') + ' | data ' + (d.redsData || '?') + ' | local ' + (d.redsLocal || '?'));
    if (d.relato) L.push('RELATO: ' + d.relato);
    return L.join('\n');
  }
  function payload() {
    var d = S.data, q = {}; try { new URLSearchParams(location.search).forEach(function (v, k) { if (/^utm_|gclid|fbclid/.test(k)) q[k] = v; }); } catch (e) {}
    var pNome = d.relacao === 'proprio' ? d.cNome : d.pNome;
    return {
      acao: 'central_caso', versao: CFG.versao || '', modo: d.modo, urgente: isUrg(),
      contato: { nome: d.cNome, whatsapp: d.cWhats, email: d.cEmail || '', relacao: d.relacao },
      pessoa: { nome: pNome, cpf: d.pCpf || '', preso: d.preso || '' },
      local: isUrg() ? { tipo: lab(LOCAL_TIPOS, d.lTipo), nome: d.lNome || '', cidade: d.lCidade || '', referencia: d.lRef || '', lat: d.lLat || null, lng: d.lLng || null, precisao: d.lPrec || null, quando: lab(QUANDO, d.lQuando), custodia: lab(CUSTODIA, d.custodia), mapa: mapsLink() } : null,
      caso: { fase: lab(FASES, d.fase), cnj: d.cnj || '', vara: d.vara || '', crimes: d.crimes || [], prazo: d.prazo || '', relato: d.relato || '' },
      busca: { itens: d.buscas || [], reds: { numero: d.redsNum || '', data: d.redsData || '', local: d.redsLocal || '' } },
      consentimento: { lgpd: !!d.lgpd, em: new Date().toISOString() },
      origem: { url: location.href.split('#')[0], referrer: document.referrer || '', utm: q, tz: (Intl.DateTimeFormat().resolvedOptions().timeZone || '') },
      honeypot: ($('#f-hp') || {}).value || '',
      tempoMs: Date.now() - T0,
      // espelho no formato antigo: se o Apps Script novo ainda não foi instalado, o intake V3 continua funcionando
      nome: pNome, whatsapp: d.cWhats, email: d.cEmail || '', cpf: d.pCpf || '', numProcesso: d.cnj || '',
      situacao: 'Central do Caso — ' + (MODOS[d.modo] || {}).l, tipoAcao: (d.crimes || []).join(', ') + (d.fase ? ' | ' + lab(FASES, d.fase) : ''), relato: relatoCompleto(),
      arquivos: S.files.map(function (f) { return { nome: f.categoria.toUpperCase() + '__' + f.nome, mimeType: f.mimeType, data: f.data, categoria: f.categoria }; })
    };
  }
  function wppText(proto) {
    var d = S.data;
    var t = (isUrg() ? 'URGÊNCIA — preciso de advogado agora.' : 'Olá, Dr. Lucas! Enviei meu caso pelo site.') + (proto ? '\nProtocolo: ' + proto : '') +
      '\nNome: ' + d.cNome + '\nPessoa envolvida: ' + (d.relacao === 'proprio' ? d.cNome : d.pNome);
    if (isUrg()) t += '\nLocal: ' + [lab(LOCAL_TIPOS, d.lTipo), d.lNome, d.lCidade].filter(Boolean).join(' - ') + (mapsLink() ? '\nMapa: ' + mapsLink() : '');
    else if (d.fase) t += '\nFase: ' + lab(FASES, d.fase) + (d.cnj ? '\nProcesso: ' + d.cnj : '');
    if ((d.crimes || []).length) t += '\nCrime(s): ' + d.crimes.join(', ');
    return t;
  }
  function wppLink(proto) { return 'https://wa.me/' + WPP + '?text=' + encodeURIComponent(wppText(proto)); }

  async function submit() {
    if (S.busy || !validate('enviar')) return;
    var hp = $('#f-hp'); if (hp && hp.value) return; // robô
    S.busy = true; var ov = $('#sending'); if (ov) ov.classList.add('on');
    track('ls_central_submit', { arquivos: S.files.length });
    try {
      if (!API || API.indexOf('COLE_AQUI') > -1) throw new Error('backend não configurado');
      var ctl = new AbortController(), to = setTimeout(function () { ctl.abort(); }, 150000);
      var resp = await fetch(API, { method: 'POST', body: JSON.stringify(payload()), signal: ctl.signal });
      clearTimeout(to);
      var j = await resp.json();
      if (j.status !== 'sucesso') throw new Error(j.mensagem || 'erro no servidor');
      S.done = { proto: j.protocolo || '', despacho: j.despacho || null, novo: j.clienteNovo !== false, ok: true };
      clearDraft(); track('ls_central_ok', { urgente: isUrg() ? 1 : 0 });
    } catch (e) {
      S.done = { ok: false, erro: (e && e.message) || 'falha de conexão' }; track('ls_central_fail', { erro: String(e && e.message).slice(0, 60) });
    }
    S.busy = false; render(); window.scrollTo({ top: Math.max(0, root.getBoundingClientRect().top + window.pageYOffset - 90), behavior: 'smooth' });
  }

  function renderDone() {
    var r = S.done, d = S.data, u = isUrg();
    var html;
    if (r.ok) {
      html = '<div class="cc-card"><div class="cc-ok' + (u ? ' urg' : '') + '"><div class="big"><i class="fa-solid ' + (u ? 'fa-bell' : 'fa-check') + '"></i></div>' +
        '<h2 class="cc-h">' + (u ? 'Plantão <em>acionado</em>' : 'Caso <em>recebido</em>') + '</h2>' +
        '<p class="cc-p">' + (u ? 'O escritório foi avisado agora e um advogado está sendo designado para ir até o local. O Dr. Lucas confirma por WhatsApp.' : (r.novo ? 'Sua pasta foi criada e a ficha do caso já está com o advogado.' : 'Os novos dados foram adicionados à sua pasta que já existia.')) + '</p>' +
        (r.proto ? '<div class="cc-proto"><span id="proto">' + esc(r.proto) + '</span><button type="button" data-act="copy" aria-label="Copiar protocolo"><i class="fa-regular fa-copy"></i></button></div>' : '') +
        '<ul class="cc-tl"><li class="ok"><b>Caso recebido</b> e organizado na pasta do escritório</li><li class="' + (u ? 'ok' : 'now') + '"><b>' + (u ? 'Advogado acionado' : 'Triagem do advogado') + '</b>' + (r.despacho && r.despacho.responsavel ? ' — ' + esc(r.despacho.responsavel) : '') + '</li><li class="' + (u ? 'now' : '') + '"><b>Contato por WhatsApp</b> com o próximo passo e as condições</li></ul>' +
        (u ? '<div class="cc-rights"><h4>Enquanto o advogado chega</h4><ul><li>A pessoa presa tem direito de ficar calada e de falar com advogado antes de depor (CF, art. 5º, LXIII).</li><li>Não assinem nada sem ler e sem orientação do advogado.</li><li>Anotem nome do delegado/escrivão e o número do REDS.</li><li>Mantenham o celular com bateria e o WhatsApp aberto.</li></ul></div>' : '') +
        '<div class="cc-actions"><a class="cc-btn ' + (u ? 'red' : 'wpp') + '" href="' + wppLink(r.proto) + '" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i> ' + (u ? 'Falar agora no WhatsApp' : 'Continuar no WhatsApp') + '</a><button type="button" class="cc-btn ghost" data-act="reset">Montar outro caso</button></div></div></div>';
    } else {
      html = '<div class="cc-card"><div class="cc-ok"><div class="big" style="background:linear-gradient(135deg,#ffd37a,#e0a21b);color:#2a1c00;box-shadow:0 0 0 10px rgba(224,162,27,.14)"><i class="fa-solid fa-triangle-exclamation"></i></div>' +
        '<h2 class="cc-h">Quase lá — <em>envie pelo WhatsApp</em></h2><p class="cc-p">Não conseguimos enviar o formulário automaticamente agora. <b>Seus dados não foram perdidos</b>: toque no botão e a ficha vai pronta na conversa com o Dr. Lucas.' + (S.files.length ? ' Depois, mande os ' + S.files.length + ' documento(s) na mesma conversa.' : '') + '</p>' +
        '<div class="cc-actions"><a class="cc-btn ' + (u ? 'red' : 'wpp') + '" href="' + wppLink('') + '" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i> Enviar ficha no WhatsApp</a><button type="button" class="cc-btn ghost" data-act="retry">Tentar enviar de novo</button></div>' +
        '<p class="cc-hint" style="margin-top:16px">Motivo técnico: ' + esc(r.erro) + '</p></div></div>';
    }
    root.innerHTML = html;
  }

  /* ---------- eventos ---------- */
  function onClick(ev) {
    var t = ev.target;
    var mode = t.closest('[data-mode]'); if (mode) { S.data.modo = mode.getAttribute('data-mode'); track('ls_central_modo'); go('contato'); return; }
    var chip = t.closest('.cc-chip');
    if (chip) {
      var k = chip.getAttribute('data-k'), v = chip.getAttribute('data-v');
      if (k === 'catSel') { S.cat = v; root.querySelectorAll('[data-k="catSel"]').forEach(function (c) { var on = c.getAttribute('data-v') === v; c.classList.toggle('on', on); c.setAttribute('aria-pressed', on); }); return; }
      if (chip.hasAttribute('data-multi')) { var a = S.data[k] || []; var i = a.indexOf(v); if (i > -1) a.splice(i, 1); else a.push(v); S.data[k] = a; chip.classList.toggle('on', i === -1); chip.setAttribute('aria-pressed', i === -1); }
      else { S.data[k] = (S.data[k] === v) ? '' : v; if (k === 'relacao' || k === 'lTipo') { render(); return; } root.querySelectorAll('[data-k="' + k + '"]').forEach(function (c) { var on = c.getAttribute('data-v') === S.data[k]; c.classList.toggle('on', on); c.setAttribute('aria-pressed', on); }); }
      if (k === 'relacao' && v === 'proprio') S.data.pNome = '';
      updFicha(); saveDraft(); return;
    }
    var b = t.closest('[data-act]'); if (!b) { if (t.closest('#drop')) $('#file-in').click(); return; }
    var act = b.getAttribute('data-act');
    if (act === 'next') { if (!validate(S.step)) return; var f = flow(), i2 = f.indexOf(S.step); go(f[Math.min(f.length - 1, i2 + 1)]); }
    else if (act === 'prev') { var f2 = flow(), i3 = f2.indexOf(S.step); go(f2[Math.max(0, i3 - 1)]); }
    else if (act === 'geo') geo(b);
    else if (act === 'submit') submit();
    else if (act === 'rm') { S.files = S.files.filter(function (x) { return x.id !== b.getAttribute('data-id'); }); renderFiles(); updFicha(); }
    else if (act === 'copy') { try { navigator.clipboard.writeText($('#proto').textContent); b.innerHTML = '<i class="fa-solid fa-check"></i>'; } catch (e) {} }
    else if (act === 'reset') { S = { step: 'modo', data: { crimes: [], buscas: [] }, files: [], cat: 'reds', busy: false, done: null }; clearDraft(); render(); }
    else if (act === 'retry') { S.done = null; render(); }
  }
  function onInput(ev) {
    var t = ev.target, k = t.getAttribute && t.getAttribute('data-k'); if (!k) return;
    if (t.type === 'checkbox') {
      if (t.hasAttribute('data-bool')) S.data[k] = t.checked;
      else { var a = S.data[k] || [], v = t.getAttribute('data-v'), i = a.indexOf(v); if (t.checked && i === -1) a.push(v); if (!t.checked && i > -1) a.splice(i, 1); S.data[k] = a; var lbl = t.closest('.cc-check'); if (lbl) lbl.classList.toggle('on', t.checked); if (k === 'buscas' && v === 'reds') { render(); return; } }
      var l2 = t.closest('.cc-check'); if (l2) l2.classList.toggle('on', t.checked);
    } else {
      var val = t.value;
      if (k === 'cWhats') { val = maskPhone(val); t.value = val; }
      if (k === 'pCpf') { val = maskCpf(val); t.value = val; }
      if (k === 'cnj') { val = maskCnj(val); t.value = val; }
      S.data[k] = val; t.classList.remove('bad');
    }
    updFicha(); saveDraft();
  }
  function bindDrop() {
    var inpf = root; // delegação para elementos que mudam
    root.addEventListener('change', function (e) { if (e.target.id === 'file-in') { addFiles(Array.prototype.slice.call(e.target.files)); e.target.value = ''; } });
    root.addEventListener('dragover', function (e) { var d = e.target.closest && e.target.closest('#drop'); if (d) { e.preventDefault(); d.classList.add('over'); } });
    root.addEventListener('dragleave', function (e) { var d = e.target.closest && e.target.closest('#drop'); if (d) d.classList.remove('over'); });
    root.addEventListener('drop', function (e) { var d = e.target.closest && e.target.closest('#drop'); if (d) { e.preventDefault(); d.classList.remove('over'); addFiles(Array.prototype.slice.call(e.dataTransfer.files)); } });
    root.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.id === 'drop') { e.preventDefault(); $('#file-in').click(); } });
  }

  function init() {
    root = document.getElementById('central-caso-app'); if (!root) return;
    loadDraft();
    // pré-seleção por link: diagnostico.html?modo=urgencia|processo|busca
    try { var m = new URLSearchParams(location.search).get('modo'); if (m && MODOS[m] && !S.data.modo) { S.data.modo = m; S.step = 'contato'; } } catch (e) {}
    root.addEventListener('click', onClick);
    root.addEventListener('input', onInput);
    root.addEventListener('change', onInput);
    bindDrop();
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
