import swaggerJsdoc from "swagger-jsdoc";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Upcoding API Docs",
      version: "1.0.0",
      description: "API documentation for our Upcoding platform",
    },
    servers: [
      { url: "http://localhost:8000/api/v1" },
      { url: "https://upcoding.codexuslabs.com/api/v1" },
    ],
    components: {
      securitySchemes: {
        accessTokenAuth: {
          type: "apiKey",
          in: "cookie",
          name: "accessToken",
        },
        refreshTokenAuth: {
          type: "apiKey",
          in: "cookie",
          name: "refreshToken",
        },
      },
    },
  },
  apis: [
    path.join(__dirname, "../routes/*.js"),
    path.join(__dirname, "../controllers/*.js"),
  ],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
