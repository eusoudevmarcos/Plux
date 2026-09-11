# Comparativo: pasta local completa vs GitHub oficial

Data: 2026-09-11.

## Estado encontrado

O repositório GitHub oficial (`eusoudevmarcos/Plux`) estava no commit `f017adf`, com foco em:

- login/cadastro;
- Aura/admin de cliente;
- lojas;
- ingredientes;
- produtos com composição;
- motor fiscal IBS/CBS com `cClassTrib`;
- taxa de preparo;
- financeiro de produto;
- deploy Render/Vercel.

A pasta local `C:\Users\MARCOS\Documents\SISTEMAS\plux` continha um MVP operacional mais amplo, com:

- PDV;
- vendas;
- baixa de estoque;
- caixa;
- compras;
- fornecedores;
- XML de NF-e;
- relatórios;
- usuários;
- dashboard operacional.

## Decisão de integração

O GitHub foi mantido como fonte oficial porque já contém a modelagem fiscal mais alinhada à estratégia tributária da Plux: `cClassTrib`, IBS/CBS, taxa de preparo e lojas.

As melhorias operacionais serão migradas em blocos para não perder o trabalho fiscal existente.

## Bloco integrado nesta branch

Branch: `integrate-operational-mvp`.

Incluído:

- modelos Prisma de vendas, itens de venda, pagamentos, caixa, movimentos de caixa e movimentos de estoque;
- migration `20260911190000_add_sales_cash_stock`;
- API `/sales/checkout` com transação de venda + baixa de estoque;
- API `/sales/:id/cancel` com estorno de estoque;
- API `/cash-register` para abrir, movimentar e fechar caixa;
- API `/stock/movements` para auditoria de estoque;
- tela `/caixa` com carrinho e finalização de venda real.

## Bloco integrado em seguida

Branch: `cash-register-ui-flow`.

Incluído:

- tela `/caixa` com abertura de caixa por loja ativa;
- bloqueio de venda sem caixa aberto;
- sangria e suprimento direto no PDV;
- saldo esperado calculado por movimentos financeiros do caixa;
- fechamento com saldo contado e diferença apurada;
- listas operacionais de últimas vendas e movimentos.

## Próximos blocos recomendados

1. Compras e fornecedores, com atualização de custo do ingrediente.
2. Importação de XML de NF-e e conversão para compra/entrada de estoque.
3. Relatórios completos de vendas, CMV, estoque e DRE.
4. Dashboard usando vendas reais, estoque crítico e margem por produto.
5. Gestão de usuários por cliente/loja.
