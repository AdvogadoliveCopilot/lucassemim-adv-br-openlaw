/**
 * InventarioAbas.gs — ETAPA A (somente leitura)
 * Escritorio Dr. Lucas Renan Semim
 *
 * PARA QUE SERVE
 *   Levantar a ESTRUTURA da planilha (nomes de abas, gid, visibilidade,
 *   tamanho, protecao, gatilhos e nomes de propriedades do script) para
 *   planejar a futura Central de Comandos SEM apagar, ocultar, renomear,
 *   mover ou criar nada.
 *
 * O QUE ESTE ARQUIVO NUNCA FAZ
 *   - Nao grava, nao apaga, nao oculta, nao renomeia e nao cria abas.
 *   - Nao altera celulas, formulas, validacoes, filtros ou protecoes.
 *   - Nao imprime conteudo de celulas. So a LINHA 1 (cabecalho), e mesmo assim
 *     passando por um filtro que mascara e-mails, documentos e numeros longos.
 *   - Nao envia nada para a internet nem para nenhuma IA.
 *
 * COMO USAR (revisar antes com o responsavel)
 *  1. Abra o projeto Apps Script que ja tem acesso a planilha.
 *  2. Menu "+" > Script > nome "InventarioAbas" > cole este arquivo > salvar.
 *     (Os nomes das funcoes daqui sao exclusivos; confira antes se o projeto ja tem
 *      algo chamado inventariarEstrutura, descreverAba_ ou mascarar_.)
 *  3. Selecione a funcao "inventariarEstrutura" e clique em Executar.
 *  4. Autorize somente o que for pedido (leitura de planilha e Drive).
 *  5. Veja o resultado em Execucoes > Registros (Logger), ou copie o JSON
 *     retornado pela funcao "inventarioComoTexto".
 *  6. Apague este arquivo do projeto se nao for mais usar. Ele nao fica ativo sozinho.
 *
 * PRIVACIDADE
 *   O resultado ainda e documento interno. Antes de enviar a qualquer provedor
 *   de IA (mesmo o OmniRoute local), revise: nomes de abas podem revelar rotinas
 *   internas e estrategia do escritorio.
 */

// ============================== CONFIGURACAO ==============================

// Se true, grava tambem um Google Doc no Drive com o inventario (util quando o
// log do Apps Script fica dificil de copiar). O Doc sai do escopo desta planilha.
var INVENTARIO_GRAVAR_DOC = false;

// Nome do Doc, se for gravado.
var INVENTARIO_NOME_DOC = 'INVENTARIO_ESTRUTURA_PLANILHA';

// Quantas linhas de cabecalho ler (somente linha 1 por padrao: cabecalho).
var INVENTARIO_LINHAS_CABECALHO = 1;

// ============================== PONTO DE ENTRADA ==============================

/**
 * Executa o inventario e devolve o objeto. Tambem registra o JSON no log.
 * Nao modifica a planilha.
 */
function inventariarEstrutura() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    Logger.log('Abra este script a partir da planilha (ou vincule um ID) antes de executar.');
    return null;
  }

  var dados = {
    gerado_em: new Date().toISOString(),
    fuso: ss.getSpreadsheetTimeZone(),
    local: ss.getSpreadsheetLocale(),
    somente_leitura: true,
    aviso: 'Inventario de ESTRUTURA. Nao contem conteudo de clientes. Uso interno.',
    abas: [],
    gatilhos: [],
    propriedades_chaves: []
  };

  var abas = ss.getSheets();
  for (var i = 0; i < abas.length; i++) {
    dados.abas.push(descreverAba_(abas[i]));
  }

  dados.gatilhos = listarGatilhos_();
  dados.propriedades_chaves = listarPropriedadesChaves_();

  Logger.log(JSON.stringify(dados, null, 2));
  if (INVENTARIO_GRAVAR_DOC) gravarDoc_(dados);
  return dados;
}

