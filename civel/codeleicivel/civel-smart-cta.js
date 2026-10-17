/* =========================================================== */
/* === FICHEIRO: civel-smart-cta.js (SmartCta Cível V1) ======= */
/* === FUNÇÃO: Banner Dinâmico Inteligente por Palavra-Chave = */
/* === ADAPTADO DE: js/smart-cta.js (site principal, criminal) */
/* === ESCOPO: civel.lucassemim.adv.br — Direito Cível        */
/* =========================================================== */

window.SmartCta = {
    config: {
        containerSelector: '.cta-internal',
        whatsapp: '5531989420094',
        waBase: 'https://wa.me/',
        styleId: 'smart-cta-styles',
        isDebug: window.location.hostname !== 'civel.lucassemim.adv.br',
        db: [
            {
                match: ['acidente de transito', 'acidente de carro', 'batida', 'colisao', 'atropelamento', 'dpvat', 'sinistro', 'seguro do carro', 'culpa no acidente'],
                title: 'SOFREU UM ACIDENTE DE TRÂNSITO?',
                desc: 'Danos materiais, lesões corporais e dias parados no trabalho geram direito a indenização. Dr. Lucas Semim analisa o boletim de ocorrência e calcula o valor devido.',
                btnText: 'ANALISAR MEU ACIDENTE',
                btnClass: 'btn-cta-red',
                icon: 'fas fa-car-burst',
                msg: 'Dr. Lucas, sofri um acidente de trânsito e quero saber se tenho direito a indenização.'
            },
            {
                match: ['dano moral', 'indenizacao', 'humilhacao', 'constrangimento', 'exposicao', 'nome sujo indevido', 'negativacao indevida'],
                title: 'PASSOU POR UMA SITUAÇÃO HUMILHANTE?',
                desc: 'Exposição indevida, negativação sem motivo ou constrangimento público podem gerar indenização por dano moral. Dr. Lucas Semim avalia seu caso gratuitamente.',
                btnText: 'AVALIAR DANO MORAL',
                btnClass: 'btn-cta-elite',
                icon: 'fas fa-heart-crack',
                msg: 'Dr. Lucas, passei por uma situação que me causou dano moral. Quero saber se tenho direito a indenização.'
            },
            {
                match: ['erro medico', 'negligencia medica', 'imperícia', 'cirurgia errada', 'diagnostico errado', 'hospital', 'plano cirurgico', 'sequela', 'obitos hospitalares'],
                title: 'FOI VÍTIMA DE ERRO MÉDICO?',
                desc: 'Negligência, imprudência ou imperícia na área da saúde geram direito à responsabilização civil do profissional e do hospital. Dr. Lucas Semim analisa o prontuário.',
                btnText: 'ANALISAR ERRO MÉDICO',
                btnClass: 'btn-cta-red',
                icon: 'fas fa-user-doctor',
                msg: 'Dr. Lucas, acredito que fui vítima de erro médico. Preciso de uma análise do meu caso.'
            },
            {
                match: ['seguro negado', 'seguradora', 'negativa de cobertura', 'sinistro negado', 'seguro de vida', 'seguro residencial', 'seguro recusado'],
                title: 'SEGURADORA NEGOU SEU SINISTRO?',
                desc: 'Negativas abusivas de cobertura podem ser revertidas judicialmente. Dr. Lucas Semim analisa a apólice e a carta de negativa para exigir o pagamento devido.',
                btnText: 'REVERTER NEGATIVA DO SEGURO',
                btnClass: 'btn-cta-elite',
                icon: 'fas fa-file-shield',
                msg: 'Dr. Lucas, minha seguradora negou o sinistro. Quero saber se essa negativa pode ser revertida.'
            },
            {
                match: ['cobranca abusiva', 'juros abusivos', 'banco', 'cobranca indevida', 'taxa de juros', 'cheque especial', 'cartao de credito', 'divida bancaria', 'revisao de contrato bancario'],
                title: 'COBRANÇA BANCÁRIA ABUSIVA?',
                desc: 'Juros acima do praticado no mercado e capitalização indevida podem ser revisados judicialmente. Dr. Lucas Semim analisa o contrato e recalcula sua dívida.',
                btnText: 'REVISAR MINHA DÍVIDA',
                btnClass: 'btn-cta-elite',
                icon: 'fas fa-building-columns',
                msg: 'Dr. Lucas, acho que estou pagando juros abusivos ao banco. Pode revisar meu contrato?'
            },
            {
                match: ['execucao de divida', 'penhora', 'bloqueio de conta', 'bloqueio judicial', 'bacenjud', 'sisbajud', 'citacao', 'processo de execucao', 'embargos'],
                title: 'SOFRENDO EXECUÇÃO DE DÍVIDA?',
                desc: 'Penhoras e bloqueios podem ser indevidos ou desproporcionais. Dr. Lucas Semim avalia embargos à execução e protege seu patrimônio dentro da lei.',
                btnText: 'DEFENDER MEU PATRIMÔNIO',
                btnClass: 'btn-cta-red',
                icon: 'fas fa-gavel',
                msg: 'Dr. Lucas, estou sofrendo uma execução de dívida / penhora. Preciso de defesa urgente.'
            },
            {
                match: ['contrato', 'clausula abusiva', 'rescisao contratual', 'inadimplemento', 'quebra de contrato', 'distrato', 'prestacao de servicos', 'fornecedor'],
                title: 'PROBLEMA COM UM CONTRATO?',
                desc: 'Cláusulas abusivas, inadimplemento ou rescisão irregular podem gerar direito a indenização ou revisão contratual. Dr. Lucas Semim analisa seu contrato.',
                btnText: 'ANALISAR MEU CONTRATO',
                btnClass: 'btn-cta-elite',
                icon: 'fas fa-file-signature',
                msg: 'Dr. Lucas, tenho um problema com um contrato e preciso de orientação jurídica.'
            },
            {
                match: ['inventario', 'heranca', 'sucessao', 'partilha de bens', 'divorcio', 'pensao alimenticia', 'guarda dos filhos', 'testamento', 'uniao estavel'],
                title: 'QUESTÕES DE FAMÍLIA OU HERANÇA?',
                desc: 'Inventário, partilha de bens, divórcio e pensão alimentícia exigem estratégia para proteger seus direitos e os de sua família. Dr. Lucas Semim orienta o próximo passo.',
                btnText: 'FALAR SOBRE MEU CASO',
                btnClass: 'btn-cta-elite',
                icon: 'fas fa-people-roof',
                msg: 'Dr. Lucas, preciso de orientação sobre um assunto de família / sucessões (inventário, divórcio ou herança).'
            },
            {
                match: ['blindagem patrimonial', 'protecao de bens', 'holding familiar', 'planejamento patrimonial', 'protecao de patrimonio', 'sucessao patrimonial'],
                title: 'SEU PATRIMÔNIO ESTÁ PROTEGIDO?',
                desc: 'Planejamento patrimonial preventivo evita perdas em execuções, divórcios e disputas societárias. Dr. Lucas Semim estrutura a blindagem legal do seu patrimônio.',
                btnText: 'BLINDAR MEU PATRIMÔNIO',
                btnClass: 'btn-cta-elite',
                icon: 'fas fa-shield-halved',
                msg: 'Dr. Lucas, quero saber mais sobre blindagem patrimonial / proteção de bens.'
            },
            {
                match: ['golpe do pix', 'pix', 'fraude bancaria', 'estelionato', 'transferencia indevida', 'clonagem de cartao', 'golpe do whatsapp', 'engenharia social'],
                title: 'FOI VÍTIMA DO GOLPE DO PIX?',
                desc: 'Bancos podem ser responsabilizados por falhas de segurança em fraudes e golpes digitais. Dr. Lucas Semim avalia a possibilidade de ressarcimento do valor perdido.',
                btnText: 'RECUPERAR MEU DINHEIRO',
                btnClass: 'btn-cta-red',
                icon: 'fas fa-mobile-screen-button',
                msg: 'Dr. Lucas, fui vítima de um golpe do Pix / fraude bancária. Quero saber se posso recuperar o valor.'
            },
            {
                match: ['bets', 'apostas online', 'casa de apostas', 'jogo do tigrinho', 'apostas esportivas', 'plataforma de apostas', 'saque bloqueado'],
                title: 'PROBLEMA COM CASA DE APOSTAS (BETS)?',
                desc: 'Bloqueio de saque, conta encerrada indevidamente ou valores retidos por plataformas de apostas podem ser questionados judicialmente. Dr. Lucas Semim analisa seu caso.',
                btnText: 'RECUPERAR MEU SALDO',
                btnClass: 'btn-cta-elite',
                icon: 'fas fa-dice',
                msg: 'Dr. Lucas, estou com um problema em uma casa de apostas (bets) e preciso de orientação jurídica.'
            },
            {
                match: ['rmc', 'cartao consignado', 'reserva de margem consignavel', 'emprestimo consignado', 'desconto no beneficio', 'inss', 'desconto indevido na aposentadoria'],
                title: 'CARTÃO RMC/CONSIGNADO DESCONTANDO INDEVIDAMENTE?',
                desc: 'Cartões de crédito consignado (RMC) contratados sem informação clara consomem o benefício do aposentado por anos. Dr. Lucas Semim analisa a revisão e a devolução dos valores.',
                btnText: 'REVISAR MEU CONSIGNADO',
                btnClass: 'btn-cta-red',
                icon: 'fas fa-credit-card',
                msg: 'Dr. Lucas, percebi descontos indevidos de cartão RMC / consignado no meu benefício. Pode analisar?'
            },
            {
                match: ['usucapiao', 'posse do imovel', 'regularizacao de imovel', 'propriedade do imovel', 'terreno sem escritura', 'posse mansa e pacifica'],
                title: 'PODE TER DIREITO À USUCAPIÃO?',
                desc: 'Quem possui um imóvel de forma mansa, pacífica e ininterrupta por determinado tempo pode ter direito à propriedade. Dr. Lucas Semim avalia os requisitos do seu caso.',
                btnText: 'VERIFICAR USUCAPIÃO',
                btnClass: 'btn-cta-elite',
                icon: 'fas fa-house-chimney',
                msg: 'Dr. Lucas, quero saber se tenho direito à usucapião do imóvel que ocupo.'
            },
            {
                match: ['plano de saude', 'negativa de tratamento', 'reajuste abusivo', 'carencia', 'cirurgia negada', 'exame negado', 'home care', 'cobertura negada'],
                title: 'PLANO DE SAÚDE NEGOU SEU TRATAMENTO?',
                desc: 'Negativas de cirurgias, exames e medicamentos podem ser revertidas com liminar em poucos dias. Dr. Lucas Semim atua com urgência para garantir seu atendimento.',
                btnText: 'REVERTER NEGATIVA URGENTE',
                btnClass: 'btn-cta-red',
                icon: 'fas fa-notes-medical',
                msg: 'Dr. Lucas, meu plano de saúde negou um tratamento/procedimento. Preciso de ajuda urgente.'
            },
            {
                match: ['superendividamento', 'renegociacao de dividas', 'multiplas dividas', 'nome negativado', 'minimo existencial', 'lei do superendividamento'],
                title: 'ENDIVIDADO COM VÁRIAS DÍVIDAS?',
                desc: 'A Lei do Superendividamento (14.181/2021) permite renegociar todas as dívidas de uma vez, preservando o mínimo existencial da família. Dr. Lucas Semim monta seu plano de pagamento.',
                btnText: 'RENEGOCIAR MINHAS DÍVIDAS',
                btnClass: 'btn-cta-elite',
                icon: 'fas fa-scale-unbalanced',
                msg: 'Dr. Lucas, estou superendividado e quero saber sobre a repactuação de dívidas prevista em lei.'
            },
            {
                match: ['sabara', 'contagem', 'betim', 'neves', 'ibirite', 'barreiro', 'esmeraldas', 'caete', 'santa luzia', 'vespasiano', 'grande bh', 'belo horizonte'],
                title: 'ADVOGADO CÍVEL PERTO DE VOCÊ',
                desc: 'Dr. Lucas Semim atende em Sabará, BH e toda a Grande BH em causas cíveis. Fale agora e receba uma orientação inicial sobre o seu caso.',
                btnText: 'FALAR COM ADVOGADO',
                btnClass: 'btn-cta-elite',
                icon: 'fas fa-map-pin',
                msg: 'Dr. Lucas, preciso de um advogado cível próximo à minha região. Pode me atender?'
            }
        ],
        default: {
            title: 'PRECISA DE ORIENTAÇÃO JURÍDICA CÍVEL?',
            desc: 'Fale diretamente com Dr. Lucas Semim para uma análise preliminar do seu caso. Atendimento em Sabará, BH e Grande BH.',
            btnText: 'FALAR COM O ADVOGADO',
            btnClass: 'btn-cta-elite',
            icon: 'fab fa-whatsapp',
            msg: 'Dr. Lucas, estava lendo as informações do site e gostaria de uma consultoria sobre direito cível.'
        }
    },

    state: {
        match: null,
        container: null,
        reducedMotion: false
    },

    init() {
        try {
            this.state.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            this.state.container = document.querySelector(this.config.containerSelector);
            if (!this.state.container) return;

            const ctx = this.buildPageContext();
            this.state.match = this.findBestMatch(ctx);

            this.injectStyles();

            const banner = this.buildBanner(this.state.match);
            this.state.container.appendChild(banner);

            this.initReveal(banner);

            if (this.config.isDebug) {
                console.log(`[SmartCta Cível] Match: "${this.state.match.title}"`);
                console.log(`[SmartCta Cível] Contexto: "${ctx.slice(0, 80)}..."`);
            }
        } catch (error) {
            if (this.config.isDebug) console.error('[SmartCta Cível] Erro:', error);
        }
    },

    buildPageContext() {
        try {
            const h2s = [...document.querySelectorAll('article h2, .artigo-conteudo h2, .post-content h2, main h2')]
                .slice(0, 4).map(h => h.textContent).join(' ');

            return [
                window.location.pathname,
                document.title,
                document.querySelector('meta[name="keywords"]')?.content || '',
                document.querySelector('meta[name="description"]')?.content || '',
                document.querySelector('h1')?.textContent || '',
                h2s
            ].join(' ').toLowerCase()
             .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        } catch {
            return document.title.toLowerCase();
        }
    },

    scoreMatch(item, ctx) {
        if (item === this.config.default) return -1;
        return item.match.reduce((score, kw) => {
            const kwNorm = kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            if (!ctx.includes(kwNorm)) return score;
            return score + Math.max(1, Math.floor(kwNorm.length / 4));
        }, 0);
    },

    findBestMatch(ctx) {
        let best = null;
        let bestScore = 0;
        for (const item of this.config.db) {
            const score = this.scoreMatch(item, ctx);
            if (score > bestScore) {
                best = item;
                bestScore = score;
            }
        }
        return best || this.config.default;
    },

    injectStyles() {
        if (document.getElementById(this.config.styleId)) return;
        const style = document.createElement('style');
        style.id = this.config.styleId;
        style.textContent = `
            /* === SmartCta Cível === */
            .smart-cta-elite.cta-hidden {
                opacity: 0; transform: translateY(12px);
            }
            .smart-cta-elite.cta-visible {
                opacity: 1; transform: translateY(0);
                transition: opacity 0.5s ease, transform 0.4s ease;
            }
            @media (prefers-reduced-motion: reduce) {
                .smart-cta-elite.cta-hidden { opacity: 1; transform: none; }
                .smart-cta-elite.cta-visible { transition: none; }
            }
            .smart-cta-elite {
                background: linear-gradient(135deg, #111112 0%, #050505 100%);
                border: 1px solid rgba(212,175,55,0.2);
                border-left: 5px solid #D4AF37;
                border-radius: 8px;
                padding: 35px 30px; margin: 40px 0;
                display: flex; align-items: center;
                justify-content: space-between; gap: 30px;
                box-shadow: 0 15px 35px rgba(0,0,0,0.6);
                transition: border-color 0.35s ease, box-shadow 0.35s ease, transform 0.25s ease;
                position: relative; overflow: hidden;
            }
            .smart-cta-elite::after {
                content: ''; position: absolute; top: -50%; right: -10%;
                width: 150px; height: 200px;
                background: radial-gradient(circle, rgba(212,175,55,0.05) 0%, transparent 70%);
                transform: rotate(45deg); pointer-events: none;
            }
            .smart-cta-elite:hover {
                border-color: rgba(212,175,55,0.5);
                box-shadow: 0 15px 40px rgba(212,175,55,0.15);
                transform: translateY(-2px);
            }
            @media (prefers-reduced-motion: reduce) {
                .smart-cta-elite:hover { transform: none; }
            }
            .cta-content-elite { flex: 1; }
            .cta-title-elite {
                font-family: 'Teko', sans-serif; color: #E8E8E8;
                font-size: 2.2rem; line-height: 1.1;
                margin: 0 0 8px; letter-spacing: 1px;
            }
            .cta-desc-elite {
                font-family: 'Lato', sans-serif; color: #C8C8C8;
                font-size: 1.05rem; margin: 0; line-height: 1.5;
            }
            .btn-cta-elite {
                background: linear-gradient(45deg, #B8860B, #D4AF37); color: #050505;
                font-family: 'Teko', sans-serif; font-size: 1.4rem;
                letter-spacing: 1px; font-weight: 600;
                padding: 12px 30px; border-radius: 4px; text-decoration: none;
                display: inline-flex; align-items: center; gap: 10px;
                box-shadow: 0 5px 15px rgba(212,175,55,0.3);
                transition: background 0.25s, box-shadow 0.25s, transform 0.2s;
                white-space: nowrap; flex-shrink: 0;
            }
            .btn-cta-elite:hover {
                background: #F0C040; color: #050505;
                box-shadow: 0 8px 20px rgba(240,192,64,0.3);
            }
            .btn-cta-elite:focus-visible { outline: 2px solid #D4AF37; outline-offset: 3px; }
            @media (prefers-reduced-motion: reduce) {
                .btn-cta-elite:hover { transform: none; }
            }
            .btn-cta-red {
                background: linear-gradient(180deg, #8b0000 0%, #5c0000 100%);
                color: #E8E8E8; border: 1px solid rgba(255,77,77,0.5);
                box-shadow: 0 5px 15px rgba(255,77,77,0.3);
            }
            .btn-cta-red:hover {
                background: #a31a1a; color: #E8E8E8;
                box-shadow: 0 8px 20px rgba(255,77,77,0.5);
            }
            @media (max-width: 768px) {
                .smart-cta-elite {
                    flex-direction: column; text-align: center;
                    padding: 25px 20px; gap: 20px;
                    border-left: 1px solid rgba(212,175,55,0.2);
                    border-top: 4px solid #D4AF37;
                }
                .cta-title-elite { font-size: 1.8rem; }
                .btn-cta-elite { width: 100%; justify-content: center; }
            }
        `;
        document.head.appendChild(style);
    },

    buildBanner(cta) {
        const url = this.buildWhatsAppUrl(cta);

        const box = document.createElement('div');
        box.className = 'smart-cta-elite cta-hidden';

        const content = document.createElement('div');
        content.className = 'cta-content-elite';

        const title = document.createElement('h4');
        title.className = 'cta-title-elite';
        title.textContent = cta.title;

        const desc = document.createElement('p');
        desc.className = 'cta-desc-elite';
        desc.textContent = cta.desc;

        content.appendChild(title);
        content.appendChild(desc);

        const btn = this.buildBtn(cta, url);

        box.appendChild(content);
        box.appendChild(btn);

        return box;
    },

    buildBtn(cta, url) {
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.className = `btn-cta-elite ${cta.btnClass}`;
        a.setAttribute('aria-label', `${cta.btnText} — WhatsApp Dr. Lucas Semim`);

        const icon = document.createElement('i');
        icon.className = cta.icon;
        icon.setAttribute('aria-hidden', 'true');

        a.appendChild(icon);
        a.appendChild(document.createTextNode(` ${cta.btnText}`));

        a.addEventListener('click', () => {
            this.trackEvent('smart_cta_click', cta.title);
        });

        return a;
    },

    buildWhatsAppUrl(cta) {
        const campanha = new URLSearchParams(window.location.search).get('utm_campaign');
        const msg = campanha ? `${cta.msg}\n\n_(Origem: ${campanha})_` : cta.msg;
        return `${this.config.waBase}${this.config.whatsapp}?text=${encodeURIComponent(msg)}`;
    },

    initReveal(bannerEl) {
        if (this.state.reducedMotion) {
            bannerEl.classList.remove('cta-hidden');
            bannerEl.classList.add('cta-visible');
            return;
        }

        const obs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.remove('cta-hidden');
                    entry.target.classList.add('cta-visible');
                    obs.unobserve(entry.target);
                    this.trackEvent('smart_cta_shown', this.state.match?.title || 'default');
                }
            });
        }, { threshold: 0.15 });

        obs.observe(bannerEl);
    },

    trackEvent(action, label) {
        try {
            if (typeof gtag !== 'function') return;
            gtag('event', action, {
                event_category: 'Smart_CTA_Civel',
                event_label: label.slice(0, 100),
                pagina_origem: window.location.pathname,
                campanha: new URLSearchParams(window.location.search).get('utm_campaign') || 'organico'
            });
        } catch { }
    }
};

// Migrado de DOMContentLoaded para civelReady (11/09/2026): este script e injetado
// dinamicamente via <script src>, entao o DOMContentLoaded pode ja ter disparado
// antes dele chegar via rede (comum em conexao lenta) — nesse caso o listener antigo
// nunca rodava e o banner simplesmente nao aparecia, sem erro no console.
window.civelReady(() => window.SmartCta.init());
