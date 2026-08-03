import type { Ingredient } from "../ingredients/types";
import type { TaxClassification } from "../tax/types";

export type FiscalStrategy = "COMBINED_FOOD_SERVICE" | "SPLIT_INGREDIENTS_PREPARATION_FEE";

export type Product = {
  id: string;
  storeId?: string | null;
  name: string;
  sku: string;
  category: string;
  salePrice: string | number;
  active: boolean;
  preparationFee: string | number;
  fiscalStrategy: FiscalStrategy;
  ingredients: Array<{
    id: string;
    qtyUsed: string | number;
    unitCostSnapshot: string | number;
    totalCostSnapshot: string | number;
    ingredient: Ingredient;
  }>;
  taxProfile?: {
    uf: string;
    taxRegime: string;
    ncm: string;
    csosn: string;
    pisCst: string;
    cofinsCst: string;
    cstIbsCbs: string;
    cClassTrib: string;
    preparationFeeNcm: string;
    preparationFeeCstIbsCbs: string;
    preparationFeeCClassTrib: string;
    requiresLegalReview: boolean;
    taxClassification?: TaxClassification | null;
    preparationFeeTaxClassification?: TaxClassification | null;
  } | null;
};

export type ProductCreateResponse = {
  productId: string;
  cmvTotal: number;
  grossMarginValue: number;
  grossMarginPercent: number;
  taxSimulation: {
    strategy: FiscalStrategy;
    taxableLines: Array<{
      label: string;
      base: number;
      cstIbsCbs: string;
      cClassTrib: string;
      pRedIbs: number;
      pRedCbs: number;
      ibsBase: number;
      cbsBase: number;
      ibsValue: number;
      cbsValue: number;
      totalTax: number;
    }>;
    totals: {
      ibsValue: number;
      cbsValue: number;
      totalTax: number;
      taxableBase: number;
    };
  };
  product: Product;
};
