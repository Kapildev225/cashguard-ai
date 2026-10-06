// import { prisma } from '../../config/prisma';
// import { AppError } from '../../middleware/errorHandler';
// import type { Client } from '../../generated/prisma/client';
// import { ClientInput, ClientUpdateInput } from './client.validation';

// export class ClientService {
//   static async createClient(data: ClientInput & { userId: string }): Promise<Client> {
//     // allow Prisma to generate an id if not provided
//     return prisma.client.create({ data: { ...data, id: data.id ?? undefined } as any } as any);
//   }

//   static async getClientById(id: string): Promise<Client | null> {
//     return prisma.client.findUnique({ where: { id } });
//   }

//   // Get clients for a user with optional search, pagination
//   static async getClientsByUser(
//     userId: string,
//     opts: { page?: number; limit?: number; search?: string } = { page: 1, limit: 20 }
//   ) {
//     const page = opts.page ?? 1;
//     const limit = opts.limit ?? 20;
//     const search = opts.search?.trim();

//     const where: any = { userId };
//     if (search) {
//       where.OR = [
//         { name: { contains: search, mode: 'insensitive' as const } },
//         { email: { contains: search, mode: 'insensitive' as const } },
//       ];
//     }

//     const [clients, total] = await prisma.$transaction([
//       prisma.client.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
//       prisma.client.count({ where }),
//     ]);

//     return { clients, total, page, limit, totalPages: Math.ceil(total / limit) };
//   }

//   static async updateClient(id: string, data: ClientUpdateInput): Promise<Client | null> {
//     return prisma.client.update({ where: { id }, data: data as any });
//   }

//   static async deleteClient(id: string): Promise<Client | null> {
//     return prisma.client.delete({ where: { id } });
//   }
// }


import { AppError } from '../../middleware/errorHandler';
import type { Client } from '../../generated/prisma/client';
import {
  ClientInput,
  ClientUpdateInput,
} from './client.validation';
import { ClientRepository } from './repositories/client.repository';

export class ClientService {
  static async createClient(
    data: ClientInput & { userId: string }
  ): Promise<Client> {
    if (!data.name?.trim()) {
      throw new AppError(400, 'Client name is required');
    }

    if (!data.email?.trim()) {
      throw new AppError(400, 'Client email is required');
    }

    return ClientRepository.create({
      userId: data.userId,
      name: data.name.trim(),
      email: data.email.trim(),
      ...(data.phone !== undefined && {
        phone: data.phone.trim(),
      }),
      ...(data.company !== undefined && {
        company: data.company.trim(),
      }),
    });
  }

  static async getClientById(
    id: string,
    userId: string
  ): Promise<Client | null> {
    return ClientRepository.findById(id, userId);
  }

  static async getClientsByUser(
    userId: string,
    opts: {
      page?: number;
      limit?: number;
      search?: string;
    } = {}
  ) {
    const page = Math.max(opts.page ?? 1, 1);
    const limit = Math.min(Math.max(opts.limit ?? 20, 1), 100);
    const search = opts.search?.trim();

    const result = await ClientRepository.findManyByUser(
      userId,
      {
        page,
        limit,
        ...(search !== undefined && { search }),
      }
    );

    return {
      clients: result.clients,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    };
  }

  static async updateClient(
    id: string,
    userId: string,
    data: ClientUpdateInput
  ): Promise<Client> {
    const existingClient = await ClientRepository.findById(
      id,
      userId
    );

    if (!existingClient) {
      throw new AppError(404, 'Client not found');
    }

    const updateData = {
      ...(data.name !== undefined && {
        name: data.name.trim(),
      }),
      ...(data.email !== undefined && {
        email: data.email.trim(),
      }),
      ...(data.phone !== undefined && {
        phone: data.phone.trim(),
      }),
      ...(data.company !== undefined && {
        company: data.company.trim(),
      }),
    };

    await ClientRepository.update(
      id,
      userId,
      updateData
    );

    const updatedClient = await ClientRepository.findById(
      id,
      userId
    );

    if (!updatedClient) {
      throw new AppError(404, 'Client not found');
    }

    return updatedClient;
  }

  static async deleteClient(
    id: string,
    userId: string
  ): Promise<Client> {
    const existingClient = await ClientRepository.findById(
      id,
      userId
    );

    if (!existingClient) {
      throw new AppError(404, 'Client not found');
    }

    await ClientRepository.delete(id, userId);

    return existingClient;
  }
}






























































































