import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("lumina.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    type TEXT NOT NULL, -- 'note', 'task', 'goal', 'insight'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT -- JSON string for Gemini-generated data
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/entries", (req, res) => {
    const entries = db.prepare("SELECT * FROM entries ORDER BY created_at DESC").all();
    res.json(entries.map(e => ({ ...e, metadata: JSON.parse(e.metadata || "{}") })));
  });

  app.post("/api/entries", (req, res) => {
    const { content, type, metadata } = req.body;
    const info = db.prepare(
      "INSERT INTO entries (content, type, metadata) VALUES (?, ?, ?)"
    ).run(content, type, JSON.stringify(metadata || {}));
    res.json({ id: info.lastInsertRowid });
  });

  app.delete("/api/entries/:id", (req, res) => {
    db.prepare("DELETE FROM entries WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Lumina Server running on http://localhost:${PORT}`);
  });
}

startServer();
