# Pull Request — checklist

Antes de solicitar merge, confirme:

## Conteúdo jurídico (se aplicável)
- [ ] Toda lei, súmula e jurisprudência foram verificadas na fonte oficial
- [ ] Linguagem acessível (o leitor pode estar em crise — clareza antes de erudição)
- [ ] URL registrada no sitemap correspondente (`adicionar_url_sitemap.py`)
- [ ] Template V2 aplicado se for artigo (`aplicar_v2_artigos.py`)

## Técnico
- [ ] Nenhum segredo commitado (`git grep -lE "sk-ant-|AKIA|ghp_" HEAD` retorna vazio)
- [ ] `sw.js` teve a versão do cache incrementada se assets mudaram
- [ ] Testado localmente (página carrega, sem erro no console)
- [ ] Um tema por PR — não misturar conteúdo com infraestrutura

## Alinhamento
- [ ] Relacionado a uma fase do `ROADMAP.md` (qual: ______)
- [ ] Serve a missão: ajudar pessoas presas injustamente, resgatar demandas cíveis, ou aproximar a pessoa do advogado no momento de necessidade
