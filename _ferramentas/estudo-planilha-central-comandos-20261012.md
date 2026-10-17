# Estudo reservado — planilha, site e futura Central de Comandos
**12/10/2026 · Somente diagnóstico e plano; nada implantado.**

## Situação verificada
- Link fornecido pelo Dr. Lucas aponta para uma planilha Google privada; requisição sem autenticação retornou HTTP 401. Não foi possível ver abas, cabeçalhos, valores, fórmulas, permissões, gatilhos nem projeto Apps Script implantado. Não mudar o compartilhamento para “qualquer pessoa com o link”.
- OmniRoute local estava acessível e os combos dos agentes editoriais responderam em teste anterior. **Isso não confere acesso à planilha.** Agentes editoriais atuais (`agentes/README.md`, `agentes/config.py`) produzem artigos em rascunho; não têm conector autenticado e autorizado para Google Sheets.
- Os arquivos locais em `apps-script/` são material de trabalho, não prova do projeto online. `31_Planilha_Auditoria_V2.gs` propõe criar `DASHBOARD_LEADS`, `CLIENTES_PROCESSOS`, `CONFIG_AUDITORIA` e ocultar indiscriminadamente todas as demais abas. **Não executar `enxugarPlanilha`, `protegerConfiguracoes`, `configurarBackupDiario` ou `fazerBackupManual` no ambiente real sem revisão.** As abas existentes podem alimentar site, triagem, fluxos cíveis, auditoria e painéis; ocultar não equivale a consolidar dados.
- `30_Portal_Cliente_V2.gs` lê `CLIENTES_PROCESSOS` por CPF/token curto; não corresponde às rotas de login do portal atual. `23_API_Central_Caso.gs` grava em `TRIAGEM_SITE` (se o código local estiver implantado). A aba `Dashboard Principal` é mencionada por componentes cíveis e pelo painel administrativo antigo. Nenhuma delas pode ser descartada por inferência.
- O script de auditoria local `31_Planilha_Auditoria_V2.gs` inclui um `onOpen` genérico (verificar colisões com o projeto real), cria abas vazias sem migrar histórico, protege configurações de forma que merece revisão e agenda `fazerBackupManual`, função que chama `SpreadsheetApp.getUi()` — potencialmente inadequada em execução por gatilho sem interface. Testar backup **e restauração**, com cópia privada, antes de qualquer mudança.

## Estratégia proposta para visualização fácil, sem quebrar integrações
1. **Inventário somente metadados (sem células):** nomes e IDs internos (`gid`) das abas, visibilidade, cabeçalhos somente se não sensíveis, contagens aproximadas, quais são origem/saída/manual, scripts/fórmulas/gatilhos que dependem de cada nome/posição. Nunca colocar linhas de clientes, CPF, contatos, relatos ou tokens em relatórios de IA. Se cabeçalho contém informação confidencial, classificar sem copiar.
2. **Mapa de dependências:** site → endpoint → rotina Apps Script implantada → abas/colunas; Central do Caso, cível, portal e painel. Distinguir confirmado no online de evidência local. Fixar contrato de colunas e permissões antes de propor renomear/ocultar abas.
3. **Camada de apresentação não destrutiva:** propor uma aba inicial `INICIO`/índice sem dados sensíveis com links internos para grupos de abas (atendimento, clientes, processos, operação, configuração, histórico). Acesso por perfil e cores/guias de uso. Painel operacional deve usar leituras controladas e dados agregados; não espalhar dados sigilosos em dashboards amplamente compartilhados. Não migrar/ocultar automaticamente.
4. **Modelo da futura Central:** IDs estáveis para clientes/casos/solicitações; permissões caso a caso aplicadas no backend; prazos com revisão humana; inbox de triagem separado de processos formalizados; log de auditoria sem conteúdo sensível. Definir fonte oficial de cada dado e política de retenção.
5. **Implantação gradual:** cópia privada com acesso restrito e dados sintéticos; testes de leitura/escrita e automações; inventário antes/depois; backup + restauração validada; implantação aprovada em etapas reversíveis. Jamais publicar API de leitura irrestrita da planilha.

