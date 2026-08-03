import { prisma } from "../../lib/prisma.js";
import type { CompanyProfileInput } from "./company.schema.js";

const COMPANY_PROFILE_ID = "main";

export function getCompanyProfile() {
  return prisma.companyProfile.findUnique({
    where: { id: COMPANY_PROFILE_ID },
  });
}

export function upsertCompanyProfile(input: CompanyProfileInput) {
  return prisma.companyProfile.upsert({
    where: { id: COMPANY_PROFILE_ID },
    update: {
      legalName: input.legalName,
      tradeName: input.tradeName || null,
      document: input.document || null,
      taxRegime: input.taxRegime,
      uf: input.uf.toUpperCase(),
      city: input.city || null,
    },
    create: {
      id: COMPANY_PROFILE_ID,
      legalName: input.legalName,
      tradeName: input.tradeName || null,
      document: input.document || null,
      taxRegime: input.taxRegime,
      uf: input.uf.toUpperCase(),
      city: input.city || null,
    },
  });
}
