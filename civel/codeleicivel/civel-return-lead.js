/* ================================================================ */
/* === FICHEIRO: civel-return-lead.js (ReturnLead Cível V1) ======= */
/* === FUNÇÃO: Retargeting Orgânico e Qualificação via IA          === */
/* === ADAPTADO DE: js/return-lead.js (site principal, criminal)   === */
/* === ESCOPO: civel.lucassemim.adv.br — Direito Cível             === */
/* ================================================================ */

window.ReturnLead = {
    config: {
        storageKey: 'semim_civel_rv_v1',
        whatsapp: '5531989420094',
        waBase: 'https://wa.me/',

        minVisitsToShow: 2,
        minDaysBetweenShows: 7,
        showDelayMs: 6000,
        scrollTriggerPct: 45,
        hideAfterShown: 3,

        // V2 (03/10/2026): o endpoint /api/claude-chat.php NÃO existe no cível (404),
        // então a orientação agora é montada localmente (ORIENTACOES abaixo): instantânea,
        // sem custo e sem risco de a IA prometer resultado.
        // O lead vai para o Apps Script "Api site" (rota lead_retorno_civel): aba
        // RETORNO_CIVEL + e-mail com botão de WhatsApp. Se CIVEL_API_URL existir na página
        // (civel-api-config.js) ela é usada; senão vale a URL fixa abaixo.
        webhookUrl: (typeof CIVEL_API_URL !== 'undefined' && CIVEL_API_URL)
            ? CIVEL_API_URL
            : 'https://script.google.com/macros/s/AKfycbxNkBiodBFUxvDK-kfBuSLjBDxTcbhyWfllEv87-wFJlhCO3_d1H2CO_zDPjb_Qs2BK/exec',

        // páginas onde o widget NÃO deve aparecer (formulários, painéis, a própria Central)
        skipPages: /^(painel-|cadastro-|sala-reuniao|central-do-caso-civel|central-documentos|google)/,

        styleId: 'return-lead-styles',
        widgetId: 'return-lead-widget',
        isDebug: window.location.hostname !== 'civel.lucassemim.adv.br'
    },

    ORIENTACOES: {
        acidente: 'Em acidente de trânsito, boletim de ocorrência, fotos, laudos e testemunhas são o que sustenta a indenização, e o prazo para agir corre. O Dr. Lucas analisa o que você já tem e diz se há caminho para reparação.',
        cobranca: 'Cobrança que você não reconhece pode ser contestada, e guardar extratos, contratos e prints desde já faz diferença. O Dr. Lucas confere os documentos e orienta o próximo passo, sem compromisso.',
        plano_saude: 'Negativa de plano de saúde pode ser revista, e quando o tratamento é urgente o caso pode pedir decisão rápida na Justiça. Separe o laudo médico e a carta de negativa e fale com o Dr. Lucas.',
        golpe: 'Em golpe ou fraude, as primeiras horas contam: guarde comprovantes, prints e o boletim de ocorrência. O Dr. Lucas avalia a responsabilidade do banco e o que ainda pode ser feito.',
        outro: 'Cada caso cível tem prazos e provas próprios, e agir cedo preserva as duas coisas. O Dr. Lucas faz uma análise inicial gratuita e sigilosa para dizer o que cabe no seu caso.',
        continuidade: 'Que bom retomar. O Dr. Lucas recebe o seu pedido de continuidade e responde pelo WhatsApp com o andamento e os próximos passos.',
        '5': 'Obrigado pela confiança. Se surgiu um novo assunto ou você quer dar continuidade, o Dr. Lucas atende pelo WhatsApp com prioridade.',
        '3': 'Obrigado pelo retorno. Se tem uma nova situação ou algo ficou pendente, conte pelo WhatsApp que o Dr. Lucas analisa.',
        _: 'O Dr. Lucas Semim analisa o seu caso cível com sigilo e diz os próximos passos. Entre em contato pelo WhatsApp.'
    },

    state: {
        visitData: null,
        isReturning: false,
        shown: false,
        currentStep: 0,
        reducedMotion: false,
        userResponses: {},
        claudeReply: '',
        timers: []
    },

    init() {
        const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
        if (this.config.skipPages.test(page)) return;
        this.state.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const isReturning = this.checkReturning();
        if (!isReturning || !this.shouldShow()) return;

        this.buildStyles();
        this.buildWidget();

        // Só aparece quando o caminho está livre: cookies já respondidos e nenhum outro aviso na tela.
        // Tenta de novo a cada 3s por até ~45s (evita 4 pop-ups empilhados no celular).
        let tentativas = 0;
        const tentar = (trigger) => {
            if (this.state.shown) return;
            if (this.canShowNow() || tentativas >= 15) { this.showWidget(trigger); return; }
            tentativas++;
            this.state.timers.push(setTimeout(() => tentar(trigger), 3000));
        };
        this.tentar = tentar;
        this.state.timers.push(setTimeout(() => tentar('time_trigger'), this.config.showDelayMs));

        const scrollHandler = () => {
            const scrollHeight = document.body.scrollHeight - window.innerHeight;
            if (scrollHeight <= 0) return;
            const pct = (window.scrollY / scrollHeight) * 100;
            if (pct >= this.config.scrollTriggerPct && !this.state.shown) {
                this.tentar('scroll_trigger');
                window.removeEventListener('scroll', scrollHandler);
            }
        };
        window.addEventListener('scroll', scrollHandler, { passive: true });
    },

    canShowNow() {
        try { if (!localStorage.getItem('lgpd_civel_consent')) return false; } catch { }
        const visivel = (sel) => Array.from(document.querySelectorAll(sel)).some(el => {
            const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
            return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.opacity !== '0';
        });
        return !visivel('.social-proof-toast');
    },

    checkReturning() {
        try {
            const raw = localStorage.getItem(this.config.storageKey);
            const data = raw ? JSON.parse(raw) : null;

            if (!data) {
                try { sessionStorage.setItem('semim_civel_rv_sess', '1'); } catch { }
                this.updateVisitData({
                    count: 1,
                    firstVisit: Date.now(),
                    lastVisit: Date.now(),
                    showCount: 0,
                    converted: false
                });
                this.state.isReturning = false;
                return false;
            }

            // V2: "visita" = sessão do navegador, não pageview. Antes, 2 páginas abertas
            // na mesma sessão já contavam como "retorno" (o aviso aparecia na 2ª página).
            let novaSessao = true;
            try {
                novaSessao = !sessionStorage.getItem('semim_civel_rv_sess');
                sessionStorage.setItem('semim_civel_rv_sess', '1');
            } catch { }
            const updated = {
                ...data,
                count: novaSessao ? data.count + 1 : data.count,
                lastVisit: Date.now()
            };
            this.updateVisitData(updated);
            this.state.visitData = updated;
            this.state.isReturning = updated.count >= this.config.minVisitsToShow;
            return this.state.isReturning;
        } catch {
            return false;
        }
    },

    updateVisitData(data) {
        try {
            localStorage.setItem(this.config.storageKey, JSON.stringify(data));
        } catch { }
    },

    shouldShow() {
        const d = this.state.visitData;
        if (!d || !this.state.isReturning) return false;
        if (d.converted) return false;
        if (d.showCount >= this.config.hideAfterShown) return false;

        const daysSinceLastShow = d.lastShown
            ? (Date.now() - d.lastShown) / (1000 * 60 * 60 * 24)
            : 999;

        return daysSinceLastShow >= this.config.minDaysBetweenShows;
    },

    markShown() {
        const d = {
            ...this.state.visitData,
            lastShown: Date.now(),
            showCount: (this.state.visitData?.showCount || 0) + 1
        };
        this.updateVisitData(d);
        this.state.visitData = d;
    },

    markConverted() {
        const d = { ...this.state.visitData, converted: true };
        this.updateVisitData(d);
    },

    buildStyles() {
        if (document.getElementById(this.config.styleId)) return;

        const style = document.createElement('style');
        style.id = this.config.styleId;
        style.textContent = `
            #return-lead-widget {
                --rl-gold: #d4af37; --rl-gold-hi: #f6e7a6; --rl-teal: #2aa6a0; --rl-ink: #060707;
                position: fixed;
                bottom: 24px;
                left: 24px;
                z-index: 99990;
                width: 320px;
                max-width: calc(100vw - 32px);
                box-sizing: border-box;
                background: linear-gradient(180deg, rgba(14,16,16,.98), rgba(6,7,7,.98));
                border: 1px solid rgba(212, 175, 55, 0.28);
                border-radius: 16px;
                padding: 22px 20px 16px;
                box-shadow: 0 18px 50px rgba(0, 0, 0, .75), 0 0 0 1px rgba(42,166,160,.10);
                backdrop-filter: blur(14px);
                -webkit-backdrop-filter: blur(14px);
                font-family: 'Lato', sans-serif;
                color: #e8e8e8;
                opacity: 0;
                transform: translateY(18px) scale(.98);
                pointer-events: none;
                visibility: hidden;
                transition: opacity .35s ease, transform .35s ease, visibility 0s linear .35s;
            }
            #return-lead-widget::before {
                content: ""; position: absolute; left: 16px; right: 16px; top: 0; height: 3px;
                border-radius: 0 0 4px 4px;
                background: linear-gradient(90deg, var(--rl-teal), var(--rl-gold), var(--rl-gold-hi));
            }
            #return-lead-widget.rl-visible {
                opacity: 1; transform: none; pointer-events: auto; visibility: visible;
                transition: opacity .35s ease, transform .35s ease, visibility 0s;
            }
            @media (prefers-reduced-motion: reduce) {
                #return-lead-widget, #return-lead-widget.rl-visible { transition: none; }
            }

            .rl-close {
                position: absolute; top: 8px; right: 8px;
                width: 32px; height: 32px; border-radius: 50%;
                background: transparent; border: none; color: #8d8d8d;
                font-size: 1.5rem; line-height: 1; cursor: pointer; padding: 0;
            }
            .rl-close:hover, .rl-close:focus-visible { color: var(--rl-gold); background: rgba(212,175,55,.10); outline: none; }

            .rl-dots { display: flex; gap: 5px; justify-content: center; margin: 0 0 12px; }
            .rl-dots i { width: 22px; height: 3px; border-radius: 3px; background: rgba(255,255,255,.12); }
            .rl-dots i.on { background: linear-gradient(90deg, var(--rl-teal), var(--rl-gold)); }

            .rl-icon {
                width: 44px; height: 44px; margin: 0 auto 10px;
                border-radius: 50%; display: flex; align-items: center; justify-content: center;
                font-size: 1.35rem; line-height: 1;
                background: radial-gradient(circle at 30% 25%, rgba(212,175,55,.25), rgba(42,166,160,.10));
                border: 1px solid rgba(212,175,55,.35);
            }
            .rl-title {
                color: #fff; font-family: 'Teko', sans-serif; font-weight: 600;
                font-size: 1.45rem; line-height: 1.1; text-align: center;
                margin: 0 0 6px; letter-spacing: .4px; text-wrap: balance;
            }
            .rl-question {
                color: #bdbdbd; font-size: .9rem; text-align: center;
                margin: 0 0 14px; line-height: 1.45;
            }

            .rl-btn-group { display: flex; flex-direction: column; gap: 8px; }
            .rl-btn {
                background: rgba(212, 175, 55, 0.06);
                border: 1px solid rgba(212, 175, 55, 0.22);
                color: #ececec; font-size: .9rem; font-family: 'Lato', sans-serif; font-weight: 600;
                padding: 11px 14px; min-height: 44px; border-radius: 10px;
                cursor: pointer; text-align: left; width: 100%; box-sizing: border-box;
                transition: background .2s, border-color .2s, transform .15s;
            }
            .rl-btn:hover, .rl-btn:focus-visible {
                background: rgba(212, 175, 55, 0.14); border-color: rgba(212, 175, 55, 0.55);
                color: var(--rl-gold-hi); outline: none; transform: translateX(2px);
            }
            .rl-btn-primary {
                background: linear-gradient(135deg, #f6e7a6, #d4af37 55%, #9a7a16);
                color: #1a1405; font-weight: 800; text-align: center;
                border-color: transparent; text-transform: uppercase; letter-spacing: .5px;
            }
            .rl-btn-primary:hover, .rl-btn-primary:focus-visible { color: #1a1405; transform: translateY(-1px); filter: brightness(1.06); }
            .rl-btn-primary:disabled { background: #444; color: #999; cursor: not-allowed; transform: none; filter: none; }

            .rl-btn-whatsapp {
                display: flex; align-items: center; justify-content: center; gap: 8px;
                background: linear-gradient(135deg, #128c7e, #25d366);
                color: #fff !important; text-decoration: none;
                font-family: 'Teko', sans-serif; font-size: 1.25rem; font-weight: 600; letter-spacing: .5px;
                padding: 10px; border-radius: 10px; border: none; margin-top: 6px;
                width: 100%; box-sizing: border-box; text-align: center;
                transform: none !important;
            }
            .rl-btn-whatsapp:hover { filter: brightness(1.08); }

            .rl-input {
                width: 100%; box-sizing: border-box;
                background: rgba(255,255,255,.05); border: 1px solid #3b3b3b; border-radius: 10px;
                color: #f2f2f2; padding: 12px 14px; min-height: 46px;
                font-size: 16px; /* evita zoom automático no iOS */
                font-family: 'Lato', sans-serif; outline: none; margin-bottom: 9px;
                transition: border-color .2s, box-shadow .2s;
            }
            .rl-input:focus { border-color: var(--rl-gold); box-shadow: 0 0 0 3px rgba(212,175,55,.18); }
            .rl-input::placeholder { color: #7d7d7d; }
            .rl-input.rl-err { border-color: #e5322d; }
            .rl-hp { position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0; }

            .rl-claude-reply {
                background: rgba(42,166,160,.08); border-left: 3px solid var(--rl-teal);
                color: #d2d2d2; font-size: .88rem; line-height: 1.55;
                padding: 11px 13px; border-radius: 0 10px 10px 0; margin-bottom: 10px;
            }
            .rl-note { color: #8d8d8d; font-size: .72rem; line-height: 1.4; text-align: center; margin: 2px 0 10px; }
            .rl-sigilo { color: #8d8d8d; font-size: .75rem; text-align: center; margin: 0 0 10px; }

            .rl-back, .rl-close-link {
                display: block; width: 100%; background: none; border: none;
                color: #8d8d8d; font-size: .8rem; cursor: pointer; text-align: center;
                padding: 8px 4px 2px; margin-top: 4px; font-family: 'Lato', sans-serif;
            }
            .rl-back:hover, .rl-close-link:hover { color: #d0d0d0; }

            @media (max-width: 768px) {
                #return-lead-widget {
                    width: auto; max-width: none;
                    left: 12px; right: 12px;
                    /* acima da barra fixa do cível (84px) + aviso de rodapé */
                    bottom: calc(96px + env(safe-area-inset-bottom, 0px));
                    padding: 20px 16px 12px;
                }
                .rl-title { font-size: 1.3rem; }
            }
        `;
        document.head.appendChild(style);
    },

    buildWidget() {
        const widget = document.createElement('div');
        widget.id = this.config.widgetId;
        widget.setAttribute('role', 'dialog');
        widget.setAttribute('aria-modal', 'false');
        widget.setAttribute('aria-label', 'Retomada de caso — Dr. Lucas Semim');

        const closeBtn = document.createElement('button');
        closeBtn.className = 'rl-close';
        closeBtn.setAttribute('aria-label', 'Fechar');
        closeBtn.textContent = '×';
        closeBtn.addEventListener('click', () => this.hideWidget());

        const content = document.createElement('div');
        content.id = 'rl-content';
        content.className = 'rl-content';

        widget.appendChild(closeBtn);
        widget.appendChild(content);
        document.body.appendChild(widget);

        this.renderStep(1);
    },

    /* No celular, sobe o widget acima do que já está fixo no rodapé (aviso de atualização, barra "Analisar meu caso"). */
    placeAboveFooter() {
        const w = document.getElementById(this.config.widgetId);
        if (!w) return;
        if (window.innerWidth > 768) { w.style.bottom = ''; return; }
        let h = 0;
        document.querySelectorAll('body > *').forEach(el => {
            if (el === w || el.id === this.config.widgetId) return;
            const cs = getComputedStyle(el);
            if (cs.position !== 'fixed' || cs.display === 'none' || cs.visibility === 'hidden') return;
            const r = el.getBoundingClientRect();
            if (r.height < 30 || r.height > 200 || r.width < window.innerWidth * 0.6) return; // só faixas largas (ignora canvas/overlays de tela cheia)
            if (Math.abs(window.innerHeight - r.bottom) > 6) return;                  // coladas no rodapé
            h = Math.max(h, r.height);
        });
        w.style.bottom = `calc(${Math.round(h) + 12}px + env(safe-area-inset-bottom, 0px))`;
    },

    showWidget(trigger) {
        if (this.state.shown) return;
        this.state.shown = true;
        this.markShown();

        const widget = document.getElementById(this.config.widgetId);
        if (!widget) return;

        this.placeAboveFooter();
        window.addEventListener('resize', () => this.placeAboveFooter(), { passive: true });

        widget.classList.add('rl-visible');
        this.trackEvent('widget_shown', { trigger });

        if (this.config.isDebug) {
            console.log('[ReturnLead Cível] Widget exibido. Trigger:', trigger);
        }
    },

    hideWidget() {
        const widget = document.getElementById(this.config.widgetId);
        if (widget) widget.classList.remove('rl-visible');
        this.trackEvent('widget_closed', { step: this.state.currentStep });
    },

    renderStep(step) {
        this.state.currentStep = step;
        const content = document.getElementById('rl-content');
        if (!content) return;
        content.innerHTML = '';

        const dots = document.createElement('div');
        dots.className = 'rl-dots';
        dots.setAttribute('aria-hidden', 'true');
        for (let i = 1; i <= 4; i++) { const d = document.createElement('i'); if (i <= step) d.className = 'on'; dots.appendChild(d); }
        content.appendChild(dots);

        if (step === 1) this.buildStep1(content);
        else if (step === 2) this.buildStep2(content);
        else if (step === 3) this.buildStep3(content);
        else if (step === 4) this.buildStep4(content);
    },

    backBtn(toStep) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'rl-back';
        b.textContent = '← Voltar';
        b.addEventListener('click', () => this.renderStep(toStep));
        return b;
    },

    buildStep1(container) {
        const icon = document.createElement('div');
        icon.className = 'rl-icon';
        icon.textContent = '⚖️';

        const title = document.createElement('p');
        title.className = 'rl-title';
        title.textContent = 'Olá! Notamos que você já nos visitou.';

        const question = document.createElement('p');
        question.className = 'rl-question';
        question.textContent = 'Já teve atendimento com o Dr. Lucas Semim?';

        const btns = document.createElement('div');
        btns.className = 'rl-btn-group';

        const opts = [
            { label: '✅ Sim, fui atendido', value: 'sim' },
            { label: '🔄 Estou pensando', value: 'pensando' },
            { label: '❌ Ainda não', value: 'nao' }
        ];

        opts.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'rl-btn';
            btn.textContent = opt.label;
            btn.addEventListener('click', () => {
                this.state.userResponses.jaAtendido = opt.value;
                this.trackEvent('step1_answered', { answer: opt.value });
                this.renderStep(2);
            });
            btns.appendChild(btn);
        });

        [icon, title, question, btns].forEach(el => container.appendChild(el));
    },

    buildStep2(container) {
        const resp = this.state.userResponses.jaAtendido;

        const icon = document.createElement('div');
        icon.className = 'rl-icon';

        const title = document.createElement('p');
        title.className = 'rl-title';

        const question = document.createElement('p');
        question.className = 'rl-question';

        const btns = document.createElement('div');
        btns.className = 'rl-btn-group';

        if (resp === 'sim') {
            icon.textContent = '🤝';
            title.textContent = 'Que bom que nos conhecemos!';
            question.textContent = 'Como você avalia o atendimento no seu caso?';

            const avaliacoes = [
                { label: '⭐⭐⭐⭐⭐ Excelente', value: '5' },
                { label: '⭐⭐⭐ Bom', value: '3' },
                { label: '🔁 Quero dar continuidade ao caso', value: 'continuidade' }
            ];

            avaliacoes.forEach(av => {
                const btn = document.createElement('button');
                btn.className = 'rl-btn';
                btn.textContent = av.label;
                btn.addEventListener('click', () => {
                    this.state.userResponses.avaliacao = av.value;
                    this.trackEvent('step2_answered', { answer: av.value });
                    this.renderStep(3);
                });
                btns.appendChild(btn);
            });

        } else if (resp === 'pensando') {
            icon.textContent = '🤔';
            title.textContent = 'Podemos ajudar você a decidir.';
            question.textContent = 'Qual situação te trouxe aqui?';

            const situacoes = [
                { label: '🚗 Acidente de trânsito', value: 'acidente' },
                { label: '💳 Cobrança indevida', value: 'cobranca' },
                { label: '🏥 Plano de saúde', value: 'plano_saude' },
                { label: '⚠️ Golpe / fraude', value: 'golpe' },
                { label: '❓ Outro assunto', value: 'outro' }
            ];

            situacoes.forEach(s => {
                const btn = document.createElement('button');
                btn.className = 'rl-btn';
                btn.textContent = s.label;
                btn.addEventListener('click', () => {
                    this.state.userResponses.situacao = s.value;
                    this.trackEvent('step2_answered', { answer: s.value });
                    this.renderStep(3);
                });
                btns.appendChild(btn);
            });

        } else {
            icon.textContent = '📋';
            title.textContent = 'Podemos fazer uma análise gratuita.';
            question.textContent = 'Qual situação te trouxe aqui?';

            const situacoes = [
                { label: '🚗 Acidente de trânsito', value: 'acidente' },
                { label: '💳 Cobrança indevida', value: 'cobranca' },
                { label: '🏥 Plano de saúde', value: 'plano_saude' },
                { label: '⚠️ Golpe / fraude', value: 'golpe' },
                { label: '❓ Outro assunto', value: 'outro' }
            ];

            situacoes.forEach(s => {
                const btn = document.createElement('button');
                btn.className = 'rl-btn';
                btn.textContent = s.label;
                btn.addEventListener('click', () => {
                    this.state.userResponses.situacao = s.value;
                    this.trackEvent('step2_answered', { answer: s.value });
                    this.renderStep(3);
                });
                btns.appendChild(btn);
            });
        }

        [icon, title, question, btns].forEach(el => container.appendChild(el));
        container.appendChild(this.backBtn(1));
    },

    buildStep3(container) {
        const icon = document.createElement('div');
        icon.className = 'rl-icon';
        icon.textContent = '📝';

        const title = document.createElement('p');
        title.className = 'rl-title';
        title.textContent = 'Quase lá: dois dados rápidos';

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.id = 'rl-nome';
        nameInput.className = 'rl-input';
        nameInput.placeholder = 'Seu nome';
        nameInput.setAttribute('autocomplete', 'given-name');
        nameInput.setAttribute('aria-label', 'Seu nome');

        const phoneInput = document.createElement('input');
        phoneInput.type = 'tel';
        phoneInput.id = 'rl-tel';
        phoneInput.className = 'rl-input';
        phoneInput.placeholder = 'WhatsApp com DDD';
        phoneInput.setAttribute('autocomplete', 'tel');
        phoneInput.setAttribute('inputmode', 'tel');
        phoneInput.setAttribute('aria-label', 'WhatsApp com DDD');

        // campo-armadilha para robôs
        const hp = document.createElement('input');
        hp.type = 'text'; hp.className = 'rl-hp'; hp.tabIndex = -1; hp.setAttribute('autocomplete', 'off'); hp.setAttribute('aria-hidden', 'true');

        phoneInput.addEventListener('input', () => {
            const v = phoneInput.value.replace(/\D/g, '').slice(0, 11);
            phoneInput.value = v.length > 6 ? `(${v.slice(0, 2)}) ${v.slice(2, v.length - 4)}-${v.slice(-4)}`
                : v.length > 2 ? `(${v.slice(0, 2)}) ${v.slice(2)}` : v;
            phoneInput.classList.remove('rl-err');
        });
        nameInput.addEventListener('input', () => nameInput.classList.remove('rl-err'));

        const sendBtn = document.createElement('button');
        sendBtn.type = 'button';
        sendBtn.className = 'rl-btn rl-btn-primary';
        sendBtn.textContent = 'Ver orientação';

        const note = document.createElement('p');
        note.className = 'rl-note';
        note.textContent = '🔒 Usamos seus dados só para responder sobre o seu caso (LGPD e sigilo profissional).';

        const submit = async () => {
            const nome = nameInput.value.trim();
            const telefone = phoneInput.value.trim();
            const okNome = nome.length >= 2;
            const okTel = telefone.replace(/\D/g, '').length >= 10;
            nameInput.classList.toggle('rl-err', !okNome);
            phoneInput.classList.toggle('rl-err', !okTel);
            if (!okNome) { nameInput.focus(); return; }
            if (!okTel) { phoneInput.focus(); return; }

            this.state.userResponses.nome = nome;
            this.state.userResponses.telefone = telefone;
            this.state.userResponses.honeypot = hp.value;

            sendBtn.disabled = true;
            sendBtn.textContent = 'Enviando...';

            this.state.claudeReply = this.orientacao();
            const enviado = await this.sendToGoogleSheet();
            this.state.leadEnviado = enviado;

            this.trackEvent('lead_generated', {
                situacao: this.state.userResponses.situacao || this.state.userResponses.avaliacao,
                jaAtendido: this.state.userResponses.jaAtendido,
                enviado: enviado ? 1 : 0
            });
            this.renderStep(4);
        };
        sendBtn.addEventListener('click', submit);
        [nameInput, phoneInput].forEach(el => el.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); }));

        [icon, title, nameInput, phoneInput, hp, sendBtn, note].forEach(el => container.appendChild(el));
        container.appendChild(this.backBtn(2));
    },

    buildStep4(container) {
        const icon = document.createElement('div');
        icon.className = 'rl-icon';
        icon.textContent = '⚖️';

        const title = document.createElement('p');
        title.className = 'rl-title';
        title.textContent = `${(this.state.userResponses.nome || 'Olá').split(' ')[0]}, veja o que fazer agora`;

        const replyCard = document.createElement('div');
        replyCard.className = 'rl-claude-reply';
        replyCard.textContent = this.state.claudeReply;

        const sigilo = document.createElement('p');
        sigilo.className = 'rl-sigilo';
        sigilo.textContent = this.state.leadEnviado === false ? '🔒 Sigilo profissional. Se quiser, chame direto pelo WhatsApp.' : '🔒 Seus dados chegaram ao escritório. Atendimento sigiloso (Estatuto da OAB).';

        const waBtn = document.createElement('a');
        waBtn.className = 'rl-btn rl-btn-whatsapp';
        waBtn.href = this.buildWhatsAppUrl();
        waBtn.target = '_blank';
        waBtn.rel = 'noopener noreferrer';
        waBtn.setAttribute('aria-label', 'Falar com Dr. Lucas Semim pelo WhatsApp');

        waBtn.textContent = 'Falar com Dr. Lucas agora';

        waBtn.addEventListener('click', () => {
            this.markConverted();
            this.trackEvent('whatsapp_click', { step: 4 });
        });

        const closeLink = document.createElement('button');
        closeLink.className = 'rl-close-link';
        closeLink.textContent = 'Fechar';
        closeLink.addEventListener('click', () => this.hideWidget());

        [icon, title, replyCard, sigilo, waBtn, closeLink].forEach(el => container.appendChild(el));
    },

    orientacao() {
        const r = this.state.userResponses;
        const key = r.jaAtendido === 'sim' ? r.avaliacao : r.situacao;
        return this.ORIENTACOES[key] || this.ORIENTACOES._;
    },

    async sendToGoogleSheet() {
        if (!this.config.webhookUrl || /SUBSTITUIR/.test(this.config.webhookUrl)) return false;
        const r = this.state.userResponses;
        const payload = {
            acao: 'lead_retorno_civel',
            timestamp: new Date().toISOString(),
            nome: r.nome || '',
            telefone: r.telefone || '',
            jaAtendido: r.jaAtendido || '',
            avaliacao: r.avaliacao || '',
            situacao: r.situacao || '',
            pagina: window.location.pathname,
            titulo: document.title.slice(0, 80),
            campanha: new URLSearchParams(window.location.search).get('utm_campaign') || 'organico',
            visitas: this.state.visitData?.count || 0,
            honeypot: r.honeypot || '',
            area: 'civel'
        };
        try {
            const ctl = new AbortController();
            const to = setTimeout(() => ctl.abort(), 12000);
            // sem Content-Type customizado: evita preflight (Apps Script não responde OPTIONS)
            const resp = await fetch(this.config.webhookUrl, { method: 'POST', body: JSON.stringify(payload), signal: ctl.signal });
            clearTimeout(to);
            const j = await resp.json();
            return j && j.status === 'sucesso';
        } catch (e) {
            if (this.config.isDebug) console.warn('[ReturnLead Cível] falha ao enviar lead:', e);
            return false;
        }
    },

    buildWhatsAppUrl() {
        const r = this.state.userResponses;
        const situacaoLabel = {
            acidente: '🚗 Acidente de trânsito',
            cobranca: '💳 Cobrança indevida',
            plano_saude: '🏥 Negativa de plano de saúde',
            golpe: '⚠️ Golpe / fraude financeira',
            outro: '❓ Outro assunto cível',
            continuidade: '🔄 Dar continuidade ao caso',
            '5': '⭐⭐⭐⭐⭐ Atendimento excelente — quero continuar',
            '3': '⭐⭐⭐ Bom atendimento — tenho nova situação'
        };

        const sit = situacaoLabel[r.avaliacao] || situacaoLabel[r.situacao] || 'Visita recorrente ao site';

        const msg = [
            `Olá Dr. Lucas! Sou ${r.nome}.`,
            `Situação: ${sit}`,
            this.state.claudeReply ? `\n${this.state.claudeReply}` : '',
            '\n_Mensagem enviada pelo assistente do site_'
        ].filter(Boolean).join('\n');

        return `${this.config.waBase}${this.config.whatsapp}?text=${encodeURIComponent(msg)}`;
    },

    trackEvent(action, data = {}) {
        try {
            if (typeof gtag !== 'function') return;
            gtag('event', `rl_${action}`.slice(0, 40), {
                event_category: 'ReturnLead_Civel',
                pagina: window.location.pathname,
                visitas_total: this.state.visitData?.count || 0,
                ...data
            });
        } catch { }
    }
};

// Migrado de DOMContentLoaded para civelReady (11/09/2026): mesmo motivo do
// civel-smart-cta.js — script injetado dinamicamente pode perder o evento
// DOMContentLoaded em conexoes lentas, e o widget de retorno (captura de lead)
// simplesmente nunca aparecia para o visitante recorrente, sem erro visivel.
window.civelReady(() => {
    setTimeout(() => window.ReturnLead.init(), 100);
});
