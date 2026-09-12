import { prisma } from "../../lib/prisma.js";
import type { SupplierCreateInput, SupplierUpdateInput } from "./suppliers.schema.js";

function cleanDocument(document?: string | null) {
  const value = document?.replace(/\D/g, "");
  return value || null;
}

async function assertStoreOwner(userId: string, storeId: string) {
  const store = await prisma.store.findFirst({ where: { id: storeId, ownerId: userId } });

  if (!store) {
    throw new Error("Loja nao encontrada para este usuario.");
  }

  return store;
}

export async function listSuppliers(userId: string, storeId: string) {
  await assertStoreOwner(userId, storeId);

  return prisma.supplier.findMany({
    where: { storeId },
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });
}

export async function createSupplier(userId: string, input: SupplierCreateInput) {
  await assertStoreOwner(userId, input.storeId);

  return prisma.supplier.create({
    data: {
      storeId: input.storeId,
      name: input.name,
      document: cleanDocument(input.document),
      phone: input.phone,
      email: input.email,
      contactName: input.contactName,
      notes: input.notes,
      active: input.active,
    },
  });
}

export async function updateSupplier(userId: string, id: string, input: SupplierUpdateInput) {
  const supplier = await prisma.supplier.findFirst({ where: { id, store: { ownerId: userId } } });

  if (!supplier) {
    throw new Error("Fornecedor nao encontrado.");
  }

  if (input.storeId) {
    await assertStoreOwner(userId, input.storeId);
  }

  return prisma.supplier.update({
    where: { id },
    data: {
      ...(input.storeId !== undefined ? { storeId: input.storeId } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.document !== undefined ? { document: cleanDocument(input.document) } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.contactName !== undefined ? { contactName: input.contactName } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
    },
  });
}
