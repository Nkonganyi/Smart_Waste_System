/**
 * Waste Report Management Module — Tests
 * Covers: createReport validation, duplicate detection guards, status update
 * guards, completeReport (completion image now optional), createReport response
 * shape, and getMyReports citizen normalisation.
 */

const request = require("supertest");
const express = require("express");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-for-jest-min-32-characters";
process.env.OPENCAGE_API_KEY = "test-key";

// ── Supabase chainable mock ──────────────────────────────────────────────────
const mockChain = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn(),
    maybeSingle: jest.fn(),
};

const mockStorageUpload = { error: null };
const mockStorageGetPublicUrl = { data: { publicUrl: "https://example.com/img.jpg" } };
const mockStorage = {
    from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue(mockStorageUpload),
        getPublicUrl: jest.fn(() => mockStorageGetPublicUrl),
    })),
};

jest.mock("../config/supabase", () => {
    const chain = require.requireActual ? undefined : undefined; // silence warning
    const m = { from: jest.fn(() => mockChain), storage: mockStorage };
    return m;
});

// ── Geocoding mock (always returns null for simplicity) ──────────────────────
jest.mock("../utils/geocodingService", () => ({
    geocode: jest.fn().mockResolvedValue(null),
    getLocationSuggestions: jest.fn().mockResolvedValue([]),
}));

// ── Route service mock ───────────────────────────────────────────────────────
jest.mock("../utils/routeService", () => ({
    optimizeRoute: jest.fn().mockResolvedValue({ ordered: [], fallback: true }),
    getRouteGeometry: jest.fn().mockResolvedValue({ geometry: null, fallback: true }),
}));

// ── Auth middleware mock (injects user based on header) ─────────────────────
jest.mock("../middleware/authMiddleware", () => ({
    authenticate: (req, res, next) => {
        const header = req.headers["x-test-user"];
        req.user = header ? JSON.parse(header) : { id: "u1", role: "citizen", name: "Test" };
        next();
    },
    authorize: (roles) => (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: "Forbidden" });
        }
        next();
    },
}));

const supabase = require("../config/supabase");
const reportRoutes = require("../routes/reportRoutes");

const app = express();
app.use(express.json());
app.use("/api/reports", reportRoutes);

// Helper: build x-test-user header
const userHeader = (u) => JSON.stringify(u);

// ── Shared mock resets ───────────────────────────────────────────────────────
beforeEach(() => {
    jest.clearAllMocks();
    supabase.from.mockReturnValue(mockChain);
    mockChain.select.mockReturnThis();
    mockChain.insert.mockReturnThis();
    mockChain.update.mockReturnThis();
    mockChain.delete.mockReturnThis();
    mockChain.eq.mockReturnThis();
    mockChain.neq.mockReturnThis();
    mockChain.not.mockReturnThis();
    mockChain.is.mockReturnThis();
    mockChain.in.mockReturnThis();
    mockChain.or.mockReturnThis();
    mockChain.ilike.mockReturnThis();
    mockChain.limit.mockReturnThis();
    mockChain.order.mockReturnThis();
});

// ────────────────────────────────────────────────────────────────────────────
describe("POST /api/reports — createReport", () => {
    test("returns 400 when required fields are missing", async () => {
        const res = await request(app)
            .post("/api/reports")
            .set("x-test-user", userHeader({ id: "u1", role: "citizen" }))
            .send({ title: "Test" }); // missing description, location, priority

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/required/i);
    });

    test("returns 400 when location is too short", async () => {
        const res = await request(app)
            .post("/api/reports")
            .set("x-test-user", userHeader({ id: "u1", role: "citizen" }))
            .send({ title: "T", description: "D", location: "AB", priority: "normal" });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/location/i);
    });

    test("creates report without geocoding and returns report data", async () => {
        // Proximity check — no existing reports
        mockChain.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
        // text duplicate check — no match
        mockChain.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
        // Insert
        mockChain.single.mockResolvedValueOnce({
            data: {
                id: "r123",
                title: "Test report",
                location: "Market Square",
                status: "pending",
                priority: "normal",
                created_at: new Date().toISOString(),
                parent_report_id: null,
            },
            error: null,
        });
        // Admin notification query
        mockChain.eq.mockReturnThis();
        mockChain.select.mockReturnThis();
        // getAllAdmins
        supabase.from.mockImplementation((table) => {
            if (table === "users") return { ...mockChain, select: jest.fn().mockReturnThis(), eq: jest.fn().mockResolvedValue({ data: [], error: null }) };
            return mockChain;
        });

        const res = await request(app)
            .post("/api/reports")
            .set("x-test-user", userHeader({ id: "u1", role: "citizen" }))
            .send({
                title: "Test report",
                description: "Lots of garbage",
                location: "Market Square",
                priority: "normal",
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.message).toMatch(/success/i);
        expect(res.body.report).toBeDefined();
        expect(res.body.report.id).toBe("r123");
        expect(res.body.report.is_duplicate).toBe(false);
    });

    test("detects duplicate and sets parent_report_id in response", async () => {
        // With coords=null (geocode returns null), proximity block is skipped.
        // Only the text-search maybeSingle runs, then the insert single runs.

        let maybeSingleCallCount = 0;
        let singleCallCount = 0;

        // Route all from() calls to a fresh chain that tracks calls in order
        supabase.from.mockImplementation((table) => {
            const chain = {
                select: jest.fn().mockReturnThis(),
                insert: jest.fn().mockReturnThis(),
                update: jest.fn().mockReturnThis(),
                neq: jest.fn().mockReturnThis(),
                not: jest.fn().mockReturnThis(),
                is: jest.fn().mockReturnThis(),
                ilike: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                order: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                in: jest.fn().mockReturnThis(),
                or: jest.fn().mockResolvedValue({ error: null }),
                maybeSingle: jest.fn().mockImplementation(() => {
                    maybeSingleCallCount++;
                    // Text-search duplicate check → return a match
                    return Promise.resolve({ data: { id: "parent-99" }, error: null });
                }),
                single: jest.fn().mockImplementation(() => {
                    singleCallCount++;
                    // Insert single → return new report with parent set
                    return Promise.resolve({
                        data: {
                            id: "r124",
                            title: "Duplicate",
                            location: "Market Square",
                            status: "pending",
                            priority: "low",
                            created_at: new Date().toISOString(),
                            parent_report_id: "parent-99",
                        },
                        error: null,
                    });
                }),
            };
            // Admin notification — users table returns empty array
            if (table === "users") {
                chain.eq = jest.fn().mockResolvedValue({ data: [], error: null });
            }
            return chain;
        });

        const res = await request(app)
            .post("/api/reports")
            .set("x-test-user", userHeader({ id: "u1", role: "citizen" }))
            .send({
                title: "Duplicate report",
                description: "Same location as before",
                location: "Market Square",
                priority: "low",
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.report).toBeDefined();
        expect(res.body.report.is_duplicate).toBe(true);
        expect(res.body.report.parent_report_id).toBe("parent-99");
    });
});

