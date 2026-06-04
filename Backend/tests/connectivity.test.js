const request = require("supertest");
const express = require("express");
// Mock auth middleware
jest.mock("../middleware/authMiddleware", () => ({
    authenticate: (req, res, next) => {
        req.user = { id: "test-admin-id", role: "admin" };
        next();
    },
    authorize: (roles) => (req, res, next) => next()
}));

// Mock dependencies
jest.mock("../config/supabase", () => {
    const mock = {
        from: jest.fn(),
        select: jest.fn(),
        order: jest.fn(),
        limit: jest.fn(),
        in: jest.fn(),
        is: jest.fn(),
        or: jest.fn(),
        not: jest.fn(),
        single: jest.fn(),
        update: jest.fn(),
        eq: jest.fn(),
        insert: jest.fn(),
        then: jest.fn()
    };
    
    const setupChaining = (m) => {
        m.from.mockReturnValue(m);
        m.select.mockReturnValue(m);
        m.order.mockReturnValue(m);
        m.limit.mockReturnValue(m);
        m.then.mockImplementation((resolve) => {
            if (typeof resolve === 'function') {
                return Promise.resolve(resolve({ data: [], error: null }));
            }
            return Promise.resolve({ data: [], error: null });
        });
        return m;
    };
    
    return setupChaining(mock);
});

const routeRoutes = require("../routes/routeRoutes");
const notificationRoutes = require("../routes/notificationRoutes");
const mockSupabase = require("../config/supabase");

const app = express();
app.use(express.json());
app.use("/api/routes", routeRoutes);
app.use("/api/notifications", notificationRoutes);

describe("API Endpoint Connectivity Tests", () => {
    beforeEach(() => {
        // Setup default mock return for all tests to return data: [], error: null
        mockSupabase.limit.mockResolvedValue({ data: [], error: null });
        mockSupabase.select.mockResolvedValue({ data: [], error: null });
        
        // Ensure chaining works for notificationController
        mockSupabase.order.mockReturnValue(mockSupabase);
    });

    describe("GET /api/routes/all", () => {
        test("should return 200 OK with route data", async () => {
            const res = await request(app).get("/api/routes/all");
            
            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });

    describe("GET /api/notifications/all", () => {
        test("should return 200 OK with notification data", async () => {
            const res = await request(app).get("/api/notifications/all");
            
            expect(res.statusCode).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });
});
