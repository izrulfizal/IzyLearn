
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";

import extractRoutes from "./routes/extract";
import generateRoutes from "./routes/generate";
import uploadRoutes from "./routes/upload";
import publishRoutes from "./routes/publish";
import { agents } from "./config/agents";
import { configureAgentEvents } from "./services/agentEvents";

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = Number(process.env.PORT || 8000);

const FRONTEND_URL =
  process.env.FRONTEND_URL || "http://localhost:3000";

// ========================================
// Express Middleware
// ========================================

app.use(
  cors({
    origin: FRONTEND_URL,
    allowedHeaders: [
      "Content-Type",
      "x-generation-mode",
      "x-custom-instructions"
    ]
  })
);

app.use(express.json());

// ========================================
// Socket.IO Configuration
// ========================================

const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"]
  }
});

// Connect Socket.IO to our agent event service
configureAgentEvents(io);

// ========================================
// Socket.IO Events
// ========================================

io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  // Send initial agent snapshot
  socket.emit("agents:snapshot", agents);

  // Join a specific generation room
  socket.on(
    "generation:join",
    (
      jobId: string,
      acknowledge?: (result: {
        success: boolean;
      }) => void
    ) => {
      console.log(
        "📡 Generation room requested:",
        jobId
      );

      // Validate job ID
      const validUUID =
        typeof jobId === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          jobId
        );

      if (!validUUID) {
        console.log("❌ Invalid generation job ID");

        acknowledge?.({
          success: false
        });

        return;
      }

      // Join the job-specific room
      socket.join(jobId);

      console.log(
        "✅ Client joined generation room:",
        jobId
      );

      // Acknowledge successful joining
      acknowledge?.({
        success: true
      });
    }
  );

  // Handle disconnect
  socket.on("disconnect", (reason) => {
    console.log(
      "🔌 Client disconnected:",
      socket.id,
      reason
    );
  });
});

// ========================================
// API Routes
// ========================================

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    app: "izyLearn",
    status: "online"
  });
});

app.get("/api/agents", (_req, res) => {
  res.json({
    success: true,
    agents
  });
});

app.use("/api/upload", uploadRoutes);
app.use("/api/extract", extractRoutes);
app.use("/api/generate", generateRoutes);
app.use("/api/publish", publishRoutes);
app.use("/p", publishRoutes);
// ========================================
// Error Handler
// ========================================

app.use(
  (
    error: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(
      "❌ Backend error:",
      error.message
    );

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
);

// ========================================
// Start Server
// ========================================

server.listen(PORT, () => {
  console.log("");
  console.log("🚀 izyLearn Backend Started!");
  console.log(`🌐 API: http://localhost:${PORT}`);
  console.log("🔌 Socket.IO: Ready");
  console.log("🧠 Multi-agent system: Ready");
  console.log("");
});
