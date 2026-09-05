import type { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import * as allocationService from '../services/allocation.service.js';
import type {
  CreateAllocationInput,
  ListAllocationsQuery,
} from '../validators/allocation.validator.js';

export async function createAllocation(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  const input = req.body as CreateAllocationInput;
  const allocation = await allocationService.createAllocation(input, req.user.id);
  res
    .status(201)
    .json(new ApiResponse(201, { allocation }, 'Resident allocated successfully'));
}

export async function listAllocations(req: Request, res: Response): Promise<void> {
  const query = req.validatedQuery as ListAllocationsQuery;
  const result = await allocationService.listAllocations(query);
  res.status(200).json(new ApiResponse(200, result, 'Allocations fetched successfully'));
}

export async function cancelAllocation(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const allocation = await allocationService.cancelAllocation(id);
  res.status(200).json(new ApiResponse(200, { allocation }, 'Allocation cancelled successfully'));
}

export async function checkoutAllocation(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  const { id } = req.params as { id: string };
  const allocation = await allocationService.checkoutAllocation(id, req.user.id);
  res
    .status(200)
    .json(new ApiResponse(200, { allocation }, 'Resident checked out successfully'));
}
