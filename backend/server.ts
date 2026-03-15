import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { dbManager, DbConfig } from './db';

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

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

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
