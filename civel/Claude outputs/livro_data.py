# -*- coding: utf-8 -*-
"""
DADOS DO LIVRO — é aqui que cada página do site é "colocada no lugar".
Para encaixar uma página nova: adicione uma linha (slug, título, subtítulo) no capítulo certo e rode build_livro.py.
Os números de página (folios) são calculados sozinhos, na ordem em que aparecem aqui.
"""

WHATS = "5531983944973"
TEL = "+5531983944973"
TEL_FMT = "(31) 98394-4973"

# ---------------------------------------------------------------- PRÓLOGO
PROLOGO = {
    "id": "prologo", "rot": "Prólogo", "titulo": "Antes de começar",
    "intro": "Quem escreve, como o escritório trabalha e o que fazer se a situação não pode esperar.",
    "caps": [{
        "titulo": "Quem escreve e como trabalhamos", "desc": "",
        "items": [
            ("sobre-mim.html", "Dr. Lucas Renan Semim", "Trajetória, método e a razão deste livro", None),
            ("solucoes.html", "O que o escritório entrega", "As soluções de defesa criminal, da delegacia ao recurso", None),
            ("emergencia.html", "Plantão 24h: familiar preso", "O que fazer na primeira hora após um flagrante", None),
            ("faq.html", "Perguntas frequentes", "Honorários, prazos, atendimento digital e outras dúvidas", None),
        ]}],
}

# ---------------------------------------------------------------- PARTE I — URGÊNCIA
G = "o-que-fazer-agora/"
PARTE1 = {
    "id": "parte-1", "rot": "I", "titulo": "Quando a urgência bate",
    "intro": "Guias curtos para quem está no meio da crise: o que fazer agora, na ordem em que importa. Cada capítulo responde a uma situação real.",
    "caps": [
        {"titulo": "Prisão e delegacia", "desc": "Flagrante, mandado, depoimento, custódia e preventiva.",
         "items": [
            (G + "index.html", "Central de guias de emergência", "Todos os guias \"o que fazer agora\" em uma página", None),
            (G + "acabei-de-ser-preso-em-flagrante.html", "Preso em flagrante", "O que fazer agora — guia de urgência", None),
            (G + "meu-filho-foi-preso.html", "Meu filho foi preso", "Passo a passo para a família", None),
            (G + "fui-levado-para-delegacia-mas-nao-fui-preso.html", "Levado à delegacia, mas não preso", "O que fazer agora e como não piorar a situação", None),
            (G + "fui-intimado-para-depor-na-delegacia.html", "Intimado para depor na delegacia", "Direito ao silêncio e acompanhamento do advogado", None),
            (G + "tenho-mandado-de-prisao-o-que-fazer.html", "Mandado de prisão em aberto", "Apresentação espontânea e o que fazer antes da abordagem", None),
            (G + "mandado-de-busca-e-apreensao-o-que-fazer.html", "Mandado de busca e apreensão em casa", "Seus direitos durante e depois da diligência", None),
            (G + "tenho-audiencia-de-custodia-o-que-fazer.html", "Audiência de custódia marcada", "Guia de preparação urgente", None),
            (G + "estou-preso-preventivamente-o-que-fazer.html", "Prisão preventiva", "Como pedir Habeas Corpus, passo a passo", None),
            (G + "preso-nao-consigo-pagar-fianca-o-que-fazer.html", "Não consigo pagar a fiança", "Vou ficar preso? O que fazer", None),
         ]},
        {"titulo": "Acusações mais comuns", "desc": "Tráfico, furto e roubo, arma, embriaguez, trânsito e legítima defesa.",
         "items": [
            (G + "fui-preso-acusado-trafico-drogas.html", "Acusado de tráfico de drogas", "Guia 24h", None),
            (G + "fui-preso-por-furto-ou-roubo-o-que-fazer.html", "Preso por furto ou roubo", "Passo a passo", None),
            (G + "fui-preso-porte-ilegal-de-arma.html", "Preso com arma de fogo", "Tem fiança? Guia completo", None),
            (G + "preso-embriaguez-ao-volante-como-sair-da-delegacia.html", "Preso por embriaguez ao volante", "Como sair da delegacia hoje", None),
            (G + "acidente-de-transito-com-vitima-o-que-fazer.html", "Acidente de trânsito com vítima", "Lesão ou morte: o que fazer agora", None),
            (G + "agi-em-legitima-defesa-o-que-fazer.html", "Agi em legítima defesa e fui preso", "Passo a passo", None),
         ]},
        {"titulo": "Violência doméstica, honra e ameaça", "desc": "Lei Maria da Penha, medida protetiva e crimes contra a honra.",
         "items": [
            (G + "fui-preso-maria-da-penha.html", "Preso pela Lei Maria da Penha", "Guia completo", None),
            (G + "recebi-medida-protetiva-o-que-fazer.html", "Recebi uma medida protetiva", "O que fazer sem ter sido preso", None),
            (G + "fui-acusado-de-ameaca-o-que-fazer.html", "Acusado de ameaça", "Passo a passo", None),
            (G + "fui-acusado-de-perseguicao-stalking-o-que-fazer.html", "Acusado de perseguição (stalking)", "Passo a passo", None),
            (G + "fui-acusado-calunia-difamacao-injuria-o-que-fazer.html", "Acusado de calúnia, difamação ou injúria", "Passo a passo", None),
         ]},
        {"titulo": "Processo, cautelares e investigações atuais", "desc": "Instrução, júri, tornozeleira, bloqueio de conta, apostas e eleição.",
         "items": [
            (G + "tenho-audiencia-de-instrucao-o-que-fazer.html", "Audiência de instrução", "Intimado: passo a passo", None),
            (G + "fui-pronunciado-tribunal-do-juri-o-que-fazer.html", "Pronunciado para o Tribunal do Júri", "Passo a passo", None),
            (G + "tornozeleira-eletronica-descarregou-o-que-fazer.html", "Tornozeleira descarregou ou disparou", "Passo a passo", None),
            (G + "conta-bloqueada-processo-criminal-o-que-fazer.html", "Conta bloqueada em processo criminal", "Passo a passo", None),
            (G + "fui-notificado-investigado-apostas-ilegais-bets.html", "Investigado por apostas ilegais (bets)", "Notificado: o que fazer", None),
            (G + "fui-notificado-crime-eleitoral-redes-sociais-o-que-fazer.html", "Crime eleitoral nas redes sociais", "Postei sobre um candidato e fui notificado", None),
            (G + "fui-preso-boca-de-urna-o-que-fazer.html", "Boca de urna ou preso na eleição", "O que fazer agora", None),
         ]},
    ],
}

