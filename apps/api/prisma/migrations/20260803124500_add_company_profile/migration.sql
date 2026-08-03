-- CreateTable
CREATE TABLE "CompanyProfile" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "legalName" TEXT NOT NULL,
    "tradeName" TEXT,
    "document" TEXT,
    "taxRegime" "TaxRegime" NOT NULL DEFAULT 'SIMPLES',
    "uf" TEXT NOT NULL DEFAULT 'DF',
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompanyProfile_document_key" ON "CompanyProfile"("document");
