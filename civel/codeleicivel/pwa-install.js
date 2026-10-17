/* =========================================================== */
/* === ARQUIVO: codeleicivel/pwa-install.js === */
/* === FUNÇÃO: Gerenciador de Instalação do App === */
/* =========================================================== */

window.civelReady(function() {
    console.log("📱 [PWA] Iniciando protocolo de instalação...");

    // 1. REGISTRAR O SERVICE WORKER
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./service-worker.js')
            .then(reg => console.log("📱 [PWA] Service Worker registrado:", reg.scope))
            .catch(err => console.error("❌ [PWA] Falha no SW:", err));
    }

    // 2. CAPTURAR EVENTO DE INSTALAÇÃO
    let deferredPrompt;
    
    window.addEventListener('beforeinstallprompt', (e) => {
        // Previne o banner padrão antigo do Chrome
        e.preventDefault();
        deferredPrompt = e;
        
        // Mostra o botão de instalação (se você tiver um no menu)
        mostrarBotaoInstalar();
        
        console.log("📱 [PWA] App pronto para instalar.");
    });

    function mostrarBotaoInstalar() {
        // Cria um botão flutuante discreto se não existir
        if (document.getElementById('btn-install-app')) return;

        const btn = document.createElement('div');
        btn.id = 'btn-install-app';
        btn.innerHTML = `
            <span style="font-size:1.2rem">📲</span> 
            <span style="font-family:'Teko'">BAIXAR APP</span>
        `;
        
        // Estilo Flutuante (Canto Inferior Esquerdo - Acima da Prova Social)
        Object.assign(btn.style, {
            position: 'fixed', bottom: '90px', left: '20px',
            background: 'linear-gradient(45deg, #000, #111)',
            border: '1px solid #d4af37', borderRadius: '30px',
            padding: '8px 20px', color: '#d4af37', cursor: 'pointer',
            zIndex: '9995', boxShadow: '0 5px 20px rgba(0,0,0,0.8)',
            display: 'flex', alignItems: 'center', gap: '10px',
            animation: 'slideIn 1s ease'
        });

        btn.onclick = () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted the A2HS prompt');
                        btn.style.display = 'none';
                    }
                    deferredPrompt = null;
                });
            }
        };

        document.body.appendChild(btn);
    }

    // 3. DETECTAR SE JÁ ESTÁ INSTALADO
    window.addEventListener('appinstalled', () => {
        console.log('📱 [PWA] Aplicativo instalado com sucesso.');
        const btn = document.getElementById('btn-install-app');
        if(btn) btn.style.display = 'none';
    });
});