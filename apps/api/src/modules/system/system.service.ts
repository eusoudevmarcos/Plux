import { prisma } from "../../lib/prisma.js";

type ReadinessLevel = "OK" | "ATTENTION" | "BLOCKED";

function item(level: ReadinessLevel, title: string, detail: string) {
  return { level, title, detail };
}

function scoreLevel(items: Array<{ level: ReadinessLevel }>): ReadinessLevel {
  if (items.some((entry) => entry.level === "BLOCKED")) return "BLOCKED";
  if (items.some((entry) => entry.level === "ATTENTION")) return "ATTENTION";
  return "OK";
}

export async function getBetaReadiness(userId: string, options: { storeId?: string | null }) {
  const stores = await prisma.store.findMany({
    where: { ownerId: userId },
    orderBy: [{ active: "desc" }, { createdAt: "asc" }],
  });
  const store = options.storeId
    ? stores.find((candidate) => candidate.id === options.storeId)
    : stores.find((candidate) => candidate.active) ?? stores[0] ?? null;

  if (options.storeId && !store) {
    throw new Error("Loja nao encontrada para este usuario.");
  }

  const [
    ingredientCount,
    taxClassificationCount,
    productCount,
    saleCount,
    purchaseCount,
    openPayablesCount,
    overduePayablesCount,
    openCashRegister,
    fiscalDocumentCount,
  ] = await Promise.all([
    prisma.ingredient.count(),
    prisma.taxClassification.count(),
    store
      ? prisma.product.count({
          where: {
            active: true,
            OR: [{ storeId: store.id }, { storeId: null }],
            taxProfile: { taxRegime: store.taxRegime },
          },
        })
      : Promise.resolve(0),
    store ? prisma.sale.count({ where: { storeId: store.id, status: "COMPLETED" } }) : Promise.resolve(0),
    store ? prisma.purchase.count({ where: { storeId: store.id, status: "POSTED" } }) : Promise.resolve(0),
    store ? prisma.accountPayable.count({ where: { storeId: store.id, status: "OPEN" } }) : Promise.resolve(0),
    store
      ? prisma.accountPayable.count({ where: { storeId: store.id, status: "OPEN", dueDate: { lt: new Date() } } })
      : Promise.resolve(0),
    store
      ? prisma.cashRegister.findFirst({ where: { storeId: store.id, status: "OPEN" }, orderBy: { openedAt: "desc" } })
      : Promise.resolve(null),
    store ? prisma.fiscalDocument.count({ where: { storeId: store.id } }) : Promise.resolve(0),
  ]);

  const checks = [
    item("OK", "API", "Fastify respondendo e autenticacao ativa."),
    item(process.env.DATABASE_URL ? "OK" : "BLOCKED", "Banco de dados", "DATABASE_URL precisa apontar para o PostgreSQL Render ou local."),
    item(stores.length > 0 ? "OK" : "BLOCKED", "Cadastro de loja", stores.length > 0 ? `${stores.length} loja(s) cadastrada(s).` : "Cadastre a primeira loja antes de operar."),
    item(store ? "OK" : "BLOCKED", "Loja ativa", store ? `${store.tradeName} em ${store.state}, regime ${store.taxRegime}.` : "Selecione ou cadastre uma loja."),
    item(ingredientCount > 0 ? "OK" : "BLOCKED", "Ingredientes", `${ingredientCount} ingrediente(s) disponiveis para ficha tecnica.`),
    item(productCount > 0 ? "OK" : "BLOCKED", "Produtos por regime", `${productCount} produto(s) ativos para o regime da loja.`),
    item(taxClassificationCount > 0 ? "OK" : "BLOCKED", "CST e cClassTrib", `${taxClassificationCount} classificacao(oes) carregadas.`),
    item(openCashRegister ? "OK" : "ATTENTION", "Caixa", openCashRegister ? "Caixa aberto para venda." : "Abra o caixa antes de vender."),
    item(saleCount > 0 ? "OK" : "ATTENTION", "Vendas reais", `${saleCount} venda(s) concluida(s) na loja.`),
    item(purchaseCount > 0 ? "OK" : "ATTENTION", "Compras e custo medio", `${purchaseCount} compra(s) lancada(s) na loja.`),
    item(
      overduePayablesCount > 0 ? "ATTENTION" : "OK",
      "Contas a pagar",
      overduePayablesCount > 0
        ? `${overduePayablesCount} conta(s) vencida(s); ${openPayablesCount} aberta(s).`
        : `${openPayablesCount} conta(s) aberta(s), sem vencidas.`,
    ),
    item(
      "ATTENTION",
      "Fiscal documental",
      fiscalDocumentCount > 0
        ? `${fiscalDocumentCount} documento(s) preparado(s). Transmissao SEFAZ depende de certificado e homologacao.`
        : "API de preparacao fiscal pronta; gere documentos a partir de vendas/compras e homologue SEFAZ depois.",
    ),
    item(
      "ATTENTION",
      "Backup Render",
      "Runbook definido em docs/render-backup-restore.md; confirme rotina operacional antes da beta publica.",
    ),
  ];

  return {
    generatedAt: new Date().toISOString(),
    status: scoreLevel(checks),
    store: store
      ? {
          id: store.id,
          tradeName: store.tradeName,
          taxRegime: store.taxRegime,
          state: store.state,
        }
      : null,
    checks,
  };
}
