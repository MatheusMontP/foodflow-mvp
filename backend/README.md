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

## Fluxo inicial de autenticacao

1. Crie o primeiro usuario `OWNER` em `POST /api/auth/primeiro-owner`.
2. Faca login em `POST /api/auth/login`.
3. Use o `access_token` no header `Authorization: Bearer <token>`.
4. Crie outros usuarios em `POST /api/usuarios` usando um usuario `OWNER`.
