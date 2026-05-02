# FoodFlow Gestao - Especificacao do MVP

## 1. Visao Geral

O FoodFlow Gestao e um sistema web para pequenos negocios alimenticios, com foco inicial em hamburguerias, pastelarias e lanchonetes. O objetivo do MVP e substituir decisoes baseadas em "achismo" por controle operacional e recomendacao matematica.

O sistema tera um painel gerencial web e um PDV web responsivo para caixa/atendente. A interface do PDV deve ser adaptavel: confortavel em desktop/notebook e tambem otimizada para uso em telas touch quando disponiveis. O nucleo do MVP e vender produtos, baixar estoque automaticamente pela ficha tecnica, bloquear produtos indisponiveis, aplicar promocoes validas e gerar recomendacoes de producao usando Programacao Linear.

Este MVP nao sera um SaaS real. Ele atendera um unico estabelecimento, sem cobranca, sem multi-tenant e sem gestao de planos.

## 2. Publico-Alvo

O publico inicial sao micro e pequenos negocios do setor alimenticio, especialmente:

- hamburguerias;
- pastelarias;
- lanchonetes;
- pequenos negocios de comida pronta.

O sistema sera operado por:

- dono;
- gerente;
- caixa/atendente;
- aluno/desenvolvedor responsavel pela operacao tecnica local do MVP.

## 3. Stack Tecnologica

Backend:

- FastAPI;
- SQLite;
- JWT com refresh token;
- biblioteca de otimizacao para Programacao Linear, preferencialmente PuLP;
- exportacao CSV e PDF.

Frontend:

- React;
- Vite;
- TypeScript;
- interface em portugues;
- area gerencial e area PDV responsiva/adaptavel.

Arquitetura:

- Monolito Modular;
- frontend e backend separados;
- backend organizado por modulos de negocio em camadas simples.

## 4. Arquitetura Backend

Estrutura sugerida:

```txt
backend/
  app/
    core/
    database/
    modules/
      auth/
        models.py
        schemas.py
        repository.py
        service.py
        routes.py
      usuarios/
      categorias/
      insumos/
      produtos/
      estoque/
      pdv/
      promocoes/
      relatorios/
      recomendacoes/
      backups/
    shared/
    main.py
```

Responsabilidades:

- `core`: configuracoes globais, seguranca, JWT, dependencias comuns e inicializacao.
- `database`: conexao SQLite, sessao do banco, migracoes simples e dados iniciais.
- `modules`: modulos de negocio do sistema, separados por area funcional.
- `shared`: utilitarios, tipos, excecoes e regras reutilizadas entre modulos.
- `models.py`: modelos/tabelas do banco relacionados ao modulo.
- `schemas.py`: schemas de entrada e saida da API.
- `repository.py`: acesso ao banco e consultas do modulo.
- `service.py`: regras de negocio e orquestracao das operacoes.
- `routes.py`: rotas FastAPI do modulo.

As rotas da API nao devem conter regras de negocio importantes. Elas devem validar a requisicao, chamar servicos do modulo e retornar respostas. A logica principal deve ficar nos servicos, e o acesso ao banco deve ficar nos repositorios.

## 5. Arquitetura Frontend

Estrutura sugerida:

```txt
frontend/
  src/
    app/
    paginas/
    funcionalidades/
    componentes/
    servicos/
```

Areas principais:

- painel gerencial;
- PDV web responsivo/adaptavel.

Paginas gerenciais:

- Dashboard;
- Produtos;
- Categorias;
- Insumos;
- Estoque;
- Adicionais;
- Promocoes;
- Relatorios;
- Recomendacoes;
- Usuarios.

Tela PDV:

- categorias em destaque;
- produtos disponiveis;
- produtos bloqueados visualmente;
- carrinho;
- adicionais permitidos;
- remocoes permitidas;
- promocoes aplicadas automaticamente;
- forma de pagamento;
- finalizacao com numero de pedido;
- cancelamento com motivo obrigatorio.

## 6. Entidades Principais

Entidades previstas para o MVP:

