# -*- coding: utf-8 -*-
"""
ORCAMENTO — o teto de gasto da oficina.

Por que isto existe: os Anlas gastos por aqui sao os MESMOS Anlas do site. Nao
ha desconto nem cota extra (tutorial, secao 19.8). E um programa que gera em
lote queima credito muito mais rapido do que um dedo clicando.

Entao esta parte faz quatro coisas, e nada alem disso:

  1. Calcula quanto uma geracao VAI custar, antes de gastar.
  2. Guarda quanto ja foi gasto hoje e nesta sessao.
  3. Barra a geracao que passaria do teto, e diz em portugues por que barrou.
  4. Impede duas geracoes ao mesmo tempo — que tambem e limite real da conta.

De onde vem o preco: a tabela de custo em Anlas e do Construtor A, no arquivo
dados\\acervo_regras.js. Este modulo LE aquele arquivo. Um arquivo so, uma
verdade so. Se ele nao existir ainda, entra a tabela de reserva daqui, que so
tem numeros que o tutorial declara.

O que o tutorial declara, e portanto o que a oficina afirma:
  - Character Reference / Style Reference: +5 Anlas por imagem de referencia.
  - Vibe Transfer: 2 Anlas para codificar cada imagem, UMA VEZ so.
  - Opus: geracao sem Anlas em V4.5 ou inferior, uma por vez, tamanho normal,
    ate 28 passos.
  - Teste gratis: 30 imagens.

O que o tutorial NAO declara, e portanto a oficina NAO afirma: a formula do
custo base de uma geracao paga. Onde ela entraria, a oficina responde
"estimativa", com o aviso na cara. Chutar um numero e apresenta-lo como fato
seria pior do que dizer que nao se sabe.
"""

from __future__ import annotations

import json
import threading
from datetime import date, datetime
from pathlib import Path

PASTA_DA_FERRAMENTA = Path(__file__).resolve().parent.parent
ARQUIVO_DE_REGRAS = PASTA_DA_FERRAMENTA / "dados" / "acervo_regras.js"

TETO_SESSAO_PADRAO = 100
TETO_DIA_PADRAO = 300

# Tamanho "normal" do NovelAI, para a regra do Opus. Cerca de 1 megapixel.
PIXELS_DO_TAMANHO_NORMAL = 1024 * 1024
PASSOS_GRATIS_NO_OPUS = 28
MODELOS_GRATIS_NO_OPUS = (
    "v4_5_full", "v4_5_curated", "v4_full", "v4_curated", "anime_v3", "furry_v3",
)

# Tabela de reserva. Usada so quando dados\acervo_regras.js ainda nao existe.
TABELA_DE_RESERVA = {
    "anlas_por_referencia_precisa": 5,
    "anlas_por_vibe_codificado": 2,
    "anlas_base_estimado": 5,
    "imagens_do_teste_gratis": 30,
}


class ErroDeOrcamento(Exception):
    """Erro ja escrito em portugues, pronto para a tela."""


# ---------------------------------------------------------------------------
# Ler a tabela de precos do Construtor A
# ---------------------------------------------------------------------------

def _ler_arquivo_de_dados(caminho: Path) -> dict | None:
    """
    Le um arquivo do formato combinado na planta:

        window.OFICINA_REGRAS =
        { ...JSON... }
        ;

    A regra e: descarta a primeira linha, descarta a ultima, e o miolo e JSON.
    Sao as quatro linhas de que a planta fala. Se qualquer coisa der errado,
    devolve None e a oficina segue com a tabela de reserva — nunca quebra.
    """
    try:
        texto = caminho.read_text(encoding="utf-8")
    except OSError:
        return None

    linhas = texto.splitlines()
    if len(linhas) < 3:
        return None

    # Tira a primeira linha (a atribuicao) e a ultima linha nao vazia (o ";").
    while linhas and not linhas[-1].strip():
        linhas.pop()
    if not linhas:
        return None
    miolo = "\n".join(linhas[1:-1])

    try:
        dados = json.loads(miolo)
    except (ValueError, TypeError):
        return None
    return dados if isinstance(dados, dict) else None


