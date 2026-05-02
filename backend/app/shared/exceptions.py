class FoodFlowError(Exception):
    """Erro base para regras de negocio do FoodFlow."""


class RegraDeNegocioError(FoodFlowError):
    """Erro usado quando uma operacao viola uma regra de negocio."""

