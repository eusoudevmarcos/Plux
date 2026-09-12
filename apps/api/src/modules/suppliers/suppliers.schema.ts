import { z } from "zod";

function nullableText() {
  return z.string().trim().optional().nullable().transform((value) => value || null);
}

export const supplierCreateSchema = z.object({
  storeId: z.string().min(1),
  name: z.string().trim().min(2),
  document: nullableText(),
  phone: nullableText(),
  email: nullableText(),
  contactName: nullableText(),
  notes: nullableText(),
  active: z.coerce.boolean().default(true),
});

export const supplierUpdateSchema = supplierCreateSchema
  .omit({ storeId: true })
  .partial()
  .extend({
    storeId: z.string().min(1).optional(),
  });

export type SupplierCreateInput = z.infer<typeof supplierCreateSchema>;
export type SupplierUpdateInput = z.infer<typeof supplierUpdateSchema>;
