import { pbkdf2Sync, randomBytes, timingSafeEqual, createHash } from "node:crypto";
import type { FastifyRequest } from "fastify";
import type { AuraCustomerAccount, UserRole } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import type { LoginInput, RegisterInput } from "./auth.schema.js";

const TOKEN_TTL_DAYS = 30;

function hashPassword(password: string, salt: string) {
  return pbkdf2Sync(password, salt, 120_000, 64, "sha512").toString("hex");
}

export function createPasswordCredentials(password: string) {
  const passwordSalt = randomBytes(16).toString("hex");

  return {
    passwordSalt,
    passwordHash: hashPassword(password, passwordSalt),
  };
}

function verifyPassword(password: string, salt: string, expectedHash: string) {
  const received = Buffer.from(hashPassword(password, salt), "hex");
  const expected = Buffer.from(expectedHash, "hex");

  return received.length === expected.length && timingSafeEqual(received, expected);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

type UserWithAccount = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  customerAccount?: AuraCustomerAccount | null;
};

function hasActiveAccess(account?: AuraCustomerAccount | null) {
  if (!account?.accessEnabled || account.status !== "ACTIVE") {
    return false;
  }

  if (!account.paymentCurrentUntil) {
    return false;
  }

  return account.paymentCurrentUntil >= new Date();
}

function userPayload(user: UserWithAccount) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    customerAccount: user.customerAccount
      ? {
          id: user.customerAccount.id,
          status: user.customerAccount.status,
          accessEnabled: user.customerAccount.accessEnabled,
          paymentCurrentUntil: user.customerAccount.paymentCurrentUntil,
          hasPlatformAccess: hasActiveAccess(user.customerAccount),
        }
      : null,
    hasPlatformAccess: user.role === "AURA_ADMIN" || hasActiveAccess(user.customerAccount),
  };
}

async function resolveUserRole(email: string): Promise<UserRole> {
  const adminEmails = process.env.AURA_ADMIN_EMAILS?.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean) ?? [];

  if (adminEmails.includes(email)) {
    return "AURA_ADMIN";
  }

  const adminCount = await prisma.user.count({
    where: { role: "AURA_ADMIN" },
  });

  return adminCount === 0 ? "AURA_ADMIN" : "CLIENT";
}

async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.authSession.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });

  if (existing) {
    throw new Error("E-mail ja cadastrado.");
  }

  const { passwordHash, passwordSalt } = createPasswordCredentials(input.password);
  const role = await resolveUserRole(input.email);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      role,
      passwordHash,
      passwordSalt,
      ...(role === "CLIENT"
        ? {
            customerAccount: {
              create: {
                legalName: input.name,
                tradeName: input.name,
                status: "PENDING",
                accessEnabled: false,
              },
            },
          }
        : {}),
    },
    include: { customerAccount: true },
  });
  const session = await createSession(user.id);

  return {
    user: userPayload(user),
    token: session.token,
    expiresAt: session.expiresAt,
  };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { customerAccount: true },
  });

  if (!user || !verifyPassword(input.password, user.passwordSalt, user.passwordHash)) {
    throw new Error("E-mail ou senha invalidos.");
  }

  const session = await createSession(user.id);

  return {
    user: userPayload(user),
    token: session.token,
    expiresAt: session.expiresAt,
  };
}

export async function getUserFromToken(token: string | undefined | null) {
  if (!token) {
    return null;
  }

  const session = await prisma.authSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { customerAccount: true } } },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return userPayload(session.user);
}

export function getBearerToken(request: FastifyRequest) {
  const header = request.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim();
}

export async function requireUser(request: FastifyRequest) {
  const user = await getUserFromToken(getBearerToken(request));

  if (!user) {
    throw new Error("Sessao invalida ou expirada.");
  }

  return user;
}

export async function requireAuraAdmin(request: FastifyRequest) {
  const user = await requireUser(request);

  if (user.role !== "AURA_ADMIN") {
    throw new Error("Acesso restrito a administradores Aura.");
  }

  return user;
}

export async function requirePlatformAccess(request: FastifyRequest) {
  const user = await requireUser(request);

  if (!user.hasPlatformAccess) {
    throw new Error("Acesso pendente. A Aura precisa liberar contrato e pagamento do plano.");
  }

  return user;
}

export async function logout(token: string | undefined | null) {
  if (!token) {
    return { loggedOut: true };
  }

  await prisma.authSession.deleteMany({
    where: { tokenHash: hashToken(token) },
  });

  return { loggedOut: true };
}
