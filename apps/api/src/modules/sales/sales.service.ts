import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { roundMoney } from "../tax/tax-rates.js";
import type { SaleCheckoutInput } from "./sales.schema.js";

type TxClient = Prisma.TransactionClient;

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

function roundQuantity(value: number) {
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}

async function assertStoreOwner(tx: TxClient, userId: string, storeId: string) {
  const store = await tx.store.findFirst({ where: { id: storeId, ownerId: userId } });
  if (!store) {
    throw new Error("Loja nao encontrada para este usuario.");
  }
  return store;
}

export async function listSales(userId: string, options: { storeId?: string | null } = {}) {
  if (options.storeId) {
    const store = await prisma.store.findFirst({ where: { id: options.storeId, ownerId: userId } });
    if (!store) throw new Error("Loja nao encontrada para este usuario.");
  }

  return prisma.sale.findMany({
    where: {
      ...(options.storeId ? { storeId: options.storeId } : { store: { ownerId: userId } }),
    },
    include: {
      items: { include: { product: true } },
      payments: true,
      store: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function checkoutSale(userId: string, input: SaleCheckoutInput) {
  return prisma.$transaction(async (tx) => {
    await assertStoreOwner(tx, userId, input.storeId);

    const productIds = input.items.map((item) => item.productId);
    const products = await tx.product.findMany({
      where: {
        id: { in: productIds },
        active: true,
        OR: [{ storeId: input.storeId }, { storeId: null }],
      },
      include: {
        ingredients: {
          include: { ingredient: true },
        },
      },
    });

    if (products.length !== new Set(productIds).size) {
      throw new Error("Um ou mais produtos nao existem para esta loja.");
    }

    const productById = new Map(products.map((product) => [product.id, product]));
    const saleItems = input.items.map((item) => {
      const product = productById.get(item.productId);
      if (!product) throw new Error("Produto nao encontrado.");
      const unitPrice = toNumber(product.salePrice);
      const unitCost = product.ingredients.reduce((sum, composition) => sum + toNumber(composition.totalCostSnapshot), 0);
      return {
        product,
        quantity: item.quantity,
        unitPrice,
        unitCost,
        subtotal: roundMoney(unitPrice * item.quantity),
      };
    });

    const subtotal = roundMoney(saleItems.reduce((sum, item) => sum + item.subtotal, 0));
    const discount = roundMoney(input.discount);
    const total = roundMoney(Math.max(subtotal - discount, 0));
    const paid = roundMoney(input.payments.reduce((sum, payment) => sum + payment.amount, 0));

    if (paid !== total) {
      throw new Error("Total dos pagamentos precisa fechar exatamente o total da venda.");
    }

    const totalCost = roundMoney(saleItems.reduce((sum, item) => sum + item.unitCost * item.quantity, 0));
    const ingredientRequirements = new Map<
      string,
      {
        name: string;
        quantity: number;
        unitCost: number;
      }
    >();

    for (const saleItem of saleItems) {
      for (const composition of saleItem.product.ingredients) {
        const ingredientId = composition.ingredientId;
        const quantity = roundQuantity(toNumber(composition.qtyUsed) * saleItem.quantity);
        const current = ingredientRequirements.get(ingredientId);

        ingredientRequirements.set(ingredientId, {
          name: composition.ingredient.name,
          quantity: roundQuantity((current?.quantity ?? 0) + quantity),
          unitCost: toNumber(composition.ingredient.unitCost),
        });
      }
    }

    const maxNumber = await tx.sale.aggregate({
      where: { storeId: input.storeId },
      _max: { number: true },
    });
    const number = (maxNumber._max.number ?? 0) + 1;
    const openCashRegister = await tx.cashRegister.findFirst({
      where: { storeId: input.storeId, status: "OPEN" },
      orderBy: { openedAt: "desc" },
    });

    if (!openCashRegister) {
      throw new Error("Abra o caixa desta loja antes de finalizar vendas.");
    }

    const sale = await tx.sale.create({
      data: {
        storeId: input.storeId,
        userId,
        cashRegisterId: openCashRegister.id,
        number,
        customerName: input.customerName,
        status: "COMPLETED",
        subtotal,
        discount,
        total,
        totalCost,
        closedAt: new Date(),
        notes: input.notes,
        items: {
          create: saleItems.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            unitCost: item.unitCost,
            subtotal: item.subtotal,
          })),
        },
        payments: {
          create: input.payments.map((payment) => ({
            method: payment.method,
            amount: payment.amount,
          })),
        },
      },
      include: { items: true, payments: true },
    });

    for (const [ingredientId, requirement] of ingredientRequirements) {
      const updated = await tx.ingredient.updateMany({
        where: { id: ingredientId, stockCurrent: { gte: requirement.quantity } },
        data: { stockCurrent: { decrement: requirement.quantity } },
      });

      if (updated.count !== 1) {
        throw new Error(`Estoque insuficiente para ${requirement.name}.`);
      }

      await tx.stockMovement.create({
        data: {
          storeId: input.storeId,
          ingredientId,
          userId,
          type: "VENDA",
          origin: "SALE",
          originId: sale.id,
          quantity: -requirement.quantity,
          unitCost: requirement.unitCost,
          totalCost: roundMoney(requirement.unitCost * requirement.quantity),
          notes: `Venda #${sale.number}`,
        },
      });
    }

    await tx.cashMovement.create({
      data: {
        cashRegisterId: openCashRegister.id,
        userId,
        type: "VENDA",
        amount: total,
        description: `Venda #${sale.number}`,
      },
    });

    return sale;
  });
}

export async function cancelSale(userId: string, saleId: string) {
  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findFirst({
      where: { id: saleId, store: { ownerId: userId } },
      include: {
        items: {
          include: {
            product: {
              include: { ingredients: { include: { ingredient: true } } },
            },
          },
        },
      },
    });

    if (!sale) throw new Error("Venda nao encontrada.");
    if (sale.status !== "COMPLETED") throw new Error("Apenas vendas concluidas podem ser canceladas.");

    for (const item of sale.items) {
      for (const composition of item.product.ingredients) {
        const quantity = roundMoney(toNumber(composition.qtyUsed) * toNumber(item.quantity));
        const unitCost = toNumber(composition.ingredient.unitCost);
        await tx.ingredient.update({
          where: { id: composition.ingredientId },
          data: { stockCurrent: { increment: quantity } },
        });
        await tx.stockMovement.create({
          data: {
            storeId: sale.storeId,
            ingredientId: composition.ingredientId,
            userId,
            type: "DEVOLUCAO",
            origin: "SALE_CANCELLATION",
            originId: sale.id,
            quantity,
            unitCost,
            totalCost: roundMoney(unitCost * quantity),
            notes: `Cancelamento venda #${sale.number}`,
          },
        });
      }
    }

    return tx.sale.update({
      where: { id: sale.id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
      include: { items: true, payments: true },
    });
  });
}
