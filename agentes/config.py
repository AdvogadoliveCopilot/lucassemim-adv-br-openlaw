# -*- coding: utf-8 -*-
"""
CONFIGURAÇÃO CENTRAL DOS AGENTES — lucassemim.adv.br
=====================================================
Este arquivo NÃO guarda senha nem chave. Segredos ficam fora da pasta do site:
  - Senha do FTP e chave do OmniRoute -> rode UMA vez o  setup_segredos.bat
    (a senha é digitada por você e fica criptografada, só o seu usuário do Windows lê).
  - Alternativa: variáveis de ambiente  LS_FTP_PASS  e  OMNIROUTE_API_KEY.

Tudo aqui pode ser trocado por variável de ambiente (nome entre parênteses).
"""
import os
import subprocess

# ─── Pastas ──────────────────────────────────────────────────────────────────
PASTA_AGENTES = os.path.dirname(os.path.abspath(__file__))
SITE_DIR = os.environ.get("LS_SITE_DIR") or os.path.dirname(PASTA_AGENTES)   # a pasta do site, um nível acima
CIVEL_DIR = os.path.join(SITE_DIR, "civel")
RASCUNHOS_DIR = os.path.join(PASTA_AGENTES, "rascunhos")
BACKUPS_DIR = os.path.join(PASTA_AGENTES, "backups_publicacao")
PASTA_SEGREDOS = os.path.join(os.environ.get("APPDATA") or os.path.expanduser("~"), "LucasSemimAgentes")

# ─── OmniRoute (porta de entrada das IAs) ────────────────────────────────────
OMNI_BASE = os.environ.get("OMNIROUTE_BASE", "http://localhost:20128/v1").rstrip("/")   # (OMNIROUTE_BASE)

# Cada agente chama um COMBO do OmniRoute (cadeia de modelos com reserva automática).
# Os combos são criados/atualizados por configurar_omniroute_combos.py (ou pelo painel).
MODELOS = {
    "pesquisador": os.environ.get("LS_MODELO_PESQUISADOR", "auto/best-fast"),
    "redator":     os.environ.get("LS_MODELO_REDATOR",     "auto/legal-writer"),
    "seo":         os.environ.get("LS_MODELO_SEO",         "auto/smart"),
    "publicador":  os.environ.get("LS_MODELO_PUBLICADOR",  "auto/coding"),
    "monitor":     os.environ.get("LS_MODELO_MONITOR",     "auto/best-fast"),
}
# Se um combo falhar de vez (cota, offline), o cliente tenta estes, nesta ordem.
COMBOS_RESERVA = ["auto/smart", "auto/best-fast", "auto/free"]
MODELO_ATIVO = MODELOS["pesquisador"]   # compatibilidade com o monitor avançado (não faz chamada de rede)

# ─── Modo de publicação ──────────────────────────────────────────────────────
# "rascunho": os agentes só PREPARAM o artigo em agentes\rascunhos\ — nada vai para o site.
# A publicação só acontece quando você manda:  python pipeline.py --publicar <rascunho>
MODO = os.environ.get("LS_MODO", "rascunho")
PASTA_PUBLICACAO = os.environ.get("LS_PASTA_PUBLICACAO", "defesa-criminal")   # pasta do site que recebe os artigos

# ─── Modo cível ( LS_AREA=civel ) ────────────────────────────────────────────
# Mesma esteira (OmniRoute localhost:20128), mas publica em /civel/ com identidade própria.
# Rascunhos cíveis recebem prefixo "civel-" para não se misturar com os do criminal.
LS_AREA = os.environ.get("LS_AREA", "criminal")
AREA_CIVEL = LS_AREA == "civel"
PASTA_PUBLICACAO_CIVEL = "civel"
AREA_PREFIXO_RASCUNHO = "civel-" if AREA_CIVEL else ""

# ─── Dados do escritório — versão cível (fonte única) ─────────────────────────
SOBRE_O_SITE_CIVEL = """
Dr. Lucas Renan Semim é advogado (OAB/MG 222.539) com escritório em Sabará/MG e atuação em Belo Horizonte e região metropolitana.
O setor cível do escritório (lucassemim.adv.br/civel) atua em Advocacia Patrimonial e Direito Civil:
plano de saúde (negativa de cobertura, reajuste abusivo, cancelamento por inadimplência), juros e cobranças
bancárias abusivas (RMC no consignado, superendividamento), acidentes de trânsito e DPVAT, seguro e indenização,
erro médico, bets/apostas, golpe do Pix, usucapião e inventário, família e sucessões, contratos e negócios,
execução e cobrança, blindagem patrimonial.
Tom de voz: técnico, mas humano e claro para quem não é da área; foco em orientar quem precisa reaver dinheiro,
revisar contrato ou garantir cobertura de plano/seguro.
Regras de ética (Provimento 205/2021 da OAB): conteúdo informativo; NUNCA prometer ou sugerir resultado,
NUNCA citar preço, desconto ou gratuidade, NUNCA se comparar com outros advogados, NUNCA usar depoimento de cliente.
SEO local: quando fizer sentido, mencione naturalmente Sabará, Belo Horizonte e a região metropolitana.
"""

