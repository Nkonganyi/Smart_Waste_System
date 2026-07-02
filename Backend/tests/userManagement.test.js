const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-for-jest-min-32-characters";

// Mock supabase chainable query builder
jest.mock("../config/supabase", () => ({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    single: jest.fn(),
    maybeSingle: jest.fn(),
}));

const supabase = require("../config/supabase");
const { authenticate } = require("../middleware/authMiddleware");
const userRoutes = require("../routes/userRoutes");

const app = express();
app.use(express.json());
app.use("/api/users", userRoutes);

function tokenFor(user) {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );
}

describe("User Management Module", () => {
    describe("authenticate middleware - suspension enforcement", () => {
        test("rejects requests from a user suspended after their token was issued", async () => {
            const token = tokenFor({ id: "user-1", email: "a@a.com", role: "citizen", name: "A" });
            supabase.maybeSingle.mockResolvedValueOnce({
                data: { id: "user-1", is_suspended: true },
                error: null,
            });

            const res = await request(app)
                .get("/api/users/profile")
                .set("Authorization", `Bearer ${token}`);

            expect(res.statusCode).toBe(403);
            expect(res.body.error).toBe("Account suspended");
        });

        test("allows requests from a non-suspended, currently-existing user", async () => {
            const token = tokenFor({ id: "user-2", email: "b@b.com", role: "citizen", name: "B" });
            supabase.maybeSingle.mockResolvedValueOnce({
                data: { id: "user-2", is_suspended: false },
                error: null,
            });
            supabase.single.mockResolvedValueOnce({
                data: { id: "user-2", name: "B", email: "b@b.com", role: "citizen", is_verified: true },
                error: null,
            });

            const res = await request(app)
                .get("/api/users/profile")
                .set("Authorization", `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
        });

        test("rejects requests with no token", async () => {
            const res = await request(app).get("/api/users/profile");
            expect(res.statusCode).toBe(401);
        });
    });

    describe("PUT /api/users/profile validation", () => {
        test("rejects an empty update body", async () => {
            const token = tokenFor({ id: "user-3", email: "c@c.com", role: "citizen", name: "C" });
            supabase.maybeSingle.mockResolvedValueOnce({
                data: { id: "user-3", is_suspended: false },
                error: null,
            });

            const res = await request(app)
                .put("/api/users/profile")
                .set("Authorization", `Bearer ${token}`)
                .send({});

            expect(res.statusCode).toBe(400);
        });

        test("rejects an invalid phone number", async () => {
            const token = tokenFor({ id: "user-4", email: "d@d.com", role: "citizen", name: "D" });
            supabase.maybeSingle.mockResolvedValueOnce({
                data: { id: "user-4", is_suspended: false },
                error: null,
            });

            const res = await request(app)
                .put("/api/users/profile")
                .set("Authorization", `Bearer ${token}`)
                .send({ phone: "not-a-phone!!" });

            expect(res.statusCode).toBe(400);
        });

        test("accepts a valid update", async () => {
            const token = tokenFor({ id: "user-5", email: "e@e.com", role: "citizen", name: "E" });
            supabase.maybeSingle.mockResolvedValueOnce({
                data: { id: "user-5", is_suspended: false },
                error: null,
            });
            supabase.single.mockResolvedValueOnce({
                data: { id: "user-5", name: "New Name", email: "e@e.com", role: "citizen", phone: "+237600000000" },
                error: null,
            });

            const res = await request(app)
                .put("/api/users/profile")
                .set("Authorization", `Bearer ${token}`)
                .send({ name: "New Name", phone: "+237600000000" });

            expect(res.statusCode).toBe(200);
            expect(res.body.user.name).toBe("New Name");
        });
    });
});