def tabela_de_custo() -> dict:
    """A tabela de precos em vigor, com a marca de onde ela veio."""
    regras = _ler_arquivo_de_dados(ARQUIVO_DE_REGRAS)
    tabela = dict(TABELA_DE_RESERVA)
    origem = "tabela de reserva da ponte (o arquivo dados/acervo_regras.js ainda nao existe)"

    if regras:
        custos = regras.get("custos") or regras.get("anlas") or {}
        if isinstance(custos, dict):
            for chave in TABELA_DE_RESERVA:
                valor = custos.get(chave)
                if isinstance(valor, (int, float)):
                    tabela[chave] = valor
            origem = "dados/acervo_regras.js"

    tabela["_origem"] = origem
    return tabela


# ---------------------------------------------------------------------------
# A conta do gasto
# ---------------------------------------------------------------------------

class Orcamento:
    """
    Guarda o gasto e os tetos. Um objeto so, criado pelo servidor na partida.

    O arquivo fica em meu_trabalho\\orcamento.json, que e a unica pasta onde
    esta ferramenta pode gravar.
    """

    def __init__(self, pasta_de_trabalho: Path):
        self.caminho = Path(pasta_de_trabalho) / "orcamento.json"
        self._trava = threading.Lock()
        self._trava_de_geracao = threading.Lock()
        self.gerando = False
        self.gasto_na_sessao = 0
        self.teto_sessao = TETO_SESSAO_PADRAO
        self.teto_dia = TETO_DIA_PADRAO
        self.por_dia: dict[str, int] = {}
        self._carregar()

    # -- disco ------------------------------------------------------------

    def _carregar(self) -> None:
        if not self.caminho.exists():
            return
        try:
            dados = json.loads(self.caminho.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            return
        if not isinstance(dados, dict):
            return
        self.teto_sessao = int(dados.get("teto_sessao", TETO_SESSAO_PADRAO))
        self.teto_dia = int(dados.get("teto_dia", TETO_DIA_PADRAO))
        por_dia = dados.get("por_dia")
        if isinstance(por_dia, dict):
            self.por_dia = {
                str(k): int(v) for k, v in por_dia.items() if isinstance(v, (int, float))
            }

    def _gravar(self) -> None:
        dados = {
            "versao_formato": "1.0.0",
            "teto_sessao": self.teto_sessao,
            "teto_dia": self.teto_dia,
            "por_dia": self.por_dia,
            "atualizado_em": datetime.now().isoformat(timespec="seconds"),
            "_leia": (
                "Este arquivo e o controle de gasto da oficina. Apagar ele zera "
                "a contagem do dia, nao devolve Anlas nenhum."
            ),
        }
        try:
            self.caminho.parent.mkdir(parents=True, exist_ok=True)
            temporario = self.caminho.with_suffix(".json.novo")
            temporario.write_text(
                json.dumps(dados, ensure_ascii=False, indent=2), encoding="utf-8"
            )
            temporario.replace(self.caminho)
        except OSError:
            # Nao gravar o contador nunca pode derrubar a oficina.
            pass

    # -- consulta ---------------------------------------------------------

    def hoje(self) -> str:
        return date.today().isoformat()

    def gasto_hoje(self) -> int:
        return int(self.por_dia.get(self.hoje(), 0))

    def estado(self) -> dict:
        return {
            "gasto_hoje": self.gasto_hoje(),
            "teto_dia": self.teto_dia,
            "gasto_sessao": self.gasto_na_sessao,
            "teto_sessao": self.teto_sessao,
            "sobra_hoje": max(0, self.teto_dia - self.gasto_hoje()),
            "sobra_sessao": max(0, self.teto_sessao - self.gasto_na_sessao),
            "gerando": self.gerando,
            "arquivo": str(self.caminho),
        }

    def mudar_tetos(self, teto_sessao=None, teto_dia=None) -> dict:
        with self._trava:
            if teto_sessao is not None:
                valor = int(teto_sessao)
                if valor < 0 or valor > 100000:
                    raise ErroDeOrcamento(
                        "O teto por sessao precisa ser um numero entre 0 e 100000."
                    )
                self.teto_sessao = valor
            if teto_dia is not None:
                valor = int(teto_dia)
                if valor < 0 or valor > 100000:
                    raise ErroDeOrcamento(
                        "O teto por dia precisa ser um numero entre 0 e 100000."
                    )
                self.teto_dia = valor
            self._gravar()
        return self.estado()

    # -- a trava de verdade ------------------------------------------------

    def cabe(self, anlas: int) -> tuple[bool, str]:
        """Devolve (cabe?, frase em portugues explicando)."""
        anlas = int(anlas)
        if anlas <= 0:
            return True, ""

        if self.gasto_na_sessao + anlas > self.teto_sessao:
            return False, (
                "Esta geracao custaria {} Anlas e passaria do seu teto desta sessao "
                "({} de {} Anlas ja usados). Nada foi gasto. Voce pode aumentar o "
                "teto na tela do Cofre e Gasto, ou fechar e abrir a oficina para "
                "zerar a contagem da sessao.".format(
                    anlas, self.gasto_na_sessao, self.teto_sessao
                )
            )

        if self.gasto_hoje() + anlas > self.teto_dia:
            return False, (
                "Esta geracao custaria {} Anlas e passaria do seu teto de hoje "
                "({} de {} Anlas ja usados). Nada foi gasto. O contador de hoje "
                "zera sozinho amanha; se quiser continuar agora, aumente o teto na "
                "tela do Cofre e Gasto.".format(
                    anlas, self.gasto_hoje(), self.teto_dia
                )
            )

        return True, ""

    def registrar_gasto(self, anlas: int) -> None:
        """Chamado SO depois de uma geracao real que deu certo."""
        anlas = int(anlas)
        if anlas <= 0:
            return
        with self._trava:
            self.gasto_na_sessao += anlas
            dia = self.hoje()
            self.por_dia[dia] = int(self.por_dia.get(dia, 0)) + anlas
            self._gravar()

    def comecar_geracao(self) -> bool:
        """
        Pega a trava de "uma geracao por vez". Devolve falso se ja ha uma
        acontecendo. Nao espera em fila de proposito: a resposta imediata
        ("espere a que esta rodando") e melhor que a tela travada.
        """
        pego = self._trava_de_geracao.acquire(blocking=False)
        if pego:
            self.gerando = True
        return pego

    def terminar_geracao(self) -> None:
        if self.gerando:
            self.gerando = False
            try:
                self._trava_de_geracao.release()
            except RuntimeError:
                pass


# ---------------------------------------------------------------------------
# O calculo do custo
# ---------------------------------------------------------------------------

def _imagens(quantas: int) -> str:
    """'1 imagem' ou '3 imagens'. Existe so para a frase sair certa em portugues."""
    return "{} {}".format(quantas, "imagem" if quantas == 1 else "imagens")


def calcular_custo(pedido: dict) -> dict:
    """
    Diz quanto uma geracao custaria, item por item, sem gerar nada.

    Entra um dicionario com o que a tela sabe. Sai a conta aberta, em portugues,
    com a marca clara do que e FATO do tutorial e do que e ESTIMATIVA nossa.
    """
    tabela = tabela_de_custo()
    pedido = pedido or {}

    quantidade = max(1, int(pedido.get("quantidade", 1) or 1))
    modelo = str(pedido.get("modelo", "v4_5_full"))
    largura = int(pedido.get("largura", 832) or 832)
    altura = int(pedido.get("altura", 1216) or 1216)
    passos = int(pedido.get("passos", 28) or 28)
    assinatura = str(pedido.get("assinatura", "nenhuma") or "nenhuma").lower()
    acao = str(pedido.get("acao", "gerar") or "gerar")

    referencias = int(pedido.get("character_reference", 0) or 0) + int(
        pedido.get("style_reference", 0) or 0
    )
    vibes_novos = int(pedido.get("vibe_novos", 0) or 0)

    itens = []
    total = 0
    ha_estimativa = False

    # 1. A geracao em si.
    tamanho_normal = (largura * altura) <= PIXELS_DO_TAMANHO_NORMAL
    passos_ok = passos <= PASSOS_GRATIS_NO_OPUS
    modelo_ok = modelo in MODELOS_GRATIS_NO_OPUS

    if acao == "director":
        itens.append({
            "item": "ferramenta de direcao",
            "anlas": 0,
            "estimativa": True,
            "motivo": (
                "O tutorial nao declara o custo das ferramentas de direcao. "
                "A oficina conta zero e avisa que nao sabe."
            ),
        })
        ha_estimativa = True
    elif assinatura == "opus" and tamanho_normal and passos_ok and modelo_ok:
        itens.append({
            "item": "geracao base ({})".format(_imagens(quantidade)),
            "anlas": 0,
            "estimativa": False,
            "motivo": (
                "Assinatura Opus gera sem gastar Anlas em V4.5 ou inferior, "
                "tamanho normal e ate 28 passos. Uma por vez."
            ),
        })
    else:
        base = int(tabela["anlas_base_estimado"]) * quantidade
        total += base
        ha_estimativa = True
        porque = []
        if assinatura != "opus":
            porque.append("voce nao esta no plano Opus")
        else:
            if not tamanho_normal:
                porque.append("a imagem e maior que o tamanho normal")
            if not passos_ok:
                porque.append("sao mais de 28 passos")
            if not modelo_ok:
                porque.append("o modelo escolhido esta fora da regra do Opus")
        itens.append({
            "item": "geracao base ({})".format(_imagens(quantidade)),
            "anlas": base,
            "estimativa": True,
            "motivo": (
                "ESTIMATIVA. O tutorial nao publica a formula do custo base, "
                "entao a oficina usa {} Anlas por imagem so para nao deixar o "
                "teto de gasto cego. O numero certo aparece no site do NovelAI. "
                "Aqui a geracao seria paga porque {}.".format(
                    tabela["anlas_base_estimado"],
                    " e ".join(porque) if porque else "as condicoes do Opus nao se aplicam",
                )
            ),
        })

    # 2. Precise Reference (Character Reference e Style Reference).
    if referencias > 0:
        preco = int(tabela["anlas_por_referencia_precisa"])
        custo = preco * referencias * quantidade
        total += custo
        itens.append({
            "item": "referencia precisa ({} de referencia)".format(_imagens(referencias)),
            "anlas": custo,
            "estimativa": False,
            "motivo": (
                "FATO do tutorial: +{} Anlas por imagem de referencia, e soma "
                "quando ha mais de uma. So funciona no V4.5 e nao convive com "
                "Vibe Transfer na mesma geracao.".format(preco)
            ),
        })

    # 3. Vibe Transfer — so a codificacao, e so uma vez por imagem.
    if vibes_novos > 0:
        preco = int(tabela["anlas_por_vibe_codificado"])
        custo = preco * vibes_novos
        total += custo
        itens.append({
            "item": "codificar {} para o Vibe Transfer".format(_imagens(vibes_novos)),
            "anlas": custo,
            "estimativa": False,
            "motivo": (
                "FATO do tutorial: {} Anlas para codificar cada imagem, uma vez "
                "so. Depois de codificada, reusar nao custa de novo.".format(preco)
            ),
        })

    return {
        "anlas": total,
        "itens": itens,
        "tem_estimativa": ha_estimativa,
        "origem_da_tabela": tabela["_origem"],
        "aviso": (
            "Parte desta conta e estimativa: a documentacao do NovelAI nao publica "
            "a formula do custo base. O numero de verdade e o que o site mostrar. "
            "A oficina estima por baixo so para o teto de gasto funcionar."
            if ha_estimativa else
            "Esta conta usa so os numeros que o tutorial declara."
        ),
    }


# ---------------------------------------------------------------------------
# Autoteste (roda com: python orcamento.py)
# ---------------------------------------------------------------------------

def _autoteste() -> int:
    import tempfile

    falhas = []

    # Custo: Opus com tudo dentro da regra da casa e de graca.
    conta = calcular_custo({
        "assinatura": "opus", "modelo": "v4_5_full",
        "largura": 832, "altura": 1216, "passos": 28, "quantidade": 1,
    })
    if conta["anlas"] != 0:
        falhas.append("Opus dentro da regra deveria custar 0, deu {}.".format(conta["anlas"]))

    # Custo: duas referencias precisas somam 10 Anlas (5 + 5), como o tutorial diz.
    conta = calcular_custo({
        "assinatura": "opus", "modelo": "v4_5_full",
        "largura": 832, "altura": 1216, "passos": 28, "quantidade": 1,
        "character_reference": 2,
    })
    if conta["anlas"] != 10:
        falhas.append("Duas referencias deveriam custar 10, deu {}.".format(conta["anlas"]))

    # Custo: Vibe Transfer, 2 Anlas por imagem codificada.
    conta = calcular_custo({
        "assinatura": "opus", "modelo": "v4_5_full",
        "largura": 832, "altura": 1216, "passos": 28, "vibe_novos": 3,
    })
    if conta["anlas"] != 6:
        falhas.append("Tres vibes deveriam custar 6, deu {}.".format(conta["anlas"]))

    # Custo: passo de mais tira a gratuidade do Opus, e isso vira estimativa.
    conta = calcular_custo({
        "assinatura": "opus", "modelo": "v4_5_full",
        "largura": 832, "altura": 1216, "passos": 50,
    })
    if not conta["tem_estimativa"] or conta["anlas"] <= 0:
        falhas.append("Mais de 28 passos deveria virar cobranca estimada.")

    with tempfile.TemporaryDirectory() as pasta:
        orc = Orcamento(Path(pasta))
        orc.mudar_tetos(teto_sessao=10, teto_dia=20)

        cabe, _ = orc.cabe(5)
        if not cabe:
            falhas.append("5 Anlas deveriam caber no teto de 10.")

        cabe, frase = orc.cabe(50)
        if cabe:
            falhas.append("50 Anlas NAO deveriam caber no teto de 10.")
        if "Nada foi gasto" not in frase:
            falhas.append("A recusa deveria dizer que nada foi gasto.")

        orc.registrar_gasto(8)
        cabe, _ = orc.cabe(5)
        if cabe:
            falhas.append("Depois de gastar 8 de 10, mais 5 nao deveria caber.")

        # A geracao 101 do dia: teto de dia barra.
        orc2 = Orcamento(Path(pasta))
        orc2.mudar_tetos(teto_sessao=100000, teto_dia=100)
        orc2.registrar_gasto(100)
        cabe, frase = orc2.cabe(1)
        if cabe:
            falhas.append("Passado o teto do dia, a proxima geracao tem de ser barrada.")

        # Uma geracao por vez.
        orc3 = Orcamento(Path(pasta))
        if not orc3.comecar_geracao():
            falhas.append("A primeira geracao deveria pegar a trava.")
        if orc3.comecar_geracao():
            falhas.append("A segunda geracao simultanea NAO deveria passar.")
        orc3.terminar_geracao()
        if not orc3.comecar_geracao():
            falhas.append("Depois de terminar, a trava deveria liberar.")
        orc3.terminar_geracao()

        # O teto sobrevive a fechar e abrir a oficina.
        orc4 = Orcamento(Path(pasta))
        if orc4.teto_dia != 100:
            falhas.append("O teto gravado deveria voltar ao abrir de novo.")

    if falhas:
        print("FALHOU:")
        for falha in falhas:
            print("  - {}".format(falha))
        return 1

    print("Orcamento OK: conta certa, teto barra, uma geracao por vez, e o teto persiste.")
    return 0


if __name__ == "__main__":
    raise SystemExit(_autoteste())
