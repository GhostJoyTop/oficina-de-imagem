# -*- coding: utf-8 -*-
"""
COFRE — guarda o token do NovelAI.

O que este arquivo faz, em uma frase: grava o token do autor NUMA PASTA FORA DO
PROJETO DO LIVRO, e o entrega apenas na hora exata de falar com o NovelAI.

Tres proibicoes absolutas, e elas nao tem excecao:

  1. O token NUNCA volta para a tela do navegador. Nem inteiro, nem em pedaco,
     nem mascarado. O maximo que a oficina responde e "tem_token": true.
  2. O token NUNCA e escrito em log, nem no arquivo, nem na janela preta.
  3. O corpo do pedido que grava o token NUNCA e registrado em lugar nenhum.

Onde ele mora:
  C:\\Users\\<voce>\\AppData\\Roaming\\OficinaDeImagem\\token.txt

Isso e fora da pasta do livro, fora do git, e fora de qualquer coisa que
sincronize com a nuvem. Se a pasta AppData nao existir (nao e o caso do
Windows), o cofre cai para uma pasta escondida dentro da pasta pessoal.

Este arquivo nao depende de nenhuma biblioteca instalada. So do Python que ja
vem no computador.
"""

from __future__ import annotations

import os
import re
from pathlib import Path

NOME_DA_PASTA = "OficinaDeImagem"
NOME_DO_ARQUIVO = "token.txt"

# O token do NovelAI e uma sequencia longa, sem espaco e sem quebra de linha.
# Estes limites nao rejeitam um token real; rejeitam colagem errada (uma senha,
# um pedaco de texto do site, um campo vazio).
TAMANHO_MINIMO = 20
TAMANHO_MAXIMO = 4000
_SO_LIXO = re.compile(r"[\s\x00-\x1f]")


class ErroDoCofre(Exception):
    """Erro que ja vem escrito em portugues, pronto para aparecer na tela."""


# ---------------------------------------------------------------------------
# Onde fica o cofre
# ---------------------------------------------------------------------------

def pasta_do_cofre() -> Path:
    """A pasta onde o token mora. Sempre fora do projeto do livro."""
    appdata = os.environ.get("APPDATA")
    if appdata:
        return Path(appdata) / NOME_DA_PASTA
    # Fora do Windows, ou com o AppData faltando: pasta escondida no perfil.
    return Path.home() / (".{}".format(NOME_DA_PASTA.lower()))


def caminho_do_cofre() -> Path:
    return pasta_do_cofre() / NOME_DO_ARQUIVO


def _pasta_da_ferramenta() -> Path:
    """A pasta Ferramentas\\Oficina_de_Imagem. Serve so para a conferencia abaixo."""
    return Path(__file__).resolve().parent.parent


def _conferir_que_esta_fora_do_projeto(caminho: Path) -> None:
    """
    Trava de seguranca. Se por qualquer motivo o cofre cair dentro da pasta do
    livro (que e um repositorio git), o programa recusa gravar. Um token dentro
    do git e o pior acidente possivel desta ferramenta.
    """
    try:
        alvo = caminho.resolve()
    except OSError:
        alvo = caminho

    raiz_do_livro = _pasta_da_ferramenta().parent.parent
    for proibida in (_pasta_da_ferramenta(), raiz_do_livro):
        try:
            if alvo.is_relative_to(proibida):
                raise ErroDoCofre(
                    "Recusei gravar o token: o lugar escolhido fica dentro da "
                    "pasta do livro, que vai para o git. O token nunca pode "
                    "entrar ali."
                )
        except (OSError, ValueError):
            continue


# ---------------------------------------------------------------------------
# Guardar, ler, apagar
# ---------------------------------------------------------------------------

