from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.session import obter_sessao
from app.modules.adicionais.schemas import (
    AdicionalCriar,
    AdicionalResponse,
    AdicionalStatusAtualizar,
    CategoriasAdicionalAtualizar,
    FichaTecnicaAdicionalAtualizar,
    SimulacaoItemRequest,
    SimulacaoItemResponse,
    VariacoesProdutoResponse,
)
from app.modules.adicionais.service import (
    adicional_para_response,
    atualizar_categorias_adicional,
    atualizar_ficha_tecnica_adicional,
    atualizar_status_adicional,
    criar_adicional,
    obter_adicionais,
    obter_variacoes_produto,
    simular_item_produto,
)
from app.modules.auth.dependencies import exigir_papeis
from app.modules.auth.models import PapelUsuario, Usuario


router = APIRouter(prefix="/adicionais", tags=["Adicionais"])


@router.post("", response_model=AdicionalResponse, status_code=status.HTTP_201_CREATED)
def cadastrar_adicional(
    dados: AdicionalCriar,
    sessao: Session = Depends(obter_sessao),
    _: Usuario = Depends(exigir_papeis(PapelUsuario.OWNER, PapelUsuario.MANAGER)),
):
    adicional = criar_adicional(sessao, dados)
    return adicional_para_response(sessao, adicional)


@router.get("", response_model=list[AdicionalResponse])
def listar_adicionais(
    sessao: Session = Depends(obter_sessao),
    _: Usuario = Depends(exigir_papeis(PapelUsuario.OWNER, PapelUsuario.MANAGER)),
):
    return [adicional_para_response(sessao, adicional) for adicional in obter_adicionais(sessao)]


@router.patch("/{adicional_id}/status", response_model=AdicionalResponse)
def editar_status_adicional(
    adicional_id: int,
    dados: AdicionalStatusAtualizar,
    sessao: Session = Depends(obter_sessao),
    _: Usuario = Depends(exigir_papeis(PapelUsuario.OWNER, PapelUsuario.MANAGER)),
):
    adicional = atualizar_status_adicional(sessao, adicional_id, dados)
    return adicional_para_response(sessao, adicional)


@router.put("/{adicional_id}/categorias", response_model=AdicionalResponse)
def editar_categorias_adicional(
    adicional_id: int,
    dados: CategoriasAdicionalAtualizar,
    sessao: Session = Depends(obter_sessao),
    _: Usuario = Depends(exigir_papeis(PapelUsuario.OWNER, PapelUsuario.MANAGER)),
):
    adicional = atualizar_categorias_adicional(sessao, adicional_id, dados)
    return adicional_para_response(sessao, adicional)


@router.put("/{adicional_id}/ficha-tecnica", response_model=AdicionalResponse)
def salvar_ficha_tecnica_adicional(
    adicional_id: int,
    dados: FichaTecnicaAdicionalAtualizar,
    sessao: Session = Depends(obter_sessao),
    _: Usuario = Depends(exigir_papeis(PapelUsuario.OWNER, PapelUsuario.MANAGER)),
):
    adicional = atualizar_ficha_tecnica_adicional(sessao, adicional_id, dados)
    return adicional_para_response(sessao, adicional)


@router.get("/produto/{produto_id}/variacoes", response_model=VariacoesProdutoResponse)
def listar_variacoes_produto(
    produto_id: int,
    sessao: Session = Depends(obter_sessao),
    _: Usuario = Depends(exigir_papeis(PapelUsuario.OWNER, PapelUsuario.MANAGER, PapelUsuario.CASHIER)),
):
    return obter_variacoes_produto(sessao, produto_id)


@router.post("/produto/{produto_id}/simulacao-item", response_model=SimulacaoItemResponse)
def simular_item(
    produto_id: int,
    dados: SimulacaoItemRequest,
    sessao: Session = Depends(obter_sessao),
    _: Usuario = Depends(exigir_papeis(PapelUsuario.OWNER, PapelUsuario.MANAGER, PapelUsuario.CASHIER)),
):
    return simular_item_produto(sessao, produto_id, dados)
