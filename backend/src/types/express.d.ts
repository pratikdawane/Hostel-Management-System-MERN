import type { Role } from '../constants/roles.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: Role;
      };
      /** Populated by the `validate` middleware when validating `req.query` (which Express 5 exposes as read-only). */
      validatedQuery?: unknown;
    }
  }
}

export {};
