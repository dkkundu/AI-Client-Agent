import { useState } from 'react';
import { Search, Plus, Database, FileText, Link as LinkIcon, ExternalLink } from 'lucide-react';
import './KnowledgeBase.css';

interface KnowledgeSource {
  id: string;
  name: string;
  type: 'local' | 'web' | 'document';
  status: 'indexed' | 'indexing' | 'error';
  lastUpdated: string;
}

export default function KnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState('');

  const sources: KnowledgeSource[] = [
    { id: '1', name: 'Frontend Architecture Docs', type: 'document', status: 'indexed', lastUpdated: '2 hours ago' },
    { id: '2', name: 'Company Engineering Wiki', type: 'web', status: 'indexed', lastUpdated: '1 day ago' },
    { id: '3', name: 'Local Project Notes', type: 'local', status: 'indexing', lastUpdated: 'Just now' },
  ];

  return (
    <div className="knowledge-layout">
      {/* Header and Search */}
      <div className="knowledge-header glass-panel">
        <div className="header-top flex-between">
          <div className="flex-center gap-2">
            <Database className="text-accent" size={24} />
            <h2>Knowledge Base</h2>
          </div>
          <button className="btn btn-primary">
            <Plus size={16} /> Add Source
          </button>
        </div>
        
        <div className="search-bar-container">
          <Search size={18} className="search-icon text-muted" />
          <input 
            type="text" 
            className="input-base search-input" 
            placeholder="Search across all your normalized knowledge, ask questions, or synthesize ideas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="knowledge-content">
        {/* Left Col: Sources Manager */}
        <div className="sources-pane glass-panel">
          <div className="pane-header">
            <h3>Connected Sources</h3>
          </div>
          <div className="sources-list">
            {sources.map(source => (
              <div key={source.id} className="source-card">
                <div className="source-icon">
                  {source.type === 'document' && <FileText size={18} className="text-pink" />}
                  {source.type === 'web' && <LinkIcon size={18} className="text-indigo" />}
                  {source.type === 'local' && <Database size={18} className="text-muted" />}
                </div>
                <div className="source-info">
                  <h4>{source.name}</h4>
                  <div className="source-meta">
                    <span className={`status ${source.status}`}>{source.status}</span>
                    <span>• {source.lastUpdated}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Structured Outputs / Search Results */}
        <div className="summaries-pane glass-panel">
          <div className="pane-header flex-between">
            <h3>{searchQuery ? 'Search Results & Synthesis' : 'Recent Insights & Summaries'}</h3>
            <button className="btn btn-ghost btn-sm text-accent"><ExternalLink size={14} /> Open Graph View</button>
          </div>
          
          <div className="summaries-content">
            {/* Mock generated content block */}
            <div className="insight-card">
              <h4>System Architecture Overview</h4>
              <p className="text-sm text-secondary mt-2">
                Based on your recently indexed <strong>Frontend Architecture Docs</strong>, the system primarily utilizes a component-based pattern with centralized state management. Key considerations include module lazy loading for performance.
              </p>
              <div className="tags mt-4">
                <span className="tag">React</span>
                <span className="tag">Performance</span>
                <span className="tag">Architecture</span>
              </div>
            </div>

            <div className="insight-card">
              <h4>Best Practices for LLM Integration</h4>
              <p className="text-sm text-secondary mt-2">
                Summarized from the <strong>Company Engineering Wiki</strong>. It is highly recommended to use local proxy servers to hit Ollama APIs to avoid CORS issues and manage credentials securely, as implemented in your current setup.
              </p>
              <div className="tags mt-4">
                <span className="tag">Web</span>
                <span className="tag">LLM</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
