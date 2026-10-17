/* =================================== */
/* === ARQUIVO: codelei/faq.js === */
/* === CÉREBRO DA PÁGINA DE FAQ (ACORDEÃO DINÂMICO) === */
/* =================================== */

document.addEventListener('DOMContentLoaded', () => {
    
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const pergunta = item.querySelector('.faq-pergunta');
        const resposta = item.querySelector('.faq-resposta');

        pergunta.addEventListener('click', () => {
            
            const estaAtivo = item.classList.contains('ativa');

            // 1. FECHAR TODOS OS OUTROS (Modo Acordeão)
            // Isso garante foco total na pergunta que está sendo lida
            faqItems.forEach(outroItem => {
                if (outroItem !== item && outroItem.classList.contains('ativa')) {
                    outroItem.classList.remove('ativa');
                    const outroBtn = outroItem.querySelector('.faq-pergunta');
                    const outraResp = outroItem.querySelector('.faq-resposta');
                    
                    outroBtn.setAttribute('aria-expanded', 'false');
                    outraResp.style.maxHeight = null; // Recolhe suavemente
                }
            });

            // 2. ALTERNAR O ITEM CLICADO
            if (!estaAtivo) {
                // ABRIR
                item.classList.add('ativa');
                pergunta.setAttribute('aria-expanded', 'true');
                
                // Cálculo matemático da altura exata para animação perfeita
                resposta.style.maxHeight = resposta.scrollHeight + "px";
            } else {
                // FECHAR
                item.classList.remove('ativa');
                pergunta.setAttribute('aria-expanded', 'false');
                resposta.style.maxHeight = null; // Volta a zero
            }
        });
    });

    console.log("✅ [FAQ Live] Sistema de Acordeão Ativo.");
});