import { pbkdf2Sync, randomBytes, timingSafeEqual, createHash } from "node:crypto";
import type { FastifyRequest } from "fastify";
import { prisma } from "../../lib/prisma.js";
import type { LoginInput, RegisterInput } from "./auth.schema.js";

const TOKEN_TTL_DAYS = 30;

function hashPassword(password: string, salt: string) {
  return pbkdf2Sync(password, salt, 120_000, 64, "sha512").toString("hex");
}

function verifyPassword(password: string, salt: string, expectedHash: string) {
  const received = Buffer.from(hashPassword(password, salt), "hex");
  const expected = Buffer.from(expectedHash, "hex");

  return received.length === expected.length && timingSafeEqual(received, expected);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function userPayload(user: { id: string; name: string; email: string }) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
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

  const passwordSalt = randomBytes(16).toString("hex");
  const passwordHash = hashPassword(input.password, passwordSalt);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      passwordSalt,
    },
  });
  const session = await createSession(user.id);

  return {
    user: userPayload(user),
    token: session.token,
    expiresAt: session.expiresAt,
  };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

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
    include: { user: true },
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

export async function logout(token: string | undefined | null) {
  if (!token) {
    return { loggedOut: true };
  }

  await prisma.authSession.deleteMany({
    where: { tokenHash: hashToken(token) },
  });

  return { loggedOut: true };
}
