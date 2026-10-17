/* =========================================================== */
/* === FICHEIRO: js/news-engine.js (NewsEngine V3) =========== */
/* === FUNÇÃO: Motor de Notícias (JSON/RSS) com Anti-XSS ======*/
/* === DATA: 11/06/2026                                    === */
/* =========================================================== */

window.NewsEngine = {
  config: {
    sources: [
      { type: 'json', url: 'dados/noticias.json', name: 'Semim Advocacia', priority: 1 },
      // Link RSS do STJ atualizado após verificação de disponibilidade em 2026
      { type: 'rss',  url: 'https://res.stj.jus.br/hrestp-c-portalp/RSS.xml', name: 'STJ', priority: 2 },
      { type: 'rss',  url: 'https://portal.stf.jus.br/noticias/rss.asp', name: 'STF', priority: 3 },
      { type: 'rss',  url: 'https://www.tjmg.jus.br/rss/noticias.rss',  name: 'TJMG', priority: 4 }
    ],
    heroContainerId: 'hero-news-container',
    gridContainerId: 'news-grid-container',
    cacheKey:        'semim_news_cache',
    cacheTtlMs:      5 * 60 * 1000,      // 5 minutos
    allOriginsProxy: 'https://api.allorigins.win/get?url=',
    maxItems:        20,
    skeletonCount:   4,
    fallbackImg:     'img/news-fallback.jpg',
    styleId:         'news-engine-styles',
    isDebug:         window.location.hostname !== 'lucassemim.adv.br'
  },

  state: {
    allNews:  [],
    loaded:   false,
    observer: null
  },

  async init() {
    const heroContainer = document.getElementById(this.config.heroContainerId);
    const gridContainer = document.getElementById(this.config.gridContainerId);
    if (!heroContainer && !gridContainer) return;

    this.injectStyles();

    // Mostrar skeletons imediatamente para manter layout
    this.buildSkeletons(this.config.skeletonCount);

    try {
      const allNews = await this.fetchAllSources();
      this.state.allNews = allNews;
      this.state.loaded = true;

      this.clearSkeletons();

      if (!allNews.length) return;

      this.renderAll(allNews);
      this.injectSchemas(allNews);
      this.initCardReveal();

      if (this.config.isDebug) {
        console.log(`[NewsEngine V3] ${allNews.length} notícias carregadas.`);
      }
    } catch (err) {
      this.clearSkeletons();
      if (this.config.isDebug) console.error('[NewsEngine] Erro geral:', err);
    }
  },

  injectStyles() {
    if (document.getElementById(this.config.styleId)) return;
    const style = document.createElement('style');
    style.id = this.config.styleId;
    style.textContent = `
      /* === NewsEngine V3 === */

      /* Hero */
      .hero-news-wrapper {
        position: relative; border-radius: 8px; overflow: hidden;
        height: 500px; border: 1px solid rgba(212,175,55,0.2);
        cursor: pointer;
      }
      .hero-gradient-overlay {
        position: absolute; inset: 0;
        background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, transparent 60%);
        pointer-events: none; z-index: 1;
      }
      .hero-text-link {
        position: absolute; bottom: 0; left: 0; width: 100%;
        padding: 24px; z-index: 2; text-decoration: none;
        display: block;
      }
      .hero-news-title {
        font-family: 'Teko', sans-serif;
        color: #fff; font-size: 2.2rem; line-height: 1.15;
        font-weight: 500; letter-spacing: 0.5px;
        text-shadow: 0 3px 10px rgba(0,0,0,0.8);
        margin: 8px 0;
      }
      .hero-news-resumo {
        color: rgba(255,255,255,0.8); font-family: 'Lato', sans-serif;
        font-size: 1.05rem; margin: 0 0 8px; line-height: 1.5;
      }
      .hero-news-data {
        color: #d4af37; font-family: 'Teko', sans-serif;
        font-size: 1.1rem; display: flex; align-items: center; gap: 6px;
      }

      /* Cards da Grid */
      .news-card-elite {
        background: rgba(15,15,18,0.6);
        border: 1px solid rgba(255,255,255,0.05); border-radius: 8px;
        transition: border-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
      }
      .news-card-elite:hover {
        border-color: rgba(212,175,55,0.4);
        transform: translateY(-5px);
        box-shadow: 0 10px 25px rgba(0,0,0,0.8);
      }
      @media (prefers-reduced-motion: reduce) {
        .news-card-elite { transition: border-color 0.3s; }
        .news-card-elite:hover { transform: none; }
      }
      .news-card-link { text-decoration: none; color: inherit; display: block; }
      .news-img-area {
        height: 250px; overflow: hidden; position: relative;
        border-bottom: 2px solid #d4af37;
      }
      .news-media-el {
        width: 100%; height: 100%; object-fit: cover;
        position: absolute; top: 0; left: 0;
        transition: transform 0.5s ease;
      }
      .news-img-zoom:hover .news-media-el { transform: scale(1.06); }
      @media (prefers-reduced-motion: reduce) {
        .news-img-zoom:hover .news-media-el { transform: none; }
      }
      .news-card-body { padding: 20px; }
      .news-card-data {
        color: #777; font-family: 'Teko', sans-serif;
        font-size: 0.95rem; display: flex; align-items: center;
        gap: 5px; margin-bottom: 8px;
      }
      .news-card-titulo {
        font-family: 'Teko', sans-serif; color: #fff;
        font-size: 1.35rem; line-height: 1.25; margin-bottom: 10px;
      }
      .news-card-resumo {
        font-family: 'Lato', sans-serif; color: #888;
        font-size: 0.9rem; line-height: 1.55;
        display: -webkit-box; -webkit-line-clamp: 3;
        -webkit-box-orient: vertical; overflow: hidden;
        margin: 0;
      }

      /* Badge de categoria/fonte */
      .news-badge {
        display: inline-flex; align-items: center; gap: 5px;
        font-family: 'Teko', sans-serif; font-size: 0.85rem;
        letter-spacing: 0.5px; padding: 3px 10px;
        border-radius: 4px; text-transform: uppercase;
      }
      .news-badge-destaque { background: #c0392b; color: #fff; }
      .news-badge-categoria { background: rgba(0,0,0,0.7); color: #d4af37; border: 1px solid rgba(255,255,255,0.2); position: absolute; top: 10px; right: 10px; }
      .news-badge-fonte { background: rgba(212,175,55,0.15); color: #d4af37; border: 1px solid rgba(212,175,55,0.3); position: absolute; top: 10px; left: 10px; font-size: 0.75rem; }

      /* Animação de entrada dos cards */
      .news-card-reveal { opacity: 0; transform: translateY(15px); transition: opacity 0.5s ease, transform 0.4s ease; }
      .news-card-reveal.news-card-visible { opacity: 1; transform: translateY(0); }
      @media (prefers-reduced-motion: reduce) {
        .news-card-reveal { opacity: 1; transform: none; transition: none; }
      }

      /* Skeleton Loading */
      .news-skeleton-card {
        background: rgba(15,15,18,0.6); border: 1px solid rgba(255,255,255,0.05);
        border-radius: 8px; overflow: hidden;
      }
      .news-skeleton-img  { height: 250px; }
      .news-skeleton-title { height: 24px; margin: 20px; border-radius: 4px; }
      .news-skeleton-text  { height: 60px; margin: 0 20px 20px; border-radius: 4px; }
      @keyframes pulse {
        0%,100% { background: rgba(255,255,255,0.04); }
        50%      { background: rgba(255,255,255,0.09); }
      }
      .pulse { animation: pulse 1.5s ease-in-out infinite; }
      @media (prefers-reduced-motion: reduce) {
        .pulse { animation: none; background: rgba(255,255,255,0.06); }
      }
    `;
    document.head.appendChild(style);
  },

  async fetchAllSources() {
    const cached = this.getCache();
    if (cached) {
      if (this.config.isDebug) console.log('[NewsEngine] Usando cache para as notícias.');
      return cached;
    }

    // Busca todas as fontes em paralelo
    const promises = this.config.sources.map(source => {
      if (source.type === 'json') return this.fetchJson(source);
      if (source.type === 'rss')  return this.fetchRss(source);
      return Promise.resolve([]);
    });

    const results = await Promise.allSettled(promises);
    const allNews = results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value)
      .filter(n => n.titulo && n.link);

    // Ordenação: JSON local vem primeiro, depois a data mais recente
    const sorted = [...allNews].sort((a, b) => {
      if (!a.isRss && b.isRss) return -1;
      if (a.isRss && !b.isRss) return 1;
      return (b.id > a.id) ? 1 : -1;
    });

    const sliced = sorted.slice(0, this.config.maxItems);
    this.setCache(sliced);
    return sliced;
  },

  async fetchJson(source) {
    try {
      const res = await fetch(source.url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      
      return json.map(item => ({
        id:        item.id || `${Date.now()}-${Math.random()}`,
        titulo:    this.sanitizeText(item.titulo, 120),
        resumo:    this.sanitizeText(item.resumo, 200),
        link:      this.sanitizeUrl(item.link),
        imagem:    this.sanitizeUrl(item.imagem),
        data:      this.sanitizeText(item.data, 50),
        categoria: this.sanitizeText(item.categoria, 50),
        destaque:  item.destaque || false,
        fonte:     source.name,
        isRss:     false
      }));
    } catch (err) {
      if (this.config.isDebug) console.warn(`[NewsEngine] Falha no JSON (${source.name}):`, err.message);
      return [];
    }
  },

  async fetchRss(source) {
    try {
      const proxyUrl = `${this.config.allOriginsProxy}${encodeURIComponent(source.url)}`;
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const json = await res.json();
      if (!json.contents) throw new Error('AllOrigins retornou conteúdo vazio');
      
      return this.parseRss(json.contents, source);
    } catch (err) {
      if (this.config.isDebug) console.warn(`[NewsEngine] RSS falhou (${source.name}):`, err.message);
      return [];
    }
  },

  parseRss(xmlText, source) {
    try {
      const parser = new DOMParser();
      const xml = parser.parseFromString(xmlText, 'text/xml');

      const parseError = xml.querySelector('parsererror');
      if (parseError) throw new Error('XML inválido');

      const items = [...xml.querySelectorAll('item, entry')];
      return items.slice(0, 10).map(item => this.normalizeRssItem(item, source));
    } catch (err) {
      if (this.config.isDebug) console.warn(`[NewsEngine] Parse RSS falhou (${source.name}):`, err.message);
      return [];
    }
  },

  normalizeRssItem(item, source) {
    const getText = (sel) => {
      const el = item.querySelector(sel);
      return el ? this.sanitizeText(el.textContent || el.getAttribute('url') || '') : '';
    };

    const enclosure = item.querySelector('enclosure[url]');
    const mediaContent = item.querySelector('content[url], thumbnail[url]');
    const imgUrl = enclosure?.getAttribute('url') || mediaContent?.getAttribute('url') || '';

    const pubDate = getText('pubDate') || getText('published') || getText('updated');
    let dataFormatada = 'Sem data';
    try {
      if (pubDate) {
        dataFormatada = new Date(pubDate).toLocaleDateString('pt-BR', {
          day: '2-digit', month: 'long', year: 'numeric'
        });
      }
    } catch { /* Mantém 'Sem data' se a string não for uma data válida */ }

    const guid = getText('guid') || getText('id') || `${source.name}-${Date.now()}-${Math.random()}`;

    return {
      id:        guid,
      titulo:    this.sanitizeText(getText('title'), 120),
      resumo:    this.sanitizeText(getText('description') || getText('summary'), 200),
      link:      this.sanitizeUrl(getText('link')),
      imagem:    this.sanitizeUrl(imgUrl),
      data:      dataFormatada,
      categoria: source.name,
      fonte:     source.name,
      destaque:  false,
      isRss:     true
    };
  },

  getCache() {
    try {
      const raw = sessionStorage.getItem(this.config.cacheKey);
      if (!raw) return null;
      const { data, timestamp } = JSON.parse(raw);
      if (Date.now() - timestamp > this.config.cacheTtlMs) {
        sessionStorage.removeItem(this.config.cacheKey);
        return null;
      }
      return data;
    } catch { return null; }
  },

  setCache(data) {
    try {
      sessionStorage.setItem(this.config.cacheKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch { /* Ignora se o sessionStorage falhar/estiver cheio */ }
  },

  renderAll(news) {
    const heroContainer = document.getElementById(this.config.heroContainerId);
    const gridContainer = document.getElementById(this.config.gridContainerId);
    
    const destaque = news.find(n => n.destaque === true) || news[0];
    const listaGrid = news.filter(n => n.id !== destaque.id);

    if (heroContainer) {
      heroContainer.innerHTML = '';
      heroContainer.appendChild(this.buildHero(destaque));
    }

    if (gridContainer) {
      gridContainer.innerHTML = '';
      listaGrid.forEach(n => gridContainer.appendChild(this.buildCard(n)));
    }
  },

  buildHero(news) {
    const wrapper = document.createElement('div');
    wrapper.className = 'hero-news-wrapper news-img-zoom';
    wrapper.setAttribute('aria-label', `Notícia em destaque: ${news.titulo}`);

    const media = this.buildMediaElement(news.imagem, news.titulo, true);
    wrapper.appendChild(media);

    const overlay = document.createElement('div');
    overlay.className = 'hero-gradient-overlay';
    wrapper.appendChild(overlay);

    const link = document.createElement('a');
    link.href = news.link;
    link.className = 'hero-text-link';
    link.setAttribute('aria-label', news.titulo);
    link.addEventListener('click', () => this.trackEvent('news_hero_click', news.titulo));

    const badge = this.buildBadge(`DESTAQUE | ${news.categoria}`, 'destaque');

    const h2 = document.createElement('h2');
    h2.className = 'hero-news-title';
    h2.textContent = news.titulo;

    const p = document.createElement('p');
    p.className = 'hero-news-resumo';
    p.textContent = news.resumo;

    const dataEl = document.createElement('small');
    dataEl.className = 'hero-news-data';
    const clockIcon = document.createElement('i');
    clockIcon.className = 'far fa-clock';
    clockIcon.setAttribute('aria-hidden', 'true');
    dataEl.appendChild(clockIcon);
    dataEl.appendChild(document.createTextNode(` ${news.data}`));

    link.appendChild(badge);
    link.appendChild(h2);
    link.appendChild(p);
    link.appendChild(dataEl);
    wrapper.appendChild(link);

    return wrapper;
  },

  buildCard(news) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-6 mb-4 news-card-reveal';

    const card = document.createElement('div');
    card.className = 'news-card-elite h-100 rounded overflow-hidden';

    const link = document.createElement('a');
    link.href = news.link;
    link.className = 'news-card-link';
    link.setAttribute('aria-label', news.titulo);
    
    if (news.isRss) { 
        link.target = '_blank'; 
        link.rel = 'noopener noreferrer'; 
    }
    
    link.addEventListener('click', () => this.trackEvent('news_card_click', news.titulo));

    const imgWrap = document.createElement('div');
    imgWrap.className = 'news-img-zoom news-img-area';

    const media = this.buildMediaElement(news.imagem, news.titulo, false);
    const catBadge = this.buildBadge(news.categoria, 'categoria');

    imgWrap.appendChild(media);
    imgWrap.appendChild(catBadge);

    if (news.isRss && news.fonte) {
      const fonteBadge = this.buildBadge(news.fonte, 'fonte');
      imgWrap.appendChild(fonteBadge);
    }

    const body = document.createElement('div');
    body.className = 'news-card-body';

    const dataEl = document.createElement('small');
    dataEl.className = 'news-card-data';
    const calIcon = document.createElement('i');
    calIcon.className = 'far fa-calendar';
    calIcon.setAttribute('aria-hidden', 'true');
    dataEl.appendChild(calIcon);
    dataEl.appendChild(document.createTextNode(` ${news.data}`));

    const h3 = document.createElement('h3');
    h3.className = 'news-card-titulo';
    h3.textContent = news.titulo;

    const resumo = document.createElement('p');
    resumo.className = 'news-card-resumo';
    resumo.textContent = news.resumo;

    body.appendChild(dataEl);
    body.appendChild(h3);
    body.appendChild(resumo);

    link.appendChild(imgWrap);
    link.appendChild(body);
    card.appendChild(link);
    col.appendChild(card);

    return col;
  },

  buildMediaElement(url, alt, isHero) {
    const safeUrl = this.sanitizeUrl(url);
    const safeAlt = this.sanitizeText(alt, 120);
    const isVideo = safeUrl.match(/\.(mp4|webm)(\?|$)/i);

    if (isVideo) {
      const video = document.createElement('video');
      video.className = 'news-media-el';
      video.autoplay = true; 
      video.loop = true; 
      video.muted = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('aria-label', safeAlt);
      
      const source = document.createElement('source');
      source.src = safeUrl;
      source.type = 'video/mp4';
      video.appendChild(source);
      return video;
    }

    const img = document.createElement('img');
    img.className = 'news-media-el';
    img.alt = safeAlt;
    
    if (!isHero) img.loading = 'lazy';
    img.decoding = 'async';

    if (safeUrl && safeUrl !== '#') {
      img.src = safeUrl;
    } else {
      img.src = this.config.fallbackImg;
    }

    img.addEventListener('error', () => {
      img.src = this.config.fallbackImg;
      img.alt = 'Imagem indisponível';
    });

    return img;
  },

  buildBadge(text, variant) {
    const badge = document.createElement('span');
    badge.className = `news-badge news-badge-${variant}`;
    
    if (variant === 'destaque') {
      const icon = document.createElement('i');
      icon.className = 'fas fa-fire';
      icon.style.marginRight = '4px';
      icon.setAttribute('aria-hidden', 'true');
      badge.appendChild(icon);
    }
    
    badge.appendChild(document.createTextNode(text));
    return badge;
  },

  buildSkeletons(count) {
    const grid = document.getElementById(this.config.gridContainerId);
    if (!grid) return;

    for (let i = 0; i < count; i++) {
      const col = document.createElement('div');
      col.className = 'col-md-6 col-lg-6 mb-4 news-skeleton';

      const card = document.createElement('div');
      card.className = 'news-skeleton-card';

      const imgArea = document.createElement('div');
      imgArea.className = 'news-skeleton-img pulse';

      const titleArea = document.createElement('div');
      titleArea.className = 'news-skeleton-title pulse';

      const textArea = document.createElement('div');
      textArea.className = 'news-skeleton-text pulse';

      card.appendChild(imgArea);
      card.appendChild(titleArea);
      card.appendChild(textArea);
      col.appendChild(card);
      grid.appendChild(col);
    }
  },

  clearSkeletons() {
    document.querySelectorAll('.news-skeleton').forEach(el => el.remove());
  },

  initCardReveal() {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion || !('IntersectionObserver' in window)) {
      document.querySelectorAll('.news-card-reveal').forEach(el => el.classList.add('news-card-visible'));
      return;
    }

    this.state.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('news-card-visible');
          this.state.observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.news-card-reveal').forEach(el => {
      this.state.observer.observe(el);
    });
  },

  injectSchemas(newsList) {
    window._schemaRegistry = window._schemaRegistry || new Set();

    const listId = 'news-engine-itemlist';
    if (!window._schemaRegistry.has(listId)) {
      const schema = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        'name': 'Notícias Criminais — Lucas Semim Advocacia',
        'itemListElement': newsList.slice(0, 10).map((n, i) => ({
          '@type': 'ListItem',
          'position': i + 1,
          'url': n.link
        }))
      };
      this._injectJsonLd(schema, listId);
    }

    newsList.filter(n => !n.isRss).forEach(n => {
      const schemaId = `news-article-${encodeURIComponent(n.id).slice(0, 30)}`;
      if (window._schemaRegistry.has(schemaId)) return;

      const schema = {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        'headline': n.titulo,
        'description': n.resumo,
        'url': n.link,
        'datePublished': n.data,
        'author': {
          '@type': 'Person',
          'name': 'Lucas Renan Semim',
          'url': 'https://lucassemim.adv.br'
        },
        'publisher': {
          '@type': 'Organization',
          'name': 'Lucas Semim Advocacia Criminal',
          'url': 'https://lucassemim.adv.br',
          'logo': {
            '@type': 'ImageObject',
            'url': 'https://lucassemim.adv.br/img/logodosemim1.png'
          }
        },
        ...(n.imagem && n.imagem !== '#' ? { 'image': n.imagem } : {})
      };
      this._injectJsonLd(schema, schemaId);
    });
  },

  _injectJsonLd(schema, id) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-schema-id', id);
    script.setAttribute('data-source', 'news-engine');
    script.textContent = JSON.stringify(schema, null, 0);
    document.head.appendChild(script);
    window._schemaRegistry.add(id);
  },

  sanitizeText(str, maxLen = 300) {
    if (typeof str !== 'string') return '';
    const tmp = document.createElement('div');
    tmp.textContent = str;
    return tmp.textContent.trim().slice(0, maxLen);
  },

  sanitizeUrl(url) {
    if (typeof url !== 'string' || !url.trim()) return '#';
    try {
      const parsed = new URL(url.trim(), window.location.origin);
      if (!['http:', 'https:'].includes(parsed.protocol)) return '#';
      return parsed.href;
    } catch {
      return '#';
    }
  },

  trackEvent(action, label) {
    try {
      if (typeof gtag !== 'function') return;
      gtag('event', action, {
        event_category: 'NewsEngine',
        event_label: label.slice(0, 100),
        pagina_origem: window.location.pathname
      });
    } catch { /* silencioso */ }
  }
};

document.addEventListener('DOMContentLoaded', () => window.NewsEngine.init());