/* =========================================================== */
/* === ARQUIVO: codeleicivel/civel-mobile-optimizer.js === */
/* === FUNÇÃO: Refinamento Visual e Performance Mobile === */
/* =========================================================== */

(function() {
    // 1. DETECTOR DE AMBIENTE MÓVEL
    const isMobile = window.innerWidth <= 768;
    
    // Se não for mobile, não faz nada e economiza processamento
    if (!isMobile) return;

    console.log("📱 [Mobile Optimizer] Aplicando Design de Leitura e Performance...");

    // 2. OTIMIZAÇÃO DE PERFORMANCE (GPU)
    // Reduz a intensidade das partículas para economizar bateria do cliente
    const canvas = document.getElementById('quantum-canvas');
    if (canvas) {
        canvas.style.opacity = '0.2'; // Quase invisível, apenas um charme
    }

    // 3. INJEÇÃO DE CSS DE ALTA LEITURA (SEM BARRA FLUTUANTE)
    const style = document.createElement('style');
    style.innerHTML = `
        /* --- TIPOGRAFIA DE ELITE PARA MOBILE --- */
        /* Aumenta legibilidade para evitar zoom */
        p, li { 
            line-height: 1.7 !important; 
            font-size: 1.1rem !important; 
            color: #d0d0d0 !important; /* Contraste levemente aumentado */
        }
        
        /* Títulos mais impactantes e centralizados se necessário */
        h1, h2, h3 {
            line-height: 1.2 !important;
        }

        /* --- BOTÕES TOUCH-FRIENDLY (O DEDO GORDO) --- */
        /* Garante que botões importantes sejam fáceis de clicar */
        .btn-platinum, .btn-fale, .btn-next, .btn-prev, .btn-dossie-pago {
            padding: 18px 25px !important; /* Mais área de toque */
            font-size: 1.2rem !important;
            width: 100%; /* Ocupa largura total para facilitar o clique */
            margin-bottom: 15px;
            display: block;
            text-align: center;
        }

        /* --- ESPAÇAMENTO RESPONSIVO --- */
        /* Evita que o texto encoste na borda da tela */
        .container { 
            padding-left: 25px !important; 
            padding-right: 25px !important; 
        }
        
        section {
            padding-top: 60px !important;
            padding-bottom: 60px !important;
        }

        /* --- LIMPEZA VISUAL --- */
        /* Esconde o Ticker no mobile pois ocupa muito espaço útil */
        .ticker-bar { display: none !important; } 
        
        /* Ajuste do Header para não cobrir conteúdo */
        #header-placeholder { min-height: 70px !important; }
        
        /* Ajuste do Slider para caber na tela vertical */
        .hero-slider-section { 
            min-height: 80vh !important; 
            height: auto !important; 
        }
        
        /* Ajuste do Menu Mobile (Garante que fique acima de tudo) */
        #mobile-menu-overlay {
            z-index: 99999 !important;
        }
    `;
    document.head.appendChild(style);

    // 4. (OPCIONAL) BOTÃO WHATSAPP FLUTUANTE DISCRETO
    // Se quiser apenas o ícone do Zap flutuando no canto direito (padrão de mercado), 
    // descomente as linhas abaixo. Se não quiser nada, deixe comentado.
    
    /*
    const fab = document.createElement('a');
    fab.href = "https://wa.me/5531989420094";
    fab.innerHTML = "💬";
    Object.assign(fab.style, {
        position: 'fixed', bottom: '20px', right: '20px',
        width: '60px', height: '60px', borderRadius: '50%',
        background: '#2ecc71', color: '#fff', fontSize: '30px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 15px rgba(0,0,0,0.5)', zIndex: '10000',
        textDecoration: 'none'
    });
    document.body.appendChild(fab);
    */

})();