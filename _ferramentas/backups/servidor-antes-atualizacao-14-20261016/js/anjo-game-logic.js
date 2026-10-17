/**
 * SISTEMA ANJO - GAME LOGIC & SIMBIOSE V1.0 🦅
 * Interliga o Portal e a Captação com foco em Dopamina e UX.
 */

const ANJO_GAME = {
    // 1. CONFIGURAÇÕES GERAIS
    config: {
        corOuro: "#d4af37",
        corSucesso: "#2ecc71",
        urlPortal: "https://lucassemim.adv.br/portal-investidor"
    },

    // 2. INICIALIZADOR (Detecta a página e ativa o modo correto)
    init: function() {
        console.log("🎮 Modo Jogo Ativado: " + window.location.pathname);
        this.aplicarEfeitosGlobais();
        
        if (window.location.href.includes('projeto-anjo')) {
            this.modoCaptacao();
        } else if (window.location.href.includes('portal-investidor')) {
            this.modoComando();
        }
    },

    // 3. EFEITOS DE DOPAMINA (UI/UX)
    aplicarEfeitosGlobais: function() {
        // Adiciona um brilho sutil ao mouse para dar ideia de "scanner"
        document.body.style.cursor = "crosshair";
    },

    // 4. MODO CAPTAÇÃO (Página projeto-anjo.html)
    modoCaptacao: function() {
        // Criar balões de ajuda flutuantes
        this.criarBalaoAjuda("Dica: Escolha missões com tempo de custódia menor para impacto imediato!", 5000);
        
        // Se clicar em 'Ver Dossiê' na captação, pede login
        document.querySelectorAll('.btn-view').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.alertaLoginNecessario();
            });
        });
    },

    // 5. MODO COMANDO (Página portal-investidor.html)
    modoComando: function() {
        // Notificação de Operação
        const nomeAnjo = localStorage.getItem('anjo_nome') || "Guardião";
        this.notificar(`Bem-vindo ao Comando, ${nomeAnjo}. 24 Missões em curso no estado.`);
    },

    // 6. FUNÇÕES DE INTERAÇÃO (BALÕES E MODAIS)
    criarBalaoAjuda: function(texto, tempo) {
        const balao = document.createElement('div');
        balao.className = 'animate__animated animate__fadeInUp';
        balao.style = `position: fixed; bottom: 20px; right: 20px; background: #000; border: 1px solid ${this.config.corOuro}; 
                       padding: 15px; border-radius: 8px; color: #fff; font-family: 'Teko'; z-index: 9999; box-shadow: 0 0 15px ${this.config.corOuro};`;
        balao.innerHTML = `<i class="fas fa-robot text-gold me-2"></i> ${texto}`;
        document.body.appendChild(balao);
        setTimeout(() => balao.classList.replace('animate__fadeInUp', 'animate__fadeOutDown'), tempo);
    },

    alertaLoginNecessario: function() {
        const confirmacao = confirm("🛡️ ACESSO RESTRITO: Para visualizar provas e REDS, você precisa de uma Credencial de Anjo. Ir para o Portal?");
        if (confirmacao) window.location.href = this.config.urlPortal;
    },

    notificar: function(msg) {
        // Cria um som ou alerta visual de "entrada de sistema"
        console.log("SISTEMA: " + msg);
    }
};

// Disparar o motor
ANJO_GAME.init();