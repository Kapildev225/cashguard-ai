import { prisma } from "../../config/prisma";
import {AppError} from "../../middleware/errorHandler";
import {createInvoiceInput, updateInvoiceInput} from "./invoice.validation";
import {generateInvoiceNumber} from "./invoice.utils";
import type {Invoice} from "../../generated/prisma/client";
import* as clientService from "../clients/client.service";
import { generateInvoicePdf } from "./invoice.pdf";
import { sendInvoiceEmail } from "./invoice.email";

const calculateTotalAmount = (items: { description: string; quantity: number; unitPrice: number }[] = []): number => {
    return items.reduce((total, item) => total + item.quantity * item.unitPrice, 0);
}
// export const createInvoice = async (data: createInvoiceInput & { userId?: string }): Promise<Invoice> => {
    // ensure client exists
    // const client = await clientService.ClientService.getClientById(data.clientId);
    // if (!client) {
        // throw new AppError(404, "Client not found");
    // }
// 
    // const subtotal = calculateTotalAmount((data as any).items);
    // const tax = data.tax ?? 0;
    // const total = subtotal + tax;
// 
    // support callers that pass either userId (preferred) or legacy userInfo.userId
    // const forUserId = data.userId ?? (data as any).userInfo?.userId;
    // const invoiceNumber = await generateInvoiceNumber(forUserId);
// 
export const createInvoice = async (
    data: createInvoiceInput & { userId?: string }
): Promise<Invoice> => {

    // Get the authenticated user's ID
    const forUserId =
        data.userId ?? (data as any).userInfo?.userId;

    if (!forUserId) {
        throw new AppError(401, "Unauthorized");
    }

    // Ensure the client exists AND belongs to this user
    const client =
        await clientService.ClientService.getClientById(
            data.clientId,
            forUserId
        );

    if (!client) {
        throw new AppError(404, "Client not found");
    }

    const subtotal = calculateTotalAmount(
        (data as any).items
    );

    const tax = data.tax ?? 0;
    const total = subtotal + tax;

    const invoiceNumber =
        await generateInvoiceNumber(forUserId);
   return prisma.invoice.create({
        data: {
            invoiceNo: invoiceNumber,
            userId: forUserId,
            clientId: data.clientId,
            subtotal,
            tax,
            total,
            amount: total,
            currency: data.currency ?? 'INR',
            dueDate: new Date(data.dueDate),
            notes: data.notes ?? null,
        
            items: {
              create: (data as any).items?.map((item: any) => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                amount: item.quantity * item.unitPrice,
              })) ?? [],
            },
        },
        include: { items: true,Client: true },
  });
};
export const getInvoiceById = async (id: string,userId: string): Promise<Invoice | null> => {
    const invoice = await prisma.invoice.findFirst({
        where: { id, userId },
        include: { items: true, Client: true, Payment: true },
    });
    return invoice;
};
export const getInvoicesByUser = async (userId: string, opts: { page?: number; limit?: number; search?: string } = { page: 1, limit: 20 }) => {
    const page = opts.page ?? 1;
    const limit = opts.limit ?? 20;
    const search = opts.search?.trim();
    const where: any = { userId };
    if (search) {
        // prisma schema stores the invoice identifier in `invoiceNo`
        where.OR = [
            { invoiceNo: { contains: search, mode: 'insensitive' as const } },
            { notes: { contains: search, mode: 'insensitive' as const } },
        ];
    }
    const [invoices, total] = await prisma.$transaction([
        prisma.invoice.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit, include: { items: true, Client: true, Payment: true } }),
        prisma.invoice.count({ where }),
    ]);
    return { invoices, total, page, limit, totalPages: Math.ceil(total / limit) };
}
    // export const updateInvoice =async(userId: string, id: string, data: updateInvoiceInput): Promise<Invoice | null> => {
    // const invoice = await prisma.invoice.findUnique({ where: { id } });
    // if (!invoice) {
        // throw new AppError(404, "Invoice not found");
    // }
    // if (invoice.userId !== userId) {
        // throw new AppError(403, "Forbidden");
    // }
    // let totals: any = {};
    // if (data.items) {
        // const subtotal = calculateTotalAmount((data as any).items);
        // const total = subtotal + (data.tax ?? 0);
        // totals = { subtotal, total };
    // }
    // return prisma.invoice.update({
        // where: { id },
        // data: { 

    //   ...(data.clientId && { clientId: data.clientId }),
    //   ...(data.dueDate && { dueDate: new Date(data.dueDate as any) }),
    //   ...(data.notes !== undefined && { notes: data.notes }),
    //   ...(data.tax !== undefined && { tax: data.tax }),
    //   ...totals,
    //   ...(data.items && {
        // items: {
        //   deleteMany: {}, // clear old items, replace with new set
        //   create: (data as any).items.map((item: any) => ({
            // description: item.description,
            // quantity: item.quantity,
            // unitPrice: item.unitPrice,
            // amount: item.quantity * item.unitPrice,
        //   })),
        // },
    //   }),
    // },
    // include: { items: true },
