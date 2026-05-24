from collections import defaultdict
from csv import writer
from datetime import date, datetime, time
from decimal import Decimal, ROUND_HALF_UP
from io import StringIO

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.modules.insumos.repository import listar_insumos
from app.modules.pdv.models import StatusVenda, Venda
from app.modules.produtos.repository import listar_produtos
from app.modules.produtos.service import obter_motivo_indisponibilidade


CENTAVOS = Decimal("0.01")


def obter_dashboard(sessao: Session, inicio: date | None = None, fim: date | None = None) -> dict:
    vendas = _listar_vendas_filtradas(sessao, inicio, fim)
    vendas_concluidas = [venda for venda in vendas if venda.status == StatusVenda.CONCLUIDA]
    vendas_canceladas = [venda for venda in vendas if venda.status == StatusVenda.CANCELADA]

    faturamento = sum((Decimal(venda.total) for venda in vendas_concluidas), Decimal("0"))
    descontos = sum((Decimal(venda.desconto_total) for venda in vendas_concluidas), Decimal("0"))
    itens_vendidos = sum(
        item.quantidade
        for venda in vendas_concluidas
        for item in venda.itens
    )
    ticket_medio = Decimal("0")
    if vendas_concluidas:
        ticket_medio = faturamento / Decimal(len(vendas_concluidas))

    return {
        "inicio": inicio.isoformat() if inicio else None,
        "fim": fim.isoformat() if fim else None,
        "faturamento": _centavos(faturamento),
        "descontos": _centavos(descontos),
        "vendas_concluidas": len(vendas_concluidas),
        "vendas_canceladas": len(vendas_canceladas),
        "ticket_medio": _centavos(ticket_medio),
        "itens_vendidos": itens_vendidos,
        "produtos_bloqueados": _produtos_bloqueados(sessao),
        "alertas_estoque": _alertas_estoque(sessao),
        "produtos_mais_vendidos": _produtos_mais_vendidos(vendas_concluidas),
    }


def gerar_csv_dashboard(sessao: Session, inicio: date | None = None, fim: date | None = None) -> str:
    dashboard = obter_dashboard(sessao, inicio, fim)
    saida = StringIO()
    csv = writer(saida, lineterminator="\n")

    csv.writerow(["Filtro inicio", dashboard["inicio"] or ""])
    csv.writerow(["Filtro fim", dashboard["fim"] or ""])
    csv.writerow([])
    csv.writerow(["Indicador", "Valor"])
    csv.writerow(["Faturamento", dashboard["faturamento"]])
    csv.writerow(["Descontos", dashboard["descontos"]])
    csv.writerow(["Vendas concluidas", dashboard["vendas_concluidas"]])
    csv.writerow(["Vendas canceladas", dashboard["vendas_canceladas"]])
    csv.writerow(["Ticket medio", dashboard["ticket_medio"]])
    csv.writerow(["Itens vendidos", dashboard["itens_vendidos"]])

    csv.writerow([])
    csv.writerow(["Produtos mais vendidos"])
    csv.writerow(["Produto", "Quantidade", "Total"])
    for produto in dashboard["produtos_mais_vendidos"]:
        csv.writerow([produto["nome"], produto["quantidade"], produto["total"]])

    csv.writerow([])
    csv.writerow(["Produtos bloqueados"])
    csv.writerow(["Produto", "Motivo"])
    for produto in dashboard["produtos_bloqueados"]:
        csv.writerow([produto["nome"], produto["motivo"]])

    csv.writerow([])
    csv.writerow(["Alertas de estoque"])
    csv.writerow(["Insumo", "Estoque", "Minimo"])
    for alerta in dashboard["alertas_estoque"]:
        csv.writerow([alerta["nome"], alerta["quantidade_estoque"], alerta["estoque_minimo"]])

    return saida.getvalue()


