# -*- coding: utf-8 -*-
"""
CLIENTE ÚNICO DO OMNIROUTE — usado por todos os agentes.

- Chama  POST {OMNI_BASE}/chat/completions  (formato OpenAI) com um COMBO do OmniRoute.
- Repete com espera crescente em 429/5xx/timeout (respeita Retry-After).
- Se o combo falhar de vez, tenta os combos de reserva (config.COMBOS_RESERVA).
- Manda a chave do OmniRoute só se existir (setup_segredos.bat / OMNIROUTE_API_KEY).
- Não escreve prompt nem resposta em log — só modelo, tempo e tamanho (privacidade).

IMPORTANTE: não use max_tokens pequeno. Os modelos Gemini "pensam" antes de responder e esse
raciocínio conta como token: com max_tokens=5 a resposta volta VAZIA mesmo com HTTP 200.
"""
import json
import os
import re
import socket
import time
import urllib.error
import urllib.parse
import urllib.request

import config
from util import agora_iso, anexar_jsonl, extrair_json

LOG_IA = os.path.join(config.PASTA_AGENTES, "log_ia.jsonl")


class OmniErro(Exception):
    """Erro genérico ao falar com o OmniRoute."""


class OmniOffline(OmniErro):
    """OmniRoute não está aberto (ou a porta está errada)."""


class OmniAuth(OmniErro):
    """401/403: o OmniRoute está exigindo chave de API."""


class OmniModelo(OmniErro):
    """Combo/modelo inexistente ou sem credencial ativa."""


class OmniLimite(OmniErro):
    """Cota esgotada (429) mesmo depois das tentativas."""


_RETENTAVEIS = {408, 409, 425, 429, 500, 502, 503, 504, 520, 522, 524}
_chave_cache = {"lida": False, "valor": ""}
ultimo_uso = {}          # {"pedido": ..., "usado": ..., "ms": ..., "tokens": ...} da última chamada que deu certo


def _chave():
    if not _chave_cache["lida"]:
        _chave_cache["valor"] = config.obter_chave_omniroute()
        _chave_cache["lida"] = True
    return _chave_cache["valor"]


def _abridor(url):
    host = urllib.parse.urlparse(url).hostname or ""
    if host in ("localhost", "127.0.0.1", "::1"):
        # ignora proxy do Windows para o endereço local
        return urllib.request.build_opener(urllib.request.ProxyHandler({}))
    return urllib.request.build_opener()


def _cabecalhos():
    h = {"Content-Type": "application/json", "Accept": "application/json"}
    chave = _chave()
    if chave:
        h["Authorization"] = "Bearer " + chave
    return h