- Usuario;
- Papel;
- Categoria;
- UnidadeMedida;
- ConversaoUnidade;
- Insumo;
- Produto;
- ItemFichaTecnica;
- Adicional;
- ItemFichaTecnicaAdicional;
- Promocao;
- Venda;
- ItemVenda;
- AdicionalItemVenda;
- RemocaoItemVenda;
- MovimentacaoEstoque;
- Recomendacao;
- ItemRecomendacao;
- LogAcesso;
- BackupBanco.

## 7. Papeis e Permissoes

Papeis:

- `OWNER`: acesso total.
- `MANAGER`: gestao, estoque, dashboard, PDV e relatorios.
- `CASHIER`: PDV e cancelamento de vendas com motivo.

Seguranca:

- senha com hash;
- access token JWT com duracao de 15 minutos;
- refresh token com duracao de 7 dias;
- rotas protegidas por papel;
- logs de login.

## 8. Regras de Produto e Ficha Tecnica

Regras:

- todo produto deve ter categoria obrigatoria;
- produto e vendido apenas por unidade;
- produto pode ser cadastrado como rascunho mesmo sem ficha tecnica completa;
- produto em rascunho nao deve aparecer como vendavel no PDV;
- produto em rascunho nao deve participar da recomendacao de producao;
- ficha tecnica pode usar quantidades fracionadas de insumos;
- produto sem ficha tecnica valida nao deve participar da recomendacao de producao;
- produto sem estoque suficiente deve ser bloqueado no PDV;
- alteracao de custo de insumo deve permitir recalculo do custo e da margem do produto.

Regra de dependencia com insumos:

- o sistema deve permitir criar um produto inicial mesmo que ainda nao exista insumo cadastrado;
- nesse caso, o produto deve ficar em status de rascunho ou incompleto;
- para ativar o produto como vendavel, deve existir ficha tecnica valida com pelo menos um insumo cadastrado;
- a ficha tecnica valida exige que todos os insumos referenciados existam, estejam ativos e tenham unidade de medida compativel;
- produtos sem ficha tecnica valida nao devem aparecer como disponiveis no PDV, nao devem baixar estoque e nao devem entrar na Programacao Linear;
- a interface deve orientar o usuario a cadastrar insumos antes de concluir a ficha tecnica do produto.

Cada item da ficha tecnica deve indicar:

- insumo;
- quantidade utilizada;
- unidade de medida;
- se o insumo pode ser removido no PDV.

## 9. Unidades e Conversoes

O sistema tera unidades padrao e unidades personalizadas.

Unidades padrao:

- kg;
- g;
- L;
- ml;
- unidade;
- pacote;
- caixa;
- duzia;
- lata;
- garrafa;
- sache;
- bandeja.

Conversoes automaticas:

- 1 kg = 1000 g;
- 1 L = 1000 ml.

Conversoes configuraveis:

- exemplo: 1 pacote de farinha = 5 kg;
- exemplo: 1 caixa = 12 unidades.

## 10. Estoque

O estoque sera controlado por insumo.

Tipos de movimentacao:

- entrada;
- saida por venda;
- ajuste manual;
- perda/desperdicio;
- devolucao por cancelamento.

Regras:

- vendas geram saidas automaticamente;
- cancelamentos geram devolucoes automaticamente;
- perdas/desperdicios exigem motivo obrigatorio;
- ajustes manuais podem ter observacao opcional;
- o gerente pode confirmar manualmente que o estoque foi conferido no dia.

A confiabilidade do estoque influencia o Fator de Recomendacao.

## 11. PDV

O PDV sera usado por caixa/atendente, nao pelo cliente final. Ele deve funcionar bem como tela web tradicional e tambem como interface touch, com botoes grandes e fluxo rapido.

Fluxo basico:

1. caixa seleciona categoria;
2. caixa seleciona produto disponivel;
3. caixa escolhe adicionais permitidos;
4. caixa escolhe remocoes permitidas;
5. sistema aplica promocoes validas;
6. caixa escolhe forma de pagamento;
7. sistema finaliza venda;
8. sistema gera numero do pedido;
9. sistema baixa estoque automaticamente.

