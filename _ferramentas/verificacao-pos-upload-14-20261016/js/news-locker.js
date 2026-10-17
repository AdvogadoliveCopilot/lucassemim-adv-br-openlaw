/* =========================================================== */
/* === FICHEIRO: js/news-locker.js (Captador de Leads V1) ==== */
/* === FUNÇÃO: Bloquear conteúdo premium e exigir código VIP === */
/* =========================================================== */

document.addEventListener("DOMContentLoaded", function() {
    // === CONFIGURAÇÕES DA OPERAÇÃO ===
    const CODIGO_SECRETO = "ELITE2026"; // Mude o código aqui quando quiser
    const WHATSAPP_NUMERO = "5531989420094"; 
    
    // 1. Identificar o corpo do artigo
    const articleContent = document.querySelector('.article-content');
    
    if (!articleContent) return; // Se não achar o artigo, não faz nada

    // 2. Verifica se a página atual deve ser bloqueada
    // (Para ativar o bloqueio, basta adicionar a classe 'premium-locked' na tag <article class="article-content premium-locked">)
    if (!articleContent.classList.contains('premium-locked')) return;

    console.log("🔒 [News Locker] Conteúdo Premium Detectado. Acionando Escudo...");

    // 3. Aplica o efeito de desfoque (Blur) no artigo (deixa o primeiro parágrafo visível)
    const paragraphs = articleContent.querySelectorAll('p, h2, h3, div, ul');
    paragraphs.forEach((el, index) => {
        if (index > 2) { // Deixa os 3 primeiros elementos livres
            el.classList.add('locked-blur');
        }
    });

    // 4. Cria a Interface de Bloqueio (Glassmorphism)
    const lockerUI = document.createElement('div');
    lockerUI.id = "elite-news-locker";
    
    // Título da página para mandar no WhatsApp
    const pageTitle = encodeURIComponent(document.title.split('|')[0].trim());
    const msgZap = `Olá, Dr. Lucas! Estava a ler a matéria *"${decodeURIComponent(pageTitle)}"* e gostaria de receber o Código VIP de acesso gratuito.`;

    lockerUI.innerHTML = `
        <div class="locker-box">
            <i class="fas fa-lock text-gold fs-1 mb-3"></i>
            <h3 class="font-teko text-white fs-2 mb-2">CONTEÚDO JURÍDICO RESTRITO</h3>
            <p class="text-secondary mb-4" style="font-size: 1.1rem; line-height: 1.5;">
                Esta é uma tese de Defesa Criminal de Elite. Para proteger a exclusividade da nossa estratégia, o restante do artigo está bloqueado.
            </p>
            
            <div class="input-group mb-3">
                <input type="text" id="codigo-acesso" class="form-control text-center font-teko fs-4" placeholder="DIGITE O CÓDIGO VIP" style="background: rgba(0,0,0,0.8); border: 1px solid #d4af37; color: #fff; text-transform: uppercase;">
                <button class="btn btn-warning font-teko fs-5 px-4" id="btn-liberar-news" type="button">LIBERAR</button>
            </div>
            
            <p id="locker-error" class="text-danger font-teko fs-5 d-none mb-3">❌ CÓDIGO INVÁLIDO OU EXPIRADO.</p>

            <div class="mt-4 pt-3 border-top border-secondary">
                <p class="text-secondary small mb-2">Não tem o código?</p>
                <a href="https://api.whatsapp.com/send?phone=${WHATSAPP_NUMERO}&text=${msgZap}" target="_blank" class="btn btn-outline-success w-100 font-teko fs-4 d-flex align-items-center justify-content-center">
                    <i class="fab fa-whatsapp me-2"></i> SOLICITAR CÓDIGO GRATUITO NO WHATSAPP
                </a>
            </div>
        </div>
    `;

    articleContent.appendChild(lockerUI);

    // 5. Estilos CSS Injetados
    const style = document.createElement('style');
    style.innerHTML = `
        .locked-blur {
            filter: blur(6px);
            opacity: 0.4;
            user-select: none;
            pointer-events: none;
        }
        #elite-news-locker {
            position: absolute;
            top: 40%;
            left: 0;
            width: 100%;
            display: flex;
            justify-content: center;
            z-index: 100;
        }
        .locker-box {
            background: rgba(15, 15, 15, 0.85);
            backdrop-filter: blur(15px);
            border: 2px solid #d4af37;
            border-radius: 12px;
            padding: 40px;
            max-width: 500px;
            text-align: center;
            box-shadow: 0 20px 50px rgba(0,0,0,0.9);
        }
        .locker-box input:focus {
            box-shadow: 0 0 15px rgba(212, 175, 55, 0.5);
            border-color: #d4af37;
        }
    `;
    document.head.appendChild(style);

    // 6. Lógica de Liberação
    document.getElementById('btn-liberar-news').addEventListener('click', function() {
        const inputCode = document.getElementById('codigo-acesso').value.trim().toUpperCase();
        const errorMsg = document.getElementById('locker-error');

        if (inputCode === CODIGO_SECRETO) {
            // Sucesso! Remove o blur e destrói o locker
            paragraphs.forEach(el => el.classList.remove('locked-blur'));
            lockerUI.style.transition = "opacity 0.5s";
            lockerUI.style.opacity = "0";
            setTimeout(() => lockerUI.remove(), 500);
            console.log("🔓 [News Locker] Acesso Liberado!");
        } else {
            // Erro
            errorMsg.classList.remove('d-none');
            setTimeout(() => errorMsg.classList.add('d-none'), 3000);
        }
    });
});