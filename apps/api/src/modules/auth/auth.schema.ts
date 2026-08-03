import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Informe o nome."),
  email: z.string().email("E-mail invalido.").transform((value) => value.toLowerCase().trim()),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres."),
});

export const loginSchema = z.object({
  email: z.string().email("E-mail invalido.").transform((value) => value.toLowerCase().trim()),
  password: z.string().min(1, "Informe a senha."),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
