import { prisma } from "../../config/prisma";
import {AppError} from "../../middleware/errorHandler";
import {createInvoiceInput, updateInvoiceInput} from "./invoice.validation";
import {generateInvoiceNumber} from "./invoice.utils";
import type {Invoice} from "../../generated/prisma/client";
import* as clientService from "../clients/client.service";

const calculateTotalAmount = (items: { description: string; quantity: number; unitPrice: number }[] = []): number => {
    return items.reduce((total, item) => total + item.quantity * item.unitPrice, 0);
}
export const createInvoice = async (data: createInvoiceInput & { userId?: string }): Promise<Invoice> => {
    // ensure client exists
    const client = await clientService.ClientService.getClientById(data.clientId);
    if (!client) {
        throw new AppError(404, "Client not found");
    }

    const subtotal = calculateTotalAmount((data as any).items);
    const tax = data.tax ?? 0;
    const total = subtotal + tax;

    const invoiceNumber = await generateInvoiceNumber(data.userInfo.userId);

   return prisma.invoice.create({
        data: {
            invoiceNo: invoiceNumber,
            userId: data.userId ?? data.userInfo.userId,
            clientId: data.clientId,
            subtotal,
            tax,
            total,
            amount: total,
            currency: data.currency ?? 'INR',
            dueDate: new Date(data.dueDate),
            notes: data.notes ?? null,
            status: data.status as any,
            items: {
              create: (data as any).items?.map((item: any) => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                amount: item.quantity * item.unitPrice,
              })) ?? [],
            },
        },
        include: { items: true, client: true },
  });
};
export const getInvoiceById = async (id: string): Promise<Invoice | null> => {
    const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: { items: true, client: true, payments: true },
    });
    return invoice;
};
export const getInvoicesByUser = async (userId: string, opts: { page?: number; limit?: number; search?: string } = { page: 1, limit: 20 }) => {
    const page = opts.page ?? 1;
    const limit = opts.limit ?? 20;
    const search = opts.search?.trim();
    const where: any = { userId };
    if (search) {
        where.OR = [
            { invoiceNumber: { contains: search, mode: 'insensitive' as const } },
            { notes: { contains: search, mode: 'insensitive' as const } },
        ];
    }
    const [invoices, total] = await prisma.$transaction([
        prisma.invoice.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit, include: { items: true, client: true, payments: true } }),
        prisma.invoice.count({ where }),
    ]);
    return { invoices, total, page, limit, totalPages: Math.ceil(total / limit) };
}
    export const updateInvoice =async(userId: string, id: string, data: updateInvoiceInput): Promise<Invoice | null> => {
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
        throw new AppError(404, "Invoice not found");
    }
    if (invoice.userId !== userId) {
        throw new AppError(403, "Forbidden");
    }
    let totals: any = {};
    if (data.items) {
        const subtotal = calculateTotalAmount((data as any).items);
        const total = subtotal + (data.tax ?? 0);
        totals = { subtotal, total };
    }
    return prisma.invoice.update({
        where: { id },
        data: { 

      ...(data.clientId && { clientId: data.clientId }),
      ...(data.dueDate && { dueDate: new Date(data.dueDate as any) }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.tax !== undefined && { tax: data.tax }),
      ...totals,
      ...(data.items && {
        items: {
          deleteMany: {}, // clear old items, replace with new set
          create: (data as any).items.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.quantity * item.unitPrice,
          })),
        },
      }),
    },
    include: { items: true },
  });
};
export const deleteInvoice = async (userId: string, id: string): Promise<Invoice | null> => {
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
        throw new AppError(404, "Invoice not found");
    }
    if (invoice.userId !== userId) throw new AppError(403, "Forbidden");
    return prisma.invoice.delete({ where: { id } });
};


           
    