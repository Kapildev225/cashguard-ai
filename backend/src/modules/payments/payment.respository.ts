import { prisma } from "../../config/prisma";

export class PaymentRepository {
  static async create(data: {
    invoiceId: string;
    amount: number;
    paidAt?: Date;
    method?: "BANK_TRANSFER" | "CARD" | "UPI" | "CASH" | "OTHER";
  }) {
    return prisma.payment.create({
      data: {
        invoiceId: data.invoiceId,
        amount: data.amount,
        paidAt: data.paidAt ?? new Date(),
       ...(data.method !== undefined && {
         method: data.method,
}),
      },
      include: {
        Invoice: true,
      },
    });
  }

  static async findById(id: string) {
    return prisma.payment.findUnique({
      where: { id },
      include: {
        Invoice: true,
      },
    });
  }

  static async findByInvoiceId(invoiceId: string) {
    return prisma.payment.findMany({
      where: { invoiceId },
      orderBy: { paidAt: "desc" },
      include: {
        Invoice: true,
      },
    });
  }

  static async delete(id: string) {
    return prisma.payment.delete({
      where: { id },
    });
  }
}
