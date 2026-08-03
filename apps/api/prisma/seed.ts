import { PrismaClient } from "@prisma/client";
import { createProductFull } from "../src/modules/products/products.service.js";

const prisma = new PrismaClient();

const sourceVersion = "NF-e cClassTrib IBS/CBS - publicada em 23/06/2026 - IT 2025.002 v1.60";

const taxClassificationSeed = [
  {
    cstIbsCbs: "000",
    cstDescription: "Tributação integral",
    cClassTrib: "000001",
    cClassName: "Situações tributadas integralmente pelo IBS e CBS.",
    cClassDescription: "Situações tributadas integralmente pelo IBS e CBS.",
    rateType: "Padrão",
    pRedIbs: 0,
    pRedCbs: 0,
    appliesNfe: true,
    appliesNfce: true,
    appliesNfse: true,
    legalReference: "LC 214/2025, art. 4º",
  },
  {
    cstIbsCbs: "200",
    cstDescription: "Alíquota reduzida",
    cClassTrib: "200003",
    cClassName: "Vendas de produtos destinados à alimentação humana (Anexo I)",
    cClassDescription: "Redução de 100% para produtos destinados à alimentação humana relacionados no Anexo I.",
    rateType: "Padrão",
    pRedIbs: 100,
    pRedCbs: 100,
    appliesNfe: true,
    appliesNfce: true,
    appliesNfse: false,
    legalReference: "LC 214/2025, art. 125",
  },
  {
    cstIbsCbs: "200",
    cstDescription: "Alíquota reduzida",
    cClassTrib: "200014",
    cClassName: "Fornecimento dos produtos hortícolas, frutas e ovos (Anexo XV)",
    cClassDescription: "Redução de 100% para hortícolas, frutas e ovos relacionados no Anexo XV.",
    rateType: "Padrão",
    pRedIbs: 100,
    pRedCbs: 100,
    appliesNfe: true,
    appliesNfce: true,
    appliesNfse: false,
    legalReference: "LC 214/2025, art. 148",
  },
  {
    cstIbsCbs: "200",
    cstDescription: "Alíquota reduzida",
    cClassTrib: "200034",
    cClassName: "Fornecimento dos alimentos destinados ao consumo humano (Anexo VII)",
    cClassDescription: "Redução de 60% para alimentos destinados ao consumo humano relacionados no Anexo VII.",
    rateType: "Padrão",
    pRedIbs: 60,
    pRedCbs: 60,
    appliesNfe: true,
    appliesNfce: true,
    appliesNfse: false,
    legalReference: "LC 214/2025, art. 135",
  },
  {
    cstIbsCbs: "200",
    cstDescription: "Alíquota reduzida",
    cClassTrib: "200047",
    cClassName: "Bares e Restaurantes",
    cClassDescription: "Regime aplicável a bares e restaurantes na tabela cClassTrib IBS/CBS.",
    rateType: "Padrão",
    pRedIbs: 40,
    pRedCbs: 40,
    appliesNfe: true,
    appliesNfce: true,
    appliesNfse: false,
    legalReference: "LC 214/2025, art. 275",
  },
  {
    cstIbsCbs: "410",
    cstDescription: "Imunidade e não incidência",
    cClassTrib: "410019",
    cClassName: "Exclusão da gorjeta na base de cálculo no fornecimento de alimentação",
    cClassDescription: "Exclusão de gorjeta na base de cálculo do fornecimento de alimentação.",
    rateType: "Sem alíquota",
    pRedIbs: 0,
    pRedCbs: 0,
    appliesNfe: true,
    appliesNfce: true,
    appliesNfse: false,
    legalReference: "LC 214/2025, art. 274",
  },
];

const auraPlanSeed = [
  {
    name: "Start",
    description: "Plano inicial para uma loja com operacao fiscal e financeira essencial.",
    monthlyPrice: 297,
    setupFee: 0,
    maxStores: 1,
    features: "1 loja; produtos compostos; assistente fiscal; relatorios financeiros",
  },
  {
    name: "Scale",
    description: "Plano para redes pequenas com multiplas lojas e maior acompanhamento.",
    monthlyPrice: 697,
    setupFee: 990,
    maxStores: 5,
    features: "Ate 5 lojas; contratos; financeiro; auditoria fiscal; suporte prioritario",
  },
  {
    name: "Enterprise",
    description: "Plano consultivo para operacoes com defesa tributaria e regras customizadas.",
    monthlyPrice: 1497,
    setupFee: 2990,
    maxStores: 25,
    features: "Multi-loja; regras customizadas; acompanhamento consultivo; governanca fiscal",
  },
] as const;

