/* =========================================================== */
/* === ARQUIVO: codeleicivel/civel-pdf.js (Quantum Docs) === */
/* === FUNÇÃO: Gerador de Dossiê PDF em Tempo Real === */
/* =========================================================== */

// Carrega a biblioteca jsPDF automaticamente se não estiver presente
(function() {
    if (!window.jspdf) {
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
        script.onload = () => console.log("📄 [Quantum PDF] Motor Gráfico Carregado.");
        document.head.appendChild(script);
    }
})();

window.gerarDossiePDF = function(dados) {
    if (!window.jspdf) {
        alert("O sistema de documentos está inicializando... Tente em 3 segundos.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // CORES
    const corOuro = "#d4af37";
    const corPreta = "#000000";
    const corCinza = "#666666";

    // --- CABEÇALHO (Timbre) ---
    doc.setFillColor(10, 10, 10); // Fundo do Header (Quase preto)
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setFont("times", "bold");
    doc.setTextColor(212, 175, 55); // Dourado
    doc.setFontSize(22);
    doc.text("LUCAS SEMIM", 105, 20, null, null, "center");
    
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text("ADVOCACIA PATRIMONIAL & CÍVEL DE ELITE", 105, 28, null, null, "center");

    // --- DADOS DO PROTOCOLO ---
    const protocolo = "LS-" + Math.floor(Math.random() * 1000000);
    const dataHoje = new Date().toLocaleDateString('pt-BR');

    doc.setTextColor(corPreta);
    doc.setFontSize(10);
    doc.text(`PROTOCOLO: ${protocolo}`, 15, 50);
    doc.text(`DATA: ${dataHoje}`, 180, 50, null, null, "right");

    // --- TÍTULO DO DOCUMENTO ---
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("MEMORANDO DE PRÉ-ANÁLISE", 105, 65, null, null, "center");
    
    doc.setDrawColor(212, 175, 55); // Linha Dourada
    doc.line(70, 68, 140, 68);

    // --- DADOS DO CLIENTE (O CORPO) ---
    let y = 85;
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("1. DADOS DO REQUERENTE", 15, y);
    y += 8;
    
    doc.setFont("helvetica", "normal");
    doc.text(`Nome: ${dados.nome}`, 15, y); y += 6;
    doc.text(`Contato: ${dados.telefone}`, 15, y); y += 6;
    
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text("2. NATUREZA DA DEMANDA", 15, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.text(`Área Jurídica: ${dados.area}`, 15, y); y += 6;
    doc.text(`Estimativa Econômica: ${dados.valor}`, 15, y); y += 6;
    
    if (dados.detalhe) {
        doc.text(`Especificação: ${dados.detalhe}`, 15, y); y += 6;
    }

    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text("3. RELATO PRELIMINAR", 15, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    
    // Quebra de linha automática para o relato
    const relatoLinhas = doc.splitTextToSize(dados.relato || "Não informado.", 180);
    doc.text(relatoLinhas, 15, y);
    y += (relatoLinhas.length * 5) + 10;

    // --- PARECER AUTOMÁTICO (GATILHO DE AUTORIDADE) ---
    doc.setFillColor(245, 245, 245); // Fundo cinza claro
    doc.rect(10, y, 190, 40, 'F');
    
    y += 10;
    doc.setFont("times", "italic");
    doc.setTextColor(corCinza);
    doc.text("Este documento certifica que sua solicitação entrou em nossa esteira de prioridade.", 15, y);
    y += 6;
    doc.text("A equipe técnica do Dr. Lucas Semim iniciou a análise de viabilidade e conflito de interesses.", 15, y);
    y += 6;
    doc.text("Aguarde o contato oficial pelo WhatsApp para agendamento da reunião estratégica.", 15, y);

    // --- RODAPÉ ---
    doc.setFont("helvetica", "normal");
    doc.setTextColor(corPreta);
    doc.setFontSize(8);
    
    const pageHeight = doc.internal.pageSize.height;
    doc.text("Lucas Semim Advocacia | OAB/MG 222.539", 105, pageHeight - 15, null, null, "center");
    doc.text("Rua dos Timbiras, 3488 - Belo Horizonte/MG", 105, pageHeight - 10, null, null, "center");

    // --- SALVAR O ARQUIVO ---
    doc.save(`Pre-Analise_${dados.nome.replace(/ /g, "_")}.pdf`);
    
    console.log("📄 [Quantum PDF] Documento gerado e baixado.");
};