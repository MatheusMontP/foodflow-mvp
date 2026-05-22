# FoodFlow Gestao - Backend

Backend FastAPI do FoodFlow Gestao, organizado como Monolito Modular.

## Como rodar

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

Se `py` ou `python` nao estiverem no PATH, nesta maquina o Python foi encontrado em:

```powershell
& "C:\Users\Matheus\AppData\Local\Programs\Python\Python313\python.exe" -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

API:

- `GET /health`
- `GET /api/health`
- `POST /api/auth/primeiro-owner`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/auth/me`
- `POST /api/usuarios`
- `GET /api/usuarios`
- `POST /api/categorias`
- `GET /api/categorias`
- `POST /api/unidades-medida`
- `GET /api/unidades-medida`
- `POST /api/conversoes-unidade`
- `GET /api/conversoes-unidade`
- `POST /api/insumos`
- `GET /api/insumos`
- `POST /api/insumos/{insumo_id}/conversoes-compra`
- `GET /api/insumos/{insumo_id}/conversoes-compra`
- `POST /api/estoque/entradas`
- `GET /api/estoque/movimentacoes`
- `POST /api/produtos`
- `GET /api/produtos`
- `GET /api/produtos/vendaveis`
- `PUT /api/produtos/{produto_id}`
- `PATCH /api/produtos/{produto_id}/status`
- `PUT /api/produtos/{produto_id}/ficha-tecnica`
- `POST /api/produtos/{produto_id}/recalcular`
- `GET /api/pdv/cardapio`
- `POST /api/pdv/vendas`
- `GET /api/pdv/vendas`
- `POST /api/promocoes`
- `GET /api/promocoes`
- `PUT /api/promocoes/{promocao_id}`
- `PATCH /api/promocoes/{promocao_id}/status`

## Fluxo inicial de autenticacao

1. Crie o primeiro usuario `OWNER` em `POST /api/auth/primeiro-owner`.
2. Faca login em `POST /api/auth/login`.
3. Use o `access_token` no header `Authorization: Bearer <token>`.
4. Crie outros usuarios em `POST /api/usuarios` usando um usuario `OWNER`.

## Cadastros base

Os cadastros de categorias, unidades, conversoes e insumos exigem token de usuario `OWNER` ou `MANAGER`.

Ao iniciar, o backend cria as unidades padrao e as conversoes automaticas:

- `1 kg = 1000 g`
- `1 L = 1000 ml`

Ao criar um insumo com `estoque_inicial` maior que zero, o sistema registra uma movimentacao de estoque do tipo `ENTRADA`.

Conversoes de compra como pacote, caixa, bandeja e fardo devem ser cadastradas por insumo. Exemplos:

- salsicha: `1 pacote = 12 unidades`;
- massa de pastel: `1 pacote = 400 g`;
- pao de hamburguer: `1 pacote = 6 unidades`.

Ao registrar entrada em `POST /api/estoque/entradas`, se a unidade informada for uma unidade de compra do insumo, o sistema converte a quantidade para a unidade base antes de atualizar o estoque. Se a embalagem daquela compra vier com quantidade diferente do padrao, envie `quantidade_equivalente_informada`.

Exemplo:

```json
{
  "insumo_id": 1,
  "quantidade": 2,
  "unidade_compra_id": 6,
  "quantidade_equivalente_informada": 10,
  "motivo": "Compra de 2 pacotes com 10 unidades cada"
}
```

## Produtos e ficha tecnica

Produtos sao criados inicialmente como `RASCUNHO`. Para ativar um produto, cadastre uma ficha tecnica com pelo menos um insumo ativo e uma unidade compativel com a unidade base do insumo.

O custo da ficha tecnica e a margem estimada sao calculados a partir do custo atual dos insumos. Use `POST /api/produtos/{produto_id}/recalcular` depois de alterar custos de insumos para atualizar o produto. Produtos ativos sem estoque suficiente para produzir uma unidade retornam `vendavel: false` e nao aparecem em `GET /api/produtos/vendaveis`.

## PDV e vendas

O PDV usa `GET /api/pdv/cardapio` para listar produtos ativos, incluindo os bloqueados por estoque. Para finalizar uma venda, envie os itens para `POST /api/pdv/vendas` com forma de pagamento. O sistema gera numero diario no formato `YYYYMMDD-001`, grava os itens vendidos e registra movimentacoes de estoque do tipo `SAIDA_VENDA`.

## Promocoes

Promocoes podem ser cadastradas por produto, categoria ou venda inteira. O desconto pode ser percentual ou valor fixo, com periodo opcional de vigencia.

Na finalizacao da venda, o sistema aplica promocoes automaticamente usando a prioridade `produto > categoria > venda inteira`. Quando houver empate no mesmo nivel, vence a promocao que gera maior economia. Promocoes inativas ou fora do periodo nao alteram o total.