// ────────────────────────────────────────────────────────────────────────────
describe("PUT /api/reports/status — updateReportStatus", () => {
    const adminUser = { id: "admin1", role: "admin" };
    const collectorUser = { id: "col1", role: "collector" };

    test("rejects invalid status value", async () => {
        const res = await request(app)
            .put("/api/reports/status")
            .set("x-test-user", userHeader(adminUser))
            .send({ report_id: "r1", status: "hacked_status" });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/invalid status/i);
    });

    test("returns 400 when report_id is missing", async () => {
        const res = await request(app)
            .put("/api/reports/status")
            .set("x-test-user", userHeader(adminUser))
            .send({ status: "completed" });

        expect(res.statusCode).toBe(400);
    });

    test("forbids collector from updating a report they're not assigned to", async () => {
        // Assignment lookup returns nothing
        mockChain.single.mockResolvedValueOnce({ data: null, error: { message: "No assignment" } });

        const res = await request(app)
            .put("/api/reports/status")
            .set("x-test-user", userHeader(collectorUser))
            .send({ report_id: "r1", status: "completed" });

        expect(res.statusCode).toBe(403);
        expect(res.body.error).toMatch(/not assigned/i);
    });
});

// ────────────────────────────────────────────────────────────────────────────
describe("PUT /api/reports/complete — completeReport", () => {
    const collectorUser = { id: "col1", role: "collector" };

    test("returns 400 when report_id is missing", async () => {
        const res = await request(app)
            .put("/api/reports/complete")
            .set("x-test-user", userHeader(collectorUser))
            .send({});

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/required/i);
    });

    test("completes a report successfully without a completion image", async () => {
        // assignment check
        mockChain.single.mockResolvedValueOnce({ data: { id: "a1" }, error: null });
        // cascadeReportStatus: fetch report parent
        mockChain.single.mockResolvedValueOnce({ data: { id: "r1", parent_report_id: null }, error: null });
        // update returns null (no error)
        mockChain.or = jest.fn().mockResolvedValue({ error: null });
        // notification: fetch report user_id
        mockChain.single.mockResolvedValueOnce({ data: { user_id: "u1", title: "Test" }, error: null });
        // notification insert
        mockChain.insert = jest.fn().mockResolvedValue({ error: null });
        supabase.from.mockReturnValue(mockChain);

        const res = await request(app)
            .put("/api/reports/complete")
            .set("x-test-user", userHeader(collectorUser))
            .send({ report_id: "r1" }); // no completion_image_url

        // Should not be 400 — completion image is now optional
        expect(res.statusCode).not.toBe(400);
    });
});

// ────────────────────────────────────────────────────────────────────────────
describe("GET /api/reports/my — getMyReports (citizen)", () => {
    test("normalises 'approved' status to 'pending' for citizens", async () => {
        mockChain.order.mockResolvedValueOnce({
            data: [
                { id: "r1", status: "approved", user_id: "u1" },
                { id: "r2", status: "in_progress", user_id: "u1" },
            ],
            error: null,
        });

        const res = await request(app)
            .get("/api/reports/my")
            .set("x-test-user", userHeader({ id: "u1", role: "citizen" }));

        expect(res.statusCode).toBe(200);
        const statuses = res.body.map((r) => r.status);
        expect(statuses).not.toContain("approved");
        expect(statuses).toContain("pending"); // was approved
        expect(statuses).toContain("in_progress");
    });
});

// ────────────────────────────────────────────────────────────────────────────
describe("GET /api/reports/location-suggestions", () => {
    test("returns empty array for short queries", async () => {
        const res = await request(app)
            .get("/api/reports/location-suggestions?q=a")
            .set("x-test-user", userHeader({ id: "u1", role: "citizen" }));

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toHaveLength(0);
    });
});
