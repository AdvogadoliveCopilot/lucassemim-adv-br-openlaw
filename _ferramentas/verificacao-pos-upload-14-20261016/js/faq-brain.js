/* =========================================================== */
/* === FICHEIRO: js/faq-brain.js (FaqBrain V3) =============== */
/* === FUNÇÃO: Acordeão Acessível & Schema FAQPage =========== */
/* === DATA: 11/06/2026                                    === */
/* =========================================================== */

window.FaqBrain = {
    config: {
        containerId: 'sidebar-faq-container',
        schemaId: 'faqpage-dynamic-brain'
    },

    state: {
        items: [],
        panels: [],
        buttons: []
    },

    init() {
        try {
            if (typeof window.pageFAQ === 'undefined' || !Array.isArray(window.pageFAQ) || window.pageFAQ.length === 0) {
                return;
            }

            const container = document.getElementById(this.config.containerId);
            if (!container) return;

            this.state.items = window.pageFAQ;
            
            this.buildStyles();
            this.buildWidget(container);
            this.initKeyboardNav(container);
            this.injectSchema();

            if (window.location.hostname !== 'lucassemim.adv.br') {
                console.log(`🧠 [FaqBrain V3] Inicializado com ${this.state.items.length} perguntas.`);
            }
        } catch (error) {
            if (window.location.hostname !== 'lucassemim.adv.br') console.error('Erro no FaqBrain V3:', error);
        }
    },

    buildStyles() {
        if (document.getElementById('faq-brain-styles')) return;

        const style = document.createElement('style');
        style.id = 'faq-brain-styles';
        style.textContent = `
            /* === FaqBrain V3 === */
            .faq-elite-wrapper {
                background: rgba(10, 10, 12, 0.85);
                backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
                border: 1px solid rgba(212, 175, 55, 0.2);
                border-top: 3px solid #d4af37;
                border-radius: 8px;
                padding: 20px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                margin-bottom: 30px;
            }
            .faq-title-elite {
                font-family: 'Teko', sans-serif; color: #fff;
                font-size: 1.8rem; letter-spacing: 1px;
                margin-bottom: 20px;
                display: flex; align-items: center; gap: 10px;
            }
            .faq-title-elite i { color: #d4af37; }
            .accordion-item-elite {
                border-bottom: 1px solid rgba(255,255,255,0.05);
            }
            .accordion-item-elite:last-child { border-bottom: none; }
            
            .accordion-button-elite {
                width: 100%; background: none; border: none;
                color: #e1e1e6; padding: 16px 0;
                display: flex; justify-content: space-between; align-items: center;
                font-family: 'Lato', sans-serif; font-size: 1.05rem; font-weight: 700;
                text-align: left; cursor: pointer; transition: color 0.3s;
                -webkit-tap-highlight-color: transparent;
            }
            .accordion-button-elite:hover { color: #d4af37; }
            .accordion-button-elite:focus-visible { outline: none; }
            .accordion-button-elite:focus-visible span {
                outline: 2px dashed #d4af37; outline-offset: 4px; border-radius: 2px;
            }
            
            .accordion-icon {
                transition: transform 0.4s ease; color: #d4af37;
                font-size: 0.9rem; flex-shrink: 0; margin-left: 15px;
            }
            
            .accordion-button-elite[aria-expanded="true"] { color: #d4af37; }
            .accordion-button-elite[aria-expanded="true"] .accordion-icon { transform: rotate(180deg); }
            
            .accordion-panel-elite {
                max-height: 0; overflow: hidden;
                transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                visibility: hidden;
            }
            .accordion-panel-elite.active { visibility: visible; }
            
            .accordion-body-elite {
                padding: 0 0 16px 0; color: #aaa;
                font-family: 'Lato', sans-serif; font-size: 0.95rem; line-height: 1.6;
            }
            .accordion-body-elite a { color: #d4af37; text-decoration: underline; transition: 0.2s; }
            .accordion-body-elite a:hover { color: #fff; }
        `;
        document.head.appendChild(style);
    },

    buildWidget(container) {
        container.innerHTML = ''; // Limpa o conteúdo original do HTML

        const wrapper = document.createElement('div');
        wrapper.className = 'faq-elite-wrapper';

        const header = document.createElement('h4');
        header.className = 'faq-title-elite';
        
        const icon = document.createElement('i');
        icon.className = 'fas fa-question-circle';
        icon.setAttribute('aria-hidden', 'true');
        
        header.appendChild(icon);
        header.appendChild(document.createTextNode(' DÚVIDAS FREQUENTES'));
        wrapper.appendChild(header);

        this.state.items.forEach((item, index) => {
            const domItem = this.buildItem(item, index);
            wrapper.appendChild(domItem);
        });

        container.appendChild(wrapper);
    },

    buildItem(itemData, index) {
        const div = document.createElement('div');
        div.className = 'accordion-item-elite';

        const btn = this.buildButton(itemData.p, index);
        const panel = this.buildPanel(itemData.r, index);

        div.appendChild(btn);
        div.appendChild(panel);

        // Lógica de Toggle com evento seguro
        btn.addEventListener('click', () => this.togglePanel(index));

        return div;
    },

    buildButton(questionText, index) {
        const btn = document.createElement('button');
        btn.className = 'accordion-button-elite';
        btn.id = `faq-btn-${index}`;
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-controls', `faq-panel-${index}`);

        const span = document.createElement('span');
        span.textContent = questionText; // Texto puro - Segurança contra XSS

        const icon = document.createElement('i');
        icon.className = 'fas fa-chevron-down accordion-icon';
        icon.setAttribute('aria-hidden', 'true');

        btn.appendChild(span);
        btn.appendChild(icon);

        this.state.buttons.push(btn);
        return btn;
    },

    buildPanel(answerHTML, index) {
        const panel = document.createElement('div');
        panel.className = 'accordion-panel-elite';
        panel.id = `faq-panel-${index}`;
        panel.setAttribute('aria-hidden', 'true');
        panel.setAttribute('role', 'region');
        panel.setAttribute('aria-labelledby', `faq-btn-${index}`);

        const body = document.createElement('div');
        body.className = 'accordion-body-elite';
        
        // NOTA DE SEGURANÇA: innerHTML é permitido aqui exclusivamente porque
        // window.pageFAQ é hardcoded pelo desenvolvedor no próprio arquivo HTML da página,
        // não recebendo inputs do usuário ou parâmetros de URL.
        body.innerHTML = answerHTML;

        panel.appendChild(body);
        this.state.panels.push(panel);
        
        return panel;
    },

    togglePanel(index) {
        const btn = this.state.buttons[index];
        const panel = this.state.panels[index];
        const isExpanded = btn.getAttribute('aria-expanded') === 'true';

        if (isExpanded) {
            // Fecha o painel atual
            btn.setAttribute('aria-expanded', 'false');
            panel.style.maxHeight = '0px';
            
            panel.addEventListener('transitionend', function handler() {
                panel.classList.remove('active');
                panel.setAttribute('aria-hidden', 'true');
                panel.removeEventListener('transitionend', handler);
            }, { once: true });

        } else {
            // Fecha todos os outros antes de abrir
            this.closeAll(index);

            // Abre o painel atual
            btn.setAttribute('aria-expanded', 'true');
            panel.classList.add('active');
            panel.setAttribute('aria-hidden', 'false');
            panel.style.maxHeight = panel.scrollHeight + 'px';
            
            this.trackEvent('faq_click', btn.textContent.trim());
        }
    },

    closeAll(exceptIndex) {
        this.state.buttons.forEach((btn, i) => {
            if (i !== exceptIndex && btn.getAttribute('aria-expanded') === 'true') {
                const panel = this.state.panels[i];
                btn.setAttribute('aria-expanded', 'false');
                panel.style.maxHeight = '0px';
                
                panel.addEventListener('transitionend', function handler() {
                    panel.classList.remove('active');
                    panel.setAttribute('aria-hidden', 'true');
                    panel.removeEventListener('transitionend', handler);
                }, { once: true });
            }
        });
    },

    initKeyboardNav(container) {
        container.addEventListener('keydown', (e) => {
            const currentBtn = document.activeElement;
            const currentIndex = this.state.buttons.indexOf(currentBtn);
            
            if (currentIndex === -1) return;

            let targetIndex = null;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    targetIndex = (currentIndex + 1) % this.state.buttons.length;
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    targetIndex = (currentIndex - 1 + this.state.buttons.length) % this.state.buttons.length;
                    break;
                case 'Home':
                    e.preventDefault();
                    targetIndex = 0;
                    break;
                case 'End':
                    e.preventDefault();
                    targetIndex = this.state.buttons.length - 1;
                    break;
                case 'Escape':
                    e.preventDefault();
                    if (currentBtn.getAttribute('aria-expanded') === 'true') {
                        this.togglePanel(currentIndex);
                        currentBtn.focus();
                    }
                    break;
            }

            if (targetIndex !== null) {
                this.state.buttons[targetIndex].focus();
            }
        });
    },

    injectSchema() {
        window._schemaRegistry = window._schemaRegistry || new Set();
        
        // Verifica se o ai-neural-seo já injetou um FAQ dinâmico nesta página
        const hasExistingFaqSchema = [...window._schemaRegistry].some(id => id.startsWith('faqpage-')) || 
                                     document.querySelector('script[data-schema-id^="faqpage-"]');
        
        if (hasExistingFaqSchema) return;

        const mainEntity = this.state.items.map(item => {
            // Strip tags HTML da resposta para o formato JSON-LD puro
            const cleanAnswer = item.r.replace(/<[^>]+>/g, '');
            return {
                "@type": "Question",
                "name": item.p,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": cleanAnswer
                }
            };
        });

        const schemaObj = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "@id": `https://lucassemim.adv.br${window.location.pathname}#faq`,
            "mainEntity": mainEntity
        };

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-schema-id', this.config.schemaId);
        script.setAttribute('data-source', 'faq-brain');
        script.textContent = JSON.stringify(schemaObj, null, 0);
        
        document.head.appendChild(script);
        window._schemaRegistry.add(this.config.schemaId);
    },

    trackEvent(action, label) {
        try {
            if (typeof gtag !== 'function') return;
            gtag('event', action, {
                event_category: 'FAQ_Elite',
                pergunta: label.substring(0, 100),
                pagina_origem: window.location.pathname
            });
        } catch { }
    }
};

document.addEventListener('DOMContentLoaded', () => window.FaqBrain.init());