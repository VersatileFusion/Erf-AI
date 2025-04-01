import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Import routes
import apiRoutes from "./routes/index.js";
import authRoutes from "./routes/authRoutes.js";
import { testConnection } from "./db/connection.js";
import { initializeDatabase } from "./db/init.js";

// Load models to ensure they're registered with Mongoose
import "./models/userModel.js";
import "./models/aiModel.js";
import "./models/datasetModel.js";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Setup logging
app.use(morgan("dev"));

// Standard middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(compression());

// Get directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create required directories
const MODELS_DIR = path.join(__dirname, "../models");
const DATASETS_DIR = path.join(__dirname, "../datasets");
const UPLOADS_DIR = path.join(__dirname, "../uploads");

// Ensure required directories exist
[MODELS_DIR, DATASETS_DIR, UPLOADS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, "../public")));

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Erf AI API",
      version: "1.0.0",
      description: "API documentation for Erf AI application",
      contact: {
        name: "Erfan Ahmadvand",
        phone: "+989109924707",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: ["./src/routes/*.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Root route
app.get("/", (req, res) => {
  console.log("Root route accessed");
  res.send("Welcome to Erf AI API");
});

// Use API routes
app.use("/api", apiRoutes);
app.use("/api/auth", authRoutes);

// Start the server
const startServer = async () => {
  console.log("Starting server...");

  try {
    // Initialize database and test connection
    const dbInitialized = await initializeDatabase();
    
    if (dbInitialized) {
      // Start the server
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
      });
    } else {
      console.error("Could not initialize MongoDB database. Please check your configuration.");
      process.exit(1);
    }
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});

// Handle application termination
process.on("SIGINT", async () => {
  console.log("Shutting down server...");
  process.exit(0);
});

export default app;
