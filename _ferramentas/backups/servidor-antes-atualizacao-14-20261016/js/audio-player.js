/* =========================================================== */
/* === FICHEIRO: js/audio-player.js (Leitor Neural V2) ======= */
/* === FUNÇÃO: Leitura de Artigos com Voz Premium e Anti-Crash */
/* =========================================================== */

document.addEventListener("DOMContentLoaded", function() {
    
    let synth = window.speechSynthesis;
    let isPlaying = false;
    let paragraphs = []; 
    let currentIndex = 0;
    let availableVoices = [];

    // 1. CARREGAMENTO DE VOZES PREMIUM (Para evitar a voz robótica padrão)
    function populateVoices() {
        availableVoices = synth.getVoices();
    }
    populateVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = populateVoices;
    }

    // 2. DETEÇÃO DE IDIOMA (A Inteligência Poliglota)
    function getPageLanguage() {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; googtrans=`);
        let lang = 'pt-BR'; // Padrão
        
        if (parts.length === 2) {
            const cookieVal = parts.pop().split(';').shift(); 
            const targetLang = cookieVal.split('/').pop(); 
            
            if (targetLang === 'en') lang = 'en-US';
            if (targetLang === 'es') lang = 'es-ES';
            if (targetLang === 'pt') lang = 'pt-BR'; // Força PT-BR em traduções para PT
        }
        return lang;
    }

    // 3. SELEÇÃO DA MELHOR VOZ DISPONÍVEL
    function getBestVoice(targetLang) {
        if (availableVoices.length === 0) populateVoices();
        
        // Tenta encontrar uma voz do Google, Microsoft ou Premium que corresponda ao idioma
        let bestVoice = availableVoices.find(v => v.lang.includes(targetLang) && (v.name.includes('Google') || v.name.includes('Microsoft') || v.name.includes('Premium')));
        
        // Se não encontrar uma voz Premium, apanha a primeira disponível do idioma
        if (!bestVoice) {
            bestVoice = availableVoices.find(v => v.lang.includes(targetLang));
        }
        
        // Fallback absoluto
        return bestVoice || availableVoices[0];
    }

    function initAudioPlayer() {
        const articleContent = document.querySelector('.article-content');
        const articleTitle = document.querySelector('h1');

        // Evita duplicação do player
        if (!articleContent || document.getElementById('btn-play-pause')) return;

        // Estilos Injetados
        const style = document.createElement('style');
        style.innerHTML = `
            .audio-player-box {
                background: linear-gradient(135deg, #101010 0%, #050505 100%);
                border: 1px solid rgba(212, 175, 55, 0.4); border-radius: 8px;
                padding: 15px 20px; margin: 25px 0; display: flex; align-items: center; gap: 15px;
                box-shadow: 0 10px 20px rgba(0,0,0,0.5); transition: 0.3s;
            }
            .audio-player-box:hover { border-color: var(--accent-gold); box-shadow: 0 10px 30px rgba(212, 175, 55, 0.1); }
            
            .btn-audio {
                background: linear-gradient(45deg, #b8860b, #d4af37); color: #000; border: none; width: 50px; height: 50px;
                border-radius: 50%; display: flex; align-items: center; justify-content: center;
                cursor: pointer; transition: 0.3s; font-size: 1.3rem; box-shadow: 0 5px 15px rgba(212, 175, 55, 0.3);
            }
            .btn-audio:hover { transform: scale(1.08); background: #fff; }
            
            .audio-info { flex-grow: 1; }
            .audio-label { font-family: 'Teko', sans-serif; color: #fff; font-size: 1.5rem; line-height: 1; margin-bottom: 2px; }
            .audio-status { font-family: 'Lato', sans-serif; color: #888; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 2px; }
            
            .audio-wave { height: 20px; display: flex; align-items: center; gap: 4px; }
            .bar { width: 4px; background: #333; height: 5px; transition: 0.2s; border-radius: 2px; }
            .playing .bar { background: var(--accent-gold); animation: sound 0ms -800ms linear infinite alternate; }
            .playing .bar:nth-child(1) { animation-duration: 474ms; }
            .playing .bar:nth-child(2) { animation-duration: 433ms; }
            .playing .bar:nth-child(3) { animation-duration: 407ms; }
            .playing .bar:nth-child(4) { animation-duration: 458ms; }
            .playing .bar:nth-child(5) { animation-duration: 400ms; }
            @keyframes sound { 0% { height: 3px; opacity: .35; } 100% { height: 20px; opacity: 1; } }

            .reading-active {
                background-color: rgba(212, 175, 55, 0.1);
                border-left: 4px solid var(--accent-gold);
                padding-left: 15px;
                color: #fff !important;
                border-radius: 0 4px 4px 0;
                transition: all 0.4s ease;
            }
        `;
        document.head.appendChild(style);

        // Estrutura do Player com ARIA Tags (SEO Acessibilidade)
        const playerDiv = document.createElement('div');
        playerDiv.className = 'audio-player-box';
        playerDiv.innerHTML = `
            <button id="btn-play-pause" class="btn-audio" aria-label="Tocar ou Pausar a leitura do artigo">
                <i class="fas fa-play"></i>
            </button>
            <div class="audio-info">
                <div class="audio-label">OUVIR ARTIGO</div>
                <div id="audio-status-text" class="audio-status">CLIQUE PARA INICIAR</div>
            </div>
            <div id="audio-wave-anim" class="audio-wave ms-auto" aria-hidden="true">
                <div class="bar"></div><div class="bar"></div><div class="bar"></div><div class="bar"></div><div class="bar"></div>
            </div>
        `;
        articleContent.insertBefore(playerDiv, articleContent.firstChild);

        // Mapeamento Cirúrgico do Texto
        paragraphs = [];
        if(articleTitle) paragraphs.push(articleTitle);
        const elements = articleContent.querySelectorAll('p, h2, h3, li');
        elements.forEach(el => {
            // Ignora parágrafos vazios ou invisíveis
            if(el.innerText.trim().length > 5) paragraphs.push(el);
        });

        const btn = document.getElementById('btn-play-pause');
        const icon = btn.querySelector('i');
        const statusText = document.getElementById('audio-status-text');
        const wave = document.getElementById('audio-wave-anim');

        function stopReading() {
            synth.cancel();
            isPlaying = false;
            icon.className = 'fas fa-play';
            wave.classList.remove('playing');
            statusText.innerText = "PAUSADO / PAUSED";
            document.querySelectorAll('.reading-active').forEach(el => el.classList.remove('reading-active'));
        }

        function readNextParagraph() {
            if (!isPlaying) return;

            if (currentIndex >= paragraphs.length) {
                stopReading();
                statusText.innerText = "CONCLUÍDO / DONE";
                currentIndex = 0; // Prepara para recomeçar se o utilizador quiser
                return;
            }

            if (currentIndex > 0 && paragraphs[currentIndex - 1]) {
                paragraphs[currentIndex - 1].classList.remove('reading-active');
            }

            const element = paragraphs[currentIndex];
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('reading-active');

            const currentLang = getPageLanguage();
            const utterance = new SpeechSynthesisUtterance(element.innerText);
            
            // Aplica a Voz Premium e Configurações
            const selectedVoice = getBestVoice(currentLang);
            if (selectedVoice) utterance.voice = selectedVoice;
            
            utterance.lang = currentLang; 
            utterance.rate = 1.05; // Levemente mais rápido para não entediar
            utterance.pitch = 1.0;

            // Proteção Anti-Crash na passagem
            utterance.onend = function() {
                currentIndex++;
                setTimeout(readNextParagraph, 100); // Pausa de 100ms para o motor "respirar"
            };

            utterance.onerror = function(event) {
                console.warn("⚠️ [Audio Player] Erro na leitura do parágrafo:", event);
                synth.cancel(); // Limpa o motor
                currentIndex++;
                setTimeout(readNextParagraph, 200); // Tenta continuar no próximo
            };

            synth.speak(utterance);
        }

        btn.addEventListener('click', function() {
            if (isPlaying) {
                stopReading();
            } else {
                if (synth.speaking) synth.cancel(); // Garante que começa limpo
                isPlaying = true;
                
                // Se já leu tudo, recomeça do zero
                if (currentIndex >= paragraphs.length) currentIndex = 0; 
                
                icon.className = 'fas fa-stop';
                wave.classList.add('playing');
                statusText.innerText = "A LER / READING...";
                readNextParagraph();
            }
        });
    }

    // Atraso inteligente para garantir o carregamento prévio de traduções e DOM
    setTimeout(initAudioPlayer, 1200);
});