import jwt from "jsonwebtoken";

export const ACCESS_TOKEN_TTL_SEC = 30 * 60;
export const REFRESH_THRESHOLD_SEC = 10 * 60;

export type AccessTokenPayload = {
  sub: string;
  role: string;
  departmentId: string | null;
  exp: number;
};

type TokenUser = {
  id: string;
  role: string;
  departmentId: string | null;
};

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return secret;
}

export function signAccessToken(user: TokenUser): string {
  return jwt.sign({ role: user.role, departmentId: user.departmentId }, getSecret(), {
    subject: user.id,
    expiresIn: ACCESS_TOKEN_TTL_SEC,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    const decoded = jwt.verify(token, getSecret());
    if (typeof decoded === "string" || typeof decoded.sub !== "string" || typeof decoded.exp !== "number") {
      return null;
    }

    const { role, departmentId } = decoded;
    if (typeof role !== "string") {
      return null;
    }
    if (
      departmentId !== null &&
      (typeof departmentId !== "string" || !/^[1-9]\d{0,4}$/.test(departmentId))
    ) {
      return null;
    }

    return {
      sub: decoded.sub,
      role,
      departmentId,
      exp: decoded.exp,
    };
  } catch {
    return null;
  }
}
