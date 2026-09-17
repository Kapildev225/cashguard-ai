import request from "supertest";
import app from "../../../app";
import jwt from "jsonwebtoken";
import { email } from "zod/v4/mini";

// const token = jwt.sign(
//   { userId: 'seed-user-id', role: ['ADMIN', 'OWNER'], email: 'admin@example.com' },
//   process.env.JWT_SECRET as string,
//   { expiresIn: '7d' }
// );
const token = jwt.sign(
  {
    userId: '3b352036-559b-4bb1-8721-5668850da8e9',
    role: 'OWNER',
    email: 'owner@cashguard.test'
  },
  process.env.JWT_SECRET as string,
  { expiresIn: '7d' }
);
describe('Client Routes', () => {
    it("should create a new client", async () => {
        const res = await request(app)
            .post("/api/clients")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "Test Client",
                email: "testclient@example.com",
                phone: "1234567890"
            });
        expect(res.status).toBe(201);
        expect(res.body.data).toHaveProperty("id");
    });
    it("LIsts clients with pagination and search", async () => {
        const res = await request(app)
            .get("/api/clients?page=1&limit=10&search=Test")    
        .set("Authorization", `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty("clients");
        expect(res.body.data).toHaveProperty("total");
        expect(res.body.data).toHaveProperty("page");
        expect(res.body.data).toHaveProperty("limit");
        expect(res.body.data).toHaveProperty("totalPages");
    });
    
    it("rejects invalid email format when creating a client", async () => {
        const res = await request(app)
            .post("/api/clients")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "Invalid Email Client",
                email: "invalid-email",
                phone: "1234567890"
            });
        expect(res.status).toBe(400);
    });
    it("gets a single client by id", async () => {
    const createRes = await request(app)
        .post("/api/clients")
        .set("Authorization", `Bearer ${token}`)
        .send({
            name: "Single Client",
            email: "singleclient@example.com",
            phone: "9876543210"
        });

    expect(createRes.status).toBe(201);

    const clientId = createRes.body.data.id;

    const res = await request(app)
        .get(`/api/clients/${clientId}`)
        .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty("id", clientId);
    expect(res.body.data).toHaveProperty("name", "Single Client");
    expect(res.body.data).toHaveProperty(
        "email",
        "singleclient@example.com"
    );
});
it("updates an existing client", async () => {
    const createRes = await request(app)
        .post("/api/clients")
        .set("Authorization", `Bearer ${token}`)
        .send({
            name: "Update Client",
            email: "update@example.com",
            phone: "9876543210"
        });

    expect(createRes.status).toBe(201);

    const clientId = createRes.body.data.id;

    const updateRes = await request(app)
        .put(`/api/clients/${clientId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
            name: "Updated Client",
            company: "CashGuard Technologies"
        });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data).toHaveProperty(
        "name",
        "Updated Client"
    );
    expect(updateRes.body.data).toHaveProperty(
        "company",
        "CashGuard Technologies"
    );
    expect(updateRes.body.data).toHaveProperty(
        "email",
        "update@example.com"
    );
});
it("prevents a user from accessing another user's client", async () => {
    const createRes = await request(app)
        .post("/api/clients")
        .set("Authorization", `Bearer ${token}`)
        .send({
            name: "Private Client",
            email: "private@example.com"
        });

    expect(createRes.status).toBe(201);

    const clientId = createRes.body.data.id;

    const anotherUserToken = jwt.sign(
        {
            userId: "another-user-id",
            role: "OWNER",
            email: "another@example.com"
        },
        process.env.JWT_SECRET as string,
        { expiresIn: "7d" }
    );

    const res = await request(app)
        .get(`/api/clients/${clientId}`)
        .set("Authorization", `Bearer ${anotherUserToken}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("message", "Client not found");
});

    it("deletes the client", async () => {
        // create a client then delete it
        const createRes = await request(app)
            .post('/api/clients')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'ToDelete', email: 'todelete@example.com' });

        expect(createRes.status).toBe(201);
        const deleteRes = await request(app)
            .delete(`/api/clients/${createRes.body.data.id}`)
            .set('Authorization', `Bearer ${token}`);
        expect(deleteRes.status).toBe(200);
        expect(deleteRes.body.data).toHaveProperty('message', 'Client deleted successfully');
    });
    it('rejects unauthenticated users from accessing protected routes', async () => {
        const res = await request(app).get('/api/clients');
        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('message', 'Unauthorized: No token provided');
    });

});