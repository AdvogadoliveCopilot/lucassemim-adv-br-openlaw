# Etapa A — inventário local de produtores e consumidores da planilha
**12/10/2026 · análise estática do repositório. NADA aqui é prova do ambiente online.**

Escopo cumprido: leitura do código local que grava ou lê a planilha. Não foram abertos segredos, chaves, tokens, URLs de implantação nem registros de clientes. Nenhum comando foi executado no Google.

## 1. Aviso sobre segredos e identificadores
Este documento **não transcreve** URLs de implantação, IDs de planilha/pasta, chaves ou telefones de terceiros. Onde o código traz uma URL `/exec`, o texto fala apenas em “implantação A/B/C”. Se algum dia este inventário for enviado a uma IA externa, revisar antes: as URLs de implantação do Apps Script funcionam como credencial de acesso ao backend.

## 2. Produtores (escrevem na planilha)

| Arquivo local | Aba | Observação estrutural |
|---|---|---|
| `apps-script/23_API_Central_Caso.gs` | `TRIAGEM_SITE` (23 colunas, criada se faltar) | Grava triagem do site: protocolo, urgência da IA, resumo, checklist, pasta e ficha no Drive, responsável, status `NOVO`. Usa planilha ativa; se não houver, propriedade `ID_PLANILHA_TRIAGEM`. Também cria pastas em `01_CLIENTES`, Google Doc de ficha, e-mail ao advogado, evento na Agenda. Tem controle de taxa por WhatsApp via cache. |
| `civel/Claude outputs/24_API_Central_Civel.gs` | `CV_ABA` (Central Cível, 21 colunas) e `RETORNO_CIVEL` (10 colunas) | Mesmo padrão: registra triagem cível e retorno de funil. |
| `civel/Claude outputs/28_Escudo_Seguranca.gs` | `ESCUDO.ABA_LOG` e `ESCUDO.ABA_QUARENTENA` | Quarentena guarda **trecho de texto do cliente** e contato. `escudoLimpeza_` apaga linhas antigas de log. Menciona a aba `Dashboard Principal` para proteger cabeçalho e fórmulas. |
| `apps-script/31_Planilha_Auditoria_V2.gs` | cria `DASHBOARD_LEADS`, `CLIENTES_PROCESSOS`, `CONFIG_AUDITORIA`; oculta **todas** as demais | Reorganização destrutiva do ponto de vista operacional. Não migra dados históricos. Não usar antes do inventário online. |

## 3. Consumidores (leem a planilha ou dependem dela)

| Arquivo local | Como acessa | Observação |
|---|---|---|
| `civel/codeleicivel/civel-painel-auth.js` | requisição `GET` com ação `loginCliente`, enviando e-mail e **senha** como parâmetro de URL | Comentário do próprio arquivo diz que a senha é conferida contra hash com salt em aba oculta. Guarda o e-mail em `sessionStorage`. |
| `painel-gestao-admin.html` (raiz) | `GET` com ação `loginAdmin` enviando **senha** como parâmetro, e ações `listarProcessosAdmin` / `salvarProcessoAdmin` com token | Painel administrativo interno; token em `sessionStorage`. |
| `apps-script/30_Portal_Cliente_V2.gs` | `SpreadsheetApp.openById` + aba `CLIENTES_PROCESSOS`, valida **CPF + token curto de 5 caracteres** | Esqueleto local, ID placeholder, `doGet` próprio. O contrato não bate com as ações que o portal novo envia (`portal_login` etc.). |
| `js/ls-api-config.js` → `js/central-caso.js`, `diagnostico.html`, `portal/painel-cliente.html` | `POST` para a implantação de backend usada pelo site | Define a URL base usada pelo site público e pelo portal. |
| `js/return-lead.js` | `POST` em modo opaco (`no-cors`) para uma **segunda** implantação | Como a resposta não é legível, o código não consegue confirmar se o lead foi gravado. |
| `js/anjo-core-engine.js` | `POST` para uma **terceira** implantação (projeto-anjo) | Terceiro backend independente. |

