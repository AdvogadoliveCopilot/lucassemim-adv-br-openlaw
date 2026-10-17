/**
 * 13 - API RECEPCIONISTA (WEBHOOK DO SITE HTML) V3.0
 * Recebe os dados nativos do site lucassemim.adv.br e cria as pastas.
 * V2.0: Captura de E-mail (Sincronia com Carteiro Digital) e Triagem de Anexos.
 * V3.0 (29/09/2026 — Central de Documentos / Bets): antes, TODA chamada
 * criava uma pasta nova pro cliente, mesmo que ele já tivesse uma — um
 * cliente voltando pra mandar mais um documento (fluxo da nova página
 * central-documentos-apostas.html) gerava uma segunda pasta duplicada em
 * vez de completar a mesma. Agora a função procura primeiro se já existe
 * pasta daquele CPF (fica gravado no nome da pasta) e reaproveita as
 * mesmas 3 gavetas se encontrar. Também passou a registrar o "tipo de
 * ação" escolhido pelo cliente — essencial pra triagem em massa dos casos
 * de apostas/bets — num arquivo de notas dentro da própria pasta (NÃO no
 * Dossiê Vivo: como já documentado abaixo, esse continua sendo criado só
 * por 06_Analise_Despachos.gs, na primeira análise real do caso).
 */

