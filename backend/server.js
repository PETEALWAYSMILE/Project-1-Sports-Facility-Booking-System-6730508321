/**
 * @swagger
 * {
 *   "/": {
 *     "get": {
 *       "tags": [
 *         "Utilities"
 *       ],
 *       "summary": "API welcome message",
 *       "description": "Returns links to documentation and application health.",
 *       "security": [],
 *       "responses": {
 *         "200": {
 *           "description": "Successful operation.",
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "type": "object",
 *                 "properties": {
 *                   "success": {
 *                     "type": "boolean"
 *                   },
 *                   "message": {
 *                     "type": "string"
 *                   },
 *                   "documentation": {
 *                     "type": "string",
 *                     "example": "/api-docs"
 *                   },
 *                   "health": {
 *                     "type": "string",
 *                     "example": "/health"
 *                   }
 *                 }
 *               }
 *             }
 *           }
 *         },
 *         "429": {
 *           "$ref": "#/components/responses/Error429"
 *         },
 *         "500": {
 *           "$ref": "#/components/responses/Error500"
 *         }
 *       }
 *     }
 *   },
 *   "/health": {
 *     "get": {
 *       "tags": [
 *         "Utilities"
 *       ],
 *       "summary": "Application health",
 *       "description": "Returns application status, timestamp, and environment. Does not verify database connectivity.",
 *       "security": [],
 *       "responses": {
 *         "200": {
 *           "description": "Successful operation.",
 *           "content": {
 *             "application/json": {
 *               "schema": {
 *                 "type": "object",
 *                 "properties": {
 *                   "success": {
 *                     "type": "boolean"
 *                   },
 *                   "message": {
 *                     "type": "string"
 *                   },
 *                   "timestamp": {
 *                     "type": "string",
 *                     "format": "date-time"
 *                   },
 *                   "environment": {
 *                     "type": "string",
 *                     "example": "development"
 *                   }
 *                 }
 *               }
 *             }
 *           }
 *         },
 *         "429": {
 *           "$ref": "#/components/responses/Error429"
 *         },
 *         "500": {
 *           "$ref": "#/components/responses/Error500"
 *         }
 *       }
 *     }
 *   },
 *   "/api-docs": {
 *     "get": {
 *       "tags": [
 *         "Utilities"
 *       ],
 *       "summary": "Swagger UI",
 *       "description": "Interactive API documentation. Open this URL in a browser.",
 *       "security": [],
 *       "responses": {
 *         "200": {
 *           "description": "Swagger UI HTML page.",
 *           "content": {
 *             "text/html": {
 *               "schema": {
 *                 "type": "string"
 *               }
 *             }
 *           }
 *         },
 *         "301": {
 *           "description": "Redirect to the trailing-slash documentation URL."
 *         },
 *         "429": {
 *           "$ref": "#/components/responses/Error429"
 *         }
 *       }
 *     }
 *   }
 * }
 */
const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUI = require("swagger-ui-express");
const cors = require("cors");
const connectDB = require("./config/db");
const { seedDatabase } = require("./seed");
const auth = require("./routes/auth");
const facilities = require("./routes/facilities");
const bookings = require("./routes/bookings");

dotenv.config({ path: path.join(__dirname, "config/config.env") });

if (process.env.MONGO_URI) {
  connectDB()
    .then(() => seedDatabase({ force: false }))
    .catch((error) => {
      console.error(`Database connection failed: ${error.message}`);
      process.exit(1);
    });
}

const app = express();

app.use(helmet());
app.use(hpp());
app.use(rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: process.env.NODE_ENV === "production" ? 100 : 1000,
  message: {
    success: false,
    error: "Too many requests from this IP, please try again later.",
  },
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(cors({
  origin: process.env.NODE_ENV === "production"
    ? process.env.FRONTEND_URL
    : "http://localhost:3000",
  credentials: true,
}));

app.use("/api/v1/auth", auth);
app.use("/api/v1/facilities", facilities);
app.use("/api/v1/bookings", bookings);

const swaggerDocs = swaggerJsDoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Sports Facility Booking API",
      version: "1.0.0",
      description: "REST API for sports facility management and bookings.",
    },
    servers: [{
      url: `http://localhost:${process.env.PORT || 5000}`,
    }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: [path.join(__dirname, "routes/*.js"), path.join(__dirname, "server.js")],
});

app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDocs));

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Sports Facility Booking API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the Sports Facility Booking API",
    documentation: "/api-docs",
    health: "/health",
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`,
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `Duplicate value entered for ${field}. Please use another value.`;
  } else if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
  } else if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Sports Facility Booking API running on http://localhost:${PORT}`);
});

process.on("unhandledRejection", (error) => {
  console.error(`Unhandled rejection: ${error.message}`);
  server.close(() => process.exit(1));
});

process.on("uncaughtException", (error) => {
  console.error(`Uncaught exception: ${error.message}`);
  process.exit(1);
});

module.exports = { app, server };