Numero do pedido:

- formato `YYYYMMDD-001`;
- sequencial por data.

Pagamento:

- apenas registro da forma de pagamento;
- sem integracao real com PIX, cartao ou banco no MVP.

Nao entra no MVP:

- tela de cozinha;
- status de preparo;
- abertura e fechamento de caixa.

## 12. Adicionais e Remocoes

Adicionais:

- cadastro proprio;
- preco extra;
- ficha tecnica propria;
- status ativo/inativo;
- limitados por categoria de produto.

Remocoes:

- so podem ocorrer para insumos marcados como removiveis na ficha tecnica;
- reduzem a baixa de estoque daquele insumo;
- nao geram desconto automatico no MVP.

Observacoes:

- podem ser adicionadas ao item do pedido;
- nao alteram preco nem estoque.

## 13. Promocoes

Promocoes devem ser cadastradas previamente.

Tipos:

- promocao por produto especifico;
- promocao por categoria;
- promocao na venda inteira.

Prioridade:

1. promocao de produto especifico;
2. promocao de categoria;
3. promocao de venda inteira;
4. se houver empate no mesmo nivel, aplicar a maior economia.

Campos principais:

- nome;
- tipo;
- alvo da promocao;
- tipo de desconto: valor fixo ou porcentagem;
- data/hora de inicio;
- data/hora de fim;
- status ativo/inativo.

## 14. Cancelamento de Venda

Regras:

- `OWNER`, `MANAGER` e `CASHIER` podem cancelar venda;
- cancelamento exige motivo obrigatorio;
- venda nao deve ser apagada;
- status da venda muda para cancelada;
- estoque e devolvido automaticamente;
- relatorios devem desconsiderar vendas canceladas do faturamento.

## 15. Dashboard e Relatorios

Indicadores do dashboard:

- vendas do dia;
- faturamento do dia;
- produtos bloqueados;
- alertas de estoque;
- produtos mais vendidos;
- margem estimada;
- perdas/desperdicios;
- promocoes ativas;
- ticket medio;
- formas de pagamento;
- recomendacao de producao.

Filtros:

- hoje;
- ultimos 7 dias;
- ultimos 30 dias;
- intervalo personalizado.

Exportacoes:

- CSV;
- PDF.

As exportacoes devem refletir os dados filtrados no dashboard/relatorio.

## 16. Programacao Linear

A Programacao Linear entra no MVP como modulo operacional.

Objetivo:

- recomendar producao equilibrando lucro e demanda.

Variaveis de decisao:

```txt
x_produto_1, x_produto_2, x_produto_3...
```

Funcao objetivo:

```txt
maximizar soma(x_produto * margem_unitaria)
```

Restricoes:

```txt
uso_de_insumo <= estoque_disponivel
x_produto <= demanda_prevista
soma(x_produtos) <= capacidade_diaria_cozinha
x_produto >= 0
x_produto inteiro
```

Margem unitaria:

```txt
preco_venda - custo_ficha_tecnica
```

Demanda prevista:

- usar ultimos 7 dias se houver dados suficientes;
- se nao houver, usar ultimos 30 dias;
- se ainda nao houver, usar demanda esperada diaria cadastrada no produto.

Capacidade da cozinha:

- medida como quantidade total de produtos por dia;
- exemplo: ate 150 itens/dia.

Periodo recomendado:

- dia atual;
- dia seguinte;
- prioridade do MVP: dia atual.

Resultado exibido:

- produto;
- quantidade recomendada;
- lucro estimado;
- demanda considerada;
- insumo limitante;
- capacidade utilizada;
- Fator de Recomendacao;
- explicacao simples.

Historico:

- salvar recomendacoes geradas;
- registrar data/hora;
- periodo recomendado;
- produtos e quantidades;
- lucro estimado;
- demanda considerada;
- capacidade usada;
- insumos limitantes;
- fator de confianca;
- usuario que gerou/recalculou.

