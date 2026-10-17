/* =========================================================== */
/* === ARQUIVO: codeleicivel/platinum-ui.js === */
/* === FUNÇÃO: UX Premium, Busca Executiva & Micro-Interações === */
/* =========================================================== */

window.civelReady(function() {
    console.log("💎 [Platinum UI] Interface de Elite Ativada.");

    // 1. TILT 3D METÁLICO (Efeito Cartão Black)
    const tiltCards = document.querySelectorAll('.service-card, .calc-card, .analise-card, .type-card, .dossie-card');

    tiltCards.forEach(card => {
        card.style.transition = "transform 0.1s";

        // PERFORMANCE (11/09/2026): getBoundingClientRect() força o navegador a
        // recalcular o layout da página (reflow síncrono). Antes isso rodava a
        // CADA pixel de mousemove (pode disparar 60-120x por segundo) — agora só
        // mede o card uma vez, ao entrar com o mouse, e reaproveita a medida
        // durante todo o hover (a posição/tamanho do card não muda nesse meio-tempo).
        let rect = null;

        card.addEventListener('mouseenter', () => {
            rect = card.getBoundingClientRect();
        });

        card.addEventListener('mousemove', (e) => {
            if (!rect) rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            // Rotação sutil e elegante (menos agressiva que o criminal)
            const rotateX = ((y - centerY) / centerY) * -3;
            const rotateY = ((x - centerX) / centerX) * 3;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.01)`;

            // Brilho Prateado (Platinum Glare)
            card.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.08), rgba(20,20,20,0.9))`;
            card.style.borderColor = 'rgba(192, 192, 192, 0.4)'; // Prata
        });

        card.addEventListener('mouseleave', () => {
            rect = null;
            card.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale(1)`;
            card.style.background = '';
            card.style.borderColor = '';
        });
    });

    // 2. HEADER INTELIGENTE (Scroll Effect)
    // CORRIGIDO 11/09/2026: o seletor procurava '.header-civel' ou '.header-platinum',
    // mas o structure.js injeta a classe '.header-civel-platinum' — nunca batia com
    // nenhuma das duas, então esse efeito de header compacto no scroll NUNCA rodava
    // em nenhuma página. Também adicionado: guarda de estado (só escreve estilo
    // quando cruza o limiar, não a cada evento de scroll) e listener passivo.
    const header = document.querySelector('.header-civel-platinum');
    if (header) {
        let compacto = false;
        window.addEventListener('scroll', () => {
            const deveSerCompacto = window.scrollY > 50;
            if (deveSerCompacto === compacto) return;
            compacto = deveSerCompacto;

            if (compacto) {
                header.style.background = "rgba(5, 5, 5, 0.98)";
                header.style.boxShadow = "0 5px 20px rgba(212, 175, 55, 0.1)"; // Sombra Ouro sutil
                header.style.padding = "10px 50px"; // Fica mais compacto
            } else {
                header.style.background = "rgba(10, 10, 10, 0.8)"; // Volta ao original
                header.style.boxShadow = "none";
                header.style.padding = "20px 50px";
            }
        }, { passive: true });
    }

    // 3. INICIALIZA A BUSCA EXECUTIVA
    initPlatinumSearch();
});

// --- BUSCA EXECUTIVA (SPOTLIGHT CÍVEL) ---
function initPlatinumSearch() {
    // Injeta CSS do Modal
    const style = document.createElement('style');
    style.innerHTML = `
        #platinum-search-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); backdrop-filter: blur(8px);
            z-index: 9999; display: none; justify-content: center; padding-top: 100px;
            opacity: 0; transition: opacity 0.3s;
        }
        #platinum-search-overlay.active { display: flex; opacity: 1; }
        
        .platinum-box {
            width: 100%; max-width: 600px; background: #0f0f0f;
            border: 1px solid #c0c0c0; border-radius: 8px;
            box-shadow: 0 0 40px rgba(192, 192, 192, 0.15); overflow: hidden;
            transform: scale(0.95); transition: transform 0.3s;
        }
        #platinum-search-overlay.active .platinum-box { transform: scale(1); }
        
        .platinum-header {
            display: flex; align-items: center; padding: 20px; border-bottom: 1px solid #333;
        }
        .search-icon { font-size: 1.5rem; color: #d4af37; margin-right: 15px; }
        #platinum-input {
            background: transparent; border: none; color: #fff; font-size: 1.2rem;
            width: 100%; outline: none; font-family: 'Lato', sans-serif;
        }
        
        .platinum-results { max-height: 300px; overflow-y: auto; padding: 10px; }
        .platinum-item {
            display: flex; justify-content: space-between; align-items: center;
            padding: 12px 15px; color: #ccc; text-decoration: none; border-radius: 4px;
            border-left: 3px solid transparent; transition: 0.2s; margin-bottom: 5px;
        }
        .platinum-item:hover { background: #1a1a1a; border-left-color: #d4af37; color: #fff; }
        .platinum-tag {
            font-size: 0.7rem; text-transform: uppercase; padding: 2px 6px;
            border: 1px solid #444; border-radius: 3px; color: #888;
        }
        
        .platinum-footer {
            padding: 10px 20px; background: #080808; border-top: 1px solid #333;
            text-align: right; font-size: 0.8rem; color: #555; font-family: 'Fira Code';
        }
        
        /* Botão Flutuante */
        .btn-search-float {
            position: fixed; bottom: 20px; left: 20px; width: 50px; height: 50px;
            background: #111; border: 1px solid #c0c0c0; border-radius: 50%;
            color: #c0c0c0; display: flex; align-items: center; justify-content: center;
            cursor: pointer; z-index: 9000; box-shadow: 0 5px 20px rgba(0,0,0,0.5);
            font-size: 1.2rem; transition: 0.3s;
        }
        .btn-search-float:hover { background: #c0c0c0; color: #000; transform: scale(1.1); }
    `;
    document.head.appendChild(style);

    // Injeta HTML
    const html = `
        <div id="platinum-search-overlay">
            <div class="platinum-box">
                <div class="platinum-header">
                    <span class="search-icon">🔎</span>
                    <input type="text" id="platinum-input" placeholder="Buscar Solução (Ex: Holding, Juros, Divórcio)..." autocomplete="off">
                </div>
                <div class="platinum-results" id="platinum-results"></div>
                <div class="platinum-footer">ESC para fechar | ENTER para selecionar</div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);

    // Eventos
    const overlay = document.getElementById('platinum-search-overlay');
    const input = document.getElementById('platinum-input');

    window.togglePlatinumSearch = () => {
        if (overlay.classList.contains('active')) {
            overlay.classList.remove('active');
            setTimeout(() => overlay.style.display = 'none', 300);
        } else {
            overlay.style.display = 'flex';
            // Force reflow
            void overlay.offsetWidth;
            overlay.classList.add('active');
            input.value = '';
            filtrarPlatinum('');
            setTimeout(() => input.focus(), 100);
        }
    };

    // ATALHO CTRL+K REMOVIDO (bug ja confirmado, 2026-09-10):
    // Este arquivo (platinum-ui.js) e civel-search.js registravam,
    // cada um, seu proprio listener de keydown para Ctrl+K/Cmd+K,
    // fazendo os DOIS overlays de busca abrirem ao mesmo tempo
    // (#neural-search-overlay e #platinum-search-overlay sobrepostos).
    //
    // A busca oficial ativada por Ctrl+K/Escape agora e a de
    // civel-search.js ("Neural Spotlight"), conforme o proprio
    // civel-core.js documenta este arquivo como responsavel por
    // "Efeitos 3D e Design" e civel-search.js como "Busca Interna".
    // civel-search.js tambem cobre mais paginas reais do site
    // (ex.: painel-cliente.html, sala-reuniao.html) e sua lista de
    // resultados nao tem funcionalidade sobreposta por outro modulo.
    //
    // A funcao togglePlatinumSearch() e o overlay #platinum-search-overlay
    // NAO foram removidos: eles continuam ativos via clique no botao
    // flutuante ".btn-search-float" (injetado logo acima, com
    // onclick="togglePlatinumSearch()"), que e um gatilho visivel
    // independente do teclado. Fechar pelo Escape deixou de existir
    // aqui; o overlay ainda fecha ao clicar fora dele (ver listener
    // de 'click' abaixo).

    // Fechar ao clicar fora
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) togglePlatinumSearch();
    });

    // Input Listener
    input.addEventListener('input', (e) => filtrarPlatinum(e.target.value));
}

function filtrarPlatinum(termo) {
    const container = document.getElementById('platinum-results');
    termo = termo.toLowerCase().trim();

    // BASE DE DADOS CÍVEL
    const paginas = [
        { titulo: "Blindagem Patrimonial (Holding)", url: "blindagem-patrimonial.html", tag: "Patrimônio" },
        { titulo: "Revisional de Juros Bancários", url: "bancario-juros.html", tag: "Financeiro" },
        { titulo: "Divórcio e Inventário", url: "familia-sucessoes.html", tag: "Família" },
        { titulo: "Recuperação de Ativos (Execução)", url: "execucao-cobranca.html", tag: "Cobrança" },
        { titulo: "Indenização de Seguros", url: "seguros-indenizacao.html", tag: "Seguro" },
        { titulo: "Erro Médico e Hospitalar", url: "erro-medico.html", tag: "Saúde" },
        { titulo: "Contratos e Negócios", url: "index.html#servicos", tag: "Empresarial" },
        { titulo: "Ir para Site Criminal", url: "https://lucassemim.adv.br", tag: "Externo" }
    ];

    const filtrados = paginas.filter(p => 
        p.titulo.toLowerCase().includes(termo) || p.tag.toLowerCase().includes(termo)
    );

    let html = '';
    if (filtrados.length > 0) {
        filtrados.forEach(p => {
            html += `
                <a href="${p.url}" class="platinum-item">
                    ${p.titulo}
                    <span class="platinum-tag">${p.tag}</span>
                </a>
            `;
        });
    } else {
        html = `<div style="padding:20px; text-align:center; color:#666;">Nenhum serviço encontrado.</div>`;
    }
    
    container.innerHTML = html;
}