import { prisma } from "../../lib/prisma.js";
import type { IngredientCreateInput, IngredientUpdateInput } from "./ingredients.schema.js";

async function assertTaxClassificationExists(taxClassificationId?: string | null) {
  if (!taxClassificationId) {
    return;
  }

  const taxClassification = await prisma.taxClassification.findUnique({
    where: { id: taxClassificationId },
    select: { id: true },
  });

  if (!taxClassification) {
    throw new Error("Classificação tributária não encontrada.");
  }
}

export async function listIngredients() {
  return prisma.ingredient.findMany({
    include: { taxClassification: true },
    orderBy: { name: "asc" },
  });
}

export async function createIngredient(input: IngredientCreateInput) {
  await assertTaxClassificationExists(input.taxClassificationId);

  return prisma.ingredient.create({
    data: input,
    include: { taxClassification: true },
  });
}

export async function updateIngredient(id: string, input: IngredientUpdateInput) {
  await assertTaxClassificationExists(input.taxClassificationId);

  return prisma.ingredient.update({
    where: { id },
    data: input,
    include: { taxClassification: true },
  });
}

export async function deleteIngredient(id: string) {
  const usageCount = await prisma.productIngredient.count({ where: { ingredientId: id } });

  if (usageCount > 0) {
    throw new Error("Ingrediente vinculado a produto não pode ser removido.");
  }

  await prisma.ingredient.delete({ where: { id } });

  return { deleted: true };
}

