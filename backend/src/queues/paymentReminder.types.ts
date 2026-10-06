export interface PaymentReminderJobData {
  invoiceId: string;
  userId: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  invoiceNumber: string;
  amountDue: number;
  currency: string;
  dueDate: string;
  reminderType: "UPCOMING_DUE" | "OVERDUE";
}