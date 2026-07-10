export const ibsCbsReferenceRates2026 = {
  cbs: 0.009,
  ibs: 0.001,
} as const;

export type TaxableLine = {
  label: string;
  base: number;
  cstIbsCbs: string;
  cClassTrib: string;
  pRedIbs: number;
  pRedCbs: number;
};

export function calculateIbsCbsLine(line: TaxableLine) {
  const ibsBase = line.base * (1 - line.pRedIbs / 100);
  const cbsBase = line.base * (1 - line.pRedCbs / 100);
  const ibsValue = ibsBase * ibsCbsReferenceRates2026.ibs;
  const cbsValue = cbsBase * ibsCbsReferenceRates2026.cbs;

  return {
    ...line,
    ibsBase: roundMoney(ibsBase),
    cbsBase: roundMoney(cbsBase),
    ibsValue: roundMoney(ibsValue),
    cbsValue: roundMoney(cbsValue),
    totalTax: roundMoney(ibsValue + cbsValue),
  };
}

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

