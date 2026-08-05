import {Request, Response} from "express";
import {asyncHandler} from "../../middleware/asyncHandler";
import {AppError} from "../../middleware/errorHandler";
import * as InvoiceService from "./invoice.service";
import {createInvoiceSchema, updateInvoiceSchema} from "./invoice.validation";
import {generateInvoiceNumber} from "./invoice.utils";

export const createInvoiceHandler = asyncHandler(async (req: Request, res: Response) => {
    const validatedData= createInvoiceSchema.parse(req.body);
    const userId = (req as any).user?.userId;
    if (!userId) throw new AppError(401, "Unauthorized");
    const invoice = await InvoiceService.createInvoice({ ...(validatedData as any), userId });
    res.status(201).json(invoice);
});

export const getInvoiceByIdHandler = asyncHandler(async (req: Request, res: Response) => {
    const {id} = req.params;
    if (!id || Array.isArray(id)) throw new AppError(400, "Invalid id");
    const invoice = await InvoiceService.getInvoiceById(id);
    if (!invoice) throw new AppError(404, "Invoice not found");
    res.status(200).json(invoice);
});
 
export const getInvoicesHandler = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt((req.query.page as string) || "1", 10) || 1;
    const limit = parseInt((req.query.limit as string) || "20", 10) || 20;
    const search = typeof req.query.search === "string" ? (req.query.search as string) : undefined;
    const userId = (req as any).user?.userId;
    if (!userId) throw new AppError(401, "Unauthorized");
    const opts = search !== undefined ? { page, limit, search } : { page, limit };
    const result = await InvoiceService.getInvoicesByUser(userId, opts);
    res.status(200).json(result);

});
export const updateInvoiceHandler = asyncHandler(async (req: Request, res: Response) => {  
     const {id} = req.params;
     const userId = (req as any).user?.userId;
     if (!userId) throw new AppError(401, "Unauthorized");
     if (!id || Array.isArray(id)) throw new AppError(400, "Invalid id");
     const validatedData = updateInvoiceSchema.parse(req.body);
     const invoice = await InvoiceService.updateInvoice(userId, id, validatedData as any);
     if (!invoice) throw new AppError(404, "Invoice not found");
     res.status(200).json(invoice);
});    
export const deleteInvoiceHandler = asyncHandler(async (req: Request, res: Response) => {
     const {id} = req.params;
     const userId = (req as any).user?.userId;
     if (!userId) throw new AppError(401, "Unauthorized");
     if (!id || Array.isArray(id)) throw new AppError(400, "Invalid id");
        const invoice = await InvoiceService.deleteInvoice(userId, id);
        if (!invoice) throw new AppError(404, "Invoice not found");
        res.status(200).json({ message: "Invoice deleted successfully" });
} ); 
