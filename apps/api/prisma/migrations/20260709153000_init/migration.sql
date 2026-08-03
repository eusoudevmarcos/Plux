-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UnitMeasure" AS ENUM ('g', 'ml', 'un');

-- CreateEnum
CREATE TYPE "TaxRegime" AS ENUM ('SIMPLES', 'LUCRO_PRESUMIDO', 'LUCRO_REAL');

-- CreateEnum
CREATE TYPE "TaxConfidence" AS ENUM ('APPROVED', 'REVIEW_REQUIRED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "FiscalStrategy" AS ENUM ('COMBINED_FOOD_SERVICE', 'SPLIT_INGREDIENTS_PREPARATION_FEE');

-- CreateTable
CREATE TABLE "TaxClassification" (
    "id" TEXT NOT NULL,
    "sourceVersion" TEXT NOT NULL,
    "cstIbsCbs" TEXT NOT NULL,
    "cstDescription" TEXT NOT NULL,
    "cClassTrib" TEXT NOT NULL,
    "cClassName" TEXT NOT NULL,
    "cClassDescription" TEXT,
    "rateType" TEXT,
    "pRedIbs" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "pRedCbs" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "appliesNfe" BOOLEAN NOT NULL DEFAULT true,
    "appliesNfce" BOOLEAN NOT NULL DEFAULT true,
    "appliesNfse" BOOLEAN NOT NULL DEFAULT false,
    "legalReference" TEXT,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxClassification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ingredient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unitMeasure" "UnitMeasure" NOT NULL,
    "unitCost" DECIMAL(12,4) NOT NULL,
    "stockCurrent" DECIMAL(14,3) NOT NULL,
    "ncm" TEXT NOT NULL,
    "pisCst" TEXT NOT NULL DEFAULT '06',
    "cofinsCst" TEXT NOT NULL DEFAULT '06',
    "icmsCst" TEXT,
    "icmsCsosn" TEXT,
    "taxBenefitCode" TEXT,
    "taxConfidence" "TaxConfidence" NOT NULL DEFAULT 'REVIEW_REQUIRED',
    "taxNotes" TEXT,
    "taxClassificationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ingredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "salePrice" DECIMAL(12,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "preparationFee" DECIMAL(12,2) NOT NULL DEFAULT 5.00,
    "fiscalStrategy" "FiscalStrategy" NOT NULL DEFAULT 'SPLIT_INGREDIENTS_PREPARATION_FEE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductIngredient" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "qtyUsed" DECIMAL(14,3) NOT NULL,
    "unitCostSnapshot" DECIMAL(12,4) NOT NULL,
    "totalCostSnapshot" DECIMAL(12,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductTaxProfile" (
    "productId" TEXT NOT NULL,
    "uf" TEXT NOT NULL DEFAULT 'DF',
    "taxRegime" "TaxRegime" NOT NULL DEFAULT 'SIMPLES',
    "ncm" TEXT NOT NULL,
    "csosn" TEXT NOT NULL,
    "pisCst" TEXT NOT NULL,
    "cofinsCst" TEXT NOT NULL,
    "cstIbsCbs" TEXT NOT NULL,
    "cClassTrib" TEXT NOT NULL,
    "taxClassificationId" TEXT,
    "preparationFeeNcm" TEXT NOT NULL DEFAULT '21069090',
    "preparationFeeCstIbsCbs" TEXT NOT NULL,
    "preparationFeeCClassTrib" TEXT NOT NULL,
    "preparationFeeTaxClassificationId" TEXT,
    "fiscalStrategy" "FiscalStrategy" NOT NULL,
    "legalBasis" TEXT,
    "requiresLegalReview" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductTaxProfile_pkey" PRIMARY KEY ("productId")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaxClassification_cClassTrib_key" ON "TaxClassification"("cClassTrib");

-- CreateIndex
CREATE UNIQUE INDEX "Ingredient_name_key" ON "Ingredient"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "ProductIngredient_productId_ingredientId_key" ON "ProductIngredient"("productId", "ingredientId");

-- AddForeignKey
ALTER TABLE "Ingredient" ADD CONSTRAINT "Ingredient_taxClassificationId_fkey" FOREIGN KEY ("taxClassificationId") REFERENCES "TaxClassification"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductIngredient" ADD CONSTRAINT "ProductIngredient_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductIngredient" ADD CONSTRAINT "ProductIngredient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductTaxProfile" ADD CONSTRAINT "ProductTaxProfile_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductTaxProfile" ADD CONSTRAINT "ProductTaxProfile_taxClassificationId_fkey" FOREIGN KEY ("taxClassificationId") REFERENCES "TaxClassification"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductTaxProfile" ADD CONSTRAINT "ProductTaxProfile_preparationFeeTaxClassificationId_fkey" FOREIGN KEY ("preparationFeeTaxClassificationId") REFERENCES "TaxClassification"("id") ON DELETE SET NULL ON UPDATE CASCADE;

