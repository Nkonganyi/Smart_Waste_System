const supabase = require("../config/supabase");

/**
 * Calculate priority score for a single report
 * Exposed for unit testing
 */
exports.calculatePriorityScore = (report, duplicateCount, now = Date.now()) => {
    const priorityValue = String(report.priority || "").toLowerCase();
    let baseScore = 0;
    if (priorityValue === "high") baseScore = 30;
    else if (priorityValue === "normal") baseScore = 15;
    else if (priorityValue === "low") baseScore = 5;

    const createdAt = report.created_at ? new Date(report.created_at).getTime() : now;
    const ageInDays = Math.floor((now - createdAt) / (24 * 60 * 60 * 1000));
    const ageBonus = isNaN(ageInDays) ? 0 : Math.max(0, Math.min(30, ageInDays));

    const duplicateBonus = (duplicateCount || 0) * 5;

    return baseScore + ageBonus + duplicateBonus;
};

/**
 * Get prioritized reports (admin)
 */
exports.getPrioritizedReports = async (req, res) => {
    try {
        let { data: reports, error } = await supabase
            .from("reports")
            .select("*")
            .in("status", ["approved", "pending"])
            .is("parent_report_id", null);

        if (!error && (!reports || reports.length === 0)) {
            const fallback = await supabase
                .from("reports")
                .select("*")
                .or("status.ilike.approved,status.ilike.pending")
                .is("parent_report_id", null);
            if (!fallback.error) {
                reports = fallback.data || [];
            } else {
                error = fallback.error;
            }
        }

        if (error) {
            console.error("Error fetching reports:", error);
            return res.status(500).json({
                error: "Fetch failed",
                message: "Could not retrieve reports"
            });
        }

        if (!reports || reports.length === 0) {
            return res.status(200).json([]);
        }

        const reportIds = reports.map(report => report.id);
        const { data: duplicates, error: duplicateError } = await supabase
            .from("reports")
            .select("parent_report_id")
            .in("parent_report_id", reportIds);

        if (duplicateError) {
            console.error("Error fetching duplicate reports:", duplicateError);
            return res.status(500).json({
                error: "Fetch failed",
                message: "Could not retrieve duplicate reports"
            });
        }

        const duplicateCountByParent = {};
        for (const duplicate of duplicates || []) {
            const parentId = duplicate.parent_report_id;
            duplicateCountByParent[parentId] = (duplicateCountByParent[parentId] || 0) + 1;
        }

        const now = Date.now();
        const prioritizedReports = reports.map(report => {
            const duplicateCount = duplicateCountByParent[report.id] || 0;
            const score = exports.calculatePriorityScore(report, duplicateCount, now);

            return {
                ...report,
                duplicate_count: duplicateCount,
                priority_score: score
            };
        });

        prioritizedReports.sort((a, b) => b.priority_score - a.priority_score);

        return res.status(200).json(prioritizedReports);
    } catch (error) {
        console.error("getPrioritizedReports exception:", error);
        return res.status(500).json({
            error: "Server error",
            message: "An unexpected error occurred while prioritizing reports"
        });
    }
};
