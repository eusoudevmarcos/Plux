import { prisma } from "../../lib/prisma.js";
import { createPasswordCredentials } from "../auth/auth.service.js";
import type {
  AuraContractInput,
  AuraCustomerAccessInput,
  AuraCustomerCreateInput,
  AuraPaymentInput,
  AuraPlanInput,
} from "./aura.schema.js";

function cleanDocument(document?: string | null) {
  const value = document?.replace(/\D/g, "");
  return value || null;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function customerInclude() {
  return {
    user: { select: { id: true, name: true, email: true, role: true, createdAt: true } },
    contracts: {
      include: { plan: true },
      orderBy: { createdAt: "desc" as const },
    },
    payments: {
      orderBy: { dueDate: "desc" as const },
      take: 8,
    },
  };
}

export async function getAuraSummary() {
  const [customersCount, activeCustomersCount, pendingCustomersCount, suspendedCustomersCount, overduePaymentsCount, paidPayments] =
    await Promise.all([
      prisma.auraCustomerAccount.count(),
      prisma.auraCustomerAccount.count({ where: { status: "ACTIVE", accessEnabled: true } }),
      prisma.auraCustomerAccount.count({ where: { status: "PENDING" } }),
      prisma.auraCustomerAccount.count({ where: { status: "SUSPENDED" } }),
      prisma.auraPayment.count({ where: { status: "OVERDUE" } }),
      prisma.auraPayment.findMany({
        where: { status: "PAID" },
        select: { amount: true },
      }),
    ]);

  const paidRevenue = paidPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);

  return {
    customersCount,
    activeCustomersCount,
    pendingCustomersCount,
    suspendedCustomersCount,
    overduePaymentsCount,
    paidRevenue,
  };
}

export function listPlans() {
  return prisma.auraPlan.findMany({
    orderBy: [{ active: "desc" }, { monthlyPrice: "asc" }],
  });
}

export function createPlan(input: AuraPlanInput) {
  return prisma.auraPlan.create({
    data: {
      name: input.name,
      description: input.description || null,
      monthlyPrice: input.monthlyPrice,
      setupFee: input.setupFee,
      maxStores: input.maxStores,
      features: input.features || null,
      active: input.active,
    },
  });
}

export function listCustomers() {
  return prisma.auraCustomerAccount.findMany({
    include: customerInclude(),
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
}

export async function createCustomer(input: AuraCustomerCreateInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });

  if (existing) {
    throw new Error("E-mail ja cadastrado.");
  }

  const credentials = createPasswordCredentials(input.password);

  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      role: "COMPANY_ADMIN",
      ...credentials,
      customerAccount: {
        create: {
          legalName: input.legalName,
          tradeName: input.tradeName || input.legalName,
          document: cleanDocument(input.document),
          phone: input.phone || null,
          taxRegime: input.taxRegime,
          status: "PENDING",
          accessEnabled: false,
          notes: input.notes || null,
        },
      },
    },
    include: { customerAccount: { include: customerInclude() } },
  });
}

export async function updateCustomerAccess(customerId: string, input: AuraCustomerAccessInput) {
  return prisma.auraCustomerAccount.update({
    where: { id: customerId },
    data: {
      status: input.status,
      accessEnabled: input.accessEnabled,
      paymentCurrentUntil: input.paymentCurrentUntil ?? null,
      notes: input.notes || null,
    },
    include: customerInclude(),
  });
}

export async function createContract(customerId: string, input: AuraContractInput) {
  const plan = await prisma.auraPlan.findUnique({ where: { id: input.planId } });

  if (!plan) {
    throw new Error("Plano nao encontrado.");
  }

  const paymentCurrentUntil = input.paymentCurrentUntil ?? addDays(input.startsAt, 30);

  return prisma.$transaction(async (tx) => {
    const contract = await tx.auraContract.create({
      data: {
        customerId,
        planId: plan.id,
        code: input.code,
        status: input.status,
        startsAt: input.startsAt,
        endsAt: input.endsAt ?? null,
        signedAt: input.signedAt ?? (input.status === "ACTIVE" ? new Date() : null),
        monthlyPriceSnapshot: plan.monthlyPrice,
        setupFeeSnapshot: plan.setupFee,
        contractUrl: input.contractUrl || null,
        notes: input.notes || null,
      },
      include: { plan: true },
    });

    await tx.auraCustomerAccount.update({
      where: { id: customerId },
      data:
        input.status === "ACTIVE"
          ? {
              status: "ACTIVE",
              accessEnabled: true,
              contractApprovedAt: new Date(),
              paymentCurrentUntil,
            }
          : {},
    });

    return contract;
  });
}

export async function createPayment(customerId: string, input: AuraPaymentInput) {
  const paidThrough = input.paidThrough ?? (input.status === "PAID" ? addDays(input.dueDate, 30) : null);

  return prisma.$transaction(async (tx) => {
    const payment = await tx.auraPayment.create({
      data: {
        customerId,
        contractId: input.contractId || null,
        amount: input.amount,
        dueDate: input.dueDate,
        paidAt: input.paidAt ?? (input.status === "PAID" ? new Date() : null),
        status: input.status,
        method: input.method,
        reference: input.reference || null,
        notes: input.notes || null,
      },
    });

    if (input.status === "PAID" && paidThrough) {
      await tx.auraCustomerAccount.update({
        where: { id: customerId },
        data: {
          status: "ACTIVE",
          accessEnabled: true,
          paymentCurrentUntil: paidThrough,
        },
      });
    }

    return payment;
  });
}
