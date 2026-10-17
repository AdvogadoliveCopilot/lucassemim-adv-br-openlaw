/* =========================================================== */
/* === FICHEIRO: js/serie-penal-master.js (SeriePenalMaster V3) */
/* === FUNÇÃO: Widget de Autoridade com Design Tropa de Choque */
/* === DATA: 11/06/2026                                    === */
/* =========================================================== */

window.SeriePenalMaster = {
    config: {
        containerId: 'container-serie-penal-master',
        whatsapp: '[https://wa.me/5531989420094](https://wa.me/5531989420094)',
        episodes: [
            { ep: 1,  titulo: "Maria da Penha",          desc: "A falsidade ideológica no divórcio.",                    url: "falsa-acusacao-violencia-domestica.html",                             icon: "fas fa-female" },
            { ep: 2,  titulo: "Falso Flagrante",          desc: "A revista veicular abusiva na blitz.",                  url: "blitz-bafometro-faca-carro-multa-suspensao-cnh.html",                  icon: "fas fa-car-crash" },
            { ep: 3,  titulo: "O Perigo do SEEU",         desc: "Erro no cálculo da pena.",                              url: "reincidencia-generica-especifica-calculo-pena-stj.html",               icon: "fas fa-calculator" },
            { ep: 4,  titulo: "Prisão Preventiva",        desc: "Como revogar a prisão ilegal.",                         url: "revogacao-prisao-preventiva.html",                                     icon: "fas fa-user-lock" },
            { ep: 5,  titulo: "Tribunal do Júri",         desc: "A Tropa de Choque no plenário.",                        url: "tribunal-do-juri.html",                                                icon: "fas fa-gavel" },
            { ep: 6,  titulo: "Crimes de Colarinho",      desc: "GAECO e as megaoperações.",                             url: "simbiose-do-mal-corrupcao-policial-gaeco-extorsao.html",               icon: "fas fa-briefcase" },
            { ep: 7,  titulo: "Habeas Corpus Supremo",    desc: "Derrubando ilegalidades no STJ e STF.",                 url: "habeas-corpus-supremo.html",                                           icon: "fas fa-scale-balanced" },
            { ep: 8,  titulo: "Falso Rompimento",         desc: "Como contestar falha na tornozeleira.",                 url: "falsa-acusacao-medida-protetiva-tornozeleira-eletronica-divorcio.html", icon: "fas fa-triangle-exclamation" },
            { ep: 9,  titulo: "Súmula Vinculante",        desc: "A lei acima do juiz.",                                  url: "sumula-vinculante.html",                                               icon: "fas fa-landmark" },
            { ep: 10, titulo: "Direito de Visita",        desc: "A ilegalidade na Saidinha de Páscoa.",                  url: "stf-saidinha-marco-2026-juiz-execucao-penal-ilegal.html",              icon: "fas fa-door-open" },
            { ep: 11, titulo: "Associação Criminal",      desc: "Denúncia Genérica e Arrastão do GAECO.",                url: "simbiose-do-mal-corrupcao-policial-gaeco-extorsao.html",               icon: "fas fa-users" },
            { ep: 12, titulo: "Pena Máxima",             desc: "Quando o MP frauda a calculadora penal.",                url: "reincidencia-generica-especifica-calculo-pena-stj.html",               icon: "fas fa-lock" },
            { ep: 13, titulo: "Interrogatório Ilegal",   desc: "Como anular provas sob coação.",                         url: "interrogatorio-ilegal.html",                                           icon: "fas fa-microphone-slash" },
            { ep: 14, titulo: "Tráfico de Drogas",       desc: "Quando o usuário é tratado como traficante.",            url: "trafico-de-drogas.html",                                               icon: "fas fa-pills" },
            { ep: 15, titulo: "Lavagem de Dinheiro",     desc: "Rastreamento de cripto e ocultação de bens.",            url: "lavagem-de-dinheiro.html",                                             icon: "fas fa-coins" },
            { ep: 16, titulo: "Busca e Apreensão",       desc: "A nulidade do mandado genérico na empresa.",             url: "busca-e-apreensao.html",                                               icon: "fas fa-magnifying-glass" },
            { ep: 17, titulo: "Prisão de Servidor",      desc: "Responsabilidade objetiva do GAECO.",                    url: "simbiose-do-mal-corrupcao-policial-gaeco-extorsao.html",               icon: "fas fa-user-tie" },
            { ep: 18, titulo: "Recusa do Bafômetro",     desc: "A multa de 3 mil reais é nula.",                         url: "blitz-bafometro-faca-carro-multa-suspensao-cnh.html",                  icon: "fas fa-ban" },
            { ep: 19, titulo: "Falsa Acusação",          desc: "O plano de 'fundo de quintal' no divórcio.",             url: "falsa-acusacao-medida-protetiva-tornozeleira-eletronica-divorcio.html", icon: "fas fa-comment-slash" },
            { ep: 20, titulo: "Máfia de Distintivo",     desc: "Empresário extorquido e chantagem policial.",            url: "mafia-de-distintivo-extorsao-policial-operacao-gaeco-stj.html",        icon: "fas fa-hand-holding-dollar", locked: true },
            { ep: 21, titulo: "Poder de Investigação",   desc: "GAECO e o abuso da caneta do promotor.",                 url: "simbiose-do-mal-corrupcao-policial-gaeco-extorsao.html",               icon: "fas fa-pen" },
            { ep: 22, titulo: "Progressão Ilegal (40%)", desc: "O direito dos reincidentes genéricos.",                  url: "reincidencia-generica-especifica-calculo-pena-stj.html",               icon: "fas fa-unlock" },
            { ep: 23, titulo: "Crimes de Trânsito",      desc: "Dano moral e suspensão da CNH.",                         url: "crimes-de-transito.html",                                              icon: "fas fa-id-card" },
            { ep: 24, titulo: "Lavagem de Criptoativos", desc: "Quando o crime usa a tecnologia.",                       url: "lavagem-de-criptoativos.html",                                         icon: "fab fa-bitcoin" },
            { ep: 25, titulo: "OAB-MG 222.539",          desc: "A força técnica do Dr. Lucas Semim.",                    url: "#sobre",                                                               icon: "fas fa-award" },
            { ep: 26, titulo: "Maria da Penha",          desc: "A contestação técnica da medida protetiva.",             url: "falsa-acusacao-medida-protetiva-tornozeleira-eletronica-divorcio.html", icon: "fas fa-id-badge" },
            { ep: 27, titulo: "Flagrante em Blitz",      desc: "Como contestar o Auto de Infração.",                     url: "blitz-bafometro-faca-carro-multa-suspensao-cnh.html",                  icon: "fas fa-triangle-exclamation" },
            { ep: 28, titulo: "Cálculo de Pena",         desc: "Detração da pena e anos devolvidos.",                    url: "reincidencia-generica-especifica-calculo-pena-stj.html",               icon: "fas fa-hourglass-half" },
            { ep: 29, titulo: "Revogação da Preventiva", desc: "A ilegalidade na fundamentação genérica.",                url: "revogacao-da-preventiva.html",                                         icon: "fas fa-key" },
            { ep: 30, titulo: "Operações GAECO",         desc: "Como trancar inquéritos baseados em extorsão.",           url: "simbiose-do-mal-corrupcao-policial-gaeco-extorsao.html",               icon: "fas fa-folder-open" },
            { ep: 31, titulo: "Súmulas STJ/STF",         desc: "A força técnica nos tribunais superiores.",               url: "sumulas-stj-stf.html",                                                 icon: "fas fa-book-open" },
            { ep: 32, titulo: "Saidinha de Páscoa",      desc: "O que o Juiz da Execução Penal esconde.",                url: "stf-saidinha-marco-2026-juiz-execucao-penal-ilegal.html",              icon: "fas fa-door-closed" },
            { ep: 33, titulo: "Megaoperações",           desc: "A 'Pesca de Arrasto' do GAECO.",                         url: "simbiose-do-mal-corrupcao-policial-gaeco-extorsao.html",               icon: "fas fa-filter" },
            { ep: 34, titulo: "SEEU / Fraude",           desc: "Quando o sistema prisional frauda a matemática.",         url: "reincidencia-generica-especifica-calculo-pena-stj.html",               icon: "fas fa-ban" },
            { ep: 35, titulo: "Crimes Funcionais",       desc: "Defesa de servidores públicos de elite.",                 url: "simbiose-do-mal-corrupcao-policial-gaeco-extorsao.html",               icon: "fas fa-shield-halved" },
            { ep: 36, titulo: "Atipicidade da Faca",     desc: "Quando o policial blefa sobre 'arma branca'.",           url: "blitz-bafometro-faca-carro-multa-suspensao-cnh.html",                  icon: "fas fa-utensils" },
            { ep: 37, titulo: "Advocacia Auditada",      desc: "Rastreamento tático de provas digitais.",                 url: "defesa-estrategica.html",                                              icon: "fas fa-eye" },
            { ep: 38, titulo: "Revisão Criminal",        desc: "Anulação de condenações transitadas em julgado.",         url: "reincidencia-generica-especifica-calculo-pena-stj.html",               icon: "fas fa-clock-rotate-left" },
            { ep: 39, titulo: "Medida Protetiva",        desc: "Uso abusivo para forçar acordo no divórcio.",             url: "falsa-acusacao-medida-protetiva-tornozeleira-eletronica-divorcio.html", icon: "fas fa-hand" },
            { ep: 40, titulo: "Tropa de Choque no Júri", desc: "Defesa implacável no plenário em Sabará.",               url: "tribunal-do-juri.html",                                                icon: "fas fa-microphone" },
            { ep: 41, titulo: "Operações da PF",         desc: "Crimes de Colarinho e Abuso de Autoridade.",              url: "busca-e-apreensao.html",                                               icon: "fas fa-magnifying-glass-plus" },
            { ep: 42, titulo: "Reincidência Genérica",   desc: "Como a Matemática do STJ Pode Antecipar sua Soltura.",   url: "reincidencia-generica-especifica-calculo-pena-stj.html",               icon: "fas fa-greater-than" },
            { ep: 43, titulo: "Interrogatório Coacto",   desc: "Como anular a confissão sob coação.",                     url: "interrogatorio-ilegal.html",                                           icon: "fas fa-volume-xmark" },
            { ep: 44, titulo: "Trancamento do TCO",      desc: "Defesa agressiva contra Termo abusivo de Blitz.",         url: "blitz-bafometro-faca-carro-multa-suspensao-cnh.html",                  icon: "fas fa-circle-xmark" },
            { ep: 45, titulo: "Falso Rompimento",        desc: "Como contestar 'falso rompimento' da tornozeleira.",      url: "falsa-acusacao-medida-protetiva-tornozeleira-eletronica-divorcio.html", icon: "fas fa-satellite-dish" },
            { ep: 46, titulo: "Súmula Vinculante",       desc: "Derrubando a caneta cega do promotor.",                   url: "simbiose-do-mal-corrupcao-policial-gaeco-extorsao.html",               icon: "fas fa-print" },
            { ep: 47, titulo: "Pena Máxima / Abuso",     desc: "Quando o MP frauda a calculadora.",                       url: "reincidencia-generica-especifica-calculo-pena-stj.html",               icon: "fas fa-plus-circle" },
            { ep: 48, titulo: "Maria da Penha",          desc: "A Tropa de Choque blindando a sua honra.",                url: "falsa-acusacao-medida-protetiva-tornozeleira-eletronica-divorcio.html", icon: "fas fa-hand-fist" },
            { ep: 49, titulo: "Blitz / Faca",            desc: "A Tropa de Choque jurídica contra extorsão na Blitz.",   url: "blitz-bafometro-faca-carro-multa-suspensao-cnh.html",                  icon: "fas fa-shield-halved" },
            { ep: 50, titulo: "Reincidência Específica", desc: "A Tropa de Choque no STJ contra o aumento abusivo.",     url: "reincidencia-generica-especifica-calculo-pena-stj.html",               icon: "fas fa-percent" },
            { ep: 51, titulo: "Medida Protetiva / STF",  desc: "Uso abusivo de tornozeleira eletrônica.",                 url: "falsa-acusacao-medida-protetiva-tornozeleira-eletronica-divorcio.html", icon: "fas fa-clock" },
            { ep: 52, titulo: "Operações / STF",         desc: "A 'Simbiose do Mal' e o abuso de poder.",                url: "simbiose-do-mal-corrupcao-policial-gaeco-extorsao.html",               icon: "fas fa-cloud" },
            { ep: 53, titulo: "Interrogatório / STF",    desc: "Como anular provas ilícitas em Brasília.",                url: "habeas-corpus-supremo.html",                                           icon: "fas fa-landmark" },
            { ep: 54, titulo: "Saidinha / STF",          desc: "O que o Juiz da Execução está escondendo de você.",      url: "stf-saidinha-marco-2026-juiz-execucao-penal-ilegal.html",              icon: "fas fa-box" },
            { ep: 55, titulo: "Reincidência / STF",      desc: "A matemática de elite no STF.",                          url: "reincidencia-generica-especifica-calculo-pena-stj.html",               icon: "fas fa-percent" }
        ]
    },

    state: {
        base: '',
        currentUrl: '',
        reducedMotion: false,
        filterQuery: ''
    },

    init() {
        this.state.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.state.base = this.getBasePath();
        this.state.currentUrl = window.location.pathname.toLowerCase();

        const target = document.getElementById(this.config.containerId);
        if (!target) return;

        this.injectStyles();
        this.buildWidget(target);
        this.initReveal();

        if (location.hostname !== 'lucassemim.adv.br') {
            const total = this.config.episodes.length;
            const unlocked = this.config.episodes.filter(e => !e.locked).length;
            console.log(`[SeriePenalMaster V3] ${unlocked}/${total} eps · base: "${this.state.base}"`);
        }
    },

    getBasePath() {
        const path = window.location.pathname;
        const isDir = path.endsWith('/') || !path.split('/').pop().includes('.');
        const parts = path.split('/').filter(Boolean);
        const depth = isDir ? parts.length : Math.max(0, parts.length - 1);
        return depth === 0 ? '' : '../'.repeat(depth);
    },

    injectStyles() {
        if (document.getElementById('serie-penal-styles')) return;
        const style = document.createElement('style');
        style.id = 'serie-penal-styles';
        style.textContent = `
            #container-serie-penal-master {
                opacity: 0; transform: translateY(10px);
                transition: opacity 0.5s ease, transform 0.4s ease;
            }
            #container-serie-penal-master.serie-visible {
                opacity: 1; transform: translateY(0);
            }
            @media (prefers-reduced-motion: reduce) {
                #container-serie-penal-master { opacity: 1; transform: none; transition: none; }
            }
            .sidebar-serie-box {
                background: rgba(15, 15, 15, 0.6);
                backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
                border: 1px solid rgba(212, 175, 55, 0.2);
                border-top: 4px solid #d4af37;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 30px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.5);
            }
            .serie-header-elite {
                font-family: 'Teko', sans-serif;
                color: #fff;
                font-size: 1.6rem;
                letter-spacing: 1px;
                margin-bottom: 15px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .serie-header-elite i { color: #d4af37; }
            .serie-penal-list { list-style: none; margin: 0; padding: 0; max-height: 400px; overflow-y: auto; overflow-x: hidden; }
            .serie-penal-list::-webkit-scrollbar { width: 6px; }
            .serie-penal-list::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); border-radius: 4px; }
            .serie-penal-list::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.4); border-radius: 4px; }
            .serie-penal-list::-webkit-scrollbar-thumb:hover { background: #d4af37; }
            
            .serie-ep-item { margin-bottom: 8px; }
            .episode-link-serie {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                padding: 10px;
                text-decoration: none;
                border-bottom: 1px solid rgba(255,255,255,0.05);
                transition: background 0.2s;
            }
            .episode-link-serie:hover { background: rgba(212,175,55,0.08); }
            .episode-link-serie.locked { opacity: 0.6; cursor: not-allowed; }
            .epi-icon-group {
                background: rgba(212,175,55,0.1);
                color: #d4af37;
                width: 32px; height: 32px;
                display: flex; align-items: center; justify-content: center;
                border-radius: 4px; flex-shrink: 0;
            }
            .locked .epi-icon-group { background: rgba(255,50,50,0.1); color: #ff4d4d; }
            .text-group-episode { display: flex; flex-direction: column; }
            .episode-title-serie { font-family: 'Teko', sans-serif; color: #fff; font-size: 1.15rem; letter-spacing: 0.5px; line-height: 1.1; margin-bottom: 2px; }
            .episode-desc-serie { font-family: 'Lato', sans-serif; color: #aaa; font-size: 0.8rem; line-height: 1.3; }
            .lock-status { display: inline-flex; align-items: center; gap: 4px; font-family: 'Lato', sans-serif; font-size: 0.7rem; color: #ff4d4d; margin-top: 4px; }
            
            .serie-search-wrapper { position: relative; margin-bottom: 14px; }
            .serie-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #666; font-size: 0.85rem; pointer-events: none; }
            .serie-search-input {
                width: 100%; background: rgba(255,255,255,0.04);
                border: 1px solid rgba(212,175,55,0.2);
                border-radius: 6px; padding: 8px 12px 8px 34px;
                color: #ddd; font-family: 'Lato', sans-serif; font-size: 0.88rem;
                outline: none; transition: border-color 0.2s;
            }
            .serie-search-input:focus { border-color: rgba(212,175,55,0.5); }
            .serie-search-input::placeholder { color: #555; }
            #serie-no-result { display: none; text-align: center; color: #666; font-family: 'Lato', sans-serif; font-size: 0.85rem; padding: 16px 0; }
            
            .serie-progress-wrapper { margin-bottom: 16px; }
            .serie-progress-label { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-family: 'Lato', sans-serif; color: #888; font-size: 0.8rem; }
            .text-group-gold { color: #d4af37; font-weight: 700; font-family: 'Teko', sans-serif; font-size: 1.1rem; }
            .serie-progress-track { height: 4px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden; }
            .serie-progress-fill { height: 100%; background: linear-gradient(90deg, #d4af37, #aa8c2c); border-radius: 4px; transition: width 0.6s ease; }
            
            .episode-link-serie.current { background: rgba(212,175,55,0.06); border-radius: 6px; padding-left: 8px; }
            .serie-current-badge { display: inline-block; font-family: 'Lato', sans-serif; font-size: 0.68rem; font-weight: 700; color: #d4af37; letter-spacing: 0.5px; margin-top: 3px; }
        `;
        document.head.appendChild(style);
    },

    buildWidget(target) {
        const box = document.createElement('div');
        box.className = 'sidebar-serie-box';

        box.appendChild(this.buildHeader());

        const total = this.config.episodes.length;
        const unlocked = this.config.episodes.filter(e => !e.locked).length;
        box.appendChild(this.buildProgressBar(unlocked, total));
        
        box.appendChild(this.buildSearchInput());
        box.appendChild(this.buildList());

        target.appendChild(box);
    },

    buildHeader() {
        const header = document.createElement('div');
        header.className = 'serie-header-elite';
        
        const icon = document.createElement('i');
        icon.className = 'fas fa-list-ul';
        icon.setAttribute('aria-hidden', 'true');
        
        header.appendChild(icon);
        header.appendChild(document.createTextNode(' SÉRIE PENAL MASTER'));
        
        return header;
    },

    buildProgressBar(unlocked, total) {
        const pct = Math.round((unlocked / total) * 100);

        const wrapper = document.createElement('div');
        wrapper.className = 'serie-progress-wrapper';

        const label = document.createElement('div');
        label.className = 'serie-progress-label';

        const labelText = document.createElement('span');
        labelText.textContent = 'Episódios liberados';

        const labelCount = document.createElement('span');
        labelCount.className = 'text-group-gold';
        labelCount.textContent = `${unlocked}/${total}`;

        label.appendChild(labelText);
        label.appendChild(labelCount);

        const track = document.createElement('div');
        track.className = 'serie-progress-track';

        const fill = document.createElement('div');
        fill.className = 'serie-progress-fill';
        fill.style.width = `${pct}%`;
        fill.setAttribute('role', 'progressbar');
        fill.setAttribute('aria-valuenow', String(unlocked));
        fill.setAttribute('aria-valuemin', '0');
        fill.setAttribute('aria-valuemax', String(total));
        fill.setAttribute('aria-label', `${unlocked} de ${total} episódios liberados`);

        track.appendChild(fill);
        wrapper.appendChild(label);
        wrapper.appendChild(track);
        return wrapper;
    },

    buildSearchInput() {
        const wrapper = document.createElement('div');
        wrapper.className = 'serie-search-wrapper';

        const input = document.createElement('input');
        input.type = 'search';
        input.className = 'serie-search-input';
        input.placeholder = 'Buscar episódio... (ex: tráfico, júri)';
        input.setAttribute('aria-label', 'Filtrar episódios da Série Penal Master');

        input.addEventListener('input', () => {
            this.state.filterQuery = input.value.toLowerCase().trim();
            this.filterEpisodes(this.state.filterQuery);
        });

        const icon = document.createElement('i');
        icon.className = 'fas fa-magnifying-glass serie-search-icon';
        icon.setAttribute('aria-hidden', 'true');

        wrapper.appendChild(icon);
        wrapper.appendChild(input);
        return wrapper;
    },

    buildList() {
        const ul = document.createElement('ul');
        ul.className = 'serie-penal-list';
        ul.setAttribute('role', 'list');

        this.config.episodes.forEach(ep => {
            ul.appendChild(this.buildEpisode(ep));
        });

        const noResult = document.createElement('div');
        noResult.id = 'serie-no-result';
        noResult.textContent = 'Nenhum episódio encontrado.';
        ul.appendChild(noResult);

        return ul;
    },

    buildEpisode(ep) {
        const isLocked = !!ep.locked;
        const isCurrent = !isLocked && this.state.currentUrl && ep.url !== '#' && this.state.currentUrl.includes(ep.url.replace('.html', ''));

        const li = document.createElement('li');
        li.className = 'serie-ep-item';
        li.setAttribute('data-titulo', ep.titulo.toLowerCase());
        li.setAttribute('data-desc', ep.desc.toLowerCase());
        li.setAttribute('role', 'listitem');

        const a = document.createElement('a');
        a.href = isLocked ? '#' : `${this.state.base}${ep.url}`;
        a.className = [
            'episode-link-serie',
            isLocked ? 'locked' : '',
            isCurrent ? 'current' : ''
        ].filter(Boolean).join(' ');

        if (isLocked) {
            a.setAttribute('aria-disabled', 'true');
            a.setAttribute('tabindex', '-1');
        }
        a.setAttribute('aria-label', `Episódio ${ep.ep}: ${ep.titulo} — ${ep.desc}`);

        const iconGroup = document.createElement('div');
        iconGroup.className = 'epi-icon-group';
        iconGroup.setAttribute('aria-hidden', 'true');
        const icon = document.createElement('i');
        icon.className = isLocked ? 'fas fa-lock' : ep.icon;
        iconGroup.appendChild(icon);

        const textGroup = document.createElement('div');
        textGroup.className = 'text-group-episode';

        const titleSpan = document.createElement('span');
        titleSpan.className = 'episode-title-serie';
        titleSpan.textContent = `EP ${ep.ep}: ${ep.titulo}`;

        const descSpan = document.createElement('span');
        descSpan.className = 'episode-desc-serie';
        descSpan.textContent = ep.desc;

        textGroup.appendChild(titleSpan);
        textGroup.appendChild(descSpan);

        if (isLocked) {
            textGroup.appendChild(this.buildLockedIndicator());
        }

        if (isCurrent) {
            const currentBadge = document.createElement('span');
            currentBadge.className = 'serie-current-badge';
            currentBadge.textContent = '● VOCÊ ESTÁ AQUI';
            textGroup.appendChild(currentBadge);
        }

        a.appendChild(iconGroup);
        a.appendChild(textGroup);

        if (!isLocked) {
            a.addEventListener('click', () => this.trackEvent('serie_ep_click', ep.ep, ep.titulo));
        }

        li.appendChild(a);
        return li;
    },

    buildLockedIndicator() {
        const span = document.createElement('span');
        span.className = 'lock-status';
        const icon = document.createElement('i');
        icon.className = 'fas fa-hourglass-start';
        icon.setAttribute('aria-hidden', 'true');
        span.appendChild(icon);
        span.appendChild(document.createTextNode(' Conteúdo em Auditoria'));
        return span;
    },

    filterEpisodes(query) {
        const items = document.querySelectorAll('.serie-ep-item');
        let visibleCount = 0;

        items.forEach(item => {
            const titulo = item.getAttribute('data-titulo') || '';
            const desc = item.getAttribute('data-desc') || '';
            const match = !query || titulo.includes(query) || desc.includes(query);
            item.style.display = match ? '' : 'none';
            if (match) visibleCount++;
        });

        const noResult = document.getElementById('serie-no-result');
        if (noResult) noResult.style.display = visibleCount === 0 ? 'block' : 'none';
    },

    initReveal() {
        const container = document.getElementById(this.config.containerId);
        if (!container) return;

        if (this.state.reducedMotion) {
            container.classList.add('serie-visible');
            return;
        }

        const obs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('serie-visible');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.05 });

        obs.observe(container);
    },

    trackEvent(action, ep, titulo) {
        try {
            if (typeof gtag !== 'function') return;
            gtag('event', action, {
                event_category: 'Serie_Penal_Master',
                event_label: `EP${ep}: ${titulo}`,
                ep_numero: ep,
                ep_titulo: titulo,
                pagina_origem: window.location.pathname
            });
        } catch { }
    }
};

document.addEventListener('DOMContentLoaded', () => window.SeriePenalMaster.init());