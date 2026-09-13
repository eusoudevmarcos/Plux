# API fiscal beta

Esta fase deixa a Plux pronta para preparar documentos fiscais internos, com trilha de auditoria e separação das linhas de ingrediente/taxa de preparo.

## O que está pronto

- `GET /fiscal/documents?storeId=...`
- `POST /fiscal/documents/nfce/sales/:saleId/prepare`
- `POST /fiscal/documents/nfe/sales/:saleId/prepare`
- `POST /fiscal/documents/nfe/purchases/:purchaseId/return/prepare`
- `POST /fiscal/documents/:id/transmit`
- `POST /fiscal/documents/:id/cancel`

## Comportamento atual

- NFC-e/NF-e de venda usam a venda concluída no caixa.
- NF-e de devolução usa uma compra lançada.
- Produtos com estratégia `SPLIT_INGREDIENTS_PREPARATION_FEE` geram linhas separadas para ingredientes e taxa de preparo.
- Ingredientes reaproveitam NCM, PIS CST, COFINS CST, ICMS CST/CSOSN e cClassTrib cadastrados.
- A taxa de preparo usa NCM/cClassTrib próprios do perfil fiscal do produto.
- Cancelamentos antes de autorização oficial ficam registrados localmente.
- Transmissão oficial retorna `TRANSMISSION_BLOCKED` até a etapa de homologação SEFAZ.

## Pendências para emissão oficial

- Certificado A1 por empresa/loja.
- Assinatura XML.
- Validação XSD por modelo fiscal.
- Ambientes SEFAZ por UF.
- QR Code NFC-e.
- DANFE/DANFE NFC-e.
- Consulta de protocolo, inutilização e contingência.
- Homologação por UF antes de produção.

## Variáveis futuras esperadas

```env
FISCAL_ENABLE_SEFAZ_TRANSMISSION=false
FISCAL_CERTIFICATE_PATH=
FISCAL_CERTIFICATE_PASSWORD=
FISCAL_SEFAZ_UF=DF
FISCAL_ENVIRONMENT=HOMOLOGATION
```

Enquanto `FISCAL_ENABLE_SEFAZ_TRANSMISSION` não estiver ativo com os demais requisitos, a API mantém os documentos preparados e auditáveis, mas bloqueia a transmissão oficial.
