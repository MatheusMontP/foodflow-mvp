from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.modules.adicionais.models import Adicional, AdicionalCategoria, ItemFichaTecnicaAdicional
from app.modules.adicionais.repository import (
    buscar_adicional_por_id,
    buscar_adicional_por_nome,
    listar_adicionais,
    salvar_adicional,
    substituir_categorias,
    substituir_itens_ficha,
)
from app.modules.adicionais.schemas import (
    AdicionalCriar,
    AdicionalStatusAtualizar,
    CategoriasAdicionalAtualizar,
    FichaTecnicaAdicionalAtualizar,
    SimulacaoItemRequest,
)
from app.modules.categorias.repository import listar_categorias
from app.modules.insumos.models import Insumo
from app.modules.insumos.repository import buscar_insumo_por_id
from app.modules.produtos.models import ItemFichaTecnica, Produto
from app.modules.produtos.repository import buscar_produto_por_id
from app.modules.produtos.service import obter_motivo_indisponibilidade
from app.modules.unidades.repository import buscar_conversao, buscar_unidade_por_id


CENTAVOS = Decimal("0.01")


def criar_adicional(sessao: Session, dados: AdicionalCriar) -> Adicional:
    nome = dados.nome.strip()
    if buscar_adicional_por_nome(sessao, nome) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ja existe adicional com este nome.",
        )

    _exigir_categorias_ativas(sessao, dados.categoria_ids)
    itens = _montar_itens_ficha_tecnica(sessao, dados.itens_ficha_tecnica)

    adicional = Adicional(
        nome=nome,
        descricao=dados.descricao,
        preco_extra=dados.preco_extra,
        ativo=dados.ativo,
        categorias_permitidas=[
            AdicionalCategoria(categoria_id=categoria_id)
            for categoria_id in _ids_unicos(dados.categoria_ids)
        ],
        itens_ficha_tecnica=itens,
    )
    return salvar_adicional(sessao, adicional)


def obter_adicionais(sessao: Session) -> list[Adicional]:
    return listar_adicionais(sessao)


def atualizar_status_adicional(
    sessao: Session,
    adicional_id: int,
    dados: AdicionalStatusAtualizar,
) -> Adicional:
    adicional = _exigir_adicional(sessao, adicional_id)
    if dados.ativo and not ficha_tecnica_adicional_valida(sessao, adicional):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Adicional so pode ficar ativo com ficha tecnica valida.",
        )

    adicional.ativo = dados.ativo
    return salvar_adicional(sessao, adicional)


def atualizar_categorias_adicional(
    sessao: Session,
    adicional_id: int,
    dados: CategoriasAdicionalAtualizar,
) -> Adicional:
    adicional = _exigir_adicional(sessao, adicional_id)
    _exigir_categorias_ativas(sessao, dados.categoria_ids)
    substituir_categorias(sessao, adicional, _ids_unicos(dados.categoria_ids))
    return salvar_adicional(sessao, adicional)


def atualizar_ficha_tecnica_adicional(
    sessao: Session,
    adicional_id: int,
    dados: FichaTecnicaAdicionalAtualizar,
) -> Adicional:
    adicional = _exigir_adicional(sessao, adicional_id)
    itens = _montar_itens_ficha_tecnica(sessao, dados.itens)
    substituir_itens_ficha(sessao, adicional, itens)
    return salvar_adicional(sessao, adicional)


def obter_variacoes_produto(sessao: Session, produto_id: int) -> dict:
    produto = _exigir_produto(sessao, produto_id)
    adicionais = [
        adicional
        for adicional in listar_adicionais(sessao)
        if adicional.ativo
        and _adicional_permitido_na_categoria(adicional, produto.categoria_id)
        and ficha_tecnica_adicional_valida(sessao, adicional)
    ]
    return {
        "produto_id": produto.id,
        "adicionais": [adicional_para_response(sessao, adicional) for adicional in adicionais],
        "remocoes_permitidas": [
            {
                "item_ficha_tecnica_id": item.id,
                "insumo_id": item.insumo_id,
                "nome_insumo": item.insumo.nome,
                "quantidade": item.quantidade,
                "unidade_medida_id": item.unidade_medida_id,
            }
            for item in produto.itens_ficha_tecnica
            if item.removivel
        ],
        "observacao_permitida": True,
    }


