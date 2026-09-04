import type { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import * as residentService from '../services/resident.service.js';
import type {
  CreateResidentInput,
  ListResidentsQuery,
  UpdateResidentInput,
} from '../validators/resident.validator.js';

export async function createResident(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  const input = req.body as CreateResidentInput;
  const resident = await residentService.createResident(input, req.user.id);
  res.status(201).json(new ApiResponse(201, { resident }, 'Resident created successfully'));
}

export async function listResidents(req: Request, res: Response): Promise<void> {
  const query = req.validatedQuery as ListResidentsQuery;
  const result = await residentService.listResidents(query);
  res.status(200).json(new ApiResponse(200, result, 'Residents fetched successfully'));
}

export async function getResidentStats(_req: Request, res: Response): Promise<void> {
  const stats = await residentService.getResidentStats();
  res.status(200).json(new ApiResponse(200, stats, 'Resident stats fetched successfully'));
}

export async function getResidentById(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const resident = await residentService.getResidentById(id);
  res.status(200).json(new ApiResponse(200, { resident }, 'Resident fetched successfully'));
}

export async function updateResident(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const input = req.body as UpdateResidentInput;
  const resident = await residentService.updateResident(id, input);
  res.status(200).json(new ApiResponse(200, { resident }, 'Resident updated successfully'));
}

export async function deleteResident(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  await residentService.deleteResident(id);
  res.status(200).json(new ApiResponse(200, null, 'Resident deleted successfully'));
}
