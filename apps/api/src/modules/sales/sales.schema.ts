import { z } from "zod";

export const saleCheckoutSchema = z.object({
  storeId: z.string().min(1),
  customerName: z.string().optional().nullable(),
  discount: z.coerce.number().nonnegative().default(0),
  notes: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.coerce.number().positive(),
      }),
    )
    .min(1),
  payments: z
    .array(
      z.object({
        method: z.enum(["PIX", "DINHEIRO", "DEBITO", "CREDITO", "OUTRO"]),
        amount: z.coerce.number().positive(),
      }),
    )
    .min(1),
});

export type SaleCheckoutInput = z.infer<typeof saleCheckoutSchema>;
