#!/usr/bin/env python3
"""Mensagens agendadas no grupo "Caiçara Fit®🌴💛" pelo número do Gabriel (instância gabs).

Substitui o murph_lembretes.py: as mensagens agora moram no site (aba Automações do admin,
/app/data/lembretes.json). Timer na VPS a cada 10 min:
    pergunta ao site qual é a próxima  →  manda no grupo  →  avisa o site que mandou.
O site pula sozinho o que passou mais de 3 h da hora. Uma mensagem por vez.
Nunca usa a instância caicara (número do box, bloqueado pelo Meta em 14/10).

    python3 lembretes_grupo.py           # roda
    python3 lembretes_grupo.py --teste   # mostra o que sairia agora, sem mandar
    python3 lembretes_grupo.py --importar /root/murph-lembretes   # leva as do Murph para o site (uma vez)

Chave do site: PENDENCIAS_KEY em /root/pendencias/.env (mesma das pendências).
"""
import importlib.util
import json
import re
import sys
import urllib.request
from pathlib import Path

SITE = "https://caicara.store/api/lembretes"
EVOLUTION = "https://evolution.caicara.store"
INSTANCIA = "gabs"
GRUPO = "5513996299386-1568856668@g.us"  # Caiçara Fit®🌴💛


def pedir(url, cabecalho, corpo=None):
    dados = None if corpo is None else json.dumps(corpo).encode()
    req = urllib.request.Request(url, dados, {"Content-Type": "application/json", "User-Agent": "caicara-lembretes", **cabecalho})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def chave_site():
    return re.search(r"(?m)^PENDENCIAS_KEY=(\S+)", Path("/root/pendencias/.env").read_text()).group(1)


def chave_evolution():
    return re.search(r"AUTHENTICATION_API_KEY=(\S+)", Path("/root/evolution.yaml").read_text()).group(1)


def site(corpo):
    return pedir(SITE, {"x-chave": chave_site()}, corpo)


def importar(pasta):
    pasta = Path(pasta)
    spec = importlib.util.spec_from_file_location("murph", pasta / "murph_lembretes.py")
    murph = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(murph)
    estado = json.loads((pasta / "enviados.json").read_text()) if (pasta / "enviados.json").exists() else {}
    ja = {l["quando"] for l in pedir(SITE, {"x-chave": chave_site()})["lembretes"]}
    for quando, texto in murph.MENSAGENS:
        if quando in ja:
            print(f"{quando}: já está no site")
            continue
        data, hora = quando.split(" ")
        corpo = {"acao": "novo", "data": data, "hora": hora, "texto": texto, "assunto": "Murph"}
        feito = estado.get(quando)
        if feito and feito.startswith("pulada"):
            corpo["pulado"] = True
        elif feito:
            corpo["enviadoEm"] = feito
        site(corpo)
        print(f"{quando}: importada ({'enviada' if feito else 'agendada'})")


def main():
    if "--importar" in sys.argv:
        importar(sys.argv[sys.argv.index("--importar") + 1])
        return
    teste = "--teste" in sys.argv
    if teste:
        agora = pedir(SITE, {"x-chave": chave_site()})
        print("agora:", agora["agora"])
        for l in agora["lembretes"]:
            if not l.get("enviadoEm") and not l.get("pulado") and l["quando"] <= agora["agora"]:
                print(f"sairia: {l['quando']}\n{l['texto']}")
                return
        print("nada para mandar agora")
        return

    r = site({"acao": "proximo"})
    if r.get("pulados"):
        print(f"{r['pulados']} pulada(s): passaram de 3 h")
    l = r.get("enviar")
    if not l:
        return
    chave = chave_evolution()
    try:
        estado = pedir(f"{EVOLUTION}/instance/connectionState/{INSTANCIA}", {"apikey": chave}).get("instance", {}).get("state")
        if estado != "open":
            raise RuntimeError(f"instância {INSTANCIA} não conectada ({estado})")
        pedir(f"{EVOLUTION}/message/sendText/{INSTANCIA}", {"apikey": chave}, {"number": GRUPO, "text": l["texto"]})
    except Exception as e:  # noqa: BLE001 — registra no site e tenta no próximo ciclo
        site({"acao": "erro", "id": l["id"], "erro": str(e)[:200]})
        sys.exit(f"{l['quando']}: erro, tenta de novo no próximo ciclo: {e}")
    site({"acao": "enviado", "id": l["id"]})
    print(f"{l['quando']}: enviada")


if __name__ == "__main__":
    main()
