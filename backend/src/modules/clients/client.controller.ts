import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';
import { ClientService } from './client.service';
import { createClientSchema, updateClientSchema } from './client.validation';

// Create
export const createClientHandler = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createClientSchema.parse(req.body);
  // req.user is provided by auth middleware; cast to any to avoid needing global augmentation here
  const userId = (req as any).user?.userId;
  if (!userId) throw new AppError(401, 'Unauthorized');

  const client = await ClientService.createClient({ ...(validatedData as any), userId });
  sendSuccess(res, client, 201);
});

// Get single
export const getClientByIdHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id || Array.isArray(id)) throw new AppError(400, 'Invalid id');

  const client = await ClientService.getClientById(id);
  if (!client) throw new AppError(404, 'Client not found');

  sendSuccess(res, client, 200);
});

// List with pagination + search
export const getClientsHandler = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt((req.query.page as string) || '1', 10) || 1;
  const limit = parseInt((req.query.limit as string) || '20', 10) || 20;
  const search = typeof req.query.search === 'string' ? (req.query.search as string) : undefined;

  const userId = (req as any).user?.userId;
  if (!userId) throw new AppError(401, 'Unauthorized');

  const opts = search !== undefined ? { page, limit, search } : { page, limit };
  const result = await ClientService.getClientsByUser(userId, opts);
  sendSuccess(res, result, 200);
});

// Update
export const updateClientHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id || Array.isArray(id)) throw new AppError(400, 'Invalid id');

  const validatedData = updateClientSchema.parse(req.body);
  const client = await ClientService.updateClient(id, validatedData as any);
  if (!client) throw new AppError(404, 'Client not found');

  sendSuccess(res, client, 200);
});

// Delete
export const deleteClientHandler = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id || Array.isArray(id)) throw new AppError(400, 'Invalid id');

  const client = await ClientService.deleteClient(id);
  if (!client) throw new AppError(404, 'Client not found');

  sendSuccess(res, { message: 'Client deleted successfully' }, 200);
});