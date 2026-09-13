import { createHash } from "node:crypto";
import { FiscalDocumentType, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { roundMoney } from "../tax/tax-rates.js";
import type { FiscalCancelInput, FiscalPrepareInput, FiscalReturnPrepareInput } from "./fiscal.schema.js";

type TxClient = Prisma.TransactionClient;

const fiscalDocumentInclude = {
  store: true,
  sale: true,
  purchase: true,
  events: { orderBy: { createdAt: "desc" } },
} satisfies Prisma.FiscalDocumentInclude;

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

function cleanSeries(series: string | undefined) {
  return (series ?? "1").trim() || "1";
}

function hashPayload(payload: unknown) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function documentLabel(type: FiscalDocumentType) {
  const labels: Record<FiscalDocumentType, string> = {
    NFCE: "NFC-e",
    NFE: "NF-e",
    NFE_DEVOLUCAO: "NF-e devolucao",
  };

  return labels[type];
}

function blockedTransmissionMessage() {
  return [
    "Transmissao SEFAZ bloqueada nesta beta.",
    "Falta configurar certificado A1, assinatura XML, validacao XSD, QR Code/DANFE e homologacao por UF.",
    "O documento local fica preparado para auditoria e para acoplarmos o emissor oficial depois.",
  ].join(" ");
}

async function assertStoreOwner(tx: TxClient | typeof prisma, userId: string, storeId: string) {
  const store = await tx.store.findFirst({ where: { id: storeId, ownerId: userId } });

  if (!store) {
    throw new Error("Loja nao encontrada para este usuario.");
  }

  return store;
}

async function nextFiscalNumber(
  tx: TxClient,
  options: {
    storeId: string;
    documentType: FiscalDocumentType;
    environment: "HOMOLOGATION" | "PRODUCTION";
    series: string;
  },
) {
  const sequence = await tx.fiscalSequence.upsert({
    where: {
      storeId_documentType_environment_series: {
        storeId: options.storeId,
        documentType: options.documentType,
        environment: options.environment,
        series: options.series,
      },
    },
    create: {
      storeId: options.storeId,
      documentType: options.documentType,
      environment: options.environment,
      series: options.series,
      currentNumber: 1,
    },
    update: {
      currentNumber: { increment: 1 },
    },
  });

  return sequence.currentNumber;
}

async function returnExistingDocument(
  tx: TxClient,
  where: Prisma.FiscalDocumentWhereInput,
) {
  return tx.fiscalDocument.findFirst({
    where: {
      ...where,
      status: { not: "CANCELLED" },
    },
    include: fiscalDocumentInclude,
    orderBy: { createdAt: "desc" },
  });
}

function buildInternalKey(input: {
  storeDocument: string | null;
  type: FiscalDocumentType;
  environment: string;
  series: string;
  number: number;
}) {
  return hashPayload({
    storeDocument: input.storeDocument,
    type: input.type,
    environment: input.environment,
    series: input.series,
    number: input.number,
  });
}

function saleFiscalLines(
  sale: Prisma.SaleGetPayload<{
    include: {
      items: {
        include: {
          product: {
            include: {
              taxProfile: true;
              ingredients: { include: { ingredient: { include: { taxClassification: true } } } };
            };
          };
        };
      };
    };
  }>,
) {
  const warnings: string[] = [];
  const lines: Prisma.InputJsonObject[] = [];

  for (const item of sale.items) {
    const product = item.product;
    const profile = product.taxProfile;
    const quantity = toNumber(item.quantity);
    const unitPrice = toNumber(item.unitPrice);
    const itemTotal = toNumber(item.subtotal);

    if (!profile) {
      warnings.push(`Produto ${product.name} sem perfil fiscal; linha preparada com tributacao integral padrao.`);
    }

    if (product.fiscalStrategy !== "SPLIT_INGREDIENTS_PREPARATION_FEE") {
      lines.push({
        line: lines.length + 1,
        lineType: "PRODUCT",
        label: product.name,
        productId: product.id,
        quantity,
        unitValue: unitPrice,
        total: roundMoney(itemTotal),
        ncm: profile?.ncm ?? "21069090",
        cfop: "5102",
        csosn: profile?.csosn ?? "102",
        pisCst: profile?.pisCst ?? "04",
        cofinsCst: profile?.cofinsCst ?? "04",
        cstIbsCbs: profile?.cstIbsCbs ?? "000",
        cClassTrib: profile?.cClassTrib ?? "000001",
      });
      continue;
    }

    const preparationFeeUnit = Math.min(toNumber(product.preparationFee), unitPrice);
    const ingredientRevenueBaseUnit = Math.max(unitPrice - preparationFeeUnit, 0);
    const ingredientTotalCost = product.ingredients.reduce((sum, composition) => sum + toNumber(composition.totalCostSnapshot), 0);

    if (product.ingredients.length === 0) {
      warnings.push(`Produto ${product.name} nao possui ficha tecnica; taxa de preparo foi mantida como linha fiscal.`);
    }

    for (const composition of product.ingredients) {
      const ingredient = composition.ingredient;
      const classification = ingredient.taxClassification;
      const share =
        ingredientTotalCost > 0 ? toNumber(composition.totalCostSnapshot) / ingredientTotalCost : 1 / product.ingredients.length;
      const lineTotal = roundMoney(ingredientRevenueBaseUnit * share * quantity);

      if (!classification) {
        warnings.push(`Ingrediente ${ingredient.name} sem cClassTrib; revisar antes de homologar emissao.`);
      }

      lines.push({
        line: lines.length + 1,
        lineType: "INGREDIENT",
        label: ingredient.name,
        sourceProduct: product.name,
        productId: product.id,
        ingredientId: ingredient.id,
        quantity: roundMoney(toNumber(composition.qtyUsed) * quantity),
        unitMeasure: ingredient.unitMeasure,
        unitValue: roundMoney(lineTotal / Math.max(quantity, 1)),
        total: lineTotal,
        ncm: ingredient.ncm,
        cfop: "5102",
        icmsCst: ingredient.icmsCst ?? null,
        icmsCsosn: ingredient.icmsCsosn ?? null,
        pisCst: ingredient.pisCst,
        cofinsCst: ingredient.cofinsCst,
        cstIbsCbs: classification?.cstIbsCbs ?? "000",
        cClassTrib: classification?.cClassTrib ?? "000001",
      });
    }

    if (preparationFeeUnit > 0) {
      lines.push({
        line: lines.length + 1,
        lineType: "PREPARATION_FEE",
        label: `Taxa de preparo - ${product.name}`,
        productId: product.id,
        quantity,
        unitValue: roundMoney(preparationFeeUnit),
        total: roundMoney(preparationFeeUnit * quantity),
        ncm: profile?.preparationFeeNcm ?? "21069090",
        cfop: "5102",
        csosn: profile?.csosn ?? "102",
        pisCst: profile?.pisCst ?? "04",
        cofinsCst: profile?.cofinsCst ?? "04",
        cstIbsCbs: profile?.preparationFeeCstIbsCbs ?? "000",
        cClassTrib: profile?.preparationFeeCClassTrib ?? "000001",
      });
    }
  }

  return { lines, warnings };
}

export async function listFiscalDocuments(userId: string, options: { storeId: string }) {
  await assertStoreOwner(prisma, userId, options.storeId);

  return prisma.fiscalDocument.findMany({
    where: { storeId: options.storeId },
    include: fiscalDocumentInclude,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function prepareSaleFiscalDocument(
  userId: string,
  saleId: string,
  type: Extract<FiscalDocumentType, "NFCE" | "NFE">,
  input: FiscalPrepareInput,
) {
  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findFirst({
      where: { id: saleId, store: { ownerId: userId } },
      include: {
        store: true,
        payments: true,
        items: {
          include: {
            product: {
              include: {
                taxProfile: true,
                ingredients: { include: { ingredient: { include: { taxClassification: true } } } },
              },
            },
          },
        },
      },
    });

    if (!sale || !sale.storeId || !sale.store) {
      throw new Error("Venda nao encontrada para este usuario.");
    }

    if (input.storeId && input.storeId !== sale.storeId) {
      throw new Error("Venda nao pertence a loja informada.");
    }

    if (sale.status !== "COMPLETED") {
      throw new Error("Apenas vendas concluidas podem preparar documento fiscal.");
    }

    const environment = input.environment;
    const series = cleanSeries(input.series);
    const existing = await returnExistingDocument(tx, {
      saleId: sale.id,
      type,
      environment,
      series,
    });

    if (existing) {
      return existing;
    }

    await assertStoreOwner(tx, userId, sale.storeId);
    const number = await nextFiscalNumber(tx, { storeId: sale.storeId, documentType: type, environment, series });
    const { lines, warnings } = saleFiscalLines(sale);
    const internalKey = buildInternalKey({
      storeDocument: sale.store.document ?? null,
      type,
      environment,
      series,
      number,
    });
    const payload: Prisma.InputJsonObject = {
      schemaVersion: "PLUX-FISCAL-DOC-1",
      documentType: type,
      documentLabel: documentLabel(type),
      environment,
      series,
      number,
      internalKey,
      store: {
        id: sale.store.id,
        legalName: sale.store.legalName,
        tradeName: sale.store.tradeName,
        document: sale.store.document ?? null,
        state: sale.store.state,
        city: sale.store.city,
        taxRegime: sale.store.taxRegime,
      },
      sale: {
        id: sale.id,
        number: sale.number,
        customerName: sale.customerName ?? null,
        closedAt: sale.closedAt?.toISOString() ?? null,
        subtotal: toNumber(sale.subtotal),
        discount: toNumber(sale.discount),
        total: toNumber(sale.total),
        payments: sale.payments.map((payment) => ({
          method: payment.method,
          amount: toNumber(payment.amount),
        })),
      },
      lines,
      totals: {
        documentTotal: toNumber(sale.total),
        taxablePreparationFeeTotal: roundMoney(
          lines
            .filter((line) => line.lineType === "PREPARATION_FEE")
            .reduce((sum, line) => sum + toNumber(line.total), 0),
        ),
        ingredientLinesTotal: roundMoney(
          lines
            .filter((line) => line.lineType === "INGREDIENT")
            .reduce((sum, line) => sum + toNumber(line.total), 0),
        ),
      },
      warnings,
      officialTransmission: {
        enabled: false,
        status: "BLOCKED_UNTIL_HOMOLOGATION",
        reason: blockedTransmissionMessage(),
      },
    };

    return tx.fiscalDocument.create({
      data: {
        storeId: sale.storeId,
        saleId: sale.id,
        type,
        environment,
        status: "VALIDATED",
        series,
        number,
        payload,
      },
      include: fiscalDocumentInclude,
    });
  });
}

export async function preparePurchaseReturnFiscalDocument(
  userId: string,
  purchaseId: string,
  input: FiscalReturnPrepareInput,
) {
  return prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.findFirst({
      where: { id: purchaseId, store: { ownerId: userId } },
      include: {
        store: true,
        supplier: true,
        items: { include: { ingredient: { include: { taxClassification: true } } } },
      },
    });

    if (!purchase || !purchase.storeId || !purchase.store) {
      throw new Error("Compra nao encontrada para este usuario.");
    }

    if (input.storeId && input.storeId !== purchase.storeId) {
      throw new Error("Compra nao pertence a loja informada.");
    }

    if (purchase.status !== "POSTED") {
      throw new Error("Apenas compras lancadas podem preparar devolucao.");
    }

    const environment = input.environment;
    const series = cleanSeries(input.series);
    const existing = await returnExistingDocument(tx, {
      purchaseId: purchase.id,
      type: "NFE_DEVOLUCAO",
      environment,
      series,
    });

    if (existing) {
      return existing;
    }

    await assertStoreOwner(tx, userId, purchase.storeId);
    const number = await nextFiscalNumber(tx, {
      storeId: purchase.storeId,
      documentType: "NFE_DEVOLUCAO",
      environment,
      series,
    });
    const warnings: string[] = [];
    const lines = purchase.items.map<Prisma.InputJsonObject>((item, index) => {
      const classification = item.ingredient.taxClassification;

      if (!classification) {
        warnings.push(`Ingrediente ${item.ingredient.name} sem cClassTrib; revisar devolucao antes da emissao.`);
      }

      return {
        line: index + 1,
        lineType: "RETURN_ITEM",
        label: item.ingredient.name,
        ingredientId: item.ingredient.id,
        quantity: toNumber(item.quantity),
        unitMeasure: item.ingredient.unitMeasure,
        unitValue: toNumber(item.unitCost),
        total: toNumber(item.totalCost),
        ncm: item.ingredient.ncm,
        cfop: "5202",
        icmsCst: item.ingredient.icmsCst ?? null,
        icmsCsosn: item.ingredient.icmsCsosn ?? null,
        pisCst: item.ingredient.pisCst,
        cofinsCst: item.ingredient.cofinsCst,
        cstIbsCbs: classification?.cstIbsCbs ?? "000",
        cClassTrib: classification?.cClassTrib ?? "000001",
      };
    });
    const internalKey = buildInternalKey({
      storeDocument: purchase.store.document ?? null,
      type: "NFE_DEVOLUCAO",
      environment,
      series,
      number,
    });
    const payload: Prisma.InputJsonObject = {
      schemaVersion: "PLUX-FISCAL-DOC-1",
      documentType: "NFE_DEVOLUCAO",
      documentLabel: documentLabel("NFE_DEVOLUCAO"),
      environment,
      series,
      number,
      internalKey,
      reason: input.reason,
      store: {
        id: purchase.store.id,
        legalName: purchase.store.legalName,
        tradeName: purchase.store.tradeName,
        document: purchase.store.document ?? null,
        state: purchase.store.state,
        city: purchase.store.city,
        taxRegime: purchase.store.taxRegime,
      },
      supplier: purchase.supplier
        ? {
            id: purchase.supplier.id,
            name: purchase.supplier.name,
            document: purchase.supplier.document ?? null,
          }
        : null,
      purchase: {
        id: purchase.id,
        number: purchase.number,
        issueDate: purchase.issueDate.toISOString(),
        total: toNumber(purchase.total),
      },
      lines,
      totals: {
        documentTotal: toNumber(purchase.total),
      },
      warnings,
      officialTransmission: {
        enabled: false,
        status: "BLOCKED_UNTIL_HOMOLOGATION",
        reason: blockedTransmissionMessage(),
      },
    };

    return tx.fiscalDocument.create({
      data: {
        storeId: purchase.storeId,
        purchaseId: purchase.id,
        type: "NFE_DEVOLUCAO",
        environment,
        status: "VALIDATED",
        series,
        number,
        payload,
        events: {
          create: {
            type: "DEVOLUCAO",
            status: "VALIDATED",
            reason: input.reason,
            payload: { purchaseId: purchase.id, total: toNumber(purchase.total) },
          },
        },
      },
      include: fiscalDocumentInclude,
    });
  });
}