## Designação de papel: Agente Auditor de Estrutura (somente estudo)
- **Entrada permitida:** documento de briefing, esquemas sintéticos, metadados mínimos de abas fornecidos por rotina local revisada, lista sanitizada de dependências. Nada de conteúdo de células reais, IDs de planilha, URLs privadas de acesso, segredos ou contatos.
- **Saída:** inventário classificado, matriz aba × produtor × consumidor × criticidade × ação sugerida; proposta de navegação visual; riscos; plano de testes e reversão. Toda recomendação do agente exige verificação humana no código/planilha.
- **Acesso:** nenhum ao Google Sheets, Drive, Gmail ou contas. OmniRoute recebe apenas informações sintéticas/sanitizadas após autorização para compartilhamento com o provedor de IA. Não usar token OAuth da assinatura Claude em ferramentas de terceiros; não criar compartilhamento público nem service account sem escopo e controles.
- **Status real:** papel definido neste documento; **não existe agente novo instalado ou conectado à planilha**. Claude Code pode implementá-lo futuramente após escolher forma de autenticação de mínimo privilégio e revisar privacidade/segurança.

## Próxima ação para Claude Code
1. Ler `CLAUDE.md`, `_ferramentas/briefing-claude-central-comandos-dr-lucas-20261012.md` e este estudo.
2. Fazer análise estática dirigida dos consumidores/produtores de Sheets em `apps-script/`, `civel/` e `portal/`, sem ler segredos nem dados pessoais. Não executar os comandos de reorganização da planilha.
3. Propor um **inventário autenticado somente de metadados** para rodar no Apps Script/conta do proprietário, com saída restrita e sem conteúdo de células; primeiro revisar o código e os escopos com o Dr. Lucas. Caso ele prefira, pode descrever manualmente apenas nomes genéricos de abas e finalidade, sem dados de clientes.
4. Entregar protótipo de navegação usando dados fictícios e plano de transição que preserve nomes de abas e fórmulas até confirmar os consumidores reais.

**Condição de bloqueio:** sem acesso autenticado não é possível afirmar quantas abas existem, se `gid=301242451` corresponde a determinada aba, como estão as permissões nem que a planilha já está ligada aos painéis. Não preencher essas lacunas com suposição.

## Proposta visual para o Claude Code — conceito, NÃO uma tela instalada
**Nome de trabalho:** Central de Comandos · Lucas Semim. Objetivo: transformar a planilha em fonte operacional controlada, não transformar uma aba em tela pública. A interface abaixo é um **wireframe conceitual com números e nomes fictícios**; não descreve dados reais nem pressupõe endpoints funcionando.

```text
┌──────────────────────────────┐
│ LUCAS SEMIM  /  Central de Comandos                         Conta  ·  Sair │
├─────────────────┬────────────────────────────┤
│ Hoje            │ Segunda, 12 de outubro · visão operacional              │
│ Caixa de entrada│ [Itens a revisar] [Prazos conferidos] [Solicitações]      │
│ Casos           │                                                            │
│ Tarefas e prazos│ Próximas ações           │ Entrada recente                │
│ Documentos      │ Ex.: conferir prazo      │ Ex.: pedido de documento      │
│ Equipe e acessos│ Fonte · responsável     │ Origem · status · responsável  │
│ Integrações     │                            │                               │
└─────────────────┴────────────────────────────┘
```

