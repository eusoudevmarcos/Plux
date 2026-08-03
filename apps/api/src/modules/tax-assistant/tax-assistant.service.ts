import { prisma } from "../../lib/prisma.js";
import type { TaxAssistantSuggestInput } from "./tax-assistant.schema.js";

type Rule = {
  id: string;
  label: string;
  keywords: string[];
  ncm: string;
  pisCst: string;
  cofinsCst: string;
  icmsCst?: string | null;
  icmsCsosn?: string | null;
  cClassTrib: string;
  cstIbsCbs: string;
  confidence: "APPROVED" | "REVIEW_REQUIRED";
  reason: string;
};

const rules: Rule[] = [
  {
    id: "wheat-derivatives",
    label: "Derivado de trigo/farinha",
    keywords: ["farinha", "trigo", "pao", "brioche", "massa", "pizza", "macarrao", "lasanha", "pastel"],
    ncm: "19059090",
    pisCst: "06",
    cofinsCst: "06",
    cClassTrib: "200003",
    cstIbsCbs: "200",
    confidence: "REVIEW_REQUIRED",
    reason: "Nomenclatura associada a farinha/trigo ou produto panificado.",
  },
  {
    id: "rice-beans",
    label: "Arroz, feijao e cesta alimentar",
    keywords: ["arroz", "feijao", "feijao carioca", "feijao preto"],
    ncm: "10063021",
    pisCst: "06",
    cofinsCst: "06",
    cClassTrib: "200003",
    cstIbsCbs: "200",
    confidence: "REVIEW_REQUIRED",
    reason: "Nomenclatura associada a item basico alimentar.",
  },
  {
    id: "beef",
    label: "Carne bovina ou blend bovino",
    keywords: ["bovino", "bovina", "carne", "blend", "hamburguer", "hamburger", "bife", "picanha", "alcatra", "file mignon"],
    ncm: "02013000",
    pisCst: "06",
    cofinsCst: "06",
    cClassTrib: "200003",
    cstIbsCbs: "200",
    confidence: "REVIEW_REQUIRED",
    reason: "Nomenclatura associada a carne bovina, corte ou blend.",
  },
  {
    id: "poultry",
    label: "Aves/frango",
    keywords: ["frango", "ave", "aves", "galinha", "peito de frango", "file de frango"],
    ncm: "02071400",
    pisCst: "06",
    cofinsCst: "06",
    cClassTrib: "200003",
    cstIbsCbs: "200",
    confidence: "REVIEW_REQUIRED",
    reason: "Nomenclatura associada a carne de aves.",
  },
  {
    id: "fish",
    label: "Peixes, sushi, sashimi e frutos do mar",
    keywords: ["peixe", "sushi", "sashimi", "salmao", "atum", "tilapia", "camarao", "robalo", "bacalhau"],
    ncm: "03021400",
    pisCst: "06",
    cofinsCst: "06",
    cClassTrib: "200003",
    cstIbsCbs: "200",
    confidence: "REVIEW_REQUIRED",
    reason: "Nomenclatura associada a peixe ou preparo com peixe/frutos do mar.",
  },
  {
    id: "hortifruti",
    label: "Hortifruti",
    keywords: ["alface", "tomate", "cebola", "batata", "cenoura", "couve", "rucula", "salada", "hortalica", "verdura"],
    ncm: "07099990",
    pisCst: "06",
    cofinsCst: "06",
    cClassTrib: "200014",
    cstIbsCbs: "200",
    confidence: "REVIEW_REQUIRED",
    reason: "Nomenclatura associada a hortalicas e acompanhamentos vegetais.",
  },
  {
    id: "dairy",
    label: "Laticinios",
    keywords: ["queijo", "mucarela", "muçarela", "cheddar", "catupiry", "requeijao", "leite", "creme"],
    ncm: "04061010",
    pisCst: "06",
    cofinsCst: "06",
    cClassTrib: "200034",
    cstIbsCbs: "200",
    confidence: "REVIEW_REQUIRED",
    reason: "Nomenclatura associada a leite, queijo ou derivados.",
  },
  {
    id: "soft-drinks",
    label: "Bebida/refrigerante",
    keywords: ["coca", "guarana", "refrigerante", "soda", "bebida acucarada", "energetico"],
    ncm: "22021000",
    pisCst: "04",
    cofinsCst: "04",
    cClassTrib: "000001",
    cstIbsCbs: "000",
    confidence: "REVIEW_REQUIRED",
    reason: "Nomenclatura associada a bebida industrializada/refrigerante.",
  },
  {
    id: "water",
    label: "Agua mineral",
    keywords: ["agua", "agua mineral"],
    ncm: "22011000",
    pisCst: "06",
    cofinsCst: "06",
    cClassTrib: "000001",
    cstIbsCbs: "000",
    confidence: "REVIEW_REQUIRED",
    reason: "Nomenclatura associada a agua mineral.",
  },
  {
    id: "sauces",
    label: "Molhos e preparos",
    keywords: ["molho", "maionese", "barbecue", "ketchup", "mostarda", "tempero"],
    ncm: "21039091",
    pisCst: "01",
    cofinsCst: "01",
    cClassTrib: "000001",
    cstIbsCbs: "000",
    confidence: "REVIEW_REQUIRED",
    reason: "Nomenclatura associada a molho ou preparo culinario.",
  },
];

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function scoreRule(rule: Rule, haystack: string) {
  return rule.keywords.reduce((score, keyword) => {
    return haystack.includes(normalize(keyword)) ? score + 1 : score;
  }, 0);
}

