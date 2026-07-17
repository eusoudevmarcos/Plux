"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { getTaxClassifications } from "@/features/tax/api/taxApi";
import type { TaxClassification } from "@/features/tax/types";
import { getIngredients } from "../api/ingredientsApi";
import type { Ingredient } from "../types";
import { IngredientForm } from "./IngredientForm";
import { IngredientList } from "./IngredientList";
import styles from "./Ingredients.module.css";

export function IngredientManager() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [taxClassifications, setTaxClassifications] = useState<TaxClassification[]>([]);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const [ingredientData, taxData] = await Promise.all([getIngredients(), getTaxClassifications()]);
    setIngredients(ingredientData);
    setTaxClassifications(taxData);
  }

  useEffect(() => {
    refresh()
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className={styles.page}>
      <div className={styles.titleRow}>
        <div>
          <p className={styles.kicker}>Esteira fiscal de insumos</p>
          <h2>Ingredientes</h2>
        </div>
        <span>{ingredients.length} itens</span>
      </div>

      {error ? <div className={styles.alert}>{error}</div> : null}

      <div className={styles.grid}>
        <Card className={styles.formCard}>
          <IngredientForm
            ingredient={editingIngredient}
            taxClassifications={taxClassifications}
            onCancelEdit={() => setEditingIngredient(null)}
            onSaved={async () => {
              setEditingIngredient(null);
              await refresh();
            }}
          />
        </Card>

        <Card className={styles.listCard}>
          {loading ? (
            <div className={styles.empty}>Carregando ingredientes...</div>
          ) : (
            <IngredientList ingredients={ingredients} onEdit={setEditingIngredient} onChanged={refresh} />
          )}
        </Card>
      </div>
    </section>
  );
}
