import type { CompanyProfile } from "@/features/company/types";

export type ProductFinancialRow = {
  productId: string;
  name: string;
  sku: string;
  category: string;
  active: boolean;
  salePrice: number;
  ingredientCost: number;
  ingredientRevenueBase: number;
  preparationFee: number;
  grossProfit: number;
  grossMarginPercent: number;
  cmvPercent: number;
  markup: number | null;
};

export type ProductFinancialCategory = {
  category: string;
  productsCount: number;
  saleValue: number;
  ingredientCost: number;
  preparationFee: number;
  grossProfit: number;
  grossMarginPercent: number;
  cmvPercent: number;
};

export type ProductFinancialReport = {
  companyProfile: CompanyProfile | null;
  summary: {
    productsCount: number;
    activeProductsCount: number;
    inactiveProductsCount: number;
    totalSaleValue: number;
    totalIngredientCost: number;
    totalPreparationFee: number;
    totalGrossProfit: number;
    grossMarginPercent: number;
    cmvPercent: number;
  };
  categories: ProductFinancialCategory[];
  rows: ProductFinancialRow[];
};
