/* =========================================================== */
/* === FICHEIRO: js/toc.js (TocElite V3) ===================== */
/* === FUNÇÃO: Índice Automático e Scroll Spy Inteligente === */
/* === DATA: 11/06/2026                                    === */
/* =========================================================== */

window.TocElite = {
  config: {
    containerId:    'indice-magico-container',
    contentSelectors: ['.artigo-conteudo', 'article', '.post-content', 'main'],
    headingSelectors: 'h2, h3',
    minHeadings:    2,
    scrollOffset:   120,
    styleId:        'toc-elite-styles',
    isDebug:        window.location.hostname !== 'lucassemim.adv.br'
  },

  state: {
    container:    null,
    contentArea:  null,
    headings:     [],
    links:        [],
    reducedMotion: false,
    observer:     null
  },

  init() {
    try {
      this.state.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.state.container = document.getElementById(this.config.containerId);
      this.state.contentArea = this.findContentArea();

      if (!this.state.container || !this.state.contentArea) {
        if (this.config.isDebug) console.warn('[TocElite] Container ou área de conteúdo não encontrada.');
        return;
      }

      const rawHeadings = this.state.contentArea.querySelectorAll(this.config.headingSelectors);
      this.state.headings = [...rawHeadings];

      if (this.state.headings.length < this.config.minHeadings) {
        this.state.container.style.display = 'none';
        return;
      }

      this.injectStyles();
      this.buildNav();
      this.initScrollSpy();

      this.state.container.style.display = 'block';

      if (this.config.isDebug) {
        console.log(`[TocElite V3] ${this.state.headings.length} headings indexados.`);
      }
    } catch (error) {
      if (this.config.isDebug) console.error('[TocElite] Erro na inicialização:', error);
    }
  },

  findContentArea() {
    for (const sel of this.config.contentSelectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  },

  injectStyles() {
    if (document.getElementById(this.config.styleId)) return;
    const style = document.createElement('style');
    style.id = this.config.styleId;
    style.textContent = `
      .toc-box {
        background: rgba(20,20,20,0.6);
        backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
        border-left: 3px solid #d4af37;
        padding: 20px; margin-bottom: 40px;
        border-radius: 0 10px 10px 0;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      }
      #${this.config.containerId} .toc-box {
        opacity: 1; transform: none; visibility: visible;
      }
      .toc-title {
        font-family: 'Teko', sans-serif; color: #d4af37;
        font-size: 1.6rem; margin-bottom: 15px;
        text-transform: uppercase; letter-spacing: 1px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
        padding-bottom: 5px;
        display: flex; align-items: center; gap: 8px;
      }
      .toc-list { list-style: none; padding: 0; margin: 0; }
      .toc-item { margin-bottom: 8px; }
      .toc-link {
        text-decoration: none; color: #aaa;
        font-family: 'Lato', sans-serif;
        font-size: 0.85rem;
        transition: color 0.2s, padding-left 0.2s, border-color 0.2s;
        display: block; padding-left: 10px;
        border-left: 2px solid transparent;
        line-height: 1.4;
      }
      .toc-link:hover, .toc-link.active {
        color: #fff;
        padding-left: 15px;
        border-left-color: #d4af37;
        background: linear-gradient(90deg, rgba(212,175,55,0.06), transparent);
      }
      .toc-link:focus-visible { outline: 2px solid #d4af37; outline-offset: 2px; border-radius: 2px; }
      .toc-indent { margin-left: 15px; font-size: 0.8rem; color: #888; }
      .toc-indent.active { color: #ccc; }
      @media (prefers-reduced-motion: reduce) {
        .toc-link { transition: none; }
      }
    `;
    document.head.appendChild(style);
  },

  buildNav() {
    const nav = document.createElement('nav');
    nav.className = 'toc-box';
    nav.setAttribute('aria-label', 'Índice do artigo');

    const titleDiv = document.createElement('div');
    titleDiv.className = 'toc-title';
    titleDiv.setAttribute('aria-hidden', 'true');

    const icon = document.createElement('i');
    icon.className = 'fas fa-list-ul';
    icon.setAttribute('aria-hidden', 'true');

    titleDiv.appendChild(icon);
    titleDiv.appendChild(document.createTextNode(' NAVEGAÇÃO TÁTICA'));

    const ul = document.createElement('ul');
    ul.className = 'toc-list';
    ul.setAttribute('role', 'list');

    this.state.headings.forEach((heading, index) => {
      ul.appendChild(this.buildItem(heading, index));
    });

    nav.appendChild(titleDiv);
    nav.appendChild(ul);
    this.state.container.appendChild(nav);
  },

  buildItem(heading, index) {
    const isH3 = heading.tagName === 'H3';

    if (!heading.id) {
      const slug = this.slugify(heading.textContent);
      heading.id = slug || `topico-${index}`;
    } else {
      heading.id = this.sanitizeId(heading.id);
    }

    const li = document.createElement('li');
    li.className = 'toc-item';

    const a = document.createElement('a');
    a.href = `#${heading.id}`;
    a.className = `toc-link${isH3 ? ' toc-indent' : ''}`;
    a.setAttribute('data-target', heading.id);
    a.setAttribute('aria-label', `Ir para seção: ${heading.textContent.trim()}`);
    a.textContent = heading.textContent.trim();

    a.addEventListener('click', (e) => {
      e.preventDefault();
      this.scrollToHeading(heading.id);
      this.trackEvent(heading.textContent.trim());
    });

    this.state.links.push(a);
    li.appendChild(a);
    return li;
  },

  slugify(text) {
    return text.trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60);
  },

  sanitizeId(rawId) {
    return rawId.replace(/[^a-zA-Z0-9_-]/g, '-');
  },

  scrollToHeading(id) {
    const target = document.getElementById(id);
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const destY = rect.top + window.scrollY - this.config.scrollOffset;
    const smooth = !this.state.reducedMotion;

    window.scrollTo({ top: destY, behavior: smooth ? 'smooth' : 'auto' });
  },

  initScrollSpy() {
    const options = {
      root: null,
      rootMargin: `-${this.config.scrollOffset}px 0px -40% 0px`,
      threshold: 0
    };

    this.state.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        entry.target.setAttribute('data-toc-visible', entry.isIntersecting ? '1' : '0');
      });

      const offset = this.config.scrollOffset;
      let best = null;
      let bestDist = Infinity;

      this.state.headings.forEach(h => {
        const rect = h.getBoundingClientRect();
        const dist = Math.abs(rect.top - offset);
        if (dist < bestDist) {
          bestDist = dist;
          best = h;
        }
      });

      if (best) this.updateActive(best.id);
    }, options);

    this.state.headings.forEach(h => this.state.observer.observe(h));
  },

  updateActive(topmostId) {
    this.state.links.forEach(link => {
      const isActive = link.getAttribute('data-target') === topmostId;
      link.classList.toggle('active', isActive);

      if (isActive) {
        link.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });
  },

  trackEvent(headingText) {
    try {
      if (typeof gtag !== 'function') return;
      gtag('event', 'toc_click', {
        event_category: 'TOC_Navigation',
        event_label: headingText.slice(0, 100),
        pagina_origem: window.location.pathname
      });
    } catch { }
  }
};

document.addEventListener('DOMContentLoaded', () => window.TocElite.init());