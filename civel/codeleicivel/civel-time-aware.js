/* =========================================================== */
/* === ARQUIVO: codeleicivel/civel-time-aware.js === */
/* === FUNÇÃO: Interface Sensível ao Tempo (Time-Aware) === */
/* =========================================================== */

window.civelReady(function() {
    const hora = new Date().getHours();
    const isBusinessHours = hora >= 8 && hora < 19;
    
    // Configurações
    const config = {
        online: { text: "🟢 ADVOCACIA ONLINE AGORA", color: "#2ecc71" },
        plantao: { text: "🌙 PLANTÃO JURÍDICO DIGITAL", color: "#9b59b6" } // Roxo ou Dourado
    };

    const status = isBusinessHours ? config.online : config.plantao;

    // 1. Injeta Badge no Menu (Desktop)
    setTimeout(() => {
        const nav = document.querySelector('.nav-platinum');
        if (nav) {
            const badge = document.createElement('div');
            badge.innerHTML = status.text;
            Object.assign(badge.style, {
                fontSize: '0.7rem', fontFamily: 'Fira Code', color: status.color,
                border: `1px solid ${status.color}`, padding: '4px 10px', borderRadius: '4px',
                marginLeft: '15px', animation: 'pulseSlow 3s infinite'
            });
            nav.insertBefore(badge, nav.firstChild); // Coloca antes dos links
        }

        // 2. Atualiza Texto do Botão WhatsApp (Se houver)
        const btnWhats = document.querySelector('.btn-platinum');
        if (btnWhats && !isBusinessHours) {
            btnWhats.innerText = "PLANTÃO";
        }
    }, 1000); // Espera o menu carregar

    // CSS da Animação
    const style = document.createElement('style');
    style.innerHTML = `@keyframes pulseSlow { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }`;
    document.head.appendChild(style);
    
    console.log(`🕰️ [Time Aware] Modo: ${isBusinessHours ? 'Horário Comercial' : 'Plantão'}`);
});