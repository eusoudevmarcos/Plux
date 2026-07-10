import type { Prisma, TaxClassification } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { calculateIbsCbsLine, roundMoney } from "../tax/tax-rates.js";
import type { ProductCreateFullInput } from "./products.schema.js";

type TxClient = Prisma.TransactionClient;

async function resolveTaxClassification(
  tx: TxClient,
  options: {
    id?: string | null;
    cClassTrib?: string | null;
    cstIbsCbs?: string | null;
    fallbackCClassTrib?: string;
    label: string;
  },
) {
  const where = options.id
    ? { id: options.id }
    : { cClassTrib: options.cClassTrib ?? options.fallbackCClassTrib };

  if (!where.id && !where.cClassTrib) {
    throw new Error(`Classificação tributária obrigatória para ${options.label}.`);
  }

  const taxClassification = await tx.taxClassification.findFirst({
    where: {
      ...where,
      ...(options.cstIbsCbs ? { cstIbsCbs: options.cstIbsCbs } : {}),
    },
  });

  if (!taxClassification) {
    throw new Error(`Classificação tributária não encontrada para ${options.label}.`);
  }

  return taxClassification;
}

function toNumber(value: Prisma.Decimal | number) {
  return Number(value);
}

function buildSplitSimulation(input: {
  salePrice: number;
  preparationFee: number;
  fiscalStrategy: ProductCreateFullInput["fiscalStrategy"];
  composition: Array<{
    name: string;
    cost: number;
    taxClassification: TaxClassification | null;
  }>;
  productTaxClassification: TaxClassification;
  preparationFeeTaxClassification: TaxClassification;
}) {
  if (input.fiscalStrategy === "COMBINED_FOOD_SERVICE") {
    const line = calculateIbsCbsLine({
      label: "Produto final",
      base: input.salePrice,
      cstIbsCbs: input.productTaxClassification.cstIbsCbs,
      cClassTrib: input.productTaxClassification.cClassTrib,
      pRedIbs: toNumber(input.productTaxClassification.pRedIbs),
      pRedCbs: toNumber(input.productTaxClassification.pRedCbs),
    });

    return {
      strategy: input.fiscalStrategy,
      taxableLines: [line],
      totals: {
        ibsValue: line.ibsValue,
        cbsValue: line.cbsValue,
        totalTax: line.totalTax,
        taxableBase: roundMoney(line.ibsBase + line.cbsBase),
      },
    };
  }

  const ingredientRevenueBase = Math.max(input.salePrice - input.preparationFee, 0);
  const totalCost = input.composition.reduce((sum, item) => sum + item.cost, 0);

  const ingredientLines = input.composition.map((item) => {
    const share = totalCost > 0 ? item.cost / totalCost : 1 / input.composition.length;
    const classification = item.taxClassification ?? input.productTaxClassification;

    return calculateIbsCbsLine({
      label: item.name,
      base: roundMoney(ingredientRevenueBase * share),
      cstIbsCbs: classification.cstIbsCbs,
      cClassTrib: classification.cClassTrib,
      pRedIbs: toNumber(classification.pRedIbs),
      pRedCbs: toNumber(classification.pRedCbs),
    });
  });

  const preparationLine = calculateIbsCbsLine({
    label: "Taxa de preparo",
    base: input.preparationFee,
    cstIbsCbs: input.preparationFeeTaxClassification.cstIbsCbs,
    cClassTrib: input.preparationFeeTaxClassification.cClassTrib,
    pRedIbs: toNumber(input.preparationFeeTaxClassification.pRedIbs),
    pRedCbs: toNumber(input.preparationFeeTaxClassification.pRedCbs),
  });

  const taxableLines = [...ingredientLines, preparationLine];
  const totals = taxableLines.reduce(
    (acc, line) => ({
      ibsValue: roundMoney(acc.ibsValue + line.ibsValue),
      cbsValue: roundMoney(acc.cbsValue + line.cbsValue),
      totalTax: roundMoney(acc.totalTax + line.totalTax),
      taxableBase: roundMoney(acc.taxableBase + line.ibsBase + line.cbsBase),
    }),
    { ibsValue: 0, cbsValue: 0, totalTax: 0, taxableBase: 0 },
  );

  return {
    strategy: input.fiscalStrategy,
    taxableLines,
    totals,
  };
}

