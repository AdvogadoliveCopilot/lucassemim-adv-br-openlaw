/**
 * 31_Planilha_Auditoria_V2.gs
 * Script Mestre de Enxugamento e Auditoria
 * Escritório Dr. Lucas Renan Semim
 */

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('⚖️ Lucas Semim - IA')
      .addItem('🧹 Organizar e Enxugar Planilha (Automático)', 'enxugarPlanilha')
      .addItem('🔒 Proteger Aba de Configurações', 'protegerConfiguracoes')
      .addItem('💾 Fazer Backup de Segurança Agora', 'fazerBackupManual')
      .addToUi();
}

/**
 * Reduz as várias abas poluídas em apenas 3 principais e oculta as velhas
 */
function enxugarPlanilha() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();
  
  var response = ui.alert('Atenção', 'Isso vai criar 3 abas consolidadas (DASHBOARD_LEADS, CLIENTES_PROCESSOS, CONFIG_AUDITORIA) e ocultar as antigas para limpar sua tela. O histórico não será apagado. Deseja continuar?', ui.ButtonSet.YES_NO);
  
  if (response == ui.Button.YES) {
    // 1. Criar ou Obter a Aba DASHBOARD_LEADS
    var sheetDashboard = ss.getSheetByName('DASHBOARD_LEADS');
    if (!sheetDashboard) {
      sheetDashboard = ss.insertSheet('DASHBOARD_LEADS', 0);
      sheetDashboard.appendRow(['DATA_HORA', 'TIPO_CASO', 'NOME_CLIENTE', 'WHATSAPP', 'DESCRICAO', 'STATUS_URGENCIA', 'RESPONSAVEL']);
      sheetDashboard.getRange("A1:G1").setFontWeight("bold").setBackground("#d4af37").setFontColor("#000000");
    }
    
    // 2. Criar ou Obter a Aba CLIENTES_PROCESSOS
    var sheetClientes = ss.getSheetByName('CLIENTES_PROCESSOS');
    if (!sheetClientes) {
      sheetClientes = ss.insertSheet('CLIENTES_PROCESSOS', 1);
      sheetClientes.appendRow(['NOME', 'CPF', 'TOKEN_SITE', 'NUMERO_PROCESSO', 'COMARCA', 'STATUS_ATUAL', 'ULTIMA_MOVIMENTACAO', 'VALOR_HONORARIOS', 'DATA_PAGAMENTO']);
      sheetClientes.getRange("A1:I1").setFontWeight("bold").setBackground("#1a3a6e").setFontColor("#ffffff");
    }

    // 3. Criar ou Obter a Aba CONFIG_AUDITORIA
    var sheetConfig = ss.getSheetByName('CONFIG_AUDITORIA');
    if (!sheetConfig) {
      sheetConfig = ss.insertSheet('CONFIG_AUDITORIA', 2);
      sheetConfig.appendRow(['CHAVE_NOME', 'VALOR_VARIAVEL', 'DATA_ATUALIZACAO', 'ULTIMO_EDITOR']);
      sheetConfig.getRange("A1:D1").setFontWeight("bold").setBackground("#8b0000").setFontColor("#ffffff");
      
      // Inserir variáveis padrões
      sheetConfig.appendRow(['EMAIL_NOTIFICACAO', 'contato@lucassemim.adv.br', new Date(), Session.getActiveUser().getEmail()]);
      sheetConfig.appendRow(['LINK_SISTEMA_V2', 'https://lucassemim.adv.br/portal/painel-cliente.html', new Date(), Session.getActiveUser().getEmail()]);
    }

    // 4. Ocultar todas as outras abas (Quarentena, Logs, Central antiga, etc)
    var allSheets = ss.getSheets();
    var abasPrincipais = ['DASHBOARD_LEADS', 'CLIENTES_PROCESSOS', 'CONFIG_AUDITORIA'];
    
    for (var i = 0; i < allSheets.length; i++) {
      var nome = allSheets[i].getName();
      if (abasPrincipais.indexOf(nome) === -1) {
        allSheets[i].hideSheet(); // Oculta a aba em vez de apagar
      }
    }
    
    ui.alert('Sucesso', 'Sua planilha foi enxugada! As abas velhas foram ocultadas, mantendo o histórico seguro. O visual está limpo agora.', ui.ButtonSet.OK);
  }
}

/**
 * Protege a aba de Configurações para que apenas o proprietário (Dr. Lucas) edite
 */
function protegerConfiguracoes() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetConfig = ss.getSheetByName('CONFIG_AUDITORIA');
  var ui = SpreadsheetApp.getUi();
  
  if (sheetConfig) {
    var protection = sheetConfig.protect().setDescription('Proteção Nível Master - Configurações do Sistema');
    var me = Session.getEffectiveUser();
    
    // Remove todos, exceto o dono do script
    protection.addEditor(me);
    protection.removeEditors(protection.getEditors());
    if (protection.canDomainEdit()) {
      protection.setDomainEdit(false);
    }
    ui.alert('Segurança ativada', 'A aba CONFIG_AUDITORIA agora só pode ser alterada por você.', ui.ButtonSet.OK);
  } else {
    ui.alert('Erro', 'Rode o enxugamento da planilha primeiro para criar a aba.', ui.ButtonSet.OK);
  }
}

/**
 * Cria uma cópia inteira da planilha na pasta raiz do Google Drive com a data do dia
 */
function fazerBackupManual() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();
  var dataAtual = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd_HH-mm");
  var nomeBackup = "BACKUP_SISTEMA_ADVOGADO_" + dataAtual;
  
  var copiaId = DriveApp.getFileById(ss.getId()).makeCopy(nomeBackup).getId();
  
  ui.alert('Backup Salvo', 'Uma cópia exata do seu sistema foi salva no seu Google Drive com o nome: ' + nomeBackup, ui.ButtonSet.OK);
}

/**
 * Triggers - Roda o backup automaticamente todo dia as 3 da manhã
 */
function configurarBackupDiario() {
  // Limpa triggers antigos de backup para não duplicar
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'fazerBackupManual') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  
  ScriptApp.newTrigger('fazerBackupManual')
    .timeBased()
    .everyDays(1)
    .atHour(3)
    .create();
}
