/* =========================================================== */
/* === ARQUIVO: codeleicivel/civel-search.js (Neural Spotlight) === */
/* === FUNÇÃO: Busca Instantânea Tipo Mac/Spotlight === */
/* =========================================================== */

window.civelReady(function() {
    
    // BASE DE DADOS NEURAL (Mapeamento do Site)
    const siteMap = [
        { title: "Holding Familiar", url: "blindagem-patrimonial.html", icon: "🏛️", desc: "Proteção de patrimônio e sucessão." },
        { title: "Juros Abusivos", url: "bancario-juros.html", icon: "🏦", desc: "Revisão de contratos bancários." },
        { title: "Busca e Apreensão", url: "bancario-juros.html", icon: "🚗", desc: "Defesa urgente de veículos." },
        { title: "Execução de Títulos", url: "execucao-cobranca.html", icon: "💰", desc: "Recuperação de ativos e cobrança." },
        { title: "Divórcio e Família", url: "familia-sucessoes.html", icon: "💍", desc: "Separação, guarda e alimentos." },
        { title: "Erro Médico", url: "erro-medico.html", icon: "🏥", desc: "Indenizações por falha profissional." },
        { title: "Contratos", url: "contratos-negocios.html", icon: "✒️", desc: "Análise e elaboração jurídica." },
        { title: "Área do Cliente", url: "painel-cliente.html", icon: "🔐", desc: "Login seguro no sistema." },
        { title: "Sala de Reunião", url: "sala-reuniao.html", icon: "📹", desc: "Videoconferência." },
        { title: "Site Criminal", url: "https://lucassemim.adv.br", icon: "⚖️", desc: "Acesso ao núcleo criminal." }
    ];

    // INJEÇÃO DO HTML DO SPOTLIGHT
    const modalHTML = `
        <div id="neural-search-overlay">
            <div class="neural-search-box">
                <div class="ns-header">
                    <span class="ns-icon">🔍</span>
                    <input type="text" id="ns-input" placeholder="O que você procura? (Ex: Divórcio, Juros...)" autocomplete="off">
                    <span class="ns-esc">ESC</span>
                </div>
                <div class="ns-results" id="ns-results">
                    </div>
                <div class="ns-footer">
                    Dr. Lucas Semim Intelligence
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // ESTILOS (GLASS DARK)
    const style = document.createElement('style');
    style.innerHTML = `
        #neural-search-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100vh;
            background: rgba(0,0,0,0.85); backdrop-filter: blur(8px);
            z-index: 15000; display: none; justify-content: center; align-items: flex-start;
            padding-top: 15vh; opacity: 0; transition: opacity 0.2s;
        }
        #neural-search-overlay.active { display: flex; opacity: 1; }
        
        .neural-search-box {
            width: 100%; max-width: 600px; background: #111;
            border: 1px solid #333; border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.8);
            overflow: hidden; transform: scale(0.95); transition: transform 0.2s;
        }
        #neural-search-overlay.active .neural-search-box { transform: scale(1); }

        .ns-header {
            display: flex; align-items: center; padding: 20px;
            border-bottom: 1px solid #222;
        }
        .ns-icon { font-size: 1.5rem; color: #666; margin-right: 15px; }
        #ns-input {
            flex: 1; background: transparent; border: none; color: #fff;
            font-size: 1.2rem; font-family: 'Lato'; outline: none;
        }
        .ns-esc {
            font-size: 0.7rem; color: #444; border: 1px solid #333;
            padding: 2px 6px; border-radius: 4px; font-family: sans-serif;
        }

        .ns-results { max-height: 400px; overflow-y: auto; padding: 10px; }
        .ns-item {
            display: flex; align-items: center; padding: 12px;
            border-radius: 8px; cursor: pointer; transition: 0.2s;
            text-decoration: none; color: #ddd;
        }
        .ns-item:hover, .ns-item.selected { background: #1a1a1a; }
        .ns-item-icon { font-size: 1.5rem; margin-right: 15px; }
        .ns-item-info h4 { margin: 0; font-size: 1rem; color: #fff; font-family:'Teko'; font-weight:normal; }
        .ns-item-info p { margin: 0; font-size: 0.8rem; color: #666; }
        
        .ns-footer { background: #0a0a0a; padding: 8px; text-align: right; color: #333; font-size: 0.7rem; font-family: 'Fira Code'; }
    `;
    document.head.appendChild(style);

    // LÓGICA
    const overlay = document.getElementById('neural-search-overlay');
    const input = document.getElementById('ns-input');
    const resultsContainer = document.getElementById('ns-results');

    function openSearch() {
        overlay.classList.add('active');
        input.value = '';
        renderResults(siteMap); // Mostra tudo inicialmente
        setTimeout(() => input.focus(), 100);
    }

    function closeSearch() {
        overlay.classList.remove('active');
    }

    function renderResults(items) {
        resultsContainer.innerHTML = '';
        if (items.length === 0) {
            resultsContainer.innerHTML = '<div style="padding:20px; text-align:center; color:#555;">Nenhum resultado encontrado.</div>';
            return;
        }
        items.forEach(item => {
            const el = document.createElement('a');
            el.className = 'ns-item';
            el.href = item.url;
            el.innerHTML = `
                <span class="ns-item-icon">${item.icon}</span>
                <div class="ns-item-info">
                    <h4>${item.title}</h4>
                    <p>${item.desc}</p>
                </div>
            `;
            resultsContainer.appendChild(el);
        });
    }

    // EVENTOS
    // Esta e a busca OFICIAL ativada por Ctrl+K/Cmd+K/Escape (2026-09-10).
    // platinum-ui.js tinha seu proprio listener de keydown duplicado
    // para o mesmo atalho, abrindo #platinum-search-overlay ao mesmo
    // tempo que este overlay (#neural-search-overlay) -- os dois
    // modais ficavam sobrepostos. O listener duplicado foi removido
    // de platinum-ui.js; aquele arquivo continua responsavel apenas
    // pelos "Efeitos 3D e Design" (ver comentario em civel-core.js),
    // e sua busca (togglePlatinumSearch) segue acessivel pelo botao
    // flutuante ".btn-search-float", so que sem o atalho de teclado.
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            openSearch();
        }
        if (e.key === 'Escape') closeSearch();
    });

    // Clicar fora fecha
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeSearch();
    });

    // Filtragem em Tempo Real
    input.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = siteMap.filter(item => 
            item.title.toLowerCase().includes(term) || 
            item.desc.toLowerCase().includes(term)
        );
        renderResults(filtered);
    });
    
    // Expõe função global para botões de busca
    window.toggleSearch = openSearch;
});