//   });
// };
export const updateInvoice = async (
  userId: string,
  id: string,
  data: updateInvoiceInput
): Promise<Invoice | null> => {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
  });

  if (!invoice) {
    throw new AppError(404, "Invoice not found");
  }

  if (invoice.userId !== userId) {
    throw new AppError(403, "Forbidden");
  }

  // If clientId is being changed, verify the new client belongs to this user
  if (data.clientId && data.clientId !== invoice.clientId) {
    const client = await clientService.ClientService.getClientById(
      data.clientId,
      userId
    );

    if (!client) {
      throw new AppError(404, "Client not found");
    }
  }

  const newItems = data.items;
  const newTax = data.tax !== undefined ? data.tax : invoice.tax ?? 0;

  let totals = {};

  if (newItems) {
    const subtotal = calculateTotalAmount(newItems);
    const total = subtotal + newTax;

    totals = {
      subtotal,
      total,
      amount: total,
    };
  } else if (data.tax !== undefined) {
    const total = invoice.subtotal + newTax;

    totals = {
      total,
      amount: total,
    };
  }

  return prisma.invoice.update({
    where: { id },

    data: {
      ...(data.clientId !== undefined && {
        clientId: data.clientId,
      }),

      ...(data.dueDate !== undefined && {
        dueDate: new Date(data.dueDate),
      }),

      ...(data.notes !== undefined && {
        notes: data.notes,
      }),

      ...(data.tax !== undefined && {
        tax: data.tax,
      }),

      ...(data.currency !== undefined && {
        currency: data.currency,
      }),

      ...(data.status !== undefined && {
        status: data.status,
      }),

      ...totals,

      ...(newItems && {
        items: {
          deleteMany: {},
          create: newItems.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.quantity * item.unitPrice,
          })),
        },
      }),
    },

    include: {
      items: true,
      Client: true,
      Payment: true,
    },
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

export const sendInvoice = async (userId: string, invoiceId: string) => {
  // get invoice (ensure relations are available)
  let invoice = await getInvoiceById(invoiceId, userId) as any;
  if (!invoice) throw new AppError(404, "Invoice not found");

  // Ensure the invoice belongs to the requesting user
  if (invoice.userId !== userId) throw new AppError(403, "Forbidden");

  // If client relation is not present, load it
//   if (!invoice.client) {
    // invoice.client = await prisma.client.findUnique({ where: { id: invoice.clientId } });
    // if (!invoice.client) throw new AppError(404, "Client not found");
//   }
if (!invoice.Client) {
    invoice.Client = await prisma.client.findUnique({
        where: { id: invoice.clientId }
    });

    if (!invoice.Client) {
        throw new AppError(404, "Client not found");
    }
}

  const pdfBuffer = await generateInvoicePdf(invoice as any);

  await sendInvoiceEmail({
    to: invoice.Client.email,
    clientName: invoice.Client.name,
    // use invoiceNo field created in DB
    invoiceNumber: invoice.invoiceNo ?? invoice.invoiceNumber ?? invoice.id,
    total: invoice.total,
    currency: invoice.currency,
    dueDate: invoice.dueDate,
    pdfBuffer,
  });

  return prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "SENT" },
    include: { items: true, Client: true },
  });
};

           
    