"use client";

import type { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { TaxClassification } from "@/features/tax/types";
import type { ProductWizardValues } from "../schemas/product.schema";
import styles from "./ProductWizard.module.css";

export function FiscalFields({
  form,
  taxClassifications,
}: {
  form: UseFormReturn<ProductWizardValues>;
  taxClassifications: TaxClassification[];
}) {
  return (
    <div className={styles.panel}>
      <div className={styles.twoCols}>
        <Input label="UF" error={form.formState.errors.fiscal?.uf?.message} {...form.register("fiscal.uf")} />
        <Select label="Regime" {...form.register("fiscal.taxRegime")}>
          <option value="SIMPLES">Simples Nacional</option>
          <option value="LUCRO_PRESUMIDO">Lucro presumido</option>
          <option value="LUCRO_REAL">Lucro real</option>
        </Select>
        <Input label="NCM produto" error={form.formState.errors.fiscal?.ncm?.message} {...form.register("fiscal.ncm")} />
        <Input label="CSOSN" error={form.formState.errors.fiscal?.csosn?.message} {...form.register("fiscal.csosn")} />
        <Input label="PIS CST" {...form.register("fiscal.pisCst")} />
        <Input label="COFINS CST" {...form.register("fiscal.cofinsCst")} />
      </div>

      <Select label="cClassTrib do produto" {...form.register("fiscal.taxClassificationId")}>
        <option value="">Selecione</option>
        {taxClassifications.map((item) => (
          <option key={item.id} value={item.id}>
            {item.cstIbsCbs} · {item.cClassTrib} · {item.cClassName}
          </option>
        ))}
      </Select>

      <div className={styles.twoCols}>
        <Input
          label="NCM taxa preparo"
          error={form.formState.errors.fiscal?.preparationFeeNcm?.message}
          {...form.register("fiscal.preparationFeeNcm")}
        />
        <Select label="cClassTrib taxa preparo" {...form.register("fiscal.preparationFeeTaxClassificationId")}>
          <option value="">Selecione</option>
          {taxClassifications.map((item) => (
            <option key={item.id} value={item.id}>
              {item.cstIbsCbs} · {item.cClassTrib} · {item.cClassName}
            </option>
          ))}
        </Select>
      </div>

      <label className={styles.checkboxField}>
        <input type="checkbox" {...form.register("fiscal.requiresLegalReview")} />
        <span>Revisão legal obrigatória</span>
      </label>

      <label className={styles.textareaField}>
        <span>Base legal / parecer</span>
        <textarea rows={5} {...form.register("fiscal.legalBasis")} />
      </label>
    </div>
  );
}