### Linguagem de design
- Fundo grafite, cartões de alto contraste e dourado discreto para identidade; vermelho só para alerta validado, não para criar urgência artificial. Tipografia legível para dados; hierarquia: **tarefa > responsável > fonte > atualização**. Layout com barra lateral no computador e menu acessível no celular. Respeitar preferência de movimento reduzido.
- Indicadores exibem **contagens agregadas** e carimbo de última sincronização; se não houver atualização confiável, mostrar “Dados não sincronizados” e não zero enganoso. Prazos exigem origem, fuso horário, responsável pela conferência e estado “a conferir / conferido”; cálculo automático não substitui advogado.
- Uma busca única por cliente/caso na **área interna**, com retorno mínimo e acesso a detalhes somente após autorização por caso. Nunca exibir nomes, CPF, contatos ou número integral de processo em notificações, página inicial aberta para equipe ampla ou logs de IA.
- Caixa de entrada separa **lead/triagem**, **cliente ativo** e **pedido do portal**; não converter automaticamente triagem ou inferência de IA em providência jurídica. Ações em cada cartão: atribuir, registrar providência, concluir, reabrir (permissões e auditoria no servidor).
- A “visão do cliente” é distinta e reduzida: status informativo revisado, documentos autorizados, pedidos e respostas; não compartilhar a visão interna, notas estratégicas ou dados de outros casos.

### Fluxos prioritários para prototipar com dados fictícios
1. **Entrada:** pedido do portal chega com protocolo fictício → validação no backend → caixa de entrada do responsável → confirmação/atribuição → status visível ao próprio cliente. Nenhum pedido pendente deve parecer respondido por automação.
2. **Prazo:** registro de fonte e data → conferência humana → alerta por antecedência configurável → marcação como cumprido com autoria/hora. Não calcular ou publicar prazo legal como verdade sem validação.
3. **Documento:** upload privado → verificação de limites/tipo → associação ao caso pelo servidor → revisão → autorização individual de visibilidade → acesso auditado. Sem URLs públicas e sem anexos em respostas do OmniRoute.
4. **Usuário fictício:** criação via fluxo administrativo autenticado → convite temporário por canal escolhido → primeiro acesso e troca de senha/MFA → vínculo a caso fictício → teste de isolamento → revogação e confirmação de sessão encerrada.

### Matriz mínima de telas (a validar com o Dr. Lucas)
| Tela | Dr. Lucas | Equipe autorizada | Cliente |
|---|---|---|---|
| Visão diária interna | Tudo do escopo autorizado | Só tarefas e casos atribuídos | Não |
| Caixa de triagem | Revisar/atribuir | Apenas itens atribuídos | Não |
| Caso e documentos | Escopo definido pelo servidor | Somente vínculos explícitos | Apenas documentos liberados do seu caso |
| Pedidos e respostas | Responder e supervisionar | Responder se autorizado | Criar e consultar os próprios |
| Acessos, integrações e auditoria | Administrar | Não, salvo delegação específica | Não |

A matriz é **proposta de produto**, não permissões já implementadas. Verificar também limites da equipe caso exista mais de um profissional.

### Interface com a planilha: decisão antes do layout definitivo
- Construir primeiro um **mapa de dados e contrato de API**, não ligar diretamente HTML à planilha: origem de cada entidade, IDs estáveis, colunas necessárias, perfis autorizados, atualização, política de retenção e erro de sincronização.
- Para a planilha em si, avaliar uma aba inicial de **navegação** sem dados sensíveis, com legenda de cores e links internos. Nas abas operacionais existentes, preferir cabeçalho congelado, filtros por visualização, larguras padronizadas, validação de entrada e legendas de status **em uma cópia de teste**, sem mudar nomes/ordem de colunas até mapear consumidores. Filtros/abas ocultas não são controle de acesso.
- Se Sheets/Apps Script não suportarem com segurança a autenticação, auditoria e isolamento exigidos, propor backend apropriado; não forçar o desenho do software aos limites da planilha. A planilha pode permanecer ferramenta de apoio, sem virar fonte única de autorização.

