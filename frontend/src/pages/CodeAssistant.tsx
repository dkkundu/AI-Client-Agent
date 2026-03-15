import React, { useState } from 'react';
import { Send, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './CodeAssistant.css';
import { useSettingsStore } from '../store/settingsStore';

// Lazy load Editor
const EditorPane = React.lazy(() => import('../components/EditorPane').catch(() => ({ default: () => <div className="editor-placeholder">Editor Loading...</div> })));

export default function CodeAssistant() {
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: "Hello! I'm your local coding assistant. How can I help you build today?" }
  ]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { ollamaUrl, defaultModel } = useSettingsStore();

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;
    
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsGenerating(true);

    try {
      // Mock API call for now till connection is solid
      // We will integrate streams later
      setMessages(prev => [...prev, { role: 'assistant', content: "..." }]);
      
      const res = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: defaultModel,
          baseUrl: ollamaUrl,
          messages: [{ role: 'user', content: userMsg }],
          stream: false
        })
      });

      if (!res.ok) throw new Error('Network error or Ollama not running');
      const data = await res.json();
      
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1].content = data.message?.content || "No response content";
        return newMsgs;
      });
    } catch (e: any) {
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1].content = `**Error:** ${e.message}\nCheck your connection to ${ollamaUrl} traversing model '${defaultModel}'. Go to Settings to configure.`;
        return newMsgs;
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="code-assistant-layout">
      {/* Left Pane: Chat */}
      <div className="chat-pane glass-panel">
        <div className="pane-header">
          <Terminal size={18} className="text-accent" />
          <h3>Assistant</h3>
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
                {m.role === 'assistant' ? (
                  <Markdown remarkPlugins={[remarkGfm]}>{m.content}</Markdown>
                ) : (
                  <p>{m.content}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="chat-input-area border-t border-color">
          <textarea 
            className="input-base chat-textarea"
            placeholder="Ask anything or ask to modify a file..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
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

      {/* Right Pane: Editor */}
      <div className="workspace-pane">
        <div className="editor-container glass-panel">
          <React.Suspense fallback={<div className="loading flex-center h-full">Loading Editor...</div>}>
            <EditorPane />
          </React.Suspense>
        </div>
      </div>
    </div>
  );
}
