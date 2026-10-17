# -*- coding: utf-8 -*-
"""
AGENTE 1 — PESQUISADOR
Escolhe o tema do dia (primeiro da FILA editorial; se a fila acabar, a IA sugere novos) e monta o
briefing para o redator. Usa o combo auto/best-fast do OmniRoute.

ATENÇÃO: a IA daqui NÃO navega na internet. Por isso o briefing é sempre de tema "permanente"
(direitos, procedimentos, prazos, teses) e proíbe inventar notícia, data, súmula ou julgado.

Uso:
  python agente_pesquisador.py                      -> próximo tema da fila
  python agente_pesquisador.py --tema "texto livre" -> tema que VOCÊ escolher
"""
import argparse
import datetime
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import config
import memoria
import omni_client
from util import console_utf8, gravar_json, preencher, rodar_principal, slugify

SAIDA = os.path.join(config.PASTA_AGENTES, "output_pesquisador.json")

TEMAS_BASE = [
    "o que fazer quando alguém da família é preso em flagrante",
    "audiência de custódia em Belo Horizonte: direitos e como funciona",
    "habeas corpus: quando cabe e como pedir liminar",
    "tráfico de drogas: desclassificação para uso e tráfico privilegiado",
    "Lei Maria da Penha: medida protetiva, defesa do acusado e falsa acusação",
    "tornozeleira eletrônica: regras, violação e consequências",
    "tribunal do júri: fases do processo e teses de defesa",
    "busca e apreensão em casa: quando é nula",
    "prisão preventiva: requisitos e pedido de revogação",
    "execução penal: progressão de regime, remição e saída temporária",
    "embriaguez ao volante e bafômetro: crime ou infração",
    "golpe do Pix, conta bloqueada e acusação de estelionato",
    "crimes contra a honra por WhatsApp e redes sociais",
    "acompanhamento do advogado na delegacia: direito ao silêncio",
    "delegacia de Sabará e plantão policial: como agir",
]

REGRAS_ANTI_INVENCAO = """REGRAS OBRIGATÓRIAS (conteúdo jurídico publicado com o nome de um advogado):
- Você NÃO tem acesso à internet. NÃO invente notícias, "novidades", datas, números de processo, nomes de pessoas,
  endereços, telefones, súmulas, temas de repercussão geral ou julgados.
- Cite apenas dispositivos de lei e entendimentos que você tenha CERTEZA de que existem (ex.: art. 312 do CPP, art. 5º, LXVIII da CF).
  Quando tiver dúvida do número exato, escreva de forma geral ("o STJ tem entendimento consolidado no sentido de...") e marque [CONFERIR].
- NÃO prometa nem sugira resultado ("vamos soltar", "garantia", "certeza"). NÃO cite preço, desconto ou gratuidade.
- Não use "hoje", "ontem", "recentemente" nem "novidade" — o texto precisa continuar correto daqui a um ano."""

TEMAS_BASE_CIVEL = [
    "plano de saúde: negativa de cobertura e como contestar",
    "reajuste abusivo do plano de saúde por faixa etária",
    "plano de saúde cancelado por inadimplência: direitos do consumidor",
    "juros abusivos no empréstimo e revisão do contrato bancário",
    "RMC no cartão consignado que eu não contratei",
    "superendividamento: como renegociar dívidas com proteção da lei",
    "acidente de trânsito: indenização por danos morais e materiais",
    "DPVAT: seguro obrigatório e como receber",
    "seguradora negou o sinistro: o que fazer",
    "erro médico: responsabilidade e indenização",
    "bets e apostas online: reaver valores e vício em jogo",
    "golpe do Pix: bloqueio e recuperação do dinheiro",
    "usucapião: como regularizar o imóvel sem escritura",
    "inventário extrajudicial: como funciona no cartório",
    "ITCMD no inventário: quem paga e como calcular",
    "contrato verbal tem validade jurídica?",
    "holding familiar e blindagem patrimonial: vale a pena",
    "dívida do falecido: herança responde pela dívida",
    "cobrança de dívida: o que o credor pode e não pode fazer",
    "nome sujo por golpe ou fraude: danos morais e limpeza do nome",
]


