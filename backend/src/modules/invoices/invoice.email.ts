// src/modules/invoices/invoice.email.ts
import { transporter } from "../../config/mailer";
import { logger } from "../../config/logger";

interface SendInvoiceEmailParams {
  to: string;
  clientName: string;
  invoiceNumber: string;
  total: number;
  currency: string;
  dueDate: Date;
  pdfBuffer: Buffer;
}

export const sendInvoiceEmail = async ({
  to,
  clientName,
  invoiceNumber,
  total,
  currency,
  dueDate,
  pdfBuffer,
}: SendInvoiceEmailParams) => {
  const html = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <p>Hi ${clientName},</p>
      <p>Please find attached invoice <strong>${invoiceNumber}</strong> for
        <strong>$${total.toFixed(2)} ${currency}</strong>, due
        <strong>${dueDate.toLocaleDateString()}</strong>.</p>
      <p>Thank you for your business.</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: `Invoice ${invoiceNumber} from CashGuard AI`,
    html,
    attachments: [
      {
        filename: `${invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });

  logger.info(`Invoice email sent — invoice: ${invoiceNumber}, to: ${to}`);
};