function processarIntakeClienteSite(e) {
  try {
    const dados = JSON.parse(e.postData.contents);

    // 1. CAPTURA DE DADOS (Agora com E-mail para alimentar a máquina)
    const nomeCliente = dados.nome ? dados.nome.toUpperCase() : "CLIENTE SEM NOME";
    const emailCliente = dados.email || "Não informado"; // 🔥 NOVO: Captura do E-mail
    const whatsapp = dados.whatsapp || "Não informado";
    const cpf = dados.cpf || "Não informado";
    const numProcesso = dados.numProcesso || "";
    const relato = dados.relato || "Sem relato detalhado.";
    const situacao = dados.situacao || "Não especificada";
    const tipoAcao = dados.tipoAcao || ""; // 🔥 NOVO V3.0 (Central de Documentos)
    const arquivosBase64 = dados.arquivos || [];

    // O ID_RAIZ_ESCRITORIO deve estar definido como variável global no topo do seu projeto
    const pastaRaiz = DriveApp.getFolderById(ID_RAIZ_ESCRITORIO);
    let pasta01 = pastaRaiz.getFoldersByName("01_CLIENTES");
    let pastaClientes = pasta01.hasNext() ? pasta01.next() : pastaRaiz;

    // 2. LOCALIZA OU CRIA A PASTA DO CLIENTE (idempotente por CPF) — 🔥 NOVO V3.0
    const cpfLimpo = String(cpf).replace(/[^\d]/g, "");
    let novaPastaCliente = null;
    let clienteNovo = true;

    if (cpfLimpo.length >= 11) {
      const todasPastas = pastaClientes.getFolders();
      while (todasPastas.hasNext()) {
        const pastaExistente = todasPastas.next();
        const nomePastaLimpo = pastaExistente.getName().replace(/[^\d]/g, "");
        if (nomePastaLimpo.indexOf(cpfLimpo) !== -1) {
          novaPastaCliente = pastaExistente;
          clienteNovo = false;
          break;
        }
      }
    }

    if (!novaPastaCliente) {
      let nomePasta = nomeCliente;
      if (cpfLimpo.length >= 11) {
        nomePasta += " - CPF " + cpf;
      }
      if (numProcesso && numProcesso.length > 5) {
          nomePasta += " - Proc: " + numProcesso;
      }
      novaPastaCliente = pastaClientes.createFolder(nomePasta);
    }

    // 3. GAVETAS PADRÃO DO ESCRITÓRIO (reaproveita se a pasta já existir) — 🔥 AJUSTADO V3.0
    const gavetaDocs = obterOuCriarGaveta(novaPastaCliente, "01_Docs_Pessoais");
    const gavetaProvas = obterOuCriarGaveta(novaPastaCliente, "02_Provas");
    const gavetaAndamentos = obterOuCriarGaveta(novaPastaCliente, "03_Andamentos_Despachos");

    // 4. DESEMPACOTAMENTO E TRIAGEM INTELIGENTE DE ARQUIVOS BASE64
    if (arquivosBase64.length > 0) {
        arquivosBase64.forEach(arq => {
            let blob = Utilities.newBlob(Utilities.base64Decode(arq.data), arq.mimeType, arq.nome);

            // Triagem: Identifica se é documento pessoal ou prova geral pelo nome
            let nomeArqLimpo = String(arq.nome).toLowerCase();
            if (nomeArqLimpo.match(/(rg|cpf|cnh|identidade|documento|comprovante|endereco)/)) {
               gavetaDocs.createFile(blob);
            } else {
               gavetaProvas.createFile(blob);
            }
        });
    }

    // 4.1 NOTA DE INTAKE (tipo de ação + relato) — 🔥 NOVO V3.0. Fica num
    // arquivo de texto simples dentro de 03_Andamentos_Despachos, separado
    // do Dossiê Vivo (ver nota do item 5), só pra dar contexto rápido pro
    // Dr. Lucas na triagem.
    if (tipoAcao || (dados.relato && dados.relato.length > 0)) {
      anexarNotaIntakeSite(gavetaAndamentos, tipoAcao, relato, situacao, emailCliente, whatsapp, clienteNovo);
    }

    // 5. RESPOSTA PARA O SITE
    // (Dossiê Vivo não é mais criado aqui no intake do site — 06_Analise_Despachos.gs
    //  já cria o Dossiê Vivo automaticamente na primeira análise de despacho, evitando
    //  gerar um documento administrativo antes mesmo do caso ser aceito.)
    return ContentService.createTextOutput(JSON.stringify({
      "status": "sucesso",
      "clienteNovo": clienteNovo, // 🔥 NOVO V3.0 — front-end usa isso pra mostrar a mensagem certa
      "mensagem": clienteNovo ? "Pasta criada com sucesso!" : "Documentos adicionados ao seu processo com sucesso!"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (erro) {
     return ContentService.createTextOutput(JSON.stringify({
       "status": "erro",
       "mensagem": erro.message
     })).setMimeType(ContentService.MimeType.JSON);
  }
}

/** 🔥 NOVO V3.0 — Pega a subpasta pelo nome se já existir, senão cria. */
function obterOuCriarGaveta(pastaMae, nomeGaveta) {
  const existentes = pastaMae.getFoldersByName(nomeGaveta);
  if (existentes.hasNext()) return existentes.next();
  return pastaMae.createFolder(nomeGaveta);
}

/**
 * 🔥 NOVO V3.0 — Registra o tipo de ação e o relato do cliente num arquivo
 * de texto simples ("Notas_Intake_Site.txt") dentro da gaveta de
 * andamentos. Se o cliente voltar e mandar mais informações, o texto
 * novo é ACRESCENTADO ao final do arquivo (nada do que já foi escrito é
 * apagado).
 */
function anexarNotaIntakeSite(gavetaAndamentos, tipoAcao, relato, situacao, email, whatsapp, clienteNovo) {
  const nomeArquivo = "Notas_Intake_Site.txt";
  const agora = Utilities.formatDate(new Date(), "GMT-3", "dd/MM/yyyy HH:mm");

  let bloco = "\n\n— " + (clienteNovo ? "PRIMEIRO ENVIO" : "NOVO ENVIO") + " EM " + agora + " —\n";
  if (tipoAcao) bloco += "Tipo de Ação: " + tipoAcao + "\n";
  bloco += "Situação/Origem: " + situacao + "\n";
  bloco += "E-mail: " + email + " | WhatsApp: " + whatsapp + "\n";
  bloco += "Relato: " + relato;

  const existentes = gavetaAndamentos.getFilesByName(nomeArquivo);
  if (existentes.hasNext()) {
    const arquivo = existentes.next();
    const conteudoAtual = arquivo.getBlob().getDataAsString("UTF-8");
    arquivo.setContent(conteudoAtual + bloco);
  } else {
    gavetaAndamentos.createFile(nomeArquivo, "NOTAS DE INTAKE — SITE (Central de Documentos)" + bloco, MimeType.PLAIN_TEXT);
  }
}