export async function transmitFiscalDocument(userId: string, documentId: string) {
  return prisma.$transaction(async (tx) => {
    const document = await tx.fiscalDocument.findFirst({
      where: { id: documentId, store: { ownerId: userId } },
    });

    if (!document) {
      throw new Error("Documento fiscal nao encontrado.");
    }

    if (document.status === "CANCELLED") {
      throw new Error("Documento cancelado nao pode ser transmitido.");
    }

    const reason = blockedTransmissionMessage();
    await tx.fiscalDocumentEvent.create({
      data: {
        documentId: document.id,
        type: "TRANSMISSAO",
        status: "TRANSMISSION_BLOCKED",
        reason,
        payload: {
          requestedAt: new Date().toISOString(),
          requiredEnv: [
            "FISCAL_ENABLE_SEFAZ_TRANSMISSION",
            "FISCAL_CERTIFICATE_PATH",
            "FISCAL_CERTIFICATE_PASSWORD",
            "FISCAL_SEFAZ_UF",
          ],
        },
        response: { blocked: true, reason },
      },
    });

    return tx.fiscalDocument.update({
      where: { id: document.id },
      data: {
        status: "TRANSMISSION_BLOCKED",
        rejectionReason: reason,
        xmlSha256: document.xml ? createHash("sha256").update(document.xml).digest("hex") : hashPayload(document.payload),
      },
      include: fiscalDocumentInclude,
    });
  });
}

