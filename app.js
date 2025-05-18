const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const path = require("path");
const errorMiddleware = require("./middleware/error");
const dotenv = require("dotenv");

dotenv.config();

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["set-cookie"],
  })
);

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

// Routes
app.use("/api/v1", require("./routes/userRoute"));
app.use("/api/v1", require("./routes/productRoute"));
app.use("/api/v1", require("./routes/orderRoute"));
app.use("/api/v1", require("./routes/paymentRoute"));

module.exports = app;
