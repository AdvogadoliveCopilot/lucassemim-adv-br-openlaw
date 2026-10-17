# Configuração do repositório (para preencher na aba Settings do GitHub)

Como o GitHub não permite versionar algumas configurações via git, este arquivo
documenta o que configurar manualmente — uma vez só.

## 1. About (canto superior direito do repo → engrenagem)

- **Description:** Plataforma Open Law — democratizando o acesso à justiça no Brasil. Projeto Anjo, guias de emergência jurídica e software de triagem.
- **Website:** https://lucassemim.adv.br
- **Topics:** `open-law` `legaltech` `acesso-a-justica` `direito-brasileiro` `advocacia-criminal` `pwa` `html` `php` `python`

## 2. General → Features

- ✅ Issues (ativado)
- ✅ Discussions (ativar — espaço para famílias de presos trocarem experiências)
- ❌ Wiki (desativar — usamos README + ROADMAP + CONTRIBUTING)

## 3. Labels recomendadas (Issues → Labels → New label)

| Nome | Cor | Descrição |
|---|---|---|
| `fase-1-projeto-anjo` | `#1d76db` | Projeto Anjo — presos injustamente |
| `fase-2-civel` | `#0e8a16` | Cível sem êxito — resgate de demandas |
| `fase-3-software-juridico` | `#d93f0b` | Triagem conversacional + roteamento |
| `fase-4-escala` | `#5d5d5d` | Comunidade, API pública, parcerias |
| `conteudo-juridico` | `#b60205` | Guias, análises, jurisprudência |
| `requere-revisao-advogado` | `#f9d0c4` | Só merge após revisão do Lucas |
| `bom-para-comecar` | `#7057ff` | Tarefa boa para novo colaborador |
| `agente` | `#fbca04` | Tarefa delegável a agente de IA |

## 4. Branch protection (Settings → Branches → Add rule)

- Branch: `main`
- ✅ Require a pull request before merging — **só depois do primeiro colaborador externo**; enquanto trabalha sozinho, deixe desativado para agilidade
- ✅ Do not allow force pushes
- ✅ Do not allow deletions

## 5. Secrets (Settings → Secrets and variables → Actions)

- Nunca colocar a chave da API aqui se os workflows não usam GitHub Actions
- Se um dia usar Actions para deploy, criar secret `ANTHROPIC_API_KEY` e `FTP_CREDENTIALS`

## 6. Social preview (Settings → General → Social preview)

- Upload da imagem de capa do site (logo + "Open Law — Acesso à Justiça")
- Aparece quando o link é compartilhado no WhatsApp — importante para divulgação
