/* =========================================================== */
/* === ARQUIVO: codeleicivel/civel-meeting.js === */
/* === FUNÇÃO: Lobby de Reunião Executiva (Platinum) === */
/* =========================================================== */

window.civelReady(function() {
    const lobbyContainer = document.getElementById('civel-meeting-lobby');
    if (!lobbyContainer) return;

    console.log("🏛️ [Civil Meeting] Sala Executiva Preparada.");

    // HTML DO CONSOLE EXECUTIVO
    lobbyContainer.innerHTML = `
        <div class="meeting-box tilt-effect">
            
            <div class="meeting-header">
                <h3>SALA DE CONFERÊNCIA</h3>
                <p>// AMBIENTE CRIPTOGRAFADO DE ALTO NÍVEL</p>
            </div>

            <div class="meeting-cam-wrapper">
                <video id="localVideo" autoplay playsinline muted></video>
                <div class="cam-placeholder" id="cam-overlay">
                    <span>PRÉ-VISUALIZAÇÃO DE VÍDEO</span>
                </div>
                <button id="btn-testar-cam" class="btn-platinum-tech" onclick="ativarCameraCivel()">
                    LIGAR VÍDEO & ÁUDIO
                </button>
            </div>

            <div class="meeting-checklist">
                <label class="check-item">
                    <input type="checkbox" id="check-privacidade"> 
                    <span>Estou em ambiente com privacidade.</span>
                </label>
                <label class="check-item">
                    <input type="checkbox" id="check-agenda"> 
                    <span>Tenho os documentos do caso em mãos.</span>
                </label>
            </div>

            <a href="https://meet.google.com/hpv-daxf-tmm" target="_blank" id="btn-enter-room" class="btn-enter-locked">
                AGUARDANDO VALIDAÇÃO...
            </a>
            
            <p style="font-size:0.75rem; color:#666; margin-top:15px; font-family:'Lato';">
                *Reunião protegida por sigilo advogado-cliente.
            </p>
        </div>
    `;

    // CSS INJETADO (PLATINUM THEME)
    const style = document.createElement('style');
    style.innerHTML = `
        .meeting-box {
            background: rgba(15, 15, 15, 0.95); 
            border: 1px solid #d4af37; /* Borda Ouro */
            border-top: 4px solid #d4af37;
            border-radius: 10px; padding: 40px; max-width: 600px; margin: 0 auto;
            box-shadow: 0 20px 60px rgba(0,0,0,0.8); text-align: center;
        }
        
        .meeting-header h3 { font-family: 'Playfair Display'; color: #fff; font-size: 2rem; margin: 0; }
        .meeting-header p { color: #d4af37; font-size: 0.8rem; font-family: 'Fira Code'; margin-bottom: 25px; letter-spacing: 1px; }
        
        .meeting-cam-wrapper {
            width: 100%; height: 220px; background: #050505; border: 1px solid #333;
            border-radius: 6px; position: relative; overflow: hidden; margin-bottom: 25px;
            display: flex; align-items: center; justify-content: center;
        }
        #localVideo { width: 100%; height: 100%; object-fit: cover; display: none; transform: scaleX(-1); }
        .cam-placeholder { position: absolute; color: #444; font-size: 0.8rem; font-family: 'Fira Code'; }
        
        .btn-platinum-tech {
            background: transparent; border: 1px solid #c0c0c0; color: #c0c0c0;
            padding: 8px 20px; cursor: pointer; font-family: 'Teko'; font-size: 1.2rem;
            z-index: 10; transition: 0.3s; border-radius: 4px;
        }
        .btn-platinum-tech:hover { background: #c0c0c0; color: #000; }

        .meeting-checklist { text-align: left; margin-bottom: 25px; border-top: 1px dashed #333; padding-top: 20px; }
        .check-item { display: flex; gap: 10px; color: #ccc; font-size: 0.95rem; margin-bottom: 10px; cursor: pointer; font-family: 'Lato'; }
        .check-item input { accent-color: #d4af37; }
        
        .btn-enter-locked {
            display: block; width: 100%; padding: 15px; background: #222; color: #555;
            text-decoration: none; font-weight: bold; border-radius: 4px; pointer-events: none;
            font-family: 'Teko'; font-size: 1.6rem; transition: 0.3s; text-transform: uppercase; letter-spacing: 1px;
        }
        .btn-enter-active {
            background: linear-gradient(45deg, #d4af37, #b8860b); color: #000; pointer-events: all;
            box-shadow: 0 5px 20px rgba(212, 175, 55, 0.3);
        }
        .btn-enter-active:hover { transform: translateY(-2px); color: #fff; }
    `;
    document.head.appendChild(style);

    // Lógica de Validação
    const checkPriv = document.getElementById('check-privacidade');
    const checkAgenda = document.getElementById('check-agenda');
    const btnEnter = document.getElementById('btn-enter-room');

    function validarEntradaCivel() {
        if (checkPriv.checked && checkAgenda.checked) {
            btnEnter.classList.add('btn-enter-active');
            btnEnter.classList.remove('btn-enter-locked');
            btnEnter.innerHTML = "INGRESSAR NA REUNIÃO";
        } else {
            btnEnter.classList.remove('btn-enter-active');
            btnEnter.classList.add('btn-enter-locked');
            btnEnter.innerHTML = "AGUARDANDO VALIDAÇÃO...";
        }
    }

    checkPriv.addEventListener('change', validarEntradaCivel);
    checkAgenda.addEventListener('change', validarEntradaCivel);
});

// CÂMERA (Lógica Compartilhada mas estilo próprio)
window.ativarCameraCivel = async function() {
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
        alert("Por favor, permita o acesso à câmera para a reunião.");
    }
};