const ingredientSeed = [
  { name: "Pão brioche", unitMeasure: "un", unitCost: 1.8, stockCurrent: 100, ncm: "19059090", cClassTrib: "200003", pisCst: "06", cofinsCst: "06", taxNotes: "Classificação candidata. Validar se o item específico entra na cesta/alíquota zero ou se cai em alimento reduzido." },
  { name: "Massa de pizza", unitMeasure: "un", unitCost: 4.5, stockCurrent: 40, ncm: "19059090", cClassTrib: "200034", pisCst: "06", cofinsCst: "06", taxNotes: "Classificação candidata para alimento destinado ao consumo humano." },
  { name: "Molho de tomate", unitMeasure: "g", unitCost: 0.018, stockCurrent: 8000, ncm: "21032010", cClassTrib: "200034", pisCst: "01", cofinsCst: "01", taxNotes: "Molhos exigem validação por NCM, composição e benefício vigente." },
  { name: "Hambúrguer bovino 100g", unitMeasure: "un", unitCost: 4.2, stockCurrent: 120, ncm: "16025000", cClassTrib: "200034", pisCst: "01", cofinsCst: "01", taxNotes: "Produto cárneo processado. Não assumir cesta básica sem parecer." },
  { name: "Bacon fatiado", unitMeasure: "g", unitCost: 0.065, stockCurrent: 4000, ncm: "02101200", cClassTrib: "200034", pisCst: "01", cofinsCst: "01", taxNotes: "Classificação candidata; validar tratamento de carne suína preparada/salgada." },
  { name: "Filé de frango", unitMeasure: "g", unitCost: 0.038, stockCurrent: 10000, ncm: "02071400", cClassTrib: "200003", pisCst: "06", cofinsCst: "06", taxNotes: "Classificação candidata para alimento de cesta. Validar apresentação e NCM." },
  { name: "Bife bovino", unitMeasure: "g", unitCost: 0.06, stockCurrent: 9000, ncm: "02013000", cClassTrib: "200003", pisCst: "06", cofinsCst: "06", taxNotes: "Classificação candidata para alimento de cesta. Validar corte, apresentação e UF." },
  { name: "Calabresa", unitMeasure: "g", unitCost: 0.045, stockCurrent: 5000, ncm: "16010000", cClassTrib: "200034", pisCst: "01", cofinsCst: "01", taxNotes: "Embutidos normalmente pedem revisão específica." },
  { name: "Queijo muçarela", unitMeasure: "g", unitCost: 0.05, stockCurrent: 7000, ncm: "04061010", cClassTrib: "200034", pisCst: "06", cofinsCst: "06", taxNotes: "Laticínios podem ter tratamento específico. Validar produto e benefício." },
  { name: "Queijo cheddar", unitMeasure: "g", unitCost: 0.06, stockCurrent: 5000, ncm: "04069020", cClassTrib: "200034", pisCst: "01", cofinsCst: "01", taxNotes: "Classificação candidata; validar se é queijo natural, processado ou preparado." },
  { name: "Catupiry", unitMeasure: "g", unitCost: 0.055, stockCurrent: 3000, ncm: "04061090", cClassTrib: "200034", pisCst: "01", cofinsCst: "01", taxNotes: "Requeijão/cremosos exigem validação de NCM e benefício." },
  { name: "Alface", unitMeasure: "g", unitCost: 0.012, stockCurrent: 3000, ncm: "07051900", cClassTrib: "200014", pisCst: "06", cofinsCst: "06", taxNotes: "Hortícola candidata à redução de 100% IBS/CBS." },
  { name: "Tomate", unitMeasure: "g", unitCost: 0.015, stockCurrent: 4000, ncm: "07020000", cClassTrib: "200014", pisCst: "06", cofinsCst: "06", taxNotes: "Hortícola candidata à redução de 100% IBS/CBS." },
  { name: "Cebola", unitMeasure: "g", unitCost: 0.01, stockCurrent: 4000, ncm: "07031019", cClassTrib: "200014", pisCst: "06", cofinsCst: "06", taxNotes: "Hortícola candidata à redução de 100% IBS/CBS." },
  { name: "Batata frita", unitMeasure: "g", unitCost: 0.022, stockCurrent: 12000, ncm: "20041000", cClassTrib: "200034", pisCst: "01", cofinsCst: "01", taxNotes: "Produto preparado/congelado. Validar benefício antes de tratar como cesta." },
  { name: "Arroz cozido", unitMeasure: "g", unitCost: 0.01, stockCurrent: 15000, ncm: "10063021", cClassTrib: "200003", pisCst: "06", cofinsCst: "06", taxNotes: "Classificação candidata para arroz da cesta/alíquota zero." },
  { name: "Feijão cozido", unitMeasure: "g", unitCost: 0.014, stockCurrent: 12000, ncm: "07133319", cClassTrib: "200003", pisCst: "06", cofinsCst: "06", taxNotes: "Classificação candidata para feijão da cesta/alíquota zero." },
  { name: "Farofa", unitMeasure: "g", unitCost: 0.018, stockCurrent: 4000, ncm: "19019090", cClassTrib: "200034", pisCst: "01", cofinsCst: "01", taxNotes: "Preparado alimentício. Revisar composição e NCM." },
  { name: "Salada simples", unitMeasure: "g", unitCost: 0.02, stockCurrent: 5000, ncm: "07099990", cClassTrib: "200014", pisCst: "06", cofinsCst: "06", taxNotes: "Classificação candidata se composta apenas por hortícolas elegíveis." },
  { name: "Maionese da casa", unitMeasure: "g", unitCost: 0.025, stockCurrent: 3000, ncm: "21039021", cClassTrib: "000001", pisCst: "01", cofinsCst: "01", taxNotes: "Molho preparado interno. Tratar como integral até validação." },
  { name: "Barbecue", unitMeasure: "g", unitCost: 0.03, stockCurrent: 2500, ncm: "21039091", cClassTrib: "000001", pisCst: "01", cofinsCst: "01", taxNotes: "Molho preparado. Tratar como integral até validação." },
  { name: "Coca-Cola lata 350ml", unitMeasure: "un", unitCost: 3.2, stockCurrent: 80, ncm: "22021000", cClassTrib: "000001", pisCst: "04", cofinsCst: "04", taxNotes: "Bebida açucarada/refrigerante. Validar PIS/COFINS monofásico e Imposto Seletivo quando aplicável." },
  { name: "Guaraná lata 350ml", unitMeasure: "un", unitCost: 2.9, stockCurrent: 80, ncm: "22021000", cClassTrib: "000001", pisCst: "04", cofinsCst: "04", taxNotes: "Bebida açucarada/refrigerante. Validar PIS/COFINS monofásico e Imposto Seletivo quando aplicável." },
  { name: "Água mineral 500ml", unitMeasure: "un", unitCost: 1.4, stockCurrent: 100, ncm: "22011000", cClassTrib: "000001", pisCst: "01", cofinsCst: "01", taxNotes: "Classificação conservadora até validação específica." },
] as const;

