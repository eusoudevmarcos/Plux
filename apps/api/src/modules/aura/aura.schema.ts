import { z } from "zod";

export const auraPlanSchema = z.object({
  name: z.string().min(2, "Informe o nome do plano."),
  description: z.string().max(600).optional().nullable(),
  monthlyPrice: z.coerce.number().nonnegative("Valor mensal invalido."),
  setupFee: z.coerce.number().nonnegative().default(0),
  maxStores: z.coerce.number().int().positive().default(1),
  features: z.string().max(1000).optional().nullable(),
  active: z.coerce.boolean().default(true),
});

export const auraCustomerCreateSchema = z.object({
  name: z.string().min(2, "Informe o responsavel."),
  email: z.string().email("E-mail invalido.").transform((value) => value.toLowerCase().trim()),
  password: z.string().min(6, "Senha provisoria deve ter ao menos 6 caracteres."),
  legalName: z.string().min(2, "Informe a razao social."),
  tradeName: z.string().max(140).optional().nullable(),
  document: z.string().max(20).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  taxRegime: z.enum(["SIMPLES", "LUCRO_PRESUMIDO", "LUCRO_REAL"]).default("SIMPLES"),
  notes: z.string().max(1000).optional().nullable(),
});

export const auraCustomerAccessSchema = z.object({
  status: z.enum(["PENDING", "ACTIVE", "SUSPENDED", "CANCELED"]),
  accessEnabled: z.coerce.boolean(),
  paymentCurrentUntil: z.coerce.date().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export const auraContractSchema = z.object({
  planId: z.string().min(1),
  code: z.string().min(2, "Informe o codigo do contrato."),
  status: z.enum(["DRAFT", "ACTIVE", "SUSPENDED", "CANCELED", "EXPIRED"]).default("ACTIVE"),
  startsAt: z.coerce.date().default(() => new Date()),
  endsAt: z.coerce.date().optional().nullable(),
  signedAt: z.coerce.date().optional().nullable(),
  contractUrl: z.string().url().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  paymentCurrentUntil: z.coerce.date().optional().nullable(),
});

export const auraPaymentSchema = z.object({
  contractId: z.string().optional().nullable(),
  amount: z.coerce.number().positive("Valor deve ser maior que zero."),
  dueDate: z.coerce.date(),
  paidAt: z.coerce.date().optional().nullable(),
  paidThrough: z.coerce.date().optional().nullable(),
  status: z.enum(["PENDING", "PAID", "OVERDUE", "CANCELED"]).default("PENDING"),
  method: z.enum(["PIX", "CREDIT_CARD", "BOLETO", "BANK_TRANSFER", "CASH", "OTHER"]).default("PIX"),
  reference: z.string().max(120).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export type AuraPlanInput = z.infer<typeof auraPlanSchema>;
export type AuraCustomerCreateInput = z.infer<typeof auraCustomerCreateSchema>;
export type AuraCustomerAccessInput = z.infer<typeof auraCustomerAccessSchema>;
export type AuraContractInput = z.infer<typeof auraContractSchema>;
export type AuraPaymentInput = z.infer<typeof auraPaymentSchema>;
