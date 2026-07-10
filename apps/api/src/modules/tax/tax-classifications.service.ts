import { prisma } from "../../lib/prisma.js";

export async function listTaxClassifications() {
  return prisma.taxClassification.findMany({
    orderBy: [{ cstIbsCbs: "asc" }, { cClassTrib: "asc" }],
  });
}

