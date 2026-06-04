require("dotenv").config()
const express = require("express")
const cors = require("cors")
const path = require("path")
const multer = require("multer")

// helpers for file upload and storage
const upload = require("./middleware/uploadMiddleware")
const { authenticate } = require("./middleware/authMiddleware")
const supabase = require("./config/supabase")

// Routes
const authRoutes = require("./routes/authRoutes")
const reportRoutes = require("./routes/reportRoutes")
const notificationRoutes = require("./routes/notificationRoutes")
const dashboardRoutes = require("./routes/dashboardRoutes")
const userRoutes = require("./routes/userRoutes")
const adminRoutes = require("./routes/adminRoutes")
const routeRoutes = require("./routes/routeRoutes")
const schedulingRoutes = require("./routes/schedulingRoutes")

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

// Debug Logger - logs EVERY request to help catch shadowing
app.use((req, res, next) => {
    console.log(`[DEBUG LOG] Received ${req.method} request for ${req.url}`);
    next();
});

/* -------------------------------------------------------------------------- */
/*                                API ROUTES                                  */
/* -------------------------------------------------------------------------- */
console.log("DEBUG: Registering API routes...");

app.use("/api/users", userRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/reports", reportRoutes)
app.use("/api/notifications", notificationRoutes)
app.use("/api/dashboard", dashboardRoutes)
app.use("/api/routes", routeRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/schedule", schedulingRoutes)

// Test endpoints
app.get("/api/ping", (req, res) => res.json({ message: "pong" }));
app.get("/api/test", (req, res) => res.json({ message: "API base is working" }));

// Image upload endpoint with enhanced error handling
app.post(
    "/api/upload",
    authenticate,
    (req, res, next) => {
        upload.array("files", 3)(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === "LIMIT_FILE_SIZE") {
                    return res.status(400).json({ error: "File too large (max 10MB per file)" })
                }
                return res.status(400).json({ error: err.message })
            } else if (err) {
                return res.status(400).json({ error: err.message })
            }

            if (!req.files || req.files.length === 0) {
                upload.single("file")(req, res, (errSingle) => {
                    if (errSingle instanceof multer.MulterError) {
                        if (errSingle.code === "LIMIT_FILE_SIZE") {
                            return res.status(400).json({ error: "File too large (max 10MB)" })
                        }
                        return res.status(400).json({ error: errSingle.message })
                    } else if (errSingle) {
                        return res.status(400).json({ error: errSingle.message })
                    }
                    next()
                })
                return
            }

            next()
        })
    },
    async (req, res) => {
        const files = req.files && req.files.length ? req.files : req.file ? [req.file] : []

        if (files.length === 0) {
            return res.status(400).json({ error: "No file provided" })
        }

        try {
            const urls = []

            for (const file of files) {
                const fileName = `${Date.now()}-${file.originalname}`
                const { error: uploadError } = await supabase.storage
                    .from("waste-images")
                    .upload(fileName, file.buffer, {
                        contentType: file.mimetype,
                        upsert: false,
                    })

                if (uploadError) {
                    console.error("Supabase storage error:", uploadError)
                    return res.status(400).json({ error: uploadError.message })
                }

                const { data: publicUrl } = supabase.storage.from("waste-images").getPublicUrl(fileName)
                urls.push(publicUrl.publicUrl)
            }

            return res.json({ urls, url: urls[0] })
        } catch (err) {
            console.error("Upload exception:", err)
            return res.status(500).json({ error: "Upload failed" })
        }
    }
)

/* -------------------------------------------------------------------------- */
/*                               STATIC ASSETS (React SPA)                    */
/* -------------------------------------------------------------------------- */

// Serve the built React app from Vite's dist output
const clientDistPath = path.join(__dirname, '..', 'Frontend', 'waste-project', 'dist')
app.use(express.static(clientDistPath))

// SPA fallback — all non-API GET requests return index.html so React Router handles routing
app.get(/^(?!\/api).+/, (req, res) => {
    const indexFile = path.join(clientDistPath, 'index.html')
    res.sendFile(indexFile, (err) => {
        if (err) {
            // React app has not been built yet — show a helpful dev message
            res.status(200).send(`
                <div style="font-family:sans-serif;padding:40px;">
                    <h2>Smart Waste System — API Running ✅</h2>
                    <p>The React frontend is not built yet.</p>
                    <p>To build: <code>cd Frontend/waste-project && npm install && npm run build</code></p>
                    <p>Or run the dev server separately: <code>npm run dev</code> (port 5173)</p>
                    <p>API health check: <a href="/api/ping">/api/ping</a></p>
                </div>
            `)
        }
    })
})

/* -------------------------------------------------------------------------- */
/*                               ERROR HANDLING                               */
/* -------------------------------------------------------------------------- */

// Catch-all for undefined routes
app.use((req, res) => {
    console.warn(`[SERVER 404] No route matched: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        error: "Not Found",
        message: `The path ${req.originalUrl} does not exist on this server.`,
        availableEndpoints: [
            "/api/users/profile",
            "/api/auth",
            "/api/reports",
            "/api/routes/all",
            "/api/notifications/all",
            "/api/test"
        ]
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
