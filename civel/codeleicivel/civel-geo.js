/* =========================================================== */
/* === ARQUIVO: codeleicivel/civel-geo.js (Quantum Geo) === */
/* === FUNÇÃO: Personalização Geográfica Automática === */
/* =========================================================== */

window.civelReady(function() {
    console.log("🌍 [Geo Tático] Iniciando triangulação...");

    // Elementos que vão receber o nome da cidade (opcional — pode não
    // existir nenhum na página atual; a busca abaixo roda de qualquer jeito)
    // Use <span class="geo-cidade">...</span> no seu HTML
    const targets = document.querySelectorAll('.geo-cidade');

    // 1. TENTA RECUPERAR DO CACHE (Performance)
    const cidadeSalva = sessionStorage.getItem('user_city');
    if (cidadeSalva) {
        if (targets.length) aplicarCidade(cidadeSalva);
        return;
    }

    // 2. BUSCA NA API (IPAPI - Grátis até 1000/dia, seguro HTTPS)
    // AJUSTADO 11/09/2026: antes esta busca só rodava se a página tivesse um
    // elemento .geo-cidade — e nenhuma página do site tem esse elemento hoje,
    // então a geolocalização real NUNCA acontecia (sessionStorage.user_city
    // ficava sempre vazio). Isso importa porque social-proof.js passou a
    // depender de um dado REAL de cidade para se apresentar de forma honesta
    // — então a busca agora roda sempre, e a escrita visual em .geo-cidade
    // (função aplicarCidade) continua opcional/condicional a existir o elemento.
    fetch('https://ipapi.co/json/')
        .then(response => response.json())
        .then(data => {
            if (data.city) {
                const cidade = data.city;
                sessionStorage.setItem('user_city', cidade); // Salva para navegar rápido e para outros scripts usarem
                if (targets.length) aplicarCidade(cidade);

                // Bônus: Salva no Log para o CRM
                console.log(`📍 Visitante localizado em: ${cidade} - ${data.region}`);
            }
        })
        .catch(error => {
            console.warn("⚠️ [Geo] Falha na localização (Bloqueador ou Erro). Sem dado real disponível.");
            // Não faz nada, mantém o texto original do HTML ("Atuação Nacional" ou "Belo Horizonte")
        });

    // 3. FUNÇÃO DE APLICAÇÃO VISUAL
    function aplicarCidade(nomeCidade) {
        targets.forEach(el => {
            // Efeito de "Digitação/Troca" suave
            el.style.opacity = 0;
            setTimeout(() => {
                el.innerText = nomeCidade; // Troca o texto
                el.style.opacity = 1;
                el.classList.add('geo-active'); // Adiciona classe para estilizar se quiser (ex: cor dourada)
            }, 300);
        });
        
        // Atualiza também títulos específicos se existirem
        const heroTitle = document.getElementById('hero-title-geo');
        if (heroTitle) {
             heroTitle.innerHTML = heroTitle.innerHTML.replace('Belo Horizonte', `<span style="color:#d4af37">${nomeCidade}</span>`);
        }
    }
});