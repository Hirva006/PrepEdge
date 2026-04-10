// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const net = require("net");
const path = require("path");
const connectDB = require("./config/db");

const app = express();
const BASE_PORT = Number(process.env.PORT) || 5000;

const allowedOrigins = [
  process.env.CLIENT_ORIGIN,
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "http://localhost:3000",
].filter(Boolean);

const isLocalDevOrigin = (origin) =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);

// Connect to MongoDB first
connectDB();

// ── MIDDLEWARE ────────────────────────────────
app.use(
  cors({
    origin(origin, callback) {
      // Allow requests without an Origin header (curl, Postman, server-to-server)
      if (!origin) return callback(null, true);

      // Browsers send origin as "null" when frontend is opened via file://
      if (
        origin === "null" &&
        (process.env.NODE_ENV || "development") !== "production"
      ) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // In development, allow localhost/127.0.0.1 regardless of port.
      if (
        (process.env.NODE_ENV || "development") !== "production" &&
        isLocalDevOrigin(origin)
      ) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Avoid browser noise for missing favicon when no icon file is configured.
app.get("/favicon.ico", (req, res) => res.status(204).end());

// Serve frontend from the parent Project folder so app and API share one origin.
const frontendDir = path.resolve(__dirname, "..");
const frontendIndex = path.join(frontendDir, "index.html");
if (fs.existsSync(frontendIndex)) {
  app.use(express.static(frontendDir));

  app.get(["/", "/index.html"], (req, res) => {
    res.sendFile(frontendIndex);
  });
}

// ── ROUTES ────────────────────────────────────
app.use("/api/auth", require("./routes/auth"));
app.use("/api/questions", require("./routes/questions"));
app.use("/api/sessions", require("./routes/sessions"));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.use("/api/*", (req, res) => {
  res.status(404).json({ error: "Route not found." });
});

app.use((err, req, res, next) => {
  // Body parser throws SyntaxError when JSON is malformed.
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ error: "Invalid JSON body." });
  }

  console.error("Unhandled error:", err.stack);
  res.status(500).json({ error: "An unexpected server error occurred." });
});

// ── START ─────────────────────────────────────
function findAvailablePort(startPort, maxAttempts = 20) {
  return new Promise((resolve, reject) => {
    const tryPort = (port, attempt) => {
      const probe = net.createServer();
      probe.unref();

      probe.on("error", (err) => {
        if (err.code === "EADDRINUSE" && attempt < maxAttempts) {
          return tryPort(port + 1, attempt + 1);
        }
        reject(err);
      });

      probe.listen(port, () => {
        const { port: freePort } = probe.address();
        probe.close(() => resolve(freePort));
      });
    };

    tryPort(startPort, 0);
  });
}

async function startServer() {
  try {
    const port = await findAvailablePort(BASE_PORT);

    app.listen(port, () => {
      console.log(`\n🚀 PrepEdge API running on http://localhost:${port}`);
      console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`   Health check: http://localhost:${port}/api/health`);
      if (port !== BASE_PORT) {
        console.log(
          `   Note: Port ${BASE_PORT} was in use, using ${port} instead.`,
        );
      }
      console.log("");
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
}

startServer();
