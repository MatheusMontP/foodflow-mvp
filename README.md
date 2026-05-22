# FoodFlow Gestao

MVP web para pequenos negocios alimenticios, com autenticacao por papel, cadastros operacionais, ficha tecnica, controle de estoque por insumos e PDV responsivo.

O projeto esta sendo construido em blocos incrementais. O estado atual ja cobre ate o **Bloco 7 - Promocoes**.

## Status dos blocos

- Bloco 1 - Fundacao tecnica: concluido.
- Bloco 2 - Autenticacao, usuarios e permissoes: concluido.
- Bloco 3 - Cadastros operacionais base: concluido.
- Bloco 4 - Produtos, ficha tecnica e disponibilidade: concluido.
- Bloco 5 - Adicionais, remocoes e observacoes: concluido.
- Bloco 6 - PDV e venda: concluido.
- Bloco 7 - Promocoes: concluido.
- Bloco 8 - Cancelamento e movimentacoes de estoque: proximo bloco.

## Tecnologias

- Backend: FastAPI, SQLAlchemy, SQLite, JWT e Argon2.
- Frontend: React, Vite, TypeScript e lucide-react.
- Banco local: `backend/foodflow.db`.

## Estrutura

```txt
backend/
  app/
    core/
    database/
    modules/
      adicionais/
      auth/
      categorias/
      estoque/
      health/
      insumos/
      pdv/
      produtos/
      promocoes/
      recomendacoes/
      relatorios/
      unidades/
      usuarios/
frontend/
  src/
    app/
    servicos/
docs/
```

## Como rodar

### Backend

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
cd backend
& "C:\Users\Matheus\AppData\Local\Programs\Python\Python313\python.exe" -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Backend local:

- API: `http://127.0.0.1:8000`
- Docs: `http://127.0.0.1:8000/docs`
- Health: `http://127.0.0.1:8000/health`

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend local:

- App: `http://127.0.0.1:5173`

## Acesso de desenvolvimento

No banco local desta maquina, as senhas dos usuarios de teste foram resetadas para:

```txt
12345678
```

Usuarios cadastrados no SQLite local:

| Papel | Email | Senha |
| --- | --- | --- |
| OWNER | `owner@example.com` | `12345678` |
| MANAGER | `gerente@example.com` | `12345678` |
| CASHIER | `caixa@example.com` | `12345678` |

Use `caixa@example.com` para testar o PDV. Use `owner@example.com` ou `gerente@example.com` para cadastros gerenciais.

## Pre-cadastros

O banco `backend/foodflow.db` e local e nao e versionado no Git. Nesta maquina ele ja possui dados de desenvolvimento para facilitar a demonstracao.

### Criados automaticamente pelo seed

Ao iniciar o backend, o sistema cria as unidades padrao:

- quilograma (`kg`)
- grama (`g`)
- litro (`L`)
- mililitro (`ml`)
- unidade (`unidade`)
- pacote (`pacote`)
- caixa (`caixa`)
- duzia (`duzia`)
- lata (`lata`)
- garrafa (`garrafa`)
- sache (`sache`)
- bandeja (`bandeja`)

Tambem cria as conversoes automaticas:

- `1 kg = 1000 g`
- `1 L = 1000 ml`

### Presentes no banco local de desenvolvimento

Categorias:

- Hamburgueres
- Pastelaria

Unidade personalizada:

- fardo

Insumos:

- Carne bovina: unidade `kg`, custo unitario `38.90`, estoque `12.5`.
- Salsicha teste conversao: unidade `unidade`, custo unitario `1.20`, estoque `56`.
- Massa pastel teste conversao: unidade `g`, custo unitario `0.03`, estoque `800`.

Produto:

- X-Tudo: categoria `Hamburgueres`, preco `12.99`, demanda diaria `12`, status atual `RASCUNHO`.

Adicionais:

- Nenhum adicional cadastrado no banco local no momento.

## Funcionalidades atuais

### Autenticacao e permissoes

- Criacao do primeiro `OWNER`.
- Login com JWT.
- Refresh token.
- Usuario atual em `/api/auth/me`.
- Papeis `OWNER`, `MANAGER` e `CASHIER`.
- Protecao de rotas por papel.
- Log de acesso.

