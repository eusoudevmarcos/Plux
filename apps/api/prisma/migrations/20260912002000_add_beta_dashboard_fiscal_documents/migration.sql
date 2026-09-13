-- CreateEnum
CREATE TYPE "FiscalDocumentType" AS ENUM ('NFE', 'NFCE', 'NFE_DEVOLUCAO');

-- CreateEnum
CREATE TYPE "FiscalDocumentStatus" AS ENUM ('DRAFT', 'VALIDATED', 'TRANSMISSION_BLOCKED', 'QUEUED', 'AUTHORIZED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FiscalEventType" AS ENUM ('TRANSMISSAO', 'CANCELAMENTO', 'DEVOLUCAO', 'CARTA_CORRECAO', 'INUTILIZACAO');

-- CreateEnum
CREATE TYPE "FiscalEnvironment" AS ENUM ('HOMOLOGATION', 'PRODUCTION');

-- CreateTable
CREATE TABLE "FiscalSequence" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "documentType" "FiscalDocumentType" NOT NULL,
    "environment" "FiscalEnvironment" NOT NULL DEFAULT 'HOMOLOGATION',
    "series" TEXT NOT NULL DEFAULT '1',
    "currentNumber" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FiscalSequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiscalDocument" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "saleId" TEXT,
    "purchaseId" TEXT,
    "type" "FiscalDocumentType" NOT NULL,
    "environment" "FiscalEnvironment" NOT NULL DEFAULT 'HOMOLOGATION',
    "status" "FiscalDocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "series" TEXT NOT NULL DEFAULT '1',
    "number" INTEGER NOT NULL,
    "accessKey" TEXT,
    "protocol" TEXT,
    "rejectionReason" TEXT,
    "payload" JSONB NOT NULL,
    "xml" TEXT,
    "xmlSha256" TEXT,
    "issuedAt" TIMESTAMP(3),
    "authorizedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FiscalDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiscalDocumentEvent" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "type" "FiscalEventType" NOT NULL,
    "status" "FiscalDocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "reason" TEXT,
    "protocol" TEXT,
    "payload" JSONB,
    "response" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FiscalDocumentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FiscalSequence_storeId_idx" ON "FiscalSequence"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "FiscalSequence_storeId_documentType_environment_series_key" ON "FiscalSequence"("storeId", "documentType", "environment", "series");

-- CreateIndex
CREATE INDEX "FiscalDocument_storeId_idx" ON "FiscalDocument"("storeId");

-- CreateIndex
CREATE INDEX "FiscalDocument_saleId_idx" ON "FiscalDocument"("saleId");

-- CreateIndex
CREATE INDEX "FiscalDocument_purchaseId_idx" ON "FiscalDocument"("purchaseId");

-- CreateIndex
CREATE INDEX "FiscalDocument_status_idx" ON "FiscalDocument"("status");

-- CreateIndex
CREATE INDEX "FiscalDocument_createdAt_idx" ON "FiscalDocument"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FiscalDocument_storeId_type_environment_series_number_key" ON "FiscalDocument"("storeId", "type", "environment", "series", "number");

-- CreateIndex
CREATE INDEX "FiscalDocumentEvent_documentId_idx" ON "FiscalDocumentEvent"("documentId");

-- CreateIndex
CREATE INDEX "FiscalDocumentEvent_type_idx" ON "FiscalDocumentEvent"("type");

-- CreateIndex
CREATE INDEX "FiscalDocumentEvent_createdAt_idx" ON "FiscalDocumentEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "FiscalSequence" ADD CONSTRAINT "FiscalSequence_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalDocument" ADD CONSTRAINT "FiscalDocument_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalDocument" ADD CONSTRAINT "FiscalDocument_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalDocument" ADD CONSTRAINT "FiscalDocument_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalDocumentEvent" ADD CONSTRAINT "FiscalDocumentEvent_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "FiscalDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
