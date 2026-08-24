import { Request, Response } from 'express';
import { paymentService, PaymentService } from '../services/payment.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { ICreateOrderDto, IPaymentListQuery, IVerifyPaymentDto } from '../interfaces/payment.interface';

export class PaymentController {
  constructor(private readonly service: PaymentService) {}

  createOrder = asyncHandler(async (req: Request, res: Response) => {
    const dto = req.body as ICreateOrderDto;
    const result = await this.service.createOrder(dto);
    return ApiResponse.success(res, 201, 'Razorpay order created successfully', result);
  });

  listPayments = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as IPaymentListQuery;
    const result = await this.service.listPayments(query);
    return ApiResponse.success(res, 200, 'Payments retrieved successfully', result);
  });

  verifyPayment = asyncHandler(async (req: Request, res: Response) => {
    const dto = req.body as IVerifyPaymentDto;
    const payment = await this.service.verifyPayment(dto);
    return ApiResponse.success(res, 200, 'Payment verified successfully', payment);
  });
}

export const paymentController = new PaymentController(paymentService);
