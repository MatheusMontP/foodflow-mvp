from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.modules.categorias.repository import listar_categorias
from app.modules.insumos.models import Insumo
from app.modules.insumos.repository import buscar_insumo_por_id
from app.modules.produtos.models import ItemFichaTecnica, Produto, StatusProduto
from app.modules.produtos.repository import (
    buscar_produto_por_id,
    buscar_produto_por_nome,
    listar_produtos,
    listar_produtos_ativos,
    salvar_produto,
    substituir_itens_ficha,
)
from app.modules.produtos.schemas import (
    FichaTecnicaAtualizar,
    ItemFichaTecnicaCriar,
    ProdutoAtualizar,
    ProdutoCriar,
    ProdutoStatusAtualizar,
)
from app.modules.unidades.repository import buscar_conversao, buscar_unidade_por_id


CENTAVOS = Decimal("0.01")


def criar_produto(sessao: Session, dados: ProdutoCriar) -> Produto:
    nome = dados.nome.strip()
    if buscar_produto_por_nome(sessao, nome) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ja existe produto com este nome.",
        )

    _exigir_categoria_ativa(sessao, dados.categoria_id)
    itens = _montar_itens_ficha_tecnica(0, dados.itens_ficha_tecnica)
    ficha_valida, motivo = _validar_itens_ficha_tecnica(sessao, itens)
    if not ficha_valida:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=motivo,
        )

    produto = Produto(
        nome=nome,
        descricao=dados.descricao,
        categoria_id=dados.categoria_id,
        preco_venda=dados.preco_venda,
        custo_ficha_tecnica=Decimal("0"),
        margem_estimada=dados.preco_venda,
        demanda_esperada_diaria=dados.demanda_esperada_diaria,
        status=StatusProduto.RASCUNHO,
    )
    sessao.add(produto)
    sessao.flush()

    for item in itens:
        item.produto_id = produto.id
    produto.itens_ficha_tecnica = itens

    recalcular_custo_e_margem(sessao, produto, persistir=False)
    return salvar_produto(sessao, produto)


def obter_produtos(sessao: Session) -> list[Produto]:
    produtos = listar_produtos(sessao)
    for produto in produtos:
        recalcular_custo_e_margem(sessao, produto, persistir=False)
    return produtos


def obter_produtos_vendaveis(sessao: Session) -> list[Produto]:
    produtos = []
    for produto in listar_produtos_ativos(sessao):
        recalcular_custo_e_margem(sessao, produto, persistir=False)
        if obter_motivo_indisponibilidade(sessao, produto) is None:
            produtos.append(produto)
    return produtos


def atualizar_produto(sessao: Session, produto_id: int, dados: ProdutoAtualizar) -> Produto:
    produto = _exigir_produto(sessao, produto_id)
    novos_itens = None

    if dados.itens_ficha_tecnica is not None:
        novos_itens = _montar_itens_ficha_tecnica(produto.id, dados.itens_ficha_tecnica)
        ficha_valida, motivo = _validar_itens_ficha_tecnica(sessao, novos_itens)
        if not ficha_valida:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=motivo,
            )

    if dados.nome is not None:
        nome = dados.nome.strip()
        existente = buscar_produto_por_nome(sessao, nome)
        if existente is not None and existente.id != produto.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ja existe produto com este nome.",
            )
        produto.nome = nome

    if dados.categoria_id is not None:
        _exigir_categoria_ativa(sessao, dados.categoria_id)
        produto.categoria_id = dados.categoria_id

    if dados.descricao is not None:
        produto.descricao = dados.descricao

    if dados.preco_venda is not None:
        produto.preco_venda = dados.preco_venda

    if dados.demanda_esperada_diaria is not None:
        produto.demanda_esperada_diaria = dados.demanda_esperada_diaria

    if novos_itens is not None:
        produto.itens_ficha_tecnica.clear()
        sessao.flush()
        produto.itens_ficha_tecnica.extend(novos_itens)

    recalcular_custo_e_margem(sessao, produto, persistir=False)
    return salvar_produto(sessao, produto)


def atualizar_status_produto(
    sessao: Session,
    produto_id: int,
    dados: ProdutoStatusAtualizar,
) -> Produto:
    produto = _exigir_produto(sessao, produto_id)
    if dados.status == StatusProduto.ATIVO and not ficha_tecnica_valida(sessao, produto):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Produto so pode ficar ativo com ficha tecnica valida e pelo menos um insumo ativo.",
        )

    produto.status = dados.status
    recalcular_custo_e_margem(sessao, produto, persistir=False)
    return salvar_produto(sessao, produto)


def atualizar_ficha_tecnica(
    sessao: Session,
    produto_id: int,
    dados: FichaTecnicaAtualizar,
) -> Produto:
    produto = _exigir_produto(sessao, produto_id)
    itens = _montar_itens_ficha_tecnica(produto.id, dados.itens)

    ficha_valida, motivo = _validar_itens_ficha_tecnica(sessao, itens)
    if not ficha_valida:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=motivo,
        )

    if produto.status == StatusProduto.ATIVO and not ficha_valida:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Ficha tecnica invalida para produto ativo.",
        )

    produto = substituir_itens_ficha(sessao, produto, itens)
    recalcular_custo_e_margem(sessao, produto, persistir=False)
    return salvar_produto(sessao, produto)