def simular_item_produto(sessao: Session, produto_id: int, dados: SimulacaoItemRequest) -> dict:
    produto = _exigir_produto(sessao, produto_id)
    motivo_produto = obter_motivo_indisponibilidade(sessao, produto)
    if motivo_produto is not None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=motivo_produto,
        )

    adicionais = [_exigir_adicional_aplicavel(sessao, produto, adicional_id) for adicional_id in dados.adicional_ids]
    remocoes = _obter_remocoes_validas(produto, dados.remocao_item_ficha_tecnica_ids)
    remocao_ids = {item.id for item in remocoes}

    consumos = _calcular_consumo_produto(sessao, produto, remocao_ids)
    for adicional in adicionais:
        for item in adicional.itens_ficha_tecnica:
            insumo = buscar_insumo_por_id(sessao, item.insumo_id)
            if insumo is None:
                continue
            _somar_consumo(consumos, insumo, _converter_quantidade(sessao, item, insumo))

    preco_adicionais = sum((Decimal(adicional.preco_extra) for adicional in adicionais), Decimal("0"))
    preco_total = (Decimal(produto.preco_venda) + preco_adicionais).quantize(CENTAVOS, rounding=ROUND_HALF_UP)
    baixas = [_baixa_para_response(insumo, quantidade) for insumo, quantidade in consumos.values()]

    return {
        "produto_id": produto.id,
        "preco_base": Decimal(produto.preco_venda),
        "preco_adicionais": preco_adicionais.quantize(CENTAVOS, rounding=ROUND_HALF_UP),
        "preco_total": preco_total,
        "observacao": dados.observacao,
        "baixas_previstas": baixas,
        "estoque_suficiente": all(baixa["suficiente"] for baixa in baixas),
    }


def ficha_tecnica_adicional_valida(sessao: Session, adicional: Adicional) -> bool:
    if not adicional.itens_ficha_tecnica:
        return False

    for item in adicional.itens_ficha_tecnica:
        insumo = buscar_insumo_por_id(sessao, item.insumo_id)
        if insumo is None or not insumo.ativo:
            return False

        unidade = buscar_unidade_por_id(sessao, item.unidade_medida_id)
        if unidade is None or not unidade.ativa:
            return False

        if _fator_para_unidade_insumo(sessao, item.unidade_medida_id, insumo.unidade_medida_id) is None:
            return False

    return True


def obter_motivo_indisponibilidade_adicional(sessao: Session, adicional: Adicional) -> str | None:
    if not adicional.ativo:
        return "Adicional esta inativo."
    if not ficha_tecnica_adicional_valida(sessao, adicional):
        return "Adicional sem ficha tecnica valida."

    for item in adicional.itens_ficha_tecnica:
        insumo = buscar_insumo_por_id(sessao, item.insumo_id)
        if insumo is None:
            return "Ficha tecnica possui insumo inexistente."
        quantidade_base = _converter_quantidade(sessao, item, insumo)
        if Decimal(insumo.quantidade_estoque) < quantidade_base:
            return f"Estoque insuficiente de {insumo.nome}."

    return None


def adicional_para_response(sessao: Session, adicional: Adicional) -> dict:
    motivo = obter_motivo_indisponibilidade_adicional(sessao, adicional)
    return {
        "id": adicional.id,
        "nome": adicional.nome,
        "descricao": adicional.descricao,
        "preco_extra": adicional.preco_extra,
        "ativo": adicional.ativo,
        "ficha_tecnica_valida": ficha_tecnica_adicional_valida(sessao, adicional),
        "disponivel": motivo is None,
        "motivo_indisponibilidade": motivo,
        "categoria_ids": [item.categoria_id for item in adicional.categorias_permitidas],
        "criado_em": adicional.criado_em,
        "itens_ficha_tecnica": adicional.itens_ficha_tecnica,
    }


def _montar_itens_ficha_tecnica(sessao: Session, itens_dados) -> list[ItemFichaTecnicaAdicional]:
    itens = [
        ItemFichaTecnicaAdicional(
            insumo_id=item.insumo_id,
            quantidade=item.quantidade,
            unidade_medida_id=item.unidade_medida_id,
        )
        for item in itens_dados
    ]

    if not itens:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Adicional precisa de ficha tecnica com pelo menos um insumo.",
        )

    for item in itens:
        insumo = buscar_insumo_por_id(sessao, item.insumo_id)
        if insumo is None or not insumo.ativo:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Ficha tecnica do adicional possui insumo inexistente ou inativo.",
            )

        unidade = buscar_unidade_por_id(sessao, item.unidade_medida_id)
        if unidade is None or not unidade.ativa:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Ficha tecnica do adicional possui unidade inexistente ou inativa.",
            )

        if _fator_para_unidade_insumo(sessao, item.unidade_medida_id, insumo.unidade_medida_id) is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Ficha tecnica do adicional possui unidade incompativel com o insumo.",
            )

    return itens


