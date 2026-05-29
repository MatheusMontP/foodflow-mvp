# FoodFlow Gestao

MVP web para pequenos negocios alimenticios, com autenticacao por papel, cadastros operacionais, ficha tecnica, controle de estoque por insumos, PDV responsivo, promocoes, relatorios, recomendacao de producao por Programacao Linear e backups locais.

O projeto e um monolito modular no backend, com frontend React separado. O estado atual cobre ate o **Bloco 11 - Backup local e acabamento do MVP**.

## Status dos blocos

- Bloco 1 - Fundacao tecnica: concluido.
- Bloco 2 - Autenticacao, usuarios e permissoes: concluido.
- Bloco 3 - Cadastros operacionais base: concluido.
- Bloco 4 - Produtos, ficha tecnica e disponibilidade: concluido.
- Bloco 5 - Adicionais, remocoes e observacoes: concluido.
- Bloco 6 - PDV e venda: concluido.
- Bloco 7 - Promocoes: concluido.
- Bloco 8 - Cancelamento e movimentacoes de estoque: concluido.
- Bloco 9 - Dashboard, relatorios e exportacoes: concluido.
- Bloco 10 - Recomendacao por Programacao Linear: concluido.
- Bloco 11 - Backup local e acabamento do MVP: concluido.

## Tecnologias

- Backend: FastAPI, SQLAlchemy, Pydantic, JWT, Argon2, PuLP e SQLite/PostgreSQL.
- Frontend: React, Vite, TypeScript, Tailwind CSS, Zustand, Recharts e lucide-react.
- Banco local padrao: `backend/foodflow.db`.
- Deploy sugerido: frontend na Vercel, backend no Render e banco PostgreSQL no Supabase.

## Estrutura

```txt
backend/
  app/
    core/
    database/
    modules/
      adicionais/
      auth/
      backups/
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
    components/
    pages/
    servicos/
    stores/
docs/
```

## Como rodar

### Atalho local

Na raiz do projeto:

```powershell
.\run.ps1
```

O script encerra processos antigos nas portas usadas pelo projeto e inicia:

- Backend: `http://127.0.0.1:8003`
- Frontend: `http://127.0.0.1:5173`

### Backend manual

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8003
```

Se `py` ou `python` nao estiverem no PATH, nesta maquina o Python foi encontrado em:

```powershell
cd backend
& "C:\Users\Matheus\AppData\Local\Programs\Python\Python313\python.exe" -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8003
```

Backend local:

- API: `http://127.0.0.1:8003/api`
- Docs: `http://127.0.0.1:8003/docs`
- Health: `http://127.0.0.1:8003/health`

### Frontend manual

```powershell
cd frontend
npm install
copy .env.example .env
npm run dev
```

Frontend local:

- App: `http://127.0.0.1:5173`

O frontend usa `VITE_API_URL`. O `.env.example` aponta para:

```txt
VITE_API_URL=http://localhost:8003/api
```

## Configuracao

### Backend

Variaveis principais em `backend/.env`:

```txt
APP_NAME=FoodFlow Gestao
APP_ENV=development
API_PREFIX=/api
DATABASE_URL=sqlite:///./foodflow.db
CORS_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173"]
SECRET_KEY=troque-esta-chave-em-desenvolvimento
ACCESS_TOKEN_MINUTES=15
REFRESH_TOKEN_DAYS=7
```

Para deploy com Postgres, use `DATABASE_URL` no formato:

```txt
postgresql://USUARIO:SENHA@HOST:5432/postgres
```

### Arquivos locais fora do Git

- `backend/.env`
- `backend/foodflow.db`
- `backend/backups_local/`
- `frontend/.env`
- `frontend/node_modules/`
- `frontend/dist/`

## Acesso de desenvolvimento

O seed cria usuarios de demonstracao com a senha:

```txt
12345678
```

| Papel | Email | Senha |
| --- | --- | --- |
| OWNER | `owner@example.com` | `12345678` |
| MANAGER | `gerente@example.com` | `12345678` |
| CASHIER | `caixa@example.com` | `12345678` |

Use `caixa@example.com` para testar o PDV. Use `owner@example.com` ou `gerente@example.com` para cadastros, promocoes, relatorios, recomendacoes e backups.

## Dados iniciais

Ao iniciar o backend, o sistema cria dados de demonstracao quando ainda nao existem.

Unidades padrao:

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

Conversoes automaticas:

- `1 kg = 1000 g`
- `1 L = 1000 ml`

Categorias de demonstracao:

- Lanches
- Combos
- Complementos
- Bebidas
- Sobremesas

Produtos de demonstracao:

- X-Bacon
- X-Salada
- Batata Frita G
- Coca-Cola Lata

## Funcionalidades

### Autenticacao e permissoes

- Criacao do primeiro `OWNER`.
- Login com JWT e refresh token.
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

- Cadastro de produto como rascunho ou produto ativo de demonstracao pelo seed.
- Status `RASCUNHO`, `ATIVO` e `INATIVO`.
- Ficha tecnica com insumos.
- Marcacao de insumo removivel.
- Calculo de custo e margem.
- Regra de disponibilidade por estoque.
- Bloqueio de produto sem ficha valida ou sem estoque.
- Edicao, exclusao e recalculo de produto.

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
- Carrinho com quantidade, adicionais, remocoes e observacao.
- Forma de pagamento.
- Simulacao de promocoes antes da finalizacao.
- Finalizacao de venda.
- Numero de pedido no formato `YYYYMMDD-001`.
- Baixa automatica de estoque.
- Movimentacao de estoque do tipo `SAIDA_VENDA`.