# ---------------------------------------------------------------- PARTE III — TERRITÓRIO
C = "advogado-criminalista/"
CIDADES = [
    ("sabara", "Sabará"), ("belohorizonte", "Belo Horizonte"), ("barreiro", "Barreiro (BH)"), ("contagem", "Contagem"),
    ("betim", "Betim"), ("neves", "Ribeirão das Neves"), ("santaluzia", "Santa Luzia"), ("vespasiano", "Vespasiano"),
    ("lagoasanta", "Lagoa Santa"), ("pedroleopoldo", "Pedro Leopoldo"), ("caete", "Caeté"), ("novalima", "Nova Lima"),
    ("ibirite", "Ibirité"), ("esmeraldas", "Esmeraldas"), ("igarape", "Igarapé"), ("brumadinho", "Brumadinho"),
    ("saojosedalapa", "São José da Lapa"),
]
PARTE3 = {
    "id": "parte-3", "rot": "III", "titulo": "No seu território",
    "intro": "A defesa criminal tem endereço: a delegacia, o fórum, o presídio. Aqui estão as comarcas onde o escritório atua e o dia a dia de quem atende dentro das unidades.",
    "caps": [
        {"titulo": "Comarcas atendidas", "desc": "Sabará, Belo Horizonte e Região Metropolitana — plantão 24h e atuação presencial.",
         "items": [(C + "index.html", "Plantão em flagrante: Sabará e BH", "Visão geral do atendimento nas delegacias", None)] +
                  [(C + s + ".html", "Advogado criminalista em " + n, "Flagrante, habeas corpus e processos criminais", None) for s, n in CIDADES]},
        {"titulo": "Dentro do presídio", "desc": "Atendimento humanizado a presos e familiares.",
         "items": [("presidios/presidio-sao-joaquim-de-bicas-1.html", "Presídio de São Joaquim de Bicas I", "Atendimento humanizado a presos e suas famílias", None)]},
    ],
}