# ─── FTP (a senha NÃO está aqui) ─────────────────────────────────────────────
FTP_HOST = os.environ.get("LS_FTP_HOST", "ftp.lucassemim.adv.br")
FTP_PORT = int(os.environ.get("LS_FTP_PORT", "21"))
FTP_USER = os.environ.get("LS_FTP_USER", "lucassemim1")
FTP_ROOT = "/public_html"
FTP_CIVEL = "/public_html/civel"


def _ler_dpapi(nome_arquivo):
    """Lê um segredo guardado pelo setup_segredos.ps1 (criptografia do Windows, por usuário)."""
    caminho = os.path.join(PASTA_SEGREDOS, nome_arquivo)
    if os.name != "nt" or not os.path.exists(caminho):
        return None
    ps = (
        "[Console]::OutputEncoding = [Text.Encoding]::UTF8; "
        "$s = Get-Content -LiteralPath '%s' | ConvertTo-SecureString; "
        "$b = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($s); "
        "try { [Runtime.InteropServices.Marshal]::PtrToStringBSTR($b) } "
        "finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($b) }"
    ) % caminho.replace("'", "''")
    try:
        r = subprocess.run(
            ["powershell", "-NoProfile", "-NonInteractive", "-Command", ps],
            capture_output=True, text=True, encoding="utf-8", timeout=30,
        )
    except Exception:
        return None
    if r.returncode != 0:
        return None
    return r.stdout.rstrip("\r\n") or None


def obter_senha_ftp():
    """Variável LS_FTP_PASS ou arquivo criptografado do setup_segredos. Nunca imprima o retorno."""
    return os.environ.get("LS_FTP_PASS") or _ler_dpapi("ftp.dpapi")


def ftp_configurado():
    """True se existe uma senha guardada (sem decifrar)."""
    return bool(os.environ.get("LS_FTP_PASS")) or os.path.exists(os.path.join(PASTA_SEGREDOS, "ftp.dpapi"))


def obter_chave_omniroute():
    """Chave de API do OmniRoute (opcional enquanto o painel não exigir chave)."""
    return os.environ.get("OMNIROUTE_API_KEY") or _ler_dpapi("omni.dpapi") or ""


# ─── Dados do escritório (fonte única — iguais aos do site) ──────────────────
ADVOGADO = "Dr. Lucas Renan Semim"
OAB = "OAB/MG 222.539"
SITE_URL = "https://lucassemim.adv.br"
NOME_ESCRITORIO = "Lucas Semim Advogados"

TELEFONE = "(31) 98942-0094"          # número definitivo (troca de 08/10/2026)
TELEFONE_E164 = "+5531989420094"
WHATSAPP_NUM = "5531989420094"
WHATSAPP_URL = "https://wa.me/" + WHATSAPP_NUM
TELEFONE_TEL = "tel:" + TELEFONE_E164

# Números que NUNCA podem aparecer em página nova (o antigo e os de teste/placeholder)
TELEFONES_PROIBIDOS = ["98394-4973", "98394 4973", "983944973", "5531983944973", "55031983944973",
                       "99999-9999", "5531999999999", "90000-0000"]

ENDERECO = {
    "rua": "R. Cel. Abílio Pereira, 337",
    "cidade": "Sabará",
    "uf": "MG",
    "cep": "34575-020",
}

# ─── Agendamentos (usados por  pipeline.py --agendar ) ───────────────────────
HORA_PUBLICACAO = "03:00"   # o pipeline gera RASCUNHO nesse horário (não publica)
HORA_MONITOR = "06:00"

SOBRE_O_SITE = """
Dr. Lucas Renan Semim é advogado criminalista (OAB/MG 222.539), com escritório em Sabará/MG e atuação em Belo Horizonte e região metropolitana.
Foco: defesa criminal de urgência (prisão em flagrante, audiência de custódia, habeas corpus, Maria da Penha, tráfico de drogas, júri) e acompanhamento na delegacia e no tribunal.
Tom de voz: técnico, mas humano e claro para quem não é da área; sem sensacionalismo; foco em orientar quem está em situação de urgência (famílias, investigados).
Regras de ética (Provimento 205/2021 da OAB): conteúdo informativo; NUNCA prometer ou sugerir resultado, NUNCA citar preço, desconto ou gratuidade, NUNCA se comparar com outros advogados, NUNCA usar depoimento de cliente.
SEO local: quando fizer sentido, mencione naturalmente Sabará, Belo Horizonte e a região metropolitana (Contagem, Betim, Nova Lima, Santa Luzia etc.).
"""
