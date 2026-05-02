# FoodFlow Gestao

MVP web para pequenos negocios alimenticios, com painel gerencial, PDV responsivo, controle de estoque por insumos e recomendacao de producao.

## Estrutura

```txt
backend/
frontend/
docs/
```

## Backend

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

Se `py` ou `python` nao estiverem no PATH, use o executavel encontrado nesta maquina:

```powershell
cd backend
& "C:\Users\Matheus\AppData\Local\Programs\Python\Python313\python.exe" -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

## Frontend

```powershell
cd frontend
npm install
npm run dev
```

## Fundacao tecnica entregue

- Backend FastAPI inicial.
- Frontend React + Vite + TypeScript inicial.
- SQLite configurado.
- Arquitetura em Monolito Modular.
- Rota de saude da API.

## Autenticacao inicial

- `POST /api/auth/primeiro-owner`: cria o primeiro usuario `OWNER`.
- `POST /api/auth/login`: retorna `access_token` e `refresh_token`.
- `POST /api/auth/refresh`: renova os tokens.
- `GET /api/auth/me`: retorna o usuario autenticado.
- `POST /api/usuarios`: cria usuario, restrito a `OWNER`.
- `GET /api/usuarios`: lista usuarios, restrito a `OWNER` e `MANAGER`.
