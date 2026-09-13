import type { Ingredient } from "@/features/ingredients/types";

export type Supplier = {
  id: string;
  storeId?: string | null;
  name: string;
  document?: string | null;
  phone?: string | null;
  email?: string | null;
  contactName?: string | null;
  notes?: string | null;
  active: boolean;
};

export type PurchaseItem = {
  id: string;
  ingredientId: string;
  quantity: string | number;
  unitCost: string | number;
  totalCost: string | number;
  previousStock: string | number;
  previousUnitCost: string | number;
  newStock: string | number;
  newUnitCost: string | number;
  ingredient: Ingredient;
};

export type AccountPayable = {
  id: string;
  description: string;
  amount: string | number;
  dueDate: string;
  paidAt?: string | null;
  status: "OPEN" | "PAID" | "CANCELED";
  notes?: string | null;
  supplier?: Supplier | null;
};

export type Purchase = {
  id: string;
  number: number;
  status: "POSTED" | "CANCELLED";
  issueDate: string;
  total: string | number;
  notes?: string | null;
  supplier?: Supplier | null;
  items: PurchaseItem[];
  accountsPayable: AccountPayable[];
};

export type SupplierCreatePayload = {
  storeId: string;
  name: string;
  document?: string | null;
  phone?: string | null;
  email?: string | null;
  contactName?: string | null;
  notes?: string | null;
};

export type PurchaseCreatePayload = {
  storeId: string;
  supplierId?: string | null;
  issueDate?: string;
  dueDate?: string | null;
  notes?: string | null;
  items: Array<{
    ingredientId: string;
    quantity: number;
    unitCost: number;
  }>;
};
