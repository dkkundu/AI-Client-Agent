import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { dbManager, DbConfig } from './db';
import { authManager } from './auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Ollama / Custom LLM proxy endpoint
app.post('/api/chat', async (req, res) => {
  const { messages, model, baseUrl, stream } = req.body;
  const targetUrl = baseUrl ? `${baseUrl.replace(/\/+$/, '')}/api/chat` : 'http://127.0.0.1:11434/api/chat';
  
  // Note: if using OpenAI compatible endpoint the path might be /v1/chat/completions
  // A robust implementation would check if it's OpenAI vs Ollama based on URL or parameter.
  // Assuming Ollama format for now as per previous design, but allowing custom URL.
  const attemptUrl = targetUrl.includes('/v1') 
    ? `${baseUrl.replace(/\/+$/, '')}/chat/completions` 
    : targetUrl;

  try {
    const response = await axios.post(attemptUrl, { model, messages, stream }, {
      responseType: 'stream'
    });
    response.data.pipe(res);
  } catch (error: any) {
    console.error('LLM connection error:', error.message);
    res.status(500).json({ error: `Failed to connect to LLM instance at ${attemptUrl}.` });
  }
});

app.get('/api/models', async (req, res) => {
  const targetUrl = req.query.url as string || 'http://127.0.0.1:11434';
  
  try {
    // If the user provided an OpenAI compatible endpoint like /v1/models directly
    if (targetUrl.endsWith('/models')) {
      const response = await axios.get(targetUrl);
      const models = response.data.data ? response.data.data.map((m: any) => m.id) : [];
      return res.json({ models });
    }

    // Default: try to fetch from Ollama tags endpoint
    const ollamaUrl = `${targetUrl.replace(/\/+$/, '')}/api/tags`;
    const response = await axios.get(ollamaUrl);
    const models = response.data.models ? response.data.models.map((m: any) => m.name) : [];
    res.json({ models });
  } catch (error: any) {
    console.error('Failed to fetch models:', error.message);
    // Try fallback to OpenAI compatible /v1/models if Ollama fails and it's not already a /models path
    if (!targetUrl.endsWith('/models')) {
      try {
        const fallbackUrl = `${targetUrl.replace(/\/+$/, '')}/v1/models`;
        const response = await axios.get(fallbackUrl);
        const models = response.data.data ? response.data.data.map((m: any) => m.id) : [];
        return res.json({ models });
      } catch (e: any) {
        return res.status(500).json({ error: 'Failed to fetch models from both Ollama and OpenAI API formats.' });
      }
    }
    res.status(500).json({ error: 'Failed to fetch models.' });
  }
});

