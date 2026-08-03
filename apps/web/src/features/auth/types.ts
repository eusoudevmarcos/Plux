export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "AURA_ADMIN" | "COMPANY_ADMIN";
  hasPlatformAccess: boolean;
  customerAccount?: {
    id: string;
    status: "PENDING" | "ACTIVE" | "SUSPENDED" | "CANCELED";
    accessEnabled: boolean;
    paymentCurrentUntil?: string | null;
    hasPlatformAccess: boolean;
  } | null;
};

export type AuthResponse = {
  user: AuthUser;
  token: string;
  expiresAt: string;
};

export type MeResponse = {
  user: AuthUser;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};
