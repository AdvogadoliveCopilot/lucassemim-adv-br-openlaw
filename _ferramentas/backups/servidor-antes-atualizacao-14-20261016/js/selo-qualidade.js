/* =========================================================== */
/* === FICHEIRO: js/selo-qualidade.js (SeloQualidade V3) ===== */
/* === FUNÇÃO: Selo de Auditoria e Canal de Qualidade ======== */
/* === DATA: 11/06/2026                                    === */
/* =========================================================== */

window.SeloQualidade = {
    config: {
        whatsapp: '5531989420094',
        waBase: 'https://wa.me/',
        articleSelector: '.article-content',
        seloId: 'box-integridade-elite',
        dialogId: 'modal-report-elite',
        tiposReport: [
            { value: 'Erro na Lei ou Súmula', label: 'A lei citada mudou / está errada' },
            { value: 'Texto Impreciso', label: 'O texto está confuso / impreciso' },
            { value: 'Sugestão de Melhoria', label: 'Tenho uma sugestão de melhoria' },
            { value: 'Link Quebrado ou Erro Técnico', label: 'Problema no site (link / erro técnico)' },
            { value: 'Outro', label: 'Outro motivo' }
        ]
    },

    state: {
        dialogEl: null,
        txtareaEl: null,
        nomeEl: null,
        tipoEl: null,
        errorEl: null,
        triggerBtn: null,
        isOpen: false,
        trapFocusRef: null
    },

    init() {
        try {
            const target = document.querySelector(this.config.articleSelector);
            if (!target) return;
            if (document.getElementById(this.config.seloId)) return;

            this.injectStyles();
            this.buildSelo(target);
            this.buildModal();

            if (location.hostname !== 'lucassemim.adv.br') {
                console.log('[SeloQualidade V3] Seal injetado em:', this.config.articleSelector);
            }
        } catch (error) {
            if (location.hostname !== 'lucassemim.adv.br') console.error('Erro no SeloQualidade V3:', error);
        }
    },

    injectStyles() {
        if (document.getElementById('selo-qualidade-styles')) return;
        const style = document.createElement('style');
        style.id = 'selo-qualidade-styles';
        style.textContent = `
            /* === SeloQualidade V3 === */
            .quality-seal-box {
                background: linear-gradient(145deg, #111112 0%, #050505 100%);
                border: 1px solid rgba(212,175,55,0.15);
                border-left: 4px solid #d4af37;
                border-radius: 8px; padding: 30px; margin: 50px 0;
                display: flex; align-items: flex-start; gap: 25px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.6);
                transition: border-color 0.4s, box-shadow 0.4s, transform 0.3s;
            }
            .quality-seal-box:hover {
                border-color: rgba(212,175,55,0.4);
                box-shadow: 0 10px 40px rgba(212,175,55,0.08);
                transform: translateY(-2px);
            }
            @media (prefers-reduced-motion: reduce) {
                .quality-seal-box { transition: none; }
                .quality-seal-box:hover { transform: none; }
            }
            .seal-icon { font-size: 2.5rem; color: #d4af37; text-shadow: 0 0 15px rgba(212,175,55,0.3); margin-top: 5px; flex-shrink: 0; }
            .seal-title { font-family: 'Teko', sans-serif; color: #fff; margin: 0 0 10px; font-size: 1.8rem; text-transform: uppercase; letter-spacing: 1px; line-height: 1; }
            .seal-desc { color: #a0a0a0; font-size: 1.05rem; margin-bottom: 20px; line-height: 1.6; font-family: 'Lato', sans-serif; }
            .btn-report {
                background: transparent; border: 1px solid #555; color: #ccc;
                font-family: 'Teko', sans-serif; font-size: 1.1rem; letter-spacing: 1px;
                padding: 6px 20px; border-radius: 50px; cursor: pointer;
                transition: background 0.3s, border-color 0.3s, color 0.3s;
                display: inline-flex; align-items: center; gap: 8px;
            }
            .btn-report:hover, .btn-report:focus-visible { background: rgba(212,175,55,0.1); border-color: #d4af37; color: #d4af37; }
            .btn-report:focus-visible { outline: 2px solid #d4af37; outline-offset: 3px; }

            .quality-modal {
                background: #111112;
                padding: 40px; border-radius: 12px;
                width: min(90vw, 500px);
                border: 1px solid rgba(212,175,55,0.3);
                border-top: 4px solid #d4af37;
                box-shadow: 0 20px 50px rgba(0,0,0,0.8);
                opacity: 0; transform: scale(0.94);
                transition: opacity 0.3s ease, transform 0.3s ease;
            }
            .quality-modal.open {
                opacity: 1; transform: scale(1);
            }
            @media (prefers-reduced-motion: reduce) {
                .quality-modal { transition: none; opacity: 1; transform: none; }
            }
            .quality-modal::backdrop {
                background: rgba(0,0,0,0.85);
                backdrop-filter: blur(5px);
                -webkit-backdrop-filter: blur(5px);
            }
            .modal-canal-title {
                font-family: 'Teko', sans-serif; color: #d4af37;
                font-size: 1.8rem; text-transform: uppercase; letter-spacing: 1px;
                text-align: center; margin: 0 0 5px;
            }
            .modal-canal-sub {
                color: #888; text-align: center; font-size: 0.9rem;
                margin-bottom: 20px; font-family: 'Lato', sans-serif;
            }
            .btn-close-modal {
                position: absolute; top: 15px; right: 20px;
                background: none; border: none; color: #888;
                font-size: 1.8rem; cursor: pointer; transition: color 0.2s; line-height: 1;
            }
            .btn-close-modal:hover { color: #ff4444; }
            .btn-close-modal:focus-visible { outline: 2px solid #d4af37; border-radius: 4px; }

            .q-field-wrapper { margin-top: 15px; }
            .q-label { color: #ccc; display: block; margin-bottom: 5px; font-size: 0.9rem; font-family: 'Lato', sans-serif; }
            .q-input, .q-select, .q-textarea {
                width: 100%; background: rgba(255,255,255,0.03);
                border: 1px solid #333; color: #fff;
                padding: 12px 15px; border-radius: 6px;
                font-family: 'Lato', sans-serif; font-size: 0.95rem;
                transition: border-color 0.3s, background 0.3s; box-sizing: border-box;
            }
            .q-input:focus, .q-select:focus, .q-textarea:focus {
                outline: none; border-color: #d4af37; background: rgba(212,175,55,0.05);
            }
            .q-select { cursor: pointer; }
            .q-textarea { resize: vertical; min-height: 80px; }
            .q-select option { background: #111; color: #fff; }

            .report-error-msg {
                background: rgba(220, 38, 38, 0.1);
                border: 1px solid rgba(220, 38, 38, 0.4);
                border-left: 3px solid #dc2626;
                color: #fca5a5; font-family: 'Lato', sans-serif;
                font-size: 0.88rem; padding: 10px 14px;
                border-radius: 6px; margin-top: 12px;
            }

            .btn-submit-q {
                width: 100%;
                background: linear-gradient(45deg, #b8860b, #d4af37);
                color: #000; border: none; padding: 12px;
                border-radius: 6px; font-family: 'Teko', sans-serif;
                font-size: 1.4rem; letter-spacing: 1px;
                cursor: pointer; margin-top: 20px;
                display: flex; align-items: center; justify-content: center; gap: 10px;
                transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
            }
            .btn-submit-q:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(212,175,55,0.4);
                background: #fff;
            }
            .btn-submit-q:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }

            @media (max-width: 768px) {
                .quality-seal-box { flex-direction: column; gap: 15px; padding: 25px 20px; text-align: center; align-items: center; }
                .seal-title { font-size: 1.5rem; }
                .quality-modal { padding: 30px 20px; }
            }

            .seal-ai-note {
                display: inline-flex; align-items: center; gap: 6px;
                color: #666; font-size: 0.78rem; font-family: 'Lato', sans-serif;
                margin-top: 14px; letter-spacing: 0.3px;
            }
            .seal-ai-note i { color: #555; font-size: 0.85rem; }
            @media (max-width: 768px) { .seal-ai-note { justify-content: center; } }
        `;
        document.head.appendChild(style);
    },

    buildSelo(target) {
        const box = document.createElement('div');
        box.id = this.config.seloId;
        box.className = 'quality-seal-box';

        const iconDiv = document.createElement('div');
        iconDiv.className = 'seal-icon';
        iconDiv.setAttribute('aria-hidden', 'true');
        const icon = document.createElement('i');
        icon.className = 'fas fa-scale-balanced';
        iconDiv.appendChild(icon);

        const content = document.createElement('div');
        content.className = 'seal-content';

        const title = document.createElement('h4');
        title.className = 'seal-title';
        title.textContent = 'Compromisso com a Verdade Jurídica';

        const desc = document.createElement('p');
        desc.className = 'seal-desc';
        
        const text1 = document.createTextNode('Este artigo foi elaborado com rigor técnico, fundamentado nas pautas atuais do ');
        const strong = document.createElement('strong');
        strong.textContent = 'Judiciário, Legislativo e Súmulas dos Tribunais Superiores (STF/STJ)';
        const text2 = document.createTextNode('. Nosso objetivo é traduzir o "juridiquês" para a clareza que você merece.');
        
        desc.appendChild(text1);
        desc.appendChild(strong);
        desc.appendChild(text2);

        const aiNote = document.createElement('span');
        aiNote.className = 'seal-ai-note';
        const aiIcon = document.createElement('i');
        aiIcon.className = 'fas fa-microchip';
        aiIcon.setAttribute('aria-hidden', 'true');
        aiNote.appendChild(aiIcon);
        aiNote.appendChild(document.createTextNode('Conteúdo revisado por Inteligência Artificial (Claude) sob curadoria jurídica do Dr. Lucas Semim, OAB/MG 222.539'));

        const reportBtn = document.createElement('button');
        reportBtn.type = 'button';
        reportBtn.className = 'btn-report';
        reportBtn.setAttribute('aria-haspopup', 'dialog');
        reportBtn.setAttribute('aria-controls', this.config.dialogId);

        const flagIcon = document.createElement('i');
        flagIcon.className = 'fas fa-flag';
        flagIcon.setAttribute('aria-hidden', 'true');
        reportBtn.appendChild(flagIcon);
        reportBtn.appendChild(document.createTextNode(' REPORTAR IMPRECISÃO OU ERRO'));

        reportBtn.addEventListener('click', () => {
            this.state.triggerBtn = reportBtn;
            this.openModal();
            this.trackEvent('report_modal_open', document.title);
        });

        content.appendChild(title);
        content.appendChild(desc);
        content.appendChild(aiNote);
        content.appendChild(reportBtn);

        box.appendChild(iconDiv);
        box.appendChild(content);
        target.appendChild(box);

        this.trackEvent('selo_view', window.location.pathname);
    },

    buildModal() {
        const dialog = document.createElement('dialog');
        dialog.id = this.config.dialogId;
        dialog.className = 'quality-modal';
        dialog.setAttribute('aria-labelledby', 'modal-canal-title');

        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) this.closeModal();
        });

        dialog.addEventListener('cancel', (e) => {
            e.preventDefault();
            this.closeModal();
        });

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'btn-close-modal';
        closeBtn.setAttribute('aria-label', 'Fechar modal de reporte');
        closeBtn.textContent = '×';
        closeBtn.addEventListener('click', () => this.closeModal());

        const modalTitle = document.createElement('h4');
        modalTitle.id = 'modal-canal-title';
        modalTitle.className = 'modal-canal-title';
        modalTitle.textContent = 'CANAL DE QUALIDADE';

        const modalSub = document.createElement('p');
        modalSub.className = 'modal-canal-sub';
        modalSub.textContent = 'Sua observação será analisada por nossa equipe jurídica.';

        const nomeField = this.buildField('report-nome', 'Seu Nome / Empresa:', 'text', 'Opcional', false, 'name');
        const tipoField = this.buildSelect('report-tipo', 'O que você encontrou?', this.config.tiposReport);
        const msgField = this.buildField('report-msg', 'Detalhes da Correção:', 'textarea', 'Explique brevemente onde está o erro ou a sugestão...', true, 'off');

        const errorDiv = document.createElement('div');
        errorDiv.className = 'report-error-msg';
        errorDiv.setAttribute('role', 'alert');
        errorDiv.setAttribute('aria-live', 'polite');
        errorDiv.style.display = 'none';
        this.state.errorEl = errorDiv;

        const submitBtn = document.createElement('button');
        submitBtn.type = 'button';
        submitBtn.className = 'btn-submit-q';
        const wppIcon = document.createElement('i');
        wppIcon.className = 'fab fa-whatsapp';
        wppIcon.setAttribute('aria-hidden', 'true');
        submitBtn.appendChild(document.createTextNode('ENVIAR PARA ANÁLISE '));
        submitBtn.appendChild(wppIcon);
        submitBtn.addEventListener('click', () => this.sendReport());

        dialog.appendChild(closeBtn);
        dialog.appendChild(modalTitle);
        dialog.appendChild(modalSub);
        dialog.appendChild(nomeField.wrapper);
        dialog.appendChild(tipoField.wrapper);
        dialog.appendChild(msgField.wrapper);
        dialog.appendChild(errorDiv);
        dialog.appendChild(submitBtn);

        document.body.appendChild(dialog);
        this.state.dialogEl = dialog;
        this.state.nomeEl = nomeField.input;
        this.state.tipoEl = tipoField.input;
        this.state.txtareaEl = msgField.input;

        return dialog;
    },

    buildField(id, label, type, placeholder, required, autocomplete) {
        const wrapper = document.createElement('div');
        wrapper.className = 'q-field-wrapper';

        const lbl = document.createElement('label');
        lbl.htmlFor = id;
        lbl.className = 'q-label';
        lbl.textContent = label;

        let input;
        if (type === 'textarea') {
            input = document.createElement('textarea');
            input.rows = 3;
            input.className = 'q-textarea';
        } else {
            input = document.createElement('input');
            input.type = type;
            input.className = 'q-input';
        }

        input.id = id;
        input.placeholder = placeholder;
        if (required) input.required = true;
        if (autocomplete) input.setAttribute('autocomplete', autocomplete);

        input.addEventListener('input', () => this.clearError());

        wrapper.appendChild(lbl);
        wrapper.appendChild(input);
        return { wrapper, input };
    },

    buildSelect(id, label, options) {
        const wrapper = document.createElement('div');
        wrapper.className = 'q-field-wrapper';

        const lbl = document.createElement('label');
        lbl.htmlFor = id;
        lbl.className = 'q-label';
        lbl.textContent = label;

        const select = document.createElement('select');
        select.id = id;
        select.className = 'q-select';

        options.forEach(({ value, label: optLabel }) => {
            const option = document.createElement('option');
            option.value = optLabel;
            option.textContent = optLabel;
            select.appendChild(option);
        });

        wrapper.appendChild(lbl);
        wrapper.appendChild(select);
        return { wrapper, input: select };
    },

    openModal() {
        if (this.state.isOpen) return;
        const dialog = this.state.dialogEl;
        if (!dialog) return;

        this.state.isOpen = true;
        dialog.showModal();

        requestAnimationFrame(() => {
            requestAnimationFrame(() => dialog.classList.add('open'));
        });

        this.state.trapFocusRef = (e) => this.trapFocus(e);
        dialog.addEventListener('keydown', this.state.trapFocusRef);

        setTimeout(() => {
            const firstFocusable = dialog.querySelector('button, input, select, textarea');
            if (firstFocusable) firstFocusable.focus();
        }, 50);
    },

    closeModal() {
        if (!this.state.isOpen) return;
        const dialog = this.state.dialogEl;

        dialog.classList.remove('open');

        dialog.addEventListener('transitionend', () => {
            dialog.close();
            this.state.isOpen = false;
            this.clearError();
            if (this.state.trapFocusRef) {
                dialog.removeEventListener('keydown', this.state.trapFocusRef);
                this.state.trapFocusRef = null;
            }
            if (this.state.triggerBtn) this.state.triggerBtn.focus();
        }, { once: true });
    },

    sendReport() {
        const msg = this.state.txtareaEl?.value.trim() || '';
        const nome = this.state.nomeEl?.value.trim() || '';
        const tipo = this.state.tipoEl?.value || 'Outro';

        if (!msg) {
            this.showError('Por favor, descreva a imprecisão ou sugestão antes de enviar.');
            this.state.txtareaEl?.focus();
            return;
        }

        const artigo = this.getArticleTitle();
        const link = window.location.href;

        const texto = `*🔍 CANAL DE AUDITORIA — LUCASSEMIM.ADV.BR*\n\n` +
            `*Artigo:* ${artigo}\n` +
            `*URL:* ${link}\n\n` +
            `*Leitor:* ${nome || 'Anônimo'}\n` +
            `*Classificação:* ${tipo}\n` +
            `*Descrição:* ${msg}\n\n` +
            `_Aguardando análise técnica da equipe._`;

        const url = `${this.config.waBase}${this.config.whatsapp}?text=${encodeURIComponent(texto)}`;

        this.openWhatsApp(url);

        if (this.state.nomeEl) this.state.nomeEl.value = '';
        if (this.state.txtareaEl) this.state.txtareaEl.value = '';
        if (this.state.tipoEl) this.state.tipoEl.selectedIndex = 0;

        this.trackEvent('report_sent', tipo);
        this.closeModal();
    },

    showError(msg) {
        if (!this.state.errorEl) return;
        this.state.errorEl.textContent = msg;
        this.state.errorEl.style.display = 'block';
    },

    clearError() {
        if (!this.state.errorEl) return;
        this.state.errorEl.style.display = 'none';
        this.state.errorEl.textContent = '';
    },

    getArticleTitle() {
        const title = document.title || '';
        return title.split('|')[0].split('–')[0].split('-')[0].trim() || 'Artigo sem título';
    },

    openWhatsApp(url) {
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    trapFocus(e) {
        if (e.key !== 'Tab') return;
        const dialog = this.state.dialogEl;
        const focusable = [...dialog.querySelectorAll(
            'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )];
        if (!focusable.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    },

    trackEvent(action, label) {
        try {
            if (typeof gtag !== 'function') return;
            gtag('event', action, {
                event_category: 'SeloQualidade',
                event_label: label.slice(0, 100),
                pagina_origem: window.location.pathname
            });
        } catch { }
    }
};

document.addEventListener('DOMContentLoaded', () => window.SeloQualidade.init());