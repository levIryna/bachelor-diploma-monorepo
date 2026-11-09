import bcrypt from "bcryptjs";
import { Router } from "express";
import { clearAccessCookie, setAccessCookie } from "../auth/cookie";
import { requireAuth } from "../auth/middleware";
import { signAccessToken } from "../auth/token";
import pool from "../db";

const DUMMY_PASSWORD_HASH = "$2b$10$Yk5cIKw/cllSbnXFVdvy9eXE6tKjxRquEW39JQ.OGlxSVoGVEUFn2";

const authRouter = Router();

type LoginUserRow = {
  id: string;
  email: string;
  password_hash: string;
  role: string;
  department_id: number | null;
  is_active: boolean | null;
};

type CurrentUserRow = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  department_id: number | null;
  department_name: string | null;
  is_active: boolean | null;
};

const MIN_PASSWORD_LENGTH = 8;

authRouter.post("/login", async (req, res) => {
  const email = req.body?.email;
  const password = req.body?.password;

  if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
    res.status(400).json({ message: "Вкажіть пошту та пароль" });
    return;
  }

  const result = await pool.query<LoginUserRow>(
    `SELECT id, email, password_hash, role, department_id, is_active
     FROM users
     WHERE lower(email) = lower($1)`,
    [email.trim()],
  );
  const user = result.rows[0];
  const passwordMatches = await bcrypt.compare(password, user?.password_hash ?? DUMMY_PASSWORD_HASH);

  if (!user || user.is_active === false || !passwordMatches) {
    res.status(401).json({ message: "Невірна пошта або пароль" });
    return;
  }

  const accessToken = signAccessToken({
    id: user.id,
    role: user.role,
    departmentId: user.department_id === null ? null : String(user.department_id),
  });

  setAccessCookie(res, accessToken);
  res.status(200).json({ ok: true });
});

authRouter.post("/logout", (_req, res) => {
  clearAccessCookie(res);
  res.status(200).json({ ok: true });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) {
    res.status(401).json({ message: "Потрібна авторизація" });
    return;
  }

  const result = await pool.query<CurrentUserRow>(
    `SELECT users.id, users.email, users.full_name, users.role, users.department_id,
            departments.name AS department_name, users.is_active
     FROM users
     LEFT JOIN departments ON departments.id = users.department_id
     WHERE users.id = $1`,
    [userId],
  );
  const user = result.rows[0];
  if (!user || user.is_active === false) {
    res.status(401).json({ message: "Потрібна авторизація" });
    return;
  }

  res.status(200).json({
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    departmentId: user.department_id === null ? null : String(user.department_id),
    departmentName: user.department_name,
  });
});

authRouter.patch("/password", requireAuth, async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) {
    res.status(401).json({ message: "Потрібна авторизація" });
    return;
  }

  const currentPassword = req.body?.currentPassword;
  const password = req.body?.password;
  const passwordConfirm = req.body?.passwordConfirm;
  if (typeof currentPassword !== "string" || currentPassword.length === 0) {
    res.status(400).json({ message: "Вкажіть поточний пароль" });
    return;
  }
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH || password.length > 72) {
    res.status(400).json({ message: "Пароль має містити від 8 до 72 символів" });
    return;
  }
  if (password !== passwordConfirm) {
    res.status(400).json({ message: "Паролі не збігаються" });
    return;
  }
  if (password === currentPassword) {
    res.status(400).json({ message: "Новий пароль має відрізнятися від поточного" });
    return;
  }

  const result = await pool.query<{ password_hash: string; is_active: boolean | null; role: string }>(
    `SELECT password_hash, is_active, role FROM users WHERE id = $1`,
    [userId],
  );
  const account = result.rows[0];
  if (account?.role === "admin") {
    res.status(403).json({ message: "Пароль адміністратора не можна змінити" });
    return;
  }
  const passwordMatches = account
    ? await bcrypt.compare(currentPassword, account.password_hash)
    : false;
  if (!account || account.is_active === false || !passwordMatches) {
    res.status(403).json({ message: "Невірний поточний пароль" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await pool.query(`UPDATE users SET password_hash = $2 WHERE id = $1`, [userId, passwordHash]);
  res.status(200).json({ ok: true });
});

export default authRouter;
