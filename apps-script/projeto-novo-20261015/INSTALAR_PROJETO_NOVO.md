# Portal do Cliente V3 + Central de Comandos — instalar como PROJETO NOVO

Script novo, planilha nova e pasta nova no Drive, com as pastas dos clientes organizadas sozinhas. O projeto antigo ("Advogado Live" / "Api site") não é tocado: formulários do site, bets, cível e Central do Caso continuam exatamente como estão.

Tempo: cerca de 15 minutos. Nada do site público muda antes da etapa 6, e a etapa 6 só acontece com o seu OK.

## O que será criado
- Um script avulso, "Portal do Cliente – Lucas Semim".
- A planilha "Portal do Cliente – Banco de dados" (abas `PORTAL_*`), guardada dentro da pasta-raiz.
- No Drive, a pasta **Portal do Cliente – Lucas Semim** com `01_Clientes`, `02_Modelos`, `03_Arquivo_morto`, `04_Backups` e um `LEIA-ME.txt`.
- Uma rotina diária (por volta das 3h, horário de Brasília) que mantém as pastas em ordem.

Arquivos desta instalação (pasta `apps-script`): `00_Roteador_PROJETO_NOVO.gs`, `32_Portal_Cliente_V3.gs` e `CentralComandos.html`.

> O `00_Roteador_PROJETO_NOVO.gs` é SÓ para o projeto novo. Nunca cole no "Advogado Live": lá já existem `doGet` e `doPost`, uma função sobrescreveria a outra e os formulários do site parariam.

## 1. Criar o projeto (2 min)
1. Entre com a conta Google que vai ser a dona do Drive do escritório (a mesma com que você abrirá a Central). Abra script.google.com → **Novo projeto**. Nome: `Portal do Cliente – Lucas Semim`.
2. No arquivo que já existe (`Código.gs`), apague tudo e cole o conteúdo de `00_Roteador_PROJETO_NOVO.gs`.
3. **+** ao lado de "Arquivos" → **Script** → nome `32_Portal_Cliente_V3` → cole todo o `32_Portal_Cliente_V3.gs`.
4. **+** → **HTML** → nome exatamente `CentralComandos` (sem ".html") → apague o texto de exemplo → cole todo o `CentralComandos.html`.
5. Salve tudo (Ctrl+S).

## 2. Instalar e autorizar (3 min)
1. No seletor de funções (no alto), escolha `portal3Instalar` → **Executar**.
2. O Google pede autorização: **Revisar permissões** → sua conta → se aparecer "O Google não verificou este app", clique em **Avançado** → **Acessar Portal do Cliente – Lucas Semim (não seguro)** → **Permitir**. É normal em script próprio. As permissões são Planilhas, Drive, Agenda, envio de e-mail (os avisos de resposta ao cliente saem do seu Gmail), gatilhos (a rotina diária) e o seu endereço de e-mail (para o sistema saber quem é o advogado).
3. No **Registro de execução** deve aparecer algo assim:

```
Portal V3 instalado.
Planilha de dados: Portal do Cliente – Banco de dados (criada agora) → https://docs.google.com/…
Pasta-raiz no Drive: https://drive.google.com/drive/folders/…
Rotina diária de pastas: ligada (todo dia por volta das 3h)
Advogados autorizados: seu-email@gmail.com
Abas: PORTAL_USUARIOS, PORTAL_CASOS, …
```

4. Abra o Drive: deve existir a pasta **Portal do Cliente – Lucas Semim** com as quatro pastas numeradas, o `LEIA-ME.txt` e a planilha dentro.
5. Se o e-mail em "Advogados autorizados" não for o que você usa para entrar: engrenagem (**Configurações do projeto**) → **Propriedades do script** → edite `PC3_ADMIN_EMAILS` (vários e-mails, separados por vírgula).

Pode rodar `portal3Instalar` de novo quando quiser: só cria o que falta.

