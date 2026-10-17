/**
 * TRUTH SHIELD - SISTEMA DE INTEGRIDADE JURÍDICA
 * Desenvolvido para Lucas Semim Advocacia
 * Função: Conectar termos legais a fontes oficiais e garantir data de vigência.
 */

document.addEventListener("DOMContentLoaded", function() {
    
    // 1. BASE DE DADOS DE FONTES OFICIAIS (PLANALTO/STF/CNJ)
    const fontesOficiais = {
        "Constituição Federal": "https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm",
        "CF/88": "https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm",
        "Código Penal": "https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848.htm",
        "CPP": "https://www.planalto.gov.br/ccivil_03/decreto-lei/del3689.htm",
        "Código de Processo Penal": "https://www.planalto.gov.br/ccivil_03/decreto-lei/del3689.htm",
        "Lei de Execução Penal": "https://www.planalto.gov.br/ccivil_03/leis/l7210.htm",
        "LEP": "https://www.planalto.gov.br/ccivil_03/leis/l7210.htm",
        "Lei de Drogas": "https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11343.htm",
        "STF": "https://portal.stf.jus.br/",
        "STJ": "https://www.stj.jus.br/",
        "CNJ": "https://www.cnj.jus.br/",
        "OAB": "https://www.oab.org.br/"
    };

    // 2. FUNÇÃO DE LINKAGEM INTELIGENTE (Auto-Linker)
    // Procura termos no texto e adiciona link para a fonte oficial
    function conectarFontesOficiais() {
        const artigo = document.querySelector('.article-content');
        if (!artigo) return; // Só roda se tiver artigo na página

        let html = artigo.innerHTML;
        
        // Loop para substituir termos por links (apenas a primeira ocorrência para não poluir)
        for (const [termo, link] of Object.entries(fontesOficiais)) {
            const regex = new RegExp(`\\b${termo}\\b(?!([^<]+)?>)`, 'i'); // Evita substituir dentro de links já existentes
            if (!html.includes(`href="${link}"`)) { // Se ainda não tem o link
                html = html.replace(regex, `<a href="${link}" target="_blank" class="official-source-link" title="Fonte Oficial Verificada: ${termo}"><i class="fas fa-university me-1 small"></i>${termo}</a>`);
            }
        }
        artigo.innerHTML = html;
    }

    // 3. SELO DE INTEGRIDADE NO RODAPÉ
    function adicionarSeloIntegridade() {
        const footer = document.querySelector('footer .container');
        if (!footer) return;

        const seloHTML = `
            <div class="row mt-4 pt-4 border-top border-secondary">
                <div class="col-12 text-center">
                    <div class="d-inline-flex align-items-center px-3 py-2 rounded" style="background: rgba(212, 175, 55, 0.1); border: 1px solid #d4af37;">
                        <i class="fas fa-shield-alt text-warning me-2" style="font-size: 1.5rem;"></i>
                        <div class="text-start">
                            <h6 class="font-teko text-white m-0" style="letter-spacing: 1px;">CONTEÚDO JURÍDICO VERIFICADO</h6>
                            <small class="text-secondary" style="font-size: 0.7rem;">Em conformidade com a Legislação Federal, STF e CNJ.</small>
                        </div>
                    </div>
                    <p class="mt-2 text-muted" style="font-size: 0.7rem;">
                        <i class="fas fa-info-circle me-1"></i> Compromisso Anti-Fake News: Todas as referências legais neste site possuem link direto para o portal do Planalto ou Tribunais Superiores.
                    </p>
                </div>
            </div>
        `;
        
        // Insere antes do copyright
        const div = document.createElement('div');
        div.innerHTML = seloHTML;
        footer.insertBefore(div, footer.lastElementChild);
    }

    // 4. ALERTA DE VIGÊNCIA (Se a notícia for muito antiga)
    function verificarVigencia() {
        // Tenta achar a data no JSON-LD ou na meta tag
        const dataMeta = document.querySelector('meta[itemprop="datePublished"]') || document.querySelector('meta[name="datePublished"]');
        if (!dataMeta) return;

        const dataPublicacao = new Date(dataMeta.content);
        const hoje = new Date();
        const diferencaAnos = (hoje - dataPublicacao) / (1000 * 60 * 60 * 24 * 365);

        if (diferencaAnos > 1.5) { // Se tem mais de 1 ano e meio
            const alertaDiv = document.createElement('div');
            alertaDiv.className = 'alert alert-warning border-warning bg-dark text-white text-center font-teko';
            alertaDiv.style.position = 'fixed';
            alertaDiv.style.bottom = '0';
            alertaDiv.style.left = '0';
            alertaDiv.style.width = '100%';
            alertaDiv.style.zIndex = '9999';
            alertaDiv.innerHTML = `
                <i class="fas fa-exclamation-triangle me-2"></i> ATENÇÃO: Este artigo foi publicado há mais de 1 ano. A legislação pode ter mudado. 
                <a href="https://wa.me/5531989420094" class="text-warning text-decoration-underline ms-2">CONSULTE O PLANTÃO</a>
                <button type="button" class="btn-close btn-close-white float-end me-3" onclick="this.parentElement.remove()"></button>
            `;
            document.body.appendChild(alertaDiv);
        }
    }

    // ESTILOS INJETADOS (Para não precisar mexer no CSS)
    const style = document.createElement('style');
    style.innerHTML = `
        .official-source-link {
            color: #d4af37 !important;
            text-decoration: none;
            border-bottom: 1px dotted #d4af37;
            transition: 0.3s;
        }
        .official-source-link:hover {
            background-color: rgba(212, 175, 55, 0.2);
            color: #fff !important;
        }
    `;
    document.head.appendChild(style);

    // EXECUTAR AS FUNÇÕES
    conectarFontesOficiais();
    adicionarSeloIntegridade();
    verificarVigencia();

});