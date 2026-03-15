import { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { useUIStore } from '../store/uiStore';
import { Save, AlertCircle } from 'lucide-react';
import './EditorPane.css';

export default function EditorPane() {
  const { selectedFile } = useUIStore();
  const [content, setContent] = useState<string>('// Select a file from the explorer to view and edit its contents');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirty = content !== originalContent;

  useEffect(() => {
    if (!selectedFile) {
      setContent('// Select a file from the explorer to view and edit its contents');
      setOriginalContent('');
      return;
    }

    const loadFile = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`http://localhost:3001/api/files/read?path=${encodeURIComponent(selectedFile)}`);
        if (!res.ok) throw new Error('Failed to read file');
        const text = await res.text();
        setContent(text);
        setOriginalContent(text);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadFile();
  }, [selectedFile]);

  const handleSave = async () => {
    if (!selectedFile || !isDirty) return;
    
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:3001/api/files/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: selectedFile, content })
      });
      if (!res.ok) throw new Error('Failed to write file');
      setOriginalContent(content);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const getLanguage = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const map: Record<string, string> = {
      'ts': 'typescript', 'tsx': 'typescript',
      'js': 'javascript', 'jsx': 'javascript',
      'json': 'json', 'css': 'css', 'html': 'html',
      'md': 'markdown'
    };
    return map[ext || ''] || 'plaintext';
  };

  return (
    <div className="editor-pane">
      <div className="editor-header flex-between">
        <div className="file-info">
          <span className="file-name">{selectedFile ? selectedFile.split('/').pop() : 'No file selected'}</span>
          {isDirty && <span className="dirty-indicator" title="Unsaved changes"></span>}
        </div>
        
        <div className="editor-actions">
          {error && <span className="error-text flex-center"><AlertCircle size={14}/> {error}</span>}
          <button 
            className="btn btn-primary btn-sm" 
            onClick={handleSave} 
            disabled={!isDirty || saving || !selectedFile}
          >
            <Save size={14} />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="editor-body">
        {loading ? (
          <div className="loading-state flex-center">Loading file contents...</div>
        ) : (
          <Editor
            height="100%"
            language={selectedFile ? getLanguage(selectedFile) : 'plaintext'}
            theme="vs-dark"
            value={content}
            onChange={(val) => setContent(val || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: 'Fira Code, monospace',
              padding: { top: 16 },
              scrollBeyondLastLine: false,
              wordWrap: 'on'
            }}
          />
        )}
      </div>
    </div>
  );
}
