# Portal do Cliente e Central de Comandos — estado da instalação (15/10/2026, 12h)

Tudo abaixo está no Google do Dr. Lucas Semim (conta doutorbrnews@gmail.com). Nada foi feito na conta de ninguém além da sua. O projeto antigo ("Advogado Live") e a planilha antiga ("Clientes - advogado live") não foram tocados.

## O que existe agora
| Item | Detalhe |
|---|---|
| Projeto do Apps Script | "Portal do Cliente – Lucas Semim", 3 arquivos: `Código.gs` (roteador), `32_Portal_Cliente_V3.gs` (sha256 `ee802175…713f0`) e `CentralComandos.html`. Os mesmos 3 estão em `apps-script/` desta pasta. |
| Planilha de dados | "Portal do Cliente – Banco de dados", 8 abas `PORTAL_*`. Está dentro da pasta do portal no Drive. Não edite à mão. |
| Pasta no Drive | "Portal do Cliente – Lucas Semim" com `01_Clientes`, `02_Modelos`, `03_Arquivo_morto`, `04_Backups` e o `LEIA-ME.txt`. |
| Rotina diária | Ligada (por volta das 3h): confere pastas e, aos domingos, copia a planilha para `04_Backups`. |
| Advogado autorizado | doutorbrnews@gmail.com (propriedade `PC3_ADMIN_EMAILS`). |
| Implantação "Portal API" (versão 1) | Executa como você, acesso para qualquer pessoa. Endereço do site do cliente: `https://script.google.com/macros/s/AKfycbwQjmF-cyZ4NwLLLI79rXEVCxlhydj25kGOUDQ-XJuZdozeegL-jSc6t0Nrak8a39XT/exec` (é público por natureza, não é senha). |
| Implantação "Central de Comandos" (versão 2) | Executa como quem acessa, acesso só para você. Endereço (coloque nos favoritos, não compartilhe): `https://script.google.com/macros/s/AKfycbyF2nd6wrKFbWw4v9tyTYDm0gadlzsM1B5zi7eLNQM5kAnfW9nnNimMR65TyXT8cJUT/exec` |
| Propriedade `PC3_CENTRAL_URL` | Guardada com o endereço da Central; aparece nos e-mails de aviso. |

## O que foi conferido no Google real
- `portal3Instalar`: criou planilha, pastas e rotina. `portal3Testes`: "Todos os testes do Portal V3 passaram e os dados temporários foram apagados". `portal3Diagnostico`: planilha ligada, segredo das senhas definido, pasta-raiz abre, quatro subpastas ok, rotina ligada, gatilho `portal3Manutencao`.
- Portal API sem login: abrir o endereço mostra só `{"ok":true,"servico":"portal-cliente"}`. (Logado com a sua conta Google, esse mesmo endereço abre a Central, porque só você a recebe; em janela anônima aparece o JSON.) Login falso volta "E-mail ou senha incorretos."; ação desconhecida volta "Pedido não reconhecido."; painel sem sessão volta "Sessão expirada. Entre novamente.".
- Central com a sua conta: Hoje, Casos, Pedidos, Acessos e Registro abriram sem erro (vazias, como esperado, sem cliente real ainda). O Registro mostra as linhas do autoteste e da conferência; são normais.
- Defeito achado e corrigido nesse teste: texto começando com `=` virava fórmula na planilha do Google (função `pc3Esc_`). Depois da correção os testes passaram. Detalhes em `CONFERENCIA-AGENTES-20261015.md`.

## O que ainda depende de você
1. **Acesso de teste:** na Central, aba Acessos, botão **Acesso de teste**. Ele cria o cliente fictício "Maria Teste" e mostra e-mail e senha uma única vez. Para trocar a senha, clique de novo. Para apagar todo o teste: `portal3RemoverTeste` no editor.
2. **Ligar o site ao script novo (etapa 6 do `INSTALAR_PROJETO_NOVO.md`):** a página do cliente precisa de uma linha com o endereço da Portal API acima (`apiUrlPortal`) e da página ajustada de `site-modo-novo/`. Antes de sobrescrever, guardar a cópia atual do servidor. Só depois do passo 1 e do seu OK.
3. **`.htaccess` (grupo 5 do pacote de 12/10):** é o último arquivo do pacote e o único que pode derrubar o site inteiro se tiver erro. Sobe só com conferência do site logo em seguida. Hoje a conferência pública está bloqueada pela verificação de segurança da Hostinger para o seu IP (só você resolve). Voltar atrás: `reverter\htaccess-anterior.txt`.
4. **Search Console:** adicionar `sitemap.xml` e `sitemap-urgencia.xml` e pedir indexação de `/`, `/advogado-criminalista/`, `/o-que-fazer-agora/` e do guia da revista pessoal.

## Opcional: trocar o segredo das senhas (só vale antes do primeiro cliente)
Ao conferir as propriedades do projeto, o valor de `PC3_PEPPER` apareceu no registro de trabalho do assistente. Não é urgente: o segredo sozinho não abre nada, e ainda não existe senha de cliente. Para trocar: Configurações do projeto → Propriedades do script → apague a linha `PC3_PEPPER` → salve → rode `portal3Instalar` (ele cria outro). Depois que existir cliente real, trocar invalida as senhas deles, então faça agora ou nunca.

## Atualizar o script no futuro
Cole o arquivo novo por cima no editor, salve e vá em **Implantar → Gerenciar implantações → lápis nas DUAS implantações → Versão: Nova versão → Implantar**. Os endereços não mudam.

## Segurança em poucas linhas
- A Portal API só aceita ações do portal; qualquer outra coisa recebe resposta genérica. Quem não é o advogado nunca recebe a Central.
- Senhas de cliente nunca ficam em claro (só o resultado do cálculo com o segredo do projeto). A senha provisória aparece uma vez para você.
- O sistema nunca apaga arquivo de cliente nem compartilha pasta com ninguém; a única coisa que ele manda para a lixeira é a pasta `AUTOTESTE` do próprio teste.
- Permissões que você concedeu a este projeto: Drive, Planilhas, Agenda, envio de e-mail e gatilhos. São amplas porque o Google só oferece o escopo inteiro de cada serviço. Para revogar: Conta do Google → Segurança → apps de terceiros com acesso à conta.
- Se algum dia desconfiar de vazamento do endereço da Central: o acesso é só da sua conta, então o endereço sozinho não abre nada. Se quiser, em **Implantar → Gerenciar implantações → Arquivar** a implantação e crie outra.