### Entrega que espero do Claude Code ao retomar
1. Inventário local de chamadas à planilha e hipótese de dependências, marcado como **local, não confirmado online**. Nada de imprimir endpoint, ID privado, segredo ou registro de cliente.
2. Esboço visual responsivo isolado, com dados 100% sintéticos e marca d’água “PROTÓTIPO — sem dados reais”, sem chamadas à API, analytics ou upload real.
3. Mapa de rotas/telas + estados de erro/vazio/sessão expirada e especificação das permissões para cada ação.
4. Alternativas de implantação com riscos, esforço aproximado e critério para decidir Apps Script versus backend dedicado. Revisar arquitetura e fazer testes negativos antes de qualquer integração.
5. Plano de mudanças na planilha **somente após inventário autorizado**, privilegiando navegação sobre migração; registrar o que não foi verificado.

**Limite desta entrega:** o conceito acima é documentação local para orientar o codificador. Não foi implementado protótipo, agente, conexão com Sheets ou alteração remota. O Dr. Lucas decide prioridades, escopo de equipe e quais dados aparecerão em cada papel antes da construção.

## Integração CodeGPT ↔ OmniRoute — análise de viabilidade, sem conexão ativa
- Em 12/10/2026, `http://localhost:20128/home` respondeu HTTP 200; `https://app.codegpt.co/en` redirecionou para `/en/login` nesta sessão. Isso não autoriza configurar conta, API nem agentes do CodeGPT.
- **Duas direções distintas:** (A) usar um modelo do OmniRoute **dentro do CodeGPT no VS Code**; (B) chamar um **agente hospedado no CodeGPT a partir do OmniRoute**. A primeira depende de o plano CodeGPT habilitar provedor Custom e de configurar um endpoint compatível; a documentação [Custom do CodeGPT](https://docs.codegpt.co/docs/tutorial-ai-providers/custom/) exige plano Professional/Teams, nome de modelo, chave e URL de completion. O endpoint local típico é `http://localhost:20128/v1/chat/completions` (verificar modelo/chave no painel do OmniRoute), mas o site CodeGPT na nuvem não alcança `localhost` do computador. Não expor essa porta na internet nem colocar chave no repositório.
- Na direção (B), [CodeGPT Plus API](https://docs.codegpt.co/docs/codegpt_plus_api/) documenta acesso REST a agentes. Isso **não demonstra** que o OmniRoute aceite CodeGPT como provedor de entrada; confirmar suporte nativo ou necessidade de adaptador usando documentação da versão instalada. Não cadastrar URL genérica como se fosse endpoint OpenAI-compatible, nem reutilizar login/cookie/sessão web como API key.
- Próximo estudo do Claude Code: perguntar **qual sentido da integração** o Dr. Lucas deseja, confirmar plano e acesso à API no CodeGPT, pesquisar formato real de autenticação/endpoint e verificar se a versão instalada do OmniRoute suporta fornecedor customizado do tipo necessário. Entregar diagrama, testes sintéticos e análise de custos/privacidade antes de conectar. Não enviar dados de clientes ou planilha ao CodeGPT/OmniRoute por padrão.
- **Estado:** nenhuma integração CodeGPT ↔ OmniRoute foi configurada e o aplicativo jurídico segue somente como projeto de arquitetura. A conexão entre serviços não equivale a dar a um agente permissão para editar a planilha ou o site.

## Andamento 12/10/2026 — Etapa A iniciada
- Inventário local de produtores/consumidores: `_ferramentas/inventario-abas-etapa-a-20261012.md` (sem URLs, IDs ou segredos transcritos).
- Script de inventário **somente leitura** pronto para revisão: `_ferramentas/inventario-abas/InventarioAbas.gs`. Validado localmente: sintaxe OK, nenhuma chamada de escrita/ocultação/rede encontrada, filtro de cabeçalho mascara e-mail, números longos e códigos (teste com dados fictícios). **Não foi executado no Google.**
- Sobre a resposta do agente via OmniRoute: sugeriu comparar “Swagger/OpenAPI” e “staging”. **Não há nenhum dos dois neste projeto**; tratar como sugestão genérica. O equivalente real aqui é o contrato de ações (`acao`) entre o site e as implantações do Apps Script, mapeado no inventário.
