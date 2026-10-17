# Sobre este projeto (para agentes de IA e colaboradores)

## Identidade

- **Projeto:** lucassemim.adv.br — plataforma Open Law brasileira
- **Responsável:** Lucas Renan Semim, advogado (OAB/MG)
- **Missão:** democratizar acesso ao conhecimento jurídico através de conteúdo aberto, ferramentas de automação e orientação prática no momento de crise

## Princípios de trabalho

1. **Conteúdo em linguagem acessível** — o leitor está frequentemente em crise (prisão, flagrante, processo). Clareza antes de erudição.
2. **Precisão legal obrigatória** — toda referência a lei, súmula ou jurisprudência deve ser verificada. Erro aqui tem consequência real.
3. **Transparência sobre IA** — uso de IA é documentado em `transparencia-ia.html`, em alinhamento com a Resolução CNJ 332/2020.
4. **Código aberto de verdade** — scripts de automação, templates e ferramentas ficam neste repositório.

## Segurança (não negociável)

- **NUNCA commitar:** chaves de API (`sk-ant-*`), tokens, senhas, dados de clientes.
- Arquivos `*.local.*` são o padrão para segredos locais (gitignored).
- Rodar `git grep -lE "sk-ant-|AKIA|ghp_" HEAD` antes de todo push.
- O site lê a chave da API de `api/.claude-config.local.php` (local); o repo público tem apenas `api/.claude-config.php` com placeholder.

## Estrutura de trabalho (scripts em `_ferramentas/`)

- `adicionar_guia_hub.py` — adiciona novo guia à série "O Que Fazer Agora"
- `adicionar_url_sitemap.py` — registra URL nova no sitemap correto
- `aplicar_v2_artigos.py` — aplica template V2 em lote nos artigos
- Ver `LEIA-ME.txt` em cada subpasta de backup para contexto histórico

## Deploy

- Servidor: hospedagem Linux com PHP (cPanel)
- Publicação: upload via FTP/ gerenciador de arquivos da raiz deste diretório
- Cache: `sw.js` — ao alterar assets, incrementar a versão do cache no topo do arquivo

## Regras de commit

- Mensagens em português, no imperativo: "Adiciona guia X", "Corrige bug Y"
- Um tema por commit (conteúdo OU infraestrutura, não misturar)
- Backups em `_ferramentas/backups/` são históricos — não editar retroativamente
