import request from "supertest";
import app from "../../../app";
import jwt from "jsonwebtoken";
// Tests should use the test framework globals. Import types from @jest/globals
import { describe, it, expect } from "@jest/globals";

describe("RBAC +Auth", () => {
    const uniqueEmail = `testuser_${Date.now()}@example.com`;
    it ("should register a new user with USER role", async () => {
        const res = await request(app)
            .post("/api/auth/register").send({
                name: "Test User",
                email: uniqueEmail,
                password: "password123"
            });
            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty("user");
            expect(res.body.user).toHaveProperty("role", "USER");
    });

    it("should login the user and return a JWT token", async () => {
        const res = await request(app)
            .post("/api/auth/login")
            .send({
                email: uniqueEmail,
                password: "password123"
            });
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("token");
        expect(res.body.token).toBeDefined();
    }); 
          it("denies staff  from deleting invoices", async () => {   
            const token =jwt.sign(
                { userId: 1, email: uniqueEmail },
                process.env.JWT_SECRET as string,
                { expiresIn: "7d" }
            );
            const res = await request(app)
                .delete("/api/invoices/1")
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(403);
            expect(res.body).toHaveProperty("message", "Forbidden: Insufficient role");
        }); 
         it("alllows OWNER to attempt to delete invoices", async () => {
            const token = jwt.sign(
                { userId: 2, role: "OWNER", email: uniqueEmail },
                process.env.JWT_SECRET as string,
                { expiresIn: "7d" }
            );
            const res = await request(app)
                .delete("/api/invoices/1")
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(404); // Assuming invoice with ID 1 doesn't exist
        });
         it("allows ADMIN to delete invoices", async () => {
            const token = jwt.sign(
                { userId: 3, role: "ADMIN", email: uniqueEmail },
                process.env.JWT_SECRET as string,
                { expiresIn: "7d" }
            );
            const res = await request(app)
                .delete("/api/invoices/1")
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(404); // Assuming invoice with ID 1 doesn't exist
        }); 
        it("rejects unauthenticated users from accessing protected routes", async () => {
            const res = await request(app).get("/api/users/1");
            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty("message", "Unauthorized: No token provided");
        });

        it("forbids USER role from accessing other users' data", async () => {
            const token = jwt.sign(
                { userId: 4, role: "USER", email: uniqueEmail },
                process.env.JWT_SECRET as string,
                { expiresIn: "7d" }
            );
            const res = await request(app)
                .get("/api/users/1")
                .set("Authorization", `Bearer ${token}`);
            expect(res.status).toBe(403);
            expect(res.body).toHaveProperty("message", "Forbidden: Insufficient role");
        });
         it("rejects requests with no token", async () => {
    const res = await request(app).delete("/api/invoices/some-id");
    expect(res.status).toBe(401);
  });
    });