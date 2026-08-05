import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/errorHandler';
import type { Client } from '../../generated/prisma/client';
import { ClientInput, ClientUpdateInput } from './client.validation';

export class ClientService {
  static async createClient(data: ClientInput & { userId: string }): Promise<Client> {
    // allow Prisma to generate an id if not provided
    return prisma.client.create({ data: { ...data, id: data.id ?? undefined } as any } as any);
  }

  static async getClientById(id: string): Promise<Client | null> {
    return prisma.client.findUnique({ where: { id } });
  }

  // Get clients for a user with optional search, pagination
  static async getClientsByUser(
    userId: string,
    opts: { page?: number; limit?: number; search?: string } = { page: 1, limit: 20 }
  ) {
    const page = opts.page ?? 1;
    const limit = opts.limit ?? 20;
    const search = opts.search?.trim();

    const where: any = { userId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    const [clients, total] = await prisma.$transaction([
      prisma.client.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.client.count({ where }),
    ]);

    return { clients, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async updateClient(id: string, data: ClientUpdateInput): Promise<Client | null> {
    return prisma.client.update({ where: { id }, data: data as any });
  }

  static async deleteClient(id: string): Promise<Client | null> {
    return prisma.client.delete({ where: { id } });
  }
}
