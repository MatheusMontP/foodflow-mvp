from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.session import obter_sessao
from app.modules.auth.dependencies import exigir_papeis
from app.modules.auth.models import PapelUsuario, Usuario
from app.modules.produtos.schemas import (
    FichaTecnicaAtualizar,
    ProdutoAtualizar,
    ProdutoCriar,
    ProdutoResponse,
    ProdutoStatusAtualizar,
)
from app.modules.produtos.service import (
    atualizar_ficha_tecnica,
    atualizar_produto,
    atualizar_status_produto,
    criar_produto,
    excluir_produto,
    obter_produtos,
    obter_produtos_vendaveis,
    produto_para_response,
    recalcular_produto,
)


router = APIRouter(prefix="/produtos", tags=["Produtos"])


@router.post("", response_model=ProdutoResponse, status_code=status.HTTP_201_CREATED)
def cadastrar_produto(
    dados: ProdutoCriar,
    sessao: Session = Depends(obter_sessao),
    _: Usuario = Depends(exigir_papeis(PapelUsuario.OWNER, PapelUsuario.MANAGER)),
):
    produto = criar_produto(sessao, dados)
    return produto_para_response(sessao, produto)


@router.get("", response_model=list[ProdutoResponse])
def listar_produtos(
    sessao: Session = Depends(obter_sessao),
    _: Usuario = Depends(exigir_papeis(PapelUsuario.OWNER, PapelUsuario.MANAGER)),
):
    return [produto_para_response(sessao, produto) for produto in obter_produtos(sessao)]


@router.get("/vendaveis", response_model=list[ProdutoResponse])
def listar_produtos_vendaveis(
    sessao: Session = Depends(obter_sessao),
    _: Usuario = Depends(exigir_papeis(PapelUsuario.OWNER, PapelUsuario.MANAGER, PapelUsuario.CASHIER)),
):
    return [produto_para_response(sessao, produto) for produto in obter_produtos_vendaveis(sessao)]


@router.put("/{produto_id}", response_model=ProdutoResponse)
def editar_produto(
    produto_id: int,
    dados: ProdutoAtualizar,
    sessao: Session = Depends(obter_sessao),
    _: Usuario = Depends(exigir_papeis(PapelUsuario.OWNER, PapelUsuario.MANAGER)),
):
    produto = atualizar_produto(sessao, produto_id, dados)
    return produto_para_response(sessao, produto)


@router.patch("/{produto_id}/status", response_model=ProdutoResponse)
def editar_status_produto(
    produto_id: int,
    dados: ProdutoStatusAtualizar,
    sessao: Session = Depends(obter_sessao),
    _: Usuario = Depends(exigir_papeis(PapelUsuario.OWNER, PapelUsuario.MANAGER)),
):
    produto = atualizar_status_produto(sessao, produto_id, dados)
    return produto_para_response(sessao, produto)


@router.put("/{produto_id}/ficha-tecnica", response_model=ProdutoResponse)
def salvar_ficha_tecnica(
    produto_id: int,
    dados: FichaTecnicaAtualizar,
    sessao: Session = Depends(obter_sessao),
    _: Usuario = Depends(exigir_papeis(PapelUsuario.OWNER, PapelUsuario.MANAGER)),
):
    produto = atualizar_ficha_tecnica(sessao, produto_id, dados)
    return produto_para_response(sessao, produto)


@router.post("/{produto_id}/recalcular", response_model=ProdutoResponse)
def recalcular_custos_produto(
    produto_id: int,
    sessao: Session = Depends(obter_sessao),
    _: Usuario = Depends(exigir_papeis(PapelUsuario.OWNER, PapelUsuario.MANAGER)),
):
    produto = recalcular_produto(sessao, produto_id)
    return produto_para_response(sessao, produto)


@router.delete("/{produto_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_produto(
    produto_id: int,
    sessao: Session = Depends(obter_sessao),
    _: Usuario = Depends(exigir_papeis(PapelUsuario.OWNER, PapelUsuario.MANAGER)),
):
    excluir_produto(sessao, produto_id)