A recomendacao sera apenas leitura no MVP. O usuario nao podera ajustar e salvar uma versao modificada.

## 17. Fator de Recomendacao

O Fator de Recomendacao mede a confianca da recomendacao, em escala de 0 a 10.

Ele nao representa lucro, atratividade ou risco isolado. Ele responde:

```txt
O quanto o usuario pode confiar nesta recomendacao?
```

Composicao sugerida:

- historico de vendas: ate 2 pontos;
- ficha tecnica completa: ate 2 pontos;
- estoque atualizado: ate 2 pontos;
- estabilidade da demanda: ate 2 pontos;
- baixo risco de ruptura: ate 2 pontos.

Estoque atualizado considera:

- movimentacoes recentes;
- confirmacao manual diaria do gerente.

## 18. Backup Local

O sistema deve gerar backup automatico local do SQLite.

Regras:

- manter os ultimos 7 backups;
- remover backups mais antigos;
- backup pode ocorrer ao iniciar o backend ou por agendamento simples local.

## 19. Requisitos Nao Funcionais

Desempenho esperado:

- pequeno negocio local;
- ate 3 usuarios simultaneos;
- poucas centenas de vendas por dia.

Confiabilidade:

- historico de movimentacoes de estoque;
- vendas canceladas nao sao apagadas;
- backups locais automaticos;
- logs de acesso.

Manutencao:

- aluno/desenvolvedor opera a parte tecnica;
- interface deve ser clara para dono, gerente e caixa;
- codigo e documentacao em portugues para facilitar entendimento academico.

## 20. Decisoes Registradas

- O MVP sera implementavel e funcional, nao apenas conceitual.
- Backend sera FastAPI.
- Banco sera SQLite.
- Frontend recomendado sera React + Vite + TypeScript.
- O sistema atendera um unico estabelecimento.
- Havera login com papeis.
- PDV sera usado por caixa/atendente em interface web responsiva/adaptavel.
- Pagamentos serao apenas registrados.
- Descontos serao promocoes previamente cadastradas.
- Categorias de produto serao obrigatorias.
- Unidades de medida terao lista padrao e personalizacao.
- Conversoes basicas e configuraveis serao suportadas.
- Estoque tera historico de movimentacoes.
- Perdas/desperdicios exigem motivo.
- Produtos serao vendidos por unidade.
- Produtos poderao ser criados como rascunho sem ficha tecnica completa.
- Produto so sera vendavel quando tiver ficha tecnica valida com pelo menos um insumo cadastrado.
- Adicionais, remocoes e observacoes entram no MVP.
- Adicionais terao cadastro proprio.
- Remocoes afetam baixa de estoque.
- Apenas insumos marcados como removiveis podem ser removidos.
- Adicionais serao limitados por categoria.
- Toda venda gera numero de pedido no formato `YYYYMMDD-001`.
- Nao havera tela de cozinha no MVP.
- Dashboard tera indicadores completos.
- Relatorios terao filtros por periodo.
- Exportacao PDF e CSV entra no MVP.
- Cancelamento exige motivo e devolve estoque.
- Nao havera abertura/fechamento de caixa.
- Access token durara 15 minutos.
- Refresh token durara 7 dias.
- Programacao Linear sera operacional no MVP.
- Objetivo do motor sera equilibrar lucro e demanda.
- Demanda inicial sem historico vira campo manual no produto.
- Capacidade sera geral por quantidade total de produtos/dia.
- Fator de Recomendacao mede confianca.
- Recomendacoes serao salvas em historico.
- O solver usara biblioteca pronta, com explicacao academica do Simplex.
- Recomendacao sera apenas leitura.
- Arquitetura sera Monolito Modular.
- Modulos, documentacao e interface usarao portugues.

## 21. Fora do Escopo do MVP

- SaaS real;
- cobranca;
- planos de assinatura;
- multi-tenant;
- integracao real com PIX/cartao;
- autoatendimento pelo cliente;
- tela de cozinha;
- status de preparo;
- abertura e fechamento de caixa;
- ajuste manual da recomendacao;
- microsservicos.

