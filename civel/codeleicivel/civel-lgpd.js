/* =========================================================== */
/* === ARQUIVO: codeleicivel/civel-lgpd.js (Stealth Mode) === */
/* === FUNÇÃO: Aviso de Cookies e Privacidade (LGPD) === */
/* =========================================================== */
/* REESCRITO 11/09/2026: o aviso mostrava o título "CONEXÃO SEGURA"
   com um botão "CONFIRMAR SEGURANÇA" — ou seja, disfarçava um aviso
   de cookies/LGPD de verificação técnica de segurança, o que não é
   verdade (não há nenhuma "conexão" sendo checada) e lê como um
   padrão de interface enganoso (o tipo de coisa que se parece com
   malware/scareware). Also that framing worked against the very
   trust the firm is trying to build. Mantido o mesmo visual discreto
   (canto inferior esquerdo, tema dourado), mas com texto honesto
   sobre o que o aviso realmente é: cookies e privacidade, com link
   real para a política de privacidade do escritório. */

window.civelReady(function() {

    // Verifica se já aceitou (persistente) ou se só fechou sem aceitar
    // nesta mesma sessão de navegação (evita insistir na mesma visita).
    if (localStorage.getItem('lgpd_civel_consent')) return;
    if (sessionStorage.getItem('lgpd_civel_dismissed')) return;

    // Aguarda 4 segundos para não assustar o visitante na chegada
    setTimeout(iniciarAvisoPrivacidade, 4000);

    function iniciarAvisoPrivacidade() {
        const style = document.createElement('style');
        style.innerHTML = `
            #lgpd-stealth {
                position: fixed; bottom: 30px; left: 30px;
                width: 320px; z-index: 9990;
                background: rgba(10, 10, 12, 0.92);
                backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-left: 3px solid #d4af37;
                border-radius: 12px; padding: 20px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.6);
                font-family: 'Lato', sans-serif;
                animation: slideInLeft 0.8s cubic-bezier(0.2, 1, 0.3, 1);
                transition: 0.3s;
            }

            .lgpd-title {
                color: #fff; font-family: 'Teko', sans-serif; font-size: 1.4rem;
                text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;
                display: flex; align-items: center; gap: 8px;
            }

            .lgpd-text {
                color: #aaa; font-size: 0.85rem; line-height: 1.5; margin-bottom: 15px;
            }
            .lgpd-text a { color: #d4af37; text-decoration: underline; }
            .lgpd-text a:hover { color: #fff; }

            .lgpd-actions { display: flex; gap: 10px; align-items: center; }

            #btn-lgpd-accept {
                background: #d4af37; color: #000; border: none;
                padding: 8px 20px; border-radius: 4px;
                font-family: 'Teko'; font-size: 1.1rem; cursor: pointer;
                transition: 0.3s; flex: 1;
            }
            #btn-lgpd-accept:hover { background: #fff; transform: translateY(-2px); }

            .lgpd-close {
                color: #666; cursor: pointer; font-size: 0.8rem; text-decoration: underline;
                background: none; border: none; padding: 0; font-family: inherit;
            }
            .lgpd-close:hover { color: #fff; }

            /* Mobile: Vira uma barra fina para não tapar conteúdo */
            @media(max-width: 768px) {
                #lgpd-stealth {
                    left: 20px; bottom: 80px; /* Acima da barra de navegação */
                    width: calc(100% - 40px);
                    padding: 15px;
                }
            }

            @keyframes slideInLeft { from { opacity: 0; transform: translateX(-50px); } to { opacity: 1; transform: translateX(0); } }
            @keyframes fadeOut { to { opacity: 0; transform: translateY(20px); } }
        `;
        document.head.appendChild(style);

        const banner = document.createElement('div');
        banner.id = 'lgpd-stealth';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-label', 'Aviso de cookies e privacidade');
        banner.innerHTML = `
            <div class="lgpd-title">
                <span style="color:#d4af37">🍪</span> PRIVACIDADE E COOKIES
            </div>
            <p class="lgpd-text">
                Usamos cookies essenciais ao funcionamento do site. Seus dados são tratados com
                sigilo, conforme a LGPD e o Estatuto da Advocacia (art. 25).
                <a href="https://lucassemim.adv.br/politica-privacidade.html" target="_blank" rel="noopener noreferrer">Ver política de privacidade</a>.
            </p>
            <div class="lgpd-actions">
                <button id="btn-lgpd-accept" type="button">ACEITAR E FECHAR</button>
                <button class="lgpd-close" id="btn-lgpd-close" type="button">Fechar</button>
            </div>
        `;

        document.body.appendChild(banner);

        // AÇÃO: Aceitar
        document.getElementById('btn-lgpd-accept').addEventListener('click', function() {
            fecharBanner(true);
        });

        // AÇÃO: Fechar (sem registrar aceite explícito, mas some da tela e não volta a incomodar nesta sessão)
        document.getElementById('btn-lgpd-close').addEventListener('click', function() {
            fecharBanner(false);
        });

        function fecharBanner(salvarConsentimento) {
            if (salvarConsentimento) {
                localStorage.setItem('lgpd_civel_consent', 'true');
            } else {
                // Sem consentimento salvo (o usuário só fechou), evita reaparecer
                // repetidamente na mesma sessão de navegação.
                sessionStorage.setItem('lgpd_civel_dismissed', 'true');
            }

            banner.style.animation = "fadeOut 0.5s forwards";
            setTimeout(() => banner.remove(), 500);
        }
    }
});
