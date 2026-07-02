import { NextFunction, Request, Response } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ApiResponse } from '../utils/ApiResponse';

export const validateRequest = (schema: AnyZodObject) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      req.body = parsed.body ?? req.body;
      req.query = parsed.query ?? req.query;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
        ApiResponse.failure(res, 400, 'Validation failed', errors);
        return;
      }
      next(error);
    }
  };
};
