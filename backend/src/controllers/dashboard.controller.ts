import type { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import * as dashboardService from '../services/dashboard.service.js';

export async function getDashboard(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  const summary = await dashboardService.getDashboardSummary(req.user);
  res.status(200).json(new ApiResponse(200, summary, 'Dashboard summary fetched successfully'));
}
