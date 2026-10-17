/* =========================================================== */
/* === ARQUIVO: codeleicivel/civel-quantum.js === */
/* === FUNÇÃO: Engajamento, Recuperação e Proteção (Smart Copy) === */
/* =========================================================== */

window.civelReady(function() {
    console.log("⚛️ [Quantum] Protocolos de Neuro-Marketing e Proteção Ativos.");

    // --- 1. BARRA DE PROGRESSO DOURADA (Golden Reader) ---
    function initProgressBar() {
        const bar = document.createElement('div');
        bar.id = 'quantum-progress-bar';
        
        Object.assign(bar.style, {
            position: 'fixed', top: '0', left: '0', height: '3px',
            background: 'linear-gradient(90deg, #d4af37, #f1c40f, #fff, #d4af37)',
            backgroundSize: '200% 100%', width: '0%', zIndex: '10005',
            boxShadow: '0 0 10px rgba(212, 175, 55, 0.7)',
            transition: 'width 0.1s ease-out',
            animation: 'shine 2s infinite linear'
        });

        document.body.appendChild(bar);

        window.addEventListener('scroll', () => {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height) * 100;
            bar.style.width = scrolled + "%";
        });
        
        const style = document.createElement('style');
        style.innerHTML = `@keyframes shine { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }`;
        document.head.appendChild(style);
    }

    // --- 2. RECUPERAÇÃO DE ATENÇÃO (Tab Recovery - Pisca Alerta) ---
    function initTabRecovery() {
        const originalTitle = document.title;
        const alertTitle = "⚠️ Sua análise está aguardando...";
        
        // Pega o favicon atual
        const faviconLink = document.querySelector("link[rel~='icon']");
        const originalFavicon = faviconLink ? faviconLink.href : '';
        const blankFavicon = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

        let blinkInterval;

        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                let isOriginal = false;
                document.title = alertTitle;
                if(faviconLink) faviconLink.href = blankFavicon;

                blinkInterval = setInterval(() => {
                    if (isOriginal) {
                        document.title = alertTitle;
                        if(faviconLink) faviconLink.href = blankFavicon;
                    } else {
                        document.title = "🔴 Volte para o atendimento";
                        if(faviconLink) faviconLink.href = originalFavicon;
                    }
                    isOriginal = !isOriginal;
                }, 1500);

            } else {
                clearInterval(blinkInterval);
                document.title = originalTitle;
                if(faviconLink) faviconLink.href = originalFavicon;
            }
        });
    }

    // --- 3. PROTEÇÃO DE PROPRIEDADE INTELECTUAL (Smart Copy) ---
    function initSmartCopy() {
        document.addEventListener('copy', function(e) {
            // Pega o texto selecionado
            const text = window.getSelection().toString();
            
            // Só ativa se copiar uma frase razoável (mais de 30 caracteres)
            // Para não atrapalhar quem copia só um telefone ou e-mail
            if (text.length > 30) {
                // A Mágica: Adiciona a Fonte
                const copyright = `\n\nFonte: Dr. Lucas Semim - Advocacia de Elite\nLink: ${window.location.href}`;
                
                if (e.clipboardData) {
                    e.preventDefault(); // Impede a cópia pura
                    e.clipboardData.setData('text/plain', text + copyright); // Injeta o texto com a fonte
                }
            }
        });
        
        // Proteção Extra: Impede arrastar imagens (Evita download fácil do design)
        document.addEventListener('dragstart', function(e) {
            if (e.target.nodeName === 'IMG') {
                e.preventDefault();
            }
        });
    }

    // EXECUÇÃO DOS MÓDULOS
    initProgressBar();
    initTabRecovery();
    initSmartCopy();
});