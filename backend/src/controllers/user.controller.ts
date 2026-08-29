import type { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import * as userService from '../services/user.service.js';
import type {
  CreateUserInput,
  ListUsersQuery,
  UpdateUserStatusInput,
} from '../validators/user.validator.js';

export async function createUser(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  const input = req.body as CreateUserInput;
  const user = await userService.createUser(input, req.user.id);
  res.status(201).json(new ApiResponse(201, { user }, 'User created successfully'));
}

export async function listUsers(req: Request, res: Response): Promise<void> {
  const query = req.validatedQuery as ListUsersQuery;
  const result = await userService.listUsers(query);
  res.status(200).json(new ApiResponse(200, result, 'Users fetched successfully'));
}

export async function updateUserStatus(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  const { id } = req.params as { id: string };
  const { isActive } = req.body as UpdateUserStatusInput;
  const user = await userService.setUserActiveStatus(id, isActive, req.user.id);
  res
    .status(200)
    .json(
      new ApiResponse(200, { user }, `User ${isActive ? 'activated' : 'deactivated'} successfully`),
    );
}
