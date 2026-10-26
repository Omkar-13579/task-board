
import Database from "better-sqlite3";

export const db = new Database("./database.sqlite");

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    status TEXT NOT NULL CHECK (
      status IN ('todo', 'progress', 'done')
    ),
    userId TEXT NOT NULL,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES user(id)
  );

  CREATE INDEX IF NOT EXISTS idx_tasks_userId
  ON tasks(userId);
`);