export async function cancelFiscalDocument(userId: string, documentId: string, input: FiscalCancelInput) {
  return prisma.$transaction(async (tx) => {
    const document = await tx.fiscalDocument.findFirst({
      where: { id: documentId, store: { ownerId: userId } },
    });

    if (!document) {
      throw new Error("Documento fiscal nao encontrado.");
    }

    if (document.status === "CANCELLED") {
      return tx.fiscalDocument.findUnique({ where: { id: document.id }, include: fiscalDocumentInclude });
    }

    if (document.status === "AUTHORIZED") {
      const reason = `Cancelamento oficial bloqueado ate homologacao SEFAZ. Motivo informado: ${input.reason}`;
      await tx.fiscalDocumentEvent.create({
        data: {
          documentId: document.id,
          type: "CANCELAMENTO",
          status: "TRANSMISSION_BLOCKED",
          reason,
          payload: { requestedAt: new Date().toISOString(), reason: input.reason },
          response: { blocked: true, reason },
        },
      });

      return tx.fiscalDocument.update({
        where: { id: document.id },
        data: {
          status: "TRANSMISSION_BLOCKED",
          rejectionReason: reason,
        },
        include: fiscalDocumentInclude,
      });
    }

    await tx.fiscalDocumentEvent.create({
      data: {
        documentId: document.id,
        type: "CANCELAMENTO",
        status: "CANCELLED",
        reason: input.reason,
        payload: { cancelledAt: new Date().toISOString(), reason: input.reason },
      },
    });

    return tx.fiscalDocument.update({
      where: { id: document.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        rejectionReason: input.reason,
      },
      include: fiscalDocumentInclude,
    });
  });
}
