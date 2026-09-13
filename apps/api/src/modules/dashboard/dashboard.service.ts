import { prisma } from "../../lib/prisma.js";
import { roundMoney } from "../tax/tax-rates.js";

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

function criticalLimit(unitMeasure: string) {
  if (unitMeasure === "un") return 10;
  if (unitMeasure === "ml") return 1000;
  return 1000;
}

function criticalSeverity(current: number, limit: number) {
  if (current <= 0) return "BLOCKED";
  if (current <= limit * 0.5) return "CRITICAL";
  return "LOW";
}

async function assertStoreOwner(userId: string, storeId: string) {
  const store = await prisma.store.findFirst({ where: { id: storeId, ownerId: userId } });

  if (!store) {
    throw new Error("Loja nao encontrada para este usuario.");
  }

  return store;
}

export async function getCriticalStockReport(userId: string, options: { storeId: string }) {
  await assertStoreOwner(userId, options.storeId);

  const ingredients = await prisma.ingredient.findMany({
    orderBy: [{ stockCurrent: "asc" }, { name: "asc" }],
  });

  return ingredients
    .map((ingredient) => {
      const current = toNumber(ingredient.stockCurrent);
      const unitCost = toNumber(ingredient.unitCost);
      const limit = criticalLimit(ingredient.unitMeasure);

      return {
        id: ingredient.id,
        name: ingredient.name,
        unitMeasure: ingredient.unitMeasure,
        stockCurrent: current,
        unitCost,
        stockValue: roundMoney(current * unitCost),
        criticalLimit: limit,
        severity: criticalSeverity(current, limit),
        ncm: ingredient.ncm,
      };
    })
    .filter((ingredient) => ingredient.stockCurrent <= ingredient.criticalLimit)
    .sort((a, b) => a.stockCurrent / a.criticalLimit - b.stockCurrent / b.criticalLimit);
}

export async function getDashboardSummary(userId: string, options: { storeId: string }) {
  const store = await assertStoreOwner(userId, options.storeId);
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    salesAggregate,
    salesCount,
    purchasesAggregate,
    purchasesCount,
    openPayablesAggregate,
    openPayablesCount,
    overduePayablesCount,
    ingredients,
    products,
    recentMovements,
    openCashRegister,
    fiscalDocumentsCount,
    criticalStock,
  ] = await Promise.all([
    prisma.sale.aggregate({
      where: { storeId: store.id, status: "COMPLETED", closedAt: { gte: since } },
      _sum: { total: true, totalCost: true },
    }),
    prisma.sale.count({ where: { storeId: store.id, status: "COMPLETED", closedAt: { gte: since } } }),
    prisma.purchase.aggregate({
      where: { storeId: store.id, status: "POSTED", issueDate: { gte: since } },
      _sum: { total: true },
    }),
    prisma.purchase.count({ where: { storeId: store.id, status: "POSTED", issueDate: { gte: since } } }),
    prisma.accountPayable.aggregate({
      where: { storeId: store.id, status: "OPEN" },
      _sum: { amount: true },
    }),
    prisma.accountPayable.count({ where: { storeId: store.id, status: "OPEN" } }),
    prisma.accountPayable.count({ where: { storeId: store.id, status: "OPEN", dueDate: { lt: new Date() } } }),
    prisma.ingredient.findMany({ include: { taxClassification: true } }),
    prisma.product.findMany({
      where: {
        active: true,
        OR: [{ storeId: store.id }, { storeId: null }],
        taxProfile: { taxRegime: store.taxRegime },
      },
      include: { ingredients: true, taxProfile: true },
    }),
    prisma.stockMovement.findMany({
      where: { storeId: store.id },
      include: { ingredient: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.cashRegister.findFirst({
      where: { storeId: store.id, status: "OPEN" },
      orderBy: { openedAt: "desc" },
    }),
    prisma.fiscalDocument.count({ where: { storeId: store.id } }),
    getCriticalStockReport(userId, { storeId: store.id }),
  ]);

  const salesTotal = toNumber(salesAggregate._sum.total);
  const salesCost = toNumber(salesAggregate._sum.totalCost);
  const stockValue = ingredients.reduce(
    (sum, ingredient) => sum + toNumber(ingredient.unitCost) * toNumber(ingredient.stockCurrent),
    0,
  );
  const averageCmvPercent =
    products.length > 0
      ? products.reduce((sum, product) => {
          const cmv = product.ingredients.reduce((itemSum, item) => itemSum + toNumber(item.totalCostSnapshot), 0);
          const salePrice = toNumber(product.salePrice);
          return sum + (salePrice > 0 ? (cmv / salePrice) * 100 : 0);
        }, 0) / products.length
      : 0;

  const taxReviewCount =
    ingredients.filter((ingredient) => ingredient.taxConfidence !== "APPROVED").length +
    products.filter((product) => product.taxProfile?.requiresLegalReview).length;

  return {
    store: {
      id: store.id,
      tradeName: store.tradeName,
      taxRegime: store.taxRegime,
      state: store.state,
    },
    period: {
      label: "Últimos 30 dias",
      since: since.toISOString(),
    },
    summary: {
      salesTotal: roundMoney(salesTotal),
      salesCost: roundMoney(salesCost),
      salesGrossProfit: roundMoney(salesTotal - salesCost),
      salesCount,
      purchasesTotal: roundMoney(toNumber(purchasesAggregate._sum.total)),
      purchasesCount,
      openPayablesTotal: roundMoney(toNumber(openPayablesAggregate._sum.amount)),
      openPayablesCount,
      overduePayablesCount,
      stockValue: roundMoney(stockValue),
      ingredientsCount: ingredients.length,
      productsCount: products.length,
      averageCmvPercent: roundMoney(averageCmvPercent),
      taxReviewCount,
      criticalStockCount: criticalStock.length,
      fiscalDocumentsCount,
    },
    cashRegister: openCashRegister
      ? {
          id: openCashRegister.id,
          status: openCashRegister.status,
          openedAt: openCashRegister.openedAt,
          openingBalance: toNumber(openCashRegister.openingBalance),
        }
      : null,
    criticalStock: criticalStock.slice(0, 10),
    recentStockMovements: recentMovements.map((movement) => ({
      id: movement.id,
      ingredientName: movement.ingredient.name,
      type: movement.type,
      origin: movement.origin,
      quantity: toNumber(movement.quantity),
      unitMeasure: movement.ingredient.unitMeasure,
      totalCost: movement.totalCost ? toNumber(movement.totalCost) : null,
      createdAt: movement.createdAt,
      notes: movement.notes,
    })),
  };
}
