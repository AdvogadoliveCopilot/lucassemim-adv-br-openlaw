/* =========================================================== */
/* === FICHEIRO: js/arsenal.js (ArsenalFilter V3) ============ */
/* === FUNÇÃO: Filtro visual de categorias e busca textual === */
/* === DATA: 11/06/2026                                    === */
/* =========================================================== */

window.ArsenalFilter = {
    config: {
        filterContainerSel: '.filtro-arsenal',
        cardSelectors: [
            '#arsenal-de-peticoes .tesouro-card',
            '#arsenal-de-peticoes .card-artigo',
            '#arsenal-de-peticoes .peticao-item',
            '#arsenal-de-teses .tese-item',
            '.arsenal-card'
        ],
        containerIds: ['arsenal-de-peticoes', 'arsenal-de-teses'],
        storageKey: 'arsenal_last_filter',
        searchDebounceMs: 250,
        styleId: 'arsenal-filter-styles',
        isDebug: window.location.hostname !== 'lucassemim.adv.br'
    },

    state: {
        activeFilter: 'todos',
        searchQuery: '',
        reducedMotion: false,
        filterContainer: null,
        container: null,
        searchTimer: null
    },

    init() {
        this.state.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        this.state.filterContainer = document.querySelector(this.config.filterContainerSel);
        if (!this.state.filterContainer) return;

        this.state.container = this.getContainer();

        this.injectStyles();
        this.buildSearchInput();
        this.updateCounts();

        const lastFilter = this.loadState();
        this.applyFilter(lastFilter);

        this.state.filterContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-filtro]');
            if (!btn) return;
            const filtro = btn.getAttribute('data-filtro');
            this.saveState(filtro);
            this.applyFilter(filtro, this.state.searchQuery);
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const searchInput = document.querySelector('.arsenal-search-input');
                if (searchInput && document.activeElement === searchInput) {
                    searchInput.value = '';
                    this.applyFilter(this.state.activeFilter, '');
                }
            }
        });

        if (this.config.isDebug) {
            const cards = this.getCards();
            console.log(`[ArsenalFilter V3] ${cards.length} cards indexados.`);
        }
    },

    injectStyles() {
        if (document.getElementById(this.config.styleId)) return;
        const style = document.createElement('style');
        style.id = this.config.styleId;
        style.textContent = `
            /* === ArsenalFilter V3 === */
            .card-oculto {
                display: none !important;
            }
            .card-visivel {
                display: block;
            }
            .card-animando {
                animation: arsenalFadeIn 0.35s ease both;
            }
            @keyframes arsenalFadeIn {
                from { opacity: 0; transform: translateY(10px) scale(0.98); }
                to   { opacity: 1; transform: translateY(0)   scale(1);    }
            }
            @media (prefers-reduced-motion: reduce) {
                .card-animando { animation: none; }
                .card-visivel  { opacity: 1; transform: none; }
            }

            .arsenal-count {
                font-size: 0.72rem; margin-left: 6px;
                opacity: 0.65; font-family: 'Lato', sans-serif;
                font-weight: 400;
            }

            button.ativo .arsenal-count { opacity: 0.9; }

            .arsenal-search-wrapper {
                position: relative; margin-bottom: 20px;
            }
            .arsenal-search-icon {
                position: absolute; left: 14px; top: 50%;
                transform: translateY(-50%);
                color: #666; font-size: 0.9rem; pointer-events: none;
            }
            .arsenal-search-input {
                width: 100%; background: rgba(255,255,255,0.04);
                border: 1px solid rgba(212,175,55,0.2);
                border-radius: 6px; padding: 10px 14px 10px 38px;
                color: #ddd; font-family: 'Lato', sans-serif;
                font-size: 0.9rem; outline: none;
                transition: border-color 0.25s;
                box-sizing: border-box;
            }
            .arsenal-search-input:focus {
                border-color: rgba(212,175,55,0.5);
            }
            .arsenal-search-input::placeholder { color: #555; }

            .arsenal-empty-msg {
                grid-column: 1 / -1;
                text-align: center; padding: 60px 20px;
            }
            .arsenal-empty-icon {
                font-size: 3rem; margin-bottom: 12px; display: block;
            }
            .arsenal-empty-text {
                color: #777; font-family: 'Lato', sans-serif;
                font-size: 0.95rem; letter-spacing: 0.5px; margin-bottom: 6px;
            }
            .arsenal-empty-sub {
                color: #555; font-family: 'Lato', sans-serif;
                font-size: 0.82rem;
            }
        `;
        document.head.appendChild(style);
    },

    buildSearchInput() {
        const wrapper = document.getElementById('arsenal-search-wrapper');
        if (!wrapper) return;

        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'arsenal-search-wrapper';

        const icon = document.createElement('i');
        icon.className = 'fas fa-magnifying-glass arsenal-search-icon';
        icon.setAttribute('aria-hidden', 'true');

        const input = document.createElement('input');
        input.type = 'search';
        input.className = 'arsenal-search-input';
        input.placeholder = 'Buscar petição ou tese... (ex: habeas corpus, SEEU)';
        input.setAttribute('aria-label', 'Buscar no arsenal de petições e teses');
        input.setAttribute('autocomplete', 'off');

        input.addEventListener('input', () => {
            clearTimeout(this.state.searchTimer);
            this.state.searchTimer = setTimeout(() => {
                this.applyFilter(this.state.activeFilter, input.value.trim());
            }, this.config.searchDebounceMs);
        });

        inputWrapper.appendChild(icon);
        inputWrapper.appendChild(input);
        wrapper.appendChild(inputWrapper);
    },

    updateCounts() {
        const cards = this.getCards();
        const buttons = this.state.filterContainer?.querySelectorAll('button[data-filtro]');
        if (!buttons) return;

        buttons.forEach(btn => {
            const filtro = btn.getAttribute('data-filtro');
            const count = filtro === 'todos'
                ? cards.length
                : cards.filter(c => (c.getAttribute('data-categoria') || '').includes(filtro)).length;

            let badge = btn.querySelector('.arsenal-count');
            if (!badge) {
                badge = this.buildBadge(count);
                btn.appendChild(badge);
            } else {
                badge.textContent = `(${count})`;
            }
        });
    },

    buildBadge(count) {
        const badge = document.createElement('span');
        badge.className = 'arsenal-count';
        badge.textContent = `(${count})`;
        badge.setAttribute('aria-label', `${count} itens nesta categoria`);
        return badge;
    },

    getCards() {
        const sel = this.config.cardSelectors.join(', ');
        return [...document.querySelectorAll(sel)];
    },

    getContainer() {
        for (const id of this.config.containerIds) {
            const el = document.getElementById(id);
            if (el) return el;
        }
        return null;
    },

    applyFilter(filtro, query = '') {
        this.state.activeFilter = filtro;
        this.state.searchQuery = query;

        const cards = this.getCards();
        const container = this.state.container;
        const qNorm = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        let visiveis = 0;

        cards.forEach(card => {
            const cat = (card.getAttribute('data-categoria') || '').toLowerCase();
            const passaCategoria = filtro === 'todos' || cat.includes(filtro);

            let passaBusca = true;
            if (qNorm.length >= 2) {
                const cardText = (card.textContent || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                passaBusca = cardText.includes(qNorm);
            }

            if (passaCategoria && passaBusca) {
                this.showCard(card);
                visiveis++;
            } else {
                this.hideCard(card);
            }
        });

        this.updateActive(filtro);
        this.updateCounts();

        if (visiveis === 0 && container) {
            this.showEmptyMessage(container);
        } else {
            this.hideEmptyMessage();
        }

        this.trackEvent('arsenal_filter', `${filtro}${qNorm ? `_busca:${qNorm.slice(0, 20)}` : ''}`);
    },

    showCard(card) {
        if (card.classList.contains('card-oculto')) {
            card.classList.remove('card-oculto');
        }

        if (this.state.reducedMotion) {
            card.classList.add('card-visivel');
            return;
        }

        card.classList.remove('card-animando');
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                card.classList.add('card-visivel', 'card-animando');
            });
        });
    },

    hideCard(card) {
        card.classList.remove('card-visivel', 'card-animando');
        card.classList.add('card-oculto');
    },

    updateActive(filtro) {
        const buttons = this.state.filterContainer?.querySelectorAll('button[data-filtro]');
        if (!buttons) return;
        buttons.forEach(btn => {
            btn.classList.toggle('ativo', btn.getAttribute('data-filtro') === filtro);
        });
    },

    buildEmptyMessage() {
        const div = document.createElement('div');
        div.id = 'arsenal-empty-msg';
        div.className = 'arsenal-empty-msg';
        div.setAttribute('role', 'status');
        div.setAttribute('aria-live', 'polite');

        const icon = document.createElement('div');
        icon.className = 'arsenal-empty-icon';
        icon.textContent = '📂';
        icon.setAttribute('aria-hidden', 'true');

        const text = document.createElement('p');
        text.className = 'arsenal-empty-text';
        text.textContent = '// Nenhum arquivo encontrado nesta categoria.';

        const sub = document.createElement('p');
        sub.className = 'arsenal-empty-sub';
        sub.textContent = 'Tente outra categoria ou limpe a busca.';

        div.appendChild(icon);
        div.appendChild(text);
        div.appendChild(sub);
        return div;
    },

    showEmptyMessage(container) {
        let msg = document.getElementById('arsenal-empty-msg');
        if (!msg) {
            msg = this.buildEmptyMessage();
            container.appendChild(msg);
        }
        msg.style.display = 'block';
    },

    hideEmptyMessage() {
        const msg = document.getElementById('arsenal-empty-msg');
        if (msg) msg.style.display = 'none';
    },

    syncHash(filtro) {
        try {
            const newHash = filtro === 'todos' ? '' : `#filtro-${filtro}`;
            if (history.replaceState) {
                history.replaceState(null, '', newHash || window.location.pathname + window.location.search);
            }
        } catch { }
    },

    loadState() {
        const hash = window.location.hash;
        if (hash && hash.startsWith('#filtro-')) {
            return hash.replace('#filtro-', '');
        }
        try {
            return sessionStorage.getItem(this.config.storageKey) || 'todos';
        } catch {
            return 'todos';
        }
    },

    saveState(filtro) {
        try {
            sessionStorage.setItem(this.config.storageKey, filtro);
        } catch { }
        this.syncHash(filtro);
    },

    trackEvent(action, label) {
        try {
            if (typeof gtag !== 'function') return;
            gtag('event', action, {
                event_category: 'ArsenalFilter',
                event_label: label,
                pagina_origem: window.location.pathname
            });
        } catch { }
    }
};

document.addEventListener('DOMContentLoaded', () => window.ArsenalFilter.init());