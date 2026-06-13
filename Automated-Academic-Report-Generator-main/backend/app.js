import express from "express";
import cors from "cors";
import reportRoutes from "./routes/reports.routes.js";
import reportDownloadRoutes from "./routes/reportDownload.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

app.use("/api/reports", reportRoutes);
app.use("/api", reportDownloadRoutes);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
