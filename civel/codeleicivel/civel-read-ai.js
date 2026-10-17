/* =========================================================== */
/* === ARQUIVO: codeleicivel/civel-read-ai.js (Versão Pop-up Seguro) === */
/* === FUNÇÃO: Agendamento via Janela de Comando === */
/* =========================================================== */

window.civelReady(function() {
    console.log("🤖 [Read AI] Protocolo de Agendamento Seguro Ativado.");
    
    // LINK DA SUA AGENDA READ.AI
    const READ_AI_LINK = "https://cal.read.ai/lucas-fjd9a";

    // --- 1. FUNÇÃO DE ABERTURA SEGURA (POP-UP APP) ---
    window.abrirAgendaIA = function(e) {
        if(e) e.preventDefault();
        
        // Configuração da Janela Flutuante (Centralizada)
        const width = 1000;
        const height = 800;
        const left = (screen.width - width) / 2;
        const top = (screen.height - height) / 2;
        
        // Abre a janela sem barras de navegação (Parece um App)
        window.open(
            READ_AI_LINK, 
            'AgendaLucasSemim', 
            `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes,status=no,location=no,toolbar=no,menubar=no`
        );
    };

    // --- 2. INTERCEPTADOR DE CLIQUES (Gatilho) ---
    function ativarAgendador() {
        // Busca todos os botões de agenda com a classe especial
        const botoes = document.querySelectorAll('.btn-agenda-ia');
        
        botoes.forEach(btn => {
            // Remove o link antigo e coloca o gatilho da janela
            btn.removeAttribute('target');
            btn.href = "#";
            btn.onclick = window.abrirAgendaIA;
            btn.innerHTML = "📅 AGENDAR COM IA";
        });
    }

    // --- 3. AUDITORIA NA SALA DE REUNIÃO (Modo Cockpit) ---
    const observer = new MutationObserver((mutations) => {
        const dashboard = document.getElementById('process-dashboard');
        if (dashboard && !document.getElementById('ai-audit-badge')) {
            injetarSeloAuditoria(dashboard);
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    function injetarSeloAuditoria(container) {
        const badge = document.createElement('div');
        badge.id = 'ai-audit-badge';
        badge.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px; background:rgba(40, 40, 50, 0.9); border:1px solid #d4af37; padding:10px 20px; border-radius:50px; margin-bottom:20px; animation: slideDown 0.5s;">
                <div style="width:10px; height:10px; background:#e74c3c; border-radius:50%; box-shadow:0 0 10px #e74c3c; animation:pulseRed 1.5s infinite;"></div>
                <span style="font-family:'Fira Code'; color:#fff; font-size:0.8rem;">AUDITORIA NEURAL <strong style="color:#d4af37;">ATIVA</strong></span>
            </div>
            <style>
                @keyframes pulseRed { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
                @keyframes slideDown { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            </style>
        `;
        container.insertBefore(badge, container.firstChild);
    }

    // EXECUÇÃO
    setTimeout(ativarAgendador, 500);
});