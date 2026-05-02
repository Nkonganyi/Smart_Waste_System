// Mock supabase before requiring the controller
jest.mock("../config/supabase", () => ({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis()
}));

const { calculatePriorityScore } = require("../controllers/schedulingController");

describe("Scheduling Controller - Priority Score Calculation", () => {
    const now = new Date("2026-04-07T12:00:00Z").getTime();
    const oneDayInMs = 24 * 60 * 60 * 1000;

    test("should calculate base score for high priority", () => {
        const report = { priority: "high", created_at: new Date(now).toISOString() };
        const score = calculatePriorityScore(report, 0, now);
        expect(score).toBe(30); // 30 (high) + 0 (age) + 0 (duplicates)
    });

    test("should calculate base score for normal priority", () => {
        const report = { priority: "normal", created_at: new Date(now).toISOString() };
        const score = calculatePriorityScore(report, 0, now);
        expect(score).toBe(15); // 15 (normal) + 0 (age) + 0 (duplicates)
    });

    test("should add age bonus (1 point per day, max 30)", () => {
        const fiveDaysAgo = new Date(now - (5 * oneDayInMs)).toISOString();
        const report = { priority: "low", created_at: fiveDaysAgo };
        const score = calculatePriorityScore(report, 0, now);
        expect(score).toBe(10); // 5 (low) + 5 (age) + 0 (duplicates)
    });

    test("should cap age bonus at 30 days", () => {
        const fortyDaysAgo = new Date(now - (40 * oneDayInMs)).toISOString();
        const report = { priority: "low", created_at: fortyDaysAgo };
        const score = calculatePriorityScore(report, 0, now);
        expect(score).toBe(35); // 5 (low) + 30 (cap) + 0 (duplicates)
    });

    test("should add duplicate bonus (5 points per duplicate)", () => {
        const report = { priority: "low", created_at: new Date(now).toISOString() };
        const score = calculatePriorityScore(report, 3, now);
        expect(score).toBe(20); // 5 (low) + 0 (age) + 15 (3 * 5)
    });

    test("should handle missing priority and created_at gracefully", () => {
        const report = {};
        const score = calculatePriorityScore(report, 0, now);
        expect(score).toBe(0); // 0 (none) + 0 (age) + 0 (duplicates)
    });
});