## 4. Hipótese de topologia (não confirmada online)
Existem **pelo menos três implantações de Apps Script** referenciadas no código local e **pelo menos quatro nomes de aba** produzidos (`TRIAGEM_SITE`, `CV_ABA`, `RETORNO_CIVEL`, log/quarentena do escudo), mais as abas criadas pelo script de auditoria. As ações do portal novo (`portal_login`, `portal_painel`, `portal_logout`, `portal_pedido`, `portal_upload`) não foram localizadas em nenhum `.gs` deste repositório.

Conclusão: **não é possível afirmar hoje se tudo isso aponta para a mesma planilha.** Confirmar com o Dr. Lucas, no editor do Apps Script: quantos projetos existem, qual planilha cada implantação abre, e quais abas cada rotina realmente cria ou lê.

## 5. Riscos encontrados na leitura (por severidade)
1. **Crítico — senha em parâmetro de URL.** Presente no painel administrativo da raiz e no login do painel cível. Parâmetros de URL aparecem em histórico do navegador, logs de servidor intermediário, referenciadores e capturas de tela. Correção: migrar para `POST` com corpo, nunca em querystring.
2. **Crítico — conteúdo de cliente gravado em aba de quarentena** (`28_Escudo_Seguranca.gs`, campo de trecho de texto) e limpeza automática que apaga linhas. Definir retenção, acesso e o que pode ser gravado.
3. **Alto — script de reorganização oculta todas as outras abas** (`31_Planilha_Auditoria_V2.gs`). Se alguma rotina de produção procurar aba por nome, ela continua funcionando; se procurar por posição, quebra. Ocultar não consolida. Não executar sem inventário online.
4. **Alto — backup diário provavelmente falha.** `configurarBackupDiario` agenda `fazerBackupManual`, que chama `SpreadsheetApp.getUi()`. Em execução por gatilho não há interface, e a função lança erro — ou seja, existe a impressão de backup agendado sem backup real. Verificar no projeto online e preferir `DriveApp` sem `getUi`.
5. **Alto — autenticação fraca no portal.** CPF + token de 5 caracteres, sem limite de tentativas visível nesse arquivo (o `23_API_Central_Caso.gs` tem limite, mas por WhatsApp). Não usar como login definitivo.
6. **Médio — lead pode ser perdido em silêncio.** `return-lead.js` usa `no-cors` e não lê a resposta. Registrar falha no próprio navegador ou usar a mesma implantação com resposta legível.
7. **Médio — três backends distintos.** Aumenta a chance de dados na planilha errada e dificulta auditoria. Consolidar ou documentar claramente.
8. **Médio — `onOpen` genérico no script de auditoria.** Se implantado no projeto que já tem `onOpen`, um sobrescreve o outro. Confirmar antes.

## 6. O que só o Dr. Lucas pode responder
1. Quantos projetos Apps Script estão publicados hoje e qual planilha cada um abre.
2. Quais abas são geradas automaticamente e quais são preenchidas à mão.
3. Se a planilha for restaurada de um backup, algum processo vizinho quebra?
4. Qual aba deve ser a fonte oficial de clientes, de processos e de triagem.
5. Quem, além dele, tem acesso à planilha hoje (equipe, contador, estagiário, link compartilhado).

## 7. Próximo passo permitido
Rodar, **com revisão prévia do código**, o inventário somente de metadados descrito neste mesmo diretório. A saída deve conter apenas nomes de abas, visibilidade, contagem de linhas/colunas e nomes de cabeçalho **quando não forem dado pessoal** — nunca o conteúdo das células. O resultado é de uso interno e não deve ser enviado a nenhum provedor de IA sem anonimizar antes.

Nada foi alterado na planilha, nos scripts publicados, nos agentes ou no site.
