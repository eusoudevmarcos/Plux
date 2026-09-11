import { prisma } from "../../lib/prisma.js";
import type { CashMovementInput, CashRegisterCloseInput, CashRegisterOpenInput } from "./cash-register.schema.js";

async function assertStoreOwner(userId: string, storeId: string) {
  const store = await prisma.store.findFirst({ where: { id: storeId, ownerId: userId } });
  if (!store) {
    throw new Error("Loja nao encontrada para este usuario.");
  }
  return store;
}

export async function getCurrentCashRegister(userId: string, storeId: string) {
  await assertStoreOwner(userId, storeId);
  return prisma.cashRegister.findFirst({
    where: { storeId, status: "OPEN" },
    include: { movements: { orderBy: { createdAt: "desc" }, take: 20 }, sales: { orderBy: { createdAt: "desc" }, take: 20 } },
    orderBy: { openedAt: "desc" },
  });
}

export async function openCashRegister(userId: string, input: CashRegisterOpenInput) {
  await assertStoreOwner(userId, input.storeId);

  const openRegister = await prisma.cashRegister.findFirst({
    where: { storeId: input.storeId, status: "OPEN" },
  });

  if (openRegister) {
    throw new Error("Ja existe um caixa aberto para esta loja.");
  }

  return prisma.cashRegister.create({
    data: {
      storeId: input.storeId,
      userId,
      openingBalance: input.openingBalance,
      notes: input.notes,
      movements: {
        create: {
          userId,
          type: "ABERTURA",
          amount: input.openingBalance,
          description: "Abertura de caixa",
        },
      },
    },
    include: { movements: true },
  });
}

export async function createCashMovement(userId: string, cashRegisterId: string, input: CashMovementInput) {
  const register = await prisma.cashRegister.findFirst({
    where: { id: cashRegisterId, status: "OPEN", store: { ownerId: userId } },
  });

  if (!register) {
    throw new Error("Caixa aberto nao encontrado.");
  }

  return prisma.cashMovement.create({
    data: {
      cashRegisterId,
      userId,
      type: input.type,
      amount: input.amount,
      description: input.description,
    },
  });
}

export async function closeCashRegister(userId: string, cashRegisterId: string, input: CashRegisterCloseInput) {
  const register = await prisma.cashRegister.findFirst({
    where: { id: cashRegisterId, status: "OPEN", store: { ownerId: userId } },
    include: { movements: true },
  });

  if (!register) {
    throw new Error("Caixa aberto nao encontrado.");
  }

  const expected = register.movements.reduce((sum, movement) => {
    const amount = Number(movement.amount);
    if (movement.type === "SANGRIA") return sum - amount;
    return sum + amount;
  }, 0);

  return prisma.cashRegister.update({
    where: { id: cashRegisterId },
    data: {
      status: "CLOSED",
      closingBalanceExpected: expected,
      closingBalanceInformed: input.closingBalanceInformed,
      difference: input.closingBalanceInformed - expected,
      closedAt: new Date(),
      notes: input.notes,
      movements: {
        create: {
          userId,
          type: "FECHAMENTO",
          amount: input.closingBalanceInformed,
          description: "Fechamento de caixa",
        },
      },
    },
    include: { movements: true },
  });
}