/** Devolve o inventario como texto JSON (para copiar e colar). */
function inventarioComoTexto() {
  var d = inventariarEstrutura();
  return d ? JSON.stringify(d, null, 2) : '';
}

// ============================== FUNCOES INTERNAS ==============================

/** Descreve UMA aba sem tocar no conteudo alem da linha de cabecalho. */
function descreverAba_(sh) {
  var info = {
    nome: sh.getName(),
    gid: sh.getSheetId(),
    visivel: sh.isSheetHidden() ? false : true,
    linhas: sh.getMaxRows(),
    colunas: sh.getMaxColumns(),
    linhas_com_dados: Math.max(sh.getLastRow() - 1, 0),
    colunas_com_dados: sh.getLastColumn(),
    linhas_congeladas: sh.getFrozenRows(),
    colunas_congeladas: sh.getFrozenColumns(),
    protegida: null,
    cabecalho: []
  };

  try {
    var p = sh.getProtections(SpreadsheetApp.ProtectionType.SHEET);
    var pr = sh.getProtections(SpreadsheetApp.ProtectionType.RANGE);
    info.protegida = {
      aba: p.length > 0,
      intervalos: pr.length
    };
  } catch (e) {
    info.protegida = 'nao foi possivel ler';
  }

  if (info.colunas_com_dados > 0 && INVENTARIO_LINHAS_CABECALHO > 0) {
    try {
      var cab = sh.getRange(1, 1, 1, info.colunas_com_dados).getDisplayValues()[0];
      info.cabecalho = cab.map(function (v) { return mascarar_(v); });
    } catch (e) {
      info.cabecalho = ['leitura do cabecalho indisponivel'];
    }
  }
  return info;
}

/**
 * Filtro de privacidade do cabecalho.
 * Mascara e-mail, sequencias de 5+ digitos (CPF, CNPJ, telefone, protocolo),
 * e trunca o que for muito longo. Nomes continuam legiveis, mas cabecalho
 * normalmente nao contem nome de pessoa; se contiver, revise antes de compartilhar.
 */
function mascarar_(valor) {
  var s = valor == null ? '' : String(valor).trim();
  if (!s) return '';
  s = s.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[e-mail]');
  s = s.replace(/\d[\d.\-\/\s]{3,}\d/g, '[numero]');
  s = s.replace(/\b[A-Za-z0-9_-]{24,}\b/g, '[codigo]');
  if (s.length > 60) s = s.slice(0, 57) + '...';
  return s;
}

/** Lista gatilhos do projeto. Nome da funcao e tipo; nada de conteudo. */
function listarGatilhos_() {
  try {
    return ScriptApp.getProjectTriggers().map(function (t) {
      return {
        funcao: t.getHandlerFunction(),
        tipo: String(t.getEventType())
      };
    });
  } catch (e) {
    return ['leitura de gatilhos indisponivel'];
  }
}

/**
 * Lista apenas os NOMES das propriedades do script.
 * Os valores sao ignorados de proposito: podem conter chave de API ou ID de pasta.
 */
function listarPropriedadesChaves_() {
  try {
    return Object.keys(PropertiesService.getScriptProperties().getProperties()).sort();
  } catch (e) {
    return ['leitura de propriedades indisponivel'];
  }
}

/** Opcional: salva o inventario em Google Doc no Drive (fora da planilha). */
function gravarDoc_(dados) {
  try {
    var doc = DocumentApp.create(INVENTARIO_NOME_DOC + ' ' + Utilities.formatDate(new Date(), 'GMT-3', 'yyyy-MM-dd HH-mm'));
    doc.getBody().appendParagraph(JSON.stringify(dados, null, 2));
    doc.saveAndClose();
    Logger.log('Doc criado: ' + doc.getUrl());
  } catch (e) {
    Logger.log('Nao foi possivel criar o Doc: ' + e);
  }
}