function productRule(input: TaxAssistantSuggestInput): Rule {
  if (input.name.toLowerCase().includes("taxa") || input.name.toLowerCase().includes("buffet")) {
    return {
      id: "preparation-fee",
      label: "Taxa de buffet/preparo",
      keywords: ["taxa", "buffet", "preparo"],
      ncm: "21069090",
      pisCst: "01",
      cofinsCst: "01",
      cClassTrib: "000001",
      cstIbsCbs: "000",
      confidence: "APPROVED",
      reason: "Linha de preparo/buffet tratada como base integral no desenho fiscal.",
    };
  }

  return {
    id: "product-split-default",
    label: "Produto composto com split de ingredientes",
    keywords: [],
    ncm: "21069090",
    pisCst: "01",
    cofinsCst: "01",
    cClassTrib: "200047",
    cstIbsCbs: "200",
    confidence: "REVIEW_REQUIRED",
    reason: "Produto composto sugerido para venda por ingredientes + taxa de preparo integral.",
  };
}

export async function suggestTax(input: TaxAssistantSuggestInput) {
  const haystack = normalize([input.name, input.category, ...(input.ingredientNames ?? [])].filter(Boolean).join(" "));
  const rankedRules = rules
    .map((rule) => ({ rule, score: scoreRule(rule, haystack) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const selectedRule = input.scope === "PRODUCT" ? productRule(input) : rankedRules[0]?.rule ?? rules[rules.length - 1];
  const taxClassification = await prisma.taxClassification.findFirst({
    where: {
      cClassTrib: selectedRule.cClassTrib,
      cstIbsCbs: selectedRule.cstIbsCbs,
    },
  });

  return {
    scope: input.scope,
    matchedRuleId: selectedRule.id,
    matchedRule: selectedRule.label,
    reason: selectedRule.reason,
    ncm: selectedRule.ncm,
    pisCst: selectedRule.pisCst,
    cofinsCst: selectedRule.cofinsCst,
    icmsCst: selectedRule.icmsCst ?? null,
    icmsCsosn: selectedRule.icmsCsosn ?? null,
    cstIbsCbs: selectedRule.cstIbsCbs,
    cClassTrib: selectedRule.cClassTrib,
    taxClassificationId: taxClassification?.id ?? null,
    taxConfidence: selectedRule.confidence,
    taxNotes: `${selectedRule.label}: ${selectedRule.reason} Revisar com parecer/base legal antes da emissao fiscal real.`,
    alternativeRules: rankedRules.slice(1, 4).map((item) => ({
      id: item.rule.id,
      label: item.rule.label,
      cClassTrib: item.rule.cClassTrib,
      cstIbsCbs: item.rule.cstIbsCbs,
      score: item.score,
    })),
  };
}
