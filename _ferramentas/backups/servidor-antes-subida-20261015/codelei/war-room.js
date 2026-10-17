/* =========================================================== */
/* === ARQUIVO: codelei/war-room.js === */
/* === FUNÇÃO: Sala de Guerra, Status Tático e Ping === */
/* =========================================================== */

document.addEventListener("DOMContentLoaded", function() {
    const lobbyContainer = document.getElementById('war-room-lobby');
    if (!lobbyContainer) return;

    // --- 1. LÓGICA DE STATUS TÁTICO ---
    // Define se está Online baseado no horário (ex: 07h às 23h) ou manual
    const hora = new Date().getHours();
    const isHorarioNobre = hora >= 7 && hora <= 23;
    
    // Configuração Visual do Status
    const statusConfig = isHorarioNobre ? 
        { texto: "OPERADOR ONLINE", cor: "#2ecc71", anim: "pulse-green" } : 
        { texto: "PLANTÃO DE SOBREAVISO", cor: "#f1c40f", anim: "pulse-yellow" };

    // --- 2. HTML DO CONSOLE ---
    lobbyContainer.innerHTML = `
        <div class="war-room-box tilt-effect">
            
            <div class="status-panel" style="border-color: ${statusConfig.cor}">
                <div class="status-led ${statusConfig.anim}" style="background: ${statusConfig.cor}"></div>
                <span style="color: ${statusConfig.cor}; letter-spacing: 2px;">${statusConfig.texto}</span>
            </div>

            <div class="wr-header">
                <h3>🛡️ PROTOCOLO DE ACESSO</h3>
                <p>Verifique o status do advogado antes de entrar.</p>
            </div>

            <div class="ping-area">
                <p style="font-size:0.8rem; color:#ccc; margin-bottom:10px;">Não pague sem confirmar a presença.</p>
                <button class="btn-ping" onclick="pingAdvogado()">
                    📡 TESTAR DISPONIBILIDADE AGORA
                </button>
                <div id="ping-feedback" style="display:none; margin-top:10px; color:#2ecc71; font-size:0.8rem;">
                    ✓ Sinal enviado! Aguarde confirmação no WhatsApp ou entre se o status estiver verde.
                </div>
            </div>

            <hr style="border-color:#333; margin: 20px 0;">

            <div class="wr-camera-check">
                <video id="localVideo" autoplay playsinline muted></video>
                <div class="camera-overlay" id="cam-overlay">
                    <span>PRÉ-VISUALIZAÇÃO OFF</span>
                </div>
                <button id="btn-testar-cam" class="btn-tech" onclick="ativarCamera()">
                    📸 LIGAR CÂMERA
                </button>
            </div>

            <div class="wr-checklist">
                <label class="wr-check"><input type="checkbox" id="check-sigilo"> <span>Estou em local seguro.</span></label>
                <label class="wr-check"><input type="checkbox" id="check-gravacao"> <span>Aceito o sigilo da reunião.</span></label>
            </div>

            <a href="https://meet.google.com/hpv-daxf-tmm" target="_blank" id="btn-entrar-meet" class="btn-meet-locked">
                🔒 AGUARDANDO VALIDAÇÃO...
            </a>
        </div>
    `;

    // --- 3. CSS INJETADO ---
    const style = document.createElement('style');
    style.innerHTML = `
        .war-room-box {
            background: rgba(10, 20, 30, 0.95); border: 1px solid #00f3ff;
            border-radius: 15px; padding: 30px; max-width: 600px; margin: 0 auto;
            box-shadow: 0 0 50px rgba(0, 243, 255, 0.1); text-align: center;
        }
        .status-panel {
            background: #000; padding: 10px; border-radius: 50px; border: 1px solid;
            display: inline-flex; align-items: center; gap: 10px; margin-bottom: 20px;
            font-family: 'Fira Code'; font-size: 0.9rem;
        }
        .status-led { width: 10px; height: 10px; border-radius: 50%; }
        .pulse-green { animation: blinkGreen 2s infinite; box-shadow: 0 0 10px #2ecc71; }
        .pulse-yellow { animation: blinkYellow 2s infinite; box-shadow: 0 0 10px #f1c40f; }
        
        .btn-ping {
            background: rgba(255,255,255,0.05); border: 1px dashed #d4af37; color: #d4af37;
            padding: 10px 20px; border-radius: 4px; cursor: pointer; font-family: 'Teko'; font-size: 1.2rem;
            transition: 0.3s; width: 100%;
        }
        .btn-ping:hover { background: #d4af37; color: #000; }

        .wr-header h3 { font-family: 'Teko'; color: #00f3ff; font-size: 2rem; margin: 0; }
        .wr-header p { color: #888; font-size: 0.9rem; font-family: 'Fira Code'; margin-bottom: 10px; }
        
        .wr-camera-check {
            width: 100%; height: 200px; background: #000; border: 2px dashed #333;
            border-radius: 10px; position: relative; overflow: hidden; margin-bottom: 20px;
            display: flex; align-items: center; justify-content: center;
        }
        #localVideo { width: 100%; height: 100%; object-fit: cover; display: none; transform: scaleX(-1); }
        .camera-overlay { position: absolute; color: #666; font-size: 0.8rem; }
        
        .btn-tech {
            background: transparent; border: 1px solid #00f3ff; color: #00f3ff;
            padding: 8px 15px; cursor: pointer; font-family: 'Fira Code'; font-size: 0.8rem;
            z-index: 10; transition: 0.3s;
        }
        .btn-tech:hover { background: rgba(0, 243, 255, 0.1); box-shadow: 0 0 15px #00f3ff; }

        .wr-checklist { text-align: left; margin-bottom: 20px; }
        .wr-check { display: flex; gap: 10px; color: #ccc; font-size: 0.9rem; margin-bottom: 5px; cursor: pointer; }
        .wr-check input { accent-color: #2ecc71; }
        
        .btn-meet-locked {
            display: block; width: 100%; padding: 15px; background: #333; color: #666;
            text-decoration: none; font-weight: bold; border-radius: 6px; pointer-events: none;
            font-family: 'Teko'; font-size: 1.5rem; transition: 0.3s; text-transform: uppercase;
        }
        .btn-meet-active {
            background: #2ecc71; color: #fff; pointer-events: all;
            box-shadow: 0 0 20px rgba(46, 204, 113, 0.4);
        }
        .btn-meet-active:hover { transform: scale(1.02); background: #fff; color: #000; }
        
        @keyframes blinkGreen { 0% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes blinkYellow { 0% { opacity: 1; } 50% { opacity: 0.3; } }
    `;
    document.head.appendChild(style);

    // Lógica de Validação de Entrada
    const checkSigilo = document.getElementById('check-sigilo');
    const checkGravacao = document.getElementById('check-gravacao');
    const btnMeet = document.getElementById('btn-entrar-meet');

    function validarEntrada() {
        if (checkSigilo.checked && checkGravacao.checked) {
            btnMeet.classList.add('btn-meet-active');
            btnMeet.classList.remove('btn-meet-locked');
            btnMeet.innerHTML = "🔓 ENTRAR NA SALA AGORA";
        } else {
            btnMeet.classList.remove('btn-meet-active');
            btnMeet.classList.add('btn-meet-locked');
            btnMeet.innerHTML = "🔒 AGUARDANDO VALIDAÇÃO...";
        }
    }
    checkSigilo.addEventListener('change', validarEntrada);
    checkGravacao.addEventListener('change', validarEntrada);
});

// FUNÇÃO DE PING (WHATSAPP)
window.pingAdvogado = function() {
    const texto = `📡 *SINAL DE ALERTA (PLANTÃO)*%0A%0ADr. Lucas, estou na Sala de Guerra aguardando atendimento.%0A%0A*STATUS:* Pronto para entrar no Meet.%0A*AÇÃO:* Aguardo sua confirmação.`;
    window.open(`https://wa.me/5531989420094?text=${texto}`, '_blank');
    
    document.getElementById('ping-feedback').style.display = 'block';
};

// CÂMERA
window.ativarCamera = async function() {
    const video = document.getElementById('localVideo');
    const btn = document.getElementById('btn-testar-cam');
    const overlay = document.getElementById('cam-overlay');
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        video.srcObject = stream;
        video.style.display = "block";
        btn.style.display = "none"; 
        overlay.style.display = "none";
    } catch (err) {
        console.error("Erro:", err);
        alert("Erro ao acessar câmera. Verifique permissões.");
    }
};