def _tema_da_fila_ou_novo(forcado=None):
    """Retorna (semente_texto, pauta_id). Cuida da fila e, se vazia, pede novos temas à IA."""
    dados = memoria.carregar()
    if config.AREA_CIVEL:
        dados.setdefault("fila_civel", [])
        if forcado:
            return forcado.strip(), slugify("civel-" + forcado, 60)
        usados = memoria.palavras_cobertas(dados)
        for t in TEMAS_BASE_CIVEL:
            if t not in usados and slugify(t, 60) not in [slugify(x, 60) for x in dados["fila_civel"]]:
                dados["fila_civel"].append(t)
                memoria.salvar(dados)
                return t, slugify("civel-" + t, 60)
        item = dados["fila_civel"][0]
        return memoria.semente_para_texto(item), slugify("civel-" + item, 60)
    if forcado:
        return forcado.strip(), slugify(forcado, 60)
    item = memoria.proximo_da_fila(dados)
    if not item:
        print("📭 A fila de temas acabou — pedindo sugestões novas à IA...")
        novos = sugerir_temas(dados, quantidade=6)
        memoria.adicionar_a_fila(dados, novos)
        memoria.salvar(dados)
        item = memoria.proximo_da_fila(dados)
    if not item:
        # IA indisponível ou nada novo: cai para a lista base, pulando o que já foi coberto
        usados = memoria.palavras_cobertas(dados)
        for t in TEMAS_BASE:
            if t.lower() not in usados:
                return t, slugify(t, 60)
        return TEMAS_BASE[datetime.date.today().toordinal() % len(TEMAS_BASE)], None
    return memoria.semente_para_texto(item), item


def sugerir_temas(dados=None, quantidade=6):
    """Pede à IA temas novos (permanentes, com SEO local) que ainda não foram cobertos."""
    dados = dados or memoria.carregar()
    cobertas = ", ".join(memoria.palavras_cobertas(dados)[:60]) or "(nenhuma ainda)"
    papel = "advogado cível (Advocacia Patrimonial e Direito Civil)" if config.AREA_CIVEL else "advogado criminalista"
    situacao = "numa situação cível urgente (dívida, consumidor, família, acidente)" if config.AREA_CIVEL else "numa situação criminal urgente"
    prompt = preencher("""Você é editor de conteúdo jurídico para o site de um <<PAPEL>> em Sabará/MG.

CONTEXTO DO SITE:
<<SOBRE>>

TEMAS-BASE (pode combinar ou aprofundar):
<<BASE>>

PALAVRAS-CHAVE JÁ COBERTAS (não repetir): <<COBERTAS>>

TAREFA: sugira <<N>> temas NOVOS de artigos "permanentes" (que continuam úteis por anos), buscados por quem está
<<SITUACAO>> na região de Belo Horizonte/Sabará. Cada tema é uma frase curta em português,
SEM acento e SEM pontuação, no formato de slug com hifens (ex.: busca-apreensao-domicilio-nulidade).

Responda SOMENTE com um array JSON de strings.""",
                      sobre=(config.SOBRE_O_SITE_CIVEL if config.AREA_CIVEL else config.SOBRE_O_SITE),
                      base="\n".join("- " + t for t in (TEMAS_BASE_CIVEL if config.AREA_CIVEL else TEMAS_BASE)),
                      cobertas=cobertas, n=quantidade, situacao=situacao, papel=papel)
    try:
        itens = omni_client.chat_json(prompt, papel="pesquisador")
    except Exception as e:
        print("  ⚠️  Não consegui novas sugestões da IA: %s" % e)
        return []
    if isinstance(itens, dict):
        itens = next((v for v in itens.values() if isinstance(v, list)), [])
    return [slugify(str(i), 70) for i in itens if str(i).strip()][:quantidade]


