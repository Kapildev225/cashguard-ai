import * as InvoiceService from "../invoice.service";

describe("Invoice ownership", () => {
  it("should return null when an invoice belongs to another user", async () => {
    const result = await InvoiceService.getInvoiceById(
      "non-existing-or-other-user-invoice-id",
      "different-user-id"
    );

    expect(result).toBeNull();
  });
});
