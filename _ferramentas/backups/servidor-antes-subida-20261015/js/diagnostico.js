/* ==========================================================================
   DIAGNÓSTICO JURÍDICO — Dr. Lucas Semim (lucassemim.adv.br)
   Quiz interativo de qualificação de leads (#diagnostico-app).
   Segue o padrão arquitetural dos demais scripts do site:
   window.DiagnosticoJuridico = {...}; init() on DOMContentLoaded; try/catch;
   log condicional por hostname; eventos gtag protegidos.
   ========================================================================== */

(function () {
    'use strict';

    function diagLog() {
        try {
            if (window.location.hostname !== 'lucassemim.adv.br') {
                var args = ['[Diagnóstico]'].concat(Array.prototype.slice.call(arguments));
                console.log.apply(console, args);
            }
        } catch (e) { /* silencioso */ }
    }

    window.DiagnosticoJuridico = {

        config: {
            containerSelector: '#diagnostico-app',
            whatsappNumber: '5531989420094',
            totalSteps: 4
        },

        state: {
            currentIndex: 0,
            answers: {},
            flow: [],
            pendingAnswer: null,
            reducedMotion: false
        },

        container: null,

        // ------------------------------------------------------------
        // DADOS DO QUIZ
        // ------------------------------------------------------------

        SITUACOES: [
            { value: 'flagrante', label: 'Alguém foi preso agora (flagrante)', icon: 'fa-handcuffs' },
            { value: 'processo', label: 'Tenho processo em andamento', icon: 'fa-file-signature' },
            { value: 'intimacao', label: 'Recebi intimação ou mandado', icon: 'fa-triangle-exclamation' },
            { value: 'execucao', label: 'Já estou preso, cumprindo pena (execução penal)', icon: 'fa-door-closed' },
            { value: 'outra', label: 'Outra situação', icon: 'fa-circle-question' }
        ],

        FOLLOWUPS: {
            flagrante: {
                question: 'Já passou pela audiência de custódia?',
                options: [
                    { value: 'sim', label: 'Sim, já passou' },
                    { value: 'nao', label: 'Não, ainda não' },
                    { value: 'naosei', label: 'Não sei / não tenho certeza' }
                ]
            },
            processo: {
                question: 'Em que fase está o processo?',
                options: [
                    { value: 'inquerito', label: 'Inquérito policial' },
                    { value: 'denuncia', label: 'Denúncia recebida' },
                    { value: 'instrucao', label: 'Instrução (audiências / provas)' },
                    { value: 'sentenca', label: 'Sentença' },
                    { value: 'recurso', label: 'Recurso' }
                ]
            },
            intimacao: {
                question: 'O que você recebeu exatamente?',
                options: [
                    { value: 'intimacao_depor', label: 'Intimação para depor na delegacia' },
                    { value: 'mandado_prisao', label: 'Mandado de prisão' },
                    { value: 'notificacao_audiencia', label: 'Notificação de audiência' },
                    { value: 'outro_documento', label: 'Outro documento' }
                ]
            },
            execucao: {
                question: 'Em que fase da execução penal você está?',
                options: [
                    { value: 'fechado', label: 'Regime fechado' },
                    { value: 'semiaberto', label: 'Regime semiaberto' },
                    { value: 'aberto', label: 'Regime aberto' },
                    { value: 'livramento', label: 'Livramento condicional' },
                    { value: 'naosei_execucao', label: 'Não sei / preciso entender' }
                ]
            },
            outra: {
                question: 'Qual dessas opções mais se aproxima da sua situação?',
                options: [
                    { value: 'vitima', label: 'Fui vítima de um crime' },
                    { value: 'testemunha', label: 'Sou testemunha em um processo' },
                    { value: 'consultoria', label: 'Quero consultoria preventiva' },
                    { value: 'outro_motivo', label: 'Outro motivo' }
                ]
            }
        },

        URGENCIA_OPTIONS: [
            { value: 'agora', label: 'Agora / é urgente' },
            { value: 'hoje', label: 'Hoje' },
            { value: 'semana', label: 'Essa semana' },
            { value: 'pesquisando', label: 'Só pesquisando por enquanto' }
        ],

        // ------------------------------------------------------------
        // CICLO DE VIDA
        // ------------------------------------------------------------

        init: function () {
            try {
                this.container = document.querySelector(this.config.containerSelector);
                if (!this.container) {
                    return; // Página sem o quiz — não faz nada, sem erro.
                }

                this.state.reducedMotion = !!(window.matchMedia &&
                    window.matchMedia('(prefers-reduced-motion: reduce)').matches);

                this.injectStyles();
                this.resetState();
                this.render();

                diagLog('Diagnóstico Jurídico inicializado com sucesso.');
            } catch (e) {
                diagLog('Erro ao inicializar o Diagnóstico Jurídico:', e);
            }
        },

        resetState: function () {
            this.state.currentIndex = 0;
            this.state.answers = {};
            this.state.pendingAnswer = null;
            this.state.flow = [
                { id: 'situacao', type: 'choice', question: 'Qual é a sua situação agora?', options: this.SITUACOES },
                null, // preenchido dinamicamente após a resposta do passo 1
                { id: 'urgencia', type: 'choice', question: 'Quando você precisa de atendimento?', options: this.URGENCIA_OPTIONS },
                { id: 'resultado', type: 'result' }
            ];
        },

        // ------------------------------------------------------------
        // ANALYTICS
        // ------------------------------------------------------------

        trackEvent: function (eventName, params) {
            try {
                if (typeof window.gtag !== 'function') return;
                window.gtag('event', eventName, params || {});
            } catch (e) {
                diagLog('Erro ao rastrear evento:', eventName, e);
            }
        },

        // ------------------------------------------------------------
        // NAVEGAÇÃO
        // ------------------------------------------------------------

        selectOption: function (step, option) {
            try {
                this.state.pendingAnswer = option;
                this.render();
            } catch (e) {
                diagLog('Erro em selectOption:', e);
            }
        },

        goNext: function () {
            try {
                var step = this.state.flow[this.state.currentIndex];
                if (!step) return;

                if (step.type === 'choice') {
                    if (!this.state.pendingAnswer) return; // validação: resposta obrigatória

                    this.state.answers[step.id] = this.state.pendingAnswer;

                    this.trackEvent('diagnostico_step_complete', {
                        step_id: step.id,
                        step_index: this.state.currentIndex + 1,
                        total_steps: this.config.totalSteps,
                        answer_value: this.state.pendingAnswer.value,
                        answer_label: this.state.pendingAnswer.label
                    });

                    // Após responder o passo 1, monta o passo 2 dinamicamente.
                    if (step.id === 'situacao') {
                        var followup = this.FOLLOWUPS[this.state.answers.situacao.value];
                        this.state.flow[1] = {
                            id: 'detalhe',
                            type: 'choice',
                            question: followup.question,
                            options: followup.options
                        };
                    }

                    this.state.pendingAnswer = null;
                }

                this.state.currentIndex++;

                if (this.state.currentIndex === this.state.flow.length - 1) {
                    this.trackEvent('diagnostico_finalizado', {
                        situacao: this.state.answers.situacao ? this.state.answers.situacao.value : null,
                        detalhe: this.state.answers.detalhe ? this.state.answers.detalhe.value : null,
                        urgencia: this.state.answers.urgencia ? this.state.answers.urgencia.value : null
                    });
                }

                this.render();
            } catch (e) {
                diagLog('Erro em goNext:', e);
            }
        },

        goBack: function () {
            try {
                if (this.state.currentIndex === 0) return;
                this.state.currentIndex--;
                this.state.pendingAnswer = null;
                this.render();
            } catch (e) {
                diagLog('Erro em goBack:', e);
            }
        },

        restart: function () {
            try {
                this.resetState();
                this.trackEvent('diagnostico_restart', {});
                this.render();
            } catch (e) {
                diagLog('Erro em restart:', e);
            }
        },

        // ------------------------------------------------------------
        // MONTAGEM DA MENSAGEM / URL DO WHATSAPP
        // ------------------------------------------------------------

        buildWhatsappMessage: function () {
            var a = this.state.answers;
            var linhas = [];

            linhas.push('Olá, Dr. Lucas! Fiz o Diagnóstico Jurídico Gratuito no site e minha situação é:');
            linhas.push('');
            if (a.situacao) linhas.push('📌 Situação: ' + a.situacao.label);
            if (a.detalhe) linhas.push('📋 Detalhe: ' + a.detalhe.label);
            if (a.urgencia) linhas.push('⏰ Urgência: ' + a.urgencia.label);
            linhas.push('');
            linhas.push('Podem me atender, por favor?');

            return linhas.join('\n');
        },

        buildWhatsappUrl: function () {
            var mensagem = this.buildWhatsappMessage();
            return 'https://wa.me/' + this.config.whatsappNumber + '?text=' + encodeURIComponent(mensagem);
        },

        // ------------------------------------------------------------
        // RENDERIZAÇÃO
        // ------------------------------------------------------------

        render: function () {
            try {
                if (!this.container) return;
                var step = this.state.flow[this.state.currentIndex];
                if (!step) return;

                if (step.type === 'result') {
                    this.container.innerHTML = this.renderResultStep();
                } else {
                    this.container.innerHTML = this.renderChoiceStep(step);
                }

                this.bindStepEvents(step);
                this.moveFocusToHeading();
            } catch (e) {
                diagLog('Erro em render:', e);
            }
        },

        escapeHtml: function (str) {
            var div = document.createElement('div');
            div.textContent = String(str == null ? '' : str);
            return div.innerHTML;
        },

        renderProgressBar: function () {
            var stepNumber = Math.min(this.state.currentIndex + 1, this.config.totalSteps);
            var percent = Math.round((stepNumber / this.config.totalSteps) * 100);
            return '' +
                '<div class="diag-progress-wrap">' +
                '  <div class="diag-progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + percent + '">' +
                '    <div class="diag-progress-fill" style="width:' + percent + '%;"></div>' +
                '  </div>' +
                '  <p class="diag-progress-text" aria-live="polite">Passo ' + stepNumber + ' de ' + this.config.totalSteps + '</p>' +
                '</div>';
        },

        renderChoiceStep: function (step) {
            var self = this;
            var isFirst = this.state.currentIndex === 0;
            var optionsHtml = step.options.map(function (opt, idx) {
                var selected = self.state.pendingAnswer && self.state.pendingAnswer.value === opt.value;
                var icon = opt.icon ? '<i class="fas ' + opt.icon + '" aria-hidden="true"></i> ' : '';
                return '' +
                    '<button type="button" class="diag-option' + (selected ? ' is-selected' : '') + '" ' +
                    'role="radio" aria-checked="' + (selected ? 'true' : 'false') + '" ' +
                    'data-diag-option-index="' + idx + '">' +
                    icon + '<span>' + self.escapeHtml(opt.label) + '</span>' +
                    (selected ? '<i class="fas fa-check diag-option-check" aria-hidden="true"></i>' : '') +
                    '</button>';
            }).join('');

            var nextDisabled = !this.state.pendingAnswer;

            return '' +
                this.renderProgressBar() +
                '<div class="diag-step">' +
                '  <h2 class="diag-step-heading" data-diag-heading tabindex="-1">' + this.escapeHtml(step.question) + '</h2>' +
                '  <div class="diag-options" role="radiogroup" aria-label="' + this.escapeHtml(step.question) + '">' +
                        optionsHtml +
                '  </div>' +
                '  <div class="diag-nav">' +
                '    ' + (isFirst ? '' : '<button type="button" class="diag-btn diag-btn-back" data-diag-back><i class="fas fa-arrow-left" aria-hidden="true"></i> Voltar</button>') +
                '    <button type="button" class="diag-btn diag-btn-next" data-diag-next' + (nextDisabled ? ' disabled aria-disabled="true"' : '') + '>Avançar <i class="fas fa-arrow-right" aria-hidden="true"></i></button>' +
                '  </div>' +
                '</div>';
        },

        renderResultStep: function () {
            var a = this.state.answers;
            var itens = [];
            if (a.situacao) itens.push({ label: 'Situação', valor: a.situacao.label });
            if (a.detalhe) itens.push({ label: 'Detalhe', valor: a.detalhe.label });
            if (a.urgencia) itens.push({ label: 'Urgência', valor: a.urgencia.label });

            var self = this;
            var resumoHtml = itens.map(function (item) {
                return '' +
                    '<li class="diag-summary-item">' +
                    '  <span class="diag-summary-label">' + self.escapeHtml(item.label) + '</span>' +
                    '  <span class="diag-summary-value">' + self.escapeHtml(item.valor) + '</span>' +
                    '</li>';
            }).join('');

            var whatsappUrl = this.buildWhatsappUrl();

            return '' +
                this.renderProgressBar() +
                '<div class="diag-step diag-result">' +
                '  <h2 class="diag-step-heading" data-diag-heading tabindex="-1">Seu diagnóstico está pronto</h2>' +
                '  <p class="diag-result-intro">Com base nas suas respostas, aqui está o resumo da sua situação:</p>' +
                '  <ul class="diag-summary-list">' + resumoHtml + '</ul>' +
                '  <a class="diag-whatsapp-btn" href="' + whatsappUrl + '" target="_blank" rel="noopener" data-diag-whatsapp>' +
                '    <i class="fab fa-whatsapp" aria-hidden="true"></i> FALAR COM DR. LUCAS AGORA' +
                '  </a>' +
                '  <p class="diag-result-note">Atendimento humano, sigiloso e sem compromisso. Plantão 24h em Sabará e Grande BH.</p>' +
                '  <button type="button" class="diag-restart" data-diag-restart>Refazer diagnóstico</button>' +
                '</div>';
        },

        bindStepEvents: function (step) {
            var self = this;
            if (!this.container) return;

            if (step.type === 'choice') {
                var optionButtons = this.container.querySelectorAll('[data-diag-option-index]');
                optionButtons.forEach(function (btn) {
                    btn.addEventListener('click', function () {
                        var idx = parseInt(btn.getAttribute('data-diag-option-index'), 10);
                        var option = step.options[idx];
                        if (option) self.selectOption(step, option);
                    });
                });

                var nextBtn = this.container.querySelector('[data-diag-next]');
                if (nextBtn) {
                    nextBtn.addEventListener('click', function () { self.goNext(); });
                }

                var backBtn = this.container.querySelector('[data-diag-back]');
                if (backBtn) {
                    backBtn.addEventListener('click', function () { self.goBack(); });
                }
            }

            if (step.type === 'result') {
                var wppBtn = this.container.querySelector('[data-diag-whatsapp]');
                if (wppBtn) {
                    wppBtn.addEventListener('click', function () {
                        self.trackEvent('diagnostico_whatsapp_click', {
                            situacao: self.state.answers.situacao ? self.state.answers.situacao.value : null,
                            detalhe: self.state.answers.detalhe ? self.state.answers.detalhe.value : null,
                            urgencia: self.state.answers.urgencia ? self.state.answers.urgencia.value : null
                        });
                    });
                }

                var restartBtn = this.container.querySelector('[data-diag-restart]');
                if (restartBtn) {
                    restartBtn.addEventListener('click', function () { self.restart(); });
                }
            }
        },

        moveFocusToHeading: function () {
            try {
                if (!this.container) return;
                var heading = this.container.querySelector('[data-diag-heading]');
                if (heading && typeof heading.focus === 'function') {
                    heading.focus({ preventScroll: false });
                }
            } catch (e) {
                diagLog('Erro ao mover foco:', e);
            }
        },

        // ------------------------------------------------------------
        // ESTILOS (injetados uma única vez)
        // ------------------------------------------------------------

        injectStyles: function () {
            try {
                if (document.getElementById('diagnostico-styles')) return;

                var css = '' +
                    '#diagnostico-app{max-width:720px;margin:0 auto;font-family:var(--font-body,\'Lato\',sans-serif);color:var(--text-on,#f0ede8);}' +
                    '#diagnostico-app *{box-sizing:border-box;}' +
                    '.diag-progress-wrap{margin-bottom:28px;}' +
                    '.diag-progress-bar{width:100%;height:8px;border-radius:100px;background:rgba(255,255,255,0.08);overflow:hidden;}' +
                    '.diag-progress-fill{height:100%;background:linear-gradient(90deg,var(--ouro,#d4af37),#f4d874);transition:width .35s ease;}' +
                    '.diag-progress-text{font-family:var(--font-mono,monospace);font-size:.75rem;letter-spacing:1px;text-transform:uppercase;color:var(--ouro,#d4af37);margin:10px 0 0;}' +
                    '.diag-step{background:var(--bg-card,#0a0a0a);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:32px 24px;}' +
                    '.diag-step-heading{font-family:var(--font-teko,\'Teko\',sans-serif);font-weight:600;font-size:clamp(1.6rem,4.5vw,2.3rem);letter-spacing:.5px;color:#fff;margin:0 0 22px;line-height:1.15;outline:none;text-transform:uppercase;}' +
                    '.diag-options{display:flex;flex-direction:column;gap:12px;margin-bottom:26px;}' +
                    '.diag-option{display:flex;align-items:center;gap:12px;width:100%;text-align:left;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);color:var(--text-on,#f0ede8);padding:16px 18px;border-radius:10px;font-family:var(--font-body,\'Lato\',sans-serif);font-size:1rem;cursor:pointer;transition:border-color .2s,background .2s,transform .2s;}' +
                    '.diag-option:hover{border-color:var(--ouro-border,rgba(212,175,55,0.4));background:var(--ouro-dim,rgba(212,175,55,0.1));}' +
                    '.diag-option:focus-visible{outline:2px solid var(--ouro,#d4af37);outline-offset:2px;}' +
                    '.diag-option i.fas{color:var(--ouro,#d4af37);width:20px;text-align:center;flex-shrink:0;}' +
                    '.diag-option span{flex:1;}' +
                    '.diag-option.is-selected{border-color:var(--ouro,#d4af37);background:var(--ouro-dim,rgba(212,175,55,0.16));box-shadow:0 0 0 1px var(--ouro,#d4af37) inset;}' +
                    '.diag-option-check{color:var(--ouro,#d4af37)!important;}' +
                    '.diag-nav{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;}' +
                    '.diag-btn{font-family:var(--font-teko,\'Teko\',sans-serif);font-size:1.2rem;letter-spacing:1px;text-transform:uppercase;padding:12px 26px;border-radius:8px;border:none;cursor:pointer;transition:transform .2s,box-shadow .2s,opacity .2s;}' +
                    '.diag-btn-next{margin-left:auto;background:var(--ouro,#d4af37);color:#1a1400;box-shadow:0 0 20px rgba(212,175,55,0.25);}' +
                    '.diag-btn-next:hover:not(:disabled){transform:translateY(-2px);}' +
                    '.diag-btn-next:disabled{opacity:.35;cursor:not-allowed;}' +
                    '.diag-btn-back{background:transparent;border:1px solid rgba(255,255,255,0.2);color:var(--text-on,#f0ede8);}' +
                    '.diag-btn-back:hover{border-color:rgba(255,255,255,0.4);}' +
                    '.diag-result-intro{color:var(--text-muted,#999);margin-bottom:18px;}' +
                    '.diag-summary-list{list-style:none;margin:0 0 26px;padding:0;border:1px solid rgba(255,255,255,0.08);border-radius:10px;overflow:hidden;}' +
                    '.diag-summary-item{display:flex;justify-content:space-between;gap:16px;padding:14px 18px;border-bottom:1px solid rgba(255,255,255,0.06);font-size:.95rem;}' +
                    '.diag-summary-item:last-child{border-bottom:none;}' +
                    '.diag-summary-label{color:var(--text-muted,#999);font-family:var(--font-mono,monospace);font-size:.72rem;letter-spacing:1px;text-transform:uppercase;white-space:nowrap;}' +
                    '.diag-summary-value{color:#fff;text-align:right;}' +
                    '.diag-whatsapp-btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;background:#25d366;color:#fff;font-family:var(--font-teko,\'Teko\',sans-serif);font-size:1.5rem;letter-spacing:1px;text-transform:uppercase;padding:16px;border-radius:10px;text-decoration:none;box-shadow:0 0 25px rgba(37,211,102,0.35);transition:transform .2s;margin-bottom:16px;}' +
                    '.diag-whatsapp-btn:hover{transform:translateY(-2px);color:#fff;}' +
                    '.diag-result-note{color:var(--text-muted,#999);font-size:.85rem;text-align:center;margin-bottom:18px;}' +
                    '.diag-restart{display:block;margin:0 auto;background:transparent;border:none;color:var(--text-link,#999);font-family:var(--font-body,\'Lato\',sans-serif);font-size:.85rem;text-decoration:underline;cursor:pointer;}' +
                    '.diag-restart:hover{color:var(--ouro,#d4af37);}' +
                    '@media(max-width:576px){.diag-step{padding:24px 18px;}.diag-btn{width:100%;justify-content:center;text-align:center;}.diag-nav{flex-direction:column-reverse;}.diag-btn-next{margin-left:0;}}' +
                    '@media(prefers-reduced-motion:reduce){#diagnostico-app *{transition:none!important;animation:none!important;}}';

                var styleEl = document.createElement('style');
                styleEl.id = 'diagnostico-styles';
                styleEl.textContent = css;
                document.head.appendChild(styleEl);
            } catch (e) {
                diagLog('Erro ao injetar estilos:', e);
            }
        }
    };

    document.addEventListener('DOMContentLoaded', function () {
        try {
            window.DiagnosticoJuridico.init();
        } catch (e) {
            diagLog('Erro fatal ao inicializar o Diagnóstico Jurídico:', e);
        }
    });

})();