## 3. Testar no Google de verdade (5 min)
Nos meus testes o Google foi simulado. Este passo confere no ambiente real o que o simulador não prova (criar planilha, mover pastas, gatilho, permissões).

> **Já feito em 15/10/2026 no seu projeto.** O teste real achou um defeito que o simulador não via: no Google de verdade, um texto que começa com `=` vira fórmula mesmo em célula de texto (e um apóstrofo inicial é consumido). A correção (`pc3Esc_`) já está no `32_Portal_Cliente_V3.gs` desta pasta (sha256 `ee802175…713f0`). Depois dela, `portal3Testes` passou e `portal3Diagnostico` ficou todo verde. Se um dia você instalar em outra conta, use este arquivo.

1. `portal3Testes` → **Executar**. Deve terminar com: "Todos os testes do Portal V3 passaram e os dados temporários foram apagados. (A pasta de teste do Drive foi para a lixeira.)". Se aparecer "FALHAS DO PORTAL V3", copie a mensagem inteira e me mande.
2. `portal3Diagnostico` → **Executar**. Confira: "Pasta-raiz do portal (Drive): abre", "Rotina diária de pastas: ligada" e "Gatilhos do projeto: portal3Manutencao". Não mostra segredo nenhum.
3. `portal3CriarUsuarioTeste` → **Executar**. O e-mail e a senha de TESTE (dados fictícios) aparecem só no Registro de execução. Rode de novo para renovar a senha.
4. Opcional: `portal3Manutencao` → **Executar**. É a rotina diária rodando agora; o registro mostra uma linha "Rotina de pastas: …" com o que foi conferido.

## 4. Publicar as duas implantações (5 min)
**Implantar → Nova implantação → engrenagem → App da Web**, duas vezes:

**A) Portal API** (a que o site do cliente vai usar)
- Descrição: `Portal API`
- Executar como: **Eu**
- Quem pode acessar: **Qualquer pessoa**
- Implantar e copiar a URL que termina em `/exec`. Abra essa URL no navegador: deve aparecer só `{"ok":true,"servico":"portal-cliente"}` (sem nenhum dado). Atenção: logado com a sua conta Google, esse mesmo endereço abre a Central (só você a recebe); para ver o JSON, use uma janela anônima.
- Guarde essa URL; ela entra no site na etapa 6.

**B) Central de Comandos** (o seu painel)
- Descrição: `Central de Comandos`
- Executar como: **Usuário que está acessando o app da Web**
- Quem pode acessar: **Somente eu**
- Implantar → autorize → abra a URL `/exec` com a sua conta Google. Entra direto na Central, sem senha. Coloque nos favoritos e não compartilhe.
- Se aparecer "Acesso restrito", você entrou com outra conta Google: saia e entre com a do advogado.
- Opcional: em **Propriedades do script**, crie `PC3_CENTRAL_URL` com essa URL; ela aparece nos e-mails de aviso.

## 5. Primeiro uso na Central (3 min)
1. Tela **Hoje**: o painel "Pastas no Drive" mostra se a rotina está ligada, o resultado da última conferência e os botões **Organizar agora**, **Abrir a pasta do portal** e **Abrir a planilha de dados**.
2. **Casos → Novo caso**: dê um nome interno (ex.: "João – tráfico – Sabará"). Se deixar o campo da pasta em branco, o sistema cria a pasta do caso no Drive. Se o cliente já tem pasta, cole o link dela no campo "Pasta que este cliente já tem no Drive (opcional)".
3. Aba **Acessos → Criar acesso**: nome e e-mail do cliente. A senha provisória aparece uma única vez; copie e mande por um canal seguro. Se perder, use **Nova senha**.
4. Aba **Documentos**: veja a pasta do caso e, em **Liberar ao cliente**, escolha o que ele pode baixar. Nada sai sem você liberar; o cliente nunca vê `08_Administrativo_interno`.
5. **Ver como o cliente vê** (botão no topo do caso) mostra a tela dele antes de você avisá-lo. O resumo e o próximo passo só aparecem para o cliente depois que você marcar "Mostrar o resumo e o próximo passo ao cliente"; escreva sem juridiquês e sem prometer resultado nem prazo.

