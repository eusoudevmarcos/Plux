import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { roundMoney } from "../tax/tax-rates.js";
import type { PurchaseCreateInput } from "./purchases.schema.js";

type TxClient = Prisma.TransactionClient;

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

function roundQuantity(value: number) {
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}

function roundUnitCost(value: number) {
  return Math.round((value + Number.EPSILON) * 10000) / 10000;
}

async function assertStoreOwner(tx: TxClient, userId: string, storeId: string) {
  const store = await tx.store.findFirst({ where: { id: storeId, ownerId: userId } });

  if (!store) {
    throw new Error("Loja nao encontrada para este usuario.");
  }

  return store;
}

async function assertSupplierBelongsToStore(tx: TxClient, supplierId: string | null | undefined, storeId: string) {
  if (!supplierId) {
    return null;
  }

  const supplier = await tx.supplier.findFirst({ where: { id: supplierId, storeId, active: true } });

  if (!supplier) {
    throw new Error("Fornecedor nao encontrado para esta loja.");
  }

  return supplier;
}

export async function listPurchases(userId: string, options: { storeId: string }) {
  const store = await prisma.store.findFirst({ where: { id: options.storeId, ownerId: userId } });

  if (!store) {
    throw new Error("Loja nao encontrada para este usuario.");
  }

  return prisma.purchase.findMany({
    where: { storeId: options.storeId },
    include: {
      supplier: true,
      items: { include: { ingredient: true } },
      accountsPayable: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function listAccountPayables(userId: string, options: { storeId: string }) {
  const store = await prisma.store.findFirst({ where: { id: options.storeId, ownerId: userId } });

  if (!store) {
    throw new Error("Loja nao encontrada para este usuario.");
  }

  return prisma.accountPayable.findMany({
    where: { storeId: options.storeId },
    include: { supplier: true, purchase: true },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    take: 100,
  });
}

export async function createPurchase(userId: string, input: PurchaseCreateInput) {
  const duplicatedIngredient = input.items.find((item, index) => {
    return input.items.findIndex((candidate) => candidate.ingredientId === item.ingredientId) !== index;
  });

  if (duplicatedIngredient) {
    throw new Error("A compra contém ingrediente repetido.");
  }

  return prisma.$transaction(async (tx) => {
    await assertStoreOwner(tx, userId, input.storeId);
    const supplier = await assertSupplierBelongsToStore(tx, input.supplierId, input.storeId);

    const ingredientIds = input.items.map((item) => item.ingredientId);
    const ingredients = await tx.ingredient.findMany({
      where: { id: { in: ingredientIds } },
    });

    if (ingredients.length !== ingredientIds.length) {
      throw new Error("Um ou mais ingredientes informados nao existem.");
    }

    const ingredientById = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
    const purchaseItems = input.items.map((item) => {
      const ingredient = ingredientById.get(item.ingredientId);

      if (!ingredient) {
        throw new Error("Ingrediente nao encontrado.");
      }

      const previousStock = toNumber(ingredient.stockCurrent);
      const previousUnitCost = toNumber(ingredient.unitCost);
      const quantity = roundQuantity(item.quantity);
      const unitCost = roundUnitCost(item.unitCost);
      const newStock = roundQuantity(previousStock + quantity);
      const weightedCost =
        newStock > 0 ? (previousStock * previousUnitCost + quantity * unitCost) / newStock : unitCost;
      const newUnitCost = roundUnitCost(weightedCost);

      return {
        ingredient,
        quantity,
        unitCost,
        totalCost: roundMoney(quantity * unitCost),
        previousStock,
        previousUnitCost,
        newStock,
        newUnitCost,
      };
    });

    const total = roundMoney(purchaseItems.reduce((sum, item) => sum + item.totalCost, 0));
    const maxNumber = await tx.purchase.aggregate({
      where: { storeId: input.storeId },
      _max: { number: true },
    });
    const number = (maxNumber._max.number ?? 0) + 1;

    const purchase = await tx.purchase.create({
      data: {
        storeId: input.storeId,
        supplierId: supplier?.id ?? null,
        userId,
        number,
        issueDate: input.issueDate ?? new Date(),
        total,
        notes: input.notes,
        items: {
          create: purchaseItems.map((item) => ({
            ingredientId: item.ingredient.id,
            quantity: item.quantity,
            unitCost: item.unitCost,
            totalCost: item.totalCost,
            previousStock: item.previousStock,
            previousUnitCost: item.previousUnitCost,
            newStock: item.newStock,
            newUnitCost: item.newUnitCost,
          })),
        },
        ...(input.dueDate
          ? {
              accountsPayable: {
                create: {
                  storeId: input.storeId,
                  supplierId: supplier?.id ?? null,
                  description: `Compra #${number}${supplier ? ` - ${supplier.name}` : ""}`,
                  amount: total,
                  dueDate: input.dueDate,
                },
              },
            }
          : {}),
      },
      include: {
        supplier: true,
        items: { include: { ingredient: true } },
        accountsPayable: true,
      },
    });

    for (const item of purchaseItems) {
      await tx.ingredient.update({
        where: { id: item.ingredient.id },
        data: {
          stockCurrent: item.newStock,
          unitCost: item.newUnitCost,
        },
      });

      await tx.stockMovement.create({
        data: {
          storeId: input.storeId,
          ingredientId: item.ingredient.id,
          userId,
          type: "ENTRADA",
          origin: "PURCHASE",
          originId: purchase.id,
          quantity: item.quantity,
          unitCost: item.unitCost,
          totalCost: item.totalCost,
          notes: `Compra #${purchase.number}`,
        },
      });

      const affectedCompositions = await tx.productIngredient.findMany({
        where: { ingredientId: item.ingredient.id },
        select: { id: true, qtyUsed: true },
      });

      for (const composition of affectedCompositions) {
        const qtyUsed = toNumber(composition.qtyUsed);
        await tx.productIngredient.update({
          where: { id: composition.id },
          data: {
            unitCostSnapshot: item.newUnitCost,
            totalCostSnapshot: roundUnitCost(qtyUsed * item.newUnitCost),
          },
        });
      }
    }

    return tx.purchase.findUnique({
      where: { id: purchase.id },
      include: {
        supplier: true,
        items: { include: { ingredient: true } },
        accountsPayable: true,
      },
    });
  }, { maxWait: 15000, timeout: 30000 });
}
