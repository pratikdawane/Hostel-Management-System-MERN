import { api } from './api';
import type { ApiEnvelope } from '@/types/api';
import type {
  Bed,
  CreateBedInput,
  CreateRoomInput,
  PaginatedRooms,
  Room,
  RoomStats,
  RoomStatus,
  UpdateRoomInput,
} from '@/types/room';

export interface ListRoomsParams {
  q?: string;
  floor?: number;
  status?: RoomStatus;
  page?: number;
  limit?: number;
}

export async function createRoom(input: CreateRoomInput): Promise<Room> {
  const { data } = await api.post<ApiEnvelope<{ room: Room }>>('/rooms', input);
  return data.data.room;
}

export async function listRooms(params: ListRoomsParams = {}): Promise<PaginatedRooms> {
  const { data } = await api.get<ApiEnvelope<PaginatedRooms>>('/rooms', { params });
  return data.data;
}

export async function getRoomStats(): Promise<RoomStats> {
  const { data } = await api.get<ApiEnvelope<RoomStats>>('/rooms/stats');
  return data.data;
}

export async function getRoom(id: string): Promise<Room> {
  const { data } = await api.get<ApiEnvelope<{ room: Room }>>(`/rooms/${id}`);
  return data.data.room;
}

export async function updateRoom(id: string, input: UpdateRoomInput): Promise<Room> {
  const { data } = await api.put<ApiEnvelope<{ room: Room }>>(`/rooms/${id}`, input);
  return data.data.room;
}

export async function deleteRoom(id: string): Promise<void> {
  await api.delete(`/rooms/${id}`);
}

export async function listRoomBeds(roomId: string): Promise<Bed[]> {
  const { data } = await api.get<ApiEnvelope<{ beds: Bed[] }>>(`/rooms/${roomId}/beds`);
  return data.data.beds;
}

export async function createRoomBed(roomId: string, input: CreateBedInput): Promise<Bed> {
  const { data } = await api.post<ApiEnvelope<{ bed: Bed }>>(`/rooms/${roomId}/beds`, input);
  return data.data.bed;
}