def _texto_da_resposta(dados):
    """Extrai o texto de choices[0].message.content (string ou lista de partes)."""
    if not isinstance(dados, dict):
        raise OmniErro("resposta inesperada do OmniRoute")
    if dados.get("error") and not dados.get("choices"):
        erro = dados["error"]
        msg = erro.get("message") if isinstance(erro, dict) else str(erro)
        raise OmniErro("OmniRoute devolveu erro: %s" % str(msg)[:300])
    try:
        conteudo = dados["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError):
        raise OmniErro("resposta sem choices/message/content")
    if isinstance(conteudo, list):
        conteudo = "".join(p.get("text", "") for p in conteudo if isinstance(p, dict))
    if not isinstance(conteudo, str):
        conteudo = ""
    conteudo = re.sub(r"<think>.*?</think>", "", conteudo, flags=re.S | re.I).strip()
    return conteudo


def _uma_chamada(modelo, mensagens, temperatura, max_tokens, timeout):
    corpo = {"model": modelo, "messages": mensagens, "stream": False}
    if temperatura is not None:
        corpo["temperature"] = temperatura
    if max_tokens:
        corpo["max_tokens"] = max_tokens
    url = config.OMNI_BASE + "/chat/completions"
    req = urllib.request.Request(url, data=json.dumps(corpo).encode("utf-8"),
                                 headers=_cabecalhos(), method="POST")
    inicio = time.monotonic()
    with _abridor(url).open(req, timeout=timeout) as r:
        dados = json.loads(r.read().decode("utf-8", errors="replace"))
    texto = _texto_da_resposta(dados)
    ms = round((time.monotonic() - inicio) * 1000)
    uso = dados.get("usage") or {}
    return texto, {"pedido": modelo, "usado": dados.get("model", modelo), "ms": ms,
                   "tokens": uso.get("total_tokens")}


def _espera_http(e, tentativa):
    ra = e.headers.get("Retry-After") if getattr(e, "headers", None) else None
    try:
        if ra:
            return min(90.0, float(ra))
    except ValueError:
        pass
    return min(60.0, 5.0 * (2 ** tentativa))


def _corpo_erro(e):
    try:
        return e.read().decode("utf-8", errors="replace")[:300].replace("\n", " ")
    except Exception:
        return ""


def _chamar_com_tentativas(modelo, mensagens, temperatura, max_tokens, timeout, tentativas, avisar):
    ultimo = None
    for i in range(tentativas):
        try:
            return _uma_chamada(modelo, mensagens, temperatura, max_tokens, timeout)
        except urllib.error.HTTPError as e:
            corpo = _corpo_erro(e)
            if e.code in (401, 403):
                raise OmniAuth("OmniRoute recusou (HTTP %d). Se ele passou a exigir chave, rode "
                               "setup_segredos.bat e informe a chave. %s" % (e.code, corpo))
            if e.code == 404 or "No active credentials" in corpo or "not supported" in corpo.lower():
                raise OmniModelo("modelo/combo '%s' indisponível (HTTP %d): %s" % (modelo, e.code, corpo))
            if e.code == 400:
                raise OmniErro("pedido recusado (HTTP 400): %s" % corpo)
            if e.code in _RETENTAVEIS:
                ultimo = OmniLimite("HTTP %d em '%s': %s" % (e.code, modelo, corpo)) if e.code == 429 \
                    else OmniErro("HTTP %d em '%s': %s" % (e.code, modelo, corpo))
                if i < tentativas - 1:
                    espera = _espera_http(e, i)
                    avisar("    ⏳ %s — nova tentativa em %.0fs (%d/%d)" % (ultimo, espera, i + 2, tentativas))
                    time.sleep(espera)
                continue
            raise OmniErro("HTTP %d em '%s': %s" % (e.code, modelo, corpo))
        except (urllib.error.URLError, ConnectionError) as e:
            motivo = getattr(e, "reason", e)
            if isinstance(motivo, (ConnectionRefusedError, ConnectionError)) or "refused" in str(motivo).lower() \
                    or "10061" in str(motivo):
                raise OmniOffline("OmniRoute não respondeu em %s — abra o OmniRoute e tente de novo (%s)"
                                  % (config.OMNI_BASE, motivo))
            ultimo = OmniErro("falha de rede: %s" % motivo)
        except (socket.timeout, TimeoutError):
            ultimo = OmniErro("tempo esgotado (%ss) em '%s'" % (timeout, modelo))
        except OmniErro as e:
            ultimo = e          # resposta vazia/estranha: vale tentar de novo
        if i < tentativas - 1:
            espera = min(30.0, 4.0 * (i + 1))
            avisar("    ⏳ %s — nova tentativa em %.0fs (%d/%d)" % (ultimo, espera, i + 2, tentativas))
            time.sleep(espera)
    raise ultimo or OmniErro("falha sem detalhe")


def chat(prompt, papel="pesquisador", modelo=None, system=None, temperatura=None,
         max_tokens=None, timeout=300, tentativas=4, reserva=True, avisar=print):
    """
    Envia o prompt ao OmniRoute e devolve o texto da resposta.
    papel  -> escolhe o combo em config.MODELOS (ou use modelo="auto/smart" etc.)
    """
    pedido = modelo or config.MODELOS[papel]
    mensagens = []
    if system:
        mensagens.append({"role": "system", "content": system})
    mensagens.append({"role": "user", "content": prompt})

    fila = [pedido]
    if reserva:
        fila += [m for m in config.COMBOS_RESERVA if m != pedido]

    erros = []
    for n, m in enumerate(fila):
        try:
            texto, info = _chamar_com_tentativas(m, mensagens, temperatura, max_tokens, timeout,
                                                 tentativas if n == 0 else 2, avisar)
            if not texto:
                raise OmniErro("o modelo devolveu texto vazio")
            ultimo_uso.clear()
            ultimo_uso.update(info)
            anexar_jsonl(LOG_IA, {"ts": agora_iso(), "papel": papel, "pedido": pedido, "combo": m,
                                  "usado": info["usado"], "ms": info["ms"], "tokens": info["tokens"],
                                  "chars_prompt": len(prompt), "chars_resposta": len(texto)})
            if n > 0:
                avisar("    ↪ '%s' falhou; usei o combo de reserva '%s'." % (pedido, m))
            return texto
        except (OmniOffline, OmniAuth):
            raise                       # não adianta trocar de combo
        except OmniErro as e:
            erros.append("%s: %s" % (m, e))
            if n < len(fila) - 1:
                avisar("    ⚠️  %s" % e)
    anexar_jsonl(LOG_IA, {"ts": agora_iso(), "papel": papel, "pedido": pedido, "falhou": True,
                          "erros": [e[:200] for e in erros]})
    raise OmniErro("Nenhum combo respondeu. " + " | ".join(erros))


def chat_json(prompt, papel="pesquisador", **kw):
    """Como chat(), mas devolve objeto Python. Se o JSON vier quebrado, pede UMA correção."""
    texto = chat(prompt, papel=papel, **kw)
    try:
        return extrair_json(texto)
    except ValueError:
        reparo = ("O texto abaixo deveria ser um JSON válido, mas está com erro. Devolva SOMENTE o JSON "
                  "corrigido, sem comentários e sem cercas de código:\n\n" + texto[:12000])
        texto2 = chat(reparo, papel=papel, **kw)
        return extrair_json(texto2)


def estado():
    """(ok, quantidade_de_modelos, erro) — teste rápido de que o OmniRoute está de pé."""
    url = config.OMNI_BASE + "/models"
    try:
        req = urllib.request.Request(url, headers=_cabecalhos())
        with _abridor(url).open(req, timeout=8) as r:
            dados = json.loads(r.read().decode("utf-8", errors="replace"))
        return True, len(dados.get("data", [])), ""
    except urllib.error.HTTPError as e:
        return False, 0, "HTTP %d%s" % (e.code, " (precisa de chave: rode setup_segredos.bat)" if e.code in (401, 403) else "")
    except Exception as e:
        return False, 0, str(getattr(e, "reason", e))


def testar_combos(combos=None):
    """Faz uma pergunta curta a cada combo. Retorna lista de dicts {combo, ok, ms, usado, erro}."""
    combos = combos or sorted(set(config.MODELOS.values()) | set(config.COMBOS_RESERVA))
    resultado = []
    for c in combos:
        inicio = time.monotonic()
        try:
            # max_tokens generoso de propósito (veja a nota no topo do arquivo)
            texto, info = _chamar_com_tentativas(
                c, [{"role": "user", "content": "Responda apenas a palavra: ok"}],
                None, 600, 90, 1, lambda *_: None)
            ok = bool(texto)
            resultado.append({"combo": c, "ok": ok, "ms": info["ms"], "usado": info["usado"],
                              "erro": "" if ok else "resposta vazia"})
        except OmniErro as e:
            resultado.append({"combo": c, "ok": False, "ms": round((time.monotonic() - inicio) * 1000),
                              "usado": "", "erro": str(e)[:200]})
    return resultado
