/* =========================================================== */
/* === ARQUIVO: codeleicivel/civel-faq.js === */
/* === FUNÇÃO: Sistema de Perguntas e Respostas (Sanfona) === */
/* =========================================================== */

window.civelReady(() => {
    const faqItems = document.querySelectorAll('.faq-item, .check-item'); // Funciona também no checklist

    faqItems.forEach(item => {
        item.addEventListener('click', () => {
            // Fecha outros
            faqItems.forEach(other => {
                if (other !== item) other.classList.remove('active');
            });
            // Alterna atual
            item.classList.toggle('active');
        });
    });
});