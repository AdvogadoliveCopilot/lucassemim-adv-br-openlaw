# Briefing para Claude Code — software jurídico, portal do cliente e Central de Comandos
**Data:** 12/10/2026  
**Status:** parâmetros de desenvolvimento e análise estática; não implementar nem publicar neste passo.  
**Idioma e contexto:** português do Brasil. Trabalhar em rascunho local, em pequenos passos, com dados fictícios. O Dr. Lucas confirma que o escritório atende em feriados; os demais fatos já tratados como confirmados continuam sujeitos às notas de subida. O funcionamento real da Área do Cliente ainda será testado pelo Dr. Lucas após criar usuário de teste. Não criar nem exibir credenciais reais.

## 1. Objetivo
Planejar a evolução conjunta de:

1. **Portal do Cliente** (`portal/painel-cliente.html`): login real, consulta do próprio caso, movimentações, documentos e pedidos ao escritório.
2. **Painel do Dr. Lucas / Central de Comandos**: área interna autenticada para visão operacional, clientes/processos autorizados, tarefas, prazos, solicitações e configurações.
3. **Backend e integração**: Apps Script/Google Sheets/Drive ou backend substituto, com autorização aplicada no servidor. O browser nunca é autoridade para decidir acesso.

Não assumir que o projeto Apps Script ativo é igual aos arquivos locais. Primeiro identificar o endpoint e o código efetivamente implantados por meio de configuração e confirmação do Dr. Lucas; não abrir, imprimir, copiar ou pedir segredos. Nenhuma implantação, publicação, envio de dados reais ou alteração remota sem pedido explícito.

## 2. Estado local observado (análise estática, não prova de produção)

- `portal/painel-cliente.html` contém a interface V2 e um modo demonstração via `#demo`; a própria página diz que os dados são fictícios e não são enviados. O fluxo real envia `portal_login`, `portal_painel`, `portal_logout`, `portal_pedido` e `portal_upload` para `window.LS_CONFIG.apiUrl` via POST.
- O arquivo `js/ls-api-config.js` é dependência do portal e deve ser inspecionado na próxima etapa, sem revelar endpoints/credenciais em relatórios públicos.
- Existe `apps-script/30_Portal_Cliente_V2.gs`, mas é um esqueleto: `ID_PLANILHA_MESTRE` está como placeholder, expõe uma função `doGet` própria e valida CPF + token curto de 5 caracteres em leitura de planilha. Não tratar como backend pronto nem colar no projeto ativo sem revisar colisões de `doGet`/`doPost`, rotas, autenticação, armazenamento e modelo real.
- Existe `painel-gestao-admin.html`, com `noindex`, token em `sessionStorage` e chamadas ao endpoint por query string. A senha de administrador é enviada em parâmetro GET; isso pode vazar em histórico, logs e monitoramento. A tela aparenta criar/editar registros e precisa de revisão de todas as rotas e controles no servidor antes de uso real. Não imprimir no briefing ou em logs a URL do endpoint encontrada no código.
- `CLAUDE_HANDOVER.md` contém informação histórica divergente (`painel-v2.html`, token por WhatsApp). `CLAUDE.md` é a instrução vigente e exige não presumir estado de produção, não revelar segredos e não publicar sem autorização.

## 3. Decisões de arquitetura a produzir antes de codificar
Entregar uma proposta curta de arquitetura e um diagrama de fluxo, incluindo:

- Papéis: administrador (Dr. Lucas), equipe autorizada (se houver), cliente e suporte técnico com acesso mínimo. Definir permissões por recurso e por caso; equipe não recebe acesso global por padrão.
- Identidade e sessão: login individual; preferir senha forte + segundo fator (TOTP ou código de uso único com expiração, após escolha do Dr. Lucas). Não usar CPF como segredo/autenticador. Senhas com hash forte do lado servidor (Argon2id/bcrypt/PBKDF2 apropriado à plataforma), nunca em planilha em texto puro. Token aleatório de alta entropia, curto prazo, revogável e vinculado a usuário/sessão. Considerar cookie `HttpOnly`, `Secure`, `SameSite` se a arquitetura permitir; evitar token persistente em `localStorage`/`sessionStorage` como credencial de longa duração.
- Autorização: cada endpoint deve autenticar e verificar no servidor se aquele usuário pode acessar aquele processo/documento/ação. Não confiar em `caseId`, papel, nome, email, token ou estado fornecido pelo cliente. Negar por padrão.
- Transporte e endpoints: não enviar senha/token em query string. POST com proteção contra abuso; respostas sem dados em excesso; CORS estrito quando tecnicamente compatível; proteção contra CSRF se usar cookies; limites por IP/conta, atraso progressivo e bloqueio temporário com monitoramento seguro.
- Armazenamento: avaliar se Sheets/Drive é adequado para documentos e dados processuais. Restringir compartilhamento, permissões e links; validar tipo/tamanho de arquivo, nome seguro, malware e retenção. Não tornar documentos públicos por URL previsível.
- Auditoria: registrar ator, ação, recurso interno, horário e resultado, sem CPF, senha, conteúdo de relato, texto de documentos ou tokens. Definir retenção, acesso e proteção dos logs.
- Recuperação e encerramento: revogação de sessão, troca/reset de senha com verificação independente, logout, expiração por inatividade e encerramento de sessões ativas.
- Resiliência: erros neutros no login, idempotência para pedidos/uploads quando aplicável, timeout, limites de payload, backup e teste de restauração.
- LGPD: mapear finalidade, base legal, minimização, acesso, retenção, atendimento de direitos, fornecedores e aviso de privacidade. Não declarar conformidade antes de validação humana/jurídica e operacional.

## 4. Painel do Cliente — requisitos funcionais
- Mostrar apenas o caso ou casos explicitamente vinculados ao cliente autenticado.
- Resumo legível: identificação mínima, fase/andamento e próxima ação revisados pelo advogado; diferenciar informação processual de previsão. Não prometer prazos ou resultados.
- Linha do tempo com origem e data, documentos com acesso controlado, pedidos ao escritório com protocolo e status. Evitar dados de terceiros que não sejam necessários.
- Upload com formatos e limites explícitos, confirmação antes do envio, progresso, erro recuperável e comprovante. Não usar dados reais em testes.
- Estados claros: carregamento, sem processo vinculado, sessão expirada, erro, pedido enviado, arquivo inválido. Acessibilidade por teclado/leitor de tela e comportamento responsivo.
- Modo `#demo`: somente dados sintéticos, identificador visual persistente, nenhuma chamada de rede, analytics, persistência de dados, upload ou envio de pedidos. Verificar que parâmetros de URL não conseguem transformar o modo real em demonstração enganosa.
- Criar roteiro para o Dr. Lucas cadastrar um usuário fictício pelo fluxo administrativo real, sem revelar senha/token no chat. Se não houver cadastro seguro implementado, documentar a dependência e não inventar uma conta funcional.

## 5. Central de Comandos do Dr. Lucas — escopo de produto
Planejar por módulos, sem inflar o escopo:

1. Visão diária: tarefas, prazos próximos e itens pendentes; alertas com origem e confirmação humana.
2. Busca de cliente/processo com permissões; mascarar identificadores na lista e exigir abertura autorizada para detalhes.
3. Ficha operacional: dados mínimos, fase, responsável, próxima providência, prazos e histórico de alterações.
4. Caixa de entrada de solicitações do portal e da Central do Caso, com estado e responsável.
5. Gestão de acessos: convite, ativação, revogação, papéis e segundo fator; ações administrativas sensíveis com confirmação e trilha de auditoria.
6. Configurações e integrações: status técnico sem expor chaves; teste de conexão sem dados pessoais.
7. Exportação/relatórios desativados por padrão; definir permissões, finalidade e auditoria antes de habilitar.

A Central não deve ser uma página HTML protegida só por senha no JavaScript, URL secreta, `noindex`, `.htaccess` ou token guardado no browser. `noindex` reduz indexação, mas não autentica.

## 6. Plano de implementação esperado do Claude Code
**Etapa A — inventário e análise (sem modificar produção):** ler `CLAUDE.md`; mapear portal, painel de gestão, `js/ls-api-config.js`, `apps-script/`, modelo de planilha documentado e chamadas usadas. Identificar funções/rotas duplicadas e dependências. Relatar riscos por severidade, com caminho/linhas, sem expor segredos nem dados pessoais.

