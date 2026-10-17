/* =========================================================== */
/* === ARQUIVO: js/cronos.js (Gerenciador de Tempo e Atenção) === */
/* === FUNÇÃO: Urgência Temporal & Recuperação de Aba === */
/* =========================================================== */

document.addEventListener("DOMContentLoaded", function() {
    console.log("⏳ [Cronos] Protocolo Temporal Ativado.");

    // 1. DATA DINÂMICA NO HERO (URGÊNCIA)
    // Procura o badge de plantão e adiciona o dia da semana
    const diasSemana = ["DOMINGO", "SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO"];
    const hoje = new Date();
    const diaAtual = diasSemana[hoje.getDay()];
    
    // Alvo: O Badge do Hero ou Botão de Plantão
    const heroBadge = document.querySelector('.hero-badge');
    const plantaoBtn = document.querySelector('.btn-urgencia-menu');

    if (heroBadge) {
        // Ex: "PLANTÃO CRIMINAL DE TERÇA-FEIRA - BH E REGIÃO"
        heroBadge.innerHTML = `PLANTÃO CRIMINAL DE <span style="color:#d4af37">${diaAtual}-FEIRA</span> - BH E REGIÃO`;
    }

    // 2. ATUALIZADOR DE RODAPÉ (COPYRIGHT)
    // Procura qualquer texto que tenha "2024" ou "2025" e garante que seja o ano atual
    const anoAtual = hoje.getFullYear();
    const footerText = document.querySelector('footer p.small, .legal-bar');
    
    if (footerText && !footerText.innerHTML.includes(anoAtual)) {
        footerText.innerHTML = footerText.innerHTML.replace(/202[0-9]/, anoAtual);
    }

    // 3. RECUPERADOR DE ABA (TITLE BLINKER)
    // Se o usuário trocar de aba, o título pisca chamando ele de volta
    
    let tituloOriginal = document.title;
    let blinkInterval;
    
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            // Usuário saiu da aba -> Começa a piscar
            let contador = 0;
            blinkInterval = setInterval(() => {
                // Alterna entre 3 mensagens
                if (contador === 0) {
                    document.title = "🔴 (1) Nova Mensagem...";
                } else if (contador === 1) {
                    document.title = "⚠️ Não feche ainda!";
                } else {
                    document.title = "Falar com Dr. Lucas";
                }
                contador = (contador + 1) % 3;
            }, 1000); // Pisca a cada 1 segundo
        } else {
            // Usuário voltou -> Para de piscar
            clearInterval(blinkInterval);
            document.title = tituloOriginal;
        }
    });

});