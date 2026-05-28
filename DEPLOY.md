# Deploy FoodFlow

## Arquitetura recomendada

- Frontend: Vercel
- Backend: Render
- Banco: Supabase Postgres

## 1. Supabase

1. Crie um projeto no Supabase.
2. Copie a connection string do Postgres.
3. Use a URL em `DATABASE_URL` no Render.

Use o formato:

```txt
postgresql://USUARIO:SENHA@HOST:5432/postgres
```

## 2. Backend no Render

1. Conecte o repositorio no Render.
2. Crie um Web Service usando o `render.yaml`.
3. Configure as variaveis:

```txt
DATABASE_URL=postgresql://...
CORS_ORIGINS=["https://SEU-FRONTEND.vercel.app"]
```

Depois que o frontend estiver no ar, volte nessa variavel e coloque a URL real da Vercel.

## 3. Frontend na Vercel

1. Importe o repositorio na Vercel.
2. Configure o Root Directory como `frontend`.
3. Configure a variavel:

```txt
VITE_API_URL=https://SUA-API.onrender.com/api
```

4. Faça o deploy.

## Observacoes para apresentacao

- O primeiro acesso ao backend no Render free pode demorar cerca de 1 minuto se o servico estiver dormindo.
- O seed cria usuarios de demo:

```txt
owner@example.com / 12345678
gerente@example.com / 12345678
caixa@example.com / 12345678
```

- Se mudar a URL do frontend, atualize `CORS_ORIGINS` no Render.