## 22. Blocos de Implementacao

O MVP deve ser construido em blocos incrementais. Cada bloco deve terminar com comportamento funcional validavel, mesmo que a interface ainda esteja simples.

### Bloco 1 - Fundacao tecnica

Objetivo:

- criar estrutura base do backend e frontend;
- configurar SQLite;
- organizar a arquitetura modular em camadas simples;
- preparar ambiente de desenvolvimento.

Entregas:

- backend FastAPI inicial;
- frontend React + Vite + TypeScript inicial;
- conexao com banco SQLite;
- estrutura de pastas definida;
- configuracao basica de variaveis de ambiente;
- rota de saude da API.

Criterios de aceite:

- backend inicia localmente;
- frontend inicia localmente;
- API responde uma rota simples;
- projeto ja segue a separacao por modulos, com rotas, schemas, repositorios e servicos.

### Bloco 2 - Autenticacao, usuarios e permissoes

Objetivo:

- permitir acesso protegido ao sistema por usuario e papel.

Entregas:

- cadastro e login de usuario;
- hash de senha;
- JWT com access token e refresh token;
- papeis `OWNER`, `MANAGER` e `CASHIER`;
- protecao de rotas por papel;
- log de acesso.

Criterios de aceite:

- usuario consegue fazer login;
- rotas protegidas recusam acesso sem token;
- permissoes bloqueiam acoes indevidas;
- login gera registro em log.

### Bloco 3 - Cadastros operacionais base

Objetivo:

- criar os cadastros necessarios antes da venda.

Entregas:

- categorias;
- unidades de medida;
- conversoes de unidade;
- insumos;
- estoque inicial por insumo.

Criterios de aceite:

- gerente consegue cadastrar categorias, unidades e insumos;
- conversoes automaticas de kg/g e L/ml funcionam;
- conversoes configuraveis podem ser cadastradas;
- insumo possui unidade, custo e estoque controlavel.

### Bloco 4 - Produtos, ficha tecnica e disponibilidade

Objetivo:

- permitir criar produtos e controlar quando eles podem ser vendidos.

Entregas:

- cadastro de produto;
- status de produto como rascunho/incompleto, ativo e inativo;
- ficha tecnica por produto;
- validacao de ficha tecnica com insumos;
- calculo de custo e margem;
- regra de disponibilidade por estoque.

Criterios de aceite:

- produto pode ser criado como rascunho sem ficha tecnica completa;
- produto sem ficha tecnica valida nao aparece como vendavel no PDV;
- produto so pode ficar ativo/vendavel quando tiver ficha tecnica valida com pelo menos um insumo;
- alteracao no custo do insumo permite recalcular custo e margem do produto;
- produto sem estoque suficiente fica bloqueado.

### Bloco 5 - Adicionais, remocoes e observacoes

Objetivo:

- completar as variacoes permitidas no item vendido.

Entregas:

- cadastro de adicionais;
- ficha tecnica de adicional;
- limite de adicionais por categoria;
- marcacao de insumos removiveis na ficha tecnica;
- observacoes no item do pedido.

Criterios de aceite:

- adicional ativo pode ser aplicado a produto de categoria permitida;
- adicional aumenta preco e baixa estoque conforme ficha tecnica;
- remocao so aparece para insumos marcados como removiveis;
- remocao reduz a baixa de estoque;
- observacao nao altera preco nem estoque.

### Bloco 6 - PDV e venda

Objetivo:

- permitir operacao basica de caixa/atendente.

Entregas:

- tela PDV responsiva/adaptavel;
- listagem por categorias;
- produtos disponiveis e bloqueados visualmente;
- carrinho;
- forma de pagamento;
- finalizacao de venda;
- numero de pedido `YYYYMMDD-001`;
- baixa automatica de estoque.

Criterios de aceite:

- caixa consegue montar e finalizar venda;
- venda gera numero sequencial por data;
- estoque e baixado automaticamente;
- produto indisponivel nao pode ser vendido;
- PDV funciona em desktop e em telas touch.

