/* =========================================================== */
/* === ARQUIVO: codeleicivel/civel-interacao.js === */
/* === FUNÇÃO: Retenção de Clientes (Aversão à Perda) === */
/* =========================================================== */

window.civelReady(function() {
    
    if (sessionStorage.getItem('civel_exit_shown')) return;

    // Gatilho de Saída (Mouse saindo pelo topo)
    document.addEventListener('mouseleave', function(e) {
        if (e.clientY < 0) {
            mostrarOportunidade();
        }
    });

    function mostrarOportunidade() {
        if (sessionStorage.getItem('civel_exit_shown')) return;
        sessionStorage.setItem('civel_exit_shown', 'true');

        // Define a mensagem baseada na página atual
        let titulo = "PROTEJA SEU PATRIMÔNIO";
        let msg = "Você está saindo sem blindar seus bens? Um erro jurídico pode custar 40% do seu legado.";
        let btnTexto = "QUERO MINHA ANÁLISE GRATUITA";
        
        if (window.location.href.includes("bancario")) {
            titulo = "O BANCO VAI FICAR COM SEU DINHEIRO?";
            msg = "Sair agora significa aceitar os juros abusivos. Podemos recuperar o que é seu.";
            btnTexto = "AUDITAR MEU CONTRATO AGORA";
        }

        // CSS Injetado (Estilo Platinum)
        const style = document.createElement('style');
        style.innerHTML = `
            #civel-modal-overlay {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(10, 10, 10, 0.9); backdrop-filter: blur(8px);
                z-index: 12000; display: flex; justify-content: center; align-items: center;
                animation: fadeIn 0.4s;
            }
            #civel-modal {
                background: #0f0f0f; border: 1px solid #c0c0c0; border-top: 4px solid #d4af37;
                width: 90%; max-width: 550px; padding: 40px; text-align: center;
                box-shadow: 0 20px 80px rgba(212, 175, 55, 0.1); border-radius: 10px;
            }
            #civel-modal h2 { font-family: 'Playfair Display'; color: #fff; font-size: 2.5rem; margin-bottom: 15px; }
            #civel-modal p { font-family: 'Lato'; color: #ccc; font-size: 1.1rem; margin-bottom: 30px; }
            
            .btn-civel-exit {
                display: block; width: 100%; padding: 15px; background: #d4af37; color: #000;
                font-family: 'Teko'; font-size: 1.6rem; text-decoration: none; border-radius: 4px;
                transition: 0.3s;
            }
            .btn-civel-exit:hover { background: #fff; transform: scale(1.02); }
            
            .close-civel { margin-top: 20px; color: #666; cursor: pointer; font-size: 0.9rem; text-decoration: underline; }
            @keyframes fadeIn { from {opacity:0;} to {opacity:1;} }
        `;
        document.head.appendChild(style);

        // HTML
        const overlay = document.createElement('div');
        overlay.id = 'civel-modal-overlay';
        overlay.innerHTML = `
            <div id="civel-modal">
                <h2>${titulo}</h2>
                <p>${msg}</p>
                <a href="https://wa.me/5531989420094?text=Estava%20saindo%20do%20site%20C%C3%ADvel%20mas%20decidi%20falar%20com%20especialista." class="btn-civel-exit" target="_blank">
                    ${btnTexto}
                </a>
                <div class="close-civel" onclick="document.getElementById('civel-modal-overlay').remove()">Não, prefiro arriscar.</div>
            </div>
        `;
        document.body.appendChild(overlay);
    }
});