/* =========================================================== */
/* === FICHEIRO: js/read-ai-integration.js (Popup Elite V3) == */
/* === FUNÇÃO: Agendamento Seguro e Rastreamento de Leads ==== */
/* =========================================================== */

document.addEventListener("DOMContentLoaded", function() {
    console.log("📅 [Read AI] Protocolo de Agendamento Ativo e Monitorizado.");

    const agendarLinks = document.querySelectorAll('a[href*="read.ai"]');

    agendarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault(); 
            
            const url = this.href;

            // 1. RASTREAMENTO CIRÚRGICO (Avisa o Google Ads/Analytics)
            if (typeof gtag === 'function') {
                gtag('event', 'agendamento_iniciado', {
                    'event_category': 'Conversão Alto Valor',
                    'event_label': 'Reunião Read.AI'
                });
                console.log("📊 [Analytics] Intenção de Agendamento registada.");
            }

            // 2. ABERTURA SEGURA (Evita bloqueadores de Pop-up em Mobile)
            abrirPopupAgendamento(url);
        });
    });

    function abrirPopupAgendamento(url) {
        // Se for telemóvel, abre numa nova aba normal (Popups quebram no iOS/Android)
        if (window.innerWidth <= 768) {
            window.open(url, '_blank');
            return;
        }

        // Se for Desktop, abre a janela elegante "Tipo App"
        const width = 1100;
        const height = 800;
        const left = (window.screen.width / 2) - (width / 2);
        const top = (window.screen.height / 2) - (height / 2);

        const windowFeatures = `scrollbars=yes,resizable=yes,width=${width},height=${height},top=${top},left=${left},status=no,location=no,toolbar=no,menubar=no`;

        const popup = window.open(url, 'AgendamentoSemim', windowFeatures);

        if (window.focus && popup) { 
            popup.focus(); 
        }
    }
});