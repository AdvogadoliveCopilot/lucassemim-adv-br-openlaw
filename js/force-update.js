/* =========================================================== */
/* === FICHEIRO: js/force-update.js (Cache Buster Elite V3) == */
/* === FUNÇÃO: Gestão de Atualização PWA e Sincronização Abas  */
/* === DATA: 11/06/2026                                    === */
/* =========================================================== */

window.ForceUpdate = {
    config: {
        version: '2.0', // INCREMENTAR A CADA DEPLOY
        versionKey: 'semim_app_version',
        channelName: 'semim_force_update',
        versionUrl: '/version.json',
        reloadDelay: 1500,
        preserveKeys: [
            'semim_app_version',
            'semim_utm_source',
            'semim_utm_medium',
            'semim_utm_campaign',
            'semim_cookie_consent',
            'semim_user_pref',
            'ls_utm_v5',
            'ls_visited_v5'
        ]
    },

    state: {
        isUpdating: false,
        channel: null,
        lastVisibilityCheck: 0
    },

    // Orquestra a inicialização dos observadores e a primeira checagem
    async init() {
        this.watchOtherTabs();
        this.watchVisibility();
        await this.checkVersion();
    },

    // Verifica versão local vs remota/configurada
    async checkVersion() {
        if (this.state.isUpdating) return;
        
        let targetVersion = this.config.version;
        const remoteVersion = await this.fetchRemoteVersion();
        
        if (remoteVersion) targetVersion = remoteVersion;
        
        const storedVersion = localStorage.getItem(this.config.versionKey);
        
        if (storedVersion !== targetVersion) {
            await this.doUpdate(`versão ${storedVersion || 'nula'} → ${targetVersion}`);
        }
    },

    // Busca versão do arquivo JSON no servidor com timeout
    async fetchRemoteVersion() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            const res = await fetch(`${this.config.versionUrl}?t=${Date.now()}`, {
                cache: 'no-store',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!res.ok) return null;
            const data = await res.json();
            return data.version || null;
        } catch (err) {
            if (window.location.hostname !== 'lucassemim.adv.br') console.warn('Erro ao buscar versão remota:', err);
            return null;
        }
    },

    // Executa o protocolo de limpeza e atualização
    async doUpdate(motivo) {
        if (this.state.isUpdating) return;
        this.state.isUpdating = true;
        
        if (window.location.hostname !== 'lucassemim.adv.br') console.log(`🔄 Atualização forçada acionada: ${motivo}`);

        try {
            this.showToast('🔄 Atualizando o site...');
            
            const backup = this.preserveLocalStorage();
            
            await Promise.all([
                this.clearAllCaches(),
                this.updateServiceWorker()
            ]);
            
            localStorage.setItem(this.config.versionKey, this.config.version);
            sessionStorage.clear();
            this.restoreLocalStorage(backup);
            
            this.broadcastUpdateDone();
            
            await new Promise(r => setTimeout(r, this.config.reloadDelay));
            window.location.reload();
            
        } catch (err) {
            this.state.isUpdating = false;
            if (window.location.hostname !== 'lucassemim.adv.br') console.error('Erro durante atualização:', err);
        }
    },

    // Limpa o Cache Storage do navegador
    async clearAllCaches() {
        if (!('caches' in window)) return;
        try {
            const names = await caches.keys();
            await Promise.all(names.map(name => caches.delete(name)));
        } catch (err) {
            if (window.location.hostname !== 'lucassemim.adv.br') console.error('Erro ao limpar caches:', err);
        }
    },

    // Atualiza o Service Worker enviando sinal SKIP_WAITING
    async updateServiceWorker() {
        if (!('serviceWorker' in navigator)) return;
        
        try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            
            for (const reg of registrations) {
                await reg.update();
                
                if (reg.waiting) {
                    reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                    await new Promise(resolve => setTimeout(resolve, 500));
                } else if (reg.installing) {
                    await new Promise(resolve => {
                        reg.installing.onstatechange = () => {
                            if (reg.waiting) {
                                reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                                resolve();
                            }
                        };
                        setTimeout(resolve, 2000);
                    });
                } else {
                    await reg.unregister();
                }
            }
        } catch (err) {
            if (window.location.hostname !== 'lucassemim.adv.br') console.error('Erro ao atualizar SW:', err);
        }
    },

    // Salva chaves vitais do localStorage
    preserveLocalStorage() {
        const backup = {};
        this.config.preserveKeys.forEach(key => {
            const val = localStorage.getItem(key);
            if (val !== null) backup[key] = val;
        });
        return backup;
    },

    // Restaura as chaves vitais
    restoreLocalStorage(backup) {
        Object.entries(backup).forEach(([key, val]) => {
            localStorage.setItem(key, val);
        });
    },

    // Cria e exibe um toast na tela sem dependência de CSS
    showToast(msg) {
        if (document.getElementById('force-update-toast')) return;
        
        const toast = document.createElement('div');
        toast.id = 'force-update-toast';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        
        Object.assign(toast.style, {
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#d4af37',
            color: '#000',
            padding: '12px 28px',
            borderRadius: '8px',
            fontFamily: "'Lato', sans-serif",
            fontWeight: '700',
            fontSize: '0.9rem',
            zIndex: '99999',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            whiteSpace: 'nowrap',
            opacity: '0',
            transition: 'opacity 0.3s ease'
        });
        
        toast.textContent = msg;
        document.body.appendChild(toast);
        
        requestAnimationFrame(() => {
            requestAnimationFrame(() => { toast.style.opacity = '1'; });
        });
    },

    // Escuta quando o usuário retorna à aba (minimizou/trocou de aba e voltou)
    watchVisibility() {
        document.addEventListener('visibilitychange', async () => {
            if (document.visibilityState !== 'visible') return;
            if (this.state.isUpdating) return;
            
            const now = Date.now();
            if (now - this.state.lastVisibilityCheck < 60_000) return;
            
            this.state.lastVisibilityCheck = now;
            await this.checkVersion();
        });
    },

    // Comunica-se com outras abas abertas do mesmo site
    watchOtherTabs() {
        if ('BroadcastChannel' in window) {
            this.state.channel = new BroadcastChannel(this.config.channelName);
            this.state.channel.onmessage = async (event) => {
                if (event.data?.type === 'NEW_VERSION_DEPLOYED' && !this.state.isUpdating) {
                    this.showToast('🔄 Nova versão disponível. Atualizando...');
                    await new Promise(r => setTimeout(r, this.config.reloadDelay));
                    window.location.reload();
                }
            };
        }
        
        window.addEventListener('storage', async (event) => {
            if (
                event.key === this.config.versionKey &&
                event.newValue !== null &&
                event.newValue !== event.oldValue &&
                !this.state.isUpdating
            ) {
                this.showToast('🔄 Site atualizado em outra aba. Sincronizando...');
                await new Promise(r => setTimeout(r, this.config.reloadDelay));
                window.location.reload();
            }
        });
    },

    // Avisa as outras abas que a atualização terminou
    broadcastUpdateDone() {
        if (this.state.channel) {
            this.state.channel.postMessage({ type: 'NEW_VERSION_DEPLOYED' });
        }
    }
};

// Executa imediatamente para limpar caches velhos antes do carregamento pesado
(async () => {
    try {
        await window.ForceUpdate.init();
    } catch (err) {
        if (window.location.hostname !== 'lucassemim.adv.br') console.error('Falha na inicialização do ForceUpdate', err);
    }
})();

/*
INSTRUÇÃO DE IMPLEMENTAÇÃO DO SW.JS:
O seu arquivo sw.js (V10) DEVE conter o seguinte bloco para aceitar a mensagem SKIP_WAITING:
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

INSTRUÇÃO PARA O ARQUIVO /version.json:
Crie um arquivo chamado 'version.json' na raiz do seu servidor (public_html / www) com o seguinte conteúdo:
{
  "version": "2.0",
  "updated": "2026-06-11"
}
Sempre que fizer uma alteração no site, mude a "version" neste arquivo JSON e também na linha 8 deste script.
*/