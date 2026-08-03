"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, ChevronRight, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { getCompanyProfile } from "@/features/company/api/companyApi";
import { getIngredients } from "@/features/ingredients/api/ingredientsApi";
import type { Ingredient } from "@/features/ingredients/types";
import { getTaxClassifications } from "@/features/tax/api/taxApi";
import type { TaxClassification } from "@/features/tax/types";
import { formatMoney, formatPercent } from "@/lib/utils/money";
import { createFullProduct } from "../api/productsApi";
import { productWizardSchema, type ProductWizardValues } from "../schemas/product.schema";
import { FiscalFields } from "./FiscalFields";
import styles from "./ProductWizard.module.css";

const defaultValues: ProductWizardValues = {
  name: "",
  sku: "",
  category: "Hambúrguer",
  salePrice: 0,
  active: true,
  preparationFee: 5,
  fiscalStrategy: "SPLIT_INGREDIENTS_PREPARATION_FEE",
  composition: [{ ingredientId: "", qtyUsed: 1 }],
  fiscal: {
    uf: "DF",
    taxRegime: "SIMPLES",
    ncm: "21069090",
    csosn: "102",
    pisCst: "01",
    cofinsCst: "01",
    taxClassificationId: "",
    preparationFeeNcm: "21069090",
    preparationFeeTaxClassificationId: "",
    legalBasis:
      "Cenário interno: venda de ingredientes classificados individualmente + taxa técnica de preparo. Exige validação documental, contratual e fiscal antes de emissão real.",
    requiresLegalReview: true,
  },
};

function numeric(value: string | number | undefined | null) {
  return Number(value ?? 0);
}

function reduction(value: string | number | undefined) {
  return Number(value ?? 0);
}

function calculateLineTax(base: number, classification?: TaxClassification | null) {
  if (!classification) {
    return { ibsBase: base, cbsBase: base, totalTax: base * 0.01 };
  }

  const ibsBase = base * (1 - reduction(classification.pRedIbs) / 100);
  const cbsBase = base * (1 - reduction(classification.pRedCbs) / 100);

  return {
    ibsBase,
    cbsBase,
    totalTax: ibsBase * 0.001 + cbsBase * 0.009,
  };
}

