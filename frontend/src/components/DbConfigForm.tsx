import { useState } from 'react';
import { Database, CheckCircle2, XCircle, RefreshCw, LogIn } from 'lucide-react';
import { useDbStore, type DbConfig, type DbType } from '../store/dbStore';
import './DbConfigForm.css';

interface DbConfigFormProps {
  onSuccess?: () => void;
  title?: string;
  description?: string;
}

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

  return (
    <div className="db-config-form">
      <div className="form-header">
        <div className="icon-wrapper bg-black/30 p-2 rounded-lg text-indigo">
          <Database size={24} />
        </div>
        <div>
          <h3 className="section-title">{title}</h3>
          <p className="helper-text">{description}</p>
        </div>
      </div>

      <div className="form-grid mt-4">
        <div className="form-group col-span-2">
          <label>Database Type</label>
          <select 
            className="input-base"
            value={localConfig.type}
            onChange={e => handleUpdate({ type: e.target.value as DbType })}
          >
            <option value="sqlite">SQLite (Local File - Default)</option>
            <option value="mysql">MySQL</option>
            <option value="postgres">PostgreSQL</option>
            <option value="mongodb">MongoDB</option>
          </select>
        </div>

        {localConfig.type !== 'sqlite' && (
          <>
            <div className="form-group">
              <label>Host</label>
              <input 
                type="text" 
                className="input-base"
                value={localConfig.host || ''}
                onChange={e => handleUpdate({ host: e.target.value })}
                placeholder="localhost"
              />
            </div>
            <div className="form-group">
              <label>Port</label>
              <input 
                type="number" 
                className="input-base"
                value={localConfig.port || ''}
                onChange={e => handleUpdate({ port: Number(e.target.value) })}
                placeholder={localConfig.type === 'mysql' ? '3306' : localConfig.type === 'postgres' ? '5432' : '27017'}
              />
            </div>
            <div className="form-group">
              <label>Username</label>
              <input 
                type="text" 
                className="input-base"
                value={localConfig.user || ''}
                onChange={e => handleUpdate({ user: e.target.value })}
                placeholder="root"
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                className="input-base"
                value={localConfig.password || ''}
                onChange={e => handleUpdate({ password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
          </>
        )}

        <div className="form-group col-span-2">
          <label>{localConfig.type === 'sqlite' ? 'Database File Name' : 'Database Name'}</label>
          <input 
            type="text" 
            className="input-base"
            value={localConfig.database || ''}
            onChange={e => handleUpdate({ database: e.target.value })}
            placeholder={localConfig.type === 'sqlite' ? 'llm_client.sqlite' : 'llm_db'}
          />
        </div>
      </div>

      <div className="form-actions mt-6 flex gap-3">
        <button 
          className="btn btn-secondary flex-1 flex-center gap-2"
          onClick={handleTest}
          disabled={testing || connecting}
        >
          <RefreshCw size={16} className={testing ? 'spin' : ''} />
          {testing ? 'Testing...' : 'Test Connection'}
        </button>
        <button 
          className="btn btn-primary flex-1 flex-center gap-2"
          onClick={handleConnect}
          disabled={testing || connecting}
        >
          <LogIn size={16} />
          {connecting ? 'Connecting...' : 'Connect & Save'}
        </button>
      </div>

      {testResult === 'success' && (
        <p className="helper-text text-accent flex items-center gap-1 mt-4 justify-center">
          <CheckCircle2 size={14} /> Connection test successful!
        </p>
      )}
      {testResult === 'error' && (
        <p className="helper-text text-pink flex items-center gap-1 mt-4 justify-center">
          <XCircle size={14} /> Connection failed. Check credentials and server status.
        </p>
      )}
    </div>
  );
}