**Etapa B — desenho:** entregar modelo de ameaças simples (contas comprometidas, enumeração de usuários, acesso cruzado a casos, vazamento via URL/logs, upload malicioso, abuso de endpoint), matriz papel × ação × recurso, modelo de dados mínimo, fluxo de login/MFA/sessão/recuperação e plano de implantação/rollback. Marcar decisões que dependem do Dr. Lucas.

**Etapa C — MVP local:** somente após a arquitetura e escopo serem aprovados, implementar em branch/cópia local, com interfaces separadas da lógica, validações no servidor, dados sintéticos e testes automatizados. Não alterar o Apps Script online nem enviar dados reais.

**Etapa D — validação:** testes unitários e de integração; testes negativos de autorização (cliente A não acessa caso/documento do cliente B; usuário sem papel não administra; token expirado/revogado falha); limite de tentativas; upload; sessão; modo demo sem rede; acessibilidade e tamanhos móveis. Revisar logs para confirmar ausência de conteúdo sensível. Fazer revisão de segurança antes de qualquer uso real.

**Etapa E — implantação assistida:** checklist de backup, variáveis secretas configuradas fora do código, implantação de teste, usuário fictício, smoke tests e plano de reversão. Só executar após autorização explícita do Dr. Lucas; a publicação não está autorizada por este briefing.

## 7. Critérios de aceite do MVP
- Cliente autenticado só vê recursos associados ao seu vínculo no servidor.
- Autenticação administrativa não envia senha em URL, não depende de segredo no HTML e tem segundo fator/decisão documentada.
- Sessões expiram e podem ser revogadas; erros de autenticação não confirmam se um email/CPF existe.
- Nenhum dado de cliente, senha, token, documento ou conteúdo processual aparece em URL, console, analytics ou logs.
- `#demo` funciona offline, mostra claramente dados fictícios e não chama nem altera serviço algum.
- Upload privado, limitado e validado; pedidos duplicados tratados de forma segura.
- Ações administrativas e acesso a recursos sensíveis auditáveis sem registrar conteúdo sensível.
- Testes automatizados cobrindo autorização positiva e negativa; documentação de implantação, configuração e rollback sem segredos.

## 8. Pontos de atenção imediatos na amostra de código enviada
A página `index.html` anexada confirma o link público para `portal/painel-cliente.html` e descreve uma área reservada. Isso não comprova que autenticação/backend estejam implantados ou funcionando. A implementação local do portal oferece demonstração explícita e usa uma API configurada externamente, mas o backend local `30_Portal_Cliente_V2.gs` não corresponde ao contrato da tela (`portal_login` e demais ações) e está incompleto. Portanto, não anunciar que o portal real funciona até o Dr. Lucas testar uma conta fictícia no ambiente correto.

Na amostra da home há também pontos fora do escopo principal do painel que devem ser anotados para a revisão de qualidade, sem alterar agora: classe utilitária `.justify-content-between` foi definida como `justify-content:between` (valor CSS inválido); Bootstrap e diversos scripts externos são carregados sem `defer`/`async`, apesar dos comentários de performance; o script de cookie/consentimento não está visível na amostra e é necessário verificar se `analytics.js`/GTM só carregam após consentimento; o vídeo autoplay aumenta custo móvel e deve respeitar `prefers-reduced-motion`/economia de dados; `Cal` é carregado externamente e a integração depende do global; conferir se `openingHoursSpecification` reproduz a disponibilidade confirmada e se não contradiz o texto visível; a área do cliente deve usar linguagem que não sugira funcionalidades indisponíveis. Não replicar estas observações para todo o site sem verificar as páginas e scripts efetivos.

## 9. Orientação final ao Claude Code
Comece respondendo com inventário, análise de riscos e arquitetura proposta; não codifique backend nem crie usuário ainda. O Dr. Lucas vai criar/testar uma conta fictícia e compartilhar apenas o resultado funcional (não a senha). Quando ele contar o ocorrido em Sete Lagoas, avaliar separadamente a página local/cidade. Não publicar nenhum lote ou mudança remota. Faça perguntas apenas para decisões realmente bloqueadoras, sobretudo: provedor de MFA, usuários internos adicionais, política de retenção, limite/formato de uploads e se a fonte oficial de dados será Apps Script/Sheets ou backend próprio.
