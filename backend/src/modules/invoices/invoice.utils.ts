import { prisma } from "../../config/prisma";
export  const generateInvoiceNumber = async (userId: string): Promise<string> => {
    const count = await prisma.invoice.count({
        where: { userId },
    });
    const nextNumber = count + 1;
    return `INV-${nextNumber.toString().padStart(5, '0')}`;
};
  