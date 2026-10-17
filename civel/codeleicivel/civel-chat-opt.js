/* =========================================================== */
/* === ARQUIVO: codeleicivel/civel-chat-opt.js === */
/* === FUNÇÃO: Controle Inteligente do Chat HubSpot === */
/* =========================================================== */

window.hsConversationsOnReady = [
    function() {
        const hubspot = window.HubSpotConversations;
        const STORAGE_KEY = 'chat_auto_open_closed'; // Marca se o usuário já fechou

        console.log("🤖 [Chat Intelligence] Monitorando comportamento...");

        // 1. ESTADO INICIAL: FECHADO
        // Garante que o chat comece fechado para não atrapalhar
        /* Nota: Configure no painel do HubSpot para "Mostrar apenas o iniciador" também */
        // hubspot.widget.close(); 

        // 2. GATILHO DE TEMPO (15 SEGUNDOS)
        setTimeout(() => {
            abrirChatInteligente("tempo");
        }, 15000);

        // 3. GATILHO DE SCROLL (50% DA PÁGINA)
        window.addEventListener('scroll', () => {
            const scrollPercent = (window.scrollY + window.innerHeight) / document.body.scrollHeight * 100;
            if (scrollPercent > 50) {
                abrirChatInteligente("scroll");
            }
        }, { passive: true });

        // 4. GATILHO DE SAÍDA (EXIT INTENT)
        document.addEventListener('mouseleave', (e) => {
            if (e.clientY < 0) {
                abrirChatInteligente("saida");
            }
        });

        // FUNÇÃO DE ABERTURA
        function abrirChatInteligente(motivo) {
            // Se o usuário já fechou o chat antes, não incomoda mais
            if (sessionStorage.getItem(STORAGE_KEY)) return;

            // Se já estiver aberto, não faz nada
            if (hubspot.widget.status().open) return;

            // Abre o chat
            hubspot.widget.open();
            console.log(`🤖 [Chat] Aberto por gatilho: ${motivo}`);
        }

        // 5. ESCUTA SE O USUÁRIO FECHOU
        hubspot.on('conversationClosed', payload => {
            console.log("🤖 [Chat] Usuário fechou manualmente. Silenciando automação.");
            sessionStorage.setItem(STORAGE_KEY, 'true');
        });
    }
];