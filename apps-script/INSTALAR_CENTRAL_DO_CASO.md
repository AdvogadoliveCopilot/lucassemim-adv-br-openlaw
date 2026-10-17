# Central do Caso — instalar no Apps Script (5 minutos)

Projeto: **Advogado Live** (o mesmo da planilha). Você só cola e clica; o site já está ligado.

## 1. Colar o arquivo novo
Editor do Apps Script → **+** → **Script** → nome `23_API_Central_Caso` → cole o conteúdo de `23_API_Central_Caso.gs` → salvar.

## 2. Ligar no `doPost` (2 linhas)
Abra o arquivo `13_API_Site` e coloque **logo na primeira linha de dentro do `doPost(e) {`**:

```js
try { var _p = JSON.parse(e.postData.contents); if (_p && _p.acao === 'central_caso') return processarCentralCaso(e); } catch (_) {}
```

Se o seu `doPost` já chama `processarIntakeClienteSite(e)`, deixe como está: os outros formulários (bets etc.) continuam iguais.

## 3. Autorizar (uma vez)
Selecione a função `autorizarCentralCaso` → **Executar** → aceite as permissões (Drive, Documentos, Planilhas, Gmail, Agenda).

## 4. Testar
Função `testarCentralCaso` → **Executar**. Deve chegar:
- e-mail "🚨 PLANTÃO · TESTE SITE João…" com botões de WhatsApp e rota;
- evento vermelho na Agenda;
- pasta "TESTE SITE JOÃO - …" em 01_CLIENTES com a Ficha de Triagem;
- linha nova na aba `TRIAGEM_SITE`.
Apague a pasta de teste depois.

## 5. Publicar
**Implantar → Gerenciar implantações → "Api site" → lápis → Versão: Nova versão → Implantar.**
A URL (`…/exec`) **não muda**. Só isso: o site já usa essa URL.

## Notas
- Para mais de um advogado no plantão: edite `CC_ADVOGADOS` no topo do arquivo (cidades de cada um).
- OCR do REDS usa o serviço avançado **Drive API** (o mesmo do `21_LeitorREDS`). Se estiver desligado, a triagem segue sem ler o PDF.
- Segurança: a chave do Gemini está em texto no `00_Config_Menu`. Quando puder, mova para **Configurações do projeto → Propriedades do script** (`API_KEY`) e leia com `PropertiesService`.
- Se o Apps Script cair, o site NÃO perde o lead: monta a ficha e abre o WhatsApp com tudo preenchido.