## 6. Ligar o site ao script novo (só depois dos testes e do seu OK)
A página do cliente precisa de um ajuste de uma linha para falar com a "Portal API". Ele já está pronto em `site-modo-novo/portal/painel-cliente.html` (também troca o carimbo `?v=` do `ls-api-config.js`, para o navegador buscar o arquivo novo). Testei num navegador contra o simulador: 17 de 17 passos, com a API nova e também só com a antiga (se a linha `apiUrlPortal` não existir, a página usa a antiga).

1. Me mande a URL `/exec` da "Portal API". Ela já é pública por natureza; não é senha. Eu devolvo o `js/ls-api-config.js` pronto. Se preferir fazer sozinho, acrescente uma linha ao objeto `window.LS_CONFIG`: `apiUrlPortal: "COLE_A_URL_AQUI",`.
2. Antes de sobrescrever, baixe do servidor (FileZilla) os arquivos atuais `portal/painel-cliente.html` e `js/ls-api-config.js` para uma pasta sua. É o seu "voltar atrás".
3. Suba os dois pelo FileZilla (`/public_html/portal/` e `/public_html/js/`) e entre na página com o usuário de teste.
4. Se algo der errado, reenvie os dois arquivos do backup.

## 7. Como as pastas se organizam sozinhas
| Quando | O que o sistema faz |
|---|---|
| Você cria um caso | Cria `Nome do caso (C-XXXXXX)` dentro de `01_Clientes`, com as 8 subpastas padrão (`01_Contratos_e_Procuracoes` a `08_Administrativo_interno`). Se você colou o link da pasta que o cliente já tem, liga a dela e não cria pasta padrão. |
| O cliente envia um arquivo pelo painel | Cai em `06_Enviados_pelo_cliente` do caso. |
| Você muda o caso para ENCERRADO | A pasta vai para `03_Arquivo_morto`. Reabrindo o caso, volta para `01_Clientes`. |
| Todo dia, por volta das 3h | Cria o que falta (pasta do caso, subpastas) e corrige o lugar das pastas. Para sozinha depois de 4 minutos e meio; o que sobrar fica para o dia seguinte ou para o botão **Organizar agora**. Aos domingos copia a planilha para `04_Backups` (uma cópia por dia, sem apagar as antigas). |
| Você clica **Organizar arquivos soltos** (aba Documentos) | Mostra o plano e só move depois do seu OK. Mexe só em arquivos soltos na raiz da pasta do caso, pela primeira palavra-chave do nome do arquivo: contrato ou procuração vão para `01`; petição, recurso, habeas corpus, resposta à acusação para `03`; decisão, sentença, intimação, mandado para `04`; laudo, exame, foto, vídeo, print para `05`; RG, CPF, comprovante para `02`; orientação para `07`; recibo, financeiro para `08`. Arquivo sem palavra reconhecida fica onde está. Até 200 por vez. |
| Pasta que você ligou à mão | O sistema nunca move nem cria subpastas nela por conta própria. **Adotar pasta** (aba Documentos) leva a pasta para `01_Clientes` (ou `03_Arquivo_morto`, se o caso estiver encerrado) e cria as subpastas padrão; não renomeia nem mexe nos arquivos dela. Para desfazer, mova a pasta de volta pelo Drive. |

O que o sistema nunca faz: apagar arquivo de cliente, compartilhar pasta com alguém, criar link público, mover arquivo que já está dentro de subpasta ou mexer em atalho do Drive. A única coisa que ele manda para a lixeira é a pasta `AUTOTESTE (C-…)` que o próprio `portal3Testes` cria.

