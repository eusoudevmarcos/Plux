import { z } from "zod";

export const cashRegisterOpenSchema = z.object({
  storeId: z.string().min(1),
  openingBalance: z.coerce.number().nonnegative().default(0),
  notes: z.string().optional().nullable(),
});

export const cashRegisterCloseSchema = z.object({
  closingBalanceInformed: z.coerce.number().nonnegative(),
  notes: z.string().optional().nullable(),
});

export const cashMovementSchema = z.object({
  type: z.enum(["SANGRIA", "SUPRIMENTO"]),
  amount: z.coerce.number().positive(),
  description: z.string().optional().nullable(),
});

export type CashRegisterOpenInput = z.infer<typeof cashRegisterOpenSchema>;
export type CashRegisterCloseInput = z.infer<typeof cashRegisterCloseSchema>;
export type CashMovementInput = z.infer<typeof cashMovementSchema>;