def _calcular_consumo_produto(
    sessao: Session,
    produto: Produto,
    remocao_ids: set[int],
) -> dict[int, tuple[Insumo, Decimal]]:
    consumos: dict[int, tuple[Insumo, Decimal]] = {}
    for item in produto.itens_ficha_tecnica:
        if item.id in remocao_ids:
            continue
        insumo = buscar_insumo_por_id(sessao, item.insumo_id)
        if insumo is None:
            continue
        _somar_consumo(consumos, insumo, _converter_quantidade(sessao, item, insumo))
    return consumos


def _somar_consumo(
    consumos: dict[int, tuple[Insumo, Decimal]],
    insumo: Insumo,
    quantidade: Decimal,
) -> None:
    atual = consumos.get(insumo.id)
    consumos[insumo.id] = (insumo, quantidade if atual is None else atual[1] + quantidade)


def _baixa_para_response(insumo: Insumo, quantidade: Decimal) -> dict:
    estoque_atual = Decimal(insumo.quantidade_estoque)
    estoque_depois = estoque_atual - quantidade
    return {
        "insumo_id": insumo.id,
        "nome_insumo": insumo.nome,
        "quantidade": quantidade,
        "estoque_atual": estoque_atual,
        "estoque_depois": estoque_depois,
        "suficiente": estoque_depois >= Decimal("0"),
    }


def _obter_remocoes_validas(produto: Produto, item_ids: list[int]) -> list[ItemFichaTecnica]:
    removiveis = {item.id: item for item in produto.itens_ficha_tecnica if item.removivel}
    invalidos = [item_id for item_id in item_ids if item_id not in removiveis]
    if invalidos:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Remocao solicitada nao pertence ao produto ou nao esta marcada como removivel.",
        )
    return [removiveis[item_id] for item_id in item_ids]


def _exigir_adicional_aplicavel(sessao: Session, produto: Produto, adicional_id: int) -> Adicional:
    adicional = _exigir_adicional(sessao, adicional_id)
    if not adicional.ativo:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Adicional {adicional.nome} esta inativo.",
        )
    if not _adicional_permitido_na_categoria(adicional, produto.categoria_id):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Adicional {adicional.nome} nao e permitido para a categoria do produto.",
        )
    if not ficha_tecnica_adicional_valida(sessao, adicional):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Adicional {adicional.nome} nao possui ficha tecnica valida.",
        )
    return adicional


def _adicional_permitido_na_categoria(adicional: Adicional, categoria_id: int) -> bool:
    return any(item.categoria_id == categoria_id for item in adicional.categorias_permitidas)


def _converter_quantidade(
    sessao: Session,
    item: ItemFichaTecnica | ItemFichaTecnicaAdicional,
    insumo: Insumo,
) -> Decimal:
    fator = _fator_para_unidade_insumo(sessao, item.unidade_medida_id, insumo.unidade_medida_id)
    if fator is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Unidade de ficha tecnica incompativel com o insumo.",
        )
    return Decimal(item.quantidade) * fator


def _fator_para_unidade_insumo(
    sessao: Session,
    unidade_item_id: int,
    unidade_insumo_id: int,
) -> Decimal | None:
    if unidade_item_id == unidade_insumo_id:
        return Decimal("1")

    direta = buscar_conversao(sessao, unidade_item_id, unidade_insumo_id)
    if direta is not None and direta.ativa:
        return Decimal(direta.fator)

    inversa = buscar_conversao(sessao, unidade_insumo_id, unidade_item_id)
    if inversa is not None and inversa.ativa:
        return Decimal("1") / Decimal(inversa.fator)

    return None


def _exigir_categorias_ativas(sessao: Session, categoria_ids: list[int]) -> None:
    categorias = {categoria.id: categoria for categoria in listar_categorias(sessao)}
    for categoria_id in _ids_unicos(categoria_ids):
        categoria = categorias.get(categoria_id)
        if categoria is None or not categoria.ativo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Categoria nao encontrada.",
            )


def _ids_unicos(ids: list[int]) -> list[int]:
    return list(dict.fromkeys(ids))


def _exigir_adicional(sessao: Session, adicional_id: int) -> Adicional:
    adicional = buscar_adicional_por_id(sessao, adicional_id)
    if adicional is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Adicional nao encontrado.",
        )
    return adicional


def _exigir_produto(sessao: Session, produto_id: int) -> Produto:
    produto = buscar_produto_por_id(sessao, produto_id)
    if produto is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produto nao encontrado.",
        )
    return produto
