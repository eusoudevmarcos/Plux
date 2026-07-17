"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { TaxClassification } from "@/features/tax/types";
import { createIngredient, updateIngredient } from "../api/ingredientsApi";
import { ingredientFormSchema, type IngredientFormValues } from "../schemas/ingredient.schema";
import type { Ingredient } from "../types";
import styles from "./Ingredients.module.css";

const defaultValues: IngredientFormValues = {
  name: "",
  unitMeasure: "g",
  unitCost: 0,
  stockCurrent: 0,
  ncm: "",
  pisCst: "06",
  cofinsCst: "06",
  icmsCst: "",
  icmsCsosn: "",
  taxBenefitCode: "",
  taxConfidence: "REVIEW_REQUIRED",
  taxClassificationId: "",
  taxNotes: "",
};

export function IngredientForm({
  ingredient,
  taxClassifications,
  onSaved,
  onCancelEdit,
}: {
  ingredient?: Ingredient | null;
  taxClassifications: TaxClassification[];
  onSaved: () => Promise<void>;
  onCancelEdit: () => void;
}) {
  const isEditing = Boolean(ingredient);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<IngredientFormValues>({
    resolver: zodResolver(ingredientFormSchema),
    defaultValues,
  });

  const editValues = useMemo<IngredientFormValues | null>(() => {
    if (!ingredient) {
      return null;
    }

    return {
      name: ingredient.name,
      unitMeasure: ingredient.unitMeasure,
      unitCost: Number(ingredient.unitCost),
      stockCurrent: Number(ingredient.stockCurrent),
      ncm: ingredient.ncm,
      pisCst: ingredient.pisCst,
      cofinsCst: ingredient.cofinsCst,
      icmsCst: ingredient.icmsCst ?? "",
      icmsCsosn: ingredient.icmsCsosn ?? "",
      taxBenefitCode: ingredient.taxBenefitCode ?? "",
      taxConfidence: ingredient.taxConfidence,
      taxClassificationId: ingredient.taxClassificationId ?? "",
      taxNotes: ingredient.taxNotes ?? "",
    };
  }, [ingredient]);

  useEffect(() => {
    form.reset(editValues ?? defaultValues);
    setMessage(null);
    setError(null);
  }, [editValues, form]);

  async function onSubmit(values: IngredientFormValues) {
    setMessage(null);
    setError(null);

    try {
      if (ingredient) {
        await updateIngredient(ingredient.id, values);
      } else {
        await createIngredient(values);
      }

      form.reset(defaultValues);
      await onSaved();
      setMessage(isEditing ? "Ingrediente atualizado." : "Ingrediente criado.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar ingrediente.");
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className={styles.form}>
      <div className={styles.cardHeader}>
        <div>
          <h3>{isEditing ? "Editar ingrediente" : "Novo ingrediente"}</h3>
          {isEditing ? <span>{ingredient?.name}</span> : null}
        </div>
        {isEditing ? (
          <Button type="button" variant="ghost" onClick={onCancelEdit} title="Cancelar edição">
            <X size={16} aria-hidden />
          </Button>
        ) : null}
      </div>

      <div className={styles.twoCols}>
        <Input label="Nome" error={form.formState.errors.name?.message} {...form.register("name")} />
        <Select label="Unidade" {...form.register("unitMeasure")}>
          <option value="g">g</option>
          <option value="ml">ml</option>
          <option value="un">un</option>
        </Select>
        <Input
          label="Custo unitário"
          type="number"
          step="0.0001"
          error={form.formState.errors.unitCost?.message}
          {...form.register("unitCost", { valueAsNumber: true })}
        />
        <Input
          label="Estoque"
          type="number"
          step="0.001"
          error={form.formState.errors.stockCurrent?.message}
          {...form.register("stockCurrent", { valueAsNumber: true })}
        />
        <Input label="NCM" error={form.formState.errors.ncm?.message} {...form.register("ncm")} />
        <Select label="Confiança fiscal" {...form.register("taxConfidence")}>
          <option value="REVIEW_REQUIRED">Revisar</option>
          <option value="APPROVED">Aprovado</option>
          <option value="BLOCKED">Bloqueado</option>
        </Select>
        <Input label="PIS CST" {...form.register("pisCst")} />
        <Input label="COFINS CST" {...form.register("cofinsCst")} />
      </div>

      <Select label="CST IBS/CBS + cClassTrib" {...form.register("taxClassificationId")}>
        <option value="">Sem classificação</option>
        {taxClassifications.map((item) => (
          <option key={item.id} value={item.id}>
            {item.cstIbsCbs} · {item.cClassTrib} · {item.cClassName}
          </option>
        ))}
      </Select>

      <label className={styles.textareaField}>
        <span>Notas fiscais internas</span>
        <textarea rows={4} {...form.register("taxNotes")} />
      </label>

      {message ? <div className={styles.success}>{message}</div> : null}
      {error ? <div className={styles.alert}>{error}</div> : null}

      <Button type="submit" disabled={form.formState.isSubmitting}>
        <Save size={16} aria-hidden />
        {isEditing ? "Atualizar" : "Salvar"}
      </Button>
    </form>
  );
}
