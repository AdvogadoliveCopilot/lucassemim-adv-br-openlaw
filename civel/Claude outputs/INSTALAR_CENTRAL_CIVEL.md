# Central do Caso Cível — instalar no Apps Script (5 minutos)

Projeto: **Advogado Live** (o mesmo da Central do Caso criminal). Depende do arquivo `23_API_Central_Caso` que já está instalado.

## 1. Colar o arquivo novo
Editor do Apps Script → **+** → **Script** → nome `24_API_Central_Civel` → cole o conteúdo de `24_API_Central_Civel.gs` → salvar.

## 2. Ligar no roteador (1 linha)
Abra `23_WebApp_Dispatcher` e, no `doPost`, logo ao lado da rota `central_caso`, acrescente:

```js
if (_p && _p.acao === 'central_civel') return processarCentralCivel(e);
```

E mais esta linha logo abaixo (widget "Notamos que você já nos visitou"):

```js
if (_p && _p.acao === 'lead_retorno_civel') return processarRetornoCivel(e);
```

(Se o roteador estiver como `if (acao === 'central_caso') ...`, copie o mesmo formato trocando para `'central_civel'` e `processarCentralCivel(e)`.)

## 3. Autorizar (uma vez)
Função `autorizarCentralCivel` → **Executar**. Como a Central criminal já foi autorizada, normalmente não pede nada novo.

## 4. Testar
Funções `testarCentralCivel` e `testarRetornoCivel` → **Executar** (a segunda cria a aba `RETORNO_CIVEL` e manda o e-mail "🔁 Lead de retorno"). Deve chegar:
- e-mail "🔥 Lead cível quente · TESTE Site Maria · Plano de saúde…" com botão de WhatsApp;
- evento "📞 Retornar lead cível" na Agenda;
- pasta "TESTE SITE MARIA - CÍVEL - LC-…" em 01_CLIENTES com a Ficha de Triagem Cível;
- linha nova na aba `TRIAGEM_CIVEL` (criada sozinha).
Apague a pasta de teste e a linha depois.

## 5. Publicar
**Implantar → Gerenciar implantações → "Api site" → lápis → Versão: Nova versão → Implantar.**
A URL (`…/exec`) **não muda**; o site cível já usa essa URL em `civel-api-config.js`.

## Notas
- Se o Apps Script cair, o site NÃO perde o lead: abre o WhatsApp com a ficha pronta.
- A IA só organiza para o advogado; nada volta ao cliente.