def gerar_pauta(semente):
    """Transforma a semente em pauta: título, palavras-chave SEO, urgência."""
    papel = "advogado cível (Advocacia Patrimonial e Direito Civil)" if config.AREA_CIVEL else "advogado criminalista"
    prompt = preencher("""Você é um assistente de pauta jurídica para o site de um <<PAPEL>>.

CONTEXTO DO SITE:
<<SOBRE>>

TEMA ESCOLHIDO: <<SEMENTE>>

TAREFA: monte a pauta de UM artigo sobre esse tema:
1. título atraente e honesto (máx. 65 caracteres, sem clickbait, sem prometer resultado);
   [o tema deve ser adequado à área do escritório descrita no contexto acima]
2. 5 palavras-chave de busca (cauda longa, como as pessoas digitam o problema delas);
3. se é urgente (leitor em crise agora: artigo curto e direto) ou explicativo (guia completo);
4. a dúvida principal do leitor em uma frase.

Responda SOMENTE em JSON válido:
{"titulo": "...", "tema": "...", "palavras_chave": ["...", "...", "...", "...", "..."], "urgente": false, "duvida_principal": "..."}""",
                      sobre=(config.SOBRE_O_SITE_CIVEL if config.AREA_CIVEL else config.SOBRE_O_SITE), semente=semente, papel=papel)
    pauta = omni_client.chat_json(prompt, papel="pesquisador")
    if isinstance(pauta, list):
        pauta = pauta[0]
    pauta.setdefault("tema", semente)
    pauta.setdefault("palavras_chave", [semente])
    pauta["urgente"] = bool(pauta.get("urgente", False))
    pauta["titulo"] = str(pauta.get("titulo") or semente).strip()[:110]
    pauta["palavras_chave"] = [str(p).strip() for p in pauta["palavras_chave"] if str(p).strip()][:8]
    return pauta


def pesquisar_conteudo(pauta):
    """Briefing completo para o redator."""
    especialidade = "direito civil brasileiro e direito do consumidor" if config.AREA_CIVEL else "direito criminal brasileiro"
    prompt = preencher("""Você é pesquisador jurídico especializado em <<ESPECIALIDADE>>.

CONTEXTO DO SITE:
<<SOBRE>>

<<REGRAS>>

PAUTA:
Título: <<TITULO>>
Tema: <<TEMA>>
Palavras-chave: <<PALAVRAS>>
Dúvida principal do leitor: <<DUVIDA>>
Tipo: <<TIPO>>

TAREFA: escreva o briefing para o redator, em tópicos:
1. DÚVIDA DO LEITOR: o que ele está sentindo e precisa resolver agora.
2. PONTOS PRINCIPAIS: 5 a 7 informações jurídicas precisas e permanentes (base legal em linguagem simples).
3. SITUAÇÕES PRÁTICAS: 2 a 3 exemplos genéricos (sem nomes, sem processos reais).
4. ERROS COMUNS que prejudicam a defesa.
5. O QUE FAZER AGORA: passos objetivos para o leitor (o último é procurar um advogado de confiança).
6. CITAÇÕES: liste, uma por linha, cada lei/súmula/entendimento que pretende usar e marque [CONFERIR] se não tiver certeza.
7. GANCHO LOCAL: como conectar o tema, sem inventar fatos, a Sabará, Belo Horizonte e região (comarca, fórum, delegacia de plantão em termos gerais).""",
                      sobre=(config.SOBRE_O_SITE_CIVEL if config.AREA_CIVEL else config.SOBRE_O_SITE),
                      regras=REGRAS_ANTI_INVENCAO, titulo=pauta["titulo"], especialidade=especialidade,
                      tema=pauta.get("tema", ""), palavras=", ".join(pauta["palavras_chave"]),
                      duvida=pauta.get("duvida_principal", ""),
                      tipo="urgente (curto e direto)" if pauta["urgente"] else "explicativo (guia completo)")
    return omni_client.chat(prompt, papel="pesquisador")


def main():
    console_utf8()
    ap = argparse.ArgumentParser(description="Agente 1 — Pesquisador")
    ap.add_argument("--tema", help="tema escolhido por você (em vez do próximo da fila)")
    ap.add_argument("--area", choices=["criminal", "civel"], help="área do site (cível usa categorias/links próprios)")
    args = ap.parse_args()
    if args.area == "civel":
        os.environ["LS_AREA"] = "civel"

    ok, n, erro = omni_client.estado()
    if not ok:
        print("❌ OmniRoute não está respondendo (%s). Abra o OmniRoute e rode de novo." % erro)
        sys.exit(1)

    semente, pauta_id = _tema_da_fila_ou_novo(args.tema)
    print("🔍 Tema: %s" % semente)
    pauta = gerar_pauta(semente)
    print("  → %s (%s)" % (pauta["titulo"], "urgente" if pauta["urgente"] else "explicativo"))
    print("📋 Montando o briefing...")
    briefing = pesquisar_conteudo(pauta)
    print("  ✅ %d caracteres de briefing" % len(briefing))

    gravar_json(SAIDA, {"data": str(datetime.date.today()), "pauta_id": pauta_id,
                        "pautas": [pauta], "briefings": [briefing]})
    print("💾 Salvo em output_pesquisador.json")


if __name__ == "__main__":
    rodar_principal(main)
