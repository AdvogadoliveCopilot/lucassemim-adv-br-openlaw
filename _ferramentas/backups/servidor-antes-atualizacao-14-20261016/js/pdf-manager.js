// DOCUMENTO OFICIAL MANAGER (V2.0 - LEITOR INTEGRADO & SEO BOOSTER)
// Cria card interativo com Leitor de PDF e Schema.org

function createPDFCard(fileName, titleOverride = "DOCUMENTO OFICIAL NA ÍNTEGRA") {
    
    // 1. Identifica onde injetar
    const container = document.getElementById('pdf-area-container');
    if (!container) return;

    // 2. Ajuste de Caminho (Pasta 'dados')
    const isNewsFolder = window.location.pathname.indexOf("/news/") !== -1;
    const folderPath = isNewsFolder ? "../dados/" : "dados/";
    const fullPath = folderPath + fileName;
    const absolutePath = window.location.origin + (isNewsFolder ? "/dados/" : "/dados/") + fileName;

    // 3. ESTRATÉGIA SEO: Injeção de Schema.org (Para o Google entender o documento)
    const scriptSEO = document.createElement('script');
    scriptSEO.type = "application/ld+json";
    scriptSEO.text = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "DigitalDocument",
        "name": titleOverride,
        "url": absolutePath,
        "format": "application/pdf",
        "publisher": {
            "@type": "Organization",
            "name": "Semim & Associados Advocacia"
        }
    });
    document.head.appendChild(scriptSEO);

    // 4. Injeção de Estilos (CSS)
    const style = document.createElement('style');
    style.innerHTML = `
        .pdf-card-box {
            background: linear-gradient(135deg, #121212 0%, #080808 100%);
            border: 1px solid #333;
            border-left: 5px solid #d4af37; /* Ouro */
            border-radius: 8px;
            padding: 25px;
            margin: 40px 0;
            position: relative;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        .pdf-header {
            display: flex;
            align-items: center;
            gap: 20px;
            margin-bottom: 20px;
            position: relative;
            z-index: 2;
        }
        /* Marca d'água de fundo */
        .pdf-bg-watermark {
            position: absolute;
            right: -20px;
            top: -20px;
            font-size: 8rem;
            color: rgba(212, 175, 55, 0.03);
            pointer-events: none;
            z-index: 1;
        }
        .pdf-icon-main { font-size: 2.5rem; color: #d4af37; }
        
        .pdf-title {
            font-family: 'Teko', sans-serif;
            font-size: 1.6rem;
            color: #fff;
            margin: 0;
            line-height: 1;
            text-transform: uppercase;
        }
        .pdf-subtitle {
            font-family: 'Lato', sans-serif;
            font-size: 0.9rem;
            color: #888;
            margin-top: 5px;
        }

        /* Botões de Ação */
        .pdf-actions {
            display: flex;
            gap: 15px;
            z-index: 2;
            position: relative;
            flex-wrap: wrap;
        }
        .btn-pdf-view {
            background: #d4af37;
            color: #000;
            border: none;
            padding: 10px 25px;
            font-family: 'Teko', sans-serif;
            font-size: 1.2rem;
            border-radius: 4px;
            cursor: pointer;
            transition: 0.3s;
            display: flex;
            align-items: center;
            font-weight: bold;
        }
        .btn-pdf-view:hover { background: #fff; box-shadow: 0 0 15px rgba(212, 175, 55, 0.5); }
        
        .btn-pdf-down {
            background: transparent;
            border: 1px solid #555;
            color: #aaa;
            padding: 10px 25px;
            font-family: 'Teko', sans-serif;
            font-size: 1.2rem;
            border-radius: 4px;
            text-decoration: none;
            transition: 0.3s;
            display: flex;
            align-items: center;
        }
        .btn-pdf-down:hover { border-color: #fff; color: #fff; }

        /* Área do Leitor (Escondida inicialmente) */
        #pdf-viewer-frame {
            width: 100%;
            height: 0;
            margin-top: 0;
            border: none;
            border-radius: 4px;
            background: #222;
            transition: height 0.5s ease;
            opacity: 0;
        }
        .viewer-active {
            height: 600px !important;
            margin-top: 20px !important;
            opacity: 1 !important;
            border: 1px solid #444 !important;
        }

        @media(max-width: 768px) {
            .pdf-header { flex-direction: column; text-align: center; }
            .pdf-actions { justify-content: center; }
            .btn-pdf-view, .btn-pdf-down { width: 100%; justify-content: center; }
        }
    `;
    document.head.appendChild(style);

    // 5. Cria o HTML Estrutural
    const cardHTML = `
        <div class="pdf-card-box fade-in-up">
            <i class="fas fa-balance-scale pdf-bg-watermark"></i>
            
            <div class="pdf-header">
                <div class="pdf-icon-main">
                    <i class="fas fa-file-contract"></i>
                </div>
                <div class="pdf-content">
                    <h3 class="pdf-title">${titleOverride}</h3>
                    <p class="pdf-subtitle">
                        <i class="fas fa-check-circle text-success me-1"></i> Documento Oficial indexado em nosso servidor.
                        <br>Este arquivo contém a base jurídica desta matéria.
                    </p>
                </div>
            </div>

            <div class="pdf-actions">
                <button onclick="togglePDFViewer('${fullPath}')" class="btn-pdf-view">
                    <i class="fas fa-eye me-2"></i> LER DOCUMENTO AGORA
                </button>
                <a href="${fullPath}" target="_blank" class="btn-pdf-down" download>
                    <i class="fas fa-download me-2"></i> BAIXAR PDF
                </a>
            </div>

            <div id="pdf-viewer-wrapper"></div>
        </div>
    `;

    container.innerHTML = cardHTML;
}

// FUNÇÃO GLOBAL PARA ABRIR O LEITOR
window.togglePDFViewer = function(path) {
    const wrapper = document.getElementById('pdf-viewer-wrapper');
    const existingFrame = document.getElementById('pdf-viewer-frame');

    if (existingFrame) {
        // Se já existe, fecha (Toggle)
        if (existingFrame.classList.contains('viewer-active')) {
            existingFrame.classList.remove('viewer-active');
            setTimeout(() => existingFrame.remove(), 500); // Remove do DOM após animação
        }
    } else {
        // Cria o iframe/object do PDF
        const objectTag = document.createElement('object');
        objectTag.id = "pdf-viewer-frame";
        objectTag.data = path;
        objectTag.type = "application/pdf";
        objectTag.innerHTML = `<p class="text-center text-white py-5">Seu navegador não suporta visualização direta. <a href="${path}" class="text-gold">Clique aqui para baixar.</a></p>`;
        
        wrapper.appendChild(objectTag);

        // Pequeno delay para permitir a transição CSS
        setTimeout(() => {
            objectTag.classList.add('viewer-active');
        }, 50);
    }
};