export async function listProducts() {
  return prisma.product.findMany({
    include: {
      ingredients: {
        include: {
          ingredient: {
            include: { taxClassification: true },
          },
        },
      },
      taxProfile: {
        include: {
          taxClassification: true,
          preparationFeeTaxClassification: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createProductFull(input: ProductCreateFullInput) {
  const duplicatedIngredient = input.composition.find((item, index) => {
    return input.composition.findIndex((candidate) => candidate.ingredientId === item.ingredientId) !== index;
  });

  if (duplicatedIngredient) {
    throw new Error("A composição contém ingrediente repetido.");
  }

  if (input.fiscalStrategy === "SPLIT_INGREDIENTS_PREPARATION_FEE" && input.preparationFee > input.salePrice) {
    throw new Error("A taxa de preparo não pode ser maior que o preço de venda.");
  }

  return prisma.$transaction(async (tx) => {
    const ingredientIds = input.composition.map((item) => item.ingredientId);
    const ingredients = await tx.ingredient.findMany({
      where: { id: { in: ingredientIds } },
      include: { taxClassification: true },
    });

    if (ingredients.length !== ingredientIds.length) {
      throw new Error("Um ou mais ingredientes informados não existem.");
    }

    const ingredientById = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));

    const compositionWithCost = input.composition.map((item) => {
      const ingredient = ingredientById.get(item.ingredientId);

      if (!ingredient) {
        throw new Error("Ingrediente não encontrado.");
      }

      const unitCost = toNumber(ingredient.unitCost);
      const totalCost = unitCost * item.qtyUsed;

      return {
        ingredient,
        qtyUsed: item.qtyUsed,
        unitCost,
        totalCost,
      };
    });

    const cmvTotal = compositionWithCost.reduce((sum, item) => sum + item.totalCost, 0);

    const productTaxClassification = await resolveTaxClassification(tx, {
      id: input.fiscal.taxClassificationId,
      cClassTrib: input.fiscal.cClassTrib,
      cstIbsCbs: input.fiscal.cstIbsCbs,
      fallbackCClassTrib: "200047",
      label: "produto final",
    });

    const preparationFeeTaxClassification = await resolveTaxClassification(tx, {
      id: input.fiscal.preparationFeeTaxClassificationId,
      cClassTrib: input.fiscal.preparationFeeCClassTrib,
      cstIbsCbs: input.fiscal.preparationFeeCstIbsCbs,
      fallbackCClassTrib: "000001",
      label: "taxa de preparo",
    });

    const product = await tx.product.create({
      data: {
        name: input.name,
        sku: input.sku,
        category: input.category,
        salePrice: input.salePrice,
        active: input.active,
        preparationFee: input.preparationFee,
        fiscalStrategy: input.fiscalStrategy,
        ingredients: {
          create: compositionWithCost.map((item) => ({
            ingredientId: item.ingredient.id,
            qtyUsed: item.qtyUsed,
            unitCostSnapshot: item.unitCost,
            totalCostSnapshot: item.totalCost,
          })),
        },
        taxProfile: {
          create: {
            uf: input.fiscal.uf,
            taxRegime: input.fiscal.taxRegime,
            ncm: input.fiscal.ncm,
            csosn: input.fiscal.csosn,
            pisCst: input.fiscal.pisCst,
            cofinsCst: input.fiscal.cofinsCst,
            cstIbsCbs: productTaxClassification.cstIbsCbs,
            cClassTrib: productTaxClassification.cClassTrib,
            taxClassificationId: productTaxClassification.id,
            preparationFeeNcm: input.fiscal.preparationFeeNcm,
            preparationFeeCstIbsCbs: preparationFeeTaxClassification.cstIbsCbs,
            preparationFeeCClassTrib: preparationFeeTaxClassification.cClassTrib,
            preparationFeeTaxClassificationId: preparationFeeTaxClassification.id,
            fiscalStrategy: input.fiscalStrategy,
            legalBasis: input.fiscal.legalBasis,
            requiresLegalReview: input.fiscal.requiresLegalReview,
          },
        },
      },
      include: {
        ingredients: {
          include: { ingredient: { include: { taxClassification: true } } },
        },
        taxProfile: {
          include: {
            taxClassification: true,
            preparationFeeTaxClassification: true,
          },
        },
      },
    });

    const taxSimulation = buildSplitSimulation({
      salePrice: input.salePrice,
      preparationFee: input.preparationFee,
      fiscalStrategy: input.fiscalStrategy,
      composition: compositionWithCost.map((item) => ({
        name: item.ingredient.name,
        cost: item.totalCost,
        taxClassification: item.ingredient.taxClassification,
      })),
      productTaxClassification,
      preparationFeeTaxClassification,
    });

    return {
      productId: product.id,
      cmvTotal: roundMoney(cmvTotal),
      grossMarginValue: roundMoney(input.salePrice - cmvTotal),
      grossMarginPercent: input.salePrice > 0 ? roundMoney(((input.salePrice - cmvTotal) / input.salePrice) * 100) : 0,
      taxSimulation,
      product,
    };
  });
}

