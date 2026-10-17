/**
 * 30_Portal_Cliente_V2.gs
 * Backend do Portal do Cliente - Dr. Lucas Semim
 * Faz a ponte entre a aba 'CLIENTES_PROCESSOS' da Planilha e o painel-v2.html
 */

var ID_PLANILHA_MESTRE = "COLE_AQUI_O_ID_DA_PLANILHA"; 

// 1. Recebe requisições via API (Fetch do HTML)
function doGet(e) {
  var acao = e.parameter.acao;
  
  if (acao === "login") {
    return ContentService.createTextOutput(JSON.stringify(validarLogin(e.parameter.cpf, e.parameter.token)))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // Retorna erro se não for uma ação válida
  return ContentService.createTextOutput(JSON.stringify({ erro: "Ação não reconhecida" }))
      .setMimeType(ContentService.MimeType.JSON);
}

// 2. Valida o CPF e Token na aba CLIENTES_PROCESSOS
function validarLogin(cpf, token) {
  if (!cpf || !token) return { erro: "Dados incompletos" };
  
  var ss = SpreadsheetApp.openById(ID_PLANILHA_MESTRE);
  var abaClientes = ss.getSheetByName('CLIENTES_PROCESSOS');
  
  if (!abaClientes) return { erro: "Sistema em manutenção (Aba não encontrada)" };
  
  var dados = abaClientes.getDataRange().getValues();
  
  // Remover pontuação do CPF digitado
  var cpfLimpo = cpf.replace(/\D/g, '');
  
  for (var i = 1; i < dados.length; i++) {
    var cpfPlanilha = String(dados[i][1]).replace(/\D/g, '');
    var tokenPlanilha = String(dados[i][2]);
    
    if (cpfPlanilha === cpfLimpo && tokenPlanilha === token) {
      return {
        sucesso: true,
        nome: dados[i][0],
        processo: dados[i][3],
        comarca: dados[i][4],
        status: dados[i][5],
        // No futuro: criar lógica para ler de uma aba "MOVIMENTACOES_DETALHE"
        movimentacoes: [
          { data: "HOJE", titulo: "Status Atualizado", desc: dados[i][6] || "Aguardando nova movimentação", recent: true }
        ]
      };
    }
  }
  
  return { erro: "CPF ou Token incorretos" };
}

// 3. Função para você rodar manualmente para gerar tokens aleatórios para clientes novos
function gerarTokenSeguro(tamanho) {
  var caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Evitar O, 0, 1, I
  var token = '';
  for (var i = 0; i < (tamanho || 5); i++) {
    token += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return token;
}
