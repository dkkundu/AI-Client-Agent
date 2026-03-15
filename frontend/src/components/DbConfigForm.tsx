import { useState } from 'react';
import { HardDrive, Server, Database, Layers, CheckCircle2, XCircle, RefreshCw, LogIn, FileText, Globe, User, Lock } from 'lucide-react';
import { useDbStore, type DbConfig, type DbType } from '../store/dbStore';
import './DbConfigForm.css';

interface DbConfigFormProps {
  onSuccess?: () => void;
  title?: string;
  description?: string;
}

const DB_TYPES: { type: DbType; label: string; icon: React.ReactNode; color: string; description: string }[] = [
  {
    type: 'sqlite',
    label: 'SQLite',
    icon: <HardDrive size={20} />,
    color: '#6366f1',
    description: 'Local file',
  },
  {
    type: 'mysql',
    label: 'MySQL',
    icon: <Server size={20} />,
    color: '#f97316',
    description: 'Remote server',
  },
  {
    type: 'postgres',
    label: 'PostgreSQL',
    icon: <Database size={20} />,
    color: '#3b82f6',
    description: 'Remote server',
  },
  {
    type: 'mongodb',
    label: 'MongoDB',
    icon: <Layers size={20} />,
    color: '#22c55e',
    description: 'Document store',
  },
];

export default function DbConfigForm({ onSuccess, title = "Database Connection", description = "Configure your knowledge base storage." }: DbConfigFormProps) {
  const { config, testConnection, connect } = useDbStore();

  const [localConfig, setLocalConfig] = useState<DbConfig>(config);
  const [testing, setTesting] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  const handleUpdate = (updates: Partial<DbConfig>) => {
    setLocalConfig(prev => ({ ...prev, ...updates }));
    setTestResult(null);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const success = await testConnection(localConfig);
    setTestResult(success ? 'success' : 'error');
    setTesting(false);
  };

  const handleConnect = async () => {
    setConnecting(true);
    const success = await connect(localConfig);
    setConnecting(false);
    if (success && onSuccess) {
      onSuccess();
    } else if (!success) {
      setTestResult('error');
    }
  };

  const selectedDb = DB_TYPES.find(d => d.type === localConfig.type)!;
  const defaultPort = localConfig.type === 'mysql' ? '3306' : localConfig.type === 'postgres' ? '5432' : '27017';

  return (
    <div className="db-config-form">
      <div className="db-form-header">
        <div className="db-form-icon" style={{ '--db-color': selectedDb.color } as React.CSSProperties}>
          <Database size={28} />
        </div>
        <div>
          <h3 className="db-form-title">{title}</h3>
          <p className="db-form-desc">{description}</p>
        </div>
      </div>

      {/* DB Type Cards */}
      <div className="db-type-grid">
        {DB_TYPES.map(db => (
          <button
            key={db.type}
            className={`db-type-card ${localConfig.type === db.type ? 'active' : ''}`}
            style={{ '--db-color': db.color } as React.CSSProperties}
            onClick={() => handleUpdate({ type: db.type })}
            type="button"
          >
            <span className="db-type-icon">{db.icon}</span>
            <span className="db-type-label">{db.label}</span>
            <span className="db-type-desc">{db.description}</span>
          </button>
        ))}
      </div>

      {/* Remote DB fields */}
      {localConfig.type !== 'sqlite' && (
        <div className="db-fields-grid">
          <div className="db-field">
            <label>Host</label>
            <div className="input-with-icon">
              <Globe size={14} className="field-icon" />
              <input
                type="text"
                className="input-base"
                value={localConfig.host || ''}
                onChange={e => handleUpdate({ host: e.target.value })}
                placeholder="localhost"
              />
            </div>
          </div>
          <div className="db-field">
            <label>Port</label>
            <input
              type="number"
              className="input-base"
              value={localConfig.port || ''}
              onChange={e => handleUpdate({ port: Number(e.target.value) })}
              placeholder={defaultPort}
            />
          </div>
          <div className="db-field">
            <label>Username</label>
            <div className="input-with-icon">
              <User size={14} className="field-icon" />
              <input
                type="text"
                className="input-base"
                value={localConfig.user || ''}
                onChange={e => handleUpdate({ user: e.target.value })}
                placeholder="root"
              />
            </div>
          </div>
          <div className="db-field">
            <label>Password</label>
            <div className="input-with-icon">
              <Lock size={14} className="field-icon" />
              <input
                type="password"
                className="input-base"
                value={localConfig.password || ''}
                onChange={e => handleUpdate({ password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
          </div>
        </div>
      )}

      {/* DB Name */}
      <div className="db-name-field">
        <label>{localConfig.type === 'sqlite' ? 'Database File Name' : 'Database Name'}</label>
        <div className="input-with-icon">
          <FileText size={14} className="field-icon" />
          <input
            type="text"
            className="input-base"
            value={localConfig.database || ''}
            onChange={e => handleUpdate({ database: e.target.value })}
            placeholder={localConfig.type === 'sqlite' ? 'llm_client.sqlite' : 'llm_db'}
          />
          <span className="db-name-badge" style={{ '--db-color': selectedDb.color } as React.CSSProperties}>
            <span className="db-name-badge-icon">{selectedDb.icon}</span>
            {selectedDb.label}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="db-actions">
        <button
          className="btn btn-secondary flex-center gap-2"
          onClick={handleTest}
          disabled={testing || connecting}
        >
          <RefreshCw size={15} className={testing ? 'spin' : ''} />
          {testing ? 'Testing…' : 'Test Connection'}
        </button>
        <button
          className="btn btn-primary db-connect-btn flex-center gap-2"
          style={{ '--db-color': selectedDb.color } as React.CSSProperties}
          onClick={handleConnect}
          disabled={testing || connecting}
        >
          <LogIn size={15} />
          {connecting ? 'Connecting…' : 'Connect & Save'}
        </button>
      </div>

      {testResult === 'success' && (
        <div className="db-feedback success">
          <CheckCircle2 size={15} />
          Connection test successful!
        </div>
      )}
      {testResult === 'error' && (
        <div className="db-feedback error">
          <XCircle size={15} />
          Connection failed. Check credentials and server status.
        </div>
      )}
    </div>
  );
}
