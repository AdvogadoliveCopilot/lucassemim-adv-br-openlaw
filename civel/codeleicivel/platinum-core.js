/* =========================================================== */
/* === ARQUIVO: codeleicivel/platinum-core.js === */
/* === FUNÇÃO: Cérebro Central, SEO, Favicon e Retenção === */
/* =========================================================== */

document.addEventListener("DOMContentLoaded", function() {
    console.log("💎 [Platinum Core] Sistemas Cíveis Online.");

    // 1. INJEÇÃO DE DNA (FAVICON AUTOMÁTICO)
    // Garante que a logo apareça na aba do navegador em todas as páginas
    function injetarFavicon() {
        const head = document.head;
        const faviconUrl = 'https://lucassemim.adv.br/Favicon-lucassemim.png'; // Caminho absoluto para garantir

        // Remove favicons antigos se houver
        const oldLinks = document.querySelectorAll('link[rel*="icon"]');
        oldLinks.forEach(el => el.remove());

        const link = document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        link.href = faviconUrl;
        head.appendChild(link);
    }
    injetarFavicon();

    // 2. TAB RECOVERY (RECUPERAÇÃO DE ATENÇÃO)
    // Quando o usuário sai da aba, o título muda para chamá-lo de volta
    const tituloOriginal = document.title;
    const titulosChamariz = [
        "⚠️ Aguardando Confirmação...",
        "⚖️ Seu Patrimônio em Risco?",
        "💎 Volte para o Diagnóstico"
    ];

    document.addEventListener("visibilitychange", function() {
        if (document.hidden) {
            // Escolhe um título aleatório para chamar atenção
            const randomTitle = titulosChamariz[Math.floor(Math.random() * titulosChamariz.length)];
            document.title = randomTitle;
        } else {
            document.title = tituloOriginal; // Restaura ao voltar
        }
    });

    // 3. SEO PLATINUM (SCHEMA JSON-LD) — REMOVIDO (duplicado)
    // Este arquivo injetava seu PRÓPRIO schema JSON-LD "LegalService", com
    // nome ("Lucas Semim Advocacia Patrimonial"), priceRange ("$$$$"),
    // serviceArea e makesOffer DIFERENTES e conflitantes com o schema
    // "LegalService" já injetado por civel-seo.js ("Semim & Associados —
    // Advocacia Cível", OAB/MG 222.539). Duas tags LegalService na mesma
    // página confundem o Google (ruído de SEO / rich results). Removido
    // daqui; civel-seo.js passa a ser a ÚNICA fonte de verdade para o
    // schema LegalService deste site.

    // 4. PROTEÇÃO DE MARCA (ANTI-CÓPIA INTELIGENTE)
    document.addEventListener('copy', function(e) {
        const selection = window.getSelection().toString();
        if (selection.length > 50) {
            const assinatura = `\n\nFonte: Lucas Semim | Advocacia de Elite\nLeia mais em: ${window.location.href}`;
            if (e.clipboardData) {
                e.preventDefault();
                e.clipboardData.setData('text/plain', selection + assinatura);
                
                // Feedback visual sutil (se o platinum-ui estiver carregado, usa o estilo dele)
                console.log("📋 Conteúdo copiado com assinatura.");
            }
        }
    });
});