// File system endpoints
app.get('/api/files/list', async (req, res) => {
  const dirPath = req.query.path as string || process.cwd();
  try {
    const files = await fs.promises.readdir(dirPath, { withFileTypes: true });
    const result = files.map(file => ({
      name: file.name,
      isDirectory: file.isDirectory(),
      path: path.join(dirPath, file.name)
    })).sort((a, b) => {
      if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name);
      return a.isDirectory ? -1 : 1;
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/files/create-file', async (req, res) => {
  const { dir, name } = req.body;
  if (!dir || !name) return res.status(400).json({ error: 'dir and name required' });
  const filePath = path.join(dir, name);
  try {
    await fs.promises.writeFile(filePath, '', { flag: 'wx' });
    res.json({ success: true, path: filePath });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/files/create-dir', async (req, res) => {
  const { dir, name } = req.body;
  if (!dir || !name) return res.status(400).json({ error: 'dir and name required' });
  const dirPath = path.join(dir, name);
  try {
    await fs.promises.mkdir(dirPath);
    res.json({ success: true, path: dirPath });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/files/read', async (req, res) => {
  const filePath = req.query.path as string;
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    res.send(content);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/files/write', async (req, res) => {
  const { path: filePath, content } = req.body;
  try {
    await fs.promises.writeFile(filePath, content, 'utf-8');
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Agent endpoint — calls LLM with file-tool system prompt, executes actions
app.post('/api/agent', async (req, res) => {
  const { messages, model, baseUrl, workspacePath } = req.body;
  const targetUrl = (baseUrl || 'http://127.0.0.1:11434').replace(/\/+$/, '') + '/api/chat';
  const workDir = workspacePath || process.cwd();

  const systemPrompt = `You are an expert coding assistant with direct filesystem access.
Workspace directory: ${workDir}

ALWAYS respond with a valid JSON object in this exact format — no extra text outside the JSON:
{
  "message": "Explanation to the user",
  "actions": [
    { "type": "create_dir", "path": "relative/path" },
    { "type": "write_file", "path": "relative/path/file.ext", "content": "full file content" },
    { "type": "read_file", "path": "relative/path/file.ext" }
  ]
}

Rules:
- All paths are relative to: ${workDir}
- "create_dir" creates a directory (recursive)
- "write_file" creates or overwrites a file with full content (never truncated)
- "read_file" reads a file when you need to inspect existing code before editing
- If the user asks a question without file work, return actions: []
- Always generate complete, working code — not placeholders or snippets
- For a new project, create all necessary files (main file, requirements/package.json, README, etc.)`;

  try {
    const response = await axios.post(targetUrl, {
      model,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      stream: false,
      format: 'json',
    });

    const raw: string = response.data.message?.content || '{}';

    let parsed: { message: string; actions?: any[] };
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch {
      parsed = { message: raw, actions: [] };
    }

    const results: any[] = [];
    for (const action of parsed.actions || []) {
      try {
        const absPath = path.isAbsolute(action.path)
          ? action.path
          : path.join(workDir, action.path);

        if (action.type === 'create_dir') {
          await fs.promises.mkdir(absPath, { recursive: true });
          results.push({ ...action, status: 'ok' });
        } else if (action.type === 'write_file') {
          await fs.promises.mkdir(path.dirname(absPath), { recursive: true });
          await fs.promises.writeFile(absPath, action.content || '', 'utf-8');
          results.push({ type: action.type, path: action.path, status: 'ok' });
        } else if (action.type === 'read_file') {
          const content = await fs.promises.readFile(absPath, 'utf-8');
          results.push({ ...action, status: 'ok', content });
        }
      } catch (e: any) {
        results.push({ ...action, status: 'error', error: e.message });
      }
    }

    res.json({ message: parsed.message || '', actions: results });
  } catch (error: any) {
    res.status(500).json({ error: `Agent error: ${error.message}` });
  }
});

app.post('/api/agent/stream', async (req, res) => {
  const { messages, model, baseUrl, workspacePath } = req.body;
  const targetUrl = (baseUrl || 'http://127.0.0.1:11434').replace(/\/+$/, '') + '/api/chat';
  const workDir = workspacePath || process.cwd();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  const systemPrompt = `You are an expert coding assistant with direct filesystem access.
Workspace directory: ${workDir}

ALWAYS respond with a valid JSON object in this exact format — no extra text outside the JSON:
{
  "message": "Explanation to the user",
  "actions": [
    { "type": "create_dir", "path": "relative/path" },
    { "type": "write_file", "path": "relative/path/file.ext", "content": "full file content" },
    { "type": "read_file", "path": "relative/path/file.ext" }
  ]
}

Rules:
- All paths are relative to: ${workDir}
- "create_dir" creates a directory (use recursive mkdir)
- "write_file" creates or overwrites a file with COMPLETE content (never truncated)
- "read_file" reads a file when you need to inspect existing code before editing
- If the user asks a question without file work, return actions: []
- Always generate complete, working code — not placeholders or snippets
- For a new project, create ALL necessary files (main file, requirements/package.json, README, etc.)`;

  try {
    send({ type: 'thinking', label: 'Connecting to LLM…' });

    const response = await axios.post(targetUrl, {
      model,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      stream: false,
      format: 'json',
    });

    send({ type: 'thinking', label: 'Parsing plan…' });

    const raw: string = response.data.message?.content || '{}';
    let parsed: { message: string; actions?: any[] };
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch {
      parsed = { message: raw, actions: [] };
    }

    const actions: any[] = parsed.actions || [];
    send({ type: 'plan', total: actions.length });

    const results: any[] = [];
    for (const action of actions) {
      const id = `${action.type}::${action.path}`;
      send({ type: 'action_start', id, actionType: action.type, path: action.path });
      try {
        const absPath = path.isAbsolute(action.path) ? action.path : path.join(workDir, action.path);
        if (action.type === 'create_dir') {
          await fs.promises.mkdir(absPath, { recursive: true });
          send({ type: 'action_done', id, status: 'ok' });
          results.push({ type: action.type, path: action.path, status: 'ok' });
        } else if (action.type === 'write_file') {
          await fs.promises.mkdir(path.dirname(absPath), { recursive: true });
          await fs.promises.writeFile(absPath, action.content || '', 'utf-8');
          send({ type: 'action_done', id, status: 'ok' });
          results.push({ type: action.type, path: action.path, status: 'ok' });
        } else if (action.type === 'read_file') {
          const content = await fs.promises.readFile(absPath, 'utf-8');
          send({ type: 'action_done', id, status: 'ok', content });
          results.push({ type: action.type, path: action.path, status: 'ok' });
        }
      } catch (e: any) {
        send({ type: 'action_done', id, status: 'error', error: e.message });
        results.push({ type: action.type, path: action.path, status: 'error', error: e.message });
      }
    }

    send({ type: 'message', content: parsed.message || '' });
    send({ type: 'done', actions: results });
    res.end();
  } catch (error: any) {
    send({ type: 'error', message: `Agent error: ${error.message}` });
    res.end();
  }
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Auth endpoints
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required.' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  const result = await authManager.register(name, email, password);
  if ('error' in result) return res.status(400).json(result);
  res.json(result);
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
  const result = await authManager.login(email, password);
  if ('error' in result) return res.status(401).json(result);
  res.json(result);
});

app.get('/api/auth/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token.' });
  const user = authManager.verifyToken(auth.slice(7));
  if (!user) return res.status(401).json({ error: 'Invalid or expired token.' });
  res.json({ user });
});

// Database endpoints
app.get('/api/db/status', (req, res) => {
  res.json(dbManager.getStatus());
});

app.post('/api/db/test', async (req, res) => {
  const config = req.body as DbConfig;
  const success = await dbManager.testConnection(config);
  if (success) {
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Connection test failed. Check settings and server.' });
  }
});

app.post('/api/db/connect', async (req, res) => {
  const config = req.body as DbConfig;
  const success = await dbManager.connect(config);
  if (success) {
    res.json({ success: true, status: dbManager.getStatus() });
  } else {
    res.status(500).json({ error: 'Failed to establish persistent DB connection.' });
  }
});

// Try to load a default SQLite DB on startup just as a placeholder fallback if requested
// (In production, the frontend can query /api/db/status to see if it's connected, and if not, show the wizard)

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