const productSeed = [
  {
    name: "X-Burger Clássico",
    sku: "BUR-001",
    salePrice: 19.9,
    category: "Hambúrguer",
    composition: [
      ["Pão brioche", 1],
      ["Hambúrguer bovino 100g", 1],
      ["Queijo muçarela", 30],
      ["Alface", 15],
      ["Tomate", 20],
      ["Maionese da casa", 15],
    ],
  },
  {
    name: "X-Bacon Cheddar",
    sku: "BUR-002",
    salePrice: 27.9,
    category: "Hambúrguer",
    composition: [
      ["Pão brioche", 1],
      ["Hambúrguer bovino 100g", 1],
      ["Bacon fatiado", 40],
      ["Queijo cheddar", 35],
      ["Barbecue", 20],
    ],
  },
  {
    name: "Pizza Muçarela",
    sku: "PIZ-001",
    salePrice: 39.9,
    category: "Pizza",
    composition: [
      ["Massa de pizza", 1],
      ["Molho de tomate", 120],
      ["Queijo muçarela", 250],
      ["Tomate", 60],
    ],
  },
  {
    name: "Pizza Calabresa",
    sku: "PIZ-002",
    salePrice: 44.9,
    category: "Pizza",
    composition: [
      ["Massa de pizza", 1],
      ["Molho de tomate", 120],
      ["Queijo muçarela", 200],
      ["Calabresa", 160],
      ["Cebola", 50],
    ],
  },
  {
    name: "Prato Executivo Bife",
    sku: "REF-001",
    salePrice: 32.9,
    category: "Refeição",
    composition: [
      ["Bife bovino", 160],
      ["Arroz cozido", 180],
      ["Feijão cozido", 120],
      ["Batata frita", 100],
      ["Salada simples", 80],
      ["Farofa", 30],
    ],
  },
  {
    name: "Prato Executivo Frango Grelhado",
    sku: "REF-002",
    salePrice: 29.9,
    category: "Refeição",
    composition: [
      ["Filé de frango", 170],
      ["Arroz cozido", 180],
      ["Feijão cozido", 120],
      ["Batata frita", 100],
      ["Salada simples", 80],
    ],
  },
  {
    name: "Coca-Cola Lata",
    sku: "BEB-001",
    salePrice: 6.5,
    category: "Bebida",
    composition: [["Coca-Cola lata 350ml", 1]],
  },
  {
    name: "Água Mineral",
    sku: "BEB-002",
    salePrice: 3.5,
    category: "Bebida",
    composition: [["Água mineral 500ml", 1]],
  },
] as const;

