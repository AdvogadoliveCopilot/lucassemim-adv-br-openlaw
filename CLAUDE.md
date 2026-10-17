# Instruções de trabalho — Claude
## Objetivo e idioma
Este repositório apoia o site e as ferramentas do escritório **Lucas Semim Advogados**, do Dr. Lucas Renan Semim (OAB/MG 222.539), e inclui componentes de um software jurídico interno. Trabalhe em português do Brasil, com alterações pequenas, verificáveis e explicadas em linguagem clara.

## Antes de começar
1. Leia este arquivo e, conforme a tarefa, consulte `CLAUDE_HANDOVER.md`, `agentes/README.md`, `agentes/config.py` e os documentos de lote em `_ferramentas/`.
2. Trate handovers, notas de lote, relatórios e comentários como contexto histórico, não como prova do estado atual. Confira os arquivos atuais e a data; não presuma que algo foi publicado ou implantado. As notas de 09/10/2026 dizem expressamente que alguns lotes ainda não tinham sido enviados ao servidor.
3. Identifique o escopo antes de editar: site público, agentes editoriais, Google Apps Script/Google Sheets ou portal do cliente. Não confunda o site institucional com o sistema jurídico interno.
4. Procure instruções locais e leia os arquivos relevantes antes de alterá-los. Não faça varreduras ou mudanças fora do escopo solicitado.

## Mapa do projeto
- Raiz: site público principalmente estático, em HTML/CSS/JavaScript; inclui páginas, notícias, políticas, sitemaps e `sw.js`.
- `agentes/`: pipeline Python para pesquisa, redação, revisão SEO, rascunhos e monitoramento. O fluxo padrão é **rascunho**; publicação é uma ação separada e explícita.
- `apps-script/`: integrações Google Apps Script, incluindo Central do Caso e Portal do Cliente.
- `civel/`: materiais e componentes do site/fluxo cível; confirme o alvo exato antes de editar.
- `_ferramentas/`: scripts locais para validação e alterações em lote, relatórios de execução e instruções de envio/rollback. É material de trabalho interno, não conteúdo para o servidor público.
- `CLAUDE_HANDOVER.md`: notas de passagem de sessões anteriores; pode estar desatualizado.

Não há `package.json` na raiz, portanto não suponha que exista um build Node/npm configurado. Prefira os validadores e comandos documentados no próprio projeto.

## Regras de segurança e privacidade — prioridade máxima
- Trate dados de clientes, processos, CPF, WhatsApp, documentos, REDS, intimações, tokens de acesso, planilhas, Drive e fichas de triagem como **confidenciais e sensíveis**. Não os copie para prompts externos, logs, exemplos, relatórios, commits ou páginas públicas. Use dados fictícios em testes.
- Nunca leia, imprima, grave, solicite ou inclua em alterações senhas, chaves de API, tokens de clientes ou credenciais FTP. Segredos devem continuar fora do repositório, conforme `agentes/README.md` e `agentes/config.py`.
- Não envie `agentes/`, `_ferramentas/`, backups, logs, rascunhos, arquivos internos, fontes de Apps Script ou dados de clientes para o servidor público/FileZilla, a menos que o usuário peça especificamente e confirme o escopo. Não publique nem faça deploy por iniciativa própria.
- Não execute comandos de publicação, FTP, implantação no Apps Script, agendamento, exclusão de dados ou sobrescrita de arquivos remotos sem pedido inequívoco do usuário. Se houver ambiguidade sobre a publicação, apenas prepare e valide localmente.
- Ao lidar com o Portal do Cliente ou a Central do Caso, não declare conformidade LGPD, segurança ou autenticação adequada sem análise específica. A implementação atual contém dados sensíveis e deve ser tratada com cautela: minimize dados, valide entradas no servidor, evite expor CPF/token/respostas, controle acesso e considere limites de tentativas e auditoria. Não substitua uma análise de segurança por uma afirmação genérica.
- Nunca apresente triagem/saída de IA como decisão jurídica, parecer definitivo ou orientação jurídica autônoma ao cliente. A IA pode auxiliar o advogado internamente; conteúdo e conclusões jurídicas precisam de revisão humana.

