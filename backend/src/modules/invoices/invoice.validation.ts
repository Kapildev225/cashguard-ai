import {z} from 'zod';

export const invoiceSchema = z.object({
    description: z.string().min(1).max(255, "Description must be between 1 and 255 characters"),
    // item-level fields kept for backward compatibility but individual items should be provided
    amount: z.number().positive("Amount must be a positive number").optional(),
    quantity: z.number().int().positive("Quantity must be a positive integer").optional(),
    dueDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date format" }),
    
    
    
});
export const createInvoiceSchema = invoiceSchema.extend({
    clientId: z.string().uuid("Invalid client ID format"),
    userInfo: z.object({
        userId: z.string().uuid("Invalid user ID format"),
        email: z.string().email("Invalid email format"),
    }),
    items: z.array(z.object({
        description: z.string().min(1).max(1000),
        quantity: z.number().positive(),
        unitPrice: z.number().nonnegative(),
    })).optional(),
    itemId: z.string().uuid("Invalid item ID format").optional(),
    taxId: z.string().uuid("Invalid tax ID format").optional(),
    tax: z.number().nonnegative("Tax must be a non-negative number").default(0),
    currency: z.string().length(3, "Currency must be a 3-letter ISO code").optional(),
    dueDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date format" }),
    notes: z.string().max(500, "Notes must be 500 characters or less").optional(),
    status: z.enum(["DRAFT", "SENT", "PAID", "CANCELLED"]).optional(),
    invoiceNumber: z.string().optional(),
});
export const updateInvoiceSchema = createInvoiceSchema.partial().refine(data => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update"
});
export type createInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type updateInvoiceInput = z.infer<typeof updateInvoiceSchema>;