def recalcular_produto(sessao: Session, produto_id: int) -> Produto:
    produto = _exigir_produto(sessao, produto_id)
    recalcular_custo_e_margem(sessao, produto, persistir=False)
    return salvar_produto(sessao, produto)


def ficha_tecnica_valida(sessao: Session, produto: Produto) -> bool:
    return _validar_ficha_tecnica(sessao, produto)[0]


def obter_motivo_indisponibilidade(sessao: Session, produto: Produto) -> str | None:
    ficha_valida, motivo = _validar_ficha_tecnica(sessao, produto)
    if produto.status != StatusProduto.ATIVO:
        return "Produto nao esta ativo."
    if not ficha_valida:
        return motivo

    for item in produto.itens_ficha_tecnica:
        insumo = buscar_insumo_por_id(sessao, item.insumo_id)
        if insumo is None:
            return "Ficha tecnica possui insumo inexistente."
        quantidade_base = _converter_quantidade_para_unidade_insumo(sessao, item, insumo)
        if Decimal(insumo.quantidade_estoque) < quantidade_base:
            return f"Estoque insuficiente de {insumo.nome}."

    return None


def recalcular_custo_e_margem(
    sessao: Session,
    produto: Produto,
    persistir: bool = True,
) -> Produto:
    custo = Decimal("0")
    if ficha_tecnica_valida(sessao, produto):
        for item in produto.itens_ficha_tecnica:
            insumo = buscar_insumo_por_id(sessao, item.insumo_id)
            if insumo is None:
                continue
            quantidade_base = _converter_quantidade_para_unidade_insumo(sessao, item, insumo)
            custo += quantidade_base * Decimal(insumo.custo_unitario)

    produto.custo_ficha_tecnica = custo.quantize(CENTAVOS, rounding=ROUND_HALF_UP)
    produto.margem_estimada = (Decimal(produto.preco_venda) - produto.custo_ficha_tecnica).quantize(
        CENTAVOS,
        rounding=ROUND_HALF_UP,
    )
    if persistir:
        sessao.add(produto)
        sessao.commit()
        sessao.refresh(produto)
    return produto


def produto_para_response(sessao: Session, produto: Produto) -> dict:
    motivo = obter_motivo_indisponibilidade(sessao, produto)
    return {
        "id": produto.id,
        "nome": produto.nome,
        "descricao": produto.descricao,
        "categoria_id": produto.categoria_id,
        "preco_venda": produto.preco_venda,
        "custo_ficha_tecnica": produto.custo_ficha_tecnica,
        "margem_estimada": produto.margem_estimada,
        "demanda_esperada_diaria": produto.demanda_esperada_diaria,
        "status": produto.status,
        "ficha_tecnica_valida": ficha_tecnica_valida(sessao, produto),
        "vendavel": motivo is None,
        "motivo_indisponibilidade": motivo,
        "criado_em": produto.criado_em,
        "itens_ficha_tecnica": produto.itens_ficha_tecnica,
    }


def _validar_ficha_tecnica(sessao: Session, produto: Produto) -> tuple[bool, str | None]:
    if not produto.itens_ficha_tecnica:
        return False, "Produto sem ficha tecnica valida."

    return _validar_itens_ficha_tecnica(sessao, list(produto.itens_ficha_tecnica))


def _validar_itens_ficha_tecnica(
    sessao: Session,
    itens: list[ItemFichaTecnica],
) -> tuple[bool, str | None]:
    if not itens:
        return False, "Produto sem ficha tecnica valida."

    for item in itens:
        insumo = buscar_insumo_por_id(sessao, item.insumo_id)
        if insumo is None or not insumo.ativo:
            return False, "Ficha tecnica possui insumo inexistente ou inativo."

        unidade = buscar_unidade_por_id(sessao, item.unidade_medida_id)
        if unidade is None or not unidade.ativa:
            return False, "Ficha tecnica possui unidade de medida inexistente ou inativa."

        if _fator_para_unidade_insumo(sessao, item.unidade_medida_id, insumo.unidade_medida_id) is None:
            return False, "Ficha tecnica possui unidade incompativel com o insumo."

    return True, None


def _converter_quantidade_para_unidade_insumo(
    sessao: Session,
    item: ItemFichaTecnica,
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


def _montar_itens_ficha_tecnica(
    produto_id: int,
    itens_dados: list[ItemFichaTecnicaCriar],
) -> list[ItemFichaTecnica]:
    return [
        ItemFichaTecnica(
            produto_id=produto_id,
            insumo_id=item.insumo_id,
            quantidade=item.quantidade,
            unidade_medida_id=item.unidade_medida_id,
            removivel=item.removivel,
        )
        for item in itens_dados
    ]


def _exigir_categoria_ativa(sessao: Session, categoria_id: int) -> None:
    categoria = next((item for item in listar_categorias(sessao) if item.id == categoria_id), None)
    if categoria is None or not categoria.ativo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoria nao encontrada.",
        )


def _exigir_produto(sessao: Session, produto_id: int) -> Produto:
    produto = buscar_produto_por_id(sessao, produto_id)
    if produto is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produto nao encontrado.",
        )
    return produto