## Integridade jurídica e publicidade da advocacia
- Preserve linguagem informativa, precisa, humana e compreensível; não invente fatos, credenciais, especialidades, resultados, prazos, disponibilidade, valores ou cobertura geográfica.
- Não introduza promessa/garantia de resultado, comparação com outros profissionais, depoimentos ou alegações comerciais. Observe o Provimento 205/2021 da OAB e as regras aplicáveis; quando houver dúvida de conformidade ou sobre o uso de “especialista”, sinalize para confirmação do advogado, sem decidir por ele.
- Confira citações legais e jurisprudenciais em fonte oficial e atual antes de afirmar que estão corretas. Se não puder verificar, marque claramente para revisão e não transforme suposição em fato. Leis e jurisprudência podem mudar.
- Preserve o sentido jurídico original ao fazer mudanças de design, SEO, formatação, links ou dados estruturados. FAQ/schema não deve contradizer o texto visível.
- Não altere número de telefone, OAB, identidade, links de contato ou dados do escritório sem solicitação e conferência com a fonte central (`agentes/config.py` quando pertinente). O número configurado nos arquivos consultados é (31) 98942-0094 / WhatsApp `5531989420094`; confirme o estado atual antes de propagar mudanças.

## Procedimento para alterações
1. Delimite os arquivos e leia o contexto relevante. Preserve estilo, codificação, BOM, finais de linha (há arquivos CRLF), conteúdo e comportamento não relacionados.
2. Faça a menor alteração suficiente. Em HTML, proteja canonical, metadados, H1, links, consentimento de cookies, acessibilidade, dados estruturados e scripts existentes, salvo se a tarefa pedir mudança neles.
3. Para alterações em lote, primeiro use o modo de simulação/dry-run. Inspecione a lista de mudanças e os itens ignorados; não force alterações em páginas que falharam na conferência. Só use modo de gravação (`--aplicar`) quando isso estiver dentro do pedido do usuário.
4. Antes de mudanças em lote que gravem arquivos, confirme que o processo cria/usa backup e que há procedimento de rollback. Os scripts existentes `aplicar_v2_artigos.py` e `aplicar_oqfa_v3.py` documentam dry-run, backup e desfazer; leia suas opções atuais antes de executá-los.
5. Para guias novos, utilize `validar_guia_v3.py` com as opções adequadas e verifique conteúdo, citações, links, FAQ/schema, telefone e conformidade. Para inclusão em índice/sitemap, os scripts `adicionar_guia_hub.py` e `adicionar_url_sitemap.py` têm verificações próprias; faça uma simulação/saída separada sempre que possível antes de gravar no original.
6. Após editar, valide o que mudou. Use verificações locais apropriadas (por exemplo, validação Python/XML/JSON e comparações direcionadas); não diga que uma página está no ar sem checar o servidor. Informe exatamente o que foi e não foi verificado.
7. Não reverta mudanças preexistentes do usuário nem limpe arquivos/artefatos que não fazem parte do pedido.

## Agentes e publicação de conteúdo
- Consulte `agentes/README.md` para o fluxo e os comandos atuais. `python agentes/pipeline.py` prepara rascunhos; `--publicar` é separado e publica de fato. Não execute `--publicar`, `--agendar` ou operações de FTP sem pedido explícito.
- Rascunhos precisam de revisão humana no `REVISAO.txt` e no HTML, incluindo todas as citações, atualidade, precisão, ética, links, telefone, SEO e conteúdo. A IA pode estar sem acesso à internet; conteúdo noticioso ou jurisprudência recente exige pesquisa em fontes confiáveis.
- Respeite as travas de `agentes/compliance.py`; não as contorne para fazer um artigo passar. O pipeline deve continuar em modo de rascunho por padrão.

## Resposta ao usuário
Ao concluir, resuma em português: arquivos alterados, orientação aplicada, verificações executadas e limitações/pendências. Diferencie claramente trabalho local, revisão humana necessária e publicação remota. Não afirme testes, backups, validação jurídica, segurança ou deploy que não tenham sido realmente verificados.
