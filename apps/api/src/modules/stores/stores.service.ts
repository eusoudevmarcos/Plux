import { prisma } from "../../lib/prisma.js";
import type { StoreCreateInput, StoreUpdateInput } from "./stores.schema.js";

function cleanDocument(document?: string | null) {
  const value = document?.replace(/\D/g, "");
  return value || null;
}

function normalizeState(state?: string) {
  return (state ?? "DF").trim().toUpperCase();
}

export function listStores(ownerId: string) {
  return prisma.store.findMany({
    where: { ownerId },
    orderBy: [{ active: "desc" }, { tradeName: "asc" }],
  });
}

export async function getStore(ownerId: string, id: string) {
  return prisma.store.findFirst({
    where: { id, ownerId },
  });
}

export async function createStore(ownerId: string, input: StoreCreateInput) {
  return prisma.store.create({
    data: {
      ownerId,
      legalName: input.legalName,
      tradeName: input.tradeName,
      document: cleanDocument(input.document),
      taxRegime: input.taxRegime,
      state: normalizeState(input.state),
      city: input.city,
      district: input.district,
      addressLine: input.addressLine,
      addressNumber: input.addressNumber,
      addressComplement: input.addressComplement || null,
      zipCode: input.zipCode || null,
      active: input.active,
    },
  });
}

export async function updateStore(ownerId: string, id: string, input: StoreUpdateInput) {
  const store = await getStore(ownerId, id);

  if (!store) {
    throw new Error("Loja nao encontrada.");
  }

  return prisma.store.update({
    where: { id },
    data: {
      ...(input.legalName !== undefined ? { legalName: input.legalName } : {}),
      ...(input.tradeName !== undefined ? { tradeName: input.tradeName } : {}),
      ...(input.document !== undefined ? { document: cleanDocument(input.document) } : {}),
      ...(input.taxRegime !== undefined ? { taxRegime: input.taxRegime } : {}),
      ...(input.state !== undefined ? { state: normalizeState(input.state) } : {}),
      ...(input.city !== undefined ? { city: input.city } : {}),
      ...(input.district !== undefined ? { district: input.district } : {}),
      ...(input.addressLine !== undefined ? { addressLine: input.addressLine } : {}),
      ...(input.addressNumber !== undefined ? { addressNumber: input.addressNumber } : {}),
      ...(input.addressComplement !== undefined ? { addressComplement: input.addressComplement || null } : {}),
      ...(input.zipCode !== undefined ? { zipCode: input.zipCode || null } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
    },
  });
}
