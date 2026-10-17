/* =========================================================== */
/* === ARQUIVO: js/logo-elite.js (Quantum Elite V5) ========== */
/* === FUNÇÃO: Nav-Bar Glassmorphism, Balança Glow e EEAT === */
/* =========================================================== */

document.addEventListener("DOMContentLoaded", function() {
    renderizarLogoEliteHeader();
});

function renderizarLogoEliteHeader() {
    // Alvo: A maioria das páginas de news tem um container no topo
    let target = document.querySelector('nav.navbar-custom') || document.querySelector('header');
    
    // Se não houver nav-bar padrão, injeta no topo do body
    if (!target) {
        target = document.body;
        // Se injetar no body, o estilo 'fixed-top' resolve
    } else {
        // Se já houver nav-bar, removemos o conteúdo dela para injetar o novo design Elite
        target.innerHTML = '';
        target.className = 'navbar navbar-expand-lg navbar-dark navbar-custom fixed-top'; 
    }

    // 1. INJEÇÃO DE ESTILOS CSS (Glassmorphism e Glow Vigilante)
    const style = document.createElement('style');
    style.innerHTML = `
        /* Fundo transparente no topo, Glassmorphism ao rolar */
        .navbar-custom {
            padding: 12px 0;
            transition: all 0.4s ease;
            background: rgba(5, 5, 5, 0.0); /* Transparente no início */
            border-bottom: 1px solid rgba(212, 175, 55, 0.0);
        }

        /* Classe acionada pelo JS ao rolar */
        .navbar-custom.navbar-scrolled {
            padding: 8px 0;
            background: rgba(5, 5, 5, 0.85); /* Vidro Escuro */
            backdrop-filter: blur(10px); 
            -webkit-backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(212, 175, 55, 0.3);
            box-shadow: 0 5px 20px rgba(0,0,0,0.4);
        }

        /* LOGO ELITE (Teko Font e Balança Glow) */
        .brand-elite {
            display: flex;
            align-items: center;
            gap: 15px;
            text-decoration: none !important;
        }

        .balanca-vigilante {
            color: #d4af37;
            font-size: 2.2rem;
            text-shadow: 0 0 10px rgba(212, 175, 55, 0.0);
            animation: balancaHeartbeat 4s ease-in-out infinite;
        }

        /* Animação do Brilho Vigilante */
        @keyframes balancaHeartbeat {
            0% { text-shadow: 0 0 5px rgba(212, 175, 55, 0.0); transform: scale(1); }
            50% { text-shadow: 0 0 25px rgba(212, 175, 55, 0.6); transform: scale(1.03); }
            100% { text-shadow: 0 0 5px rgba(212, 175, 55, 0.0); transform: scale(1); }
        }

        .text-group-elite {
            display: flex;
            flex-direction: column;
            line-height: 1.1;
        }

        .title-semim {
            font-family: 'Teko', sans-serif;
            color: #fff;
            font-size: 1.9rem;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .subtitle-semim {
            font-family: 'Lato', sans-serif;
            color: #aaa;
            font-size: 0.75rem;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }

        /* Estilo da Tropa de Choque Indicator (ARIA) */
        .subtitle-semim::after {
            content: " [UNIDADE NEWS]";
            color: #ff4d4d;
            font-weight: 700;
            opacity: 0.8;
        }

        /* Ajustes de Links e Botão */
        .nav-link-elite {
            font-family: 'Teko', sans-serif;
            color: #e1e1e6 !important;
            font-size: 1.25rem;
            text-transform: uppercase;
            margin: 0 10px;
            transition: 0.3s;
        }
        .nav-link-elite:hover { color: #d4af37 !important; }
        .nav-link-elite.active { color: #d4af37 !important; font-weight: 600; }

        .btn-plantao-elite {
            background: linear-gradient(180deg, #8b0000 0%, #5c0000 100%);
            color: #fff !important;
            border: 1px solid #ff4d4d;
            padding: 8px 25px;
            border-radius: 4px;
            font-family: 'Teko', sans-serif;
            font-size: 1.2rem;
            text-transform: uppercase;
            animation: pulsePlantaoElite 2s infinite;
        }

        @keyframes pulsePlantaoElite {
            0% { box-shadow: 0 0 0 0 rgba(255, 77, 77, 0.4); }
            70% { box-shadow: 0 0 0 10px rgba(255, 77, 77, 0); }
            100% { box-shadow: 0 0 0 0 rgba(255, 77, 77, 0); }
        }

        /* Ajuste Mobile */
        @media (max-width: 991px) {
            .navbar-collapse-elite { background: rgba(10, 10, 10, 0.95); backdrop-filter: blur(10px); padding: 20px; border-radius: 8px; border: 1px solid #333; margin-top: 15px; }
            .title-semim { font-size: 1.6rem; }
            .subtitle-semim { font-size: 0.7rem; }
        }
    `;
    document.head.appendChild(style);

    // 2. INJEÇÃO DO HTML DO HEADER ELITE (Com OAB e Balança Glow)
    const headerHTML = `
        <div class="container">
            <a class="brand-elite" href="../index.html">
                <i class="fas fa-balance-scale balanca-vigilante"></i>
                <div class="text-group-elite">
                    <span class="title-semim">SEMIM & ASSOCIADOS</span>
                    <span class="subtitle-semim">Advocacia / OAB-MG 222.539</span>
                </div>
            </a>

            <button class="navbar-toggler ms-auto" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavElite" aria-controls="navbarNavElite" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>

            <div class="collapse navbar-collapse justify-content-end" id="navbarNavElite">
                <div class="navbar-collapse-elite">
                    <ul class="navbar-nav align-items-center">
                        <li class="nav-item">
                            <a class="nav-link nav-link-elite" href="../index.html">Início</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link nav-link-elite active" href="../noticias.html">Notícias</a>
                        </li>
                        <li class="nav-item">
                            <a href="https://wa.me/5531989420094" class="btn btn-plantao-elite">
                                <i class="fas fa-siren-on me-2"></i> PLANTÃO 24H
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    `;

    // Se o target for o body, criamos a tag <nav>, senão injetamos no target existente
    if (target.tagName === 'BODY') {
        const nav = document.createElement('nav');
        nav.className = 'navbar navbar-expand-lg navbar-dark navbar-custom fixed-top';
        nav.innerHTML = headerHTML;
        document.body.appendChild(nav);
        iniciarScrollMonitor(nav);
    } else {
        target.innerHTML = headerHTML;
        iniciarScrollMonitor(target);
    }
}

// 3. MONITOR DE SCROLL (Ativa o Glassmorphism)
function iniciarScrollMonitor(navElement) {
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navElement.classList.add('navbar-scrolled');
        } else {
            navElement.classList.remove('navbar-scrolled');
        }
    });
}