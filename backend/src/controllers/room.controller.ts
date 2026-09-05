import type { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import * as roomService from '../services/room.service.js';
import type {
  CreateRoomInput,
  ListRoomsQuery,
  UpdateRoomInput,
} from '../validators/room.validator.js';
import type { CreateBedInput } from '../validators/bed.validator.js';

export async function createRoom(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  const input = req.body as CreateRoomInput;
  const { room, beds } = await roomService.createRoom(input, req.user.id);
  res.status(201).json(new ApiResponse(201, { room, beds }, 'Room created successfully'));
}

export async function listRooms(req: Request, res: Response): Promise<void> {
  const query = req.validatedQuery as ListRoomsQuery;
  const result = await roomService.listRooms(query);
  res.status(200).json(new ApiResponse(200, result, 'Rooms fetched successfully'));
}

export async function getRoomStats(_req: Request, res: Response): Promise<void> {
  const stats = await roomService.getRoomStats();
  res.status(200).json(new ApiResponse(200, stats, 'Room stats fetched successfully'));
}

export async function getRoomById(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const room = await roomService.getRoomById(id);
  res.status(200).json(new ApiResponse(200, { room }, 'Room fetched successfully'));
}

export async function updateRoom(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const input = req.body as UpdateRoomInput;
  const room = await roomService.updateRoom(id, input);
  res.status(200).json(new ApiResponse(200, { room }, 'Room updated successfully'));
}

export async function deleteRoom(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  await roomService.deleteRoom(id);
  res.status(200).json(new ApiResponse(200, null, 'Room deleted successfully'));
}

export async function listRoomBeds(req: Request, res: Response): Promise<void> {
  const { roomId } = req.params as { roomId: string };
  const beds = await roomService.listRoomBeds(roomId);
  res.status(200).json(new ApiResponse(200, { beds }, 'Beds fetched successfully'));
}

export async function createRoomBed(req: Request, res: Response): Promise<void> {
  const { roomId } = req.params as { roomId: string };
  const input = req.body as CreateBedInput;
  const bed = await roomService.createRoomBed(roomId, input);
  res.status(201).json(new ApiResponse(201, { bed }, 'Bed created successfully'));
}
