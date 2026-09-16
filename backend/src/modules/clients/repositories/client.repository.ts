import { prisma } from '../../../config/prisma';

export class ClientRepository {
  static async create(data: {
    userId: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
  }) {
    return prisma.client.create({
      data: {
        userId: data.userId,
        name: data.name,
        email: data.email,
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.company !== undefined && { company: data.company }),
      },
    });
  }

  static async findById(id: string, userId: string) {
    return prisma.client.findFirst({
      where: {
        id,
        userId,
      },
    });
  }

  static async findManyByUser(
    userId: string,
    options: {
      page: number;
      limit: number;
      search?: string;
    },
  ) {
    const { page, limit, search } = options;

    const where: any = {
      userId,
    };

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const [clients, total] = await prisma.$transaction([
      prisma.client.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),

      prisma.client.count({
        where,
      }),
    ]);

    return {
      clients,
      total,
    };
  }

  static async update(
    id: string,
    userId: string,
    data: {
      name?: string;
      email?: string;
      phone?: string;
      company?: string;
    },
  ) {
    return prisma.client.updateMany({
      where: {
        id,
        userId,
      },
      data,
    });
  }

  static async delete(id: string, userId: string) {
    return prisma.client.deleteMany({
      where: {
        id,
        userId,
      },
    });
  }
}