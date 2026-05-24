from datetime import date

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.database.session import obter_sessao
from app.modules.auth.dependencies import exigir_papeis
from app.modules.auth.models import PapelUsuario, Usuario
from app.modules.relatorios.schemas import DashboardResponse
from app.modules.relatorios.service import gerar_csv_dashboard, gerar_pdf_dashboard, obter_dashboard


router = APIRouter(prefix="/relatorios", tags=["Relatorios"])


@router.get("/dashboard", response_model=DashboardResponse)
def consultar_dashboard(
    inicio: date | None = None,
    fim: date | None = None,
    sessao: Session = Depends(obter_sessao),
    _: Usuario = Depends(exigir_papeis(PapelUsuario.OWNER, PapelUsuario.MANAGER)),
):
    return obter_dashboard(sessao, inicio, fim)


@router.get("/exportacoes/dashboard.csv")
def exportar_dashboard_csv(
    inicio: date | None = None,
    fim: date | None = None,
    sessao: Session = Depends(obter_sessao),
    _: Usuario = Depends(exigir_papeis(PapelUsuario.OWNER, PapelUsuario.MANAGER)),
):
    conteudo = gerar_csv_dashboard(sessao, inicio, fim)
    return Response(
        content=conteudo,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=foodflow-dashboard.csv"},
    )


@router.get("/exportacoes/dashboard.pdf")
def exportar_dashboard_pdf(
    inicio: date | None = None,
    fim: date | None = None,
    sessao: Session = Depends(obter_sessao),
    _: Usuario = Depends(exigir_papeis(PapelUsuario.OWNER, PapelUsuario.MANAGER)),
):
    conteudo = gerar_pdf_dashboard(sessao, inicio, fim)
    return Response(
        content=conteudo,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=foodflow-dashboard.pdf"},
    )
