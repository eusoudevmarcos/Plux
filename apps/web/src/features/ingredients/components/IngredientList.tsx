"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/lib/utils/money";
import { deleteIngredient } from "../api/ingredientsApi";
import type { Ingredient } from "../types";
import styles from "./Ingredients.module.css";

const confidenceLabel = {
  APPROVED: "Aprovado",
  REVIEW_REQUIRED: "Revisar",
  BLOCKED: "Bloqueado",
};

export function IngredientList({
  ingredients,
  onChanged,
}: {
  ingredients: Ingredient[];
  onChanged: () => Promise<void>;
}) {
  async function handleDelete(id: string) {
    await deleteIngredient(id);
    await onChanged();
  }

  if (ingredients.length === 0) {
    return <div className={styles.empty}>Nenhum ingrediente cadastrado.</div>;
  }

  return (
    <div className={styles.tableWrap}>
      <table>
        <thead>
          <tr>
            <th>Ingrediente</th>
            <th>Custo</th>
            <th>Estoque</th>
            <th>NCM</th>
            <th>IBS/CBS</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {ingredients.map((ingredient) => (
            <tr key={ingredient.id}>
              <td>
                <strong>{ingredient.name}</strong>
                <span>{ingredient.unitMeasure}</span>
              </td>
              <td>{formatMoney(Number(ingredient.unitCost))}</td>
              <td>
                {Number(ingredient.stockCurrent).toLocaleString("pt-BR")} {ingredient.unitMeasure}
              </td>
              <td>{ingredient.ncm}</td>
              <td>
                {ingredient.taxClassification ? (
                  <>
                    <strong>{ingredient.taxClassification.cstIbsCbs}</strong>
                    <span>{ingredient.taxClassification.cClassTrib}</span>
                  </>
                ) : (
                  <span>Sem classe</span>
                )}
              </td>
              <td>
                <span className={styles.badge}>{confidenceLabel[ingredient.taxConfidence]}</span>
              </td>
              <td>
                <Button variant="ghost" title="Remover ingrediente" onClick={() => handleDelete(ingredient.id)}>
                  <Trash2 size={16} aria-hidden />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