def guardar(token: str) -> None:
    """
    Grava o token. Nao devolve nada e nao imprime nada — de proposito.

    Levanta ErroDoCofre com a frase pronta em portugues quando a colagem esta
    obviamente errada, para o autor saber o que fazer sem ler codigo de erro.
    """
    if token is None:
        raise ErroDoCofre("O campo do token chegou vazio. Cole o token e tente de novo.")

    token = token.strip()

    if not token:
        raise ErroDoCofre("O campo do token chegou vazio. Cole o token e tente de novo.")

    if _SO_LIXO.search(token):
        raise ErroDoCofre(
            "Esse texto tem espaco ou quebra de linha no meio, e um token do "
            "NovelAI nao tem. Copie o token inteiro, de uma vez, e cole de novo."
        )

    if len(token) < TAMANHO_MINIMO:
        raise ErroDoCofre(
            "Esse texto e curto demais para ser um token do NovelAI. "
            "O token fica no menu da sua conta, em Account > API Token."
        )

    if len(token) > TAMANHO_MAXIMO:
        raise ErroDoCofre(
            "Esse texto e longo demais para ser um token. Parece que veio uma "
            "pagina inteira junto. Copie so o token."
        )

    caminho = caminho_do_cofre()
    _conferir_que_esta_fora_do_projeto(caminho)

    try:
        caminho.parent.mkdir(parents=True, exist_ok=True)
    except OSError as erro:
        raise ErroDoCofre(
            "Nao consegui criar a pasta do cofre em {}. "
            "O Windows recusou.".format(caminho.parent)
        ) from erro

    # os.open com 0o600 pede ao sistema que so o dono leia o arquivo. No Windows
    # o efeito e parcial, mas nao custa nada e ajuda em qualquer outro sistema.
    try:
        descritor = os.open(str(caminho), os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
        try:
            with os.fdopen(descritor, "w", encoding="utf-8") as arquivo:
                arquivo.write(token)
        finally:
            pass
    except OSError as erro:
        raise ErroDoCofre(
            "Nao consegui gravar o token no cofre. O Windows recusou o arquivo {}.".format(caminho)
        ) from erro

    # A variavel local morre aqui. Nenhuma copia fica em memoria global.
    del token


def ler() -> str | None:
    """
    Devolve o token, ou None se nao houver nenhum guardado.

    SO o modulo novelai.py chama isto, e so no instante de montar o cabecalho da
    chamada. O resultado nunca sobe para o navegador e nunca entra em log.
    """
    caminho = caminho_do_cofre()
    if not caminho.exists():
        return None
    try:
        conteudo = caminho.read_text(encoding="utf-8").strip()
    except OSError:
        return None
    return conteudo or None


def tem_token() -> bool:
    """Verdadeiro ou falso. E a UNICA coisa sobre o token que a tela pode saber."""
    return ler() is not None


def apagar() -> bool:
    """Apaga o token guardado. Devolve verdadeiro se havia um para apagar."""
    caminho = caminho_do_cofre()
    if not caminho.exists():
        return False
    try:
        # Sobrescreve antes de apagar, para o conteudo nao ficar no disco.
        tamanho = caminho.stat().st_size
        with open(caminho, "w", encoding="utf-8") as arquivo:
            arquivo.write("x" * max(tamanho, 1))
        caminho.unlink()
        return True
    except OSError as erro:
        raise ErroDoCofre(
            "Nao consegui apagar o arquivo do token em {}. "
            "Voce pode apaga-lo a mao por essa pasta.".format(caminho)
        ) from erro


def estado_para_a_tela() -> dict:
    """
    O unico retrato do cofre que pode chegar ao navegador.

    Repare que nao ha nenhum campo com o valor, nem com o inicio dele, nem com o
    tamanho. So o sim/nao e a pasta onde o arquivo fica — que e informacao util
    para o autor e nao serve para ninguem gastar Anlas dele.
    """
    return {
        "tem_token": tem_token(),
        "pasta_do_cofre": str(pasta_do_cofre()),
        "fora_do_projeto": True,
        "explicacao": (
            "O token fica guardado fora da pasta do livro e fora do git. "
            "A oficina nunca mostra o valor dele de volta na tela."
        ),
    }


# ---------------------------------------------------------------------------
# Autoteste (roda com: python cofre.py)
# ---------------------------------------------------------------------------

def _autoteste() -> int:
    falhas = []

    caminho = caminho_do_cofre()
    print("Cofre: {}".format(caminho))

    raiz_do_livro = _pasta_da_ferramenta().parent.parent
    if caminho.resolve().is_relative_to(raiz_do_livro):
        falhas.append("O cofre esta DENTRO da pasta do livro. Isso e proibido.")

    for ruim, motivo in (
        ("", "vazio"),
        ("   ", "so espaco"),
        ("curto", "curto demais"),
        ("com espaco no meio do token que deveria falhar aqui", "tem espaco"),
        ("a" * 5000, "longo demais"),
    ):
        try:
            guardar(ruim)
        except ErroDoCofre:
            pass
        else:
            falhas.append("Aceitou um token invalido ({}).".format(motivo))

    estado = estado_para_a_tela()
    for chave in estado:
        valor = str(estado[chave])
        if len(valor) > 20 and chave not in ("pasta_do_cofre", "explicacao"):
            falhas.append("O estado da tela tem campo suspeito: {}".format(chave))

    if falhas:
        print("FALHOU:")
        for falha in falhas:
            print("  - {}".format(falha))
        return 1

    print("Cofre OK: recusa colagem errada, e o estado da tela nao carrega o token.")
    return 0


if __name__ == "__main__":
    raise SystemExit(_autoteste())
