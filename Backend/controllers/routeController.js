const supabase = require("../config/supabase");
const { optimizeRoute, getRouteGeometry } = require("../utils/routeService");

/**
 * Get optimized route (admin)
 */
exports.getOptimizedRoute = async (req, res) => {
    try {
        const reportIds = req.query.report_ids
            ? req.query.report_ids
                  .split(",")
                  .map((id) => id.trim())
                  .filter(Boolean)
            : [];

        let query = supabase
            .from("reports")
            .select("id, title, latitude, longitude, priority_score, status")
            .not("latitude", "is", null)
            .not("longitude", "is", null);

        if (reportIds.length > 0) {
            query = query.in("id", reportIds);
        } else {
            query = query.in("status", ["approved", "pending"]);
        }

        const { data: reports, error } = await query;

        if (error) {
            console.error("Error fetching reports for route:", error);
            return res.status(500).json({
                error: "Fetch failed",
                message: "Could not retrieve reports"
            });
        }

        const locations = (reports || []).map((report) => ({
            id: report.id,
            title: report.title,
            latitude: report.latitude,
            longitude: report.longitude,
            priority_score: report.priority_score ?? 0
        }));

        const { ordered, fallback } = await optimizeRoute(locations);
        
        // Fetch geometry for the optimized route
        const { geometry, fallback: geometryFallback } = await getRouteGeometry(ordered);

        return res.status(200).json({
            route: ordered,
            geometry,
            fallback,
            geometry_fallback: geometryFallback,
            total: locations.length
        });
    } catch (error) {
        console.error("getOptimizedRoute exception:", error);
        return res.status(500).json({
            error: "Server error",
            message: "An unexpected error occurred while optimizing route"
        });
    }
};

/**
 * Optimize route between specific points (POST)
 */
exports.optimizeCustomRoute = async (req, res) => {
    try {
        const { locations } = req.body;

        if (!locations || !Array.isArray(locations) || locations.length < 2) {
            return res.status(400).json({
                error: "Invalid input",
                message: "Please provide at least two locations"
            });
        }

        const { ordered, fallback } = await optimizeRoute(locations);
        
        // Fetch geometry for the optimized route
        const { geometry, fallback: geometryFallback } = await getRouteGeometry(ordered);

        return res.status(200).json({
            route: ordered,
            geometry,
            fallback,
            geometry_fallback: geometryFallback,
            total: locations.length
        });
    } catch (error) {
        console.error("optimizeCustomRoute exception:", error);
        return res.status(500).json({
            error: "Server error",
            message: "An unexpected error occurred while optimizing route"
        });
    }
};

/**
 * Get all routes (admin)
 */
exports.getAllRoutes = async (req, res) => {
    try {
        console.log("[DEBUG] Starting getAllRoutes...");
        // 1. Get all assignments
        const { data: assignments, error: assignmentError } = await supabase
            .from("assignments")
            .select("*");

        if (assignmentError) {
            console.error("[DEBUG] Error fetching assignments:", assignmentError);
            return res.status(500).json({ error: "Fetch failed", message: assignmentError.message });
        }

        console.log(`[DEBUG] Found ${assignments?.length || 0} assignments`);

        if (!assignments || assignments.length === 0) {
            return res.status(200).json([]);
        }

        // 2. Fetch all unique collector IDs and report IDs from assignments
        const collectorIds = [...new Set(assignments.map(a => a.collector_id))].filter(Boolean);
        const reportIds = [...new Set(assignments.map(a => a.report_id))].filter(Boolean);

        // 3. Fetch users and reports in parallel
        const [usersResponse, reportsResponse] = await Promise.all([
            supabase.from("users").select("id, name, email").in("id", collectorIds),
            supabase.from("reports").select("*").in("id", reportIds)
        ]);

        const usersMap = (usersResponse.data || []).reduce((acc, user) => {
            acc[user.id] = user;
            return acc;
        }, {});

        const reportsMap = (reportsResponse.data || []).reduce((acc, report) => {
            acc[report.id] = report;
            return acc;
        }, {});

        // 4. Group by collector
        const routesMap = {};
        assignments.forEach(item => {
            const cid = item.collector_id;
            const collector = usersMap[cid];
            const report = reportsMap[item.report_id];

            if (!cid) return;

            if (!routesMap[cid]) {
                routesMap[cid] = {
                    collector: collector || { id: cid, name: "Unknown Collector" },
                    reports: [],
                    stats: { total: 0, completed: 0 }
                };
            }
            if (report) {
                 const binCapacity = Math.floor(Math.random() * 100);
                 const enrichedReport = { 
                     ...report, 
                     bin_capacity: binCapacity,
                     is_critical: binCapacity >= 90
                 };
                 routesMap[cid].reports.push(enrichedReport);
                 routesMap[cid].stats.total++;
                 if (report.status === 'completed') {
                     routesMap[cid].stats.completed++;
                 }
             }
        });

        const routeValues = Object.values(routesMap);
        console.log(`[DEBUG] Grouped into ${routeValues.length} routes. Starting optimization...`);

        // 3. For each collector's route, calculate optimization
        const routes = await Promise.all(routeValues.map(async (route) => {
            try {
                const validReports = route.reports.filter(r => r.latitude && r.longitude && r.status !== 'completed');
                
                let optimization = { ordered: [], geometry: null, fallback: true };
                if (validReports.length >= 2) {
                    const locations = validReports.map(r => ({
                        id: r.id,
                        title: r.title,
                        latitude: r.latitude,
                        longitude: r.longitude,
                        priority_score: r.priority_score || 0
                    }));
                    
                    try {
                        const opt = await optimizeRoute(locations);
                        const geo = await getRouteGeometry(opt.ordered);
                        optimization = { ...opt, geometry: geo.geometry };
                    } catch (optError) {
                        console.error(`[DEBUG] Optimization failed for collector ${route.collector.id}:`, optError.message);
                        // Still return the route even if optimization fails
                    }
                } else if (validReports.length === 1) {
                    optimization = { ordered: validReports, geometry: null, fallback: false };
                }

                return {
                    ...route,
                    optimization
                };
            } catch (routeErr) {
                console.error(`[DEBUG] Error processing route for collector ${route.collector.id}:`, routeErr);
                return {
                    ...route,
                    optimization: { ordered: [], geometry: null, fallback: true }
                };
            }
        }));

        console.log("[DEBUG] getAllRoutes completed successfully");
        return res.status(200).json(routes);
    } catch (error) {
        console.error("[DEBUG] getAllRoutes FATAL error:", error);
        return res.status(500).json({ error: "Server error", message: error.message });
    }
};
