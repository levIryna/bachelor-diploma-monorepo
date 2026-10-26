import type { Request, Response } from "express";
import { ACCESS_TOKEN_TTL_SEC } from "./token";

export const ACCESS_COOKIE = "accessToken";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: ACCESS_TOKEN_TTL_SEC * 1000,
};

export function setAccessCookie(res: Response, token: string) {
  res.cookie(ACCESS_COOKIE, token, cookieOptions);
}

export function clearAccessCookie(res: Response) {
  res.clearCookie(ACCESS_COOKIE, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

export function readAccessCookie(req: Request): string | null {
  const header = req.get("cookie");
  if (!header) {
    return null;
  }

  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) {
      continue;
    }
    const name = part.slice(0, separator).trim();
    if (name !== ACCESS_COOKIE) {
      continue;
    }
    const value = part.slice(separator + 1).trim();
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  return null;
}