### Bloco 7 - Promocoes

Objetivo:

- aplicar descontos cadastrados de forma automatica e previsivel.

Entregas:

- cadastro de promocoes;
- promocao por produto;
- promocao por categoria;
- promocao na venda inteira;
- aplicacao por prioridade;
- calculo de maior economia em empate.

Criterios de aceite:

- promocoes ativas dentro do periodo sao aplicadas;
- prioridade produto > categoria > venda inteira e respeitada;
- empate no mesmo nivel aplica maior economia;
- promocao inativa ou fora do periodo nao altera venda.

### Bloco 8 - Cancelamento e movimentacoes de estoque

Objetivo:

- garantir rastreabilidade operacional.

Entregas:

- cancelamento com motivo obrigatorio;
- status de venda cancelada;
- devolucao automatica de estoque;
- movimentacoes de entrada, saida por venda, ajuste, perda e devolucao;
- confirmacao diaria de estoque conferido.

Criterios de aceite:

- venda cancelada nao e apagada;
- cancelamento devolve estoque automaticamente;
- perda/desperdicio exige motivo;
- relatorios desconsideram vendas canceladas no faturamento;
- movimentacoes ficam historicamente registradas.

### Bloco 9 - Dashboard, relatorios e exportacoes

Objetivo:

- dar visao gerencial dos principais indicadores.

Entregas:

- dashboard;
- filtros por periodo;
- indicadores comerciais e operacionais;
- exportacao CSV;
- exportacao PDF.

Criterios de aceite:

- indicadores refletem filtros selecionados;
- vendas canceladas nao entram no faturamento;
- exportacoes usam os mesmos filtros da tela;
- produtos bloqueados e alertas de estoque aparecem no painel.

### Bloco 10 - Recomendacao por Programacao Linear

Objetivo:

- gerar recomendacao operacional de producao com base em margem, demanda, estoque e capacidade.

Entregas:

- calculo de demanda prevista;
- calculo de margem unitaria;
- restricoes por estoque, demanda e capacidade;
- integracao com solver;
- Fator de Recomendacao;
- historico de recomendacoes.

Criterios de aceite:

- apenas produtos ativos e com ficha tecnica valida participam da recomendacao;
- produtos sem insumos validos ficam fora da Programacao Linear;
- resultado mostra quantidade, lucro estimado, demanda, insumo limitante, capacidade usada e fator de confianca;
- recomendacao gerada e salva em historico;
- usuario nao consegue editar e salvar recomendacao modificada no MVP.

### Bloco 11 - Backup local e acabamento do MVP

Objetivo:

- fechar confiabilidade basica e preparar apresentacao academica.

Entregas:

- backup automatico local do SQLite;
- retencao dos ultimos 7 backups;
- revisao de mensagens da interface;
- ajustes de responsividade;
- documentacao final de uso e arquitetura.

Criterios de aceite:

- backups sao gerados automaticamente;
- backups antigos sao removidos mantendo os ultimos 7;
- interface esta compreensivel para dono, gerente e caixa;
- documentacao explica arquitetura, regras principais e uso da Programacao Linear.

## 23. Ordem Recomendada de Construcao

Ordem tecnica recomendada:

1. Fundacao tecnica.
2. Autenticacao, usuarios e permissoes.
3. Cadastros operacionais base.
4. Produtos, ficha tecnica e disponibilidade.
5. Adicionais, remocoes e observacoes.
6. PDV e venda.
7. Cancelamento e movimentacoes de estoque.
8. Promocoes.
9. Dashboard, relatorios e exportacoes.
10. Recomendacao por Programacao Linear.
11. Backup local e acabamento do MVP.

Promocoes podem ser feitas antes de cancelamento se a prioridade for demonstrar o fluxo comercial completo no PDV. Para reduzir risco tecnico, a recomendacao por Programacao Linear deve vir depois que produtos, ficha tecnica, estoque e vendas ja estiverem funcionando.
