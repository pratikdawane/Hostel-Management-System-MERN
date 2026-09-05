import type { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as bedService from '../services/bed.service.js';
import type { UpdateBedInput } from '../validators/bed.validator.js';

export async function updateBed(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const input = req.body as UpdateBedInput;
  const bed = await bedService.updateBed(id, input);
  res.status(200).json(new ApiResponse(200, { bed }, 'Bed updated successfully'));
}

export async function deleteBed(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  await bedService.deleteBed(id);
  res.status(200).json(new ApiResponse(200, null, 'Bed deleted successfully'));
}
