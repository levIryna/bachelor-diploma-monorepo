import type { Request } from "express";

const DEPARTMENT_ID_PATTERN = /^[1-9]\d{0,4}$/;

export type DepartmentScope =
  | { ok: true; departmentId: string | null }
  | { ok: false; status: number; message: string };

/** Керівник підрозділу завжди обмежений своїм підрозділом. Інші ролі можуть передати departmentId. */
export function resolveDepartmentScope(req: Request): DepartmentScope {
  if (req.user?.role === "department_head") {
    if (!req.user.departmentId) {
      return {
        ok: false,
        status: 403,
        message: "Для керівника підрозділу не задано підрозділ",
      };
    }
    return { ok: true, departmentId: req.user.departmentId };
  }

  const raw = req.query.departmentId;
  if (raw === undefined || raw === "") {
    return { ok: true, departmentId: null };
  }
  if (typeof raw !== "string" || !DEPARTMENT_ID_PATTERN.test(raw)) {
    return { ok: false, status: 400, message: "Некоректний ідентифікатор підрозділу" };
  }
  return { ok: true, departmentId: raw };
}
