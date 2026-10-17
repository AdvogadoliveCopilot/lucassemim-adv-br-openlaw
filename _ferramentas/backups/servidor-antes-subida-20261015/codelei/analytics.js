/* =========================================================== */
/* === ARQUIVO: js/analytics.js (Quantum V6 Pro — CORRIGIDO) */
/* === FUNÇÃO: Tracking GA4 / Google Ads / Core Web Vitals  === */
/* === Correções: LGPD, onload, quality duplicado, rAF      === */
/* =========================================================== */

/*
    Após implantar, criar no GA4 → Públicos:
    1. "Leads Qualificados"      → generate_lead disparado
    2. "Alta Qualidade"          → session_quality score >= 70
    3. "Visitantes IA"           → ai_assistant_referral disparado
    4. "Paid Search Engajado"    → paid_first_scroll E time >= 30s
    5. "Leitores de Artigo"      → read_time_milestone seconds = 90
*/

(function () {
    'use strict';

    window.AnalyticsElite = {

        config: {
            gaId:               'G-2YKRZQYMWJ',
            adsId:              'AW-8834506682',
            adsConversionLabel: 'INSERIR_LABEL_CORRETO', // copiar do Google Ads → Conversões
            isDebug:            window.location.hostname !== 'lucassemim.adv.br',
            eventNames: {
                lead:       'generate_lead',
                contato:    'contato_iniciado',
                conversion: 'conversion',
                scroll:     'scroll_milestone',
                time:       'read_time_milestone',
                exit:       'exit_intent',
                quality:    'session_quality'
            }
        },

        state: {
            scrollMilestones:  new Set(),
            timeMilestones:    new Set(),
            timeOnPage:        0,
            intervalId:        null,
            maxScrollPct:      0,
            whatsappClicked:   false,
            phoneClicked:      false,
            exitIntentFired:   false,
            qualityFired:      false,   // ← NOVO: guard anti-duplicação
            focusStart:        Date.now(),
            totalFocusMs:      0,
            scrollRafId:       null     // ← NOVO: throttle de scroll
        },

        /* ── INICIALIZAÇÃO ───────────────────────────────────── */

        init() {
            try {
                this.log('🚀 [Analytics Quantum V6] Iniciando módulos...');

                this.setupDataLayer();
                this.loadGtag();

                this.initUTMCapture();
                this.initClickTracking();
                this.initScrollDepth();
                this.initTimeTracking();
                this.initExitIntent();
                this.initFocusTime();
                this.initTurboLink();
                this.initWebVitals();       // ← NOVO: Core Web Vitals

                // Módulos V6
                this.initPaidSearchBehavior();
                this.initSectionEngagement();
                this.initAiReferralDetection();
                this.initReturningUserDetection();

                // ── BUGFIX 3: qualityFired guard evita disparo duplo ──
                window.addEventListener('pagehide', () => this.fireSessionQuality(), { once: true });
                document.addEventListener('visibilitychange', () => {
                    if (document.visibilityState === 'hidden') this.fireSessionQuality();
                });

            } catch (error) {
                this.log('❌ Erro fatal:', error);
            }
        },

        log(msg, data = '') {
            if (this.config.isDebug) console.log(msg, data);
        },

        /* ── BUGFIX 3: wrapper com guard anti-duplicação ──────── */
        fireSessionQuality() {
            if (this.state.qualityFired) return;
            this.state.qualityFired = true;
            this.calcSessionQuality();
        },

        /* ── DATA LAYER + CONSENT MODE V2 ────────────────────── */

        setupDataLayer() {
            window.dataLayer = window.dataLayer || [];

            // Definir gtag como função global padrão
            if (!window.gtag) {
                window.gtag = function () { window.dataLayer.push(arguments); };
            }

            // ── BUGFIX 1: analytics_storage 'denied' até consentimento (LGPD) ──
            // O lgpd.js atualiza para 'granted' quando o usuário aceita
            window.gtag('consent', 'default', {
                analytics_storage:  'denied',   // era 'granted' — violava LGPD
                ad_storage:         'denied',
                ad_user_data:       'denied',
                ad_personalization: 'denied',
                wait_for_update:    500
            });
        },

        loadGtag() {
            const gaScript = document.createElement('script');
            gaScript.async = true;
            gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${this.config.gaId}`;

            // ── BUGFIX 2: addEventListener em vez de .onload (Elite V3) ──
            gaScript.addEventListener('load', () => {
                window.gtag('js', new Date());
                window.gtag('config', this.config.gaId, {
                    send_page_view: true,
                    transport_url:  'https://www.google-analytics.com' // garantia de envio
                });
                this.enrichSession();
                this.camaleaoTatico();
            });

            document.head.appendChild(gaScript);
        },

        /* ── HELPERS ─────────────────────────────────────────── */

        getParam(p) {
            const match = RegExp('[?&]' + p + '=([^&]*)').exec(window.location.search);
            return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
        },

        getChannel() {
            try {
                const medium = (this.getParam('utm_medium') || '').toLowerCase();
                const source = (this.getParam('utm_source') || '').toLowerCase();
                const gclid  = this.getParam('gclid');
                const ref    = document.referrer.toLowerCase();

                if (gclid || medium === 'cpc' || medium === 'ppc') return 'paid_search';
                if (medium === 'display' || medium === 'banner')   return 'display';
                if (medium === 'email')                            return 'email';
                if (source.includes('google') && !medium)         return 'organic';
                if (source.includes('bing')   && !medium)         return 'organic';
                if (ref.includes('gemini.google') || ref.includes('chatgpt') || ref.includes('perplexity')) return 'ai_assistant';
                if (!ref && !medium)                              return 'direct';
                return medium || 'other';
            } catch { return 'unknown'; }
        },

        fire(eventName, params = {}) {
            try {
                if (typeof window.gtag !== 'function') return;
                const safeName = eventName.slice(0, 40);
                window.gtag('event', safeName, {
                    page_path: window.location.pathname,
                    channel:   this.getChannel(),
                    campanha:  this.getParam('utm_campaign') || 'organico',
                    device:    window.innerWidth < 768 ? 'mobile' : 'desktop',
                    ...params
                });
            } catch { }
        },

        /* ── CONVERSÃO (generate_lead + Google Ads) ──────────── */

        trackConversion(label, tipo, fonte) {
            try {
                if (typeof window.gtag !== 'function') return;

                const canal    = this.getChannel();
                const campanha = this.getParam('utm_campaign') || 'organico';

                // Evento padrão GA4 para leads qualificados
                window.gtag('event', this.config.eventNames.lead, {
                    lead_source:   fonte,
                    lead_channel:  canal,
                    lead_campaign: campanha,
                    page_path:     window.location.pathname,
                    value:         1,
                    currency:      'BRL'
                });

                // Evento semântico interno
                window.gtag('event', this.config.eventNames.contato, {
                    event_category: 'Conversão',
                    event_label:    label,
                    tipo_contato:   tipo,
                    canal,
                    page_path:      window.location.pathname,
                    campanha
                });

                // Conversão Google Ads (apenas se o label estiver configurado)
                if (this.config.adsConversionLabel &&
                    !this.config.adsConversionLabel.startsWith('INSERIR')) {
                    window.gtag('event', this.config.eventNames.conversion, {
                        send_to:  `${this.config.adsId}/${this.config.adsConversionLabel}`,
                        value:    1.0,
                        currency: 'BRL'
                    });
                }
            } catch { }
        },

        /* ── UTM CAPTURE ─────────────────────────────────────── */

        initUTMCapture() {
            const params = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'];
            const data   = {};
            let found    = false;

            params.forEach(p => {
                const v = this.getParam(p);
                if (v) { data[p] = v; found = true; }
            });

            if (found) {
                data._ts  = Date.now();
                data._url = window.location.href;
                try { localStorage.setItem('ls_utm_v6', JSON.stringify(data)); } catch { }
            }
        },

        /* ── ENRIQUECIMENTO DE SESSÃO ─────────────────────────── */

        enrichSession() {
            try {
                const isFirstVisit = !localStorage.getItem('ls_visited_v6');

                if (isFirstVisit) {
                    localStorage.setItem('ls_visited_v6', Date.now().toString());
                    this.fire('primeira_visita', {
                        event_category: 'Sessao',
                        referrer: document.referrer || '(direct)'
                    });
                } else {
                    const days = Math.round((Date.now() - parseInt(localStorage.getItem('ls_visited_v6'))) / 86400000);
                    this.fire('visita_recorrente', {
                        event_category:     'Sessao',
                        dias_desde_primeira: days
                    });
                }

                const ua   = navigator.userAgent;
                const device = /Mobi|Android/i.test(ua) ? 'mobile' : /Tablet|iPad/i.test(ua) ? 'tablet' : 'desktop';
                const conn   = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

                window.gtag('set', 'user_properties', {
                    tipo_dispositivo:  device,
                    tipo_conexao:      conn ? conn.effectiveType : 'unknown',
                    resolucao_tela:    `${screen.width}x${screen.height}`,
                    idioma:            navigator.language || 'pt-BR',
                    visita_recorrente: isFirstVisit ? 'nao' : 'sim'
                });
            } catch { }
        },

        /* ── CAMALEÃO TÁTICO ─────────────────────────────────── */

        camaleaoTatico() {
            const termoBusca = this.getParam('busca') || this.getParam('utm_term') || this.getParam('keyword');
            if (!termoBusca) return;

            const termoLimpo = termoBusca.replace(/[^a-zA-Z0-9\sãõáéíóúâêîôûçÃÕÁÉÍÓÚÂÊÎÔÛÇ]/g, '').trim().slice(0, 40);
            if (termoLimpo.length < 4) return;

            const heroTitle = document.querySelector('.hero-title');
            if (!heroTitle) return;

            heroTitle.textContent = '';

            const prefix = document.createTextNode('DEFESA CRIMINAL EM ');
            const span   = document.createElement('span');

            // ── BUGFIX 4: classe CSS em vez de style.textTransform inline ──
            span.className = 'text-gold text-uppercase';
            span.textContent = termoLimpo;

            const br      = document.createElement('br');
            const suffix  = document.createTextNode('SUA LIBERDADE É PRIORIDADE');

            heroTitle.appendChild(prefix);
            heroTitle.appendChild(span);
            heroTitle.appendChild(br);
            heroTitle.appendChild(suffix);

            this.fire('camaleao_ativado', {
                event_category: 'Personalizacao',
                termo:          termoLimpo
            });
        },

        /* ── CLICK TRACKING ──────────────────────────────────── */

        initClickTracking() {
            document.addEventListener('click', (e) => {
                const target = e.target.closest('a, button');
                if (!target) return;

                const href = target.href || '';

                if (href.includes('wa.me') || href.includes('api.whatsapp')) {
                    this.state.whatsappClicked = true;
                    let contexto = 'whatsapp_geral';
                    if (target.closest('.hero-title, .hero, #header-placeholder, header'))         contexto = 'whatsapp_hero';
                    else if (target.closest('.sticky, .fixed, .floating-btn, #mobile-sticky-bar')) contexto = 'whatsapp_sticky';
                    else if (target.closest('footer, #footer-placeholder'))                        contexto = 'whatsapp_footer';
                    else if (target.closest('.card, .servico, .section-services'))                 contexto = 'whatsapp_servico';
                    this.trackConversion(contexto, 'Mensagem', contexto);
                }
                else if (href.startsWith('tel:')) {
                    this.state.phoneClicked = true;
                    this.trackConversion('Clique_Ligar', 'Chamada', 'phone');
                }
                else if (href.match(/\.(pdf|doc|docx)$/i)) {
                    this.fire('file_download', {
                        event_category: 'Download',
                        file_name:      href.split('/').pop()
                    });
                }
                else if (href && !href.includes(window.location.hostname) && href.startsWith('http')) {
                    this.fire('outbound_link', {
                        event_category: 'Saida_Externa',
                        link_url:       href.split('?')[0]
                    });
                }
            }, { passive: true });

            // Copy tracking (telefone, email, dados jurídicos)
            document.addEventListener('copy', () => {
                const selection = window.getSelection() || document.getSelection();
                if (!selection) return;
                const text = selection.toString().trim();
                if (!text) return;

                if (/98942|0094|31\s*9/.test(text)) {
                    this.fire('copiar_telefone', { event_category: 'Micro_Conversao', texto: text.slice(0, 30) });
                } else if (text.includes('@') && text.includes('.')) {
                    this.fire('copiar_email', { event_category: 'Micro_Conversao' });
                } else if (/oab|processo|\d{7}-\d{2}/i.test(text)) {
                    this.fire('copiar_dado_juridico', { event_category: 'Interesse_Juridico' });
                }
            });
        },

        /* ── SCROLL DEPTH (com rAF throttle) ─────────────────── */

        initScrollDepth() {
            // ── BUGFIX 6: throttle com requestAnimationFrame (era 60x/s sem controle) ──
            window.addEventListener('scroll', () => {
                if (this.state.scrollRafId) return;
                this.state.scrollRafId = requestAnimationFrame(() => {
                    this.state.scrollRafId = null;

                    const totalScrollable = document.body.scrollHeight - window.innerHeight;
                    if (totalScrollable <= 0) return;

                    const pct = Math.round((window.scrollY / totalScrollable) * 100);
                    this.state.maxScrollPct = Math.max(this.state.maxScrollPct, pct);

                    [25, 50, 75, 90, 100].forEach(marco => {
                        if (pct >= marco && !this.state.scrollMilestones.has(marco)) {
                            this.state.scrollMilestones.add(marco);
                            this.fire(this.config.eventNames.scroll, {
                                event_category: 'Engajamento',
                                percent_scrolled: marco
                            });
                        }
                    });
                });
            }, { passive: true });
        },

        /* ── TIME TRACKING ───────────────────────────────────── */

        initTimeTracking() {
            const isArticle    = !!document.querySelector('article, .artigo-conteudo, .post-content');
            const articleTitle = document.querySelector('h1')?.textContent?.slice(0, 60) || '';
            const milestones   = isArticle ? [30, 60, 90, 120, 180] : [30, 60, 120];

            this.state.intervalId = setInterval(() => {
                if (document.hidden) return;
                this.state.timeOnPage++;
                const t = this.state.timeOnPage;

                if (milestones.includes(t) && !this.state.timeMilestones.has(t)) {
                    this.state.timeMilestones.add(t);
                    this.fire(this.config.eventNames.time, {
                        seconds:       t,
                        is_article:    isArticle,
                        article_title: articleTitle
                    });
                }
            }, 1000);
        },

        /* ── EXIT INTENT ─────────────────────────────────────── */

        initExitIntent() {
            document.addEventListener('mouseleave', (e) => {
                if (this.state.exitIntentFired) return;
                if (e.clientY <= 20 && e.relatedTarget === null) {
                    this.state.exitIntentFired = true;
                    this.fire(this.config.eventNames.exit, {
                        event_category:  'Saida',
                        tempo_na_pagina: this.state.timeOnPage
                    });
                }
            });
        },

        /* ── FOCUS TIME (pagehide — mais confiável que beforeunload) */

        initFocusTime() {
            // ── BUGFIX 7: pagehide em vez de beforeunload ──
            window.addEventListener('pagehide', () => {
                this.state.totalFocusMs += Date.now() - this.state.focusStart;
                const segundos = Math.round(this.state.totalFocusMs / 1000);
                if (segundos > 5) {
                    this.fire('tempo_foco_total', {
                        event_category: 'Engajamento',
                        value:          segundos
                    });
                }
            });

            // Pausar contagem quando aba fica oculta
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'hidden') {
                    this.state.totalFocusMs += Date.now() - this.state.focusStart;
                } else {
                    this.state.focusStart = Date.now();
                }
            });
        },

        /* ── TURBO LINK (prefetch interno) ───────────────────── */

        initTurboLink() {
            const preloaded = new Set();
            const anchors   = document.querySelectorAll('a[href^="/"], a[href$=".html"]');

            anchors.forEach(a => {
                a.addEventListener('mouseenter', function () {
                    const href = this.getAttribute('href');
                    if (!href || preloaded.has(href)) return;
                    if (href.includes('#') || href.includes('wa.me')) return;
                    if (!href.startsWith('/') && !href.includes(window.location.hostname)) return;

                    preloaded.add(href);
                    const link = document.createElement('link');
                    link.rel  = 'prefetch';
                    link.href = href;
                    document.head.appendChild(link);
                }, { once: true, passive: true });
            });
        },

        /* ── NOVO: CORE WEB VITALS (LCP, FCP, CLS, TTFB) ────── */

        initWebVitals() {
            // Usar PerformanceObserver nativo — sem biblioteca externa
            try {
                // LCP
                if ('PerformanceObserver' in window) {
                    const lcpObs = new PerformanceObserver((list) => {
                        const entries = list.getEntries();
                        const lcp = entries[entries.length - 1];
                        if (lcp) {
                            this.fire('web_vital_lcp', {
                                value:    Math.round(lcp.startTime),
                                rating:   lcp.startTime < 2500 ? 'good' : lcp.startTime < 4000 ? 'needs_improvement' : 'poor',
                                element:  lcp.element?.tagName?.toLowerCase() || 'unknown'
                            });
                        }
                    });
                    lcpObs.observe({ type: 'largest-contentful-paint', buffered: true });

                    // CLS
                    let clsValue = 0;
                    const clsObs = new PerformanceObserver((list) => {
                        for (const entry of list.getEntries()) {
                            if (!entry.hadRecentInput) clsValue += entry.value;
                        }
                    });
                    clsObs.observe({ type: 'layout-shift', buffered: true });

                    // Enviar CLS ao sair
                    window.addEventListener('pagehide', () => {
                        if (clsValue > 0) {
                            this.fire('web_vital_cls', {
                                value:  Math.round(clsValue * 1000) / 1000,
                                rating: clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs_improvement' : 'poor'
                            });
                        }
                    }, { once: true });

                    // FCP
                    const fcpObs = new PerformanceObserver((list) => {
                        for (const entry of list.getEntries()) {
                            if (entry.name === 'first-contentful-paint') {
                                this.fire('web_vital_fcp', {
                                    value:  Math.round(entry.startTime),
                                    rating: entry.startTime < 1800 ? 'good' : entry.startTime < 3000 ? 'needs_improvement' : 'poor'
                                });
                            }
                        }
                    });
                    fcpObs.observe({ type: 'paint', buffered: true });
                }

                // TTFB via Navigation Timing API
                window.addEventListener('load', () => {
                    const nav = performance.getEntriesByType('navigation')[0];
                    if (nav) {
                        const ttfb = Math.round(nav.responseStart - nav.requestStart);
                        this.fire('web_vital_ttfb', {
                            value:  ttfb,
                            rating: ttfb < 800 ? 'good' : ttfb < 1800 ? 'needs_improvement' : 'poor'
                        });
                    }
                });
            } catch { }
        },

        /* ── PAID SEARCH BEHAVIOR ────────────────────────────── */

        initPaidSearchBehavior() {
            const channel = this.getChannel();
            if (channel !== 'paid_search') return;

            const startTime    = Date.now();
            let firstScrollDone = false;
            let firstClickDone  = false;

            const onFirstScroll = () => {
                if (firstScrollDone) return;
                firstScrollDone = true;
                this.fire('paid_first_scroll', { time_to_scroll_ms: Date.now() - startTime });
                // ── BUGFIX 5: sem options no removeEventListener ──
                window.removeEventListener('scroll', onFirstScroll);
            };
            window.addEventListener('scroll', onFirstScroll, { passive: true });

            const onFirstClick = (e) => {
                if (firstClickDone) return;
                firstClickDone = true;
                const tag   = (e.target.tagName || '').toLowerCase();
                const isBtn = tag === 'a' || tag === 'button';
                this.fire('paid_first_click', {
                    time_to_click_ms: Date.now() - startTime,
                    clicked_element:  tag,
                    clicked_link:     isBtn ? (e.target.href || e.target.textContent?.slice(0, 30)) : ''
                });
                document.removeEventListener('click', onFirstClick);
            };
            document.addEventListener('click', onFirstClick);

            window.addEventListener('pagehide', () => {
                if (!firstScrollDone && !firstClickDone) {
                    this.fire('paid_zero_interaction_exit', { time_on_page_ms: Date.now() - startTime });
                }
            }, { once: true });
        },

        /* ── SECTION ENGAGEMENT ──────────────────────────────── */

        initSectionEngagement() {
            const headings = document.querySelectorAll('article h2, .artigo-conteudo h2, .post-content h2, main h2');
            if (headings.length < 2) return;

            const seen = new Set();
            const obs  = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;
                    const title = entry.target.textContent.trim().slice(0, 60);
                    if (seen.has(title)) return;
                    seen.add(title);
                    const idx = [...headings].indexOf(entry.target);
                    this.fire('section_reached', {
                        section_title: title,
                        section_index: idx,
                        section_pct:   Math.round((idx / headings.length) * 100)
                    });
                });
            }, { threshold: 0.3 });

            headings.forEach(h => obs.observe(h));
        },

        /* ── AI REFERRAL DETECTION ───────────────────────────── */

        initAiReferralDetection() {
            try {
                const ref = document.referrer.toLowerCase();
                const aiSources = {
                    'gemini.google':  'Google Gemini',
                    'chatgpt.com':    'ChatGPT',
                    'perplexity.ai':  'Perplexity',
                    'bing.com/chat':  'Bing Chat / Copilot',
                    'claude.ai':      'Claude',
                    'you.com':        'You.com',
                    'phind.com':      'Phind'
                };

                const aiSource = Object.entries(aiSources).find(([domain]) => ref.includes(domain));
                if (!aiSource) return;

                const [, aiName] = aiSource;
                this.fire('ai_assistant_referral', {
                    ai_source:    aiName,
                    referrer_url: document.referrer,
                    page_title:   document.title.slice(0, 60)
                });

                if (typeof window.gtag === 'function') {
                    window.gtag('set', 'user_properties', {
                        ai_referred: 'true',
                        ai_source:   aiName
                    });
                }
            } catch { }
        },

        /* ── RETURNING USER DETECTION ────────────────────────── */

        initReturningUserDetection() {
            try {
                const isReturning = !!(localStorage.getItem('semim_returning') || document.cookie.includes('_ga='));

                if (isReturning) {
                    this.fire('returning_user_session', {
                        visit_count: parseInt(localStorage.getItem('semim_visit_count') || '0') + 1
                    });
                }

                const count = parseInt(localStorage.getItem('semim_visit_count') || '0') + 1;
                localStorage.setItem('semim_visit_count', String(count));
                localStorage.setItem('semim_returning', 'true');
            } catch { }
        },

        /* ── SESSION QUALITY SCORE ───────────────────────────── */

        calcSessionQuality() {
            const scroll     = this.state.maxScrollPct || 0;
            const time       = this.state.timeOnPage   || 0;
            const interacted = this.state.whatsappClicked || this.state.phoneClicked;

            const score = Math.round(
                Math.min(scroll / 100, 1) * 40 +
                Math.min(time   / 180, 1) * 40 +
                (interacted ? 20 : 0)
            );

            this.fire(this.config.eventNames.quality, {
                score,
                scroll_pct:   Math.round(scroll),
                time_seconds: time,
                interacted
            });
        }
    };

    // Inicialização segura
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.AnalyticsElite.init());
    } else {
        window.AnalyticsElite.init();
    }

})();
