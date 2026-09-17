// import {z} from 'zod';

// export const invoiceSchema = z.object({
//     description: z.string().min(1).max(255, "Description must be between 1 and 255 characters"),
//     // item-level fields kept for backward compatibility but individual items should be provided
//     amount: z.number().positive("Amount must be a positive number").optional(),
//     quantity: z.number().int().positive("Quantity must be a positive integer").optional(),
//     dueDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date format" }),
    
    
    
// });
// export const createInvoiceSchema = invoiceSchema.extend({
//     clientId: z.string().uuid("Invalid client ID format"),
//     userInfo: z.object({
//         userId: z.string().uuid("Invalid user ID format"),
//         email: z.string().email("Invalid email format"),
//     }),
//     items: z.array(z.object({
//         description: z.string().min(1).max(1000),
//         quantity: z.number().positive(),
//         unitPrice: z.number().nonnegative(),
//     })).optional(),
//     itemId: z.string().uuid("Invalid item ID format").optional(),
//     taxId: z.string().uuid("Invalid tax ID format").optional(),
//     tax: z.number().nonnegative("Tax must be a non-negative number").default(0),
//     currency: z.string().length(3, "Currency must be a 3-letter ISO code").optional(),
//     dueDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date format" }),
//     notes: z.string().max(500, "Notes must be 500 characters or less").optional(),
//     status: z.enum(["DRAFT", "SENT", "PAID", "CANCELLED"]).optional(),
//     invoiceNumber: z.string().optional(),
// });
// export const updateInvoiceSchema = createInvoiceSchema.partial().refine(data => Object.keys(data).length > 0, {
//     message: "At least one field must be provided for update"
// });
// export type createInvoiceInput = z.infer<typeof createInvoiceSchema>;
// export type updateInvoiceInput = z.infer<typeof updateInvoiceSchema>;


import { z } from "zod";

/**
 * Invoice item validation
 *
 * `amount` is intentionally not accepted from the client.
 * It is calculated by the backend:
 *
 * quantity × unitPrice
 */
const invoiceItemSchema = z.object({
    description: z
        .string()
        .trim()
        .min(1, "Item description is required")
        .max(1000, "Item description must be 1000 characters or less"),

    quantity: z
        .number()
        .positive("Quantity must be greater than 0"),

    unitPrice: z
        .number()
        .nonnegative("Unit price cannot be negative"),
});

/**
 * Create invoice validation
 *
 * Server-controlled fields such as:
 * - userId
 * - invoiceNo
 * - subtotal
 * - total
 * - amount
 *
 * are NOT accepted from the request body.
 */
export const createInvoiceSchema = z.object({
    clientId: z
        .string()
        .min(1, "Client ID is required"),

    items: z
        .array(invoiceItemSchema)
        .min(1, "At least one invoice item is required"),

    tax: z
        .number()
        .nonnegative("Tax must be a non-negative number")
        .default(0),

    currency: z
        .string()
        .length(3, "Currency must be a 3-letter ISO code")
        .default("INR")
        .transform((value) => value.toUpperCase()),

    dueDate: z
        .string()
        .datetime({ message: "Invalid due date format" }),

    notes: z
        .string()
        .trim()
        .max(500, "Notes must be 500 characters or less")
        .optional(),
});

export type createInvoiceInput = z.infer<typeof createInvoiceSchema>;

/**
 * Update invoice validation
 *
 * All fields are optional, but at least one field
 * must be supplied.
 */
export const updateInvoiceSchema = z
    .object({
        clientId: z
            .string()
            .min(1, "Invalid client ID"),

        items: z
            .array(invoiceItemSchema)
            .min(1, "At least one invoice item is required"),

        tax: z
            .number()
            .nonnegative("Tax must be a non-negative number"),

        currency: z
            .string()
            .length(3, "Currency must be a 3-letter ISO code")
            .transform((value) => value.toUpperCase()),

        dueDate: z
            .string()
            .datetime({ message: "Invalid due date format" }),

        notes: z
            .string()
            .trim()
            .max(500, "Notes must be 500 characters or less")
            .optional(),

        status: z.enum([
            "DRAFT",
            "SENT",
            "PAID",
            "OVERDUE",
            "VIEWED",
            "PARTIALLY_PAID",
            "CANCELLED",
        ]),
    })
    .partial()
    .refine(
        (data) => Object.keys(data).length > 0,
        {
            message: "At least one field must be provided for update",
        }
    );

export type updateInvoiceInput = z.infer<typeof updateInvoiceSchema>;