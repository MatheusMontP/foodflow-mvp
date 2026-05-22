from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.session import obter_sessao
from app.modules.auth.dependencies import exigir_papeis
from app.modules.auth.models import PapelUsuario, Usuario
from app.modules.pdv.schemas import CardapioPDVResponse, VendaCancelar, VendaCriar, VendaResponse
from app.modules.pdv.service import cancelar_venda, finalizar_venda, obter_cardapio_pdv, obter_vendas


router = APIRouter(prefix="/pdv", tags=["PDV"])


@router.get("/cardapio", response_model=CardapioPDVResponse)
def consultar_cardapio(
    sessao: Session = Depends(obter_sessao),
    _: Usuario = Depends(exigir_papeis(PapelUsuario.OWNER, PapelUsuario.MANAGER, PapelUsuario.CASHIER)),
):
    return obter_cardapio_pdv(sessao)


@router.post("/vendas", response_model=VendaResponse, status_code=status.HTTP_201_CREATED)
def vender(
    dados: VendaCriar,
    sessao: Session = Depends(obter_sessao),
    usuario: Usuario = Depends(exigir_papeis(PapelUsuario.OWNER, PapelUsuario.MANAGER, PapelUsuario.CASHIER)),
):
    return finalizar_venda(sessao, dados, usuario.id)


@router.get("/vendas", response_model=list[VendaResponse])
def listar_vendas_pdv(
    sessao: Session = Depends(obter_sessao),
    _: Usuario = Depends(exigir_papeis(PapelUsuario.OWNER, PapelUsuario.MANAGER)),
):
    return obter_vendas(sessao)


@router.post("/vendas/{venda_id}/cancelar", response_model=VendaResponse)
def cancelar_venda_pdv(
    venda_id: int,
    dados: VendaCancelar,
    sessao: Session = Depends(obter_sessao),
    usuario: Usuario = Depends(exigir_papeis(PapelUsuario.OWNER, PapelUsuario.MANAGER)),
):
    return cancelar_venda(sessao, venda_id, dados, usuario.id)
