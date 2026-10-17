/**
 * 00 - ROTEADOR DO PROJETO NOVO (Portal do Cliente + Central de Comandos do Dr. Lucas Semim)
 * ---------------------------------------------------------------------------------------
 * USE ESTE ARQUIVO SOMENTE NO PROJETO NOVO (script avulso criado em script.google.com).
 * NÃO cole no projeto antigo "Advogado Live": lá já existem doGet/doPost, e duas funções com o mesmo nome
 * fariam uma sobrescrever a outra em silêncio (os formulários do site parariam de funcionar).
 *
 * O que ele faz:
 *   doPost  -> só atende as ações do portal ("portal_login", "portal_painel", ...). Qualquer outra coisa recebe uma resposta genérica.
 *   doGet   -> se quem abre é o advogado (conta Google em PC3_ADMIN_EMAILS), mostra a Central de Comandos.
 *              Outra conta Google logada vê "Acesso restrito". Quem não está logado só vê um JSON de "no ar", sem dado nenhum.
 *
 * Implantações (veja INSTALAR_PROJETO_NOVO.md):
 *   - "Portal API"        : Executar como EU, acesso: QUALQUER PESSOA  -> URL que o site do cliente usa (apiUrlPortal).
 *   - "Central de Comandos": Executar como USUÁRIO QUE ACESSA, acesso: SOMENTE EU -> o seu painel.
 */
function doPost(e) {
  let d = null;
  try { d = JSON.parse((e && e.postData && e.postData.contents) || ''); } catch (_) { d = null; }
  if (d && typeof d.acao === 'string' && d.acao.indexOf('portal_') === 0) return portal3Rotear(d);
  return pc3Resp_({ sucesso: false, mensagem: 'Pedido não reconhecido.' });
}

function doGet(e) {
  const central = central3Servir(e);                   // devolve a página só para o advogado; null para os demais
  if (central) return central;
  if (pc3EmailAtivo_()) {                              // logado com outra conta Google (acontece na implantação "usuário que acessa")
    return HtmlService.createHtmlOutput('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">' +
      '<body style="font-family:sans-serif;background:#050505;color:#eee;display:grid;place-items:center;min-height:100vh;margin:0"><p style="max-width:28em;padding:16px">' +
      'Acesso restrito. Entre com a conta Google do advogado.</p></body>').setTitle('Acesso restrito');
  }
  return pc3Resp_({ ok: true, servico: 'portal-cliente' });
}
