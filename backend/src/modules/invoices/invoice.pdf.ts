import puppeteer from "puppeteer";
import {Invoice} from "../../generated/prisma/client";

type InvoicewithRelations = Invoice & {
  items: { description: string; quantity: number; unitPrice: number; amount: number }[];
  client: { name: string; email: string; company: string | null };
};
const buildInvoiceHtml = (invoice:InvoicewithRelations):string => { 
    const rows = invoice.items.map(item => `
        <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;">${item.description}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${item.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">$${item.unitPrice.toFixed(2)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">$${item.amount.toFixed(2)}</td>
        </tr>
    `).join('');

  return `
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: Arial, sans-serif; color: #333; padding: 40px; }
        h1 { color: #1a1a1a; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { text-align: left; border-bottom: 2px solid #333; padding: 8px; }
        .totals { text-align: right; margin-top: 20px; }
        .totals p { margin: 4px 0; }
        .grand-total { font-size: 18px; font-weight: bold; }
      </style>
    </head>
    <body>
      <h1>Invoice ${invoice.invoiceNo}</h1>
      <p><strong>Bill To:</strong> ${invoice.client.name} (${invoice.client.email})</p>
      ${invoice.client.company ? `<p><strong>Company:</strong> ${invoice.client.company}</p>` : ""}
        <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>

      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align:right;">Qty</th>
            <th style="text-align:right;">Unit Price</th>
            <th style="text-align:right;">Amount</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div class="totals">
        <p>Subtotal: $${invoice.subtotal.toFixed(2)}</p>
        <p>Tax: $${invoice.tax.toFixed(2)}</p>
        <p class="grand-total">Total: $${invoice.total.toFixed(2)} ${invoice.currency}</p>
      </div>

      ${invoice.notes ? `<p><strong>Notes:</strong> ${invoice.notes}</p>` : ""}
    </body>
  </html>`;
};

export const generateInvoicePdf = async (invoice: InvoicewithRelations): Promise<Buffer> => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"], // needed in most server/container environments
  });

  try {
    const page = await browser.newPage();
    const html = buildInvoiceHtml(invoice);
    // use 'load' to satisfy the puppeteer types in this environment
    await page.setContent(html, { waitUntil: "load" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20px", bottom: "20px" },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close(); // always close, even on error — otherwise you leak Chromium processes
  }
};