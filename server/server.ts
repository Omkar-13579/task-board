
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth";
import { db } from "./db";
import { randomUUID } from "node:crypto";

const app = express();
const PORT = 3000;

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(express.json());

type TaskStatus = "todo" | "progress" | "done";

function getUserId(req: express.Request, res: express.Response) {
  // Better Auth reads the session cookie and identifies the user.
  return auth.api.getSession({
    headers: new Headers({
      cookie: req.headers.cookie ?? "",
    }),
  });
}

app.get("/api/tasks", async (req, res) => {
  const session = await getUserId(req, res);

  if (!session) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const tasks = db.prepare(
    "SELECT id, title, status FROM tasks WHERE userId = ? ORDER BY createdAt ASC"
  ).all(session.user.id);

  res.json(tasks);
});

app.post("/api/tasks", async (req, res) => {
  const session = await getUserId(req, res);

  if (!session) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { title, status } = req.body as {
    title?: string;
    status?: TaskStatus;
  };

  const cleanTitle = title?.trim();

  if (!cleanTitle) {
    return res.status(400).json({ error: "Task title is required" });
  }

  const validStatuses: TaskStatus[] = ["todo", "progress", "done"];

  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid task status" });
  }

  const task = {
    id: randomUUID(),
    title: cleanTitle,
    status: status ?? "todo",
  };

  db.prepare(
    "INSERT INTO tasks (id, title, status, userId) VALUES (?, ?, ?, ?)"
  ).run(task.id, task.title, task.status, session.user.id);

  res.status(201).json(task);
});

app.patch("/api/tasks/:id", async (req, res) => {
  const session = await getUserId(req, res);

  if (!session) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { title, status } = req.body as {
    title?: string;
    status?: TaskStatus;
  };

  const validStatuses: TaskStatus[] = ["todo", "progress", "done"];

  if (title !== undefined && (typeof title !== "string" || !title.trim())) {
    return res.status(400).json({ error: "Task title cannot be empty" });
  }

  if (status !== undefined && !validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid task status" });
  }

  const result = db.prepare(`
    UPDATE tasks
    SET title = COALESCE(?, title),
        status = COALESCE(?, status)
    WHERE id = ? AND userId = ?
  `).run(
    title === undefined ? null : title.trim(),
    status ?? null,
    req.params.id,
    session.user.id
  );

  if (result.changes === 0) {
    return res.status(404).json({ error: "Task not found" });
  }

  res.json({ success: true });
});

app.delete("/api/tasks/:id", async (req, res) => {
  const session = await getUserId(req, res);

  if (!session) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const result = db.prepare(
    "DELETE FROM tasks WHERE id = ? AND userId = ?"
  ).run(req.params.id, session.user.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: "Task not found" });
  }

  res.status(204).end();
});

app.get("/", (_req, res) => {
  res.send("Better Auth backend is running!");
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
