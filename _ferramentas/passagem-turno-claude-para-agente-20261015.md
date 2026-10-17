# Passagem de turno — Claude (sessão em nuvem) para o próximo agente — 15/10/2026, 16h40

Resposta à `passagem-turno-para-claude-20261015.md`. Leia primeiro, nesta ordem:
1. `_ferramentas/portal-v3-projeto-novo-20261015/ESTADO-INSTALACAO-20261015.md` (o que está instalado, endereços, hashes, como voltar atrás);
2. `_ferramentas/portal-v3-projeto-novo-20261015/CONFERENCIA-AGENTES-20261015.md` (o que cada agente fez e as diferenças PC × servidor);
3. `_ferramentas/contrato-portal-v3-20261015.md` (contrato da API que a página do cliente usa).

## O que está no ar (conferido byte a byte, baixando de volta pelo FTP)
- `js/ls-api-config.js` (1.606 bytes), `portal/painel-cliente.html` (77.351 bytes, visual "aplicativo" ligado ao Portal V3) e `.htaccess` (17.525 bytes; só acrescenta o 301 da política de privacidade a partir de subpastas, enviado às 16h25).
- Google: projeto "Portal do Cliente – Lucas Semim" (Portal API + Central de Comandos), planilha e pasta novas. Instalado e testado no Google real.

## Regras que valem para qualquer agente
1. `portal/painel-cliente.html` e `js/ls-api-config.js` do PC são iguais aos do ar. **Não recoloque a página V2 de 14/10** (guardada em `_ferramentas/backups/arvore-pc-antes-sincronia-20261015/`): ela fala um contrato que o backend não tem. O trecho V2 de `contrato-api-paineis.md` não vale para o portal do cliente.
2. **Nada sobe ao servidor sem o OK do Dr. Lucas no chat.** Antes de enviar: baixar a cópia do servidor para `_ferramentas/backups/`, enviar, baixar de volta e comparar SHA-256.
3. **O PC não é uma cópia completa do servidor.** `img/` (199 arquivos no servidor × 37 no PC), `dados/` (35 PDFs × 2) e `portal/` (3 páginas antigas) têm coisas só no servidor. Nunca sincronize, espelhe nem "apague o que não existe no PC".
4. FileZilla com "Navegação sincronizada" ligada oferece "Criar diretório remoto que está faltando" quando o PC tem pasta que o servidor não tem (`templates/`, por exemplo). A opção marcada por padrão cria a pasta no servidor: escolha "Desativar a navegação sincronizada".
5. Nunca apagar arquivo de cliente, nunca compartilhar pasta de cliente. `00_Roteador_PROJETO_NOVO.gs` nunca entra no projeto antigo "Advogado Live".
6. A senha do "Acesso de teste" só o Dr. Lucas cria e usa. Nenhum agente digita, lê ou guarda.
7. Mudar o backend: colar no editor, salvar, Implantar, Gerenciar implantações, lápis nas **duas** implantações, Nova versão (os endereços não mudam). Mudou o formato? Atualize contrato e página no mesmo dia e rode `_testes/test/e2e_cliente_app.js`.
8. A Locaweb passou a mostrar "Verificação de segurança" (CAPTCHA) para o IP do Dr. Lucas (186.232.95.221). Só ele resolve. Não fique em laço tentando abrir o site: peça a ele para conferir pelo celular (4G).

## Pendente (decisão do Dr. Lucas)
- Conferir o site no celular com 4G depois do `.htaccess` (home, `/o-que-fazer-agora/`, uma página que não existe). Se der "Erro 500": reenviar `_ferramentas/backups/servidor-antes-portal-app-20261015/.htaccess` para `/public_html/`.
- Central, aba Acessos, "Acesso de teste", e testar o login em `lucassemim.adv.br/portal/painel-cliente.html`.
- Conteúdo só no PC (criado hoje às 11h34–11h35, não está no ar): guia ANPP, hub `o-que-fazer-agora/index.html` e `sitemap-urgencia.xml` (só juntos); guias cíveis novos + `civel/sitemap.xml` e `civel/robots.txt`. Esperam revisão e OK.
- `painel-gestao-admin.html` do PC (14/10) difere do servidor (12/09). Só sobe com OK.
- Search Console (`sitemap.xml`, `sitemap-urgencia.xml`), trocar `PC3_PEPPER` antes do primeiro cliente real, decidir sobre as 3 páginas antigas do `/portal/` no servidor (trazem WhatsApp diferente do atual).
