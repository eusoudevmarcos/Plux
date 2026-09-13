import { z } from "zod";

function nullableText() {
  return z.string().trim().optional().nullable().transform((value) => value || null);
}

export const purchaseCreateSchema = z.object({
  storeId: z.string().min(1),
  supplierId: z.string().min(1).optional().nullable(),
  issueDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional().nullable(),
  notes: nullableText(),
  items: z
    .array(
      z.object({
        ingredientId: z.string().min(1),
        quantity: z.coerce.number().positive(),
        unitCost: z.coerce.number().nonnegative(),
      }),
    )
    .min(1),
});

export const payablePaymentSchema = z.object({
  paidAt: z.coerce.date().optional(),
  notes: nullableText(),
});

export type PurchaseCreateInput = z.infer<typeof purchaseCreateSchema>;
export type PayablePaymentInput = z.infer<typeof payablePaymentSchema>;
