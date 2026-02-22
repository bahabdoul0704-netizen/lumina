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
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/entries", (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    
    const entries = db.prepare("SELECT * FROM entries WHERE user_id = ? ORDER BY created_at DESC").all(userId);
    res.json(entries.map(e => ({ ...e, metadata: JSON.parse(e.metadata || "{}") })));
  });

  app.post("/api/entries", (req, res) => {
    const { userId, content, type, metadata } = req.body;
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const info = db.prepare(
      "INSERT INTO entries (user_id, content, type, metadata) VALUES (?, ?, ?, ?)"
    ).run(userId, content, type, JSON.stringify(metadata || {}));
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
