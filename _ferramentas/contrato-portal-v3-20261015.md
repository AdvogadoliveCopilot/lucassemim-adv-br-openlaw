# Contrato único da API do Portal do Cliente (V3) — 15/10/2026

**Este é o contrato valido.** Quem manda é o backend instalado no Google (`32_Portal_Cliente_V3.gs`, sha256 `ee802175…713f0`) e a página do cliente (`portal/painel-cliente.html`, 77.351 bytes) fala exatamente isto. O trecho "V2" que o outro agente deixou no fim de `_ferramentas/contrato-api-paineis.md` **fica sem efeito para o portal do cliente** (resumo em objeto, `notificacoes[]`, `portal_doc_link`, tipos curtos de pedido, datas ISO): nada disso existe no V3. A parte do **painel de gestão antigo** daquele arquivo é outro assunto e não foi tocada.

Endereço: implantação "Portal API" (projeto "Portal do Cliente – Lucas Semim"), lida pela página em `js/ls-api-config.js` → `apiUrlPortal` (sem ela, a página usa `apiUrl`).

## Regras de transporte
- Sempre **POST**, corpo JSON enviado como `text/plain` (evita pré-verificação CORS do navegador com o Apps Script). Nada sensível na URL.
- Resposta sempre JSON. Sucesso: `sucesso: true`. Erro: `{ sucesso:false, mensagem }`. Sessão vencida: `{ sucesso:false, expirou:true, mensagem }` (a página volta para o login).
- Ação desconhecida: resposta genérica sem detalhe (`Pedido não reconhecido.` para qualquer `acao` que não comece com `portal_`; `Ação não reconhecida.` para uma `portal_*` que não existe). Conferido no Google real em 15/10.
- Datas para o cliente: `dd/MM/yyyy`; data e hora de pedido: `dd/MM/yyyy HH:mm`.
- Sessão: token de 64 caracteres hexadecimais, 6 h. A página guarda só em `sessionStorage` (`ls_pt`).

## Ações
| Ação | Entrada | Saída (sucesso) | Limites e regras |
|---|---|---|---|
| `portal_login` | `email`, `senha` | `token`, `nome` | Mesma mensagem para e-mail ou senha errados. 5 erros por e-mail → 15 min de bloqueio; teto global de erros por 10 min. Senha até 64 caracteres. |
| `portal_painel` | `token` | `cliente{nome,email}`, `processo{numero,classe,juizo,fase,atualizadoEm}`, `resumo`, `proximoPasso` (só se o advogado liberou), `movimentacoes[{data,evento,titulo,descricao}]` (30), `diligencias[{data,tipo,texto,status}]` (20), `documentos{contrato,procuracao,declaracao,enviados[{nome,data}],escritorio}` (`escritorio` = quantos arquivos liberados), `pedidos[{protocolo,tipo,mensagem,status,resposta,data}]` (20) | Só aparece o que está marcado visível. O cliente só enxerga os casos ligados ao seu usuário. |
| `portal_docs` | `token` | `total`, `pastas[{id,nome,arquivos[{id,nome,atualizadoEm,tamanho,tipo}]}]` | Só documentos liberados pelo escritório. O `id` do arquivo é `D-XXXXXX`; o `id` da pasta é o nome do grupo (nunca um ID do Drive). Grupos: Contratos e procurações, Decisões e peças, Provas e laudos, Orientações do escritório, Outros. |
| `portal_doc_baixar` | `token`, `id` (`D-XXXXXX`) | `nome`, `mimeType`, `data` (base64) | Sem link do Drive. Até 8 MB; 40 downloads por hora por usuário. Documento nativo do Google sai como PDF. Tipo não permitido ou documento de outro caso → "Documento não encontrado.". |
| `portal_upload` | `token`, `nome`, `mimeType`, `data` (base64 puro ou `data:…;base64,…`) | `nome` | Só PDF, JPG, PNG (conferidos pelos primeiros bytes), até 6 MB, 10 por dia. Vai para a subpasta `06_Enviados_pelo_cliente` do caso. |
| `portal_pedido` | `token`, `tipo`, `mensagem` | `protocolo` (`PC-aammdd-XXXX`) | `tipo` é um dos 5: Pedir visita ao preso · Cópia de decisão ou peça · Retorno do advogado · Enviar informação nova · Outro assunto. Mensagem de 5 a 1.200 caracteres. 10 por dia. O advogado recebe aviso por e-mail. |
| `portal_logout` | `token` | — | Apaga a sessão. |

## O que o cliente NUNCA recebe
Andamento ou diligência marcados como internos, resumo não liberado, documento escondido, subpastas administrativas, IDs do Drive, links do Drive, o conteúdo dos arquivos de outro cliente, qualquer segredo (pepper, e-mails do advogado).

## Pontos para lembrar
- O servidor troca caracteres especiais no nome do arquivo (por exemplo `–` vira `_`). Dê nomes simples ao liberar documentos na Central.
- A resposta de um pedido aparece só com a data do pedido (o servidor não guarda a hora da resposta para o cliente).
- "Novidades" na página junta andamentos, ações do advogado e pedidos; **não** existe lido/não lido no servidor.
- A barra de etapas da página lê palavras da `fase` (Inquérito, Instrução, Sentença, Recurso, Execução). Outra palavra: a barra some e o texto da fase continua aparecendo.
- Para mudar o backend no futuro: colar no editor → Implantar → Gerenciar implantações → lápis nas **duas** implantações → Nova versão. Os endereços não mudam. Mexeu no formato acima? Atualize este arquivo e a página no mesmo dia.

## Conferido no Google real, a partir do endereço do site (15/10/2026)
POST cruzado `lucassemim.adv.br` → Portal API: sem erro de CORS (200, JSON). Login falso → "E-mail ou senha incorretos."; `portal_painel`, `portal_docs`, `portal_doc_baixar` e `portal_pedido` com token inválido → `expirou:true`; ação fora do portal → "Pedido não reconhecido.".

## Quem testa o quê
- Backend (`.gs`): 81 testes + 85 defeitos plantados + `portal3Testes()` no Google real.
- Página do cliente: `_testes/test/e2e_cliente_app.js` (27 passos, contra o simulador que roda o mesmo código do Apps Script), em dois modos (API antiga e projeto novo). Rodar de novo sempre que mudar a página ou este contrato.
