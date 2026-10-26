import type { AccessTokenPayload } from "../auth/token";

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

export {};