export function ProductWizard() {
  const [step, setStep] = useState(0);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [taxClassifications, setTaxClassifications] = useState<TaxClassification[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ cmvTotal: number; taxTotal: number } | null>(null);

  const form = useForm<ProductWizardValues>({
    resolver: zodResolver(productWizardSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "composition",
  });

  const watchedComposition = form.watch("composition");
  const watchedSalePrice = form.watch("salePrice");
  const watchedPreparationFee = form.watch("preparationFee");
  const watchedFiscalStrategy = form.watch("fiscalStrategy");
  const watchedProductClassId = form.watch("fiscal.taxClassificationId");
  const watchedFeeClassId = form.watch("fiscal.preparationFeeTaxClassificationId");

  useEffect(() => {
    Promise.all([getIngredients(), getTaxClassifications(), getCompanyProfile()])
      .then(([ingredientData, taxData, companyProfile]) => {
        setIngredients(ingredientData);
        setTaxClassifications(taxData);

        if (companyProfile) {
          form.setValue("fiscal.uf", companyProfile.uf);
          form.setValue("fiscal.taxRegime", companyProfile.taxRegime);
        }

        const bars = taxData.find((item) => item.cClassTrib === "200047");
        const integral = taxData.find((item) => item.cClassTrib === "000001");

        if (bars) {
          form.setValue("fiscal.taxClassificationId", bars.id);
        }

        if (integral) {
          form.setValue("fiscal.preparationFeeTaxClassificationId", integral.id);
        }
      })
      .catch((err: Error) => setError(err.message));
  }, [form]);

  const ingredientById = useMemo(() => {
    return new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
  }, [ingredients]);

  const productTaxClass = taxClassifications.find((item) => item.id === watchedProductClassId);
  const feeTaxClass = taxClassifications.find((item) => item.id === watchedFeeClassId);

  const metrics = useMemo(() => {
    const composition = watchedComposition ?? [];
    const rows = composition.map((item) => {
      const ingredient = ingredientById.get(item.ingredientId);
      const qty = Number(item.qtyUsed || 0);
      const cost = numeric(ingredient?.unitCost) * qty;

      return { ingredient, qty, cost };
    });

    const cmv = rows.reduce((sum, row) => sum + row.cost, 0);
    const salePrice = Number(watchedSalePrice || 0);
    const preparationFee = Number(watchedPreparationFee || 0);
    const ingredientRevenueBase = Math.max(salePrice - preparationFee, 0);
    const totalCost = cmv;

    let estimatedTax = 0;

    if (watchedFiscalStrategy === "COMBINED_FOOD_SERVICE") {
      estimatedTax = calculateLineTax(salePrice, productTaxClass).totalTax;
    } else {
      for (const row of rows) {
        const share = totalCost > 0 ? row.cost / totalCost : 0;
        const base = ingredientRevenueBase * share;
        estimatedTax += calculateLineTax(base, row.ingredient?.taxClassification ?? productTaxClass).totalTax;
      }

      estimatedTax += calculateLineTax(preparationFee, feeTaxClass).totalTax;
    }

    return {
      cmv,
      marginValue: salePrice - cmv,
      marginPercent: salePrice > 0 ? ((salePrice - cmv) / salePrice) * 100 : 0,
      estimatedTax,
      rows,
    };
  }, [
    watchedComposition,
    watchedSalePrice,
    watchedPreparationFee,
    watchedFiscalStrategy,
    productTaxClass,
    feeTaxClass,
    ingredientById,
  ]);

  async function onSubmit(values: ProductWizardValues) {
    setMessage(null);
    setError(null);
    setLastResult(null);

    try {
      const result = await createFullProduct(values);
      setLastResult({ cmvTotal: result.cmvTotal, taxTotal: result.taxSimulation.totals.totalTax });
      setMessage(`Produto criado: ${result.product.name}`);
      form.reset({
        ...defaultValues,
        fiscal: {
          ...defaultValues.fiscal,
          taxClassificationId: watchedProductClassId,
          preparationFeeTaxClassificationId: watchedFeeClassId,
        },
      });
      setStep(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar produto.");
    }
  }

  return (
    <section className={styles.page}>
      <div className={styles.titleRow}>
        <div>
          <p className={styles.kicker}>Esteira de produto composto</p>
          <h2>Novo produto</h2>
        </div>
        <div className={styles.stepper}>
          {["Dados", "Composição", "Fiscal"].map((label, index) => (
            <button
              key={label}
              type="button"
              className={step === index ? styles.activeStep : styles.step}
              onClick={() => setStep(index)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.grid}>
        <Card className={styles.wizardCard}>
          <form onSubmit={form.handleSubmit(onSubmit)} className={styles.form}>
            {step === 0 ? (
              <div className={styles.panel}>
                <div className={styles.twoCols}>
                  <Input label="Nome" error={form.formState.errors.name?.message} {...form.register("name")} />
                  <Input label="SKU" error={form.formState.errors.sku?.message} {...form.register("sku")} />
                  <Input label="Categoria" error={form.formState.errors.category?.message} {...form.register("category")} />
                  <Input
                    label="Preço de venda"
                    type="number"
                    step="0.01"
                    error={form.formState.errors.salePrice?.message}
                    {...form.register("salePrice", { valueAsNumber: true })}
                  />
                  <Input
                    label="Taxa de preparo"
                    type="number"
                    step="0.01"
                    error={form.formState.errors.preparationFee?.message}
                    {...form.register("preparationFee", { valueAsNumber: true })}
                  />
                  <Select label="Estratégia fiscal" {...form.register("fiscalStrategy")}>
                    <option value="SPLIT_INGREDIENTS_PREPARATION_FEE">Ingredientes + preparo</option>
                    <option value="COMBINED_FOOD_SERVICE">Produto final food service</option>
                  </Select>
                </div>
              </div>
            ) : null}

            {step === 1 ? (
              <div className={styles.panel}>
                <div className={styles.compositionHeader}>
                  <h3>Composição</h3>
                  <Button type="button" variant="secondary" onClick={() => append({ ingredientId: "", qtyUsed: 1 })}>
                    <Plus size={16} aria-hidden />
                    Adicionar
                  </Button>
                </div>

                <div className={styles.compositionList}>
                  {fields.map((field, index) => {
                    const selectedIngredient = ingredientById.get(watchedComposition?.[index]?.ingredientId ?? "");

                    return (
                      <div className={styles.compositionRow} key={field.id}>
                        <Select label="Ingrediente" {...form.register(`composition.${index}.ingredientId`)}>
                          <option value="">Selecione</option>
                          {ingredients.map((ingredient) => (
                            <option key={ingredient.id} value={ingredient.id}>
                              {ingredient.name} · {formatMoney(numeric(ingredient.unitCost))}/{ingredient.unitMeasure}
                            </option>
                          ))}
                        </Select>
                        <Input
                          label={`Qtd. ${selectedIngredient?.unitMeasure ?? ""}`}
                          type="number"
                          step="0.001"
                          {...form.register(`composition.${index}.qtyUsed`, { valueAsNumber: true })}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          title="Remover item da composição"
                          onClick={() => fields.length > 1 && remove(index)}
                        >
                          <Trash2 size={16} aria-hidden />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <FiscalFields form={form} taxClassifications={taxClassifications} />
            ) : null}

            {message ? <div className={styles.success}>{message}</div> : null}
            {error ? <div className={styles.alert}>{error}</div> : null}

            <div className={styles.actions}>
              <Button type="button" variant="secondary" disabled={step === 0} onClick={() => setStep((value) => value - 1)}>
                <ChevronLeft size={16} aria-hidden />
                Voltar
              </Button>
              {step < 2 ? (
                <Button type="button" onClick={() => setStep((value) => value + 1)}>
                  Avançar
                  <ChevronRight size={16} aria-hidden />
                </Button>
              ) : (
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  <Save size={16} aria-hidden />
                  Criar produto
                </Button>
              )}
            </div>
          </form>
        </Card>

        <aside className={styles.summary}>
          <Card className={styles.summaryCard}>
            <p>CMV total</p>
            <strong>{formatMoney(metrics.cmv)}</strong>
          </Card>
          <Card className={styles.summaryCard}>
            <p>Margem bruta</p>
            <strong>{formatMoney(metrics.marginValue)}</strong>
            <span>{formatPercent(metrics.marginPercent)}%</span>
          </Card>
          <Card className={styles.summaryCard}>
            <p>IBS/CBS estimado</p>
            <strong>{formatMoney(metrics.estimatedTax)}</strong>
            <span>{watchedFiscalStrategy === "SPLIT_INGREDIENTS_PREPARATION_FEE" ? "split fiscal" : "produto único"}</span>
          </Card>
          <Card className={styles.taxCard}>
            <h3>Linhas fiscais</h3>
            <div className={styles.taxLines}>
              {metrics.rows.map((row, index) => (
                <div key={`${row.ingredient?.id ?? index}-${index}`}>
                  <span>{row.ingredient?.name ?? "Ingrediente"}</span>
                  <strong>{formatMoney(row.cost)}</strong>
                  <small>
                    {row.ingredient?.taxClassification?.cstIbsCbs ?? "---"} ·{" "}
                    {row.ingredient?.taxClassification?.cClassTrib ?? "sem classe"}
                  </small>
                </div>
              ))}
              <div>
                <span>Taxa de preparo</span>
                <strong>{formatMoney(Number(watchedPreparationFee || 0))}</strong>
                <small>{feeTaxClass ? `${feeTaxClass.cstIbsCbs} · ${feeTaxClass.cClassTrib}` : "sem classe"}</small>
              </div>
            </div>
          </Card>
          {lastResult ? (
            <Card className={styles.summaryCard}>
              <p>Último retorno API</p>
              <strong>{formatMoney(lastResult.cmvTotal)}</strong>
              <span>Tributos {formatMoney(lastResult.taxTotal)}</span>
            </Card>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
