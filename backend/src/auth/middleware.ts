import type { NextFunction, Request, Response } from "express";
import pool from "../db";
import { clearAccessCookie, readAccessCookie, setAccessCookie } from "./cookie";
import {
  REFRESH_THRESHOLD_SEC,
  signAccessToken,
  verifyAccessToken,
} from "./token";

const LOGIN_PATH = "/auth/login";

type RefreshUserRow = {
  id: string;
  role: string;
  department_id: string | null;
  is_active: boolean | null;
};

export async function attachUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (req.method === "POST" && req.path === LOGIN_PATH) {
    next();
    return;
  }

  const token = readAccessCookie(req);
  if (!token) {
    next();
    return;
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    clearAccessCookie(res);
    res.setHeader("X-Auth-Expired", "1");
    next();
    return;
  }

  req.user = payload;

  const nowSec = Math.floor(Date.now() / 1000);
  if (payload.exp - nowSec > REFRESH_THRESHOLD_SEC) {
    next();
    return;
  }

  try {
    const refreshed = await refreshAccessToken(payload.sub);
    if (!refreshed) {
      req.user = undefined;
      clearAccessCookie(res);
      res.setHeader("X-Auth-Expired", "1");
    } else {
      setAccessCookie(res, refreshed);
      req.user = verifyAccessToken(refreshed) ?? payload;
    }
  } catch (error) {
    console.error("Token refresh failed", error);
  }

  next();
}

async function refreshAccessToken(userId: string): Promise<string | null> {
  const result = await pool.query<RefreshUserRow>(
    `SELECT id, role, department_id, is_active
     FROM users
     WHERE id = $1`,
    [userId],
  );
  const user = result.rows[0];
  if (!user || user.is_active === false) {
    return null;
  }

  return signAccessToken({
    id: user.id,
    role: user.role,
    departmentId: user.department_id,
  });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ message: "Потрібна авторизація" });
    return;
  }
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ message: "Потрібна авторизація" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: "Недостатньо прав" });
      return;
    }
    next();
  };
}
