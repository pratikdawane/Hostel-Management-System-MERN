import type { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import * as complaintService from '../services/complaint.service.js';
import type {
  CreateComplaintInput,
  ListComplaintsQuery,
  UpdateComplaintInput,
} from '../validators/complaint.validator.js';

export async function createComplaint(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  const input = req.body as CreateComplaintInput;
  const complaint = await complaintService.createComplaint(input, req.user);
  res.status(201).json(new ApiResponse(201, { complaint }, 'Complaint filed successfully'));
}

export async function listComplaints(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  const query = req.validatedQuery as ListComplaintsQuery;
  const result = await complaintService.listComplaints(query, req.user);
  res.status(200).json(new ApiResponse(200, result, 'Complaints fetched successfully'));
}

export async function getComplaintById(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  const { id } = req.params as { id: string };
  const complaint = await complaintService.getComplaintById(id, req.user);
  res.status(200).json(new ApiResponse(200, { complaint }, 'Complaint fetched successfully'));
}

export async function updateComplaint(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const input = req.body as UpdateComplaintInput;
  const complaint = await complaintService.updateComplaint(id, input);
  res.status(200).json(new ApiResponse(200, { complaint }, 'Complaint updated successfully'));
}

export async function deleteComplaint(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  await complaintService.deleteComplaint(id);
  res.status(200).json(new ApiResponse(200, null, 'Complaint deleted successfully'));
}

export async function getComplaintStats(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  const stats = await complaintService.getComplaintStats(req.user);
  res.status(200).json(new ApiResponse(200, stats, 'Complaint stats fetched successfully'));
}