def gerar_pdf_dashboard(sessao: Session, inicio: date | None = None, fim: date | None = None) -> bytes:
    dashboard = obter_dashboard(sessao, inicio, fim)
    linhas = [
        "FoodFlow Gestao - Dashboard",
        f"Periodo: {dashboard['inicio'] or 'inicio'} ate {dashboard['fim'] or 'hoje'}",
        "",
        f"Faturamento: R$ {dashboard['faturamento']}",
        f"Descontos: R$ {dashboard['descontos']}",
        f"Vendas concluidas: {dashboard['vendas_concluidas']}",
        f"Vendas canceladas: {dashboard['vendas_canceladas']}",
        f"Ticket medio: R$ {dashboard['ticket_medio']}",
        f"Itens vendidos: {dashboard['itens_vendidos']}",
        "",
        "Produtos bloqueados:",
    ]
    linhas.extend(
        f"- {produto['nome']}: {produto['motivo']}"
        for produto in dashboard["produtos_bloqueados"][:12]
    )
    linhas.append("")
    linhas.append("Alertas de estoque:")
    linhas.extend(
        f"- {alerta['nome']}: {alerta['quantidade_estoque']} / minimo {alerta['estoque_minimo']}"
        for alerta in dashboard["alertas_estoque"][:12]
    )
    return _pdf_simples(linhas)


def _listar_vendas_filtradas(sessao: Session, inicio: date | None, fim: date | None) -> list[Venda]:
    consulta = select(Venda).options(selectinload(Venda.itens)).order_by(Venda.criado_em.desc())
    if inicio is not None:
        consulta = consulta.where(Venda.criado_em >= datetime.combine(inicio, time.min))
    if fim is not None:
        consulta = consulta.where(Venda.criado_em <= datetime.combine(fim, time.max))
    return list(sessao.scalars(consulta))


def _produtos_bloqueados(sessao: Session) -> list[dict]:
    bloqueados = []
    for produto in listar_produtos(sessao):
        motivo = obter_motivo_indisponibilidade(sessao, produto)
        if motivo is not None:
            bloqueados.append({"id": produto.id, "nome": produto.nome, "motivo": motivo})
    return bloqueados


def _alertas_estoque(sessao: Session) -> list[dict]:
    alertas = []
    for insumo in listar_insumos(sessao):
        if Decimal(insumo.quantidade_estoque) <= Decimal(insumo.estoque_minimo):
            alertas.append(
                {
                    "insumo_id": insumo.id,
                    "nome": insumo.nome,
                    "quantidade_estoque": Decimal(insumo.quantidade_estoque),
                    "estoque_minimo": Decimal(insumo.estoque_minimo),
                }
            )
    return alertas


def _produtos_mais_vendidos(vendas: list[Venda]) -> list[dict]:
    agregados: dict[int, dict] = defaultdict(lambda: {"nome": "", "quantidade": 0, "total": Decimal("0")})
    for venda in vendas:
        for item in venda.itens:
            agregado = agregados[item.produto_id]
            agregado["nome"] = item.nome_produto
            agregado["quantidade"] += item.quantidade
            agregado["total"] += Decimal(item.preco_total)

    produtos = [
        {
            "produto_id": produto_id,
            "nome": dados["nome"],
            "quantidade": dados["quantidade"],
            "total": _centavos(dados["total"]),
        }
        for produto_id, dados in agregados.items()
    ]
    return sorted(produtos, key=lambda item: item["quantidade"], reverse=True)[:10]


def _centavos(valor: Decimal) -> Decimal:
    return Decimal(valor).quantize(CENTAVOS, rounding=ROUND_HALF_UP)


def _pdf_simples(linhas: list[str]) -> bytes:
    comandos = ["BT", "/F1 11 Tf", "50 780 Td"]
    for indice, linha in enumerate(linhas[:42]):
        if indice:
            comandos.append("0 -18 Td")
        comandos.append(f"({_escapar_pdf(linha)}) Tj")
    comandos.append("ET")
    conteudo = "\n".join(comandos).encode("latin-1", errors="replace")

    objetos = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        b"<< /Length " + str(len(conteudo)).encode() + b" >>\nstream\n" + conteudo + b"\nendstream",
    ]

    pdf = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for numero, objeto in enumerate(objetos, start=1):
        offsets.append(len(pdf))
        pdf.extend(f"{numero} 0 obj\n".encode())
        pdf.extend(objeto)
        pdf.extend(b"\nendobj\n")

    xref = len(pdf)
    pdf.extend(f"xref\n0 {len(objetos) + 1}\n".encode())
    pdf.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        pdf.extend(f"{offset:010d} 00000 n \n".encode())
    pdf.extend(
        f"trailer\n<< /Size {len(objetos) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF".encode()
    )
    return bytes(pdf)


def _escapar_pdf(texto: str) -> str:
    return texto.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
