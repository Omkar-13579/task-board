
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth";

const app = express();
const PORT = 3000;

// Better Auth handles signup, login, logout, and sessions.
app.all("/api/auth/*splat", toNodeHandler(auth));

// Keep this after the Better Auth handler.
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("Better Auth backend is running!");
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
