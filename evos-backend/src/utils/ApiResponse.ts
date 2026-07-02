import { Response } from 'express';

interface SuccessPayload<T> {
  success: true;
  message: string;
  data: T;
}

interface FailurePayload {
  success: false;
  message: string;
  errors: string[];
}

export class ApiResponse {
  static success<T>(res: Response, statusCode: number, message: string, data: T): Response {
    const payload: SuccessPayload<T> = { success: true, message, data };
    return res.status(statusCode).json(payload);
  }

  static failure(res: Response, statusCode: number, message: string, errors: string[] = []): Response {
    const payload: FailurePayload = { success: false, message, errors };
    return res.status(statusCode).json(payload);
  }
}