### Promocoes

- Cadastro de promocoes por produto, categoria ou venda inteira.
- Desconto percentual, valor fixo ou modelo leve/pague.
- Periodo opcional de vigencia.
- Ativacao, inativacao e exclusao de promocoes.
- Aplicacao automatica na finalizacao da venda.
- Prioridade: produto > categoria > venda inteira.
- Empate no mesmo nivel resolvido pela maior economia.
- Promocoes inativas ou fora do periodo nao alteram a venda.

### Cancelamento e rastreabilidade de estoque

- Cancelamento de venda com motivo obrigatorio.
- Venda cancelada permanece registrada com status `CANCELADA`.
- Devolucao automatica dos insumos ao estoque.
- Movimentacoes historicas de entrada, saida por venda, ajuste manual, perda/desperdicio e devolucao por cancelamento.
- Ajustes manuais exigem motivo.
- Perdas/desperdicios exigem motivo e nao podem deixar estoque negativo.
- Confirmacao diaria de estoque conferido.

### Dashboard, relatorios e exportacoes

- Dashboard gerencial com filtros por periodo.
- Indicadores comerciais e operacionais.
- Faturamento e ticket medio desconsideram vendas canceladas.
- Produtos bloqueados aparecem no painel.
- Alertas de estoque aparecem no painel.
- Exportacao CSV e PDF usando os mesmos filtros do dashboard.

### Recomendacoes por Programacao Linear

- Geracao de plano de venda e producao por `/api/recomendacoes/gerar`.
- Otimizacao por margem estimada, estoque disponivel, demanda e capacidade da cozinha.
- Exclusao de bebidas e revenda simples da recomendacao de preparo.
- Separacao entre produtos principais e complementos.
- Limite proporcional para complementos em relacao aos principais.
- Desconto seguro sugerido com base na diferenca de margem.
- Historico de recomendacoes geradas.

### Backups locais

- Backup automatico do SQLite ao iniciar o backend.
- Backup manual por `/api/backups/gerar`.
- Listagem de backups por `/api/backups/`.
- Retencao dos ultimos 7 arquivos em `backend/backups_local/`.
- Acesso restrito a `OWNER` e `MANAGER`.

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
- `PATCH /api/insumos/{insumo_id}`
- `POST /api/insumos/{insumo_id}/conversoes-compra`
- `GET /api/insumos/{insumo_id}/conversoes-compra`

### Estoque

- `POST /api/estoque/entradas`
- `POST /api/estoque/ajustes`
- `POST /api/estoque/perdas`
- `GET /api/estoque/movimentacoes`
- `POST /api/estoque/conferencias-diarias`
- `GET /api/estoque/conferencias-diarias`

### Produtos

- `POST /api/produtos`
- `GET /api/produtos`
- `GET /api/produtos/vendaveis`
- `PUT /api/produtos/{produto_id}`
- `DELETE /api/produtos/{produto_id}`
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
- `POST /api/pdv/promocoes/simular`
- `POST /api/pdv/vendas`
- `GET /api/pdv/vendas`
- `POST /api/pdv/vendas/{venda_id}/cancelar`

### Promocoes

- `POST /api/promocoes`
- `GET /api/promocoes`
- `PUT /api/promocoes/{promocao_id}`
- `PATCH /api/promocoes/{promocao_id}/status`
- `DELETE /api/promocoes/{promocao_id}`

### Recomendacoes

- `POST /api/recomendacoes/gerar`
- `GET /api/recomendacoes/`
- `GET /api/recomendacoes/{recomendacao_id}`

### Backups

- `POST /api/backups/gerar`
- `GET /api/backups/`

### Relatorios

- `GET /api/relatorios/dashboard`
- `GET /api/relatorios/exportacoes/dashboard.csv`
- `GET /api/relatorios/exportacoes/dashboard.pdf`

## Fluxo rapido para demonstracao

1. Inicie backend e frontend com `.\run.ps1`.
2. Acesse `http://127.0.0.1:5173`.
3. Entre com `owner@example.com` e senha `12345678`.
4. Confira categorias, insumos, produtos, ficha tecnica e disponibilidade.
5. Acesse o PDV, selecione produtos, aplique adicionais/remocoes quando houver e finalize uma venda.
6. Confira a baixa de estoque e os relatorios gerenciais.
7. Crie ou simule promocoes e valide o desconto no carrinho do PDV.
8. Gere uma recomendacao para ver quais produtos priorizar pela margem, demanda, estoque e capacidade.
9. Consulte ou gere backups locais se estiver usando SQLite.

## Deploy

Consulte [DEPLOY.md](DEPLOY.md) para o passo a passo com Render, Vercel e Supabase.

Resumo das variaveis de deploy:

- Backend: `DATABASE_URL`, `CORS_ORIGINS`, `SECRET_KEY`.
- Frontend: `VITE_API_URL`.

## Observacoes

- O banco SQLite local nao e versionado.
- Backups locais tambem nao sao versionados.
- A documentacao interativa do backend fica em `/docs` enquanto o servidor FastAPI esta rodando.
- O solver da recomendacao usa PuLP; se o ambiente de deploy mudar, confirme se a instalacao do solver esta disponivel.
