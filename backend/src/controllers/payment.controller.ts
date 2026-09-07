import type { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import * as paymentService from '../services/payment.service.js';
import type { CreatePaymentInput, ListPaymentsQuery } from '../validators/payment.validator.js';

export async function createPayment(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  const input = req.body as CreatePaymentInput;
  const payment = await paymentService.createPayment(input, req.user.id);
  res.status(201).json(new ApiResponse(201, { payment }, 'Payment recorded successfully'));
}

export async function listPayments(req: Request, res: Response): Promise<void> {
  const query = req.validatedQuery as ListPaymentsQuery;
  const result = await paymentService.listPayments(query);
  res.status(200).json(new ApiResponse(200, result, 'Payments fetched successfully'));
}

export async function getPaymentById(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const payment = await paymentService.getPaymentById(id);
  res.status(200).json(new ApiResponse(200, { payment }, 'Payment fetched successfully'));
}

export async function getDues(_req: Request, res: Response): Promise<void> {
  const result = await paymentService.getDues();
  res.status(200).json(new ApiResponse(200, result, 'Dues fetched successfully'));
}

export async function getPaymentStats(_req: Request, res: Response): Promise<void> {
  const stats = await paymentService.getPaymentStats();
  res.status(200).json(new ApiResponse(200, stats, 'Payment stats fetched successfully'));
}
