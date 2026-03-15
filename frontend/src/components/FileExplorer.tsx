import { useEffect, useState, useRef } from 'react';
import { useUIStore } from '../store/uiStore';
import { FileCode, FileImage, FileText, File as FileIcon, Folder, ChevronRight, RefreshCw, FolderOpen, ChevronUp, Check, X, FilePlus, FolderPlus } from 'lucide-react';
import './FileExplorer.css';

interface FileNode {
  name: string;
  isDirectory: boolean;
  path: string;
}

function FolderPicker({ current, onSelect, onClose }: {
  current: string;
  onSelect: (path: string) => void;
  onClose: () => void;
}) {
  const [pickerPath, setPickerPath] = useState(current || '/');
  const [dirs, setDirs] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(false);

  const loadDirs = async (path: string) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/files/list?path=${encodeURIComponent(path)}`);
      if (res.ok) {
        const data: FileNode[] = await res.json();
        setDirs(data.filter(f => f.isDirectory));
        setPickerPath(path);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDirs(pickerPath); }, []);

  const goUp = () => {
    const parent = pickerPath.split('/').slice(0, -1).join('/') || '/';
    loadDirs(parent);
  };

  return (
    <div className="folder-picker-overlay" onClick={onClose}>
      <div className="folder-picker" onClick={e => e.stopPropagation()}>
        <div className="fp-header">
          <FolderOpen size={15} />
          <span className="fp-title">Select Folder</span>
          <button className="btn btn-ghost btn-sm fp-close" onClick={onClose}><X size={14} /></button>
        </div>

        <div className="fp-path">
          <button className="fp-up-btn" onClick={goUp} title="Go up" disabled={pickerPath === '/'}>
            <ChevronUp size={13} />
          </button>
          <span className="fp-path-text" title={pickerPath}>{pickerPath}</span>
        </div>

        <div className="fp-list">
          {loading && <div className="fp-empty">Loading…</div>}
          {!loading && dirs.length === 0 && <div className="fp-empty">No sub-folders</div>}
          {dirs.map((d, i) => (
            <div key={i} className="fp-item" onClick={() => loadDirs(d.path)}>
              <Folder size={14} className="text-indigo" />
              <span>{d.name}</span>
              <ChevronRight size={12} className="fp-arrow" />
            </div>
          ))}
        </div>

        <div className="fp-footer">
          <button className="btn btn-primary fp-select-btn" onClick={() => { onSelect(pickerPath); onClose(); }}>
            <Check size={13} /> Use this folder
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FileExplorer() {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [creating, setCreating] = useState<'file' | 'folder' | null>(null);
  const [newName, setNewName] = useState('');
  const newNameRef = useRef<HTMLInputElement>(null);
  const { setSelectedFile, selectedFile, workspacePath, setWorkspacePath, fileRefreshKey } = useUIStore();

  const loadFiles = async (path: string = '') => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/files/list?path=${encodeURIComponent(path)}`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data);
        setCurrentPath(path);
        setWorkspacePath(path);
      }
    } catch (e) {
      console.error('Failed to load files', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFiles(workspacePath || ''); }, [fileRefreshKey]);

  const startCreating = (type: 'file' | 'folder') => {
    setCreating(type);
    setNewName('');
    setTimeout(() => newNameRef.current?.focus(), 0);
  };

  const cancelCreating = () => { setCreating(null); setNewName(''); };

  const commitCreate = async () => {
    if (!newName.trim() || !creating) return;
    const endpoint = creating === 'file' ? '/api/files/create-file' : '/api/files/create-dir';
    try {
      await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dir: currentPath, name: newName.trim() }),
      });
      cancelCreating();
      loadFiles(currentPath);
    } catch (e) {
      console.error(e);
    }
  };

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (['ts', 'tsx', 'js', 'jsx', 'json', 'css', 'html'].includes(ext || '')) return <FileCode size={16} className="text-accent" />;
    if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext || '')) return <FileImage size={16} className="text-pink" />;
    if (['md', 'txt'].includes(ext || '')) return <FileText size={16} className="text-muted" />;
    return <FileIcon size={16} className="text-muted" />;
  };

  return (
    <div className="file-explorer">
      {showPicker && (
        <FolderPicker
          current={currentPath}
          onSelect={path => loadFiles(path)}
          onClose={() => setShowPicker(false)}
        />
      )}

      <div className="explorer-header flex-between">
        <h3>Workspace Files</h3>
        <div className="explorer-actions">
          <button className="btn btn-ghost btn-sm" title="New File" onClick={() => startCreating('file')}>
            <FilePlus size={14} />
          </button>
          <button className="btn btn-ghost btn-sm" title="New Folder" onClick={() => startCreating('folder')}>
            <FolderPlus size={14} />
          </button>
          <button className="btn btn-ghost btn-sm" title="Refresh" onClick={() => loadFiles(currentPath)}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      <div className="explorer-path-row">
        <button
          className="explorer-back-btn"
          title="Go up"
          disabled={!currentPath || currentPath === '/'}
          onClick={() => {
            const parent = currentPath.split('/').slice(0, -1).join('/') || '/';
            loadFiles(parent);
          }}
        >
          <ChevronUp size={13} />
        </button>
        <button className="explorer-path-btn" onClick={() => setShowPicker(true)} title="Change folder">
          <FolderOpen size={13} className="text-indigo" />
          <span className="explorer-path-text">{currentPath || '/ (Root)'}</span>
          <ChevronRight size={11} className="explorer-path-arrow" />
        </button>
      </div>

      <div className="file-list">
        {files.map((f, i) => (
          <div
            key={i}
            className={`file-item ${selectedFile === f.path ? 'selected' : ''}`}
            onClick={() => {
              if (f.isDirectory) loadFiles(f.path);
              else setSelectedFile(f.path);
            }}
          >
            {f.isDirectory ? (
              <>
                <ChevronRight size={14} className="text-muted" />
                <Folder size={16} className="text-indigo" />
                <span className="file-name">{f.name}</span>
              </>
            ) : (
              <>
                <span className="indent-spacer" />
                {getFileIcon(f.name)}
                <span className="file-name">{f.name}</span>
              </>
            )}
          </div>
        ))}
        {creating && (
          <div className="file-item creating">
            {creating === 'folder'
              ? <Folder size={16} className="text-indigo" />
              : <FileIcon size={16} className="text-accent" />}
            <input
              ref={newNameRef}
              className="new-name-input"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder={creating === 'folder' ? 'folder name' : 'file name'}
              onKeyDown={e => { if (e.key === 'Enter') commitCreate(); if (e.key === 'Escape') cancelCreating(); }}
              onBlur={cancelCreating}
            />
          </div>
        )}
        {files.length === 0 && !loading && !creating && <div className="p-4 text-center text-muted text-sm">Empty directory</div>}
      </div>
    </div>
  );
}
