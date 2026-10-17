/* =========================================================== */
/* === ARQUIVO: codeleicivel/civel-prefetch.js === */
/* === FUNÇÃO: Carregamento Preditivo (Velocidade Zero) === */
/* =========================================================== */

window.civelReady(function() {
    console.log("⚡ [Quantum Prefetch] Radar de navegação ativo.");

    const links = document.querySelectorAll('a');
    const cache = new Set(); // Evita carregar a mesma página 2x

    // Detecta intenção do usuário
    links.forEach(link => {
        // Ignora links externos, âncoras (#) ou javascript
        if (link.href.includes(window.location.hostname) && !link.href.includes('#')) {
            
            // Desktop: Mouse Over
            link.addEventListener('mouseenter', () => prefetchUrl(link.href));
            
            // Mobile: Touch Start (Antes de soltar o dedo)
            link.addEventListener('touchstart', () => prefetchUrl(link.href), {passive: true});
        }
    });

    function prefetchUrl(url) {
        if (cache.has(url)) return;
        
        // Cria o link de pre-carregamento no head
        const linkTag = document.createElement('link');
        linkTag.rel = 'prefetch';
        linkTag.href = url;
        document.head.appendChild(linkTag);
        
        cache.add(url);
        // console.log(`⚡ Pre-carregando: ${url}`);
    }
});