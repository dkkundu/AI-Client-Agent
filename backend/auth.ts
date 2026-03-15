import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET || 'llm-client-dev-secret';
const DB_PATH = path.resolve(process.cwd(), 'users.sqlite');

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

interface UserRow extends User {
  password_hash: string;
}

class AuthManager {
  private db: Database.Database;

  constructor() {
    this.db = new Database(DB_PATH);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
  }

  async register(name: string, email: string, password: string): Promise<{ user: User; token: string } | { error: string }> {
    const existing = this.db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existing) return { error: 'Email already registered.' };

    const hash = await bcrypt.hash(password, 10);
    const result = this.db.prepare(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)'
    ).run(name.trim(), email.toLowerCase(), hash);

    const user = this.db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get(result.lastInsertRowid) as User;
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
    return { user, token };
  }

  async login(email: string, password: string): Promise<{ user: User; token: string } | { error: string }> {
    const row = this.db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) as UserRow | undefined;
    if (!row) return { error: 'Invalid email or password.' };

    const match = await bcrypt.compare(password, row.password_hash);
    if (!match) return { error: 'Invalid email or password.' };

    const user: User = { id: row.id, name: row.name, email: row.email, created_at: row.created_at };
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
    return { user, token };
  }

  verifyToken(token: string): User | null {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { id: number; email: string };
      const user = this.db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get(payload.id) as User | undefined;
      return user ?? null;
    } catch {
      return null;
    }
  }
}

export const authManager = new AuthManager();
