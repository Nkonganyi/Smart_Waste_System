const request = require("supertest");
const express = require("express");
const authRoutes = require("../routes/authRoutes");

// Mock dependencies
jest.mock("../config/supabase", () => ({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    insert: jest.fn().mockReturnThis()
}));

const supabase = require("../config/supabase");

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);

describe("Auth Integration Tests", () => {
    describe("POST /api/auth/register", () => {
        test("should return 400 for missing fields", async () => {
            const res = await request(app)
                .post("/api/auth/register")
                .send({ email: "test@example.com" });
            
            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe("Invalid input");
        });

        test("should return 409 if user already exists", async () => {
            supabase.single.mockResolvedValueOnce({ data: { id: "1" }, error: null });

            const res = await request(app)
                .post("/api/auth/register")
                .send({ 
                    name: "Test User", 
                    email: "existing@example.com", 
                    password: "Password123!", 
                    role: "citizen" 
                });
            
            expect(res.statusCode).toBe(409);
            expect(res.body.error).toBe("User exists");
        });
    });
});
