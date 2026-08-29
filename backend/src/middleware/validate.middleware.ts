import type { NextFunction, Request, Response } from 'express';
import { z, type ZodType } from 'zod';
import { ApiError } from '../utils/ApiError.js';

type ValidationTarget = 'body' | 'params' | 'query';

/**
 * Validates one part of the request against a Zod schema.
 * `query` can't be reassigned in Express 5 (it's a read-only getter), so validated
 * query values are stashed on `req.validatedQuery` instead of `req.query`.
 */
export function validate(schema: ZodType, target: ValidationTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const { fieldErrors, formErrors } = z.flattenError(result.error);
      next(ApiError.badRequest('Validation failed', { fieldErrors, formErrors }));
      return;
    }

    if (target === 'body') {
      req.body = result.data;
    } else if (target === 'params') {
      Object.assign(req.params, result.data as Record<string, string>);
    } else {
      req.validatedQuery = result.data;
    }

    next();
  };
}
