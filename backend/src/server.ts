import helmet  from "helmet";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";


//load environment variables from .env file
dotenv.config();

const app = express();

//middleware
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//route
app.get("/", (req, res) => {
    res.status(200);
  res.send("Hello World!");
});
app.get("/health", (req, res) => {
  res.status(200).json({ status: "200" });
});
//start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});