import request from "supertest";
import app from "../../../app";
import { prisma } from "../../../config/prisma";

describe("Payment API", () => {
  let token: string;
  let invoiceId: string;
  let paymentId: string;

  beforeAll(async () => {
    const email = `payment-test-${Date.now()}@example.com`;

    await request(app)
      .post("/api/auth/register")
      .send({
        name: "Payment Test User",
        email,
        password: "Password123!",
      });

    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email,
        password: "Password123!",
      });

    token = loginResponse.body.data?.token ?? loginResponse.body.token;

    const client = await prisma.client.create({
      data: {
        name: "Payment Test Client",
        email: `payment-client-${Date.now()}@example.com`,
        userId: loginResponse.body.data?.user?.id ??
          loginResponse.body.user?.id,
      },
    });

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo: `PAY-${Date.now()}`,
        userId: loginResponse.body.data?.user?.id ??
          loginResponse.body.user?.id,
        clientId: client.id,
        subtotal: 1000,
        tax: 0,
        total: 1000,
        amount: 1000,
        currency: "INR",
        dueDate: new Date(Date.now() + 86400000),
      },
    });

    invoiceId = invoice.id;
  });

  afterAll(async () => {
    if (invoiceId) {
      await prisma.payment.deleteMany({
        where: { invoiceId },
      });

      await prisma.invoice.deleteMany({
        where: { id: invoiceId },
      });
    }

    await prisma.$disconnect();
  });

  it("should create a partial payment", async () => {
    const res = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        invoiceId,
        amount: 400,
        method: "UPI",
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");

    paymentId = res.body.id;

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    expect(invoice?.status).toBe("PARTIALLY_PAID");
  });

  it("should reject payment greater than remaining balance", async () => {
    const res = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        invoiceId,
        amount: 700,
        method: "UPI",
      });

    expect(res.status).toBe(400);
  });

  it("should create the remaining payment and mark invoice as PAID", async () => {
    const res = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        invoiceId,
        amount: 600,
        method: "BANK_TRANSFER",
      });
console.log("CREATE PAYMENT RESPONSE:", res.status, res.body);
    expect(res.status).toBe(201);

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    expect(invoice?.status).toBe("PAID");
  });

  it("should list payments for an invoice", async () => {
    const res = await request(app)
      .get(`/api/payments/invoice/${invoiceId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
  });

  it("should reject unauthenticated payment requests", async () => {
    const res = await request(app)
      .post("/api/payments")
      .send({
        invoiceId,
        amount: 100,
        method: "CASH",
      });

    expect(res.status).toBe(401);
  });

  it("should get a payment by id", async () => {
    const res = await request(app)
      .get(`/api/payments/${paymentId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(paymentId);
  });

  it("should delete a payment", async () => {
    const res = await request(app)
      .delete(`/api/payments/${paymentId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});