### Cadastros operacionais

- Categorias.
- Unidades de medida.
- Conversoes de unidade.
- Insumos.
- Estoque inicial por insumo.
- Conversoes de compra por insumo.
- Entradas de estoque com conversao para unidade base.

### Produtos e ficha tecnica

- Cadastro de produto como rascunho.
- Status `RASCUNHO`, `ATIVO` e `INATIVO`.
- Ficha tecnica com insumos.
- Marcacao de insumo removivel.
- Calculo de custo e margem.
- Regra de disponibilidade por estoque.
- Bloqueio de produto sem ficha valida ou sem estoque.

### Adicionais e variacoes

- Cadastro de adicionais.
- Ficha tecnica de adicional.
- Categorias permitidas por adicional.
- Adicionais por produto no PDV.
- Remocoes permitidas por item removivel.
- Observacao do item.
- Simulacao de preco e baixa prevista sem alterar estoque.

### PDV e venda

- Tela de PDV responsiva.
- Cardapio por categoria.
- Produtos bloqueados visualmente quando indisponiveis.
- Carrinho com quantidade.
- Forma de pagamento.
- Finalizacao de venda.
- Numero de pedido no formato `YYYYMMDD-001`.
- Baixa automatica de estoque.
- Movimentacao de estoque do tipo `SAIDA_VENDA`.

### Promocoes

- Cadastro de promocoes por produto, categoria ou venda inteira.
- Desconto percentual ou valor fixo.
- Periodo opcional de vigencia.
- Ativacao e inativacao de promocoes.
- Aplicacao automatica na finalizacao da venda.
- Prioridade: produto > categoria > venda inteira.
- Empate no mesmo nivel resolvido pela maior economia.
- Promocoes inativas ou fora do periodo nao alteram a venda.

## Principais rotas da API

### Saude

- `GET /health`
- `GET /api/health`

### Auth

- `POST /api/auth/primeiro-owner`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/auth/me`

### Usuarios

- `POST /api/usuarios`
- `GET /api/usuarios`

### Cadastros base

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

### Estoque

- `POST /api/estoque/entradas`
- `GET /api/estoque/movimentacoes`

### Produtos

- `POST /api/produtos`
- `GET /api/produtos`
- `GET /api/produtos/vendaveis`
- `PUT /api/produtos/{produto_id}`
- `PATCH /api/produtos/{produto_id}/status`
- `PUT /api/produtos/{produto_id}/ficha-tecnica`
- `POST /api/produtos/{produto_id}/recalcular`

### Adicionais

- `POST /api/adicionais`
- `GET /api/adicionais`
- `PATCH /api/adicionais/{adicional_id}/status`
- `PUT /api/adicionais/{adicional_id}/categorias`
- `PUT /api/adicionais/{adicional_id}/ficha-tecnica`
- `GET /api/adicionais/produto/{produto_id}/variacoes`
- `POST /api/adicionais/produto/{produto_id}/simulacao-item`

### PDV

- `GET /api/pdv/cardapio`
- `POST /api/pdv/vendas`
- `GET /api/pdv/vendas`

### Promocoes

- `POST /api/promocoes`
- `GET /api/promocoes`
- `PUT /api/promocoes/{promocao_id}`
- `PATCH /api/promocoes/{promocao_id}/status`

## Fluxo rapido para demonstracao

1. Inicie backend e frontend.
2. Acesse `http://127.0.0.1:5173`.
3. Entre com `owner@example.com` e senha `12345678`.
4. Na aba de gestao, confira categorias, produto, ficha tecnica e disponibilidade.
5. Ative um produto somente depois de ele possuir ficha tecnica valida e estoque suficiente.
6. Entre como `caixa@example.com` para operar o PDV.
7. Selecione produto, adicionais/remocoes quando houver, forma de pagamento e finalize a venda.
8. Confira a baixa em `GET /api/estoque/movimentacoes` ou pela documentacao da API.

## Observacoes

- O arquivo `backend/foodflow.db` fica fora do Git por ser banco local de desenvolvimento.
- O arquivo `backend/.env` tambem fica fora do Git.
- O proximo bloco planejado e o **Bloco 8 - Cancelamento e movimentacoes de estoque**.