Travas contra ligar a pasta errada: o sistema recusa como "pasta de cliente" a raiz do seu Drive, a pasta-raiz do portal, as pastas `01` a `04` e qualquer pasta que contenha a raiz do portal.

## 8. Cliente que já tem pasta no Drive
- Melhor caminho: **Novo caso** já com o link da pasta do cliente. O sistema liga a pasta dele e não cria uma pasta padrão vazia ao lado.
- Para um caso que já existe: aba **Documentos → Ligar pasta**, depois **Adotar pasta** se quiser que ela entre na organização.
- Se você criar o caso sem link e depois ligar outra pasta, a pasta padrão vazia criada no começo continua no Drive (o sistema não apaga nada). Apague à mão se quiser.
- **Adotar pasta** exige que a sua conta seja dona da pasta ou tenha permissão de edição. Sem isso, o sistema avisa e não muda nada.

## 9. Opcional: triagens do site na tela "Hoje"
Para a Central mostrar as triagens que o site grava na planilha antiga: abra a planilha antiga, copie o ID da URL (o trecho entre `/d/` e `/edit`) e, no projeto novo, crie em **Propriedades do script** a propriedade `PC3_TRIAGEM_PLANILHA_ID`. É só leitura da aba `TRIAGEM_SITE`; nada é gravado na planilha antiga. A triagem aparece para você como apoio interno, nunca para o cliente como orientação jurídica.

## 10. Atualizações futuras
Quando eu mandar um arquivo novo: cole por cima, salve, **Implantar → Gerenciar implantações → lápis nas DUAS implantações → Versão: Nova versão → Implantar**. As URLs não mudam.

## 11. Segurança e limites (sem enfeite)
- Senha do cliente: gerada pelo sistema (12 caracteres), mostrada uma vez, nunca guardada em claro (só sal e hash com um segredo nas Propriedades do script). Nada sensível vai na URL.
- Erro de e-mail ou de senha dá a mesma mensagem; 5 erros travam aquele e-mail por 15 minutos. O Apps Script não enxerga o IP, então a trava é por e-mail.
- Sessão de 6 horas. Trocar a senha, bloquear o acesso ou gerar "Nova senha" derruba as sessões abertas.
- Arquivos do Drive saem pelo corpo da resposta (sem link público), só se estiverem dentro da pasta ligada ao caso e liberados por você; até 8 MB; Google Docs, Planilhas e Slides saem como PDF.
- Envios do cliente: só PDF, JPG ou PNG conferidos pelo conteúdo, até 6 MB, 10 por dia.
- A Central só abre para as contas em `PC3_ADMIN_EMAILS`; ela depende da verificação em duas etapas da sua conta Google (vale ativá-la).
- Ainda não existe "trocar a minha senha" nem segunda etapa para o cliente (decisão sua). A planilha serve de banco para algumas dezenas de clientes; depois disso, migrar.
- A rotina diária e a cópia semanal só funcionam enquanto o gatilho existir e a conta tiver permissão sobre a pasta-raiz. O `portal3Diagnostico` mostra o estado.
- Este arquivo descreve o que o código faz; não é parecer de conformidade com a LGPD.

## 12. Desligar ou voltar atrás
- Rotina diária: função `portal3DesligarRotinaDiaria` (as pastas ficam como estão). Para religar: `portal3LigarRotinaDiaria`.
- Cópia imediata da planilha: `portal3BackupAgora`.
- Dados de teste: `portal3RemoverTeste` (só remove registros do tipo teste).
- Site: reenvie os dois arquivos que você guardou na etapa 6.
- Tudo: **Implantar → Gerenciar implantações → Arquivar** nas duas implantações. A pasta do portal no Drive não precisa ser apagada; se for, tire antes de dentro dela as pastas dos clientes que você quer manter.
- O projeto antigo nunca foi alterado, então não há nada a desfazer nele.
