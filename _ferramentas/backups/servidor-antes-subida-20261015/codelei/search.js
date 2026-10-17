/* =========================================================== */
/* === ARQUIVO: codelei/search.js (Quantum Search v4.0) === */
/* === FUNÇÃO: Busca Fuzzy, Debounce e Highlighting === */
/* =========================================================== */

document.addEventListener("DOMContentLoaded", function() {
    
    const searchInput = document.getElementById('busca-live-input');
    if (!searchInput) return;

    // --- 1. NORMALIZAÇÃO DE TEXTO ---
    function normalizeText(text) {
        return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    }

    // --- 2. FUNÇÃO DE REALCE (HIGHLIGHT) ---
    // Envolve o termo encontrado com uma tag <mark> para brilhar
    function highlightTerm(element, termo) {
        // Remove highlights anteriores
        removeHighlights(element);
        
        if (!termo || termo.length < 2) return;

        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
        const textNodes = [];
        while(walker.nextNode()) textNodes.push(walker.currentNode);

        textNodes.forEach(node => {
            const nodeValue = normalizeText(node.nodeValue);
            if (nodeValue.includes(termo)) {
                const parent = node.parentNode;
                const originalText = node.nodeValue;
                const regex = new RegExp(`(${termo})`, 'gi'); // Case insensitive
                
                // Cria um span temporário
                const tempDiv = document.createElement('span');
                tempDiv.innerHTML = originalText.replace(regex, '<mark class="search-highlight">$1</mark>');
                
                // Substitui o nó de texto pelos novos nós (com mark)
                while (tempDiv.firstChild) {
                    parent.insertBefore(tempDiv.firstChild, node);
                }
                parent.removeChild(node);
            }
        });
    }

    function removeHighlights(element) {
        const marks = element.querySelectorAll('mark.search-highlight');
        marks.forEach(mark => {
            const text = document.createTextNode(mark.innerText);
            mark.parentNode.replaceChild(text, mark);
        });
        element.normalize(); // Une nós de texto quebrados
    }

    // --- 3. FUNÇÃO PRINCIPAL DE FILTRAGEM ---
    function filtrarItens() {
        const termoOriginal = searchInput.value.trim();
        const termo = normalizeText(termoOriginal);
        
        let itens = document.querySelectorAll('.tese-item');
        let container = document.getElementById('arsenal-de-teses');
        
        if (itens.length === 0) {
            itens = document.querySelectorAll('.peticao-item');
            container = document.getElementById('arsenal-de-peticoes');
        }

        let visiveis = 0;

        itens.forEach(item => {
            const titulo = item.querySelector('.tese-titulo, .peticao-titulo, .card-title, h3')?.textContent || "";
            const descricao = item.querySelector('.tese-descricao, .peticao-descricao, p')?.textContent || "";
            const tags = item.getAttribute('data-tag') || "";
            
            const conteudoBusca = normalizeText(`${titulo} ${descricao} ${tags}`);

            if (conteudoBusca.includes(termo)) {
                item.style.display = "";
                item.classList.remove('reveal', 'active');
                void item.offsetWidth;
                item.classList.add('reveal', 'active');
                
                // Aplica o Highlight
                highlightTerm(item, termoOriginal);
                
                visiveis++;
            } else {
                item.style.display = "none";
                removeHighlights(item); // Limpa se esconder
            }
        });
        
        atualizarContador(container, visiveis, termoOriginal);
        gerenciarMensagemVazio(container, visiveis);
    }

    // --- 4. CONTADOR DE RESULTADOS ---
    function atualizarContador(container, qtd, termo) {
        let counter = document.getElementById('search-counter');
        if (!counter && container) {
            counter = document.createElement('div');
            counter.id = 'search-counter';
            counter.style.textAlign = 'center';
            counter.style.color = '#d4af37';
            counter.style.fontFamily = "'Fira Code', monospace";
            counter.style.fontSize = '0.9rem';
            counter.style.marginBottom = '20px';
            container.prepend(counter);
        }
        
        if (counter) {
            if (termo.length > 0) {
                counter.innerHTML = `// RESULTADOS PARA "${termo}": <strong>${qtd}</strong>`;
                counter.style.display = 'block';
            } else {
                counter.style.display = 'none';
            }
        }
    }

    function gerenciarMensagemVazio(container, qtdVisiveis) {
        let msg = document.getElementById('msg-busca-vazia');

        if (qtdVisiveis === 0) {
            if (!msg && container) {
                msg = document.createElement('div');
                msg.id = 'msg-busca-vazia';
                msg.style.textAlign = 'center';
                msg.style.padding = '40px';
                msg.style.color = '#888';
                msg.style.fontFamily = "'Fira Code', monospace";
                msg.innerHTML = `
                    <div style="font-size: 3rem; margin-bottom: 10px;">🔍</div>
                    <p>// NENHUM RESULTADO ENCONTRADO.</p>
                    <p style="font-size:0.9rem">Tente termos como "Tráfico", "Nulidade" ou "Recurso".</p>
                `;
                container.appendChild(msg);
            } else if (msg) {
                msg.style.display = 'block';
            }
        } else {
            if (msg) msg.style.display = 'none';
        }
    }

    // --- 5. INJEÇÃO DE CSS DO HIGHLIGHT ---
    const style = document.createElement('style');
    style.innerHTML = `
        mark.search-highlight {
            background-color: rgba(212, 175, 55, 0.3); /* Ouro transparente */
            color: #fff;
            padding: 0 2px;
            border-radius: 2px;
            border-bottom: 1px solid #d4af37;
        }
    `;
    document.head.appendChild(style);

    // --- 6. DEBOUNCE ---
    let timeoutId;
    searchInput.addEventListener('input', () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(filtrarItens, 300);
    });
    
    // Limpa ao clicar no 'x' do input search
    searchInput.addEventListener('search', filtrarItens);

});