import { ZodError } from "zod";

export function parseId(id: string | undefined) {
  if (!id) {
    throw new Error("Id obrigatório.");
  }

  return id;
}

export function formatZodError(error: unknown) {
  if (!(error instanceof ZodError)) {
    return "Dados inválidos.";
  }

  return error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
}

