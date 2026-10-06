import { transporter } from "../../config/mailer";
import { logger } from "../../config/logger";

interface PaymentReminderEmailParams {
  to: string;
  clientName: string;
  invoiceNumber: string;
  amountDue: number;
  currency: string;
  dueDate: string;
  reminderType: "UPCOMING_DUE" | "OVERDUE";
}

export const sendPaymentReminderEmail = async ({
  to,
  clientName,
  invoiceNumber,
  amountDue,
  currency,
  dueDate,
  reminderType,
}: PaymentReminderEmailParams) => {
  const isOverdue = reminderType === "OVERDUE";

  const subject = isOverdue
    ? `Payment overdue - Invoice ${invoiceNumber}`
    : `Payment reminder - Invoice ${invoiceNumber}`;

  const message = isOverdue
    ? "This is a reminder that payment is overdue."
    : "This is a friendly reminder that payment is due soon.";

  const html = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2>${isOverdue ? "Payment Overdue" : "Payment Reminder"}</h2>

      <p>Hi ${clientName},</p>

      <p>
        ${message}
        Invoice <strong>${invoiceNumber}</strong>.
      </p>

      <p>
        <strong>Amount Due:</strong>
        ${currency} ${amountDue.toFixed(2)}
      </p>

      <p>
        <strong>Due Date:</strong>
        ${new Date(dueDate).toLocaleDateString()}
      </p>

      <p>Thank you for your business.</p>

      <p>CashGuard AI</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    html,
  });

  logger.info(
    `Payment reminder sent - invoice: ${invoiceNumber}, to: ${to}`
  );
};