async function main() {
  await prisma.companyProfile.upsert({
    where: { id: "main" },
    update: {},
    create: {
      id: "main",
      legalName: "Empresa modelo PluxSales",
      tradeName: "PluxSales Food Service",
      document: null,
      taxRegime: "SIMPLES",
      uf: "DF",
      city: "Brasilia",
    },
  });

  for (const plan of auraPlanSeed) {
    await prisma.auraPlan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan,
    });
  }

  for (const taxClassification of taxClassificationSeed) {
    await prisma.taxClassification.upsert({
      where: { cClassTrib: taxClassification.cClassTrib },
      update: {
        ...taxClassification,
        sourceVersion,
        effectiveFrom: new Date("2026-01-01"),
      },
      create: {
        ...taxClassification,
        sourceVersion,
        effectiveFrom: new Date("2026-01-01"),
      },
    });
  }

  const taxClassifications = await prisma.taxClassification.findMany();
  const taxClassificationByCode = new Map(
    taxClassifications.map((taxClassification) => [taxClassification.cClassTrib, taxClassification]),
  );

  for (const ingredient of ingredientSeed) {
    const taxClassification = taxClassificationByCode.get(ingredient.cClassTrib);

    await prisma.ingredient.upsert({
      where: { name: ingredient.name },
      update: {
        unitMeasure: ingredient.unitMeasure,
        unitCost: ingredient.unitCost,
        stockCurrent: ingredient.stockCurrent,
        ncm: ingredient.ncm,
        pisCst: ingredient.pisCst,
        cofinsCst: ingredient.cofinsCst,
        taxConfidence: "REVIEW_REQUIRED",
        taxNotes: ingredient.taxNotes,
        taxClassificationId: taxClassification?.id,
      },
      create: {
        name: ingredient.name,
        unitMeasure: ingredient.unitMeasure,
        unitCost: ingredient.unitCost,
        stockCurrent: ingredient.stockCurrent,
        ncm: ingredient.ncm,
        pisCst: ingredient.pisCst,
        cofinsCst: ingredient.cofinsCst,
        taxConfidence: "REVIEW_REQUIRED",
        taxNotes: ingredient.taxNotes,
        taxClassificationId: taxClassification?.id,
      },
    });
  }

  await prisma.productIngredient.deleteMany();
  await prisma.productTaxProfile.deleteMany();
  await prisma.product.deleteMany();

  const ingredientByName = new Map((await prisma.ingredient.findMany()).map((ingredient) => [ingredient.name, ingredient]));
  const productTaxClassification = taxClassificationByCode.get("200047");
  const preparationFeeTaxClassification = taxClassificationByCode.get("000001");

  if (!productTaxClassification || !preparationFeeTaxClassification) {
    throw new Error("Classificações fiscais obrigatórias do seed não foram criadas.");
  }

  for (const product of productSeed) {
    await createProductFull({
      name: product.name,
      sku: product.sku,
      salePrice: product.salePrice,
      category: product.category,
      active: true,
      preparationFee: Math.min(5, product.salePrice),
      fiscalStrategy: "SPLIT_INGREDIENTS_PREPARATION_FEE",
      composition: product.composition.map(([ingredientName, qtyUsed]) => {
        const ingredient = ingredientByName.get(ingredientName);

        if (!ingredient) {
          throw new Error(`Ingrediente ${ingredientName} não encontrado no seed.`);
        }

        return {
          ingredientId: ingredient.id,
          qtyUsed,
        };
      }),
      fiscal: {
        uf: "DF",
        taxRegime: "SIMPLES",
        ncm: product.category === "Bebida" ? "22021000" : "21069090",
        csosn: "102",
        pisCst: product.category === "Bebida" ? "04" : "01",
        cofinsCst: product.category === "Bebida" ? "04" : "01",
        taxClassificationId: productTaxClassification.id,
        preparationFeeNcm: "21069090",
        preparationFeeTaxClassificationId: preparationFeeTaxClassification.id,
        legalBasis:
          "Cenário interno: venda de ingredientes classificados individualmente + taxa técnica de preparo. Exige validação documental, contratual e fiscal antes de emissão real.",
        requiresLegalReview: true,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
