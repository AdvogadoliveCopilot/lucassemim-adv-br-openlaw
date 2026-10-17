/* =========================================================== */
/* === ARQUIVO: codelei/cofre.js (Análise de Documentos) === */
/* === FUNÇÃO: Drag & Drop Seguro e Metadados de Arquivo === */
/* =========================================================== */

document.addEventListener("DOMContentLoaded", function() {
    
    const dropZone = document.getElementById('dropzone-live');
    if (!dropZone) return; // Só roda se existir o elemento na página

    // 1. INJEÇÃO DE CSS DO COFRE
    const style = document.createElement('style');
    style.innerHTML = `
        .cofre-wrapper {
            border: 2px dashed #444;
            border-radius: 10px;
            padding: 40px;
            text-align: center;
            transition: all 0.3s;
            background: rgba(0,0,0,0.3);
            cursor: pointer;
            position: relative;
            overflow: hidden;
        }
        .cofre-wrapper.dragover {
            border-color: #d4af37;
            background: rgba(212, 175, 55, 0.1);
            box-shadow: 0 0 20px rgba(212, 175, 55, 0.2);
        }
        .cofre-icon {
            font-size: 3rem;
            color: #666;
            margin-bottom: 10px;
            transition: 0.3s;
        }
        .cofre-wrapper:hover .cofre-icon { color: #d4af37; transform: scale(1.1); }
        .cofre-text { font-family: 'Fira Code'; color: #ccc; font-size: 0.9rem; }
        .file-input-hidden { display: none; }
        
        /* Estado de Análise */
        .scanning-bar {
            position: absolute; bottom: 0; left: 0; height: 4px; width: 0%;
            background: #00f3ff; transition: width 1s;
        }
        .file-info {
            margin-top: 20px;
            padding: 15px;
            background: #111;
            border: 1px solid #00f3ff;
            border-radius: 6px;
            display: none;
            text-align: left;
            animation: fadeIn 0.5s;
        }
        .file-name { color: #fff; font-weight: bold; font-family: 'Teko'; font-size: 1.2rem; }
        .file-meta { color: #00f3ff; font-size: 0.8rem; font-family: 'Fira Code'; }
        .btn-send-doc {
            display: block; width: 100%; margin-top: 10px;
            background: #25d366; color: #fff; border: none; padding: 8px;
            border-radius: 4px; cursor: pointer; font-weight: bold;
        }
    `;
    document.head.appendChild(style);

    // 2. CONSTRUÇÃO VISUAL
    dropZone.innerHTML = `
        <div class="cofre-wrapper" id="drop-area">
            <div class="cofre-icon">📂</div>
            <div class="cofre-text">
                ARRASTE SEU PROCESSO/MANDADO AQUI<br>
                <span style="font-size:0.7rem; color:#666;">(Ou clique para selecionar)</span>
            </div>
            <div class="scanning-bar" id="scan-bar"></div>
            <input type="file" id="file-input" class="file-input-hidden">
        </div>
        
        <div class="file-info" id="file-result">
            <div class="file-name" id="fname"></div>
            <div class="file-meta" id="fmeta"></div>
            <button class="btn-send-doc" id="btn-send-doc">ENVIAR ARQUIVO VIA WHATSAPP</button>
        </div>
    `;

    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('file-input');
    const fileResult = document.getElementById('file-result');
    
    // 3. EVENTOS DE DRAG & DROP
    dropArea.addEventListener('click', () => fileInput.click());

    ['dragenter', 'dragover'].forEach(evt => {
        dropArea.addEventListener(evt, (e) => {
            e.preventDefault();
            dropArea.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(evt => {
        dropArea.addEventListener(evt, (e) => {
            e.preventDefault();
            dropArea.classList.remove('dragover');
        });
    });

    dropArea.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        handleFiles(files);
    });

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    // 4. LÓGICA DE ANÁLISE (O CÉREBRO)
    function handleFiles(files) {
        if (files.length === 0) return;
        
        const file = files[0];
        const scanBar = document.getElementById('scan-bar');
        
        // Simula Escaneamento
        scanBar.style.width = "0%";
        setTimeout(() => scanBar.style.width = "50%", 200);
        setTimeout(() => scanBar.style.width = "100%", 600);

        setTimeout(() => {
            // Mostra Resultado
            document.getElementById('fname').innerText = "📄 " + file.name;
            const sizeMB = (file.size / (1024*1024)).toFixed(2);
            document.getElementById('fmeta').innerText = `TAMANHO: ${sizeMB} MB | TIPO: ${file.type || 'Desconhecido'}`;
            fileResult.style.display = 'block';
            
            // Configura Botão de Envio
            document.getElementById('btn-send-doc').onclick = function() {
                const texto = `📂 *ENVIO DE DOCUMENTO* 📂%0A%0A` +
                              `Dr. Lucas, tenho o seguinte arquivo pronto para análise:%0A` +
                              `*Arquivo:* ${file.name}%0A` +
                              `*Tamanho:* ${sizeMB} MB%0A%0A` +
                              `*AÇÃO:* Vou anexar este arquivo nesta conversa agora.`;
                
                window.open(`https://wa.me/5531989420094?text=${texto}`, '_blank');
            };
            
            if(window.notificar) window.notificar("Arquivo analisado e pronto para envio.", "sucesso");

        }, 800);
    }
});