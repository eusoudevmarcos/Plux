import type { Product, ProductIngredient } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { roundMoney } from "../tax/tax-rates.js";

type ProductWithIngredients = Product & {
  ingredients: ProductIngredient[];
};

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

function percent(part: number, total: number) {
  return total > 0 ? roundMoney((part / total) * 100) : 0;
}

function buildProductRow(product: ProductWithIngredients) {
  const salePrice = toNumber(product.salePrice);
  const ingredientCost = product.ingredients.reduce((sum, item) => sum + toNumber(item.totalCostSnapshot), 0);
  const preparationFee = Math.min(toNumber(product.preparationFee), salePrice);
  const ingredientRevenueBase = Math.max(salePrice - preparationFee, 0);
  const grossProfit = salePrice - ingredientCost;

  return {
    productId: product.id,
    name: product.name,
    sku: product.sku,
    category: product.category,
    active: product.active,
    salePrice: roundMoney(salePrice),
    ingredientCost: roundMoney(ingredientCost),
    ingredientRevenueBase: roundMoney(ingredientRevenueBase),
    preparationFee: roundMoney(preparationFee),
    grossProfit: roundMoney(grossProfit),
    grossMarginPercent: percent(grossProfit, salePrice),
    cmvPercent: percent(ingredientCost, salePrice),
    markup: ingredientCost > 0 ? roundMoney(salePrice / ingredientCost) : null,
  };
}

export async function getProductFinancialReport(options: { storeId?: string | null } = {}) {
  const store = options.storeId
    ? await prisma.store.findUnique({
        where: { id: options.storeId },
      })
    : null;

  const [companyProfile, products] = await Promise.all([
    prisma.companyProfile.findUnique({ where: { id: "main" } }),
    prisma.product.findMany({
      where: store
        ? {
            OR: [{ storeId: store.id }, { storeId: null }],
            taxProfile: {
              taxRegime: store.taxRegime,
            },
          }
        : undefined,
      include: { ingredients: true },
      orderBy: [{ active: "desc" }, { category: "asc" }, { name: "asc" }],
    }),
  ]);

  const rows = products.map(buildProductRow);
  const activeRows = rows.filter((row) => row.active);
  const totalSaleValue = rows.reduce((sum, row) => sum + row.salePrice, 0);
  const totalIngredientCost = rows.reduce((sum, row) => sum + row.ingredientCost, 0);
  const totalPreparationFee = rows.reduce((sum, row) => sum + row.preparationFee, 0);
  const totalGrossProfit = rows.reduce((sum, row) => sum + row.grossProfit, 0);

  const categoryMap = new Map<
    string,
    {
      category: string;
      productsCount: number;
      saleValue: number;
      ingredientCost: number;
      preparationFee: number;
      grossProfit: number;
    }
  >();

  for (const row of rows) {
    const current =
      categoryMap.get(row.category) ??
      {
        category: row.category,
        productsCount: 0,
        saleValue: 0,
        ingredientCost: 0,
        preparationFee: 0,
        grossProfit: 0,
      };

    current.productsCount += 1;
    current.saleValue += row.salePrice;
    current.ingredientCost += row.ingredientCost;
    current.preparationFee += row.preparationFee;
    current.grossProfit += row.grossProfit;
    categoryMap.set(row.category, current);
  }

  const categories = Array.from(categoryMap.values()).map((category) => ({
    ...category,
    saleValue: roundMoney(category.saleValue),
    ingredientCost: roundMoney(category.ingredientCost),
    preparationFee: roundMoney(category.preparationFee),
    grossProfit: roundMoney(category.grossProfit),
    grossMarginPercent: percent(category.grossProfit, category.saleValue),
    cmvPercent: percent(category.ingredientCost, category.saleValue),
  }));

  return {
    companyProfile,
    store,
    summary: {
      productsCount: rows.length,
      activeProductsCount: activeRows.length,
      inactiveProductsCount: rows.length - activeRows.length,
      totalSaleValue: roundMoney(totalSaleValue),
      totalIngredientCost: roundMoney(totalIngredientCost),
      totalPreparationFee: roundMoney(totalPreparationFee),
      totalGrossProfit: roundMoney(totalGrossProfit),
      grossMarginPercent: percent(totalGrossProfit, totalSaleValue),
      cmvPercent: percent(totalIngredientCost, totalSaleValue),
    },
    categories,
    rows,
  };
}