# ---------------------------------------------------------------- PARTE IV — FERRAMENTAS E ACERVO
JUSBRASIL = [
    ("A Técnica Vence o Teatro: Absolvição no Júri", "https://lucasrenansemim.jusbrasil.com.br/"),
    ("A Verdade Negociada: Delação Premiada", "https://lucasrenansemim.jusbrasil.com.br/"),
    ("O Fantasma na Máquina: Prova Digital", "https://www.jusbrasil.com.br/artigos/o-fantasma-na-maquina-a-nulidade-da-prova-digital-e-a-quebra-da-cadeia-de-custodia/5033765930"),
    ("A Batalha Final: Dosimetria da Pena", "https://www.jusbrasil.com.br/artigos/a-batalha-final-guia-definitivo-da-dosimetria-da-pena-para-advogados-e-cidadaos/4710844218"),
    ("O Fato Atípico: Quando Não é Crime", "https://www.jusbrasil.com.br/artigos/o-fato-atipico-quando-uma-acao-parece-crime-mas-para-a-lei-nao-e/4377564559"),
    ("Erro de Tipo e de Proibição", "https://www.jusbrasil.com.br/artigos/nao-sabia-o-que-fazia-vs-nao-sabia-que-era-crime-entenda-o-erro-de-tipo-e-de-proibicao/4477288832"),
    ("O Prazo de Validade da Justiça: Prescrição", "https://www.jusbrasil.com.br/artigos/o-prazo-de-validade-da-justica-como-o-tempo-pode-extinguir-a-punibilidade-e-encerrar-um-processo/4463746371"),
    ("Arrependimento Posterior: Redução da Pena", "https://www.jusbrasil.com.br/artigos/arrependimento-posterior-a-reparacao-do-dano-que-pode-reduzir-a-pena-em-ate-dois-tercos/4411401599"),
    ("Furto, Roubo ou Apropriação Indébita?", "https://www.jusbrasil.com.br/artigos/furto-roubo-ou-apropriacao-indebita-o-guia-definitivo-para-entender-a-diferenca-que-pode-mudar-uma-sentenca/4653039542"),
    ("A Liberdade Após a Condenação: A LEP", "https://www.jusbrasil.com.br/artigos/a-liberdade-apos-a-condenacao-o-guia-definitivo-da-execucao-penal-lep/4726764499"),
]
PARTE4 = {
    "id": "parte-4", "rot": "IV", "titulo": "Ferramentas e acervo",
    "intro": "Onde o leitor deixa de ler e passa a agir: diagnóstico do caso, cálculo de prazos e o acervo de artigos publicados fora do site.",
    "caps": [
        {"titulo": "Ferramentas", "desc": "Gratuitas e sigilosas.",
         "items": [
            ("diagnostico.html", "Central do Caso Criminal", "Diagnóstico gratuito: plantão, montagem do processo e busca de documentos", None),
            ("legal-tech/calculadora-prescricao.html", "Calculadora de Prescrição Penal", "Descubra se o prazo do Estado para punir já passou", None),
            (None, "Calculadora de Progressão de Regime", "Em preparação — Pacote Anticrime (Lei 13.964/19)", None),
         ]},
        {"titulo": "Acervo no Jusbrasil", "desc": "Artigos do Dr. Lucas Semim na maior plataforma jurídica do país.",
         "items": [("https://lucasrenansemim.jusbrasil.com.br/", "Perfil oficial no Jusbrasil", "77 publicações de teses criminais práticas", "ext")] +
                  [(u, t, "Artigo no Jusbrasil", "ext") for t, u in JUSBRASIL]},
    ],
}
