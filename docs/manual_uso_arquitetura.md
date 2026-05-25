# Manual de Uso e Arquitetura - FoodFlow MVP

Este documento reflete a entrega de documentação descrita no acabamento do MVP.

## 1. Arquitetura do Sistema
O FoodFlow Gestão foi construído em arquitetura Monolito Modular. As responsabilidades são divididas entre front-end e back-end:

### Back-end (FastAPI)
- Utiliza **Python (FastAPI)** com **SQLite**, devido à praticidade em ser transportável. 
- Organizado na divisão modular `app/modules/`, onde cada vertente de negócios (ex: `pdv`, `produtos`, `recomendacoes`) possui seu ciclo fechado de Models, Schemas, Rotas e Services.
- A persistência é gerenciada via **SQLAlchemy**. A API responde predominantemente em JSON para o Front-End, e é inteiramente coberta pela validação do Pydantic.

### Front-end (React)
- Escrito em **React, Vite e TypeScript**.
- Gerencia o estado e se comunica com o Back-end via Axios ou Fetch direto, providenciando interface adaptável e orientada a toques para caixas.

## 2. Instruções de Uso e Papéis

O sistema é dividido pelos perfis operacionais:
- **OWNER**: Acesso total, incluindo configurações de negócio.
- **MANAGER**: Gestão do estoque, produtos, dashboards e recomendação. 
- **CASHIER**: Acesso primário à tela de PDV para realizar as vendas no dia-a-dia. 

Para operar o terminal de ponto de venda (PDV):
1. O Caixa, devidamente autenticado, escolhe as categorias e os itens.
2. Adiciona ou remove os modificadores permitidos pela ficha técnica do Insumo.
3. O estoque será reduzido automaticamente a cada finalização de pedido.

## 3. Entendendo as Recomendações por Programação Linear
O diferencial contido no sistema é o motor de cálculo utilizando a biblioteca `PuLP`.
1. **O que é**: O motor varre os itens e margens de lucro reais da Hamburgueria/Adega.
2. **Como Funciona**: Ele maximiza a função de lucro. Suas restrições baseiam-se em não consumir mais insumos do que existe na despensa (`estoque < total`), não exceder a capacidade máxima do restaurante em produzir itens no dia (`x <= 150/dia`) e não recomendar itens sem vendas projetadas (Demanda Diária).
3. **Resultado**: Os gerentes recebem uma estratégia clara do que focar em vender ou do que produzir para ter a máxima conversão monetária segura.

## 4. Backups de Segurança
Ao iniciar o servidor da API, automaticamente um *dump* de segurança é criado na pasta de backups do próprio servidor (`backend/backups_local/`). Nós mantemos em rodízio sempre as últimas 7 cópias, garantindo disponibilidade contra corrupção.

---

> _Esse manual cobre a base estrutural para a defesa do TCC / projeto MVP pelo aluno desenvolvedor._
