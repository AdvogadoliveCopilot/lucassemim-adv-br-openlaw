/* ==========================================================================
   MAGAZINE ELITE v2 — Motor do Radar Criminal (noticias.html)
   Semim & Associados Advocacia Criminal
   Consome dados/noticias.json.  Toda matéria ganha uma "capa editorial" desenhada
   (radar + ícone + data), então nenhuma card depende de foto — e nenhuma fica feia sem ela.
   Fotos externas (iStock/Unsplash) NÃO são mais carregadas na listagem.
   ========================================================================== */

window.MagazineElite = {

    config: {
        dataUrl: 'dados/noticias.json',
        pageSize: 12,
        heroCount: 3,
        cacheKey: 'semim_magazine_cache_v2',
        cacheTTL: 5 * 60 * 1000,
        // só usa foto se ela estiver hospedada no próprio site (caminho relativo ou lucassemim.adv.br)
        ownImagesOnly: true
    },

    state: { all: [], filtered: [], category: 'Todas', query: '', visible: 0 },

    // tema = família de cor da capa ; icon = FontAwesome 6 FREE (fa-siren é Pro e aparecia em branco)
    taxonomy: {
        'Flagrante & Plantão 24h':                   { icon: 'fa-handcuffs',            short: 'Flagrante',        tema: 'rubi' },
        'Habeas Corpus & Liberdade':                 { icon: 'fa-dove',                 short: 'Habeas Corpus',    tema: 'ouro' },
        'Execução Penal':                            { icon: 'fa-hourglass-half',       short: 'Execução Penal',   tema: 'ouro' },
        'Tráfico & Lei de Drogas':                   { icon: 'fa-capsules',             short: 'Lei de Drogas',    tema: 'musgo' },
        'Violência Doméstica':                       { icon: 'fa-house-crack',          short: 'Violência Doméstica', tema: 'rubi' },
        'Trânsito & Lei Seca':                       { icon: 'fa-car-burst',            short: 'Trânsito',         tema: 'rubi' },
        'Nulidades & Provas':                        { icon: 'fa-file-circle-xmark',    short: 'Nulidades',        tema: 'aco' },
        'Crimes Digitais & Golpes':                  { icon: 'fa-mobile-screen-button', short: 'Crimes Digitais',  tema: 'petroleo' },
        'STF & STJ — Teses':                         { icon: 'fa-landmark',             short: 'STF & STJ',        tema: 'aco' },
        'Indenização & Direito Civil':               { icon: 'fa-file-invoice-dollar',  short: 'Direito Civil',    tema: 'bronze' },
        'Direito Internacional & Política Criminal': { icon: 'fa-globe',                short: 'Internacional',    tema: 'ardosia' },
        'Bastidores da Advocacia':                   { icon: 'fa-gavel',                short: 'Bastidores',       tema: 'ameixa' },
        'Direito Penal — Geral':                     { icon: 'fa-scale-unbalanced',     short: 'Direito Penal',    tema: 'aco' }
    },

    monthAbbr: ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'],

    async init() {
        try {
            this.els = {
                hero: document.getElementById('hero-news-container'),
                pills: document.getElementById('category-pills'),
                grid: document.getElementById('news-grid-container'),
                loadMore: document.getElementById('btn-carregar-mais'),
                counter: document.getElementById('resultado-contador'),
                empty: document.getElementById('estado-vazio'),
                search: document.getElementById('busca-live-input'),
                searchBtn: document.getElementById('btn-busca-live'),
                sidebarCats: document.getElementById('sidebar-categorias'),
                total: document.querySelectorAll('[data-total-materias]')
            };

            const data = await this.loadData();
            if (!data || !data.length) throw new Error('Dataset vazio');

            this.state.all = data.slice().sort((a, b) => new Date(b.dataISO) - new Date(a.dataISO));
            this.state.filtered = this.state.all;
            this.state.visible = this.config.pageSize;

            // ?tema=Habeas%20Corpus%20%26%20Liberdade  ou  ?q=fianca
            const qs = new URLSearchParams(location.search);
            if (qs.get('tema')) this.state.category = qs.get('tema');
            if (qs.get('q')) { this.state.query = qs.get('q'); if (this.els.search) this.els.search.value = this.state.query; }

            this.els.total.forEach(n => { n.textContent = this.state.all.length; });
            this.renderHero();
            this.renderPills();
            this.renderSidebarCategories();
            this.applyFilters(true);
            this.injectSchema();
            this.bindEvents();
        } catch (err) {
            if (window.location.hostname !== 'lucassemim.adv.br') console.error('[MagazineElite]', err);
            this.renderFallbackError();
        }
    },

    async loadData() {
        try {
            const cached = sessionStorage.getItem(this.config.cacheKey);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Date.now() - parsed.ts < this.config.cacheTTL) return parsed.data;
            }
        } catch (e) { /* sem cache */ }
        const res = await fetch(this.config.dataUrl, { cache: 'no-store' });
        if (!res.ok) throw new Error('Falha ao carregar ' + this.config.dataUrl);
        const data = await res.json();
        try { sessionStorage.setItem(this.config.cacheKey, JSON.stringify({ ts: Date.now(), data })); } catch (e) { /* quota */ }
        return data;
    },

    normalize(str) {
        return (str || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    },

    sanitize(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML.replace(/"/g, '&quot;');
    },

    // título sem o "| Dr. Lucas Semim" que algumas matérias carregam
    cleanTitle(t) { return (t || '').split(' | ')[0].trim(); },

    formatDate(iso, evergreen) {
        if (evergreen || !iso) return { day: '', mon: 'GUIA', yr: 'ATEMPORAL', label: 'GUIA ATEMPORAL' };
        const d = new Date(iso);
        if (isNaN(d.getTime())) return { day: '', mon: 'GUIA', yr: 'ATEMPORAL', label: 'GUIA ATEMPORAL' };
        const day = String(d.getDate()).padStart(2, '0'), mon = this.monthAbbr[d.getMonth()], yr = String(d.getFullYear());
        return { day, mon, yr, label: day + ' ' + mon + ' ' + yr };
    },

    catInfo(c) { return this.taxonomy[c] || { icon: 'fa-scale-unbalanced', short: c, tema: 'aco' }; },

    hash(n) { n = Math.imul((n | 0) + 0x9e3779b9, 0x85ebca6b); n ^= n >>> 13; n = Math.imul(n, 0xc2b2ae35); return (n ^ (n >>> 16)) >>> 0; },

    ownImage(a) {
        if (!this.config.ownImagesOnly || !a.imagem) return a.imagem || '';
        try {
            const u = new URL(a.imagem, location.href);
            return (u.hostname === location.hostname || u.hostname === 'lucassemim.adv.br') ? a.imagem : '';
        } catch (e) { return ''; }
    },

    // ---------------------------------------------------------- CAPA EDITORIAL
    // Radar determinístico por matéria: cada capa tem varredura e "ecos" em posições diferentes.
    cover(a, big) {
        const cat = this.catInfo(a.categoria);
        const d = this.formatDate(a.dataISO, a.evergreen);
        const h = this.hash(a.id || a.titulo.length);
        const ang = h % 360;
        const cx = 232 + (h % 40) - 20, cy = 118 + ((h >>> 8) % 30) - 10;
        const rings = [34, 68, 102, 136].map(r => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(212,175,55,.2)" stroke-width="1"/>`).join('');
        const a0 = (ang - 38) * Math.PI / 180, a1 = ang * Math.PI / 180, R = 150;
        const sweep = `<path d="M${cx} ${cy} L${(cx + R * Math.cos(a0)).toFixed(1)} ${(cy + R * Math.sin(a0)).toFixed(1)} A${R} ${R} 0 0 1 ${(cx + R * Math.cos(a1)).toFixed(1)} ${(cy + R * Math.sin(a1)).toFixed(1)} Z" fill="url(#sw)" />`;
        const blips = [0, 1, 2].map(i => {
            const hh = this.hash(h + i * 7919), r = 24 + (hh % 100), t = ((hh >>> 9) % 360) * Math.PI / 180;
            return `<circle cx="${(cx + r * Math.cos(t)).toFixed(1)}" cy="${(cy + r * Math.sin(t)).toFixed(1)}" r="${i === 0 ? 3.2 : 2}" fill="#f1dd8f" fill-opacity="${i === 0 ? .95 : .55}"/>`;
        }).join('');
        const uid = 'sw' + (a.id || h);
        const svg = `<svg class="capa__svg" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
            <defs><linearGradient id="${uid}" gradientUnits="userSpaceOnUse" x1="${cx}" y1="${cy}" x2="${(cx + R * Math.cos(a0)).toFixed(0)}" y2="${(cy + R * Math.sin(a0)).toFixed(0)}"><stop offset="0" stop-color="#d4af37" stop-opacity=".34"/><stop offset="1" stop-color="#d4af37" stop-opacity="0"/></linearGradient></defs>
            ${rings}<line x1="${cx - 150}" y1="${cy}" x2="${cx + 150}" y2="${cy}" stroke="rgba(212,175,55,.12)"/><line x1="${cx}" y1="${cy - 150}" x2="${cx}" y2="${cy + 150}" stroke="rgba(212,175,55,.12)"/>
            ${sweep.replace('url(#sw)', 'url(#' + uid + ')')}${blips}</svg>`;
        const dateBlock = d.day
            ? `<span class="capa__dia">${d.day}</span><span class="capa__mes">${d.mon}<br>${d.yr}</span>`
            : `<span class="capa__dia capa__dia--inf"><i class="fas fa-infinity" aria-hidden="true"></i></span><span class="capa__mes">GUIA<br>ATEMPORAL</span>`;
        return `<div class="capa capa--${cat.tema}${big ? ' capa--big' : ''}">
            ${svg}
            <i class="fas ${cat.icon} capa__ico" aria-hidden="true" style="left:${(cx / 320 * 100).toFixed(1)}%;top:${(cy / 200 * 100).toFixed(1)}%"></i>
            <span class="capa__chip"><i class="fas ${cat.icon}" aria-hidden="true"></i> ${this.sanitize(cat.short)}</span>
            <span class="capa__data">${dateBlock}</span>
        </div>`;
    },

    media(a, big) {
        const src = this.ownImage(a);
        if (!src) return this.cover(a, big);
        // foto própria, quando existir — com a capa como reserva se ela falhar
        return `<div class="capa-wrap">${this.cover(a, big)}<img class="capa-foto" src="${this.sanitize(src)}" alt="" loading="lazy" onerror="this.remove()"></div>`;
    },

    // ---------------------------------------------------------------- HERO
    renderHero() {
        const destaques = this.state.all.filter(a => a.destaque).slice(0, this.config.heroCount);
        const picks = destaques.length ? destaques : this.state.all.slice(0, this.config.heroCount);
        if (!this.els.hero || !picks.length) return;
        const [lead, ...rest] = picks;
        const cat = this.catInfo(lead.categoria);
        this.els.hero.innerHTML = `
        <div class="hero-mag">
            <a class="hero-lead" href="${this.sanitize(lead.link)}">
                ${this.media(lead, true)}
                <div class="hero-lead__body">
                    <p class="kicker"><span>Em destaque</span> · ${this.sanitize(cat.short)}</p>
                    <h2>${this.sanitize(this.cleanTitle(lead.titulo))}</h2>
                    <p class="hero-lead__resumo">${this.sanitize(lead.resumo)}</p>
                    <span class="readmore">Ler a análise completa <i class="fas fa-arrow-right" aria-hidden="true"></i></span>
                </div>
            </a>
            <div class="hero-side">
                ${rest.map(a => this.sideCard(a)).join('')}
            </div>
        </div>`;
    },

    sideCard(a) {
        const cat = this.catInfo(a.categoria), d = this.formatDate(a.dataISO, a.evergreen);
        return `<a class="side-card" href="${this.sanitize(a.link)}">
            <div class="side-card__media">${this.media(a, false)}</div>
            <div class="side-card__body">
                <p class="kicker">${this.sanitize(cat.short)} · ${d.label}</p>
                <h3>${this.sanitize(this.cleanTitle(a.titulo))}</h3>
            </div></a>`;
    },

    // ------------------------------------------------------------- PILLS
    counts() { const c = {}; this.state.all.forEach(a => { c[a.categoria] = (c[a.categoria] || 0) + 1; }); return c; },

    renderPills() {
        if (!this.els.pills) return;
        const counts = this.counts();
        const cats = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
        const on = c => (this.state.category === c ? ' active' : '');
        this.els.pills.innerHTML = `<button class="pill${on('Todas')}" data-cat="Todas">Todas <span>${this.state.all.length}</span></button>` +
            cats.map(c => { const i = this.catInfo(c);
                return `<button class="pill${on(c)}" data-cat="${this.sanitize(c)}"><i class="fas ${i.icon}" aria-hidden="true"></i> ${this.sanitize(i.short)} <span>${counts[c]}</span></button>`; }).join('');
    },

    renderSidebarCategories() {
        if (!this.els.sidebarCats) return;
        const counts = this.counts();
        const cats = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
        this.els.sidebarCats.innerHTML = cats.map(c => { const i = this.catInfo(c);
            return `<li><a href="#" data-cat="${this.sanitize(c)}"><i class="fas ${i.icon}" aria-hidden="true"></i> ${this.sanitize(i.short)}</a><span>${counts[c]}</span></li>`; }).join('');
    },

    // -------------------------------------------------------------- GRID
    buildCard(a) {
        const cat = this.catInfo(a.categoria);
        return `<article class="news-card-col">
            <a class="news-card" href="${this.sanitize(a.link)}">
                ${this.media(a, false)}
                <div class="news-card__body">
                    <p class="kicker">${this.sanitize(cat.short)}</p>
                    <h3>${this.sanitize(this.cleanTitle(a.titulo))}</h3>
                    <p class="news-card__resumo">${this.sanitize(a.resumo)}</p>
                    <span class="readmore">Ler a análise <i class="fas fa-arrow-right" aria-hidden="true"></i></span>
                </div>
            </a></article>`;
    },

    renderGrid(reset) {
        if (reset) this.state.visible = this.config.pageSize;
        if (!this.els.grid) return;
        const total = this.state.filtered.length;
        this.els.grid.innerHTML = this.state.filtered.slice(0, this.state.visible).map(a => this.buildCard(a)).join('');
        if (this.els.empty) this.els.empty.style.display = total ? 'none' : 'block';
        if (this.els.counter) {
            const cat = this.state.category === 'Todas' ? '' : ' em ' + this.catInfo(this.state.category).short;
            this.els.counter.textContent = total ? `Mostrando ${Math.min(this.state.visible, total)} de ${total} matérias${cat}` : 'Nenhuma matéria encontrada para esse filtro.';
        }
        if (this.els.loadMore) this.els.loadMore.style.display = this.state.visible < total ? 'inline-flex' : 'none';
    },

    applyFilters(first) {
        const q = this.normalize(this.state.query);
        this.state.filtered = this.state.all.filter(a => {
            if (this.state.category !== 'Todas' && a.categoria !== this.state.category) return false;
            if (!q) return true;
            return this.normalize(a.titulo + ' ' + a.resumo + ' ' + a.categoria).includes(q);
        });
        this.renderGrid(true);
        if (!first && this.els.pills) this.els.pills.querySelectorAll('.pill').forEach(p => p.classList.toggle('active', p.dataset.cat === this.state.category));
    },

    bindEvents() {
        const goGrid = () => { const g = document.getElementById('lista'); if (g) g.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
        if (this.els.pills) this.els.pills.addEventListener('click', e => {
            const b = e.target.closest('.pill'); if (!b) return;
            this.state.category = b.dataset.cat; this.applyFilters(); goGrid(); this.trackEvent('filtro_categoria', this.state.category);
        });
        if (this.els.sidebarCats) this.els.sidebarCats.addEventListener('click', e => {
            const l = e.target.closest('a[data-cat]'); if (!l) return; e.preventDefault();
            this.state.category = l.dataset.cat; this.applyFilters(); goGrid(); this.trackEvent('filtro_categoria_sidebar', this.state.category);
        });
        let t;
        const run = () => { this.state.query = this.els.search ? this.els.search.value : ''; this.applyFilters(); this.trackEvent('busca_noticias', this.state.query); };
        if (this.els.search) {
            this.els.search.addEventListener('input', () => { clearTimeout(t); t = setTimeout(run, 250); });
            this.els.search.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); clearTimeout(t); run(); } });
        }
        if (this.els.searchBtn) this.els.searchBtn.addEventListener('click', run);
        if (this.els.loadMore) this.els.loadMore.addEventListener('click', () => { this.state.visible += this.config.pageSize; this.renderGrid(false); this.trackEvent('carregar_mais', String(this.state.visible)); });
    },

    // ------------------------------------------------------------- SCHEMA
    injectSchema() {
        try {
            const list = this.state.all.slice(0, 50).map((a, i) => ({ '@type': 'ListItem', position: i + 1, name: this.cleanTitle(a.titulo), url: 'https://lucassemim.adv.br/' + a.link }));
            const s = document.createElement('script');
            s.type = 'application/ld+json';
            s.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'ItemList', name: 'Radar Criminal — Notícias Jurídicas | Semim & Associados', itemListElement: list });
            document.head.appendChild(s);
        } catch (e) { /* acessório */ }
    },

    trackEvent(action, label) {
        try { if (typeof window.gtag === 'function') window.gtag('event', action, { event_category: 'Radar Criminal', event_label: label }); } catch (e) { /* não quebra */ }
    },

    renderFallbackError() {
        if (this.els && this.els.grid) {
            this.els.grid.innerHTML = `<div class="estado-erro"><i class="fas fa-triangle-exclamation" aria-hidden="true"></i><p>Não foi possível carregar as notícias agora. Atualize a página ou fale conosco pelo WhatsApp.</p></div>`;
        }
    }
};

document.addEventListener('DOMContentLoaded', () => window.MagazineElite.init());
