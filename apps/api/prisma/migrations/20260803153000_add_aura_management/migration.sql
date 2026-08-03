-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('AURA_ADMIN', 'COMPANY_ADMIN');

-- CreateEnum
CREATE TYPE "AuraCustomerStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'CANCELED');

-- CreateEnum
CREATE TYPE "AuraContractStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUSPENDED', 'CANCELED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AuraPaymentStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELED');

-- CreateEnum
CREATE TYPE "AuraPaymentMethod" AS ENUM ('PIX', 'CREDIT_CARD', 'BOLETO', 'BANK_TRANSFER', 'CASH', 'OTHER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'COMPANY_ADMIN';

-- CreateTable
CREATE TABLE "AuraPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "monthlyPrice" DECIMAL(12,2) NOT NULL,
    "setupFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "maxStores" INTEGER NOT NULL DEFAULT 1,
    "features" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuraPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuraCustomerAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "tradeName" TEXT,
    "document" TEXT,
    "phone" TEXT,
    "taxRegime" "TaxRegime" NOT NULL DEFAULT 'SIMPLES',
    "status" "AuraCustomerStatus" NOT NULL DEFAULT 'PENDING',
    "accessEnabled" BOOLEAN NOT NULL DEFAULT false,
    "contractApprovedAt" TIMESTAMP(3),
    "paymentCurrentUntil" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuraCustomerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuraContract" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "AuraContractStatus" NOT NULL DEFAULT 'DRAFT',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "signedAt" TIMESTAMP(3),
    "monthlyPriceSnapshot" DECIMAL(12,2) NOT NULL,
    "setupFeeSnapshot" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "contractUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuraContract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuraPayment" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "contractId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "status" "AuraPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "method" "AuraPaymentMethod" NOT NULL DEFAULT 'PIX',
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuraPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuraPlan_name_key" ON "AuraPlan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AuraCustomerAccount_userId_key" ON "AuraCustomerAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AuraCustomerAccount_document_key" ON "AuraCustomerAccount"("document");

-- CreateIndex
CREATE UNIQUE INDEX "AuraContract_code_key" ON "AuraContract"("code");

-- CreateIndex
CREATE INDEX "AuraContract_customerId_idx" ON "AuraContract"("customerId");

-- CreateIndex
CREATE INDEX "AuraContract_planId_idx" ON "AuraContract"("planId");

-- CreateIndex
CREATE INDEX "AuraPayment_customerId_idx" ON "AuraPayment"("customerId");

-- CreateIndex
CREATE INDEX "AuraPayment_contractId_idx" ON "AuraPayment"("contractId");

-- AddForeignKey
ALTER TABLE "AuraCustomerAccount" ADD CONSTRAINT "AuraCustomerAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuraContract" ADD CONSTRAINT "AuraContract_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "AuraCustomerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuraContract" ADD CONSTRAINT "AuraContract_planId_fkey" FOREIGN KEY ("planId") REFERENCES "AuraPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuraPayment" ADD CONSTRAINT "AuraPayment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "AuraCustomerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuraPayment" ADD CONSTRAINT "AuraPayment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "AuraContract"("id") ON DELETE SET NULL ON UPDATE CASCADE;
