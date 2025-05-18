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
    origin: function(origin, callback) {
      // Allow requests with no origin (like mobile apps, curl requests)
      if(!origin) return callback(null, true);
      
      // List of allowed origins
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        'https://echoshop-silk.vercel.app' ,
        'https://echoshop-silk.vercel.app',
        'http://localhost:5173',
        'http://localhost:3000'
      ];
      
      if(allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('vercel.app')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
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
