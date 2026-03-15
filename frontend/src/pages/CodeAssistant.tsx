import React, { useState, useRef, useEffect } from 'react';
import { Send, Terminal, FileCode, CheckCircle, XCircle, FolderPlus, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './CodeAssistant.css';
import { useSettingsStore } from '../store/settingsStore';
import { useUIStore } from '../store/uiStore';
import AgentProgress from '../components/AgentProgress';
import type { AgentTask } from '../components/AgentProgress';

const EditorPane = React.lazy(() => import('../components/EditorPane').catch(() => ({ default: () => <div className="editor-placeholder">Editor Loading...</div> })));

interface FileAction {
  type: 'create_dir' | 'write_file' | 'read_file';
  path: string;
  status: 'ok' | 'error';
  error?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  actions?: FileAction[];
}

const ACTION_ICON: Record<string, React.ReactNode> = {
  create_dir: <FolderPlus size={11} />,
  write_file: <FileCode size={11} />,
  read_file:  <Eye size={11} />,
};

export default function CodeAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I'm your local coding assistant. I can **create files, folders, and write code** directly in your workspace.\n\nTry: *\"Create a Python Flask app with home and about routes\"*" }
  ]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [agentTasks, setAgentTasks] = useState<AgentTask[]>([]);
  const [agentPhase, setAgentPhase] = useState<'thinking' | 'executing'>('thinking');
  const [thinkingLabel, setThinkingLabel] = useState('Thinking…');
  const [agentTotal, setAgentTotal] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { ollamaUrl, defaultModel } = useSettingsStore();
  const { workspacePath, triggerFileRefresh } = useUIStore();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    const userMsg = input.trim();
    const history = messages.map(m => ({ role: m.role, content: m.content }));
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsGenerating(true);
    setAgentTasks([]);
    setAgentTotal(0);
    setAgentPhase('thinking');
    setThinkingLabel('Connecting to LLM…');

    try {
      const res = await fetch('http://localhost:3001/api/agent/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: defaultModel,
          baseUrl: ollamaUrl,
          workspacePath,
          messages: [...history, { role: 'user', content: userMsg }],
        }),
      });

      if (!res.ok || !res.body) throw new Error('Stream failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let finalActions: FileAction[] = [];
      let finalMessage = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        const lines = buf.split('\n');
        buf = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          let evt: any;
          try { evt = JSON.parse(line.slice(6)); } catch { continue; }

          if (evt.type === 'thinking') {
            setThinkingLabel(evt.label);
          } else if (evt.type === 'plan') {
            setAgentPhase('executing');
            setAgentTotal(evt.total);
          } else if (evt.type === 'action_start') {
            setAgentTasks(prev => [...prev, {
              id: evt.id,
              actionType: evt.actionType,
              path: evt.path,
              status: 'running',
            }]);
          } else if (evt.type === 'action_done') {
            setAgentTasks(prev => prev.map(t =>
              t.id === evt.id ? { ...t, status: evt.status, error: evt.error } : t
            ));
          } else if (evt.type === 'message') {
            finalMessage = evt.content;
          } else if (evt.type === 'done') {
            finalActions = evt.actions || [];
            if (finalActions.some((a: FileAction) => a.status === 'ok')) triggerFileRefresh();
          } else if (evt.type === 'error') {
            finalMessage = `**Error:** ${evt.message}`;
          }
        }
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: finalMessage || '(no response)',
        actions: finalActions.length ? finalActions : undefined,
      }]);
    } catch (e: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `**Error:** ${e.message}\n\nCheck Ollama at \`${ollamaUrl}\` with model \`${defaultModel}\`.`,
      }]);
    } finally {
      setIsGenerating(false);
      setAgentTasks([]);
    }
  };

  return (
    <div className="code-assistant-layout">
      <div className="chat-pane glass-panel">
        <div className="pane-header">
          <Terminal size={18} className="text-accent" />
          <h3>Assistant</h3>
          {workspacePath && (
            <span className="workspace-badge" title={workspacePath}>
              <FileCode size={11} /> {workspacePath.split('/').pop() || workspacePath}
            </span>
          )}
        </div>

        <div className="chat-history">
          {messages.map((m, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`chat-message ${m.role}`}
            >
              <div className="message-bubble">
                {m.role === 'assistant'
                  ? <Markdown remarkPlugins={[remarkGfm]}>{m.content}</Markdown>
                  : <p>{m.content}</p>}

                {m.actions && m.actions.length > 0 && (
                  <div className="action-list">
                    {m.actions.map((a, i) => (
                      <div key={i} className={`action-chip ${a.status}`}>
                        {a.status === 'ok' ? <CheckCircle size={11} /> : <XCircle size={11} />}
                        {ACTION_ICON[a.type]}
                        <span>{a.path}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          <AnimatePresence>
            {isGenerating && (
              <motion.div
                className="chat-message assistant"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <AgentProgress
                  tasks={agentTasks}
                  phase={agentPhase}
                  thinkingLabel={thinkingLabel}
                  total={agentTotal}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={chatEndRef} />
        </div>

        <div className="chat-input-area border-t border-color">
          <textarea
            className="input-base chat-textarea"
            placeholder="Ask me to create files, write code, or edit your project…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
            }}
          />
          <button
            className="btn btn-primary send-btn"
            onClick={handleSend}
            disabled={isGenerating || !input.trim()}
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      <div className="workspace-pane">
        <div className="editor-container glass-panel">
          <React.Suspense fallback={<div className="loading flex-center h-full">Loading Editor…</div>}>
            <EditorPane />
          </React.Suspense>
        </div>
      </div>
    </div>
  );
}
