import { useEffect, useState } from 'react';
import { useUIStore } from '../store/uiStore';
import { FileCode, FileImage, FileText, File as FileIcon, Folder, ChevronRight, RefreshCw } from 'lucide-react';
import './FileExplorer.css';

interface FileNode {
  name: string;
  isDirectory: boolean;
  path: string;
}

export default function FileExplorer() {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [loading, setLoading] = useState(false);
  const { setSelectedFile, selectedFile } = useUIStore();

  const loadFiles = async (path: string = '') => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/files/list?path=${encodeURIComponent(path)}`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data);
        if (path) setCurrentPath(path);
      }
    } catch (e) {
      console.error('Failed to load files', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles(); // Load root directory initially
  }, []);

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (['ts', 'tsx', 'js', 'jsx', 'json', 'css', 'html'].includes(ext || '')) return <FileCode size={16} className="text-accent" />;
    if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext || '')) return <FileImage size={16} className="text-pink" />;
    if (['md', 'txt'].includes(ext || '')) return <FileText size={16} className="text-muted" />;
    return <FileIcon size={16} className="text-muted" />;
  };

  return (
    <div className="file-explorer">
      <div className="explorer-header flex-between">
        <h3>Workspace Files</h3>
        <button className="btn btn-ghost btn-sm" onClick={() => loadFiles(currentPath)}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
        </button>
      </div>

      <div className="current-path text-muted" title={currentPath}>
        {currentPath || '/ (Root)'}
      </div>

      <div className="file-list">
        {files.map((f, i) => (
          <div 
            key={i} 
            className={`file-item ${selectedFile === f.path ? 'selected' : ''}`}
            onClick={() => {
              if (f.isDirectory) {
                loadFiles(f.path);
              } else {
                setSelectedFile(f.path);
              }
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
        {files.length === 0 && !loading && <div className="p-4 text-center text-muted text-sm">Empty directory</div>}
      </div>
    </div>
  );
}
